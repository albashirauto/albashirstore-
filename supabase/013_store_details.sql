-- =====================================================================
-- Al Bashir Autos: real shop details (owners, business phone / WhatsApp, address, opening hours).
-- Runs once (db:push remembers it). Later changes: Admin > Settings.
-- =====================================================================
insert into public.settings (key, value) values
  ('contact1_name', 'Muhammad Yar Qamar'),     ('contact1_role', 'Owner'), ('contact1_phone', '0333-6975614'), ('contact1_whatsapp', ''),
  ('contact2_name', 'Nazeer Ahmad Jia'),       ('contact2_role', 'Owner'), ('contact2_phone', '0301-3939499'), ('contact2_whatsapp', ''),
  ('contact3_name', 'H. Ahmad Khulfan Qamar'), ('contact3_role', 'Owner'), ('contact3_phone', '0306-0614000'), ('contact3_whatsapp', ''),
  ('phone', '0312-6975614'),
  ('whatsapp', '923126975614'),
  ('address', 'Pakpattan Road, opposite MCB Bank, Haveli Lakha, Tehsil Depalpur, District Okara, Punjab'),
  ('open_hours', E'Saturday – Thursday: 8:00 am – 8:00 pm\nFriday: 8:00 am – 1:00 pm')
on conflict (key) do update set value = excluded.value;
