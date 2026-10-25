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

-- Demo contact details: blank them so the dashboard checklist reminds you to add real ones
update public.settings set value = '' where key in
  ('contact1_name','contact1_role','contact1_phone','contact2_name','contact2_role','contact2_phone',
   'contact3_name','contact3_role','contact3_phone','facebook','instagram','tiktok');
update public.settings set value = '+92 300 0000000' where key = 'phone';
update public.settings set value = '923000000000' where key = 'whatsapp';
