import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import ts from 'typescript';import {readFileSync} from 'node:fs';
const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/utils/districtCategoryContent.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports});
test('district summary counts providers separately and only quotes positive stated prices',()=>{
 const rows=Array.from({length:31},(_,i)=>({id:i,name:'შეთავაზება',price_from:i===0?50:i===1?0:null,car_brands:i===0?['Ford','Ford']:Array(8).fill('Toyota'),on_site_service:i===0,mechanic_id:i%2?'owner-a':'owner-b'}));
 const result=exports.summarizeDistrictOffers(rows);assert.equal(result.serviceCount,31);assert.equal(result.providerCount,2);assert.equal(result.pricedCount,1);assert.equal(result.startingPrice,50);assert.equal(result.onsiteCount,1);assert.equal(result.brands.length,1);assert.equal(result.brands[0].name,'Ford');assert.equal(result.brands[0].count,1);
});
test('absent prices remain unknown rather than inventing a price or free offer',()=>{
 const stats=exports.summarizeDistrictOffers([{id:1,name:'შეთავაზება',price_from:0,car_brands:[],on_site_service:false,mechanic_id:null}]);assert.equal(stats.startingPrice,null);assert.equal(stats.pricedCount,0);assert.equal(stats.providerCount,0);
});
