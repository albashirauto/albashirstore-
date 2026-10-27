-- =====================================================================
-- Al Bashir Autos: "brands we sell" and "dealerships" are separate lists
-- Brands we sell: Odiking, TQR, RP, LZ+, Honda, Oditer, Crownlifan
-- Dealerships:    TQR, ISH, RP, DYL Lubricants, Odiking
-- Safe to run again.
-- =====================================================================

alter table public.brands add column if not exists show_as_brand boolean default true;  -- menu, /brands, home strip
alter table public.brands add column if not exists dealer boolean default false;        -- About > Dealership of
alter table public.brands add column if not exists dealer_order int default 0;

insert into public.brands (name, slug, active) values
  ('LZ+', 'lz-plus', true),
  ('Oditer', 'oditer', true),
  ('Crownlifan', 'crownlifan', true)
on conflict (slug) do nothing;

-- brands we sell, in this order
update public.brands b set active = true, show_as_brand = true, sort_order = v.ord
from (values ('odiking', 1), ('tqr', 2), ('rp', 3), ('lz-plus', 4), ('honda', 5), ('oditer', 6), ('crownlifan', 7)) v(slug, ord)
where b.slug = v.slug;

-- dealership only: live (their products and pages keep working) but not listed as brands
update public.brands set active = true, show_as_brand = false where slug in ('ish', 'dyl-lubricants');

-- dealerships, in this order
update public.brands set dealer = false where slug not in ('tqr', 'ish', 'rp', 'dyl-lubricants', 'odiking');
update public.brands b set dealer = true, dealer_order = v.ord
from (values ('tqr', 1), ('ish', 2), ('rp', 3), ('dyl-lubricants', 4), ('odiking', 5)) v(slug, ord)
where b.slug = v.slug;
