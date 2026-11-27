import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const lib = {};
new Function('exports', ts.transpileModule(readFileSync(new URL('../src/lib/vipPhone.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(lib);

test('the country code and a leading zero are removed, the number is grouped', () => {
  for (const typed of ['555123456', '+995 555 12 34 56', '995555123456', '0555-12-34-56']) {
    assert.equal(lib.nationalDigits(typed), '555123456', typed);
  }
  assert.equal(lib.formatNational('555123456'), '555 12 34 56');
  assert.equal(lib.formatNational('5551'), '555 1');
});

test('only a complete Georgian mobile number may be sent', () => {
  assert.equal(lib.isMobile('555123456'), true);
  assert.equal(lib.isMobile('55512345'), false);
  assert.equal(lib.isMobile('322121212'), false);
});
