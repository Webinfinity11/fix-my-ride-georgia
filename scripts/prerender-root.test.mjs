import test from 'node:test';
import assert from 'node:assert/strict';
import { assertPageDocument } from './prerender-resources.mjs';
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
