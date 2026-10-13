import test from 'node:test';
import assert from 'node:assert/strict';
import {modelRoutes,categorySlug} from './model-routes.mjs';
test('one confirmed model assignment produces only its actual service and district combinations',()=>{
 const routes=modelRoutes([{is_active:true,car_brands:['Honda'],vehicle_models:[{brand:'Honda',model:'Fit',slug:'fit'}],category_id:7,district:'გლდანი'}],[{id:7,name:'ზეთის შეცვლა'},{id:8,name:'დიაგნოსტიკა'}]);
 assert.deepEqual(routes,['/brand/honda/model/fit','/brand/honda/model/fit/service/zetis-shetsvla','/brand/honda/model/fit/service/zetis-shetsvla/district/gldani']);
 assert.equal(categorySlug('ზეთის შეცვლა'),'zetis-shetsvla');
});
test('text candidates, empty assignments, inactive services and deselected brands never enter model sitemap',()=>{
 const routes=modelRoutes([{name:'Ford Fusion',car_brands:['Ford'],vehicle_models:[]},{is_active:false,car_brands:['Honda'],vehicle_models:[{brand:'Honda',slug:'fit'}]},{car_brands:['Ford'],vehicle_models:[{brand:'Honda',slug:'fit'}]}],[]);
 assert.deepEqual(routes,[]);
});
