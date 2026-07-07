-- ════════════════════════════════════════════════════════════════
-- STEELCRAFT — Sprint A + B Schema
-- Run after 0005_seed.sql
--
-- Adds:
--   1. custom_order_revisions — design change history per custom order
--   2. payments               — mock payment records (Razorpay fields
--                               stubbed; real integration is Sprint B-live)
--   3. materials              — raw material inventory (steel sheets,
--                               pipes, hardware, paint)
--   4. material_movements     — every stock in/out event
--   5. custom_orders status enum expanded to cover the full lifecycle
-- ════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- 1. EXTEND custom_orders status to cover full lifecycle
--    The old check constraint only covered 9 states.
--    We add: awaiting_customer_response, payment_pending, cancelled
-- ────────────────────────────────────────────────────────────────
alter table public.custom_orders
  drop constraint if exists custom_orders_admin_status_check;

alter table public.custom_orders
  add constraint custom_orders_admin_status_check
  check (admin_status in (
    'pending_review',            -- just submitted by customer
    'quoted',                    -- admin has sent a price quote
    'awaiting_customer_response',-- waiting on customer to approve or request changes
    'approved',                  -- customer accepted the quote
    'payment_pending',           -- quote approved, payment not yet received
    'in_production',             -- fabrication started
    'quality_check',             -- QC stage
    'ready_to_dispatch',         -- packed and labelled
    'dispatched',                -- handed to courier
    'delivered',                 -- confirmed delivered
    'rejected',                  -- admin or customer cancelled
    'cancelled'                  -- customer explicitly cancelled
  ));

-- Customer-visible revision request field
alter table public.custom_orders
  add column if not exists revision_count      integer not null default 0,
  add column if not exists payment_id          uuid,   -- FK added below after payments table
  add column if not exists quoted_at           timestamptz,
  add column if not exists approved_at         timestamptz,
  add column if not exists dispatched_at       timestamptz,
  add column if not exists delivered_at        timestamptz;

-- ────────────────────────────────────────────────────────────────
-- 2. CUSTOM ORDER REVISIONS
--    Every time a spec changes (customer requests changes after a
--    quote, or admin revises) we snapshot the before/after here.
-- ────────────────────────────────────────────────────────────────
create table if not exists public.custom_order_revisions (
  id                uuid primary key default gen_random_uuid(),
  custom_order_id   uuid not null references public.custom_orders(id) on delete cascade,
  revision_number   integer not null,   -- increments from 1
  revised_by        uuid references public.profiles(id) on delete set null,
  revision_type     text not null default 'spec_change'
                      check (revision_type in (
                        'spec_change',          -- customer changed requirements
                        'price_revision',        -- admin updated quote price
                        'admin_note',            -- admin left a comment
                        'customer_feedback',     -- customer replied / rejected
                        'status_change'          -- lifecycle state transition
                      )),
  previous_spec     jsonb,              -- snapshot of generated_spec before change
  new_spec          jsonb,              -- snapshot after change (null for note-only)
  previous_price    numeric(12,2),
  new_price         numeric(12,2),
  previous_status   text,
  new_status        text,
  notes             text,               -- human-written context
  created_at        timestamptz not null default now()
);

create index if not exists cor_custom_order_idx on public.custom_order_revisions(custom_order_id, revision_number);
create index if not exists cor_revised_by_idx   on public.custom_order_revisions(revised_by);

