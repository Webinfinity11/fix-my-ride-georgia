import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const migration = readFileSync(new URL('../supabase/migrations/20261128100000_growth.sql', import.meta.url), 'utf8');
const ADMIN = '00000000-0000-4000-8000-000000000001';
const BUSY = '00000000-0000-4000-8000-000000000002';
const QUIET = '00000000-0000-4000-8000-000000000003';
const VIP = '00000000-0000-4000-8000-000000000004';

async function setup() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid', true), '')::uuid$$;
    create function public.is_admin(u uuid) returns boolean language sql stable as $$select u = '${ADMIN}'::uuid$$;
    create table profiles(id uuid primary key, first_name text, last_name text, phone text);
    create table mechanic_services(id integer primary key, mechanic_id uuid, is_active boolean, is_vip_active boolean, vip_until timestamptz);
    create table service_views(service_id integer, user_agent text, viewer_id uuid, created_at timestamptz default now());
    create table service_phone_views(like service_views including defaults);
    create table mechanic_profile_views(mechanic_id uuid, user_agent text, viewer_id uuid, created_at timestamptz default now());
    create table mechanic_phone_views(like mechanic_profile_views including defaults);
    create table sms_opt_outs(phone text primary key);
    insert into profiles values ('${BUSY}', 'Busy', 'One', '555 11 11 11'), ('${QUIET}', 'Quiet', 'Two', '555222222'), ('${VIP}', 'Vip', 'Three', '+995555333333');
    insert into mechanic_services values (1, '${BUSY}', true, false, null), (2, '${QUIET}', true, false, null),
      (3, '${VIP}', true, true, now() + interval '2 days'), (4, '${VIP}', true, true, now() + interval '20 days');
    insert into service_views(service_id) select 1 from generate_series(1, 5);
    insert into service_views(service_id) values (2), (3), (3);
    insert into service_views(service_id, viewer_id) values (3, '${VIP}');
    insert into service_phone_views(service_id) values (1), (1), (3);
    grant usage on schema public, auth to anon, authenticated, service_role;
  `);
  await db.exec(migration);
  return db;
}
const as = (db, uid) => db.query(`select set_config('test.uid', $1, false)`, [uid]);

test('the call list has owners without VIP, most clicked first, for admins only', async () => {
  const db = await setup();
  await as(db, BUSY);
  await assert.rejects(db.query('select * from get_vip_call_list()'), /Administrator/);
  await as(db, ADMIN);
  const { rows } = await db.query('select * from get_vip_call_list(30)');
  assert.deepEqual(rows.map((r) => [r.name, Number(r.views), Number(r.clicks)]), [['Busy One', 5, 2], ['Quiet Two', 1, 0]]);
  await db.close();
});

test('driver requests are validated, de-duplicated, limited and private', async () => {
  const db = await setup();
  await db.exec('set role anon');
  const send = (phone, problem) => db.query('select submit_driver_request($1, $2, $3) as id', [phone, 'თბილისი', problem]).then((r) => Number(r.rows[0].id));
  await assert.rejects(send('12', 'მუხრუჭი ჭრიალებს'), /invalid_phone/);
  await assert.rejects(send('555111111', 'ა'), /invalid_problem/);
  const first = await send('+995 555 11 11 11', 'მუხრუჭი ჭრიალებს');
  assert.equal(await send('555111111', 'მუხრუჭი ჭრიალებს'), first);
  await send('555111111', 'ძრავი ხურდება');
  await send('555111111', 'კონდიციონერი არ აცივებს');
  await assert.rejects(send('555111111', 'მეოთხე განაცხადი'), /too_many_requests/);
  await assert.rejects(db.query('select * from driver_requests'), /permission denied/);
  await db.close();
});

test('expiry reminders list only VIP ending within 3 days, without opted-out numbers', async () => {
  const db = await setup();
  const list = async () => (await db.query('select * from get_vip_expiry_recipients()')).rows;
  const rows = await list();
  assert.deepEqual(rows.map((r) => [r.service_id, r.phone, Number(r.views), Number(r.calls)]), [[3, '555333333', 2, 1]]);
  await db.exec(`insert into sms_opt_outs values ('555333333')`);
  assert.deepEqual(await list(), []);
  await db.exec('set role anon');
  await assert.rejects(list(), /permission denied/);
  await db.close();
});
