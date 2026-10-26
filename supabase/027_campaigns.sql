-- =====================================================================
-- Al Bashir Autos: campaigns = popups, top bars, home hero banners, floating badges (Admin > Campaigns).
-- content / design / rules are JSON so the builder can grow without new columns.
-- Visitors read only live campaigns (active + inside the schedule); views / clicks / closes are counted
-- through track_campaign() (no direct writes). Safe to run again.
-- =====================================================================
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'popup' check (kind in ('popup', 'topbar', 'hero', 'badge')),
  template text not null default 'custom',
  status text not null default 'draft' check (status in ('draft', 'active', 'paused')),
  priority int not null default 10,                  -- higher wins when several could show
  starts_at timestamptz,
  ends_at timestamptz,
  content jsonb not null default '{}',               -- badge, headline, sub, button, link, code, products, image…
  design jsonb not null default '{}',                -- colours, pattern, fonts, size, animation…
  rules jsonb not null default '{}',                 -- pages, devices, trigger, frequency, countdown…
  views int not null default 0,
  clicks int not null default 0,
  closes int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz
);
create index if not exists campaigns_live_idx on public.campaigns (status, kind, priority desc);

alter table public.campaigns enable row level security;
drop policy if exists "public read live campaigns" on public.campaigns;
create policy "public read live campaigns" on public.campaigns for select
  using ((status = 'active' and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())) or public.is_admin());
drop policy if exists "admin manage campaigns" on public.campaigns;
create policy "admin manage campaigns" on public.campaigns for all using (public.is_admin()) with check (public.is_admin());

-- daily numbers for the Stats view
create table if not exists public.campaign_stats (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  day date not null default (now() at time zone 'Asia/Karachi')::date,
  views int not null default 0, clicks int not null default 0, closes int not null default 0,
  primary key (campaign_id, day)
);
alter table public.campaign_stats enable row level security;
drop policy if exists "admin read campaign stats" on public.campaign_stats;
create policy "admin read campaign stats" on public.campaign_stats for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.track_campaign(p_id uuid, p_kind text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_kind not in ('view', 'click', 'close') then return; end if;
  if not exists (select 1 from campaigns where id = p_id and status = 'active') then return; end if;
  update campaigns set views = views + (p_kind = 'view')::int, clicks = clicks + (p_kind = 'click')::int, closes = closes + (p_kind = 'close')::int where id = p_id;
  insert into campaign_stats (campaign_id, views, clicks, closes) values (p_id, (p_kind = 'view')::int, (p_kind = 'click')::int, (p_kind = 'close')::int)
  on conflict (campaign_id, day) do update set views = campaign_stats.views + excluded.views, clicks = campaign_stats.clicks + excluded.clicks, closes = campaign_stats.closes + excluded.closes;
end $$;
revoke all on function public.track_campaign(uuid, text) from public;
grant execute on function public.track_campaign(uuid, text) to anon, authenticated;

-- a ready "Welcome" popup, switched off (turn it on in Admin > Campaigns)
insert into public.campaigns (name, kind, template, status, priority, content, design, rules)
select 'Welcome', 'popup', 'welcome', 'draft', 10,
  '{"badge":"خوش آمدید","headline":"Welcome to Al Bashir Autos","sub":"Genuine spare parts for motorcycles, rickshaws, loaders and cycles, delivered across Pakistan.","button":"Start shopping","link":"/shop"}',
  '{"preset":"welcome"}', '{"pages":"all","trigger":"delay","delay":3,"frequency":"day"}'
where not exists (select 1 from public.campaigns);
