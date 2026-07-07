-- ════════════════════════════════════════════════════════════════
-- STEELCRAFT — CORE SCHEMA
-- Run this file first (Supabase SQL Editor, or `supabase db push`)
-- ════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ────────────────────────────────────────────────────────────────
-- PROFILES  (1:1 with auth.users — Supabase Auth owns the password)
-- ────────────────────────────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  first_name    text,
  last_name     text,
  phone         text,
  role          text not null default 'customer' check (role in ('customer','admin')),
  account_type  text not null default 'retail'   check (account_type in ('retail','wholesale')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────
-- ADDRESSES
-- ────────────────────────────────────────────────────────────────
create table public.addresses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  label           text not null default 'Home',
  full_name       text not null,
  phone           text not null,
  address_line1   text not null,
  address_line2   text,
  city            text not null,
  state           text not null,
  postal_code     text not null,
  country         text not null default 'India',
  is_default      boolean not null default false,
  created_at      timestamptz not null default now()
);
create index addresses_user_id_idx on public.addresses(user_id);

-- ────────────────────────────────────────────────────────────────
-- CATEGORIES   (id = slug, matches existing frontend Category.id)
-- ────────────────────────────────────────────────────────────────
create table public.categories (
  id          text primary key,
  name        text not null,
  icon        text not null default 'ti-package',   -- tabler icon class suffix
  image_url   text,
  sort_order  integer not null default 0
);

-- ────────────────────────────────────────────────────────────────
-- PRODUCTS
-- ────────────────────────────────────────────────────────────────
create table public.products (
  id                bigint generated always as identity primary key,
  category_id       text references public.categories(id) on delete set null,
  name              text not null,
  slug              text unique,
  description       text not null default '',
  sku               text unique,
  price             numeric(12,2) not null check (price >= 0),
  original_price    numeric(12,2),
  wholesale_price   numeric(12,2),
  stock_quantity    integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 5,
  material          text default '',
  dimensions        text default '',
  weight            text default '',
  warranty          text default '',
  features          text[] not null default '{}',
  badge             text,                              -- 'Best Seller' | 'New' | 'Sale' | 'Top Rated' | 'Premium' | null
  accent_color      text not null default '#1B3A5E',    -- fallback color block when no photo uploaded
  thumbnail_url     text,
  rating            numeric(2,1) not null default 0,
  review_count      integer not null default 0,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index products_category_idx on public.products(category_id);
create index products_active_idx   on public.products(active);

create table public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  bigint not null references public.products(id) on delete cascade,
  image_url   text not null,
  sort_order  integer not null default 0
);
create index product_images_product_idx on public.product_images(product_id);

-- ────────────────────────────────────────────────────────────────
-- REVIEWS
-- ────────────────────────────────────────────────────────────────
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  bigint not null references public.products(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  title       text,
  review      text,
  is_approved boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (product_id, user_id)
);
create index reviews_product_idx on public.reviews(product_id);

-- ────────────────────────────────────────────────────────────────
-- WISHLIST / CART  (server persistence — guests use local storage)
-- ────────────────────────────────────────────────────────────────
create table public.wishlist_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  product_id  bigint not null references public.products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

create table public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  product_id  bigint not null references public.products(id) on delete cascade,
  quantity    integer not null default 1 check (quantity > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ────────────────────────────────────────────────────────────────
-- ORDERS
-- ────────────────────────────────────────────────────────────────
create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        text unique not null,
  user_id             uuid references public.profiles(id) on delete set null,
  order_type          text not null default 'standard' check (order_type in ('standard','custom','wholesale')),
  status              text not null default 'Processing'
                       check (status in ('Processing','Packed','In Transit','Delivered','Cancelled')),
  subtotal            numeric(12,2) not null default 0,
  tax                 numeric(12,2) not null default 0,
  shipping_fee        numeric(12,2) not null default 0,
  discount            numeric(12,2) not null default 0,
  total               numeric(12,2) not null default 0,
  payment_status      text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  payment_method      text,
  coupon_code         text,
  shipping_method     text not null default 'standard',
  address_id          uuid references public.addresses(id) on delete set null,
  shipping_name       text,
  shipping_phone      text,
  shipping_address1   text,
  shipping_address2   text,
  shipping_city       text,
  shipping_state      text,
  shipping_pincode    text,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index orders_user_idx   on public.orders(user_id);
create index orders_status_idx on public.orders(status);

create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    bigint references public.products(id) on delete set null,
  product_name  text not null,
  quantity      integer not null check (quantity > 0),
  unit_price    numeric(12,2) not null,
  line_total    numeric(12,2) not null
);
create index order_items_order_idx on public.order_items(order_id);

