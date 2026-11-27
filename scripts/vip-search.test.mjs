import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const lib = {};
new Function('exports', ts.transpileModule(readFileSync(new URL('../src/lib/vipSearch.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(lib);

test('a listing is recognised by number or link, never by digits inside a name', () => {
  for (const value of ['123', '№ 123', 'https://fixup.ge/service/123-zetis-shecvla', 'fixup.ge/service/123']) {
    assert.equal(lib.listingId(value), 123, value);
  }
  for (const value of ['BMW 320', '24/7 აკუმულატორი', '0', '']) assert.equal(lib.listingId(value), null, value);
});

test('a mechanic is searched by profile number, phone or name', () => {
  assert.deepEqual(lib.mechanicQuery('200'), { by: 'number', number: 200 });
  assert.deepEqual(lib.mechanicQuery('+995 555 12 34 56'), { by: 'phone', digits: '555123456' });
  assert.deepEqual(lib.mechanicQuery(' გიორგი '), { by: 'name', pattern: '"%გიორგი%"' });
  assert.equal(lib.mechanicQuery('  '), null);
});
