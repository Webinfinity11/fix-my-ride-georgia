import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const lib = {};
new Function('exports', ts.transpileModule(readFileSync(new URL('../src/lib/phoneSearch.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(lib);

test('a phone number is recognised however it is typed', () => {
  for (const typed of ['579554433', '579 55 44 33', '+995 579-55-44-33', '995579554433', '0579554433']) {
    assert.equal(lib.phoneDigits(typed), '579554433', typed);
  }
});

test('listing numbers and words are not phone numbers', () => {
  for (const typed of ['626', '#579554433', '12345678', 'დიაგნოსტიკა', 'BMW 579554433']) {
    assert.equal(lib.phoneDigits(typed), null, typed);
  }
});

test('the stored number may contain spaces or dashes', () => {
  const stored = new RegExp(lib.phonePattern('579554433'));
  assert.ok(stored.test('+995 579 55-44-33'));
  assert.ok(!stored.test('579554434'));
});
