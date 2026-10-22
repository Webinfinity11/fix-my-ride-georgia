import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};const storage=new Map();
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/utils/serviceRotation.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,window:{},sessionStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},crypto:{randomUUID:()=> 'session-one'}});
const rows=Array.from({length:60},(_,id)=>({id,mechanic_id:id<40?'prolific':`provider:${id}`}));
test('first round gives each provider one slot before any repeats, across pagination',()=>{
 const ids=exports.rotateServiceIds(rows,'seed');
 assert.equal(new Set(ids).size,60);
 assert.equal(new Set(ids.slice(0,21).map(id=>rows[id].mechanic_id)).size,21);
 assert.deepEqual([...ids.slice(0,24),...ids.slice(24)],Array.from(ids));
 assert.deepEqual(exports.rotateServiceIds([...rows].reverse(),'seed'),ids);
 assert.notDeepEqual(exports.rotateServiceIds(rows,'other'),ids);
});
test('paid tiers stay ahead, expired VIP has no promotion, hidden profiles stay distinct',()=>{
 const data=[{id:1,mechanic_id:'a',is_vip_active:true,vip_status:'super_vip',vip_until:'2099-01-01'},{id:2,mechanic_id:'b',is_vip_active:true,vip_status:'vip',vip_until:'2099-01-01'},{id:3,mechanic_id:'c',is_vip_active:true,vip_status:'super_vip',vip_until:'2000-01-01'},{id:4,mechanic_id:null},{id:5,mechanic_id:null}];
 const ids=exports.rotateServiceIds(data,'seed');assert.deepEqual(Array.from(ids.slice(0,2)),[1,2]);assert.equal(ids.length,5);
});
test('session seed and filtered snapshot survive reloads; scopes stay separate',async()=>{
 assert.equal(exports.serviceRotationSeed(),exports.serviceRotationSeed());
 const first=await exports.sessionServiceIds('city:a',async()=>[1,2,3]);
 assert.deepEqual(Array.from(await exports.sessionServiceIds('city:a',async()=>[4,1,2,3])),Array.from(first));
 assert.deepEqual(Array.from(await exports.sessionServiceIds('city:b',async()=>[8])),[8]);
});
