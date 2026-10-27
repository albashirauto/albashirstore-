-- =====================================================================
-- Al Bashir Autos: storage limit
-- Settings (Admin > Settings > Storage & uploads):
--   storage_limit_mb  total space for pictures (Supabase free plan = 1024 MB)
--   storage_warn_pct  show a warning from this % used
--   upload_max_mb     each picture is compressed to fit under this
--   image_max_px      longest side of an uploaded picture
-- The database refuses new files once the limit is reached.
-- Safe to run again.
-- =====================================================================

insert into public.settings (key, value) values
  ('storage_limit_mb', '1024'),
  ('storage_warn_pct', '80'),
  ('upload_max_mb', '1'),
  ('image_max_px', '1600')
on conflict (key) do nothing;

-- Space used by every bucket (admins only)
create or replace function public.storage_usage() returns json
language sql stable security definer set search_path = public, storage as $$
  select case when public.is_admin() then json_build_object(
    'bytes', coalesce(sum((o.metadata->>'size')::bigint), 0),
    'files', count(o.id)
  ) end
  from storage.objects o;
$$;
grant execute on function public.storage_usage() to authenticated;

-- Pictures only, 10 MB hard cap per file (the admin compresses well below this)
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/*']
where id = 'media';

-- Refuse new files when the limit is reached
create or replace function public.storage_guard() returns trigger
language plpgsql security definer set search_path = public, storage as $$
declare
  lim bigint := coalesce((select nullif(value, '')::numeric from public.settings where key = 'storage_limit_mb'), 0) * 1048576;
  used bigint;
begin
  if lim <= 0 then return new; end if;
  select coalesce(sum((metadata->>'size')::bigint), 0) into used from storage.objects;
  if used >= lim then
    raise exception 'Storage is full (% MB of % MB used). Delete unused pictures in Admin > Media, or raise the limit in Settings.',
      round(used / 1048576.0), round(lim / 1048576.0);
  end if;
  return new;
end $$;

do $$ begin
  drop trigger if exists storage_guard on storage.objects;
  create trigger storage_guard before insert on storage.objects for each row execute function public.storage_guard();
exception when insufficient_privilege then
  raise notice 'storage_guard trigger skipped (no permission); the admin upload check still applies';
end $$;
