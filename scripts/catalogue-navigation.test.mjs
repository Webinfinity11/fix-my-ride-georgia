import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};
const brands=JSON.parse(readFileSync(new URL('../src/data/brand-pages.json',import.meta.url),'utf8'));
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/utils/catalogueNavigation.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URLSearchParams,require(name){
 if(name.endsWith('/carBrands'))return {BRAND_PAGES:brands};
 if(name.endsWith('/locationCatalogue'))return {locationPath:(city,category)=>category?`/category/${category}/city/${city}`:`/city/${city}`};
 throw Error(name);
}});

test('category, city and brand remain independently composable without new route namespaces',()=>{
 assert.equal(exports.cataloguePath({categorySlug:'dzravis-sheketeba',citySlug:'rustavi',brands:['Toyota']}),'/category/dzravis-sheketeba/city/rustavi?brands=Toyota');
 assert.equal(exports.cataloguePath({categorySlug:'dzravis-sheketeba',brands:['Toyota']}),'/category/dzravis-sheketeba?brands=Toyota');
 assert.equal(exports.cataloguePath({citySlug:'rustavi',brands:['Toyota']}),'/city/rustavi?brands=Toyota');
 assert.equal(exports.cataloguePath({brands:['Toyota']}),'/brand/toyota');
 assert.equal(exports.cataloguePath({categorySlug:'dzravis-sheketeba',citySlug:'rustavi',brands:[]}),'/category/dzravis-sheketeba/city/rustavi');
});

test('brand query is stable, deduplicated and only reads supported brand names',()=>{
 const a=exports.cataloguePath({citySlug:'rustavi',brands:['Toyota','BMW','Toyota']});
 const b=exports.cataloguePath({citySlug:'rustavi',brands:['BMW','Toyota']});
 assert.equal(a,b);
 const parsed=exports.readBrandQuery(new URLSearchParams('brands=Toyota,BMW,Toyota,unknown'));
 assert.deepEqual([...parsed],['Toyota','BMW']);
});
