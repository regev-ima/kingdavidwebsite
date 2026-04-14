-- King David website <-> kcrm Supabase schema
--
-- Run this in the kcrm Supabase SQL editor if these tables don't already
-- exist. If they do, compare column names and adjust ENTITY_MAP /
-- Checkout.jsx accordingly (only the names need to match).
--
-- The website only needs:
--   * READ on `products` and `blog_posts`
--   * INSERT on `orders`, `order_items`, `contact_inquiries`

create extension if not exists "pgcrypto";

-- =====================================================================
-- Products (the catalog the website shows)
-- =====================================================================
create table if not exists public.products (
  id              text primary key,
  created_date    timestamptz not null default now(),
  name            text not null,
  category        text,
  description     text,
  price           numeric(10,2),
  sale_price      numeric(10,2),
  hardness        int,
  height_cm       int,
  warranty_years  int,
  image_url       text,
  available_sizes jsonb default '[]'::jsonb,
  technologies    jsonb default '[]'::jsonb,
  features        jsonb default '[]'::jsonb,
  is_featured     boolean not null default false,
  is_on_sale      boolean not null default false
);

-- =====================================================================
-- Blog posts
-- =====================================================================
create table if not exists public.blog_posts (
  id           text primary key,
  created_date timestamptz not null default now(),
  title        text not null,
  slug         text unique,
  excerpt      text,
  body         text,
  cover_url    text,
  published    boolean not null default true
);

-- =====================================================================
-- Contact inquiries
-- =====================================================================
create table if not exists public.contact_inquiries (
  id           uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  full_name    text,
  email        text,
  phone        text,
  subject      text,
  message      text,
  status       text not null default 'new'
);

-- =====================================================================
-- Orders + line items
-- =====================================================================
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  created_date   timestamptz not null default now(),
  order_number   text unique not null,
  status         text not null default 'new',
  payment_method text,
  full_name      text not null,
  phone          text not null,
  email          text,
  city           text,
  street         text,
  apartment      text,
  notes          text,
  subtotal       numeric(10,2) not null,
  shipping       numeric(10,2) not null default 0,
  assembly       numeric(10,2) not null default 0,
  with_assembly  boolean not null default false,
  total          numeric(10,2) not null
);

create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  created_date  timestamptz not null default now(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    text,
  product_name  text not null,
  size          text,
  quantity      int not null,
  with_storage  boolean not null default false,
  unit_price    numeric(10,2) not null,
  line_total    numeric(10,2) not null
);

create index if not exists order_items_order_id_idx
  on public.order_items(order_id);

-- =====================================================================
-- RLS — public storefront only needs:
--   read on products + blog_posts (only published rows)
--   insert on orders, order_items, contact_inquiries
-- =====================================================================
alter table public.products           enable row level security;
alter table public.blog_posts         enable row level security;
alter table public.orders             enable row level security;
alter table public.order_items        enable row level security;
alter table public.contact_inquiries  enable row level security;

-- public READ
drop policy if exists "products_public_read"   on public.products;
create policy "products_public_read"
  on public.products for select using (true);

drop policy if exists "blog_posts_public_read" on public.blog_posts;
create policy "blog_posts_public_read"
  on public.blog_posts for select using (coalesce(published, true));

-- public INSERT (anonymous orders + inquiries)
drop policy if exists "orders_public_insert"            on public.orders;
create policy "orders_public_insert"
  on public.orders for insert with check (true);

drop policy if exists "order_items_public_insert"       on public.order_items;
create policy "order_items_public_insert"
  on public.order_items for insert with check (true);

drop policy if exists "contact_inquiries_public_insert" on public.contact_inquiries;
create policy "contact_inquiries_public_insert"
  on public.contact_inquiries for insert with check (true);
