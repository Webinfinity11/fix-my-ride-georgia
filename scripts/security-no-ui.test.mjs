import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const migration = await readFile(new URL('../supabase/migrations/20261013150000_security_no_ui.sql', import.meta.url), 'utf8');
const uidA = '11111111-1111-4111-8111-111111111111';
const uidB = '22222222-2222-4222-8222-222222222222';
async function setup() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema storage;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function public.is_admin(uuid) returns boolean language sql stable as $$ select false $$;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1] $$;
    grant usage on schema public,auth,storage to anon,authenticated;
    create table storage.objects(id serial primary key,bucket_id text,name text,owner uuid,owner_id text);
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to authenticated;
    grant select on storage.objects to anon; grant usage on sequence storage.objects_id_seq to authenticated;
    create policy "public images" on storage.objects for select using(true);
    create policy "Users can upload chat files to own folder" on storage.objects for insert with check(bucket_id='chat-files' and auth.uid() is not null);
    create policy "Users can update their own chat files" on storage.objects for update using(bucket_id='chat-files' and auth.uid() is not null);
    create policy "Users can delete their own chat files" on storage.objects for delete using(bucket_id='chat-files' and auth.uid() is not null);
    create policy "Users can upload community media to own folder" on storage.objects for insert with check(bucket_id='community-media' and auth.uid() is not null);
    create policy "Users can upload service photos to own folder" on storage.objects for insert with check(bucket_id='service-photos' and auth.uid() is not null);
    create policy "Users can upload service videos to own folder" on storage.objects for insert with check(bucket_id='service-videos' and auth.uid() is not null);
    create table public.contact_messages(user_id uuid,message text);
    alter table public.contact_messages enable row level security;
    grant insert on public.contact_messages to authenticated;
    create policy "logged-in contact" on public.contact_messages for insert with check(auth.uid() is not null);
    create table public.search_queries(id serial primary key,query text unique,search_count integer,first_searched_at timestamptz,last_searched_at timestamptz,created_at timestamptz,updated_at timestamptz);
    alter table public.search_queries enable row level security;
    grant select,insert,update on public.search_queries to anon,authenticated;
    grant usage on sequence public.search_queries_id_seq to anon,authenticated;
    create policy "read queries" on public.search_queries for select using(true);
    create policy "Anyone can insert search queries" on public.search_queries for insert with check(true);
    create policy "Anyone can update search queries" on public.search_queries for update using(true);
    create function public.get_community_feed(text,text,integer,integer) returns int language sql as $$ select 1 $$;
    create function public.get_reaction_counts(uuid) returns int language sql as $$ select 1 $$;
    insert into storage.objects(bucket_id,name,owner_id) values('chat-files','old-root.pdf','${uidA}');
  `);
  await db.exec(migration);
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${uidA}',false);`);
  return db;
}

test('owners retain file operations; other users cannot change/delete or spoof upload ownership', async () => {
  const db = await setup();
  try {
    assert.equal((await db.query("update storage.objects set name='renamed.pdf' where name='old-root.pdf' returning id")).rows.length,1);
    await assert.rejects(db.query(`update storage.objects set owner_id='${uidB}' where name='renamed.pdf'`), /row-level security/);
    await db.exec(`select set_config('request.jwt.claim.sub','${uidB}',false);`);
    assert.equal((await db.query("update storage.objects set name='stolen.pdf' where name='renamed.pdf' returning id")).rows.length,0);
    assert.equal((await db.query("delete from storage.objects where name='renamed.pdf' returning id")).rows.length,0);
    await assert.rejects(db.query(`insert into storage.objects(bucket_id,name,owner_id) values('chat-files','spoof.pdf','${uidA}')`), /row-level security/);
    await db.query(`insert into storage.objects(bucket_id,name,owner_id) values('chat-files','mine.pdf','${uidB}')`);
    await assert.rejects(db.query(`insert into storage.objects(bucket_id,name,owner_id) values('community-media','${uidA}/spoof.webp','${uidB}')`), /row-level security/);
    await db.query(`insert into storage.objects(bucket_id,name,owner_id) values('community-media','${uidB}/mine.webp','${uidB}')`);
    await assert.rejects(db.query(`insert into storage.objects(bucket_id,name,owner_id) values('service-photos','${uidA}/spoof.webp','${uidB}')`), /row-level security/);
    await db.query(`insert into storage.objects(bucket_id,name,owner_id) values('service-photos','${uidB}/mine.webp','${uidB}')`);
    await db.exec('set role anon');
    assert.ok((await db.query('select * from storage.objects')).rows.length>0,'Public images remain readable');
  } finally { await db.close(); }
});

test('contact insert cannot impersonate another user; function paths are fixed', async () => {
  const db = await setup();
  try {
    await db.query(`insert into public.contact_messages values('${uidA}','own request')`);
    await db.query("insert into public.contact_messages values(null,'unlinked request')");
    await assert.rejects(db.query(`insert into public.contact_messages values('${uidB}','spoof')`), /row-level security/);
    await db.exec('reset role');
    const configs = await db.query("select proconfig from pg_proc where proname in ('get_community_feed','get_reaction_counts')");
    assert.ok(configs.rows.every(row => row.proconfig.includes('search_path=public, pg_temp')));
  } finally { await db.close(); }
});

test('legacy search tracker still works but arbitrary counts, dates and query rewrites do not', async () => {
  const db = await setup();
  try {
    await db.exec('set role anon');
    await db.query("insert into public.search_queries(query,search_count,first_searched_at) values('  Engine  ',999,'2000-01-01')");
    await db.query("update public.search_queries set search_count=888,last_searched_at='2000-01-01' where query='engine'");
    const result=await db.query('select query,search_count,first_searched_at from public.search_queries');
    assert.equal(result.rows[0].query,'engine'); assert.equal(result.rows[0].search_count,2);
    assert.ok(new Date(result.rows[0].first_searched_at).getFullYear()>2020);
    await assert.rejects(db.query("update public.search_queries set query='stolen'"), /cannot rewrite/);
    await assert.rejects(db.query("insert into public.search_queries(query) values('')"), /row-level security/);
    await assert.rejects(db.query("insert into public.search_queries(query) values($1)", ['x'.repeat(201)]), /row-level security/);
  } finally {await db.close();}
});
