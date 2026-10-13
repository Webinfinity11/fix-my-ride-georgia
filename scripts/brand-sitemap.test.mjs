import test from 'node:test';
import assert from 'node:assert/strict';
import { brandUrls } from './update-brand-sitemap.mjs';
test('one matching service qualifies a brand and district without coordinates', () => {
  const urls = brandUrls([{ car_brands: ['Honda'], district: 'გლდანი', latitude: null, longitude: null }]);
  assert.ok(urls.includes('https://fixup.ge/brand/honda'));
  assert.ok(urls.includes('https://fixup.ge/brand/honda/gldani'));
  assert.equal(urls.includes('https://fixup.ge/brand/bmw'), false);
});
test('unrelated districts and all-brand listings do not generate focused brand pages', () => {
  const urls = brandUrls([
    { car_brands: ['Ford'], district: 'ნაძალადევი' },
    { car_brands: ['Toyota','Honda','Ford','Tesla','BMW','Nissan'], district: 'გლდანი' },
  ]);
  assert.ok(urls.includes('https://fixup.ge/brand/ford/nadzaladevi'));
  assert.equal(urls.includes('https://fixup.ge/brand/ford/gldani'), false);
  assert.equal(urls.includes('https://fixup.ge/brand/toyota'), false);
});
