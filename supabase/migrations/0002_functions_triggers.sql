-- ════════════════════════════════════════════════════════════════
-- STEELCRAFT — FUNCTIONS & TRIGGERS
-- Run after 0001_schema.sql
-- ════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- is_admin() — used by RLS policies. SECURITY DEFINER avoids
-- recursive-RLS issues when checking the caller's own role.
-- ────────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_account_type()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select account_type from public.profiles where id = auth.uid()),
    'retail'
  );
$$;

-- ────────────────────────────────────────────────────────────────
-- Auto-create a profile row whenever someone signs up via Supabase Auth
-- ────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────────────────────
-- Generic updated_at maintainer
-- ────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at      before update on public.profiles      for each row execute function public.set_updated_at();
create trigger products_updated_at      before update on public.products      for each row execute function public.set_updated_at();
create trigger cart_items_updated_at    before update on public.cart_items    for each row execute function public.set_updated_at();
create trigger orders_updated_at        before update on public.orders        for each row execute function public.set_updated_at();
create trigger ai_designs_updated_at    before update on public.ai_designs    for each row execute function public.set_updated_at();
create trigger custom_orders_updated_at before update on public.custom_orders for each row execute function public.set_updated_at();
create trigger work_items_updated_at    before update on public.work_items    for each row execute function public.set_updated_at();
create trigger rfqs_updated_at          before update on public.rfqs          for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────
-- Keep products.rating / review_count in sync with reviews
-- ────────────────────────────────────────────────────────────────
create or replace function public.recompute_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid bigint := coalesce(new.product_id, old.product_id);
begin
  update public.products p
  set rating = coalesce((
        select round(avg(r.rating)::numeric, 1)
        from public.reviews r
        where r.product_id = pid and r.is_approved
      ), 0),
      review_count = (
        select count(*) from public.reviews r
        where r.product_id = pid and r.is_approved
      )
  where p.id = pid;
  return null;
end;
$$;

create trigger reviews_recompute_rating
  after insert or update or delete on public.reviews
  for each row execute function public.recompute_product_rating();

-- ────────────────────────────────────────────────────────────────
-- Order numbers:  SC-00001, SC-00002, ...
-- ────────────────────────────────────────────────────────────────
create sequence if not exists public.order_number_seq start 1;

create or replace function public.next_order_number()
returns text
language sql
as $$
  select 'SC-' || lpad(nextval('public.order_number_seq')::text, 5, '0');
$$;

