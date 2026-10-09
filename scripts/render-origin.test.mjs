import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
const source = readFileSync(new URL('../src/lib/renderOrigin.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText;
function load() {
  const exports = {};
  runInNewContext(code, {exports});
  return exports.claimRenderOrigin;
}
test('fresh server HTML hydrates, but a serialized client DOM is not hydrated twice', () => {
  const root = {dataset: {}};
  assert.equal(load()(root), 'server');
  // A hosting prerenderer serializes attributes, then starts a new JS context.
  const capturedRoot = JSON.parse(JSON.stringify(root));
  assert.equal(load()(capturedRoot), 'client');
  assert.equal(load()(JSON.parse(JSON.stringify(capturedRoot))), 'client');
});
test('each fresh server response retains its hydration path', () => {
  const claim = load();
  assert.equal(claim({dataset: {}}), 'server');
  assert.equal(claim({dataset: {}}), 'server');
});
