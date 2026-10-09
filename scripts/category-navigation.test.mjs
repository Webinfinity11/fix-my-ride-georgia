import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

function workboxOptions() {
  const exports = {};
  let options;
  const source = ts.transpileModule(readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  vm.runInNewContext(source, { exports, __dirname: fileURLToPath(new URL('..', import.meta.url)), require(name) {
    if (name === 'vite') return { defineConfig: config => config };
    if (name === 'node:fs') return { readFileSync };
    if (name === 'path') return path;
    if (name === '@vitejs/plugin-react-swc') return () => ({});
    if (name === 'lovable-tagger') return {};
    if (name === './scripts/map-layer-counts.mjs') return { mapLayerCountsPlugin: () => ({}) };
    if (name === './scripts/category-boot-shell.mjs') return {};
    if (name === './scripts/service-image-preload.mjs') return {};
    if (name === 'vite-plugin-pwa') return { VitePWA: value => { options = value.workbox; return {}; } };
    throw new Error(name);
  } });
  exports.default({ mode: 'production' });
  return options;
}

test('parent category navigations keep their own HTML with an offline shell fallback', () => {
  const config = workboxOptions();
  const rule = config.runtimeCaching.find(item => item.options?.cacheName === 'public-category-documents');
  for (const pathname of ['/', '/category/lights', '/category/lights/', '/service/538-example', '/service/538-example/']) {
    assert.equal(config.navigateFallbackDenylist.some(regex => regex.test(pathname)), true);
    assert.equal(rule.urlPattern({ url: { pathname }, request: { mode: 'navigate' }, sameOrigin: true }), true);
  }
  for (const pathname of ['/dashboard/admin', '/category/lights/gldani', '/rest/v1/profiles']) {
    assert.equal(config.navigateFallbackDenylist.some(regex => regex.test(pathname)), false);
    assert.equal(rule.urlPattern({ url: { pathname }, request: { mode: 'navigate' }, sameOrigin: true }), false);
  }
  assert.equal(rule.urlPattern({ url: { pathname: '/category/lights' }, request: { mode: 'cors' }, sameOrigin: true }), false);
  assert.equal(rule.handler, 'NetworkFirst');
  assert.equal(rule.options.precacheFallback.fallbackURL, '/index.html');
  assert.equal(rule.options.networkTimeoutSeconds, 1);
});
