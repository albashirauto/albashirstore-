-- =====================================================================
-- Al Bashir Autos: FAQs + Blog (managed in Admin)
-- Run AFTER 008_store.sql. Safe to run again.
-- =====================================================================

-- ---------- FAQs (Contact page) ----------
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- ---------- Blog posts ----------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  cover text,                         -- cover picture
  excerpt text,                       -- 1–2 lines for the blog list and Google
  content_html text,
  author text,
  published_at timestamptz default now(),
  seo_title text, seo_description text, focus_keywords text,
  sort_order int default 0,           -- unused for order (newest first), kept for the admin list
  active boolean default true,        -- off = draft
  created_at timestamptz default now()
);
create index if not exists posts_published_idx on public.posts(published_at desc);

do $$
declare t text;
begin
  foreach t in array array['faqs','posts'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (active = true or public.is_admin())', t);
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format('create policy "admin write" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- the questions that were written into the Contact page
insert into public.faqs (question, answer, sort_order)
select * from (values
  ('Do you deliver outside Okara?', 'Yes, we deliver all over Pakistan. Delivery charges are confirmed by phone and taken in advance.', 1),
  ('How fast will my order ship?', 'Orders usually ship within 24 hours after we confirm them with you by phone.', 2),
  ('I am not sure which part fits my bike.', 'Send us a photo of the old part or your bike model on WhatsApp. We will tell you the right part before you order.', 3),
  ('What if I receive the wrong part?', 'Return it within 7 days in its original condition and we will exchange it.', 4),
  ('Can I order on WhatsApp instead of the website?', 'Yes. Send the part name or photo and your address, and we will confirm the price and delivery with you.', 5),
  ('Do you have bulk schemes for workshops?', 'Yes, many parts have “buy X get Y free” schemes. See the Deal zone for the full list.', 6)
) as v(question, answer, sort_order)
where not exists (select 1 from public.faqs);
