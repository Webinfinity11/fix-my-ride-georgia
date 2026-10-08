import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { injectServiceImagePreload } from './service-image-preload.mjs';
const services = {'538': { name:'<title>', image:'/assets/service-display-hash.webp' }};
function hint(path) {
 const html=injectServiceImagePreload('<html><head></head><body></body></html>',services);
 const appended=[];const window={};
 vm.runInNewContext(html.match(/<script id="service-image-preload">([\s\S]*?)<\/script>/)[1], {location:{pathname:path},window,document:{createElement:()=>({setAttribute(k,v){this[k]=v}}),head:{appendChild:el=>appended.push(el)}}});
 return {appended,window,html};
}
test('matching service gets exactly one high priority prepared image',()=>{const {appended}=hint('/service/538-example'); assert.equal(appended.length,1);assert.equal(appended[0].href,services[538].image);assert.equal(appended[0].fetchpriority,'high');});
test('other routes, unknown ids and nested paths request no photos',()=>{for(const route of ['/', '/category/538','/service/999-no','/service/538-extra/nested'])assert.equal(hint(route).appended.length,0);});
test('payload is HTML safe and reinjection replaces previous scripts',()=>{const first=hint('/service/538').html;assert.ok(!first.includes('"<title>"'));const second=injectServiceImagePreload(first,services);assert.equal((second.match(/id="service-image-preload"/g)||[]).length,1);assert.equal((second.match(/id="service-boot-shell"/g)||[]).length,1);});
