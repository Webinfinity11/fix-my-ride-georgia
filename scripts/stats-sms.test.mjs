import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const lib = {};
new Function('exports', ts.transpileModule(read('../supabase/functions/_shared/stats-sms.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(lib);
const { buildMessage, segments, sendSms, sendAll } = lib;

const reply = (status, body) => async () => new Response(JSON.stringify(body), { status });

test('daily message uses the personal HTTPS link and fits one SMS', () => {
  assert.equal(buildMessage(100, 30, 200), 'გუშინ: ნახვა 100, დარეკა 30.\nhttps://fixup.ge/mechanic/200');
  assert.equal(segments(buildMessage(99999, 9999, 999999)), 1);
  assert.equal(buildMessage(5, 1), 'გუშინ: ნახვა 5, დარეკა 1.\nhttps://fixup.ge/');
});

test('provider responses are classified without leaking the key', async () => {
  let request;
  const ok = await sendSms('KEY', '555123456', 'hi', async (url, init) => {
    request = { url, init };
    return new Response(JSON.stringify({ data: [{ messageId: 'abc' }] }));
  });
  assert.deepEqual(ok, { status: 'sent', messageId: 'abc' });
  assert.ok(!request.url.includes('KEY'));
  assert.equal(request.init.body.get('smsno'), '2');
  assert.equal((await sendSms('KEY', '5', 'x', reply(402, { message: 'overdraft' }))).fatal, true);
  assert.equal((await sendSms('KEY', '5', 'x', reply(403, { message: 'destination incorrect' }))).fatal, false);
  assert.equal((await sendSms('KEY', '5', 'x', reply(503, {}))).status, 'unknown');
  assert.equal((await sendSms('KEY', '5', 'x', async () => { throw new Error('net'); })).status, 'unknown');
});

test('already claimed phones are skipped and an empty balance stops the run', async () => {
  const sent = [];
  const recipients = ['1', '2', '3', '4'].map((phone) => ({ phone, views: 1, calls: 0 }));
  const summary = await sendAll(recipients, {
    claim: async (r) => (r.phone === '1' ? null : Number(r.phone)),
    send: async (phone) => {
      sent.push(phone);
      return phone === '3' ? { status: 'failed', error: '402 overdraft', fatal: true } : { status: 'sent' };
    },
    record: async () => {},
  }, 1);
  assert.deepEqual(sent, ['2', '3']);
  assert.deepEqual(summary, { sent: 1, failed: 1, unknown: 0, skipped: 1, stopped: '402 overdraft' });
});

test('weekly and daily statistics: deduplication, opt-outs, own visits and Tbilisi day boundaries', async () => {
  const db = new PGlite();
  const id = (n) => `00000000-0000-4000-8000-00000000000${n}`;
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;
    create function public.is_admin(uuid) returns boolean language sql stable as $$select false$$;
    create table profiles(id uuid primary key, phone text);
    create table mechanic_profiles(id uuid primary key, display_id integer);
    create table mechanic_services(id integer primary key, mechanic_id uuid, is_active boolean);
    create table service_views(service_id integer, viewer_id uuid, created_at timestamptz default now());
    create table service_phone_views(like service_views including defaults);
    create table mechanic_profile_views(mechanic_id uuid, viewer_id uuid, created_at timestamptz default now());
    create table mechanic_phone_views(like mechanic_profile_views including defaults);
    insert into profiles values ('${id(1)}','+995 555 11 11 11'),('${id(2)}','555111111'),
      ('${id(3)}','0555222222'),('${id(4)}','555333333'),('${id(5)}','032 2 12 12 12');
    insert into mechanic_services values (1,'${id(1)}',true),(2,'${id(2)}',true),
      (3,'${id(3)}',true),(4,'${id(4)}',true),(5,'${id(5)}',true),(6,'${id(1)}',false);
    insert into service_views(service_id) values (1),(1),(2),(3),(5),(6);
    insert into service_views values (1,'${id(1)}',now()),(1,null,now() - interval '8 days');
    insert into mechanic_profile_views(mechanic_id) values ('${id(1)}');
    insert into service_phone_views(service_id) values (1),(4);
    insert into mechanic_phone_views(mechanic_id) values ('${id(2)}');
  `);
  await db.exec(read('../supabase/migrations/20261127120000_mechanic_stats_sms.sql'));
  const stats = async () => (await db.query('select phone, views, calls from get_mechanic_sms_stats(7)')).rows;
  assert.deepEqual(await stats(), [
    { phone: '555111111', views: 4, calls: 2 },
    { phone: '555222222', views: 1, calls: 0 },
  ]);
  await db.exec(`insert into sms_opt_outs(phone) values ('555222222')`);
  assert.equal((await stats()).length, 1);

  await db.exec(read('../supabase/migrations/20261127140000_daily_mechanic_stats_sms.sql'));
  await db.exec(`
    delete from sms_opt_outs;
    truncate service_views,service_phone_views,mechanic_profile_views,mechanic_phone_views;
    insert into mechanic_profiles values ('${id(1)}',100),('${id(2)}',101),('${id(3)}',102);
    insert into service_views(service_id,created_at) values
      (1, ((now() at time zone 'Asia/Tbilisi')::date-1)::timestamp at time zone 'Asia/Tbilisi');
    insert into mechanic_profile_views(mechanic_id,created_at) values
      ('${id(2)}', ((now() at time zone 'Asia/Tbilisi')::date-1)::timestamp at time zone 'Asia/Tbilisi');
    insert into service_phone_views(service_id,viewer_id,created_at) values
      (1,null, ((now() at time zone 'Asia/Tbilisi')::date-1)::timestamp at time zone 'Asia/Tbilisi'),
      (1,null, ((now() at time zone 'Asia/Tbilisi')::date)::timestamp at time zone 'Asia/Tbilisi' - interval '1 microsecond'),
      (1,'${id(1)}', ((now() at time zone 'Asia/Tbilisi')::date-1)::timestamp at time zone 'Asia/Tbilisi'),
      (1,null, ((now() at time zone 'Asia/Tbilisi')::date)::timestamp at time zone 'Asia/Tbilisi'),
      (1,null, ((now() at time zone 'Asia/Tbilisi')::date-1)::timestamp at time zone 'Asia/Tbilisi' - interval '1 microsecond'),
      (6,null, ((now() at time zone 'Asia/Tbilisi')::date-1)::timestamp at time zone 'Asia/Tbilisi');
    insert into mechanic_phone_views(mechanic_id,created_at) values
      ('${id(2)}', ((now() at time zone 'Asia/Tbilisi')::date-1)::timestamp at time zone 'Asia/Tbilisi'),
      ('${id(3)}', ((now() at time zone 'Asia/Tbilisi')::date-1)::timestamp at time zone 'Asia/Tbilisi');
  `);
  const dailyStats = async () => (await db.query('select phone,views,calls,display_id from get_mechanic_daily_sms_stats()')).rows;
  assert.deepEqual(await dailyStats(), [
    {phone:'555111111',views:2,calls:3,display_id:100},
    {phone:'555222222',views:0,calls:1,display_id:102},
  ]);
  await db.exec("insert into sms_opt_outs(phone) values ('555222222')");
  assert.equal((await dailyStats()).length, 1);

  const log = `insert into sms_log(mechanic_id,phone,views,calls,content) values ('${id(1)}','555111111',1,0,'x')`;
  await db.exec(log);
  await assert.rejects(db.exec(log), /duplicate key/);
  await db.exec('set role authenticated');
  await assert.rejects(db.query('select * from get_mechanic_sms_stats(7)'), /permission denied/);
  await assert.rejects(db.query('select * from get_mechanic_daily_sms_stats()'), /permission denied/);
  await db.close();
});
