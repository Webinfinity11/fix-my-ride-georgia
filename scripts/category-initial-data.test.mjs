import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync(new URL('../src/lib/categorySnapshot.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function read({ path = '/category/lights', stamp = path, payload } = {}) {
  const exports = {};
  vm.runInNewContext(source, { exports, window: { location: { pathname: path } }, document: {
    documentElement: { getAttribute: () => stamp },
    getElementById: () => payload == null ? null : { textContent: typeof payload === 'string' ? payload : JSON.stringify(payload) },
  } });
  return exports.readCategorySnapshot();
}
const valid = { path: '/category/lights', category: { id: 4, name: 'Lights' }, services: [{ id: 5, category: { id: 4 } }], totalCount: 1, hasMore: false };

test('matching public snapshot seeds its own route, including trailing slashes', () => {
  assert.equal(read({ payload: valid }).services[0].id, 5);
  assert.equal(read({ path: '/category/lights/', stamp: '/category/lights', payload: valid }).category.id, 4);
});

test('SPA fallback and another category cannot leak listings into the current route', () => {
  assert.equal(read({ stamp: '/', payload: valid }), null);
  assert.equal(read({ path: '/category/brakes', payload: valid }), null);
  assert.equal(read({ payload: { ...valid, services: [{ id: 5, category: { id: 99 } }] } }), null);
});

test('missing, malformed and oversized data falls back to the live API', () => {
  assert.equal(read(), null);
  assert.equal(read({ payload: '{broken' }), null);
  assert.equal(read({ payload: { ...valid, services: Array(25).fill(valid.services[0]) } }), null);
  assert.equal(read({ payload: { ...valid, services: [null] } }), null);
});
