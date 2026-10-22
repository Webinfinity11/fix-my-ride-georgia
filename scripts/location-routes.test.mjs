import assert from 'node:assert/strict';
import test from 'node:test';
import {locationRoutes} from './location-routes.mjs';

test('city and category-city URLs use separate namespaces and provider/listing eligibility',()=>{
 const categories=[{id:11,name:'ძრავის შეკეთება'},{id:17,name:'დიაგნოსტიკა'}];
 const rows=[...Array.from({length:6},(_,i)=>({city:'რუსთავი',category_id:i<2?11:17,mechanic_id:'m'+i%2})),...Array.from({length:5},()=>({city:'ბათუმი',category_id:11,mechanic_id:'one'})),{city:'რუსთავი',category_id:11,mechanic_id:'m3',is_active:false}];
 const routes=locationRoutes(rows,categories);
 assert.ok(routes.indexable.includes('/city/rustavi'));
 assert.ok(!routes.indexable.includes('/city/batumi'));
 assert.ok(routes.render.includes('/category/dzravis-sheketeba/city/rustavi'));
 assert.ok(!routes.indexable.includes('/category/dzravis-sheketeba/city/rustavi'));
 assert.ok(!routes.render.includes('/category/dzravis-sheketeba/rustavi'));
 assert.ok(!routes.render.includes('/city/tbilisi'));
 assert.equal(new Set(routes.render).size,routes.render.length);
});

test('a category-city page qualifies only with its own inventory, independently of its city',()=>{
 const services=Array.from({length:5},(_,i)=>({city:'თბილისი',category_id:11,mechanic_id:'m'+i%2}));
 const paths=locationRoutes(services,[{id:11,name:'ძრავის შეკეთება'},{id:17,name:'დიაგნოსტიკა'}]);
 assert.ok(paths.indexable.includes('/category/dzravis-sheketeba/city/tbilisi'));
 assert.ok(!paths.render.some(path=>path.includes('diagnostika')));
});
