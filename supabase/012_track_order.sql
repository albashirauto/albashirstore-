-- =====================================================================
-- Al Bashir Autos: public "Track my order" lookup.
-- Customers can't read the orders table. This function returns ONE order, only when
-- the order number (first 8 characters shown on the receipt) AND the phone both match,
-- and only safe fields (no address, no full phone, no notes). Safe to run again.
-- =====================================================================

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
    'city', o.city,
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

revoke all on function public.track_order(text, text) from public;
grant execute on function public.track_order(text, text) to anon, authenticated;
