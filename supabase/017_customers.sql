-- =====================================================================
-- Al Bashir Autos: customer profiles (Admin > Customers > Add customer).
-- Orders still make customers on their own; a profile adds details, tags and notes,
-- and lets you save someone who hasn't ordered yet. Matched to orders by phone number.
-- Admins only (customers' details are private). Safe to run again.
-- =====================================================================
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  -- 03001234567 style, so +92 300 1234567 and 0300-1234567 are the same person
  phone_key text generated always as (regexp_replace(regexp_replace(phone, '\D', '', 'g'), '^92', '0')) stored,
  email text,
  province text, district text, city text,
  address text,
  source text,                                -- walk-in | phone | whatsapp | facebook | instagram | tiktok | website | referral | other
  tags text[] not null default '{}',          -- e.g. mechanic, wholesale, vip
  notes text,                                 -- private
  created_at timestamptz default now(),
  updated_at timestamptz
);
create unique index if not exists customers_phone_key on public.customers (phone_key);

alter table public.customers enable row level security;
drop policy if exists "admin manage customers" on public.customers;
create policy "admin manage customers" on public.customers for all using (public.is_admin()) with check (public.is_admin());
