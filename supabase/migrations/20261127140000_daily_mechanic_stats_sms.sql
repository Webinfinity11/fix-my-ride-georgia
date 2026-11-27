-- Previous calendar day in Asia/Tbilisi; only phones with at least one click.
-- Existing weekly RPC is retained for compatibility; stats-sms uses this daily RPC.
begin;

create or replace function public.get_mechanic_daily_sms_stats()
returns table (mechanic_id uuid, phone text, views integer, calls integer, display_id integer)
language sql stable security definer set search_path = public, pg_temp as $$
  with owners as (
    select p.id, m.display_id,
      regexp_replace(
        regexp_replace(coalesce(p.phone, ''), '[^0-9]', '', 'g'),
        '^(995|0)(5[0-9]{8})$', '\2'
      ) as phone
    from profiles p left join mechanic_profiles m on m.id = p.id
    where exists (select 1 from mechanic_services s where s.mechanic_id = p.id and s.is_active)
  ),
  since as (select ((now() at time zone 'Asia/Tbilisi')::date - 1)::timestamp at time zone 'Asia/Tbilisi' as ts, ((now() at time zone 'Asia/Tbilisi')::date)::timestamp at time zone 'Asia/Tbilisi' as until_ts),
  events as (
    select s.mechanic_id as owner_id, 1 as v, 0 as c
      from service_views e join mechanic_services s on s.id = e.service_id, since
      where s.is_active and e.created_at >= since.ts and e.created_at < since.until_ts and e.viewer_id is distinct from s.mechanic_id
    union all
    select e.mechanic_id, 1, 0
      from mechanic_profile_views e, since
      where e.created_at >= since.ts and e.created_at < since.until_ts and e.viewer_id is distinct from e.mechanic_id
    union all
    select s.mechanic_id, 0, 1
      from service_phone_views e join mechanic_services s on s.id = e.service_id, since
      where s.is_active and e.created_at >= since.ts and e.created_at < since.until_ts and e.viewer_id is distinct from s.mechanic_id
    union all
    select e.mechanic_id, 0, 1
      from mechanic_phone_views e, since
      where e.created_at >= since.ts and e.created_at < since.until_ts and e.viewer_id is distinct from e.mechanic_id
  )
  select (array_agg(o.id order by o.id))[1], o.phone, sum(e.v)::integer, sum(e.c)::integer, (array_agg(o.display_id order by o.id))[1]
  from owners o join events e on e.owner_id = o.id
  where o.phone ~ '^5[0-9]{8}$'
    and not exists (select 1 from sms_opt_outs x where x.phone = o.phone)
  group by o.phone
  having sum(e.c) >= 1
  order by o.phone;
$$;
revoke all on function public.get_mechanic_daily_sms_stats() from public, anon, authenticated;
grant execute on function public.get_mechanic_daily_sms_stats() to service_role;


commit;
