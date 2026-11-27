import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const lib = {};
new Function('exports', ts.transpileModule(readFileSync(new URL('../src/lib/cityNames.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(lib);

const tbilisi = ['თბილისი', 'თბილისი ', 'Tbilisi', 'tbilisi', 'Tbilisi, Georgia', 'თბილისის'];

test('every typed spelling of a city becomes one name', () => {
  for (const typed of tbilisi) assert.equal(lib.cityName(typed), 'თბილისი', typed);
  assert.equal(lib.cityName('Მცხეთა'), 'მცხეთა');
  assert.deepEqual(lib.mergedNames([...tbilisi, 'ბათუმი', 'Xfct', '', null], lib.cityName), ['თბილისი', 'ბათუმი']);
});

test('choosing a city finds all its stored spellings and nothing else', () => {
  const pattern = new RegExp(lib.cityPattern('თბილისი'), 'i');
  for (const typed of tbilisi) assert.ok(pattern.test(typed), typed);
  assert.ok(!pattern.test('ბათუმი'));
  assert.ok(new RegExp(lib.cityPattern('მცხეთა'), 'i').test('Მცხეთა'));
});

test('districts merge spellings and typos but stay separate places', () => {
  assert.deepEqual(lib.mergedNames(['ვარკეთილი', 'ვარკეთილი ', 'ვარკ', 'saburtall', 'tbilisi', '**'], lib.districtName), ['ვარკეთილი', 'საბურთალო']);
  const pattern = new RegExp(lib.districtPattern('ვარკეთილი'), 'i');
  assert.ok(pattern.test('ვარკეთილი '));
  assert.ok(!pattern.test('ვარკეთილის მეურნეობა'));
});