-- ────────────────────────────────────────────────────────────────
-- create_order(...)  — atomic checkout.
-- Re-prices everything server-side from the live products table so
-- the client can never tamper with totals. Decrements stock and
-- clears the matching cart_items rows for the caller.
--
-- p_items: jsonb array like [{"product_id": 1, "quantity": 2}, ...]
-- p_address: jsonb like {"full_name","phone","address_line1","address_line2","city","state","postal_code","address_id"}
-- ────────────────────────────────────────────────────────────────
create or replace function public.create_order(
  p_items           jsonb,
  p_address         jsonb,
  p_shipping_method text default 'standard',
  p_payment_method  text default 'cod',
  p_coupon_code     text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid           uuid := auth.uid();
  v_item          jsonb;
  v_product       public.products;
  v_qty           integer;
  v_is_wholesale  boolean;
  v_unit_price    numeric(12,2);
  v_subtotal      numeric(12,2) := 0;
  v_gst_rate      numeric;
  v_free_ship_threshold numeric;
  v_shipping_fee  numeric(12,2);
  v_discount      numeric(12,2) := 0;
  v_coupon        public.coupons;
  v_order         public.orders;
  v_order_id      uuid := gen_random_uuid();
begin
  if v_uid is null then
    raise exception 'Must be signed in to place an order';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  select (account_type = 'wholesale') into v_is_wholesale
  from public.profiles where id = v_uid;

  select coalesce((value->>'rate')::numeric, 0.18)
    into v_gst_rate from public.app_settings where key = 'gst_rate';
  if v_gst_rate is null then v_gst_rate := 0.18; end if;

  select coalesce((value->>'amount')::numeric, 10000)
    into v_free_ship_threshold from public.app_settings where key = 'free_shipping_threshold';
  if v_free_ship_threshold is null then v_free_ship_threshold := 10000; end if;

  -- create the (empty-totals) order row first so we have an id for order_items
  insert into public.orders (
    id, order_number, user_id, order_type, status, payment_status, payment_method,
    shipping_method, address_id, shipping_name, shipping_phone,
    shipping_address1, shipping_address2, shipping_city, shipping_state, shipping_pincode,
    coupon_code
  ) values (
    v_order_id, public.next_order_number(), v_uid, 'standard', 'Processing', 'pending', p_payment_method,
    p_shipping_method,
    (p_address->>'address_id')::uuid,
    p_address->>'full_name', p_address->>'phone',
    p_address->>'address_line1', p_address->>'address_line2',
    p_address->>'city', p_address->>'state', p_address->>'postal_code',
    p_coupon_code
  );

  -- walk items: lock each product row, validate stock, snapshot price, decrement stock
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Invalid quantity for product %', v_item->>'product_id';
    end if;

    select * into v_product from public.products
      where id = (v_item->>'product_id')::bigint and active
      for update;

    if v_product.id is null then
      raise exception 'Product % is not available', v_item->>'product_id';
    end if;
    if v_product.stock_quantity < v_qty then
      raise exception 'Not enough stock for "%": only % left', v_product.name, v_product.stock_quantity;
    end if;

    v_unit_price := case when v_is_wholesale and v_product.wholesale_price is not null
                         then v_product.wholesale_price else v_product.price end;

    insert into public.order_items (order_id, product_id, product_name, quantity, unit_price, line_total)
    values (v_order_id, v_product.id, v_product.name, v_qty, v_unit_price, v_unit_price * v_qty);

    update public.products set stock_quantity = stock_quantity - v_qty where id = v_product.id;

    v_subtotal := v_subtotal + (v_unit_price * v_qty);
  end loop;

  -- coupon
  if p_coupon_code is not null then
    select * into v_coupon from public.coupons
      where code = upper(p_coupon_code) and active
        and (expires_at is null or expires_at > now());
    if v_coupon.code is not null and v_subtotal >= v_coupon.min_order_value then
      v_discount := case when v_coupon.discount_type = 'percent'
                         then round(v_subtotal * v_coupon.discount_value / 100, 2)
                         else v_coupon.discount_value end;
      v_discount := least(v_discount, v_subtotal);
    end if;
  end if;

  v_shipping_fee := case p_shipping_method
    when 'express'  then 299
    when 'sameday'  then 599
    else (case when v_subtotal >= v_free_ship_threshold then 0 else 599 end)
  end;

  update public.orders set
    subtotal     = v_subtotal,
    tax          = round(v_subtotal * v_gst_rate, 2),
    shipping_fee = v_shipping_fee,
    discount     = v_discount,
    total        = v_subtotal + round(v_subtotal * v_gst_rate, 2) + v_shipping_fee - v_discount
  where id = v_order_id
  returning * into v_order;

  -- clear the matching cart rows for this user
  delete from public.cart_items
  where user_id = v_uid
    and product_id in (select (item->>'product_id')::bigint from jsonb_array_elements(p_items) item);

  insert into public.notifications (user_id, title, message, type, link)
  values (v_uid, 'Order placed', 'Your order ' || v_order.order_number || ' has been confirmed.', 'success', '/dashboard');

  return v_order;
end;
$$;

grant execute on function public.create_order(jsonb, jsonb, text, text, text) to authenticated;

-- ────────────────────────────────────────────────────────────────
-- AI design → custom order (sent to admin for review)
-- ────────────────────────────────────────────────────────────────
create or replace function public.submit_custom_order(p_design_id uuid)
returns public.custom_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_design public.ai_designs;
  v_row    public.custom_orders;
begin
  if v_uid is null then raise exception 'Must be signed in'; end if;

  select * into v_design from public.ai_designs where id = p_design_id and user_id = v_uid;
  if v_design.id is null then raise exception 'Design not found'; end if;

  insert into public.custom_orders (ai_design_id, user_id, generated_spec, preview_images, estimated_price)
  values (v_design.id, v_uid, v_design.generated_spec, v_design.preview_images,
          round((coalesce(v_design.estimated_min,0) + coalesce(v_design.estimated_max,0)) / 2, 2))
  returning * into v_row;

  update public.ai_designs set status = 'converted_to_order' where id = v_design.id;

  insert into public.notifications (user_id, title, message, type, link)
  values (v_uid, 'Custom design submitted', 'Our team is reviewing your custom furniture design.', 'info', '/dashboard');

  return v_row;
end;
$$;

grant execute on function public.submit_custom_order(uuid) to authenticated;

-- ────────────────────────────────────────────────────────────────
-- When admin approves a custom order, auto-create the standard
-- manufacturing work items (Build Frame → Paint → QC → Pack → Dispatch)
-- ────────────────────────────────────────────────────────────────
create or replace function public.handle_custom_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.admin_status = 'approved' and old.admin_status <> 'approved' then
    insert into public.work_items (custom_order_id, title, sort_order)
    values
      (new.id, 'Build Frame',   1),
      (new.id, 'Paint / Finish',2),
      (new.id, 'Quality Check', 3),
      (new.id, 'Packaging',     4),
      (new.id, 'Dispatch',      5)
    on conflict do nothing;

    insert into public.notifications (user_id, title, message, type, link)
    values (new.user_id, 'Design approved!', 'Your custom furniture design has been approved and is moving to production.', 'success', '/dashboard');
  end if;

  if new.admin_status = 'rejected' and old.admin_status <> 'rejected' then
    insert into public.notifications (user_id, title, message, type, link)
    values (new.user_id, 'Design update', 'Your custom furniture design needs changes. Check admin notes for details.', 'warning', '/dashboard');
  end if;

  return new;
end;
$$;

create trigger custom_orders_status_change
  after update on public.custom_orders
  for each row execute function public.handle_custom_order_status_change();

-- ────────────────────────────────────────────────────────────────
-- Convert an approved custom order into a payable order
-- ────────────────────────────────────────────────────────────────
create or replace function public.convert_custom_order_to_order(p_custom_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_co  public.custom_orders;
  v_order_id uuid := gen_random_uuid();
  v_price numeric(12,2);
  v_order public.orders;
  v_gst_rate numeric;
begin
  if v_uid is null then raise exception 'Must be signed in'; end if;

  select * into v_co from public.custom_orders where id = p_custom_order_id and user_id = v_uid;
  if v_co.id is null then raise exception 'Custom order not found'; end if;
  if v_co.admin_status <> 'approved' then raise exception 'This design has not been approved yet'; end if;
  if v_co.order_id is not null then raise exception 'Already converted to an order'; end if;

  v_price := coalesce(v_co.final_price, v_co.estimated_price, 0);

  select coalesce((value->>'rate')::numeric, 0.18) into v_gst_rate
    from public.app_settings where key = 'gst_rate';
  if v_gst_rate is null then v_gst_rate := 0.18; end if;

  insert into public.orders (id, order_number, user_id, order_type, status, payment_status, subtotal, tax, shipping_fee, discount, total)
  values (v_order_id, public.next_order_number(), v_uid, 'custom', 'Processing', 'pending',
          v_price, round(v_price * v_gst_rate, 2), 0, 0, v_price + round(v_price * v_gst_rate, 2))
  returning * into v_order;

  insert into public.order_items (order_id, product_id, product_name, quantity, unit_price, line_total)
  values (v_order_id, null, coalesce(v_co.generated_spec->>'label', 'Custom Furniture'), 1, v_price, v_price);

  update public.custom_orders set order_id = v_order_id where id = v_co.id;

  return v_order;
end;
$$;

grant execute on function public.convert_custom_order_to_order(uuid) to authenticated;
