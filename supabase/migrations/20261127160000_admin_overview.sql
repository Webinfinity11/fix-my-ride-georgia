-- Admin analytics overview: exact server-side aggregates over the whole period
-- (no event-feed cap), grouped by Tbilisi calendar days. The previous period is
-- cut at the same elapsed time, so an unfinished day is compared fairly.
-- Read-only; adds one function.
create or replace function public.get_admin_overview(p_from date, p_to date)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_len integer := p_to - p_from + 1;
  v_start timestamptz := p_from::timestamp at time zone 'Asia/Tbilisi';
  v_end timestamptz := least((p_to + 1)::timestamp at time zone 'Asia/Tbilisi', now());
  v_result jsonb;
begin
  if not coalesce(public.is_admin(auth.uid()), false) then
    raise insufficient_privilege using message = 'Administrator access required';
  end if;
  if v_len is null or v_len not between 1 and 400 then
    raise exception 'Period must be between 1 and 400 days';
  end if;

  with raw as (
    select 'sv' as kind, created_at, service_id from service_views
      where created_at >= v_start - make_interval(days => v_len) and created_at < v_end
    union all
    select 'sc', created_at, service_id from service_phone_views
      where created_at >= v_start - make_interval(days => v_len) and created_at < v_end
    union all
    select 'pv', created_at, null from mechanic_profile_views
      where created_at >= v_start - make_interval(days => v_len) and created_at < v_end
    union all
    select 'mc', created_at, null from mechanic_phone_views
      where created_at >= v_start - make_interval(days => v_len) and created_at < v_end
  ),
  -- "day" is the day inside the current period; previous-period events are
  -- shifted forward so both line up on the same chart position.
  events as (
    select kind, service_id, created_at >= v_start as is_current,
      (created_at at time zone 'Asia/Tbilisi')::date
        + case when created_at >= v_start then 0 else v_len end as day,
      extract(hour from created_at at time zone 'Asia/Tbilisi')::integer as hour
    from raw
    where created_at >= v_start or created_at < v_end - make_interval(days => v_len)
  ),
  daily as (
    select d::date as day,
      count(*) filter (where e.is_current and e.kind = 'sv') as service_views,
      count(*) filter (where e.is_current and e.kind = 'pv') as profile_views,
      count(*) filter (where e.is_current and e.kind = 'sc') as service_clicks,
      count(*) filter (where e.is_current and e.kind = 'mc') as mechanic_clicks,
      count(*) filter (where not e.is_current and e.kind = 'sv') as prev_service_views,
      count(*) filter (where not e.is_current and e.kind = 'pv') as prev_profile_views,
      count(*) filter (where not e.is_current and e.kind = 'sc') as prev_service_clicks,
      count(*) filter (where not e.is_current and e.kind = 'mc') as prev_mechanic_clicks
    from generate_series(p_from, p_to, interval '1 day') d
    left join events e on e.day = d::date
    group by 1
  ),
  top_services as (
    select e.kind, s.id, s.name, count(*) as n,
      row_number() over (partition by e.kind order by count(*) desc, s.id) as position
    from events e join mechanic_services s on s.id = e.service_id
    where e.is_current
    group by e.kind, s.id, s.name
  ),
  searches as (
    select lower(btrim(query)) as name, count(*) as n from search_logs
    where created_at >= v_start and created_at < v_end and btrim(query) <> ''
    group by 1 order by 2 desc, 1 limit 25
  )
  select jsonb_build_object(
    'daily', (select jsonb_agg(to_jsonb(daily) order by day) from daily),
    'hours', (select jsonb_agg(coalesce(c.n, 0) order by h)
      from generate_series(0, 23) h
      left join (select hour, count(*) as n from events
        where is_current and kind in ('sc', 'mc') group by hour) c on c.hour = h),
    'top_viewed', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'n', n) order by position)
      from top_services where kind = 'sv' and position <= 25), '[]'::jsonb),
    'top_clicked', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'n', n) order by position)
      from top_services where kind = 'sc' and position <= 25), '[]'::jsonb),
    'top_searches', coalesce((select jsonb_agg(to_jsonb(searches) order by n desc, name) from searches), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;
revoke all on function public.get_admin_overview(date, date) from public, anon;
grant execute on function public.get_admin_overview(date, date) to authenticated;
