-- COMRADE MKT CEO dashboard read access
-- Run once in the Supabase SQL Editor for the comrade-mkt project.
-- These policies let only users listed in public.admin_users read all listings and profile IDs.
-- Existing RLS policies are preserved; the policies below add CEO-only SELECT access.

grant select on table public.products to authenticated;
grant select on table public.profiles to authenticated;

drop policy if exists "CEO admins can view all marketplace listings" on public.products;
create policy "CEO admins can view all marketplace listings"
on public.products for select to authenticated
using (exists (select 1 from public.admin_users where public.admin_users.id = (select auth.uid())));

drop policy if exists "CEO admins can view student profile counts" on public.profiles;
create policy "CEO admins can view student profile counts"
on public.profiles for select to authenticated
using (exists (select 1 from public.admin_users where public.admin_users.id = (select auth.uid())));
