-- ════════════════════════════════════════════════════════════════
-- STEELCRAFT — ROW LEVEL SECURITY
-- Run after 0002_functions_triggers.sql
-- ════════════════════════════════════════════════════════════════

alter table public.profiles         enable row level security;
alter table public.addresses        enable row level security;
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_images   enable row level security;
alter table public.reviews          enable row level security;
alter table public.wishlist_items   enable row level security;
alter table public.cart_items       enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.coupons          enable row level security;
alter table public.ai_designs       enable row level security;
alter table public.custom_orders    enable row level security;
alter table public.work_items       enable row level security;
alter table public.rfqs             enable row level security;
alter table public.notifications    enable row level security;
alter table public.contact_messages enable row level security;
alter table public.app_settings     enable row level security;

-- ── PROFILES ──────────────────────────────────────────────────
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- ── ADDRESSES ─────────────────────────────────────────────────
create policy "addresses_owner_select" on public.addresses
  for select using (user_id = auth.uid() or public.is_admin());
create policy "addresses_owner_insert" on public.addresses
  for insert with check (user_id = auth.uid());
create policy "addresses_owner_update" on public.addresses
  for update using (user_id = auth.uid());
create policy "addresses_owner_delete" on public.addresses
  for delete using (user_id = auth.uid());

-- ── CATEGORIES (public read, admin write) ────────────────────
create policy "categories_public_select" on public.categories for select using (true);
create policy "categories_admin_insert"  on public.categories for insert with check (public.is_admin());
create policy "categories_admin_update"  on public.categories for update using (public.is_admin());
create policy "categories_admin_delete"  on public.categories for delete using (public.is_admin());

-- ── PRODUCTS (public read active, admin full) ────────────────
create policy "products_public_select" on public.products
  for select using (active or public.is_admin());
create policy "products_admin_insert" on public.products for insert with check (public.is_admin());
create policy "products_admin_update" on public.products for update using (public.is_admin());
create policy "products_admin_delete" on public.products for delete using (public.is_admin());

create policy "product_images_public_select" on public.product_images for select using (true);
create policy "product_images_admin_insert"  on public.product_images for insert with check (public.is_admin());
create policy "product_images_admin_update"  on public.product_images for update using (public.is_admin());
create policy "product_images_admin_delete"  on public.product_images for delete using (public.is_admin());

-- ── REVIEWS ───────────────────────────────────────────────────
create policy "reviews_public_select" on public.reviews
  for select using (is_approved or user_id = auth.uid() or public.is_admin());
create policy "reviews_owner_insert" on public.reviews
  for insert with check (user_id = auth.uid());
create policy "reviews_owner_or_admin_update" on public.reviews
  for update using (user_id = auth.uid() or public.is_admin());
create policy "reviews_owner_or_admin_delete" on public.reviews
  for delete using (user_id = auth.uid() or public.is_admin());

-- ── WISHLIST / CART (owner only) ────────────────────────────
create policy "wishlist_owner_all_select" on public.wishlist_items for select using (user_id = auth.uid());
create policy "wishlist_owner_all_insert" on public.wishlist_items for insert with check (user_id = auth.uid());
create policy "wishlist_owner_all_delete" on public.wishlist_items for delete using (user_id = auth.uid());

create policy "cart_owner_all_select" on public.cart_items for select using (user_id = auth.uid());
create policy "cart_owner_all_insert" on public.cart_items for insert with check (user_id = auth.uid());
create policy "cart_owner_all_update" on public.cart_items for update using (user_id = auth.uid());
create policy "cart_owner_all_delete" on public.cart_items for delete using (user_id = auth.uid());

-- ── ORDERS ────────────────────────────────────────────────────
create policy "orders_owner_or_admin_select" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin());
-- inserts happen only via the create_order()/convert_custom_order_to_order() SECURITY DEFINER functions

create policy "order_items_owner_or_admin_select" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
  );

create policy "coupons_public_select_active" on public.coupons for select using (active);
create policy "coupons_admin_all" on public.coupons for all using (public.is_admin());

-- ── AI DESIGNS ───────────────────────────────────────────────
create policy "ai_designs_owner_or_admin_select" on public.ai_designs
  for select using (user_id = auth.uid() or public.is_admin());
create policy "ai_designs_owner_insert" on public.ai_designs
  for insert with check (user_id = auth.uid());
create policy "ai_designs_owner_update" on public.ai_designs
  for update using (user_id = auth.uid() or public.is_admin());

-- ── CUSTOM ORDERS ────────────────────────────────────────────
create policy "custom_orders_owner_or_admin_select" on public.custom_orders
  for select using (user_id = auth.uid() or public.is_admin());
create policy "custom_orders_admin_update" on public.custom_orders
  for update using (public.is_admin());
-- inserts only via submit_custom_order() SECURITY DEFINER function

-- ── WORK ITEMS (staff/admin only) ───────────────────────────
create policy "work_items_admin_all" on public.work_items for all using (public.is_admin());
create policy "work_items_assignee_select" on public.work_items
  for select using (assigned_to = auth.uid());
create policy "work_items_assignee_update" on public.work_items
  for update using (assigned_to = auth.uid());

-- ── RFQ (anyone can submit, even guests; owner/admin can view) ─
create policy "rfqs_public_insert" on public.rfqs for insert with check (true);
create policy "rfqs_owner_or_admin_select" on public.rfqs
  for select using (user_id = auth.uid() or public.is_admin());
create policy "rfqs_admin_update" on public.rfqs for update using (public.is_admin());

-- ── NOTIFICATIONS ────────────────────────────────────────────
create policy "notifications_owner_select" on public.notifications
  for select using (user_id = auth.uid());
create policy "notifications_owner_update" on public.notifications
  for update using (user_id = auth.uid());
create policy "notifications_admin_insert" on public.notifications
  for insert with check (public.is_admin() or user_id = auth.uid());

-- ── CONTACT MESSAGES (anyone can submit; admin reads) ───────
create policy "contact_public_insert" on public.contact_messages for insert with check (true);
create policy "contact_admin_select" on public.contact_messages for select using (public.is_admin());
create policy "contact_admin_update" on public.contact_messages for update using (public.is_admin());

-- ── APP SETTINGS (admin only — pricing engine reads via service role) ─
create policy "app_settings_admin_all" on public.app_settings for all using (public.is_admin());
