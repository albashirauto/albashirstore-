-- =====================================================================
-- Al Bashir Autos: DEMO DATA (products, costs, settings, 60 orders, activity)
-- Run AFTER schema.sql and 002_dashboard.sql. Safe to run again.
-- Everything is tagged: products sku 'DEMO-…', orders note 'DEMO'.
-- Remove it all before going live with 004_remove_demo.sql.
-- =====================================================================

-- ---------- settings (demo contact details: replace with your real ones in Admin > Store settings) ----------
insert into public.settings (key, value) values
  ('phone', '+92 300 1234567'),
  ('whatsapp', '923001234567'),
  ('contact1_name', 'Shop counter'), ('contact1_role', 'Sales & orders'), ('contact1_phone', '+92 300 1234567'),
  ('contact2_name', 'Parts expert'), ('contact2_role', 'Fitment & part numbers'), ('contact2_phone', '+92 301 2345678'),
  ('contact3_name', 'Delivery desk'), ('contact3_role', 'Order tracking'), ('contact3_phone', '+92 302 3456789'),
  ('facebook', 'https://www.facebook.com/'), ('instagram', 'https://www.instagram.com/'), ('tiktok', 'https://www.tiktok.com/')
on conflict (key) do update set value = excluded.value;

-- seed quietly: the activity log should not show 78 "added by Customer" lines
alter table public.products disable trigger products_activity;
alter table public.orders disable trigger orders_activity;

-- ---------- products ----------
insert into public.products
  (name, slug, sku, description, price, compare_price, stock, category_id, brand_id, vehicle_id, promotion_id,
   is_featured, is_trending, scheme_buy, scheme_free, fitment_verified, active)
select v.name, v.slug, v.sku,
       v.name || ' for ' || coalesce(ve.name, 'most bikes') || '. Quality checked before dispatch. (Demo product)',
       v.price, v.compare, v.stock, c.id, b.id, ve.id, pr.id, v.feat, v.trend, v.sb, v.sf, v.fit, true
from (values
  ('CD 70 Chain Kit (Chain + Sprockets)', 'demo-cd-70-chain-kit',        'DEMO-1001', 1650, 1950, 24, 'chain-kits',     'honda',       'honda-cd-70',     '30-off-sale',     true,  true,  null::int, null::int, true),
  ('CG 125 Heavy Duty Chain Kit',         'demo-cg-125-chain-kit',        'DEMO-1002', 2450, 2800,  3, 'chain-kits',     'tqr',         'honda-cg-125',    '30-off-sale',     true,  true,  null, null, true),
  ('Dry Battery 12V 5Ah',                 'demo-dry-battery-12v-5ah',     'DEMO-1003', 2650, null,  15, 'batteries',      'unique',      'honda-cd-70',     null,              true,  true,  null, null, true),
  ('Maintenance-Free Battery 12V 9Ah',    'demo-mf-battery-12v-9ah',      'DEMO-1004', 4100, 4600,  0, 'batteries',      'atlas-honda', 'honda-cb-150f',   '30-off-sale',     false, true,  null, null, true),
  ('Genuine Engine Oil 20W-50 (1L)',      'demo-engine-oil-20w-50',       'DEMO-1005', 1450, null,  60, 'engine-oil',     'honda',       'honda-cg-125',    null,              true,  false, 12, 1, true),
  ('Headlight Bulb Set LED',              'demo-headlight-bulb-led',      'DEMO-1006',  899, 1299, 40, 'lights',         'tqr',         'honda-cd-70',     'under-999',       true,  true,  10, 1, true),
  ('Indicator Set (4 pcs)',               'demo-indicator-set-4-pcs',     'DEMO-1007',  750, null,  32, 'lights',         'ish',         'honda-cg-125',    'under-999',       false, false, 12, 2, false),
  ('Front Brake Shoe Set',                'demo-front-brake-shoe-set',    'DEMO-1008',  650, null,  80, 'brakes-clutch',  'honda',       'honda-cd-70',     'under-999',       false, false, 10, 2, true),
  ('Clutch Plate Kit',                    'demo-clutch-plate-kit',        'DEMO-1009', 1350, 1600,  4, 'brakes-clutch',  'atlas-honda', 'honda-cg-125',    null,              true,  false, null, null, true),
  ('Tubeless Tyre 2.75-18',               'demo-tubeless-tyre-2-75-18',   'DEMO-1010', 5400, null,  10, 'tyres',          'unique',      'honda-cd-70',     null,              false, false, null, null, true),
  ('Spark Plug (Standard)',               'demo-spark-plug-standard',     'DEMO-1011',  350, null, 200, 'spark-plugs',    'honda',       'honda-cg-125',    'under-999',       false, true,  20, 5, true),
  ('Digital Speedometer',                 'demo-digital-speedometer',     'DEMO-1012', 3200, 3800,  6, 'speedometers',   'rp-speedo',   'honda-cb-150f',   'half-price-sale', true,  true,  null, null, false),
  ('Analog Speedometer CD 70',            'demo-analog-speedometer-cd70', 'DEMO-1013', 1900, 2400,  2, 'speedometers',   'rp-speedo',   'honda-cd-70',     'half-price-sale', false, false, null, null, true),
  ('CG 125 Fuel Tank Outfit',             'demo-cg-125-fuel-tank',        'DEMO-1014', 8000, null,   5, 'fuel-tanks',     'ish',         'honda-cg-125',    null,              true,  true,  null, null, true),
  ('Racing Silencer',                     'demo-racing-silencer',         'DEMO-1015', 3500, 4200,  9, 'silencers',      'tqr',         null,              'half-price-sale', false, true,  null, null, false),
  ('Rickshaw Clutch Cable',               'demo-rickshaw-clutch-cable',   'DEMO-1016',  480, null, 120, 'rickshaw-parts', 'unique',      'auto-rickshaw',   'under-999',       false, false, 20, 4, true),
  ('Loader Rickshaw Brake Pad Set',       'demo-loader-brake-pad-set',    'DEMO-1017', 1250, null,  45, 'rickshaw-parts', 'unique',      'loader-rickshaw', null,              false, false, 10, 2, true),
  ('Bicycle Chain (Heavy)',               'demo-bicycle-chain-heavy',     'DEMO-1018',  420, null,  70, 'cycle-parts',    'unique',      'bicycle',         'under-999',       false, false, 20, 5, true)
) as v(name, slug, sku, price, compare, stock, cat, brand, veh, promo, feat, trend, sb, sf, fit)
left join public.categories c on c.slug = v.cat
left join public.brands b on b.slug = v.brand
left join public.vehicles ve on ve.slug = v.veh
left join public.promotions pr on pr.slug = v.promo
on conflict (slug) do nothing;

