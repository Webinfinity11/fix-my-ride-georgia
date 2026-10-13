import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url), exports = {};
const code = ts.transpileModule(readFileSync(new URL('../supabase/functions/_shared/priceshub.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
new Function('require', 'exports', code)(require, exports);
export const { parsePricesHub } = exports;
const ids = ['socar','gulf','wissol','rompetrol','portal','connect','lukoil','neogas'];
const fixture = ids.map(id => `<div id="company-card-${id}"><table>${['სუპერი','პრემიუმი','რეგულარი','დიზელი','ბუნებრივი აირი (CNG)','თხევადი გაზი (LPG)'].map((name, index) => `<tr><td>${name}</td><td>${index < 3 ? '95' : ''}</td><td class="fuel-price-cell" data-std="${index >= 4 ? '1.60' : '4.20'}" data-self="${index < 3 ? '4.10' : ''}"><span>1.00</span></td></tr>`).join('')}</table></div>`).join('');
const timestamp = '2026-10-13T08:00:00.000Z';
test('company attributes are authoritative; summary/widget/display prices are ignored', () => {
  const payload = parsePricesHub('<aside>Best price 0.01</aside>'+fixture, timestamp);
  assert.equal(payload.companies.length, 8);
  assert.equal(payload.companies[0].fuelPrices[0].price, 4.2);
  assert.equal(payload.companies[0].fuelPrices[0].selfServicePrice, 4.1);
  assert.equal(payload.companies[0].fuelPrices[3].selfServicePrice, undefined);
  assert.equal(payload.companies[0].timestamp, timestamp);
  assert.equal(payload.source, 'priceshub');
});
test('incomplete/challenge/changed markup cannot replace the cache', () => {
  assert.throws(() => parsePricesHub('<h1>Access denied</h1>', timestamp), /Incomplete/);
  assert.throws(() => parsePricesHub(fixture.replace('company-card-gulf','removed-gulf'), timestamp), /Incomplete/);
  assert.throws(() => parsePricesHub(fixture.replace('data-std="4.20"','data-std="0"'), timestamp), /range/);
  assert.throws(() => parsePricesHub(fixture.replace('data-self="4.10"','data-self="NaN"'), timestamp), /Invalid/);
});
test('HTML entities and whitespace normalize without losing product identity', () => {
  const payload = parsePricesHub(fixture.replace('სუპერი', 'სუპერი&nbsp;  98'), timestamp);
  assert.equal(payload.companies[0].fuelPrices[0].fuelType, 'სუპერი 98');
});

const catalogueExports = {};
const catalogueCode = ts.transpileModule(readFileSync(new URL('../supabase/functions/_shared/fuel-catalogue.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
new Function('require', 'exports', catalogueCode)(require, catalogueExports);
test('source failure retains the complete catalogue instead of replacing it with the smaller fallback', async () => {
  let fallbackCalls = 0;
  const primary = async () => { throw new Error('incomplete source'); };
  const fallback = async () => { fallbackCalls++; return { source: 'upstream-fallback' }; };
  await assert.rejects(catalogueExports.loadFuelCatalogue({ source: 'priceshub' }, primary, fallback));
  assert.equal(fallbackCalls, 0);
  assert.equal((await catalogueExports.loadFuelCatalogue(undefined, primary, fallback)).source, 'upstream-fallback');
  assert.equal(fallbackCalls, 1);
});
