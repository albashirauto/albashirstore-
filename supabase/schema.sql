-- =====================================================================
-- Al Bashir Autos — Supabase schema
-- Run this whole file once in: Supabase Dashboard > SQL Editor > New query
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- helper: who is an admin? ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------- catalog ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image text,
  parent_id uuid references public.categories(id) on delete set null,
  show_in_nav boolean default true,
  show_on_home boolean default true,
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo text,
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- "Parts company" / vehicle make+model, e.g. Honda CG 125, Suzuki GS 150, Rickshaw
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type text default 'motorcycle',   -- motorcycle | cycle | rickshaw | loader | other
  company text,
  image text,
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  subtitle text,
  badge text,                        -- e.g. "30% OFF"
  image text,
  starts_at timestamptz,
  ends_at timestamptz,
  show_on_home boolean default true,
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sku text,
  description text,
  price numeric(12,2) not null default 0,
  compare_price numeric(12,2),
  stock int default 0,
  images text[] default '{}',
  category_id uuid references public.categories(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  promotion_id uuid references public.promotions(id) on delete set null,
  is_featured boolean default false,
  is_trending boolean default false,
  active boolean default true,
  created_at timestamptz default now()
);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_brand_idx on public.products(brand_id);
create index if not exists products_vehicle_idx on public.products(vehicle_id);
create index if not exists products_promo_idx on public.products(promotion_id);

-- bulk schemes: "buy 20, get 5 free" (safe to re-run on an existing database)
alter table public.products add column if not exists scheme_buy int;
alter table public.products add column if not exists scheme_free int;

-- ---------- site content (CMS) ----------
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  eyebrow text,
  title text not null,
  subtitle text,
  button_text text default 'Shop now',
  link text default '/shop',
  image text,
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text,                      -- simple HTML allowed
  show_in_footer boolean default true,
  active boolean default true,
  updated_at timestamptz default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  body text not null,
  rating int default 5,
  sort_order int default 0,
  active boolean default true
);

create table if not exists public.features (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  icon text default 'truck',         -- truck | shield | headset | refresh | tag | badge
  sort_order int default 0,
  active boolean default true
);

create table if not exists public.settings (
  key text primary key,
  value text
);

-- ---------- orders ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no bigint generated always as identity,
  customer_name text not null,
  phone text not null,
  email text,
  city text,
  address text not null,
  note text,
  items jsonb not null,
  subtotal numeric(12,2) not null,
  shipping numeric(12,2) default 0,
  total numeric(12,2) not null,
  payment_method text default 'cod',
  status text default 'new',         -- new | confirmed | shipped | delivered | cancelled
  created_at timestamptz default now()
);

create table if not exists public.newsletter (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz default now()
);

