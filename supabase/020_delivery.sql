-- =====================================================================
-- Al Bashir Autos: delivery by area + collect from shop (Admin > Settings > Delivery & payments).
-- The rules live in settings (shipping_flat, shipping_free_over, shipping_zones, pickup_enabled, pickup_note);
-- each order remembers whether it is delivered or collected. Safe to run again.
-- =====================================================================
alter table public.orders add column if not exists delivery_method text not null default 'delivery';  -- delivery | pickup
insert into public.settings (key, value) values ('shipping_free_over', ''), ('shipping_zones', '[]'), ('pickup_enabled', ''), ('pickup_note', '')
on conflict (key) do nothing;
