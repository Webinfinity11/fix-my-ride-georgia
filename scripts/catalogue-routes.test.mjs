import test from 'node:test';import assert from 'node:assert/strict';
import vm from 'node:vm';import ts from 'typescript';import {readFileSync} from 'node:fs';
import {catalogueRoutes,serviceIndexable} from './catalogue-routes.mjs';
import {servicePath} from './service-prerender.mjs';
const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/utils/slugUtils.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:()=>({})});
test('sitemap and frontend canonical ignore legacy stored slugs and use the current ID/name path',()=>{
 for(const service of [{id:21,name:'ყველა სახის სერვისი ჰონდა ფიტზე',slug:'qvela-sakhis-servisi-honda-fitze'},{id:46,name:'კაბრიოლეტების შეკეთება წყლის სისტემის გამორეცხვა',slug:'46-old-short-name'}]) assert.equal(servicePath(service),`/service/${exports.createServiceSlug(service.id,service.name)}`);
});
test('one active listing qualifies its category and district; unrelated and empty combinations are absent',()=>{
 const category={id:23,name:'ფარების აღდგენა'};const service={id:1,name:'ფარის აღდგენა',category_id:23,district:'გლდანი',description:'რეალური მომსახურების დეტალური აღწერა'};
 const routes=catalogueRoutes([service,{...service,id:2,district:'ისანი',is_active:false}],[category,{id:24,name:'საქარე მინები'}]);
 assert.deepEqual(routes.categories,['/category/parebis-aghdgena','/category/parebis-aghdgena/gldani']);assert.equal(routes.services.length,1);
 assert.equal(serviceIndexable({...service,description:'',photos:[]}),false);assert.equal(serviceIndexable({...service,description:'',photos:['photo.jpg']}),true);
});

test('legacy aliases preserve IDs, never overwrite another canonical page, and resolve shared slugs to their category',async()=>{
 const {serviceAliases,mechanicAliases,mechanicRoutes}=await import('./catalogue-routes.mjs');
 const services=[{id:1,name:'First service',slug:'shared-old',category_id:7,mechanic_id:'owner'}, {id:2,name:'Second service',slug:'shared-old',category_id:7}, {id:3,name:'Third service',slug:'1-first-service',category_id:7}, {id:4,name:'Fourth service',slug:'1',category_id:7}];
 const aliases=serviceAliases(services,[{id:7,name:'ფარების აღდგენა'}]);
 assert.equal(aliases.find(a=>a.path==='/service/1')?.target,'/service/1-first-service');
 assert.equal(aliases.find(a=>a.path==='/service/shared-old')?.target,'/category/parebis-aghdgena');
 assert.equal(aliases.some(a=>a.path==='/service/1-first-service'),false);
 const paths=mechanicRoutes(services,[{id:'owner',first_name:'Dagi',last_name:'Dagi',city:null,mechanic_profiles:{display_id:307,description:null}},{id:'empty',first_name:'Empty',last_name:'Profile',city:null,mechanic_profiles:{display_id:308,description:null}}]);
 assert.deepEqual(paths,['/mechanic/307-dagi-dagi']);
 assert.deepEqual(mechanicAliases(paths),[{path:'/mechanic/307',target:'/mechanic/307-dagi-dagi'},{path:'/mechanic/307-307-dagi-dagi',target:'/mechanic/307-dagi-dagi'}]);
});

test('unnamed and symbol-only mechanic profiles stay reachable by ID without malformed sitemap URLs', async () => {
 const {mechanicRoutes}=await import('./catalogue-routes.mjs');
 assert.equal(exports.createMechanicSlug(230,'⚙️',''), '230');
 assert.equal(exports.createMechanicSlug(231,null,null), '231');
 assert.equal(exports.extractMechanicDisplayId('230-'), '230');
 assert.deepEqual(mechanicRoutes([{mechanic_id:'owner'}],[{id:'owner',first_name:'⚙️',last_name:'',mechanic_profiles:{display_id:230}}]),[]);
});
