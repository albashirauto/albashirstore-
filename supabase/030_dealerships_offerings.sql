-- =====================================================================
-- Al Bashir Autos: dealership brands + "What we sell"
-- Dealerships: TQR (TQR Loader), ISH, RP (RP Speedo, RP Loader), DYL Lubricants, Odiking.
-- No Yamaha / Suzuki parts. Honda, Atlas Honda and Unique are hidden (not deleted).
-- Safe to run again.
-- =====================================================================

-- sub-names shown under a dealership logo, e.g. "RP Speedo · RP Loader"
alter table public.brands add column if not exists sub_brands text;

-- no Yamaha / Suzuki: remove their bike models and (product-free) brands
delete from public.vehicles where slug in ('yamaha-ybr-125', 'suzuki-gs-150');
delete from public.brands b where b.slug in ('yamaha', 'suzuki')
  and not exists (select 1 from public.products p where p.brand_id = b.id);

-- not a dealership: hide, keep for their products
update public.brands set active = false where slug in ('honda', 'atlas-honda', 'unique');

-- RP Speedo becomes RP (old address keeps working)
update public.brands set name = 'RP', slug = 'rp' where slug = 'rp-speedo' and not exists (select 1 from public.brands where slug = 'rp');
insert into public.redirects (from_path, to_path, auto) values ('/brands/rp-speedo', '/brands/rp', true)
  on conflict (lower(from_path)) do nothing;

insert into public.brands (name, slug, sort_order, active) values
  ('DYL Lubricants', 'dyl-lubricants', 4, true),
  ('Odiking', 'odiking', 5, true)
on conflict (slug) do nothing;

update public.brands set sub_brands = 'TQR Loader', sort_order = 1, active = true where slug = 'tqr';
update public.brands set sort_order = 2, active = true where slug = 'ish';
update public.brands set sub_brands = 'RP Speedo · RP Loader', sort_order = 3, active = true where slug = 'rp';

-- home banner text no longer names Yamaha / Suzuki
update public.banners set subtitle = 'Honda CD 70, CG 125, CB 150F, rickshaws, loaders and cycles.'
  where subtitle ilike '%suzuki%' or subtitle ilike '%ybr%';

-- ---------- What we sell (home page groups, managed in Admin) ----------
create table if not exists public.offerings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  image text,
  link text,
  icon text,                          -- shown until a photo is uploaded: motorcycle | cycle | loader | rickshaw | generator | tools
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);
alter table public.offerings enable row level security;
drop policy if exists "public read" on public.offerings;
create policy "public read" on public.offerings for select using (active = true or public.is_admin());
drop policy if exists "admin write" on public.offerings;
create policy "admin write" on public.offerings for all using (public.is_admin()) with check (public.is_admin());

insert into public.offerings (title, body, link, icon, sort_order)
select * from (values
  ('Motorcycles', 'Bikes and motorcycle spare parts.', '/parts/motorcycle', 'motorcycle', 1),
  ('Cycles', 'Cycles and cycle parts.', '/parts/cycle', 'cycle', 2),
  ('Loader rickshaws', 'Loader rickshaws and loader rickshaw parts.', '/parts/loader', 'loader', 3),
  ('Chingchi rickshaw parts', 'Spare parts for chingchi rickshaws.', '/parts/rickshaw', 'rickshaw', 4),
  ('Generator products', 'Generator products and parts.', '/shop?q=generator', 'generator', 5),
  ('Tools', 'Tool kits, spanners and more.', '/shop?q=tool', 'tools', 6)
) v(title, body, link, icon, sort_order)
where not exists (select 1 from public.offerings);
