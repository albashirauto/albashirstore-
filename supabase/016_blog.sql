-- =====================================================================
-- Al Bashir Autos: WordPress-style blog (Admin > Blog).
-- Category + tags, featured (sticky) post, cover alt text, trash (soft delete),
-- Rank Math-style extras: schema type, noindex, canonical, social title / text / image.
-- Status: trash = deleted_at set · draft = active false · scheduled = published_at in the future · else published.
-- Safe to run again.
-- =====================================================================
alter table public.posts add column if not exists category text;
alter table public.posts add column if not exists tags text[] not null default '{}';
alter table public.posts add column if not exists cover_alt text;
alter table public.posts add column if not exists featured boolean not null default false;
alter table public.posts add column if not exists deleted_at timestamptz;
alter table public.posts add column if not exists schema_type text not null default 'BlogPosting';  -- BlogPosting | Article | NewsArticle
alter table public.posts add column if not exists noindex boolean not null default false;
alter table public.posts add column if not exists canonical_url text;
alter table public.posts add column if not exists og_title text;
alter table public.posts add column if not exists og_description text;
alter table public.posts add column if not exists og_image text;
alter table public.posts add column if not exists updated_at timestamptz;

-- visitors never see drafts or posts in the trash
drop policy if exists "public read" on public.posts;
create policy "public read" on public.posts for select using ((active = true and deleted_at is null) or public.is_admin());

create index if not exists posts_category_idx on public.posts (category) where deleted_at is null;