-- ---------- private cost prices (about 65–75% of price) ----------
insert into public.product_costs (product_id, cost_price)
select id, round(price * (0.65 + (('x' || substr(md5(slug), 1, 2))::bit(8)::int % 11) / 100.0))
from public.products where sku like 'DEMO-%'
on conflict (product_id) do update set cost_price = excluded.cost_price, updated_at = now();

-- ---------- 60 orders over the last 60 days (same result every run) ----------
do $$
declare
  names  text[] := array['Ahmed Raza','Usman Khalid','Faisal Mehmood','Bilal Hussain','Imran Ali','Kashif Iqbal','Zeeshan Akhtar','Hamza Tariq','Naveed Anwar','Rizwan Shah','Asif Nawaz','Shahid Latif','Waqas Javed','Adeel Haider'];
  cities text[] := array['Okara','Depalpur','Haveli Lakha','Lahore','Pakpattan','Sahiwal','Basirpur'];
  i int; c int; p record; lines jsonb; sub numeric; q int; fr int; st text; pay text; d timestamptz;
begin
  if exists (select 1 from public.orders where note = 'DEMO') then return; end if;
  perform setseed(0.42);
  for i in 1..60 loop
    c := 1 + floor(random() * array_length(names, 1))::int;
    d := now() - make_interval(days => floor(random() * 59)::int, hours => floor(random() * 12)::int, mins => floor(random() * 60)::int);
    lines := '[]'::jsonb; sub := 0;
    for p in select id, name, price, scheme_buy, scheme_free from public.products
             where sku like 'DEMO-%' order by random() limit 1 + floor(random() * 3)::int loop
      q := case when p.scheme_buy is not null and random() < 0.45 then p.scheme_buy * (1 + floor(random() * 2)::int)
                else 1 + floor(random() * 4)::int end;
      fr := case when coalesce(p.scheme_buy, 0) > 0 then (q / p.scheme_buy) * p.scheme_free else 0 end;
      lines := lines || jsonb_build_array(jsonb_build_object('id', p.id, 'name', p.name, 'price', p.price, 'qty', q, 'free', fr));
      sub := sub + p.price * q;
    end loop;
    st := case
      when d > now() - interval '2 days' then (array['new','new','confirmed'])[1 + floor(random() * 3)::int]
      when random() < 0.08 then 'cancelled'
      when random() < 0.07 then 'returned'
      when d > now() - interval '7 days' then (array['confirmed','shipped','shipped'])[1 + floor(random() * 3)::int]
      else 'delivered' end;
    pay := case when st in ('delivered','shipped') then 'paid' when st = 'returned' then 'refunded'
                when st = 'confirmed' and random() < 0.5 then 'paid' else 'unpaid' end;
    insert into public.orders (customer_name, phone, city, address, note, items, subtotal, shipping, total, status, payment_status, created_at)
    values (names[c], '0300' || lpad((1000000 + c * 7919)::text, 7, '0'), cities[1 + floor(random() * array_length(cities, 1))::int],
            'Demo address, street ' || i, 'DEMO', lines, sub, 250, sub + 250, st, pay, d);
  end loop;
end $$;

alter table public.products enable trigger products_activity;
alter table public.orders enable trigger orders_activity;

-- ---------- a few activity lines so the timeline is not empty ----------
insert into public.activity (at, actor_email, entity, action, detail)
select * from (values
  (now() - interval '3 hours',  'albashirauto@gmail.com', 'product', 'Stock adjusted', 'Spark Plug (Standard) · 160 → 200'),
  (now() - interval '5 hours',  'albashirauto@gmail.com', 'order',   'Order shipped',  'Hamza Tariq · confirmed → shipped'),
  (now() - interval '9 hours',  null,                     'order',   'Order placed',   'Bilal Hussain · Rs. 4,350'),
  (now() - interval '1 day',    'albashirauto@gmail.com', 'product', 'Price changed',  'Headlight Bulb Set LED · Rs. 950 → Rs. 899'),
  (now() - interval '2 days',   'albashirauto@gmail.com', 'order',   'Payment paid',   'Usman Khalid · Rs. 2,700'),
  (now() - interval '3 days',   'albashirauto@gmail.com', 'product', 'Product added',  'Bicycle Chain (Heavy)')
) as a(at, actor_email, entity, action, detail)
where not exists (select 1 from public.activity where detail = 'Spark Plug (Standard) · 160 → 200');
