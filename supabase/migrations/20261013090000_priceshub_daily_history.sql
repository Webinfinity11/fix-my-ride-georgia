create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Public price facts only. Price observation time does not assert when a
-- supplier changed a price. Keep one latest observation per product/local day.
create table if not exists public.fuel_price_daily_history (
  observed_at timestamptz not null,
  observed_on date generated always as ((observed_at at time zone 'Asia/Tbilisi')::date) stored,
  company text not null,
  product text not null,
  price numeric(8,3) not null check (price > 0 and price <= 20),
  self_service_price numeric(8,3) check (self_service_price > 0 and self_service_price <= 20),
  source_url text not null,
  primary key (observed_on, company, product)
);
alter table public.fuel_price_daily_history enable row level security;
drop policy if exists "public fuel history read" on public.fuel_price_daily_history;
create policy "public fuel history read" on public.fuel_price_daily_history for select to anon, authenticated using (true);
grant select on public.fuel_price_daily_history to anon, authenticated;

-- Cache and history are committed together: a failed write cannot claim a
-- fresh cache while silently losing the daily record.
create or replace function public.store_fuel_prices_snapshot(payload jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if jsonb_typeof(payload->'companies') is distinct from 'array'
     or jsonb_array_length(payload->'companies') = 0 then
    raise exception 'Empty fuel snapshot';
  end if;
  insert into public.fuel_price_daily_history
    (observed_at, company, product, price, self_service_price, source_url)
  select coalesce(nullif(c->>'timestamp','')::timestamptz, (payload->>'fetchedAt')::timestamptz),
    c->>'name', f->>'fuelType', (f->>'price')::numeric,
    nullif(f->>'selfServicePrice','')::numeric,
    coalesce(c->>'sourceUrl', 'https://fuel-prices-backend.onrender.com')
  from jsonb_array_elements(payload->'companies') c,
       jsonb_array_elements(c->'fuelPrices') f
  on conflict (observed_on, company, product) do update set
    observed_at = excluded.observed_at, price = excluded.price,
    self_service_price = excluded.self_service_price, source_url = excluded.source_url;

  insert into public.fuel_prices_cache(id, data, updated_at)
    values (1, payload, now())
    on conflict (id) do update set data = excluded.data, updated_at = excluded.updated_at;
end;
$$;
revoke all on function public.store_fuel_prices_snapshot(jsonb) from public, anon, authenticated;
grant execute on function public.store_fuel_prices_snapshot(jsonb) to service_role;

-- The existing fuel-prices endpoint is public (verify_jwt=false). No private
-- keys belong in SQL or the cron command. Daily at 07:00 Asia/Tbilisi / 03:00 UTC.
select cron.schedule('fixup-fuel-prices-daily', '0 3 * * *', $$
  select net.http_get(
    url := 'https://kwozniwtygkdoagjegom.supabase.co/functions/v1/fuel-prices?refresh=true',
    timeout_milliseconds := 60000
  );
$$);
