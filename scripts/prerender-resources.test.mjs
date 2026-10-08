import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { cleanPrerenderResources, injectLcpImagePreload } from './prerender-resources.mjs';

const appCSS = '<link rel="stylesheet" crossorigin href="/assets/index.css">';
const mapCSS = '<link rel="stylesheet" crossorigin="" href="/assets/leaflet.css">';
const analytics = '<script async="" src="https://www.googletagmanager.com/gtag/js?id=G-SHBK1B237B"></script>';
const appModule = '<link rel="modulepreload" crossorigin href="/assets/react.js">';
const lazyModules = '<link rel="modulepreload" as="script" crossorigin="" href="/assets/Index.js">'
  + '<link rel="modulepreload" as="script" crossorigin="" href="/assets/map-vendor.js">';
const shell = appModule + appCSS + '<script type="module" src="/assets/index.js"></script>'
  + '<script>window.addEventListener("load", loadAnalytics)</script>'
  + '<link rel="preload" href="/fonts/georgian.woff2" as="font">'
  + '<script type="application/ld+json">{"@type":"CollectionPage"}</script>';

test('snapshots exclude analytics and lazy route downloads while keeping the app and SEO', () => {
  const clean = cleanPrerenderResources(shell + analytics + mapCSS + lazyModules + analytics, shell);
  assert.equal(clean, shell);
  assert.equal(cleanPrerenderResources(clean, shell), shell);
});

test('runtime toast CSS is omitted while app and critical styles stay available', () => {
  const source = '<style>body{margin:0}</style><style type="text/css">[data-sonner-toaster]{position:fixed}</style>';
  assert.equal(cleanPrerenderResources(source, shell), '<style>body{margin:0}</style>');
});

test('the LCP preload appears before CSS and is escaped and replaced on recapture', () => {
  const source = '<head><meta name="viewport" content="width=device-width"><style>body{margin:0}</style></head>';
  const first = injectLcpImagePreload(source, '/image.webp?width=400&quality=70');
  assert.ok(first.indexOf('data-category-lcp') < first.indexOf('<style>'));
  assert.ok(first.includes('width=400&amp;quality=70'));
  const refreshed = injectLcpImagePreload(first, '/new.webp');
  assert.equal((refreshed.match(/data-category-lcp/g) || []).length, 1);
  assert.ok(!refreshed.includes('/image.webp'));
});

test('analytics loader schedules one script even when replayed by a snapshot', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const loader = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map(([, code]) => code).find(code => code.includes('window.dataLayer'));
  assert.ok(loader);
  for (const existing of [false, true]) {
    const scheduled = [];
    const appended = [];
    const context = vm.createContext({
      window: { addEventListener: (_event, cb) => cb() },
      dataLayer: [],
      document: {
        querySelector: () => existing || appended.length > 0,
        createElement: () => ({}),
        head: { appendChild: script => appended.push(script) },
      },
      setTimeout: cb => scheduled.push(cb),
    });
    vm.runInContext(loader, context);
    vm.runInContext(loader, context);
    scheduled.forEach(cb => cb());
    assert.equal(appended.length, existing ? 0 : 1);
  }
});
