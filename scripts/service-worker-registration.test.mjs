import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/registerSW.js',import.meta.url),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function harness(readyState='loading',reject=false,controlled=false){
 const events=[];const calls=[];let updates=0;
 vm.runInNewContext(source,{
  document:{readyState},window:{addEventListener:(...args)=>events.push(args)},
  navigator:{serviceWorker:{controller:controlled?{}:null,register(url,options){calls.push({url,options});return reject?Promise.reject(new Error('offline')):Promise.resolve({update(){updates++;return Promise.resolve();}});}}},
 });
 return {events,calls,get updates(){return updates;}};
}
test('registration waits for load, then explicitly checks the worker without HTTP cache',async()=>{
 const h=harness();assert.equal(h.calls.length,0);assert.equal(h.events[0][0],'load');assert.equal(h.events[0][2].once,true);
 h.events[0][1]();await tick();assert.equal(h.calls[0].url,'/sw.js');assert.equal(h.calls[0].options.scope,'/');assert.equal(h.calls[0].options.updateViaCache,'none');assert.equal(h.updates,1);
});
test('late loading registration still checks for an update',async()=>{const h=harness('complete');await tick();assert.equal(h.updates,1);});
test('offline registration failure is handled without an unhandled rejection',async()=>{const h=harness('complete',true);await tick();assert.equal(h.calls.length,1);assert.equal(h.updates,0);});
test('unsupported browsers do not register',()=>{vm.runInNewContext(source,{navigator:{}});});

test('existing clients update before load even when other resources are stuck',async()=>{const h=harness('loading',false,true);await tick();assert.equal(h.calls.length,1);assert.equal(h.events.length,0);assert.equal(h.updates,1);});
