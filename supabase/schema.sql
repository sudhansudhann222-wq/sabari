-- ==============================================================================
-- TEECRAFT SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New Query
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PRODUCTS TABLE
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  price numeric not null,
  original_price numeric not null,
  discount_percent integer not null default 50,
  rating numeric not null default 4.5,
  reviews_count integer not null default 0,
  colors jsonb not null default '[]'::jsonb,
  available_sizes jsonb not null default '["S","M","L","XL","XXL"]'::jsonb,
  pattern_coverage jsonb not null default '["Front"]'::jsonb,
  image_url text not null,
  description text not null,
  tags jsonb not null default '[]'::jsonb,
  is_bestseller boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. ORDERS TABLE
create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete set null,
  order_id text unique not null,
  razorpay_order_id text,
  razorpay_payment_id text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null,
  discount numeric not null default 0,
  delivery_fee numeric not null default 0,
  total numeric not null,
  shipping_details jsonb not null,
  payment_method text not null,
  payment_status text not null default 'Pending',
  order_status text not null default 'New',
  estimated_delivery text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CUSTOM DESIGNS TABLE (User creations from the studio)
create table if not exists public.custom_designs (
  id uuid default uuid_generate_v4() primary key,
  name text not null default 'Custom Tee',
  tshirt_type text not null default 'Oversized T-Shirt',
  color text not null,
  color_name text not null,
  size text not null default 'L',
  print_location text not null default 'Front',
  design_data jsonb not null,
  preview_image text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. BULK INQUIRIES TABLE
create table if not exists public.bulk_inquiries (
  id uuid default uuid_generate_v4() primary key,
  company_name text not null,
  contact_person text not null,
  email text not null,
  phone text not null,
  pcs_count integer not null,
  tshirt_type text not null,
  print_sides text not null,
  estimated_total numeric not null,
  notes text,
  status text default 'New' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.custom_designs enable row level security;
alter table public.bulk_inquiries enable row level security;

-- Public can read products
drop policy if exists "Allow public read on products" on public.products;
create policy "Allow public read on products" on public.products
  for select using (true);

-- Signed-in customers can insert only their own orders.
drop policy if exists "Allow public insert on orders" on public.orders;
drop policy if exists "Customers can insert own orders" on public.orders;

drop policy if exists "Allow public read on orders" on public.orders;
drop policy if exists "Customers can read own orders" on public.orders;
create policy "Customers can read own orders" on public.orders
  for select to authenticated using (user_id = (select auth.uid()));

-- Custom designs are currently stored on the user's device; do not allow anonymous cloud writes.
drop policy if exists "Allow public insert on custom_designs" on public.custom_designs;
drop policy if exists "Allow public read on custom_designs" on public.custom_designs;

-- Public can submit bulk inquiries
drop policy if exists "Allow public insert on bulk_inquiries" on public.bulk_inquiries;
create policy "Allow public insert on bulk_inquiries" on public.bulk_inquiries
  for insert to anon, authenticated
  with check (
    status = 'New'
    and pcs_count between 1 and 10000
    and estimated_total >= 0
    and length(trim(company_name)) between 2 and 160
    and length(trim(contact_person)) between 2 and 120
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    and phone ~ '^\+?[0-9][0-9 -]{7,14}$'
  );

-- SEED INITIAL PRODUCTS (Matches the TeeCraft collection)
insert into public.products (id, name, category, price, original_price, discount_percent, rating, reviews_count, colors, available_sizes, pattern_coverage, image_url, description, is_bestseller, tags)
values
  (
    'tee-astronaut',
    'Astronaut Graphic Oversized Tee',
    'Oversized',
    499,
    1199,
    58,
    4.6,
    158,
    '["#121212", "#374151", "#9CA3AF", "#FFFFFF"]'::jsonb,
    '["S", "M", "L", "XL", "XXL"]'::jsonb,
    '["Front", "Back"]'::jsonb,
    'astronaut',
    'Heavyweight 240 GSM French Terry cotton oversized tee featuring our signature astronaut cosmos back graphic. Drop-shoulder relaxed streetwear silhouette.',
    true,
    '["space", "oversized", "streetwear", "bestseller"]'::jsonb
  ),
  (
    'tee-abstract',
    'Abstract All Over Print Tee',
    'Oversized',
    499,
    1199,
    58,
    4.7,
    137,
    '["#121212", "#374151", "#FFFFFF"]'::jsonb,
    '["S", "M", "L", "XL", "XXL"]'::jsonb,
    '["All Over", "Front"]'::jsonb,
    'abstract-lines',
    'Intricate topographic vector contours mapped across premium bio-washed breathable cotton. Clean monochrome streetwear aesthetic.',
    true,
    '["abstract", "monochrome", "oversized", "minimal"]'::jsonb
  ),
  (
    'tee-wave',
    'Japanese Wave Back Print Tee',
    'T-Shirts',
    499,
    1199,
    58,
    4.6,
    33,
    '["#FFFFFF", "#F3F4F6", "#121212"]'::jsonb,
    '["S", "M", "L", "XL", "XXL"]'::jsonb,
    '["Back", "Front"]'::jsonb,
    'japanese-wave',
    'Iconic Kanagawa ocean surge paired with the crimson sun. Printed with high-definition OEKO-TEX certified water-based inks that never fade or peel.',
    false,
    '["japanese", "wave", "art", "graphic"]'::jsonb
  ),
  (
    'tee-cyberpunk',
    'Neo Tokyo Cyberpunk Oversized',
    'Oversized',
    549,
    1299,
    57,
    4.8,
    89,
    '["#121212", "#1E3A8A"]'::jsonb,
    '["S", "M", "L", "XL", "XXL"]'::jsonb,
    '["Front", "Back"]'::jsonb,
    'tokyo-cyberpunk',
    'Neon synthwave grid aesthetics with Japanese typography. Ultra soft combed cotton with pre-shrunk fabric construction.',
    true,
    '["cyberpunk", "tokyo", "neon", "streetwear"]'::jsonb
  ),
  (
    'tee-alpine',
    'Minimalist Alpine Ridge Tee',
    'T-Shirts',
    499,
    999,
    50,
    4.5,
    64,
    '["#121212", "#374151", "#9CA3AF", "#F3F4F6", "#FFFFFF"]'::jsonb,
    '["S", "M", "L", "XL"]'::jsonb,
    '["Front"]'::jsonb,
    'minimal-mountain',
    'Geometric sunset mountain peak graphic on 100% organic ring-spun cotton. Regular modern fit suitable for daily wear.',
    false,
    '["minimal", "mountain", "nature"]'::jsonb
  )
on conflict (id) do nothing;

