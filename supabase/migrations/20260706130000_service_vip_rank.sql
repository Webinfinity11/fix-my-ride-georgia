-- Stable VIP ordering rank for mechanic_services.
--
-- The /services list must show: active super_vip → active vip → everyone else
-- (newest first). Ordering by vip_status directly leaks: a service whose VIP
-- has expired keeps its vip_status ('super_vip'/'vip') even after is_vip_active
-- flips to false, so it sorts ahead of the genuinely newest non-VIP services.
--
-- vip_rank collapses the tier into a single sortable number that is 2 (bottom)
-- for anything that isn't an ACTIVE VIP — so expired/non-VIP rows all sort
-- together by created_at, and only truly-active VIPs float to the top.
-- The expression is immutable (only references other columns), so it's a valid
-- STORED generated column and stays correct automatically as is_vip_active /
-- vip_status change (the existing check_vip_expiration trigger keeps
-- is_vip_active honest on write; the daily expire_vip_services cron does the
-- rest).

alter table public.mechanic_services
  add column if not exists vip_rank smallint
  generated always as (
    case
      when is_vip_active and vip_status = 'super_vip' then 0
      when is_vip_active and vip_status = 'vip' then 1
      else 2
    end
  ) stored;

-- Helps the ordered/paginated list query.
create index if not exists mechanic_services_vip_rank_created_idx
  on public.mechanic_services (vip_rank, created_at desc);
