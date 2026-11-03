-- Owner-only dashboard access.
-- Run this in Supabase Dashboard > SQL Editor after creating the owner account
-- under Authentication > Users. Then insert that user's UUID as shown below.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.orders add column if not exists razorpay_order_id text;
alter table public.orders add column if not exists razorpay_payment_id text;
create unique index if not exists orders_razorpay_order_id_uidx on public.orders (razorpay_order_id) where razorpay_order_id is not null;
create unique index if not exists orders_razorpay_payment_id_uidx on public.orders (razorpay_payment_id) where razorpay_payment_id is not null;

-- Keep the database catalog complete so checkout can price every storefront item server-side.
insert into public.products (id, name, category, price, original_price, discount_percent, colors, available_sizes, pattern_coverage, image_url, description, tags)
values
  ('tee-custom-mens-ochre', 'Men''s Orange Customizable Oversized T-shirt', 'Oversized', 699, 1199, 41, '["#C2783B","#121212","#FFFFFF","#374151"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb, '["Front","Back"]'::jsonb, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80', 'Customizable heavyweight oversized T-shirt.', '["customizable","oversized"]'::jsonb),
  ('tee-custom-womens-peach', 'Women''s Orange Customizable Boyfriend T-shirt', 'T-Shirts', 599, 1199, 50, '["#E08A6C","#FFFFFF","#121212"]'::jsonb, '["S","M","L","XL"]'::jsonb, '["Front","Back"]'::jsonb, 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80', 'Customizable relaxed boyfriend-fit T-shirt.', '["customizable","boyfriend fit"]'::jsonb),
  ('tee-custom-womens-crimson', 'Women''s Red Customizable Boyfriend T-shirt', 'T-Shirts', 599, 1199, 50, '["#B91C1C","#121212","#FFFFFF"]'::jsonb, '["S","M","L","XL"]'::jsonb, '["Front","Back"]'::jsonb, 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80', 'Customizable crimson boyfriend-fit T-shirt.', '["customizable","boyfriend fit"]'::jsonb),
  ('tee-custom-mens-black', 'Unisex Pitch Black Customizable Heavyweight Tee', 'Oversized', 649, 1199, 45, '["#121212","#374151","#FFFFFF"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb, '["Front","Back","All Over"]'::jsonb, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80', 'Customizable heavyweight streetwear T-shirt.', '["customizable","oversized"]'::jsonb),
  ('tee-vintage-club', 'Vintage 98 Athletics Club Tee', 'T-Shirts', 499, 1099, 54, '["#FFFFFF","#F3F4F6","#121212"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb, '["Front"]'::jsonb, 'vintage-club', 'Retro varsity collegiate graphic T-shirt.', '["vintage","varsity"]'::jsonb),
  ('tee-polo-classic', 'Premium Pique Classic Polo', 'Polo', 699, 1499, 53, '["#121212","#1E3A8A","#FFFFFF","#14532D"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb, '["Front"]'::jsonb, 'minimal-mountain', 'Premium cotton pique polo.', '["polo","formal"]'::jsonb),
  ('tee-crop-urban', 'Urban Street Drop Crop Tee', 'Crop', 449, 899, 50, '["#121212","#F3F4F6","#FFFFFF","#831843"]'::jsonb, '["S","M","L"]'::jsonb, '["Front"]'::jsonb, 'astronaut', 'Cropped relaxed-fit cotton T-shirt.', '["crop","women"]'::jsonb),
  ('tee-fullsleeve-voyager', 'Full Sleeve Cosmic Voyager', 'Full Sleeve', 599, 1399, 57, '["#121212","#374151","#1E3A8A"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb, '["Front","Back"]'::jsonb, 'astronaut', 'Long-sleeve graphic T-shirt.', '["full sleeve","winter"]'::jsonb)
on conflict (id) do nothing;

alter table public.admin_users enable row level security;
revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

drop policy if exists "Admin can read own allowlist row" on public.admin_users;
create policy "Admin can read own allowlist row"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Orders: allow only allowlisted owner accounts to read and update.
drop policy if exists "Allow public insert on orders" on public.orders;
drop policy if exists "Customers can insert own orders" on public.orders;
drop policy if exists "Allow public read on orders" on public.orders;
drop policy if exists "Customers can read own orders" on public.orders;
drop policy if exists "Admin can read orders" on public.orders;
drop policy if exists "Admin can update orders" on public.orders;
create policy "Customers can read own orders"
  on public.orders for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Admin can read orders"
  on public.orders for select to authenticated
  using ((select public.is_admin()));
create policy "Admin can update orders"
  on public.orders for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Bulk inquiries: allow the owner to review and update lead status.
drop policy if exists "Admin can read bulk inquiries" on public.bulk_inquiries;
drop policy if exists "Admin can update bulk inquiries" on public.bulk_inquiries;
create policy "Admin can read bulk inquiries"
  on public.bulk_inquiries for select to authenticated
  using ((select public.is_admin()));
create policy "Admin can update bulk inquiries"
  on public.bulk_inquiries for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Legacy cloud designs remain visible to the owner only.
drop policy if exists "Allow public insert on custom_designs" on public.custom_designs;
drop policy if exists "Allow public read on custom_designs" on public.custom_designs;
drop policy if exists "Admin can read custom designs" on public.custom_designs;
create policy "Admin can read custom designs"
  on public.custom_designs for select to authenticated
  using ((select public.is_admin()));

-- Public submissions may create only new, bounded bulk inquiries.
drop policy if exists "Allow public insert on bulk_inquiries" on public.bulk_inquiries;
create policy "Allow public insert on bulk_inquiries"
  on public.bulk_inquiries for insert to anon, authenticated
  with check (
    status = 'New'
    and pcs_count between 1 and 10000
    and estimated_total >= 0
    and length(trim(company_name)) between 2 and 160
    and length(trim(contact_person)) between 2 and 120
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    and phone ~ '^\+?[0-9][0-9 -]{7,14}$'
  );

-- After creating the owner in Authentication > Users, run this separately
-- with that user's actual UUID:
-- insert into public.admin_users (user_id)
-- values ('REPLACE_WITH_OWNER_AUTH_USER_UUID')
-- on conflict (user_id) do nothing;
