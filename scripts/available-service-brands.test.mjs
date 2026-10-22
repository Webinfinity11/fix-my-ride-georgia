import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/utils/availableServiceBrands.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports });
const rows = [
  {category_id: 1, city: 'თბილისი', car_brands: ['Toyota', 'BMW']},
  {category_id: 2, city: 'თბილისი', car_brands: ['Nissan']},
  {category_id: 1, city: 'ბათუმი', car_brands: ['Honda']},
  {category_id: 1, city: 'თბილისი', car_brands: null},
  {category_id: 1, city: 'თბილისი', car_brands: []},
];
const brands = (category, city) => [...exports.availableServiceBrands(rows, category, city)].sort();
test('category and city intersect; unrelated Nissan is not offered', () => {
  assert.deepEqual(brands(1, 'თბილისი'), ['BMW', 'Toyota']);
  assert.deepEqual(brands(1, null), ['BMW', 'Honda', 'Toyota']);
  assert.deepEqual(brands('all', 'თბილისი'), ['BMW', 'Nissan', 'Toyota']);
  assert.deepEqual(brands(2, 'ბათუმი'), []);
});
test('full inventory contributes candidates beyond the first result page', () => {
  const inventory = [...Array(1000).fill(rows[0]), rows[2]];
  assert.ok(exports.availableServiceBrands(inventory, 1, null).has('Honda'));
});
