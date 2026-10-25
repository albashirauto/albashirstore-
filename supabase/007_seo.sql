-- =====================================================================
-- Al Bashir Autos: Rank Math-style SEO fields per product
-- Run AFTER 005_products.sql. Safe to run again.
-- =====================================================================
alter table public.products add column if not exists focus_keywords text;            -- "chain kit, cd 70 chain" (first = main)
alter table public.products add column if not exists og_title text;                  -- Facebook / WhatsApp / X title
alter table public.products add column if not exists og_description text;
alter table public.products add column if not exists og_image text;                  -- empty = first product photo
alter table public.products add column if not exists canonical_url text;             -- empty = its own address
alter table public.products add column if not exists robots_noindex boolean default false;
alter table public.products add column if not exists robots_nofollow boolean default false;

-- default title template + separator (Admin > Store settings)
insert into public.settings (key, value) values
  ('seo_separator', '|'),
  ('seo_product_title', '%name% %sep% %sitename%'),
  ('seo_product_description', 'Buy %name% for %vehicle% at %price%. Genuine quality, checked before dispatch, delivered across Pakistan.')
on conflict (key) do nothing;
