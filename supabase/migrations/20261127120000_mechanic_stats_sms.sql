-- Weekly-window listing statistics sent to mechanics by SMS (stats-sms function).
-- This migration sends nothing and schedules nothing: see docs/stats-sms.md.
begin;

-- Numbers that must never receive statistics SMS (9 digits, e.g. 555123456).
create table if not exists public.sms_opt_outs (
  phone text primary key check (phone ~ '^5[0-9]{8}$'),
  created_at timestamptz not null default now()
);

-- One row per phone per Tbilisi day. The unique key is what stops duplicates.
create table if not exists public.sms_log (
  id bigint generated always as identity primary key,
  mechanic_id uuid not null,
  phone text not null,
  sent_on date not null default ((now() at time zone 'Asia/Tbilisi')::date),
  views integer not null,
  calls integer not null,
  content text not null,
  status text not null default 'pending' check (status in ('pending','sent','failed','unknown')),
  provider_message_id text,
  error text,
  created_at timestamptz not null default now(),
  unique (phone, sent_on)
);

alter table public.sms_opt_outs enable row level security;
alter table public.sms_log enable row level security;

drop policy if exists "admins manage sms opt outs" on public.sms_opt_outs;
create policy "admins manage sms opt outs" on public.sms_opt_outs for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
drop policy if exists "admins read sms log" on public.sms_log;
create policy "admins read sms log" on public.sms_log for select to authenticated
  using (public.is_admin(auth.uid()));

revoke all on public.sms_opt_outs, public.sms_log from anon, authenticated;
grant select, insert, delete on public.sms_opt_outs to authenticated;
grant select on public.sms_log to authenticated;
grant select, insert, update, delete on public.sms_opt_outs, public.sms_log to service_role;

-- One row per phone: owners of active listings that were viewed in the period.
-- "views" = listing + profile page views, "calls" = clicks on the phone number.
-- The owner's own signed-in visits are not counted.
create or replace function public.get_mechanic_sms_stats(p_days integer default 7)
returns table (mechanic_id uuid, phone text, views integer, calls integer)
language sql stable security definer set search_path = public, pg_temp as $$
  with owners as (
    select p.id,
      regexp_replace(
        regexp_replace(coalesce(p.phone, ''), '[^0-9]', '', 'g'),
        '^(995|0)(5[0-9]{8})$', '\2'
      ) as phone
    from profiles p
    where exists (select 1 from mechanic_services s where s.mechanic_id = p.id and s.is_active)
  ),
  since as (select now() - make_interval(days => p_days) as ts),
  events as (
    select s.mechanic_id as owner_id, 1 as v, 0 as c
      from service_views e join mechanic_services s on s.id = e.service_id, since
      where s.is_active and e.created_at >= since.ts and e.viewer_id is distinct from s.mechanic_id
    union all
    select e.mechanic_id, 1, 0
      from mechanic_profile_views e, since
      where e.created_at >= since.ts and e.viewer_id is distinct from e.mechanic_id
    union all
    select s.mechanic_id, 0, 1
      from service_phone_views e join mechanic_services s on s.id = e.service_id, since
      where s.is_active and e.created_at >= since.ts and e.viewer_id is distinct from s.mechanic_id
    union all
    select e.mechanic_id, 0, 1
      from mechanic_phone_views e, since
      where e.created_at >= since.ts and e.viewer_id is distinct from e.mechanic_id
  )
  select (array_agg(o.id order by o.id))[1], o.phone, sum(e.v)::integer, sum(e.c)::integer
  from owners o join events e on e.owner_id = o.id
  where o.phone ~ '^5[0-9]{8}$'
    and not exists (select 1 from sms_opt_outs x where x.phone = o.phone)
  group by o.phone
  having sum(e.v) > 0
  order by o.phone;
$$;
revoke all on function public.get_mechanic_sms_stats(integer) from public, anon, authenticated;
grant execute on function public.get_mechanic_sms_stats(integer) to service_role;

commit;
