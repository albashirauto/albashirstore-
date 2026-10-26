-- =====================================================================
-- Al Bashir Autos: email notifications (Admin > Notifications).
-- The database pings /api/notify on: new order, order status change, payment confirmed,
-- product low / out of stock. The website then emails every recipient who wants that kind.
-- Safe to run again.
-- =====================================================================

create extension if not exists pg_net with schema extensions;

-- who gets which emails. kinds: new_order | order_status | payment | stock
create table if not exists public.notify_recipients (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  events text[] not null default '{new_order,order_status,payment,stock}',
  active boolean not null default true,
  created_at timestamptz default now()
);
create unique index if not exists notify_recipients_email_key on public.notify_recipients (lower(email));
alter table public.notify_recipients enable row level security;
drop policy if exists "owner manage notify recipients" on public.notify_recipients;
create policy "owner manage notify recipients" on public.notify_recipients for all using (public.is_owner()) with check (public.is_owner());

-- sender Gmail + the shared secret. RLS on and NO policies: only the server key can read it.
create table if not exists public.notify_config (
  id int primary key default 1 check (id = 1),
  url text,
  secret text,
  gmail_user text,
  gmail_password text,
  last_error text,
  updated_at timestamptz default now()
);
alter table public.notify_config enable row level security;
insert into public.notify_config (id, url, secret)
values (1, 'https://albashirstore.vercel.app/api/notify', encode(extensions.gen_random_bytes(24), 'hex'))
on conflict (id) do nothing;

-- send one event (fire-and-forget; never blocks or breaks the order / product save)
create or replace function public.notify_send(p_event text, p_id uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare c public.notify_config;
begin
  select * into c from public.notify_config where id = 1;
  if c.url is null or c.secret is null then return; end if;
  if not exists (select 1 from public.notify_recipients where active) then return; end if;
  perform net.http_post(
    url := c.url,
    body := jsonb_build_object('event', p_event, 'id', p_id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', c.secret),
    timeout_milliseconds := 10000
  );
exception when others then
  raise warning 'notify_send failed: %', sqlerrm;
end $$;
revoke all on function public.notify_send(text, uuid) from public, anon, authenticated;

create or replace function public.notify_orders() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.notify_send('new_order', new.id);
  elsif new.status is distinct from old.status then
    perform public.notify_send('order_status', new.id);
  elsif new.payment_status = 'paid' and old.payment_status is distinct from 'paid' then
    perform public.notify_send('payment', new.id);
  end if;
  return new;
end $$;
drop trigger if exists orders_notify on public.orders;
create trigger orders_notify after insert or update on public.orders for each row execute function public.notify_orders();

-- stock: only when it CROSSES the alert level (product's "Low stock alert at", default 5), so no repeat emails
create or replace function public.notify_stock() returns trigger
language plpgsql security definer set search_path = public as $$
declare lvl int := coalesce((select reorder_level from public.product_costs where product_id = new.id), 5);
begin
  if new.stock is null or not coalesce(new.active, true) then return new; end if;
  if new.stock <= 0 and coalesce(old.stock, 0) > 0 then
    perform public.notify_send('stock', new.id);
  elsif new.stock > 0 and new.stock <= lvl and coalesce(old.stock, 0) > lvl then
    perform public.notify_send('stock', new.id);
  end if;
  return new;
end $$;
drop trigger if exists products_notify on public.products;
create trigger products_notify after update of stock on public.products for each row execute function public.notify_stock();
