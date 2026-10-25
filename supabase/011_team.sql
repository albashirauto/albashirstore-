-- =====================================================================
-- Al Bashir Autos: Team (owners + staff with permissions)
-- Safe to run again.
-- =====================================================================

alter table public.admins add column if not exists name text;
alter table public.admins add column if not exists username text;
alter table public.admins add column if not exists email text;
alter table public.admins add column if not exists phone text;
alter table public.admins add column if not exists role text default 'staff';          -- owner | staff
alter table public.admins add column if not exists permissions text[] default '{}';    -- admin sections staff may open, e.g. {/admin/orders}
alter table public.admins add column if not exists status text default 'active';      -- active | disabled
alter table public.admins add column if not exists title text;                         -- job title shown on About
alter table public.admins add column if not exists avatar text;
alter table public.admins add column if not exists show_on_about boolean default false;

-- everyone who was an admin before this feature is an owner
update public.admins set role = 'owner' where role is null or (role = 'staff' and not exists (select 1 from public.admins where role = 'owner'));
update public.admins a set email = u.email from auth.users u where u.id = a.user_id and a.email is null;
create unique index if not exists admins_username_key on public.admins (lower(username)) where username is not null;

-- a disabled member loses database access at once
create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.admins where user_id = auth.uid() and coalesce(status, 'active') = 'active');
$$;

create or replace function public.is_owner() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.admins where user_id = auth.uid() and role = 'owner' and coalesce(status, 'active') = 'active');
$$;

-- members read their own row (and admins the team list); only owners change the team
drop policy if exists "admin read admins" on public.admins;
create policy "admin read admins" on public.admins for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "owner manage admins" on public.admins;
create policy "owner manage admins" on public.admins for all using (public.is_owner()) with check (public.is_owner());

-- where "Forgot password" may send links (Team page)
insert into public.settings (key, value) values ('team_reset_email', ''), ('team_reset_email2', '') on conflict (key) do nothing;
