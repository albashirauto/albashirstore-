-- =====================================================================
-- Al Bashir Autos: review photos + reviews added by the shop (Admin > Product reviews > Add / Edit).
-- Safe to run again.
-- =====================================================================
alter table public.product_reviews add column if not exists images text[] not null default '{}';
alter table public.product_reviews add column if not exists source text not null default 'customer';  -- customer | admin

-- visitors may read the photos too (still never the phone)
grant select (images) on public.product_reviews to anon;
