-- =====================================================================
-- Al Bashir Autos: delivery Rs. 400, online payment details, category & brand pages
-- Run AFTER 007_seo.sql. Safe to run again.
-- =====================================================================

-- ---------- delivery: Rs. 400 all over Pakistan ----------
update public.settings set value = '400' where key = 'shipping_flat' and value in ('', '250');
insert into public.settings (key, value) values ('shipping_flat', '400') on conflict (key) do nothing;

-- ---------- payment accounts shown at checkout (fill in Admin > Store settings) ----------
insert into public.settings (key, value) values
  ('jazzcash_number', ''), ('jazzcash_name', ''),
  ('easypaisa_number', ''), ('easypaisa_name', ''),
  ('bank_name', ''), ('bank_title', ''), ('bank_iban', '')
on conflict (key) do nothing;

-- ---------- orders: how the customer paid + their transaction id ----------
alter table public.orders alter column payment_method drop default;
alter table public.orders add column if not exists payment_ref text;   -- JazzCash / Easypaisa / bank transaction id

-- ---------- category pages: description + SEO ----------
alter table public.categories add column if not exists description_html text;
alter table public.categories add column if not exists seo_title text;
alter table public.categories add column if not exists seo_description text;
alter table public.categories add column if not exists focus_keywords text;

-- ---------- brand pages: details + SEO (logo already exists) ----------
alter table public.brands add column if not exists description_html text;
alter table public.brands add column if not exists country text;
alter table public.brands add column if not exists website text;
alter table public.brands add column if not exists seo_title text;
alter table public.brands add column if not exists seo_description text;
alter table public.brands add column if not exists focus_keywords text;

-- ---------- brand supplier (private, admins only) ----------
create table if not exists public.brand_suppliers (
  brand_id uuid primary key references public.brands(id) on delete cascade,
  supplier_name text, supplier_phone text, supplier_notes text
);
alter table public.brand_suppliers enable row level security;
drop policy if exists "admin only" on public.brand_suppliers;
create policy "admin only" on public.brand_suppliers for all using (public.is_admin()) with check (public.is_admin());
