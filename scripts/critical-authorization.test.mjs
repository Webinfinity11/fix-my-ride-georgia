import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const migration=(await readFile(new URL('../supabase/migrations/20261022160000_critical_authorization.sql',import.meta.url),'utf8')) + (await readFile(new URL('../supabase/migrations/20261022160100_search_history_policy.sql',import.meta.url),'utf8'));
const expiryOrderMigration=await readFile(new URL('../supabase/migrations/20261022160200_vip_guard_trigger_order.sql',import.meta.url),'utf8');
const owner='11111111-1111-4111-8111-111111111111';
const admin='22222222-2222-4222-8222-222222222222';
async function setup(){
 const db=new PGlite();
 await db.exec(`
 create role anon; create role authenticated; create role service_role;
 create schema auth;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.role() returns text language sql stable as $$select current_setting('request.jwt.claim.role',true)$$;
 create function public.is_admin(uuid) returns boolean language sql stable as $$select $1='${admin}'::uuid$$;
 grant usage on schema public,auth to anon,authenticated,service_role;
 create type public.vip_plan_type as enum ('vip','vip_plus');
 create table mechanic_services(id integer primary key,mechanic_id uuid,vip_status vip_plan_type,vip_until timestamptz,is_vip_active boolean default false,updated_at timestamptz,title text);
 create table posts(id uuid primary key,user_id uuid,is_pinned boolean default false,pinned_by uuid,pinned_at timestamptz,content text);
 create table search_queries(query text unique,search_count integer,first_searched_at timestamptz,last_searched_at timestamptz);
 create table profiles(id uuid primary key,role text);
 create table mechanic_profiles(id uuid primary key);
 create table certificates(id integer primary key,mechanic_id uuid);
 create table drives(id integer primary key);
 alter table search_queries enable row level security;
 alter table mechanic_profiles enable row level security;
 alter table certificates enable row level security;
 alter table drives enable row level security;
 create policy old_search on search_queries for all using(true) with check(true);
 create policy "Anyone can view search queries" on search_queries for select using(true);
 create policy "Anyone can view mechanic profiles" on mechanic_profiles for select using(true);
 create policy "Certificates are viewable by everyone" on certificates for select using(true);
 create policy "Anyone can view drives" on drives for select using(true);
 grant select,insert,update on all tables in schema public to anon,authenticated;
 insert into mechanic_services(id,mechanic_id,title) values(1,'${owner}','repair');
 insert into posts(id,user_id,content) values('${owner}','${owner}','hello');
 insert into profiles values('${owner}','mechanic'),('${admin}','customer');
 insert into mechanic_profiles values('${owner}'),('${admin}');
 insert into certificates values(1,'${owner}');
 insert into drives values(1);
 `);
 await db.exec(migration);
 await db.exec(expiryOrderMigration);
 await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${owner}',false); select set_config('request.jwt.claim.role','authenticated',false);`);
 return db;
}
test('ordinary users cannot grant paid placement or pin through RPC or direct writes',async()=>{
 const db=await setup();try{
 await assert.rejects(db.query("select update_service_vip_status(1,'vip',now(),true)"),/Administrator access required/);
 await assert.rejects(db.query("update mechanic_services set vip_status='vip' where id=1"),/administrator approval/);
 await assert.rejects(db.query("insert into mechanic_services(id,vip_status) values(2,'vip')"),/administrator approval/);
 await assert.rejects(db.query("update posts set is_pinned=true"),/Only administrators/);
 await assert.rejects(db.query(`insert into posts(id,is_pinned) values('${admin}',true)`),/Only administrators/);
 await db.query("update mechanic_services set title='updated' where id=1");
 await db.query("update posts set content='edited'");
 await db.exec(`select set_config('request.jwt.claim.sub','${admin}',false)`);
 await db.query("select update_service_vip_status(1,'vip',now(),true)");
 await db.query("update posts set is_pinned=true");
 await db.exec('reset role');
 await db.query('update mechanic_services set is_vip_active=false');
 assert.equal((await db.query('select is_vip_active from mechanic_services')).rows[0].is_vip_active,false);
 }finally{await db.close();}
});
test('raw search history is private, write-only tracking increments atomically',async()=>{
 const db=await setup();try{
 await db.exec('set role anon');
 await db.query("select record_search_query(' Engine ')");
 await db.query("select record_search_query('engine')");
 assert.equal((await db.query('select * from search_queries')).rows.length,0);
 await assert.rejects(db.query("insert into search_queries values('spoof',999,now(),now())"),/row-level security/);
 await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${admin}',false)`);
 assert.equal((await db.query('select search_count from search_queries')).rows[0].search_count,2);
 }finally{await db.close();}
});
test('public catalogue remains readable; private certificates and unpublished venues do not',async()=>{
 const db=await setup();try{
 await db.exec("reset role; insert into drives(id,is_published) values(2,false); set role anon; select set_config('request.jwt.claim.sub','',false)");
 assert.equal((await db.query('select * from mechanic_profiles')).rows.length,1);
 assert.equal((await db.query('select * from certificates')).rows.length,0);
 assert.equal((await db.query('select * from drives')).rows.length,1);
 await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${owner}',false)`);
 assert.equal((await db.query('select * from certificates')).rows.length,1);
 await db.exec('reset role; update certificates set is_public=true; set role anon');
 assert.equal((await db.query('select * from certificates')).rows.length,1);
 }finally{await db.close();}
});

