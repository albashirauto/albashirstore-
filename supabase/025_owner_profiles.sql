-- =====================================================================
-- Al Bashir Autos: owners' roles, bios, quotes and points (About page > Meet the owners).
-- Runs once (db:push remembers it). Change the wording any time in Admin > Settings > Owners & phones.
-- =====================================================================
insert into public.settings (key, value) values
  ('owners_title', 'The people behind Al Bashir Autos'),
  ('owners_sub', 'No call centre. When you call or message, you speak directly to the people who run the shop.'),

  ('contact1_role', 'CEO'),
  ('contact1_bio', 'As CEO, I lead Al Bashir Autos and stand behind every part we sell. My aim is simple: the right part for your bike, at a fair price, with no surprises. If anything is not right with your order, call me directly and I will sort it out.'),
  ('contact1_quote', 'Honest price, right part, every time.'),
  ('contact1_points', E'Talk directly to the CEO\nFair, clear prices\nEvery order confirmed by phone\nProblems solved, no excuses'),

  ('contact2_role', 'Co-Founder'),
  ('contact2_bio', 'I helped start Al Bashir Autos to give riders a shop they can trust. I look after our range of parts and the suppliers we buy from, so the shelves stay full of parts that fit and last, for motorcycles, rickshaws, loaders and cycles.'),
  ('contact2_quote', 'A good part keeps a family moving.'),
  ('contact2_points', E'Parts from trusted suppliers\nThe right fit for your bike\nBulk schemes for workshops and mechanics\nFree advice before you buy'),

  ('contact3_role', 'Director'),
  ('contact3_bio', 'I run the day-to-day work: orders, packing, delivery and our online store. Message me for an update on your order, bulk orders for your workshop, or help choosing a part. I make sure every parcel leaves the shop checked and well packed.'),
  ('contact3_quote', 'Every order checked, packed and sent with care.'),
  ('contact3_points', E'Delivery all over Pakistan\nOrder updates on WhatsApp\nEvery parcel checked and packed with care\nEasy order tracking online')
on conflict (key) do update set value = excluded.value;
