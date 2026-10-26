-- =====================================================================
-- Al Bashir Autos: abandoned carts (Admin > Abandoned carts).
-- When a visitor types their phone at checkout, the cart is saved (one row per phone, updated as they go).
-- An order from that phone marks it recovered. Visitors can only write through save_cart(); admins read.
-- Safe to run again.
-- =====================================================================
create table if not exists public.abandoned_carts (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  phone_key text generated always as (right(regexp_replace(phone, '\D', '', 'g'), 10)) stored,
  name text,
  city text,
  items jsonb not null default '[]',
  subtotal numeric(12,2) not null default 0,
  status text not null default 'open' check (status in ('open', 'contacted', 'recovered', 'dismissed')),
  contacted_at timestamptz,
  recovered_order uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index if not exists abandoned_carts_phone_open on public.abandoned_carts (phone_key) where status in ('open', 'contacted');
alter table public.abandoned_carts enable row level security;
drop policy if exists "admin manage carts" on public.abandoned_carts;
create policy "admin manage carts" on public.abandoned_carts for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.save_cart(p_phone text, p_name text, p_city text, p_items jsonb, p_subtotal numeric)
returns void language plpgsql security definer set search_path = public as $$
declare ph text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
begin
  if length(ph) < 10 or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then return; end if;
  update abandoned_carts set name = left(coalesce(nullif(trim(p_name), ''), name), 80), city = left(coalesce(nullif(trim(p_city), ''), city), 80),
    items = p_items, subtotal = greatest(0, least(coalesce(p_subtotal, 0), 10000000)), updated_at = now()
  where phone_key = ph and status in ('open', 'contacted');
  if not found then
    insert into abandoned_carts (phone, name, city, items, subtotal)
    values (left(p_phone, 30), left(nullif(trim(p_name), ''), 80), left(nullif(trim(p_city), ''), 80), p_items, greatest(0, least(coalesce(p_subtotal, 0), 10000000)));
  end if;
end $$;
revoke all on function public.save_cart(text, text, text, jsonb, numeric) from public;
grant execute on function public.save_cart(text, text, text, jsonb, numeric) to anon, authenticated;

-- an order from the same phone recovers the cart
create or replace function public.recover_cart() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update abandoned_carts set status = 'recovered', recovered_order = new.id, updated_at = now()
  where phone_key = right(regexp_replace(new.phone, '\D', '', 'g'), 10) and status in ('open', 'contacted');
  return new;
end $$;
drop trigger if exists orders_recover_cart on public.orders;
create trigger orders_recover_cart after insert on public.orders for each row execute function public.recover_cart();
