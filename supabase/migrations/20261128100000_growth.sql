-- VIP call list, driver requests and VIP expiry reminders.
begin;

-- 2. Whom to call about VIP -------------------------------------------------
create table if not exists public.vip_outreach (
  mechanic_id uuid primary key,
  status text not null check (status in ('called', 'rejected')),
  updated_at timestamptz not null default now()
);
alter table public.vip_outreach enable row level security;
drop policy if exists "admins manage vip outreach" on public.vip_outreach;
create policy "admins manage vip outreach" on public.vip_outreach for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
revoke all on public.vip_outreach from anon, authenticated;
grant select, insert, update, delete on public.vip_outreach to authenticated;

-- Owners of active listings without an active VIP, the most contacted first.
-- Anonymous crawlers (25+ different targets within 10 minutes, or 500+ views
-- with almost no clicks) are left out, as in the analytics overview.
create or replace function public.get_vip_call_list(p_days integer default 30)
returns table (mechanic_id uuid, name text, phone text, views bigint, clicks bigint, listings bigint, status text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not coalesce(public.is_admin(auth.uid()), false) then
    raise insufficient_privilege using message = 'Administrator access required';
  end if;
  return query
  with raw as (
    select 'v' as kind, e.created_at, s.mechanic_id as owner, 's' || e.service_id as target, coalesce(e.user_agent, '') as agent, e.viewer_id
      from service_views e join mechanic_services s on s.id = e.service_id where e.created_at > now() - make_interval(days => p_days)
    union all
    select 'c', e.created_at, s.mechanic_id, 's' || e.service_id, coalesce(e.user_agent, ''), e.viewer_id
      from service_phone_views e join mechanic_services s on s.id = e.service_id where e.created_at > now() - make_interval(days => p_days)
    union all
    select 'v', m.created_at, m.mechanic_id, 'm' || m.mechanic_id, coalesce(m.user_agent, ''), m.viewer_id
      from mechanic_profile_views m where m.created_at > now() - make_interval(days => p_days)
    union all
    select 'c', c.created_at, c.mechanic_id, 'm' || c.mechanic_id, coalesce(c.user_agent, ''), c.viewer_id
      from mechanic_phone_views c where c.created_at > now() - make_interval(days => p_days)
  ),
  bursts as (
    select agent, date_bin('10 minutes', created_at, timestamptz '2026-01-01 00:00+00') as bucket
    from raw where viewer_id is null group by 1, 2 having count(distinct target) >= 25
  ),
  sweepers as (
    select agent from raw where viewer_id is null and agent <> '' group by agent
    having count(*) filter (where kind = 'v') >= 500
      and count(*) filter (where kind = 'c') * 100 < count(*) filter (where kind = 'v')
  ),
  events as (
    select r.owner, r.kind from raw r
    where r.viewer_id is distinct from r.owner
      and not (r.viewer_id is null and (
        exists (select 1 from bursts b where b.agent = r.agent
          and b.bucket = date_bin('10 minutes', r.created_at, timestamptz '2026-01-01 00:00+00'))
        or exists (select 1 from sweepers w where w.agent = r.agent)))
  ),
  totals as (
    select owner, count(*) filter (where kind = 'v') as views, count(*) filter (where kind = 'c') as clicks
    from events group by owner
  ),
  owners as (
    select s.mechanic_id as owner, count(*) filter (where s.is_active) as listings,
      bool_or(coalesce(s.is_vip_active, false) and (s.vip_until is null or s.vip_until > now())) as vip
    from mechanic_services s group by s.mechanic_id
  )
  select p.id, btrim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), p.phone::text,
    t.views, t.clicks, o.listings, x.status
  from totals t
  join owners o on o.owner = t.owner and o.listings > 0 and not o.vip
  join profiles p on p.id = t.owner and coalesce(p.phone, '') <> ''
  left join vip_outreach x on x.mechanic_id = p.id
  order by t.clicks desc, t.views desc, p.id
  limit 60;
end;
$$;
revoke all on function public.get_vip_call_list(integer) from public, anon;
grant execute on function public.get_vip_call_list(integer) to authenticated;

