-- =====================================================================
-- Al Bashir Autos: redirects + 404 monitor (Admin > Redirects), Rank Math style.
-- * redirects: old path -> new path (301-style). Made automatically when a slug changes
--   (products, categories, brands, bikes, promotions, posts, pages) and by hand in admin.
-- * not_found_log: every missing path visitors hit, with count and referrer.
-- resolve_path() is called by the 404 page: returns the new path, or logs the miss. Safe to run again.
-- =====================================================================
create table if not exists public.redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null,
  to_path text not null,
  auto boolean not null default false,     -- made by a slug change
  hits int not null default 0,
  last_hit timestamptz,
  created_at timestamptz default now()
);
create unique index if not exists redirects_from_key on public.redirects (lower(from_path));
alter table public.redirects enable row level security;
drop policy if exists "admin manage redirects" on public.redirects;
create policy "admin manage redirects" on public.redirects for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.not_found_log (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  referrer text,
  hits int not null default 1,
  first_seen timestamptz default now(),
  last_seen timestamptz default now()
);
create unique index if not exists not_found_path_key on public.not_found_log (lower(path));
alter table public.not_found_log enable row level security;
drop policy if exists "admin manage 404" on public.not_found_log;
create policy "admin manage 404" on public.not_found_log for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.resolve_path(p_path text, p_ref text default null)
returns text language plpgsql security definer set search_path = public as $$
declare
  p text := left(regexp_replace(split_part(coalesce(p_path, ''), '?', 1), '/+$', ''), 300);
  t text;
begin
  if p = '' or p !~ '^/' or p ~ '^/(_next|api|admin)(/|$)' then return null; end if;
  update redirects set hits = hits + 1, last_hit = now() where lower(from_path) = lower(p) returning to_path into t;
  if t is not null then return t; end if;
  insert into not_found_log (path, referrer) values (p, nullif(left(coalesce(p_ref, ''), 300), ''))
  on conflict (lower(path)) do update set hits = not_found_log.hits + 1, last_seen = now(),
    referrer = coalesce(nullif(left(coalesce(excluded.referrer, ''), 300), ''), not_found_log.referrer);
  return null;
end $$;
revoke all on function public.resolve_path(text, text) from public;
grant execute on function public.resolve_path(text, text) to anon, authenticated;

-- old web address -> new one when a slug changes (and keep chains short, never a loop)
create or replace function public.redirect_on_slug() returns trigger
language plpgsql security definer set search_path = public as $$
declare base text := tg_argv[0]; o text; n text;
begin
  if new.slug is not distinct from old.slug or old.slug is null or new.slug is null then return new; end if;
  o := base || old.slug; n := base || new.slug;
  delete from redirects where lower(from_path) = lower(n);
  update redirects set to_path = n where lower(to_path) = lower(o);
  insert into redirects (from_path, to_path, auto) values (o, n, true)
  on conflict (lower(from_path)) do update set to_path = excluded.to_path, auto = true;
  delete from not_found_log where lower(path) = lower(o);
  return new;
end $$;

do $$
declare r record;
begin
  for r in select * from (values ('products', '/products/'), ('categories', '/collections/'), ('brands', '/brands/'), ('vehicles', '/vehicles/'),
                                 ('promotions', '/promotions/'), ('posts', '/blog/'), ('pages', '/pages/')) as v(t, base) loop
    execute format('drop trigger if exists %I on public.%I', r.t || '_slug_redirect', r.t);
    execute format('create trigger %I after update of slug on public.%I for each row execute function public.redirect_on_slug(%L)', r.t || '_slug_redirect', r.t, r.base);
  end loop;
end $$;
