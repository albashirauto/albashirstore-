-- =====================================================================
-- Al Bashir Autos: orders keep province + district next to the city (checkout Province -> District -> City).
-- Safe to run again.
-- =====================================================================
alter table public.orders add column if not exists province text;
alter table public.orders add column if not exists district text;

-- tracking page shows "from Haveli Lakha, Okara"
create or replace function public.track_order(p_no text, p_phone text) returns json
language plpgsql stable security definer set search_path = public as $$
declare
  no text := upper(regexp_replace(coalesce(p_no, ''), '[^0-9A-Za-z]', '', 'g'));
  ph text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  o public.orders;
begin
  if length(no) <> 8 or length(ph) < 10 then return null; end if;
  select * into o from public.orders
   where upper(left(id::text, 8)) = no
     and right(regexp_replace(phone, '\D', '', 'g'), 10) = ph
   order by created_at desc limit 1;
  if not found then return null; end if;
  return json_build_object(
    'no', no,
    'name', split_part(trim(o.customer_name), ' ', 1),
    'city', concat_ws(', ', o.city, nullif(o.district, o.city)),
    'status', coalesce(o.status, 'new'),
    'reason', o.status_reason,
    'courier', o.courier,
    'tracking_no', o.tracking_no,
    'payment_method', o.payment_method,
    'payment_status', coalesce(o.payment_status, 'unpaid'),
    'total', o.total,
    'items', (select coalesce(json_agg(json_build_object('name', i->>'name', 'qty', (i->>'qty')::int, 'free', coalesce((i->>'free')::int, 0))), '[]'::json)
              from jsonb_array_elements(o.items) i),
    'created_at', o.created_at,
    'dispatched_at', o.dispatched_at,
    'updated_at', o.updated_at
  );
end $$;
