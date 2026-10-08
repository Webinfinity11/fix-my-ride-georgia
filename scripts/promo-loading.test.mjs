import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

test('promos wait until the first screen is passed and clean up their listener', () => {
  const listeners = new Map();
  let visible = false;
  let cleanup;
  const win = { scrollY: 0, innerHeight: 812,
    addEventListener: (event, cb) => listeners.set(event, cb),
    removeEventListener: event => listeners.delete(event),
  };
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL('../src/hooks/usePastFirstScreen.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(source, { exports, window: win, require: () => ({
    useState: () => [visible, value => { visible = value; }],
    useEffect: cb => { cleanup = cb(); },
  }) });
  exports.usePastFirstScreen();
  assert.equal(visible, false);
  win.scrollY = 100; listeners.get('scroll')();
  assert.equal(visible, false);
  win.scrollY = 812; listeners.get('scroll')();
  assert.equal(visible, true);
  assert.equal(listeners.size, 0);
  cleanup();
  assert.equal(listeners.size, 0);
});
