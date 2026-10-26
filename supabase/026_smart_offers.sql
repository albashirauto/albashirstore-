-- =====================================================================
-- Al Bashir Autos: smart offers + automatic best sellers.
-- An offer (promotion) can fill itself by a rule, so new products join on their own:
--   manual        only products assigned to it in the product form (as before)
--   under_price   price <= rule_value              (e.g. Under Rs. 999)
--   min_discount  at least rule_value % off         (e.g. Half Price Sale = 50)
--   scheme        has a bulk scheme (buy X get Y free)
--   new           added in the last rule_value days
--   best_sellers  most sold in the last rule_value days (from real orders)
-- Hand-assigned products always show too. Safe to run again.
-- =====================================================================
alter table public.promotions add column if not exists rule text not null default 'manual';
alter table public.promotions add column if not exists rule_value numeric;
alter table public.promotions drop constraint if exists promotions_rule_check;
alter table public.promotions add constraint promotions_rule_check check (rule in ('manual', 'under_price', 'min_discount', 'scheme', 'new', 'best_sellers'));

-- the starter offers get the rule their name promises (only if still manual)
update public.promotions set rule = 'under_price', rule_value = 999 where slug = 'under-999' and rule = 'manual';
update public.promotions set rule = 'min_discount', rule_value = 50 where slug = 'half-price-sale' and rule = 'manual';
update public.promotions set rule = 'min_discount', rule_value = 30 where slug = '30-off-sale' and rule = 'manual';
update public.promotions set rule = 'best_sellers', rule_value = 30 where slug = 'trending' and rule = 'manual';

-- best sellers for the website: product ids + pieces sold only (no customer data)
create or replace function public.best_sellers(p_days int default 30, p_limit int default 12)
returns table (product_id uuid, sold bigint) language sql stable security definer set search_path = public as $$
  select (i->>'id')::uuid as product_id, sum((i->>'qty')::int + coalesce((i->>'free')::int, 0))::bigint as sold
  from orders o, jsonb_array_elements(o.items) i
  where o.created_at > now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 3650)))
    and coalesce(o.status, 'new') not in ('cancelled', 'returned')
    and i->>'id' ~ '^[0-9a-f-]{36}$'
  group by 1
  order by 2 desc
  limit greatest(1, least(coalesce(p_limit, 12), 100));
$$;
revoke all on function public.best_sellers(int, int) from public;
grant execute on function public.best_sellers(int, int) to anon, authenticated;
