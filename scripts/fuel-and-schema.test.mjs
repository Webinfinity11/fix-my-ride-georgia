import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(path) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }
  }).outputText;
  const exports = {};
  new Function('require', 'exports', code)(require, exports);
  return exports;
}
const { fuelTier } = load('../src/lib/fuelTypes.ts');
const schemas = load('../src/components/seo/StructuredData.tsx');
const document = component => JSON.parse(component.props.children.props.children);

test('premium diesel cannot appear in the petrol comparison', () => {
  assert.equal(fuelTier('Premium Diesel'), 'diesel');
  assert.equal(fuelTier('ნანო ევრო 5 დიზელი Premium'), 'diesel');
  assert.equal(fuelTier('პრემიუმი Premium 95'), 'premium');
  assert.equal(fuelTier('ბუნებრივი აირი CNG'), 'cng');
});
test('ratings use supported entities without inventing another item type', () => {
  const rating = { ratingValue: 4.8, reviewCount: 3 };
  const service = document(schemas.ServiceSchema({ name: 'Repair', description: 'Repair', provider: { name: 'Mechanic' }, aggregateRating: rating }));
  const person = document(schemas.PersonSchema({ name: 'Mechanic', aggregateRating: rating }));
  assert.equal(service['@type'], 'Service');
  assert.equal(person['@type'], 'Person');
  assert.equal(service.aggregateRating, undefined);
  assert.equal(person.aggregateRating, undefined);
  const product = document(schemas.ProductSchema({ name: 'Repair', description: 'Repair', offers: {}, aggregateRating: rating }));
  assert.equal(product.aggregateRating.reviewCount, 3);
  const business = document(schemas.LocalBusinessSchema({ name: 'Workshop', address: { addressLocality: 'თბილისი' }, rating }));
  assert.equal(business.aggregateRating.reviewCount, 3);
  assert.equal(business['@type'], 'AutoRepair');
  assert.equal(business.openingHours, undefined);
  const unrated = document(schemas.LocalBusinessSchema({ name: 'Workshop', address: { addressLocality: 'თბილისი' }, rating: { ratingValue: 4, reviewCount: 0 } }));
  assert.equal(unrated.aggregateRating, undefined);
});
