-- =====================================================================
-- Al Bashir Autos: product reviews with stars (Admin > Product reviews).
-- Customers submit through submit_review() only (no direct insert); every review waits for approval.
-- "Verified buyer" when an order with the same phone contains the product.
-- The phone number is private: visitors can read only the public columns of approved reviews.
-- Safe to run again.
-- =====================================================================
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  phone text,                                   -- private, for verification only
  city text,
  rating int not null check (rating between 1 and 5),
  title text,
  body text not null,
  verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reply text,                                   -- the shop's public answer
  reply_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists product_reviews_product_idx on public.product_reviews (product_id, status, created_at desc);

alter table public.product_reviews enable row level security;
drop policy if exists "public read approved reviews" on public.product_reviews;
create policy "public read approved reviews" on public.product_reviews for select using (status = 'approved' or public.is_admin());
drop policy if exists "admin manage reviews" on public.product_reviews;
create policy "admin manage reviews" on public.product_reviews for all using (public.is_admin()) with check (public.is_admin());

-- visitors may read only these columns (never the phone)
revoke all on public.product_reviews from anon;
grant select (id, product_id, name, city, rating, title, body, verified, status, reply, reply_at, created_at) on public.product_reviews to anon;

-- star summary per product (approved only), for product cards and Google
create or replace view public.product_ratings with (security_invoker = true) as
  select product_id, round(avg(rating)::numeric, 1) as rating, count(*)::int as reviews
  from public.product_reviews where status = 'approved' group by product_id;
grant select on public.product_ratings to anon, authenticated;

-- the only way for customers to add a review
create or replace function public.submit_review(p_product uuid, p_name text, p_phone text, p_city text, p_rating int, p_title text, p_body text)
returns text language plpgsql security definer set search_path = public as $$
declare
  ph text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  ok boolean;
begin
  if length(trim(coalesce(p_name, ''))) < 2 then return 'Please enter your name.'; end if;
  if length(ph) < 10 then return 'Please enter your phone number (it stays private).'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then return 'Please choose 1 to 5 stars.'; end if;
  if length(trim(coalesce(p_body, ''))) < 10 then return 'Please write a few words (at least 10 letters).'; end if;
  if not exists (select 1 from products where id = p_product and active) then return 'This product is not available.'; end if;
  -- one review per phone per product
  if exists (select 1 from product_reviews where product_id = p_product and right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 10) = ph) then
    return 'You have already reviewed this product. Thank you!';
  end if;
  -- simple flood guard: 5 reviews per phone per day
  if (select count(*) from product_reviews where right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 10) = ph and created_at > now() - interval '1 day') >= 5 then
    return 'Too many reviews today. Please try again tomorrow.';
  end if;
  select exists (
    select 1 from orders o, jsonb_array_elements(o.items) i
    where right(regexp_replace(o.phone, '\D', '', 'g'), 10) = ph and i->>'id' = p_product::text and coalesce(o.status, 'new') not in ('cancelled')
  ) into ok;
  insert into product_reviews (product_id, name, phone, city, rating, title, body, verified)
  values (p_product, left(trim(p_name), 60), p_phone, nullif(left(trim(coalesce(p_city, '')), 60), ''), p_rating,
          nullif(left(trim(coalesce(p_title, '')), 100), ''), left(trim(p_body), 2000), ok);
  return 'ok';
end $$;
revoke all on function public.submit_review(uuid, text, text, text, int, text, text) from public;
grant execute on function public.submit_review(uuid, text, text, text, int, text, text) to anon, authenticated;

-- email the shop (Admin > Notifications, kind "review")
create or replace function public.notify_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_send('review', new.id);
  return new;
end $$;
drop trigger if exists product_reviews_notify on public.product_reviews;
create trigger product_reviews_notify after insert on public.product_reviews for each row execute function public.notify_review();