-- 5. Driver requests ---------------------------------------------------------
create table if not exists public.driver_requests (
  id bigint generated always as identity primary key,
  phone text not null check (phone ~ '^5[0-9]{8}$'),
  city text not null,
  car text,
  problem text not null,
  status text not null default 'new' check (status in ('new', 'sent', 'closed')),
  created_at timestamptz not null default now()
);
create index if not exists driver_requests_created_idx on public.driver_requests (created_at desc);
create table if not exists public.driver_request_sends (
  request_id bigint not null references public.driver_requests(id) on delete cascade,
  phone text not null,
  mechanic_id uuid,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  primary key (request_id, phone)
);
alter table public.driver_requests enable row level security;
alter table public.driver_request_sends enable row level security;
drop policy if exists "admins read driver requests" on public.driver_requests;
create policy "admins read driver requests" on public.driver_requests for select to authenticated
  using (public.is_admin(auth.uid()));
drop policy if exists "admins change driver requests" on public.driver_requests;
create policy "admins change driver requests" on public.driver_requests for update to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
drop policy if exists "admins read driver request sends" on public.driver_request_sends;
create policy "admins read driver request sends" on public.driver_request_sends for select to authenticated
  using (public.is_admin(auth.uid()));
revoke all on public.driver_requests, public.driver_request_sends from anon, authenticated;
grant select, update on public.driver_requests to authenticated;
grant select on public.driver_request_sends to authenticated;
grant select, insert, update on public.driver_requests, public.driver_request_sends to service_role;

-- Visitors can only submit; the function validates and limits floods.
create or replace function public.submit_driver_request(p_phone text, p_city text, p_problem text, p_car text default null)
returns bigint
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_phone text := regexp_replace(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), '^(995|0)(5[0-9]{8})$', '\2');
  v_city text := btrim(coalesce(p_city, ''));
  v_problem text := btrim(coalesce(p_problem, ''));
  v_car text := nullif(btrim(coalesce(p_car, '')), '');
  v_id bigint;
begin
  if v_phone !~ '^5[0-9]{8}$' then raise exception 'invalid_phone'; end if;
  if length(v_city) not between 2 and 60 then raise exception 'invalid_city'; end if;
  if length(v_problem) not between 5 and 500 then raise exception 'invalid_problem'; end if;
  if length(v_car) > 80 then raise exception 'invalid_car'; end if;
  -- A repeated tap is the same request.
  select id into v_id from driver_requests
    where phone = v_phone and problem = v_problem and created_at > now() - interval '10 minutes' limit 1;
  if v_id is not null then return v_id; end if;
  if (select count(*) from driver_requests where phone = v_phone and created_at > now() - interval '1 day') >= 3
    or (select count(*) from driver_requests where created_at > now() - interval '1 hour') >= 60 then
    raise exception 'too_many_requests';
  end if;
  insert into driver_requests (phone, city, car, problem) values (v_phone, v_city, v_car, v_problem) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.submit_driver_request(text, text, text, text) from public;
grant execute on function public.submit_driver_request(text, text, text, text) to anon, authenticated;

-- 1. VIP expiry reminders ----------------------------------------------------
-- Listings whose VIP ends within 3 days, with what they got during the last 30 days.
create or replace function public.get_vip_expiry_recipients()
returns table (service_id integer, phone text, ends_on date, views bigint, calls bigint)
language sql stable security definer set search_path = public, pg_temp as $$
  with due as (
    select s.id, s.mechanic_id, (s.vip_until at time zone 'Asia/Tbilisi')::date as ends_on,
      regexp_replace(regexp_replace(coalesce(p.phone, ''), '[^0-9]', '', 'g'), '^(995|0)(5[0-9]{8})$', '\2') as phone
    from mechanic_services s join profiles p on p.id = s.mechanic_id
    where s.is_active and s.is_vip_active and s.vip_until > now() and s.vip_until <= now() + interval '3 days'
  )
  select d.id, d.phone, d.ends_on,
    (select count(*) from service_views v where v.service_id = d.id and v.created_at > now() - interval '30 days'
      and v.viewer_id is distinct from d.mechanic_id),
    (select count(*) from service_phone_views c where c.service_id = d.id and c.created_at > now() - interval '30 days'
      and c.viewer_id is distinct from d.mechanic_id)
  from due d
  where d.phone ~ '^5[0-9]{8}$' and not exists (select 1 from sms_opt_outs z where z.phone = d.phone)
  order by d.id;
$$;
revoke all on function public.get_vip_expiry_recipients() from public, anon, authenticated;
grant execute on function public.get_vip_expiry_recipients() to service_role;

commit;
