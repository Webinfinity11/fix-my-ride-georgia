-- Recipients and send log for the VIP promotion SMS (promo-sms function).
begin;

create table if not exists public.sms_campaign_log (
  campaign text not null,
  phone text not null,
  status text not null default 'pending',
  error text,
  created_at timestamptz not null default now(),
  primary key (campaign, phone)
);
alter table public.sms_campaign_log enable row level security;
revoke all on public.sms_campaign_log from anon, authenticated;
grant select, insert, update on public.sms_campaign_log to service_role;

-- Owners of active listings, without an active VIP and not opted out, whose
-- number was clicked at least p_min_clicks times in the last 30 days.
create or replace function public.get_vip_promo_recipients(p_min_clicks integer default 1)
returns table (phone text)
language sql stable security definer set search_path = public, pg_temp as $$
  with owners as (
    select p.id, regexp_replace(
        regexp_replace(coalesce(p.phone, ''), '[^0-9]', '', 'g'),
        '^(995|0)(5[0-9]{8})$', '\2') as phone
    from profiles p
    where exists (select 1 from mechanic_services s where s.mechanic_id = p.id and s.is_active)
  ),
  clicks as (
    select owner, count(*) as n from (
      select s.mechanic_id as owner from service_phone_views e join mechanic_services s on s.id = e.service_id
        where e.created_at > now() - interval '30 days'
      union all
      select mechanic_id from mechanic_phone_views where created_at > now() - interval '30 days'
    ) x group by owner
  )
  select o.phone
  from owners o left join clicks c on c.owner = o.id
  where o.phone ~ '^5[0-9]{8}$'
    and not exists (select 1 from sms_opt_outs z where z.phone = o.phone)
  group by o.phone
  having coalesce(sum(c.n), 0) >= p_min_clicks
    and not bool_or(exists (select 1 from mechanic_services v where v.mechanic_id = o.id and v.is_vip_active))
  order by o.phone;
$$;
revoke all on function public.get_vip_promo_recipients(integer) from public, anon, authenticated;
grant execute on function public.get_vip_promo_recipients(integer) to service_role;

commit;
