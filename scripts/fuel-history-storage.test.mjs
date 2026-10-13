import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

test('daily migration records local dates, updates once per day, rolls back invalid writes, and limits write access', async () => {
  const db = await PGlite.create();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role;
      create schema cron; create table cron.jobs(name text, schedule text, command text);
      create function cron.schedule(text,text,text) returns bigint language sql as 'insert into cron.jobs values ($1,$2,$3); select 1::bigint;';`);
    await db.exec(readFileSync(new URL('../supabase/migrations/20260706120000_fuel_prices_cache.sql', import.meta.url), 'utf8'));
    await db.exec(readFileSync(new URL('../supabase/migrations/20261013090000_priceshub_daily_history.sql', import.meta.url), 'utf8'));
    const payload = { fetchedAt: '2026-10-13T22:00:00Z', source: 'priceshub', companies: [{ name: 'Socar', timestamp: '2026-10-13T22:00:00Z', sourceUrl: 'https://priceshub.ge/company/socar', fuelPrices: [{ fuelType: 'რეგულარი', price: 4.02, selfServicePrice: 3.95 }] }] };
    await db.query('select public.store_fuel_prices_snapshot($1::jsonb)', [JSON.stringify(payload)]);
    const row = (await db.query('select observed_on::text, price, self_service_price from public.fuel_price_daily_history')).rows[0];
    assert.equal(row.observed_on, '2026-10-14'); // UTC+4, not the UTC calendar day
    payload.companies[0].fuelPrices[0].price = 4.05;
    await db.query('select public.store_fuel_prices_snapshot($1::jsonb)', [JSON.stringify(payload)]);
    assert.equal((await db.query('select count(*)::int n from public.fuel_price_daily_history')).rows[0].n, 1);
    const good = (await db.query('select data from public.fuel_prices_cache')).rows[0].data;
    payload.companies[0].fuelPrices[0].price = 0;
    await assert.rejects(db.query('select public.store_fuel_prices_snapshot($1::jsonb)', [JSON.stringify(payload)]));
    assert.deepEqual((await db.query('select data from public.fuel_prices_cache')).rows[0].data, good);
    await assert.rejects(db.query('select public.store_fuel_prices_snapshot($1::jsonb)', [JSON.stringify({companies:[]})]));
    const permissions = (await db.query("select has_function_privilege('anon','public.store_fuel_prices_snapshot(jsonb)','EXECUTE') anon, has_function_privilege('service_role','public.store_fuel_prices_snapshot(jsonb)','EXECUTE') service")).rows[0];
    assert.equal(permissions.anon, false); assert.equal(permissions.service, true);
    const job = (await db.query('select * from cron.jobs')).rows[0];
    assert.equal(job.schedule, '0 3 * * *');
    assert.ok(job.command.includes('refresh=true'));
    assert.ok(!job.command.includes('Bearer'));
  } finally { await db.close(); }
});
