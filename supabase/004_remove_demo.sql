-- =====================================================================
-- Remove ALL demo data added by 003_demo_data.sql. Run before going live.
-- Keeps your own products/orders (only rows tagged DEMO are deleted).
-- =====================================================================
alter table public.products disable trigger products_activity;
alter table public.orders disable trigger orders_activity;

delete from public.orders where note = 'DEMO';
delete from public.products where sku like 'DEMO-%';   -- cost prices go with them (on delete cascade)
delete from public.activity where detail in (
  'Spark Plug (Standard) · 160 → 200', 'Hamza Tariq · confirmed → shipped', 'Bilal Hussain · Rs. 4,350',
  'Headlight Bulb Set LED · Rs. 950 → Rs. 899', 'Usman Khalid · Rs. 2,700', 'Bicycle Chain (Heavy)');

alter table public.products enable trigger products_activity;
alter table public.orders enable trigger orders_activity;

-- Demo contact details: blank them so the dashboard checklist reminds you to add real ones.
-- Only values that are still exactly the demo ones, so real owners / phones are never touched.
update public.settings s set value = '' from (values
  ('contact1_name','Shop counter'), ('contact1_role','Sales & orders'), ('contact1_phone','+92 300 1234567'),
  ('contact2_name','Parts expert'), ('contact2_role','Fitment & part numbers'), ('contact2_phone','+92 301 2345678'),
  ('contact3_name','Delivery desk'), ('contact3_role','Order tracking'), ('contact3_phone','+92 302 3456789'),
  ('facebook','https://www.facebook.com/'), ('instagram','https://www.instagram.com/'), ('tiktok','https://www.tiktok.com/')
) as d(key, value) where s.key = d.key and s.value = d.value;
update public.settings set value = '+92 300 0000000' where key = 'phone' and value = '+92 300 1234567';
update public.settings set value = '923000000000' where key = 'whatsapp' and value = '923001234567';