-- =====================================================================
-- Row Level Security
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array['categories','brands','vehicles','promotions','products','banners','pages','testimonials','features','settings','orders','newsletter','admins']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Public can READ active content; admins can do everything.
do $$
declare t text;
begin
  foreach t in array array['categories','brands','vehicles','promotions','products','banners','pages','testimonials','features']
  loop
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (active = true or public.is_admin())', t);
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format('create policy "admin write" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

drop policy if exists "public read" on public.settings;
create policy "public read" on public.settings for select using (true);
drop policy if exists "admin write" on public.settings;
create policy "admin write" on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- Orders: anyone can place one, only admins can see/manage them.
drop policy if exists "anyone can order" on public.orders;
create policy "anyone can order" on public.orders for insert with check (true);
drop policy if exists "admin manage orders" on public.orders;
create policy "admin manage orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "anyone can subscribe" on public.newsletter;
create policy "anyone can subscribe" on public.newsletter for insert with check (true);
drop policy if exists "admin read newsletter" on public.newsletter;
create policy "admin read newsletter" on public.newsletter for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin read admins" on public.admins;
create policy "admin read admins" on public.admins for select using (user_id = auth.uid() or public.is_admin());

-- =====================================================================
-- Storage bucket for images (public read, admin upload)
-- =====================================================================
insert into storage.buckets (id, name, public) values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "media admin write" on storage.objects;
create policy "media admin write" on storage.objects for all
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

-- =====================================================================
-- Starter content (safe to edit/delete later from the admin panel)
-- =====================================================================
insert into public.settings (key, value) values
  ('store_name', 'Al Bashir Autos'),
  ('tagline', 'Spare parts for motorcycles, cycles, rickshaws & loaders'),
  ('phone', '+92 300 0000000'),
  ('whatsapp', '923000000000'),
  ('email', 'albashirauto@gmail.com'),
  ('address', 'Pakpattan Road, opposite MCB Bank, Haveli Lakha, Tehsil Depalpur, District Okara'),
  ('announcement', 'Genuine parts  •  Pakistan-wide delivery  •  7-day exchange'),
  ('shipping_flat', '400'),
  ('facebook', ''), ('instagram', ''), ('tiktok', ''),
  ('open_hours', 'Mon – Sat, 9:00 am to 9:00 pm')
on conflict (key) do nothing;

insert into public.categories (name, slug, sort_order) values
  ('Chain Kits & Sprockets','chain-kits',1),
  ('Batteries','batteries',2),
  ('Engine Oil & Lubricants','engine-oil',3),
  ('Lights & Indicators','lights',4),
  ('Brakes & Clutch','brakes-clutch',5),
  ('Tyres & Tubes','tyres',6),
  ('Spark Plugs','spark-plugs',7),
  ('Speedometers','speedometers',8),
  ('Fuel Tanks','fuel-tanks',9),
  ('Silencers & Exhausts','silencers',10),
  ('Rickshaw Parts','rickshaw-parts',11),
  ('Cycle Parts','cycle-parts',12)
on conflict (slug) do nothing;

insert into public.brands (name, slug, sort_order) values
  ('Honda','honda',1),('RP Speedo','rp-speedo',2),('ISH','ish',3),('TQR','tqr',4),
  ('Yamaha','yamaha',5),('Suzuki','suzuki',6),('Atlas Honda','atlas-honda',7),('Unique','unique',8)
on conflict (slug) do nothing;

insert into public.vehicles (name, slug, type, company, sort_order) values
  ('Honda CD 70','honda-cd-70','motorcycle','Honda',1),
  ('Honda CG 125','honda-cg-125','motorcycle','Honda',2),
  ('Honda CB 150F','honda-cb-150f','motorcycle','Honda',3),
  ('Yamaha YBR 125','yamaha-ybr-125','motorcycle','Yamaha',4),
  ('Suzuki GS 150','suzuki-gs-150','motorcycle','Suzuki',5),
  ('Auto Rickshaw','auto-rickshaw','rickshaw','Various',6),
  ('Loader Rickshaw','loader-rickshaw','loader','Various',7),
  ('Bicycle','bicycle','cycle','Various',8)
on conflict (slug) do nothing;

insert into public.promotions (title, slug, subtitle, badge, sort_order) values
  ('Half Price Sale','half-price-sale','Selected parts at half price','50% OFF',1),
  ('30% Off Week','30-off-sale','Chain kits, batteries and more','30% OFF',2),
  ('Under Rs. 999','under-999','Everyday parts that cost less','Rs. 999',3),
  ('Trending Now','trending','What riders are buying this week','HOT',4)
on conflict (slug) do nothing;

do $$
begin
  if not exists (select 1 from public.banners) then
    insert into public.banners (eyebrow, title, subtitle, button_text, link, sort_order) values
      ('Genuine & imported parts','Keep every ride running strong','Chain kits, batteries, lights and engine parts for motorcycles, rickshaws and cycles, delivered across Pakistan.','Shop all parts','/shop',1),
      ('Deal Zone','Up to 50% off this week','Half-price sale on selected parts. Limited stock, fast delivery.','See deals','/promotions/half-price-sale',2),
      ('Find parts by bike','Pick your model, see what fits','Honda CD 70, CG 125, CB 150F, YBR, Suzuki and rickshaws.','Browse by bike','/vehicles',3);
  end if;

  if not exists (select 1 from public.features) then
    insert into public.features (title, body, icon, sort_order) values
      ('Fast delivery','Orders ship within 24 hours. Delivery charges are taken in advance.','truck',1),
      ('Same part you chose','We deliver exactly the product you ordered, every time.','shield',2),
      ('Support 6 days a week','Call or WhatsApp us from 9 am to 9 pm.','headset',3),
      ('7-day exchange','Wrong part? Return it within 7 days for an exchange.','refresh',4);
  end if;

  if not exists (select 1 from public.testimonials) then
    insert into public.testimonials (name, city, body, rating, sort_order) values
      ('Ahmed Raza','Okara','Ordered a chain kit for my CD 70. It arrived in two days and fit perfectly.',5,1),
      ('Usman Khalid','Depalpur','Good prices and the staff know which part goes on which bike.',5,2),
      ('Faisal Mehmood','Lahore','Bought a battery and spark plugs. Both genuine, both working fine.',5,3);
  end if;
end $$;

insert into public.pages (title, slug, content, show_in_footer) values
  ('About us','about','<h2>About Al Bashir Autos</h2><p>We are a parts shop on Pakpattan Road, Haveli Lakha, serving riders, rickshaw drivers and workshops with motorcycle, cycle and loader spare parts.</p><p>We deal in Honda, RP Speedo, ISH, TQR and other trusted brands.</p>', true),
  ('Contact','contact','<h2>Contact us</h2><p>Visit the shop or call us during opening hours. Edit this page from the admin panel.</p>', true),
  ('Refund & exchange policy','refund-policy','<h2>Refund and exchange</h2><p>If you received the wrong part, return it within 7 days in its original condition for an exchange.</p>', true),
  ('Delivery information','delivery','<h2>Delivery</h2><p>We deliver across Pakistan. Delivery charges are taken in advance.</p>', true)
on conflict (slug) do nothing;

-- =====================================================================
-- AFTER you create your admin user (Authentication > Users > Add user),
-- run this once with your own email to make it an admin:
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'albashirauto@gmail.com';
-- =====================================================================