-- ────────────────────────────────────────────────────────────────
-- 3. PAYMENTS
--    Stores one record per payment attempt/success.
--    razorpay_* columns are stubs — populated only when real
--    Razorpay is wired in (Sprint B-live). For now the frontend
--    creates a record with status='mock_success' to simulate flow.
-- ────────────────────────────────────────────────────────────────
create table if not exists public.payments (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete cascade,

  -- exactly one of these will be non-null (standard order vs custom order)
  order_id              uuid references public.orders(id) on delete set null,
  custom_order_id       uuid references public.custom_orders(id) on delete set null,

  amount                numeric(12,2) not null,
  currency              text not null default 'INR',
  payment_method        text not null default 'mock'
                          check (payment_method in (
                            'mock',          -- simulated (frontend dev only)
                            'upi',
                            'card',
                            'netbanking',
                            'emi',
                            'cod',
                            'razorpay'       -- when Sprint B-live lands
                          )),
  status                text not null default 'pending'
                          check (status in (
                            'pending',
                            'mock_success',  -- simulated success (no real gateway)
                            'success',       -- real gateway confirmed
                            'failed',
                            'refunded',
                            'partially_refunded'
                          )),

  -- Razorpay stubs — null until Sprint B-live
  razorpay_order_id     text,
  razorpay_payment_id   text,
  razorpay_signature    text,

  gst_amount            numeric(12,2),
  discount_amount       numeric(12,2),
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists payments_user_idx         on public.payments(user_id);
create index if not exists payments_order_idx        on public.payments(order_id);
create index if not exists payments_custom_order_idx on public.payments(custom_order_id);
create index if not exists payments_status_idx       on public.payments(status);

-- Wire FK back to custom_orders.payment_id
alter table public.custom_orders
  add constraint custom_orders_payment_id_fk
  foreign key (payment_id) references public.payments(id) on delete set null;

-- ────────────────────────────────────────────────────────────────
-- 4. MATERIALS  (raw material master list)
--    Steel sheets, pipes, hardware, paint/primer — anything
--    consumed during fabrication.
-- ────────────────────────────────────────────────────────────────
create table if not exists public.materials (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,     -- internal SKU e.g. "SS-0.6MM-4X8"
  name            text not null,
  category        text not null default 'sheet'
                    check (category in (
                      'sheet',       -- steel sheets (primary raw material)
                      'pipe',        -- box section / round pipe
                      'hardware',    -- hinges, locks, handles, wheels
                      'paint',       -- paint, primer, powder coat
                      'packing',     -- corrugated boxes, bubble wrap
                      'other'
                    )),
  unit            text not null default 'kg'
                    check (unit in ('kg','pcs','ltr','mtr','sqft','box')),
  gauge_mm        numeric(4,2),             -- null for non-sheet materials
  current_stock   numeric(12,3) not null default 0,
  min_stock_level numeric(12,3) not null default 0,   -- triggers low-stock alert
  unit_cost       numeric(12,2) not null default 0,   -- cost per unit (INR)
  supplier        text,
  notes           text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists materials_category_idx on public.materials(category);
create index if not exists materials_active_idx   on public.materials(is_active);

-- ────────────────────────────────────────────────────────────────
-- 5. MATERIAL MOVEMENTS  (every stock change)
--    Append-only ledger; current_stock on materials is always
--    derived from the sum of these rows. Manual adjustments,
--    purchase receipts, and production consumption all land here.
-- ────────────────────────────────────────────────────────────────
create table if not exists public.material_movements (
  id                uuid primary key default gen_random_uuid(),
  material_id       uuid not null references public.materials(id) on delete cascade,
  custom_order_id   uuid references public.custom_orders(id) on delete set null,
  moved_by          uuid references public.profiles(id) on delete set null,
  movement_type     text not null
                      check (movement_type in (
                        'purchase',          -- stock received from supplier
                        'production_use',    -- consumed during fabrication
                        'adjustment',        -- manual correction
                        'return_to_supplier',-- returned defective stock
                        'scrap'              -- material written off
                      )),
  quantity          numeric(12,3) not null,   -- positive = in, negative = out
  unit_cost         numeric(12,2),            -- cost at time of movement
  reference         text,                     -- PO number / invoice / note
  notes             text,
  created_at        timestamptz not null default now()
);

create index if not exists mm_material_idx on public.material_movements(material_id);
create index if not exists mm_order_idx    on public.material_movements(custom_order_id);
create index if not exists mm_type_idx     on public.material_movements(movement_type);

-- Auto-update materials.current_stock after each movement
create or replace function public.sync_material_stock()
returns trigger language plpgsql security definer as $$
begin
  update public.materials
  set    current_stock = (
           select coalesce(sum(quantity), 0)
           from   public.material_movements
           where  material_id = new.material_id
         ),
         updated_at = now()
  where  id = new.material_id;
  return new;
end;
$$;

drop trigger if exists trg_sync_material_stock on public.material_movements;
create trigger trg_sync_material_stock
  after insert or update on public.material_movements
  for each row execute procedure public.sync_material_stock();

-- ────────────────────────────────────────────────────────────────
-- 6. SEED: basic steel material master (realistic for an Indian
--    steel furniture manufacturer)
-- ────────────────────────────────────────────────────────────────
insert into public.materials (code, name, category, unit, gauge_mm, current_stock, min_stock_level, unit_cost, supplier)
values
  ('SS-0.6MM-4X8',  '0.6mm CR Steel Sheet 4×8ft',    'sheet', 'kg',  0.6,  500, 100, 72,  'SAIL / Vizag Steel'),
  ('SS-0.8MM-4X8',  '0.8mm CR Steel Sheet 4×8ft',    'sheet', 'kg',  0.8,  300, 80,  85,  'SAIL / Vizag Steel'),
  ('SS-1.0MM-4X8',  '1.0mm CR Steel Sheet 4×8ft',    'sheet', 'kg',  1.0,  150, 50,  98,  'SAIL / Vizag Steel'),
  ('PIPE-1X1',      '1×1 Inch Box Section Pipe',     'pipe',  'mtr', null, 200, 40,  55,  'Local Steel Supplier'),
  ('PIPE-1.5X1.5',  '1.5×1.5 Inch Box Section Pipe', 'pipe',  'mtr', null, 100, 30,  75,  'Local Steel Supplier'),
  ('HW-HINGE-3IN',  '3 Inch Steel Hinge (pair)',      'hardware','pcs',null, 500, 100, 35,  'Hardware Wholesaler'),
  ('HW-LOCK-KEY',   'Key Lock with 3 Keys',           'hardware','pcs',null, 200, 50,  120, 'Hardware Wholesaler'),
  ('HW-LOCK-DIG',   'Digital Lock (4-digit)',         'hardware','pcs',null, 50,  10,  850, 'Digital Hardware Co'),
  ('HW-WHEEL-3IN',  '3 Inch Castor Wheel (set of 4)', 'hardware','pcs',null, 100, 20,  220, 'Hardware Wholesaler'),
  ('HW-HANDLE-6IN', '6 Inch Steel Handle',            'hardware','pcs',null, 400, 80,  45,  'Hardware Wholesaler'),
  ('PAINT-PRIMER',  'Red Oxide Primer (20L)',         'paint', 'ltr', null, 60,  15,  220, 'Asian Paints B2B'),
  ('PAINT-ENAMEL',  'Synthetic Enamel Paint (20L)',   'paint', 'ltr', null, 80,  20,  380, 'Asian Paints B2B'),
  ('PACK-BOX-LG',   'Large Corrugated Box',           'packing','pcs',null, 200, 50,  85,  'Packaging Supplier')
on conflict (code) do nothing;

-- ────────────────────────────────────────────────────────────────
-- 7. RLS for new tables
-- ────────────────────────────────────────────────────────────────
alter table public.custom_order_revisions enable row level security;
alter table public.payments               enable row level security;
alter table public.materials              enable row level security;
alter table public.material_movements     enable row level security;

-- custom_order_revisions: owners can read their own; admins can do all
create policy "cor_owner_read" on public.custom_order_revisions
  for select using (
    custom_order_id in (
      select id from public.custom_orders where user_id = auth.uid()
    )
  );
create policy "cor_admin_all" on public.custom_order_revisions
  for all using (public.is_admin());

-- payments: owners can read their own; admins can do all
create policy "pay_owner_read" on public.payments
  for select using (user_id = auth.uid());
create policy "pay_owner_insert" on public.payments
  for insert with check (user_id = auth.uid());
create policy "pay_admin_all" on public.payments
  for all using (public.is_admin());

-- materials: admin full access; customers can read (for UI display)
create policy "mat_read_all" on public.materials
  for select using (true);
create policy "mat_admin_all" on public.materials
  for all using (public.is_admin());

-- material_movements: admin only
create policy "mm_admin_all" on public.material_movements
  for all using (public.is_admin());
