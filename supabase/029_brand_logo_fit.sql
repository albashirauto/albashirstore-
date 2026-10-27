-- =====================================================================
-- Al Bashir Autos: how a brand logo fills its box (Admin > Brands > Logo display)
-- stretch = fill the whole box (default) · cover = fill and crop · contain = original shape
-- Safe to run again.
-- =====================================================================
alter table public.brands add column if not exists logo_fit text default 'stretch';
