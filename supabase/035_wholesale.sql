-- =====================================================================
-- Al Bashir Autos: wholesale / dealer enquiries (/wholesale)
-- Visitors submit through submit_wholesale() only (checked here, max 3 a day per phone).
-- Admins see and follow them up in Admin > Wholesale enquiries.
-- An email goes to everyone who gets "Wholesale enquiries" in Admin > Notifications.
-- Safe to run again.
-- =====================================================================

create table if not exists public.wholesale_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business text,
  phone text not null,
  city text,
  business_type text,                -- shop | workshop | dealer | fleet | other
  interests text,                    -- what they want to buy (comma list)
  volume text,                       -- rough monthly order size
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'won', 'closed')),
  notes text,                        -- private, for the shop
  created_at timestamptz default now()
);
create index if not exists wholesale_enquiries_created_idx on public.wholesale_enquiries (created_at desc);

alter table public.wholesale_enquiries enable row level security;
drop policy if exists "admin manage wholesale" on public.wholesale_enquiries;
create policy "admin manage wholesale" on public.wholesale_enquiries for all using (public.is_admin()) with check (public.is_admin());
revoke all on public.wholesale_enquiries from anon;

create or replace function public.submit_wholesale(p_name text, p_business text, p_phone text, p_city text, p_type text, p_interests text, p_volume text, p_message text)
returns text language plpgsql security definer set search_path = public as $$
declare
  ph text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
begin
  if length(trim(coalesce(p_name, ''))) < 2 then return 'Please enter your name.'; end if;
  if length(ph) < 10 then return 'Please enter a working phone number.'; end if;
  if (select count(*) from wholesale_enquiries where right(regexp_replace(phone, '\D', '', 'g'), 10) = ph and created_at > now() - interval '1 day') >= 3 then
    return 'We already have your enquiry. We will call you soon.';
  end if;
  insert into wholesale_enquiries (name, business, phone, city, business_type, interests, volume, message)
  values (left(trim(p_name), 80), nullif(left(trim(coalesce(p_business, '')), 120), ''), left(trim(p_phone), 30), nullif(left(trim(coalesce(p_city, '')), 60), ''),
          nullif(left(coalesce(p_type, ''), 20), ''), nullif(left(coalesce(p_interests, ''), 400), ''), nullif(left(coalesce(p_volume, ''), 60), ''), nullif(left(trim(coalesce(p_message, '')), 2000), ''));
  return 'ok';
end $$;
grant execute on function public.submit_wholesale(text, text, text, text, text, text, text, text) to anon, authenticated;

-- email alert (same sender as order emails)
create or replace function public.notify_wholesale() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_send('wholesale', new.id);
  return new;
end $$;
drop trigger if exists wholesale_notify on public.wholesale_enquiries;
create trigger wholesale_notify after insert on public.wholesale_enquiries for each row execute function public.notify_wholesale();

-- people who get new-order emails also get wholesale enquiries
update public.notify_recipients set events = array_append(events, 'wholesale') where 'new_order' = any(events) and not ('wholesale' = any(events));
alter table public.notify_recipients alter column events set default '{new_order,order_status,payment,stock,wholesale}';

-- FAQ: how-to questions first; bulk buyers go to the wholesale page
update public.faqs set sort_order = 14 where question = 'Can I order on WhatsApp instead of the website?';
update public.faqs set sort_order = 15, answer = 'Yes. Many parts have “buy X get Y free” schemes (see the Deal zone), and we can quote special prices for shops, workshops and dealers buying in bulk. Send a wholesale enquiry from the Wholesale page and we will call you.'
  where question = 'Do you have bulk schemes for workshops?';
