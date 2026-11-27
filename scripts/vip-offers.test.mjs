import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const migration = readFileSync(new URL('../supabase/migrations/20261127200000_vip_offers.sql', import.meta.url), 'utf8');

async function setup() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;
    create function public.is_admin(uuid) returns boolean language sql stable as $$select false$$;
    create table mechanic_services(id integer primary key, mechanic_id uuid, is_active boolean);
    insert into mechanic_services values (1, '11111111-1111-4111-8111-111111111111', true), (2, null, false);
    grant usage on schema public, auth to anon, authenticated;
  `);
  await db.exec(migration);
  return db;
}
const submit = (db, plan, phone, email = null, service = null) =>
  db.query('select submit_vip_lead($1, $2, $3, $4) as price', [plan, phone, email, service]).then((r) => r.rows[0].price);

test('the server sets the price: full outside the promotion, discounted during it', async () => {
  const db = await setup();
  assert.equal(await submit(db, 'vip', '555111111'), 30);
  assert.equal(await submit(db, 'super_vip', '+995 555 11 11 11', 'a@b.ge', 1), 50);
  await db.exec(`update vip_pricing set promo_ends_at = now() + interval '24 hours'`);
  assert.equal(await submit(db, 'vip', '555222222'), 15);
  assert.equal(await submit(db, 'super_vip', '555222222'), 20);
  await db.exec(`update vip_pricing set promo_ends_at = now() - interval '1 second'`);
  assert.equal(await submit(db, 'vip', '555333333'), 30);
  const [lead] = (await db.query(`select phone, email, mechanic_id, status from vip_leads where service_id = 1`)).rows;
  assert.deepEqual(lead, { phone: '555111111', email: 'a@b.ge', mechanic_id: '11111111-1111-4111-8111-111111111111', status: 'new' });
  await db.close();
});

test('bad input, repeats and floods are rejected', async () => {
  const db = await setup();
  await assert.rejects(submit(db, 'gold', '555111111'), /invalid_plan/);
  await assert.rejects(submit(db, 'vip', '032 212 12 12'), /invalid_phone/);
  await assert.rejects(submit(db, 'vip', '555111111', 'not-mail'), /invalid_email/);
  await assert.rejects(submit(db, 'vip', '555111111', null, 2), /invalid_service/);
  await submit(db, 'vip', '555111111');
  await submit(db, 'vip', '555111111');
  assert.equal((await db.query('select count(*)::int as n from vip_leads')).rows[0].n, 1);
  await db.exec(`insert into vip_leads(plan, phone, price_gel, status) select 'vip', '555111111', 30, 'rejected' from generate_series(1, 4)`);
  await assert.rejects(submit(db, 'super_vip', '555111111'), /too_many_requests/);
  await db.close();
});

test('visitors can submit but cannot read leads or change prices', async () => {
  const db = await setup();
  await db.exec('set role anon');
  assert.equal(await submit(db, 'vip', '555111111'), 30);
  await assert.rejects(db.query('select * from vip_leads'), /permission denied/);
  await assert.rejects(db.query('update vip_pricing set vip_price = 1'), /permission denied/);
  assert.equal((await db.query('select vip_price from vip_pricing')).rows[0].vip_price, 30);
  await db.exec('reset role; set role authenticated');
  await db.query('update vip_pricing set vip_price = 1'); // RLS: not an admin, so nothing changes
  assert.equal((await db.query('select vip_price from vip_pricing')).rows[0].vip_price, 30);
  await db.close();
});
