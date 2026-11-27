import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const loader = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.includes('__fixupAnalyticsLoaded'));

function loadedFor(timeZone, webdriver = false) {
  const added = [];
  let onLoad;
  const window = { addEventListener: (_, fn) => { onLoad = fn; } };
  vm.runInNewContext(loader, {
    window, Date, dataLayer: [], navigator: { webdriver }, setTimeout: (fn) => fn(),
    Intl: { DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone }) }) },
    document: { querySelector: () => null, createElement: () => ({}), head: { appendChild: (el) => added.push(el.src) } },
  });
  onLoad();
  return added.length === 1;
}

test('Google Analytics loads only for non-automated browsers on Georgian time', () => {
  assert.equal(loadedFor('Asia/Tbilisi'), true);
  assert.equal(loadedFor('America/New_York'), false);
  assert.equal(loadedFor('UTC'), false);
  assert.equal(loadedFor('Asia/Tbilisi', true), false);
});
