import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { transformSync } from 'esbuild';
import { parseAst } from 'rollup/parseAst';

// Exercise the actual bootstrap callback after the production console-stripping
// transform. A source-level test missed that console.error became an empty body.
function productionReporter(window, setTimeout) {
  const source = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
  const { code } = transformSync(source, { loader: 'tsx', drop: ['console', 'debugger'] });
  let callback;
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'Property' && node.key?.name === 'onRecoverableError') callback = node;
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  }
  visit(parseAst(code));
  assert.ok(callback, 'Hydration must retain an explicit error reporter');
  const expression = code.slice(callback.start, callback.end);
  return runInNewContext(`({${expression}}).onRecoverableError`, { window, setTimeout });
}

test('production hydration failures remain browser errors with component context', () => {
  const errors = [];
  const report = productionReporter({ reportError: error => errors.push(error) }, () => assert.fail('Unexpected fallback'));
  report(new Error('Hydration mismatch'), { componentStack: '\n at Header\n at Layout' });
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /Hydration mismatch/);
  assert.match(errors[0].message, /at Header/);
});

test('browsers without reportError still surface hydration failures', () => {
  let scheduled;
  const report = productionReporter({}, callback => { scheduled = callback; });
  report('Hydration mismatch', { componentStack: '\n at ServiceDetail' });
  assert.equal(typeof scheduled, 'function');
  assert.throws(scheduled, /Hydration mismatch[\s\S]*at ServiceDetail/);
});
