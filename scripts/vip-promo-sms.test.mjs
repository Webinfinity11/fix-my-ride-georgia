import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('the promotion text carries a full link and fits one SMS', () => {
  const text = read('../supabase/functions/promo-sms/index.ts').match(/const TEXT = '([^']+)'/)[1];
  assert.ok(text.endsWith('https://fixup.ge/vip'));
  assert.ok(text.length <= 70, `${text.length} characters`);
});

test('recipients: clicked, without VIP, one row per number, opt-outs excluded', async () => {
  const db = new PGlite();
  const id = (n) => `00000000-0000-4000-8000-00000000000${n}`;
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create table profiles(id uuid primary key, phone text);
    create table mechanic_services(id integer primary key, mechanic_id uuid, is_active boolean, is_vip_active boolean default false);
    create table service_phone_views(service_id integer, created_at timestamptz default now());
    create table mechanic_phone_views(mechanic_id uuid, created_at timestamptz default now());
    create table sms_opt_outs(phone text);
    insert into profiles values ('${id(1)}','+995 555 11 11 11'),('${id(2)}','555111111'),('${id(3)}','555222222'),
      ('${id(4)}','555333333'),('${id(5)}','555444444');
    insert into mechanic_services values (1,'${id(1)}',true,false),(2,'${id(2)}',true,false),(3,'${id(3)}',true,true),
      (4,'${id(4)}',true,false),(5,'${id(5)}',true,false);
    insert into service_phone_views(service_id) values (1),(3),(5);
    insert into sms_opt_outs values ('555444444');
  `);
  await db.exec(read('../supabase/migrations/20261127220000_vip_promo_sms.sql'));
  const phones = async (min) => (await db.query(`select phone from get_vip_promo_recipients(${min})`)).rows.map((r) => r.phone);
  assert.deepEqual(await phones(1), ['555111111']);
  assert.deepEqual(await phones(0), ['555111111', '555333333']);
  await db.exec(`insert into sms_campaign_log(campaign, phone) values ('c', '555111111')`);
  await assert.rejects(db.exec(`insert into sms_campaign_log(campaign, phone) values ('c', '555111111')`), /duplicate key/);
  await db.close();
});
