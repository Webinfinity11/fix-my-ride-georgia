import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { getServiceRoutes, prepareServiceSnapshot, servicePath, assertServiceDocument } from './service-prerender.mjs';

test('every generated public service has a canonical route, without build env credentials', () => {
  const routes = getServiceRoutes(new URL('../', import.meta.url).pathname);
  assert.ok(routes.length > 500);
  assert.equal(new Set(routes).size, routes.length);
  assert.ok(routes.includes('/service/538-dazianebuli-salonis-sruli-aghdgena-chokhataurshi'));
  assert.equal(servicePath({id: 2, name: 'ძრავის შეკეთება!'}), '/service/2-dzravis-sheketeba');
});

const source = '<html data-ssg="/service/538-example"><head><meta name="viewport" content="width=device-width"><script id="service-image-preload">oldFetch()</script></head><body><div id="root"><h1>Service</h1><img src="/assets/photo.webp"></div><script id="service-boot-shell">oldReplace()</script></body></html>';
test('static document exposes the LCP image before app modules and removes the extra preview chain', () => {
  const html = prepareServiceSnapshot(source, '/assets/photo.webp');
  assert.ok(html.indexOf('as="image"') < html.indexOf('<body>'));
  assert.ok(html.includes('fetchpriority="high"'));
  assert.ok(html.includes('<h1>Service</h1>'));
  assert.ok(!html.includes('oldFetch'));
  assert.ok(!html.includes('oldReplace'));
});

test('React loading fallback preserves the real matching document without replacing its DOM', () => {
  const html = prepareServiceSnapshot(source, null);
  const script = html.match(/<script id="service-static-snapshot">([\s\S]*?)<\/script>/)[1];
  const root = { innerHTML: '<h1>Service</h1><img src="/assets/photo.webp">' };
  const context = {window:{},location:{pathname:'/service/538-example/'},document:{documentElement:{getAttribute:()=>'/service/538-example'},getElementById:()=>root}};
  vm.runInNewContext(script, context);
  assert.equal(context.window.__fixupServiceBoot.html, root.innerHTML);
  assert.equal(context.window.__fixupServiceBoot.path, '/service/538-example');
  context.window = {};
  context.location.pathname = '/service/999-other';
  vm.runInNewContext(script, context);
  assert.equal(context.window.__fixupServiceBoot, undefined);
});

test('hydration data cannot terminate its JSON script with service text', () => {
  const snapshot = { path: '/service/538-example', service: { id: 538, name: '</script><script>bad()</script>' } };
  const html = prepareServiceSnapshot(source, null, snapshot);
  const json = html.match(/<script type="application\/json" id="service-initial-data">([\s\S]*?)<\/script>/)[1];
  assert.deepEqual(JSON.parse(json), snapshot);
  assert.ok(!json.includes('<'));
});

test('a captured DOM without React hydration markers cannot pass the build check', () => {
  const route = '/service/538-example';
  const html = prepareServiceSnapshot(source, null, { path: route, service: { id: 538 } });
  assert.throws(() => assertServiceDocument(html, route), /Missing hydratable/);
  const ready = html.replace('<h1>', '<!--$--><section data-service-page-id="538"></section><h1>');
  assert.doesNotThrow(() => assertServiceDocument(ready, route));
  assert.throws(() => assertServiceDocument(ready, '/service/999-other'), /mismatch/);
});
