-- Platform-wide fuel-price cache.
-- The upstream backend (fuel-prices-backend.onrender.com) live-scrapes on every
-- request (2–11s per company, no server cache). Instead of every browser
-- scraping on its first visit, the `fuel-prices` edge function scrapes once and
-- stores the result here; every client then reads this single cached row
-- (~200ms) and a cron refreshes it every 6h. Single-row table (id = 1).

create table if not exists public.fuel_prices_cache (
  id smallint primary key default 1,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint fuel_prices_cache_single_row check (id = 1)
);

alter table public.fuel_prices_cache enable row level security;

-- Anyone can READ the cache (it's public fuel prices).
drop policy if exists "fuel_prices_cache public read" on public.fuel_prices_cache;
create policy "fuel_prices_cache public read"
  on public.fuel_prices_cache
  for select
  using (true);

-- No insert/update/delete policies are defined on purpose: writes happen ONLY
-- through the edge function using the service-role key, which bypasses RLS.