create table public.coupons (
  code            text primary key,
  discount_type   text not null check (discount_type in ('percent','flat')),
  discount_value  numeric(12,2) not null,
  min_order_value numeric(12,2) not null default 0,
  active          boolean not null default true,
  expires_at      timestamptz
);

-- ────────────────────────────────────────────────────────────────
-- AI DESIGNS  (conversation + generated spec, pre-order)
-- ────────────────────────────────────────────────────────────────
create table public.ai_designs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.profiles(id) on delete cascade,
  conversation      jsonb not null default '[]',
  prompt            text,
  generated_spec    jsonb,
  estimated_min     numeric(12,2),
  estimated_max     numeric(12,2),
  price_breakdown   jsonb,
  preview_images    text[] not null default '{}',
  status            text not null default 'draft' check (status in ('draft','completed','converted_to_order')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index ai_designs_user_idx on public.ai_designs(user_id);

-- ────────────────────────────────────────────────────────────────
-- CUSTOM ORDERS  (admin-reviewed AI designs that become real orders)
-- ────────────────────────────────────────────────────────────────
create table public.custom_orders (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid references public.orders(id) on delete set null,
  ai_design_id      uuid references public.ai_designs(id) on delete set null,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  generated_spec    jsonb,
  preview_images    text[] not null default '{}',
  estimated_price   numeric(12,2),
  final_price       numeric(12,2),
  admin_status      text not null default 'pending_review'
                     check (admin_status in
                       ('pending_review','quoted','approved','rejected',
                        'in_production','quality_check','ready_to_dispatch','dispatched','delivered')),
  admin_notes       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index custom_orders_user_idx   on public.custom_orders(user_id);
create index custom_orders_status_idx on public.custom_orders(admin_status);

-- ────────────────────────────────────────────────────────────────
-- WORK ITEMS  (manufacturing tasks for a custom order)
-- ────────────────────────────────────────────────────────────────
create table public.work_items (
  id                uuid primary key default gen_random_uuid(),
  custom_order_id   uuid not null references public.custom_orders(id) on delete cascade,
  title             text not null,
  assigned_to       uuid references public.profiles(id) on delete set null,
  status            text not null default 'todo' check (status in ('todo','in_progress','done','blocked')),
  notes             text,
  due_date          date,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index work_items_custom_order_idx on public.work_items(custom_order_id);

-- ────────────────────────────────────────────────────────────────
-- RFQ / WHOLESALE
-- ────────────────────────────────────────────────────────────────
create table public.rfqs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.profiles(id) on delete set null,
  company_name      text not null,
  contact_name      text,
  phone             text not null,
  email             text not null,
  city              text,
  product_interest  text,
  quantity          integer not null,
  status            text not null default 'Pending' check (status in ('Pending','Quoted','Converted','Rejected')),
  quotation_amount  numeric(12,2),
  admin_notes       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index rfqs_status_idx on public.rfqs(status);

-- ────────────────────────────────────────────────────────────────
-- NOTIFICATIONS / CONTACT MESSAGES
-- ────────────────────────────────────────────────────────────────
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  message     text not null,
  type        text not null default 'info' check (type in ('info','success','warning','error')),
  link        text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, is_read);

create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text,
  email       text not null,
  subject     text,
  message     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────
-- APP SETTINGS  (admin-tunable pricing knobs — read by AI pricing engine)
-- ────────────────────────────────────────────────────────────────
create table public.app_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);
