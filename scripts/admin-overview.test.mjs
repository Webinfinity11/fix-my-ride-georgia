import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const migration = readFileSync(new URL('../supabase/migrations/20261127160000_admin_overview.sql', import.meta.url), 'utf8');
const botFilter = readFileSync(new URL('../supabase/migrations/20261127180000_admin_overview_bot_filter.sql', import.meta.url), 'utf8');

async function setup(isAdmin = true) {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;
    create function public.is_admin(uuid) returns boolean language sql stable as $$select ${isAdmin}$$;
    create table mechanic_services(id integer primary key, name text);
    create table service_views(service_id integer, created_at timestamptz, user_agent text, viewer_id uuid);
    create table service_phone_views(like service_views);
    create table mechanic_profile_views(mechanic_id integer, created_at timestamptz, user_agent text, viewer_id uuid);
    create table mechanic_phone_views(like mechanic_profile_views);
    create table search_logs(query text, created_at timestamptz);
    insert into mechanic_services values (1, 'A'), (2, 'B');
  `);
  await db.exec(migration);
  await db.exec(botFilter);
  return db;
}
const overview = async (db, from, to) =>
  (await db.query(`select get_admin_overview(${from}, ${to}) as r`)).rows[0].r;

test('days and hours follow Tbilisi; previous period lines up with the current one', async () => {
  const db = await setup();
  await db.exec(`
    -- 2026-03-09 20:30Z is already 10 March 00:30 in Tbilisi
    insert into service_views(service_id,created_at) values (1,'2026-03-09T20:30:00Z'),(2,'2026-03-10T08:00:00Z'),(2,'2026-03-11T08:00:00Z'),
      (1,'2026-03-08T08:00:00Z'),(1,'2026-03-07T08:00:00Z');
    insert into service_phone_views(service_id,created_at) values (2,'2026-03-10T09:15:00Z');
    insert into mechanic_phone_views(created_at) values ('2026-03-11T09:45:00Z');
    insert into mechanic_profile_views(created_at) values ('2026-03-12T09:00:00Z');
    insert into search_logs values (' Oil ','2026-03-10T10:00:00Z'),('oil','2026-03-11T10:00:00Z'),('old','2026-03-08T10:00:00Z');
  `);
  const r = await overview(db, `'2026-03-10'`, `'2026-03-11'`);
  assert.deepEqual(r.daily.map((d) => [d.day, d.service_views, d.prev_service_views, d.service_clicks, d.mechanic_clicks]), [
    ['2026-03-10', 2, 1, 1, 0],
    ['2026-03-11', 1, 0, 0, 1],
  ]);
  assert.equal(r.hours.length, 24);
  assert.equal(r.hours[13], 2);
  assert.deepEqual(r.top_viewed.map((s) => [s.name, s.n]), [['B', 2], ['A', 1]]);
  assert.deepEqual(r.top_clicked.map((s) => [s.name, s.n]), [['B', 1]]);
  assert.deepEqual(r.top_searches, [{ n: 2, name: 'oil' }]);
  await db.close();
});

test('an unfinished day is compared with the same hours of the previous one', async () => {
  const db = await setup();
  await db.exec(`
    insert into service_views(service_id,created_at) values
      (1, now() - interval '1 day' - interval '1 second'),
      (1, now() - interval '1 day' + interval '1 hour');
  `);
  const today = `(now() at time zone 'Asia/Tbilisi')::date`;
  const [day] = (await overview(db, today, today)).daily;
  // Only the row from before this time yesterday counts; the later one does not.
  assert.equal(day.prev_service_views, 1);
  await db.close();
});

test('non-admins and anonymous callers are refused', async () => {
  const db = await setup(false);
  await assert.rejects(overview(db, `'2026-03-10'`, `'2026-03-11'`), /Administrator access required/);
  await db.exec('set role anon');
  await assert.rejects(overview(db, `'2026-03-10'`, `'2026-03-11'`), /permission denied/);
  await db.close();
});

test('a browser sweeping 25 listings in ten minutes is left out; people are not', async () => {
  const db = await setup();
  await db.exec(`
    insert into service_views(service_id, created_at, user_agent)
      select n, timestamptz '2026-03-10T08:00:00Z' + n * interval '5 seconds', 'bot' from generate_series(1, 25) n;
    insert into service_views(service_id, created_at, user_agent)
      select n, timestamptz '2026-03-10T08:00:00Z' + n * interval '5 seconds', 'busy-but-real' from generate_series(1, 24) n;
    -- the same signature at another time of day is an ordinary visit
    insert into service_views(service_id, created_at, user_agent) values (1, '2026-03-10T15:00:00Z', 'bot');
    insert into service_phone_views(service_id, created_at, user_agent) values (1, '2026-03-10T08:01:00Z', 'bot');
    -- signed-in people are never treated as automated
    insert into service_views(service_id, created_at, user_agent, viewer_id)
      values (2, '2026-03-10T08:02:00Z', 'bot', '11111111-1111-4111-8111-111111111111');
  `);
  const r = await overview(db, `'2026-03-10'`, `'2026-03-10'`);
  assert.deepEqual(r.filtered, { views: 25, clicks: 1 });
  assert.equal(r.daily[0].service_views, 26);
  assert.equal(r.daily[0].service_clicks, 0);
  await db.close();
});

test('slow crawlers and number harvesters are left out, ordinary busy browsers stay', async () => {
  const db = await setup();
  await db.exec(`
    -- 500 views spread over days, never a click: a crawler
    insert into service_views(service_id, created_at, user_agent)
      select 1, timestamptz '2026-02-20T00:00:00Z' + n * interval '30 minutes', 'crawler' from generate_series(1, 600) n;
    -- same volume with normal clicking: people sharing one signature
    insert into service_views(service_id, created_at, user_agent)
      select 1, timestamptz '2026-02-20T00:00:00Z' + n * interval '1 hour', 'popular' from generate_series(1, 500) n;
    insert into service_phone_views(service_id, created_at, user_agent)
      select 1, timestamptz '2026-02-25T00:00:00Z' + n * interval '1 hour', 'popular' from generate_series(1, 40) n;
    -- 50 different numbers in a day, far apart, without opening pages
    insert into service_phone_views(service_id, created_at, user_agent)
      select n, timestamptz '2026-03-10T04:00:00Z' + n * interval '11 minutes', 'harvester' from generate_series(1, 50) n;
  `);
  const r = await overview(db, `'2026-03-01'`, `'2026-03-10'`);
  const sum = (key) => r.daily.reduce((total, d) => total + d[key], 0);
  const inPeriod = async (agent) => (await db.query(`select count(*)::int as n from service_views
    where user_agent = '${agent}' and (created_at at time zone 'Asia/Tbilisi')::date between '2026-03-01' and '2026-03-10'`)).rows[0].n;
  assert.equal(sum('service_views'), await inPeriod('popular'));
  assert.ok(await inPeriod('crawler') > 0);
  assert.equal(r.filtered.views, await inPeriod('crawler'));
  assert.equal(r.filtered.clicks, 50);
  await db.close();
});
