-- =====================================================================
-- Al Bashir Autos: order details (cancel reason, courier, tracking) + better activity lines
-- Run AFTER 002_dashboard.sql. Safe to run again.
-- =====================================================================

alter table public.orders add column if not exists status_reason text;      -- why it was cancelled / returned
alter table public.orders add column if not exists courier text;            -- TCS, Leopards, M&P, PostEx…
alter table public.orders add column if not exists tracking_no text;
alter table public.orders add column if not exists dispatched_at timestamptz;
alter table public.orders add column if not exists updated_at timestamptz;

-- activity log: include the reason / courier, and log edits and deletes
create or replace function public.log_activity() returns trigger
language plpgsql security definer set search_path = public as $$
declare who text := (select email from auth.users where id = auth.uid());
begin
  if tg_table_name = 'orders' then
    if tg_op = 'INSERT' then
      insert into activity(actor_email, entity, entity_id, action, detail)
      values (who, 'order', new.id, 'Order placed', new.customer_name || ' · Rs. ' || round(new.total));
    elsif tg_op = 'DELETE' then
      insert into activity(actor_email, entity, entity_id, action, detail)
      values (who, 'order', old.id, 'Order deleted', old.customer_name || ' · Rs. ' || round(old.total));
      return old;
    elsif tg_op = 'UPDATE' then
      if new.status is distinct from old.status then
        insert into activity(actor_email, entity, entity_id, action, detail)
        values (who, 'order', new.id, 'Order ' || new.status,
          new.customer_name || ' · ' || coalesce(old.status, '') || ' → ' || new.status
          || coalesce(' · ' || nullif(new.status_reason, ''), '')
          || case when new.status = 'shipped' then coalesce(' · ' || new.courier, '') || coalesce(' ' || new.tracking_no, '') else '' end);
      elsif new.payment_status is distinct from old.payment_status then
        insert into activity(actor_email, entity, entity_id, action, detail)
        values (who, 'order', new.id, 'Payment ' || new.payment_status, new.customer_name || ' · Rs. ' || round(new.total));
      elsif new.items is distinct from old.items or new.total is distinct from old.total or new.address is distinct from old.address then
        insert into activity(actor_email, entity, entity_id, action, detail)
        values (who, 'order', new.id, 'Order edited', new.customer_name || ' · Rs. ' || round(old.total) || ' → Rs. ' || round(new.total));
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
        insert into activity(actor_email, entity, entity_id, action, detail) values (who, 'product', new.id,
          case when new.active is distinct from old.active then (case when new.active then 'Product shown' else 'Product hidden' end) else 'Product edited' end, new.name);
      end if;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists orders_activity on public.orders;
create trigger orders_activity after insert or update or delete on public.orders for each row execute function public.log_activity();