test('Edge pin action fails closed before using its service-role write access',async()=>{
 const ts=(await import('typescript')).default;
 const vm=await import('node:vm');
 const source=await readFile(new URL('../supabase/functions/community-action/index.ts',import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};
 vm.runInNewContext(compiled,{exports,require:()=>({}),Deno:{serve:()=>{}},Map,Date,console});
 let writes=0;
 const mock=(allowed,error=null)=>({rpc:async(name,args)=>{assert.equal(name,'is_admin');assert.equal(args.user_id,owner);return {data:allowed,error};},from:()=>{writes++;return {update:()=>({eq:async()=>({error:null})})};}});
 await assert.rejects(exports.pinPost(mock(false),owner,{postId:owner,isPinned:true}),/Forbidden/);
 await assert.rejects(exports.pinPost(mock(null,new Error('unavailable')),owner,{postId:owner,isPinned:true}),/Forbidden/);
 assert.equal(writes,0);
 await exports.pinPost(mock(true),owner,{postId:owner,isPinned:true});
 await exports.pinPost(mock(true),owner,{postId:owner,isPinned:false});
 assert.equal(writes,2);
});


test('ordinary edits of expired VIP services still allow the server expiry trigger',async()=>{
 const db=await setup();try{
 await db.exec(`reset role;
 create function check_expiry() returns trigger language plpgsql security definer as $$begin if new.vip_until<now() then new.is_vip_active=false; end if; return new; end;$$;
 create trigger check_vip_expiration_trigger before insert or update on mechanic_services for each row execute function check_expiry();
 update mechanic_services set vip_status='vip',vip_until=now()-interval '1 day',is_vip_active=true;
 alter table mechanic_services disable trigger check_vip_expiration_trigger;
 update mechanic_services set is_vip_active=true;
 alter table mechanic_services enable trigger check_vip_expiration_trigger;
 set role authenticated; select set_config('request.jwt.claim.sub','${owner}',false);`);
 await db.query("update mechanic_services set title='ordinary edit' where id=1");
 assert.equal((await db.query('select is_vip_active from mechanic_services where id=1')).rows[0].is_vip_active,false);
 await assert.rejects(db.query("update mechanic_services set vip_until=now()+interval '1 year' where id=1"),/administrator approval/);
 }finally{await db.close();}
});
