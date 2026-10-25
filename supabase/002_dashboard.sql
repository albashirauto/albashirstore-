-- =====================================================================
-- Al Bashir Autos: dashboard upgrade (profit, returns, payments, fitment, activity log)
-- Run once in Supabase > SQL Editor AFTER schema.sql. Safe to run again.
-- =====================================================================

-- ---------- private cost prices (for profit). Admins only, never public ----------
create table if not exists public.product_costs (
  product_id uuid primary key references public.products(id) on delete cascade,
  cost_price numeric(12,2),
  updated_at timestamptz default now()
);
alter table public.product_costs enable row level security;
drop policy if exists "admin only" on public.product_costs;
create policy "admin only" on public.product_costs for all using (public.is_admin()) with check (public.is_admin());

-- ---------- fitment check per product ----------
alter table public.products add column if not exists fitment_verified boolean default false;

-- ---------- payment status per order (fulfilment stays in "status") ----------
-- status:         new | confirmed | shipped | delivered | cancelled | returned
-- payment_status: unpaid | paid | refunded
alter table public.orders add column if not exists payment_status text default 'unpaid';

-- ---------- activity log (written by triggers, read by admins) ----------
create table if not exists public.activity (
  id bigint generated always as identity primary key,
  at timestamptz default now(),
  actor_email text,              -- null = a customer on the website
  entity text not null,          -- 'order' | 'product'
  entity_id uuid,
  action text not null,
  detail text
);
create index if not exists activity_at_idx on public.activity(at desc);
alter table public.activity enable row level security;
drop policy if exists "admin read activity" on public.activity;
create policy "admin read activity" on public.activity for select using (public.is_admin());

create or replace function public.log_activity() returns trigger
language plpgsql security definer set search_path = public as $$
declare who text := (select email from auth.users where id = auth.uid());
begin
  if tg_table_name = 'orders' then
    if tg_op = 'INSERT' then
      insert into activity(actor_email, entity, entity_id, action, detail)
      values (who, 'order', new.id, 'Order placed', new.customer_name || ' · Rs. ' || round(new.total));
    elsif tg_op = 'UPDATE' then
      if new.status is distinct from old.status then
        insert into activity(actor_email, entity, entity_id, action, detail)
        values (who, 'order', new.id, 'Order ' || new.status, new.customer_name || ' · ' || coalesce(old.status, '') || ' → ' || new.status);
      end if;
      if new.payment_status is distinct from old.payment_status then
        insert into activity(actor_email, entity, entity_id, action, detail)
        values (who, 'order', new.id, 'Payment ' || new.payment_status, new.customer_name || ' · Rs. ' || round(new.total));
      end if;
    end if;
  elsif tg_table_name = 'products' then
    if tg_op = 'INSERT' then
      insert into activity(actor_email, entity, entity_id, action, detail) values (who, 'product', new.id, 'Product added', new.name);
    elsif tg_op = 'DELETE' then
      insert into activity(actor_email, entity, entity_id, action, detail) values (who, 'product', old.id, 'Product deleted', old.name);
      return old;
    elsif tg_op = 'UPDATE' then
      if new.stock is distinct from old.stock then
        insert into activity(actor_email, entity, entity_id, action, detail)
        values (who, 'product', new.id, 'Stock adjusted', new.name || ' · ' || coalesce(old.stock, 0) || ' → ' || coalesce(new.stock, 0));
      end if;
      if new.price is distinct from old.price then
        insert into activity(actor_email, entity, entity_id, action, detail)
        values (who, 'product', new.id, 'Price changed', new.name || ' · Rs. ' || round(old.price) || ' → Rs. ' || round(new.price));
      end if;
      if new.stock is not distinct from old.stock and new.price is not distinct from old.price then
        insert into activity(actor_email, entity, entity_id, action, detail) values (who, 'product', new.id, 'Product edited', new.name);
      end if;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists orders_activity on public.orders;
create trigger orders_activity after insert or update on public.orders for each row execute function public.log_activity();
drop trigger if exists products_activity on public.products;
create trigger products_activity after insert or update or delete on public.products for each row execute function public.log_activity();
