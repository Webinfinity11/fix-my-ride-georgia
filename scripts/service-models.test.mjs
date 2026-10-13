import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { loadModelHelpers } from './model-test-utils.mjs';
const helpers=loadModelHelpers();
test('model identity is brand-scoped and text extraction produces candidates only',()=>{
 assert.equal(helpers.modelSlug(' Model 3 '),'model3');
 assert.equal(helpers.normalizeModels([{brand:'Ford',model:'C-Max'},{brand:'Ford',model:'C Max'}]).length,1);
 assert.equal(helpers.normalizeModels([{brand:'Ford',model:'Fusion'},{brand:'Honda',model:'Fusion'}]).length,2);
 assert.equal(helpers.candidateModels('ზეთის შეცვლა ფიტზე','',['Honda']).length,1);
 assert.equal(helpers.candidateModels('ზეთის შეცვლა ფიტზე','',['Ford']).length,0);
 assert.equal(helpers.normalizeModels(undefined).length,0);
});
test('database validates models, removes deselected brands and preserves service ownership',async()=>{
 const db=new PGlite();
 const a='11111111-1111-4111-8111-111111111111', b='22222222-2222-4222-8222-222222222222';
 try {
 await db.exec(`create role authenticated; create schema auth; create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create table mechanic_services(id int primary key,mechanic_id uuid,car_brands text[]);
 alter table mechanic_services enable row level security;
 grant usage on schema public,auth to authenticated; grant select,insert,update on mechanic_services to authenticated;
 create policy own on mechanic_services for all to authenticated using(mechanic_id=auth.uid()) with check(mechanic_id=auth.uid());
 insert into mechanic_services values(1,'${a}',array['Ford']);`);
 await db.exec(await readFile(new URL('../supabase/migrations/20261013200000_service_vehicle_models.sql',import.meta.url),'utf8'));
 await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${a}',false)`);
 await db.query('update mechanic_services set vehicle_models=$1::jsonb where id=1',[JSON.stringify([{brand:'Ford',model:' C-Max ',slug:'evil'},{brand:'Ford',model:'C Max'}])]);
 const rows=(await db.query('select vehicle_models from mechanic_services')).rows;
 assert.deepEqual(rows[0].vehicle_models,[{brand:'Ford',model:'C-Max',slug:'cmax'}]);
 await assert.rejects(db.query('update mechanic_services set vehicle_models=$1::jsonb',[JSON.stringify({brand:'Ford'})]),/50 vehicle models/);
 await assert.rejects(db.query('update mechanic_services set vehicle_models=$1::jsonb',[JSON.stringify([{brand:'Ford',model:'!!!'}])]),/Latin letters/);
 await db.exec(`select set_config('request.jwt.claim.sub','${b}',false)`);
 assert.equal((await db.query("update mechanic_services set vehicle_models='[]' returning id")).rows.length,0);
 await db.exec(`select set_config('request.jwt.claim.sub','${a}',false); update mechanic_services set car_brands=array['Honda'];`);
 assert.deepEqual((await db.query('select vehicle_models from mechanic_services')).rows[0].vehicle_models,[]);
 } finally {await db.close();}
});
