import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load() {
  const store = new Map();
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/reviewPrompt.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText,
  { exports, localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) } });
  return exports;
}
const HOUR = 3600e3;

test('a review is asked hours after the call, once, and not for old calls', () => {
  const lib = load();
  lib.rememberCall(7, 0);
  assert.equal(lib.dueReview(HOUR), null);
  assert.equal(lib.dueReview(4 * HOUR), 7);
  assert.equal(lib.dueReview(15 * 24 * HOUR), null);
  lib.markAsked(7);
  lib.rememberCall(7, 5 * HOUR);
  assert.equal(lib.dueReview(10 * HOUR), null);
});
