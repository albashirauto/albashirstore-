-- =====================================================================
-- Al Bashir Autos: Awards & rewards (home page strip + /awards page)
-- Safe to run again.
-- =====================================================================

create table if not exists public.awards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image text,                         -- photo of the award / certificate / trophy
  given_by text,                      -- e.g. Honda Atlas, Pakistan Auto Parts Assn.
  year text,
  caption text,
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

alter table public.awards enable row level security;
drop policy if exists "public read" on public.awards;
create policy "public read" on public.awards for select using (active = true or public.is_admin());
drop policy if exists "admin write" on public.awards;
create policy "admin write" on public.awards for all using (public.is_admin()) with check (public.is_admin());
