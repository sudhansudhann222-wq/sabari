-- Remove anonymous access to customer order and design records.
-- Run this once in Supabase Dashboard > SQL Editor for the existing project.
drop policy if exists "Allow public read on orders" on public.orders;
drop policy if exists "Allow public read on custom_designs" on public.custom_designs;
