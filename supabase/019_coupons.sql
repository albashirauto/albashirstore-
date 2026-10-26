-- =====================================================================
-- Al Bashir Autos: coupons / discount codes (Admin > Coupons).
-- Kinds: percent (optional cap) | fixed (Rs. off) | free_shipping.
-- Rules: minimum order, start / end date, total uses, uses per customer (phone), first order only.
-- coupon_quote() is the only way the website checks a code; it runs again when the order is placed.
-- Uses are counted from orders (cancelled / returned orders give the use back). Safe to run again.
-- =====================================================================
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  description text,
  kind text not null default 'percent' check (kind in ('percent', 'fixed', 'free_shipping')),
  value numeric(12,2) not null default 0,
  min_order numeric(12,2) not null default 0,
  max_discount numeric(12,2),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit int,
  per_customer_limit int,
  first_order_only boolean not null default false,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz
);
create unique index if not exists coupons_code_key on public.coupons (upper(code));
alter table public.coupons enable row level security;
drop policy if exists "admin manage coupons" on public.coupons;
create policy "admin manage coupons" on public.coupons for all using (public.is_admin()) with check (public.is_admin());

alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists discount numeric(12,2) not null default 0;
create index if not exists orders_coupon_idx on public.orders (upper(coupon_code)) where coupon_code is not null;

create or replace function public.coupon_quote(p_code text, p_subtotal numeric, p_phone text default '')
returns json language plpgsql stable security definer set search_path = public as $$
declare
  c public.coupons;
  ph text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  used int; mine int; d numeric := 0;
  bad text;
begin
  select * into c from coupons where upper(code) = upper(trim(coalesce(p_code, ''))) limit 1;
  if not found or not c.active then return json_build_object('ok', false, 'message', 'This coupon code is not valid.'); end if;
  if c.starts_at is not null and now() < c.starts_at then return json_build_object('ok', false, 'message', 'This coupon starts on ' || to_char(c.starts_at at time zone 'Asia/Karachi', 'DD Mon YYYY') || '.'); end if;
  if c.ends_at is not null and now() > c.ends_at then return json_build_object('ok', false, 'message', 'This coupon has expired.'); end if;
  if coalesce(p_subtotal, 0) < c.min_order then
    return json_build_object('ok', false, 'message', 'Add Rs. ' || to_char(c.min_order - coalesce(p_subtotal, 0), 'FM999,999,990') || ' more to use this coupon (minimum Rs. ' || to_char(c.min_order, 'FM999,999,990') || ').');
  end if;
  if c.usage_limit is not null then
    select count(*) into used from orders where upper(coupon_code) = upper(c.code) and coalesce(status, 'new') not in ('cancelled', 'returned');
    if used >= c.usage_limit then return json_build_object('ok', false, 'message', 'This coupon has been fully used.'); end if;
  end if;
  -- customer rules need the phone; checked again when the order is placed
  if length(ph) >= 10 then
    if c.per_customer_limit is not null then
      select count(*) into mine from orders where upper(coupon_code) = upper(c.code) and right(regexp_replace(phone, '\D', '', 'g'), 10) = ph and coalesce(status, 'new') not in ('cancelled', 'returned');
      if mine >= c.per_customer_limit then return json_build_object('ok', false, 'message', 'You have already used this coupon.'); end if;
    end if;
    if c.first_order_only and exists (select 1 from orders where right(regexp_replace(phone, '\D', '', 'g'), 10) = ph and coalesce(status, 'new') not in ('cancelled', 'returned')) then
      return json_build_object('ok', false, 'message', 'This coupon is for your first order only.');
    end if;
  end if;
  if c.kind = 'percent' then
    d := round(coalesce(p_subtotal, 0) * least(greatest(c.value, 0), 100) / 100);
    if c.max_discount is not null then d := least(d, c.max_discount); end if;
  elsif c.kind = 'fixed' then
    d := least(greatest(c.value, 0), coalesce(p_subtotal, 0));
  end if;
  return json_build_object('ok', true, 'code', upper(c.code), 'kind', c.kind, 'discount', d, 'free_shipping', c.kind = 'free_shipping',
    'description', coalesce(c.description, ''), 'first_order_only', c.first_order_only);
end $$;
revoke all on function public.coupon_quote(text, numeric, text) from public;
grant execute on function public.coupon_quote(text, numeric, text) to anon, authenticated;
