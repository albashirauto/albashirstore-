-- =====================================================================
-- Al Bashir Autos: "Request a part" (/request-part)
-- A customer who can't find a part leaves the part and their phone; the shop calls back.
-- Visitors submit through submit_part_request() only (max 5 a day per phone).
-- Admins follow up in Admin > Part requests. Email: "Part requests" in Admin > Notifications.
-- Safe to run again.
-- =====================================================================

create table if not exists public.part_requests (
  id uuid primary key default gen_random_uuid(),
  part text not null,                -- what they need
  vehicle text,                      -- bike / rickshaw model
  details text,                      -- part number, quantity, notes
  name text not null,
  phone text not null,
  city text,
  status text not null default 'new' check (status in ('new', 'quoted', 'done', 'unavailable')),
  notes text,                        -- private, for the shop
  created_at timestamptz default now()
);
create index if not exists part_requests_created_idx on public.part_requests (created_at desc);

alter table public.part_requests enable row level security;
drop policy if exists "admin manage part requests" on public.part_requests;
create policy "admin manage part requests" on public.part_requests for all using (public.is_admin()) with check (public.is_admin());
revoke all on public.part_requests from anon;

create or replace function public.submit_part_request(p_part text, p_vehicle text, p_details text, p_name text, p_phone text, p_city text)
returns text language plpgsql security definer set search_path = public as $$
declare
  ph text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
begin
  if length(trim(coalesce(p_part, ''))) < 2 then return 'Please write which part you need.'; end if;
  if length(trim(coalesce(p_name, ''))) < 2 then return 'Please enter your name.'; end if;
  if length(ph) < 10 then return 'Please enter a working phone number.'; end if;
  if (select count(*) from part_requests where right(regexp_replace(phone, '\D', '', 'g'), 10) = ph and created_at > now() - interval '1 day') >= 5 then
    return 'We already have your requests. We will call you soon.';
  end if;
  insert into part_requests (part, vehicle, details, name, phone, city)
  values (left(trim(p_part), 120), nullif(left(trim(coalesce(p_vehicle, '')), 80), ''), nullif(left(trim(coalesce(p_details, '')), 1500), ''),
          left(trim(p_name), 80), left(trim(p_phone), 30), nullif(left(trim(coalesce(p_city, '')), 60), ''));
  return 'ok';
end $$;
grant execute on function public.submit_part_request(text, text, text, text, text, text) to anon, authenticated;

create or replace function public.notify_part_request() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_send('part_request', new.id);
  return new;
end $$;
drop trigger if exists part_requests_notify on public.part_requests;
create trigger part_requests_notify after insert on public.part_requests for each row execute function public.notify_part_request();

-- people who get new-order emails also get part requests
update public.notify_recipients set events = array_append(events, 'part_request') where 'new_order' = any(events) and not ('part_request' = any(events));
alter table public.notify_recipients alter column events set default '{new_order,order_status,payment,stock,wholesale,part_request}';

-- FAQ: point "not on the website" to the request form
update public.faqs set answer = 'We have many more parts in the shop than online. Use Request a part (at the bottom of every page, or when a search finds nothing) and we will call you with stock and price. You can also send a photo on WhatsApp.'
where question = 'A part I need is not on the website.';
