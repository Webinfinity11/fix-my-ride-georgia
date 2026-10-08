import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { injectServiceImagePreload } from './service-image-preload.mjs';
const services = {'538':{data:'/assets/service-initial-hash.json'}};
const preview={id:538,name:'<title>',description:'<script>unsafe</script>',city:'ჩოხატაური',price_from:20,price_to:30,image:'/assets/service-display-hash.webp'};
function boot(path) {
 const html=injectServiceImagePreload('<html><head></head><body></body></html>',services);
 const images=[],frames=[],requests=[];const window={};let resolveFetch;
 const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const main={innerHTML:''};const slot={appendChild:img=>images.push(img)};
 class Element {
  constructor(tag){this.tag=tag;this.style={};this.textContent='';this.content='';}
  setAttribute(k,v){this[k]=v;}
  set innerHTML(s){this.content=s;}
  get innerHTML(){return this.tag==='span'?escape(this.textContent):this.content;}
  get outerHTML(){return '<div>'+this.content+main.innerHTML+'</div>';}
  querySelector(){return main;}
 }
 const root={innerHTML:'',wrapper:null,appendChild(el){this.wrapper=el;},querySelector(selector){return selector==='[data-service-first-photo]'?slot:this.wrapper;}};
 const context={location:{pathname:path},window,requestAnimationFrame:fn=>frames.push(fn),fetch:(url,options)=>{requests.push({url,options});return new Promise(resolve=>{resolveFetch=resolve;});},document:{getElementById:id=>id==='root'?root:null,createElement:tag=>new Element(tag)}};
 for(const [,script] of html.matchAll(/<script id="service-(?:image-preload|boot-shell)">([\s\S]*?)<\/script>/g))vm.runInNewContext(script,context);
 return {html,images,frames,requests,root,main,window,context,async resolve(data=preview,ok=true){resolveFetch({ok,json:()=>Promise.resolve(data)});await window.__fixupServicePreviewPromise;await Promise.resolve();}};
}
test('only matching service text is fetched; no photos compete for initial rendering',async()=>{const state=boot('/service/538-example');assert.equal(state.requests.length,1);assert.equal(state.requests[0].url,services[538].data);assert.equal(state.requests[0].options.credentials,'omit');assert.equal(state.images.length,0);await state.resolve();assert.ok(state.main.innerHTML.includes('&lt;title&gt;'));assert.ok(state.main.innerHTML.includes('&lt;script&gt;unsafe'));assert.ok(state.main.innerHTML.includes('₾20 - ₾30'));assert.ok(state.main.innerHTML.includes('data-service-first-photo'));assert.equal(state.images.length,0);});
test('first photo starts only after public text has had a paint opportunity',async()=>{const state=boot('/service/538-example');await state.resolve();state.frames.shift()();assert.equal(state.images.length,0);state.frames.shift()();assert.equal(state.images.length,1);assert.equal(state.images[0].src,preview.image);assert.equal(state.images[0].fetchpriority,'high');});
test('other routes, unknown ids and nested paths request no preview or photo',()=>{for(const path of ['/', '/category/538','/service/999-no','/service/538-extra/nested']){const state=boot(path);assert.equal(state.requests.length,0);assert.equal(state.frames.length,0);}});
test('preview failure leaves live React page able to finish without photo requests',async()=>{const state=boot('/service/538-example');await state.resolve(null,false);assert.equal(state.main.innerHTML,'');assert.equal(state.frames.length,0);});
test('late preview does not overwrite a completed live page',async()=>{const state=boot('/service/538-example');state.root.wrapper=null;await state.resolve();assert.equal(state.main.innerHTML,'');assert.equal(state.frames.length,0);});
test('navigation cancels the pending preview photo',async()=>{const state=boot('/service/538-example');await state.resolve();state.context.location.pathname='/service/other';state.frames.shift()();state.frames.shift()();assert.equal(state.images.length,0);});
test('reinjection replaces previous scripts instead of running twice',()=>{const first=boot('/service/538').html;const second=injectServiceImagePreload(first,services);assert.equal((second.match(/id="service-image-preload"/g)||[]).length,1);assert.equal((second.match(/id="service-boot-shell"/g)||[]).length,1);});

test('encoding declaration stays ahead of scripts and within the first kilobyte',()=>{const html=injectServiceImagePreload('<html><head><meta charset="UTF-8"><title>ქართული</title></head><body></body></html>',services);assert.ok(html.indexOf('charset="UTF-8"')<1024);assert.ok(html.indexOf('charset="UTF-8"')<html.indexOf('id="service-image-preload"'));});
