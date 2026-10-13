import test from 'node:test';
import assert from 'node:assert/strict';
import { assertPageDocument, assertRouteDocument, restoreCapturedHead } from './prerender-resources.mjs';
const content = '<p>Public service content</p>'.repeat(220);
test('both initial and bootstrapped root elements are valid prerender output', () => {
  for (const tag of ['<div id="root">', '<div id="root" data-render-origin="client">', '<div data-render-origin="client" id="root">']) {
    assert.doesNotThrow(() => assertPageDocument(`${tag}${content}</div>`));
  }
});
test('missing roots and incomplete page output still fail publishing', () => {
  assert.throws(() => assertPageDocument(`<div id="other">${content}</div>`), /broken/);
  assert.throws(() => assertPageDocument('<div id="root"></div>'), /broken/);
  assert.throws(() => assertPageDocument(`<div data-id="root">${content}</div>`), /broken/);
});

test('homepage fallback and duplicate canonical signals cannot ship as another route', () => {
  const page = '<link rel="canonical" href="https://fixup.ge/fuel-importers"><h1>ფასები</h1>';
  assert.doesNotThrow(() => assertRouteDocument(page, '/fuel-importers'));
  assert.throws(() => assertRouteDocument(page.replace('/fuel-importers', ''), '/fuel-importers'), /canonical/);
  assert.throws(() => assertRouteDocument(page + '<link rel="canonical" href="https://fixup.ge">', '/fuel-importers'), /canonical/);
  assert.throws(() => assertRouteDocument(page.replace(/<h1>.*<\/h1>/, ''), '/fuel-importers'), /H1/);
});

test('server rendering cannot erase settled service SEO metadata', () => {
  const head = '<head><title>Repair</title><link rel="canonical" href="https://fixup.ge/service/1-repair"><meta name="robots" content="index, follow"></head>';
  const result = restoreCapturedHead('<html><head><title>Loading</title></head><body><h1>Repair</h1></body></html>', head);
  assertRouteDocument(result, '/service/1-repair');
  assert.ok(result.includes('name="robots" content="index, follow"'));
  assert.ok(!result.includes('Loading'));
});
