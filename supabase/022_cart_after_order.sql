-- =====================================================================
-- Fix: a cart save that arrives just after the order (fast checkout) must not open a new abandoned cart.
-- save_cart() now ignores phones that ordered in the last 15 minutes. Safe to run again.
-- =====================================================================
create or replace function public.save_cart(p_phone text, p_name text, p_city text, p_items jsonb, p_subtotal numeric)
returns void language plpgsql security definer set search_path = public as $$
declare ph text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
begin
  if length(ph) < 10 or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then return; end if;
  if exists (select 1 from orders where right(regexp_replace(phone, '\D', '', 'g'), 10) = ph and created_at > now() - interval '15 minutes') then return; end if;
  update abandoned_carts set name = left(coalesce(nullif(trim(p_name), ''), name), 80), city = left(coalesce(nullif(trim(p_city), ''), city), 80),
    items = p_items, subtotal = greatest(0, least(coalesce(p_subtotal, 0), 10000000)), updated_at = now()
  where phone_key = ph and status in ('open', 'contacted');
  if not found then
    insert into abandoned_carts (phone, name, city, items, subtotal)
    values (left(p_phone, 30), left(nullif(trim(p_name), ''), 80), left(nullif(trim(p_city), ''), 80), p_items, greatest(0, least(coalesce(p_subtotal, 0), 10000000)));
  end if;
end $$;
