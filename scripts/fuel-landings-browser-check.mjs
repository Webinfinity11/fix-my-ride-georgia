// Checks actual static HTML and browser URL/back/reload behaviour against the
// real public feed. Run after prerender on a static dist server.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import puppeteer from 'puppeteer';
const pages = JSON.parse(readFileSync(new URL('../src/data/fuel-landings.json', import.meta.url)));
const base = process.env.FUEL_CHECK_URL ?? 'http://127.0.0.1:4180';
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const raw = await browser.newPage();
  await raw.setJavaScriptEnabled(false);
  const headings = new Set();
  for (const landing of pages) {
    const path = `/fuel-prices/${landing.slug}`;
    const response = await raw.goto(`${base}${path}/`, { waitUntil: 'domcontentloaded' });
    assert.equal(response.status(), 200, path);
    const document = await raw.evaluate(() => ({
      h1: document.querySelector('h1')?.textContent.trim(),
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      tariff: document.querySelector('[aria-label="ფასის ტიპი"] a[aria-current="page"]')?.textContent,
      rows: [...document.querySelectorAll('tbody tr')].map(row => ({ product: row.cells[1].textContent, self: row.cells[3].textContent })),
    }));
    assert.equal(document.canonical, `https://fixup.ge${path}`);
    assert.equal(document.h1, `${landing.name} საქართველოში`);
    assert.ok(!headings.has(document.h1), 'Each landing must have its own heading');
    headings.add(document.h1);
    assert.ok(document.rows.length > 0, `${path} must not be an empty indexed page`);
    assert.equal(document.tariff, landing.selfService ? 'თვითმომსახურება' : 'სტანდარტული');
    if (landing.selfService) assert.ok(document.rows.every(row => Number(row.self) > 0));
    for (const row of document.rows) {
      const name = row.product;
      if (landing.tiers.length === 1 && landing.tiers[0] === 'diesel') assert.match(name, /დიზელ|diesel/i);
      if (landing.tiers.includes('premium')) assert.doesNotMatch(name, /დიზელ|diesel|cng|lpg|გაზ|აირ/i);
      if (landing.tiers.length === 1 && landing.tiers[0] === 'premium') assert.match(name, /პრემიუმ|premium/i);
      if (landing.tiers.length === 1 && landing.tiers[0] === 'regular') assert.match(name, /რეგულარ|regular/i);
      if (landing.tiers.length === 1 && landing.tiers[0] === 'super') assert.match(name, /სუპერ|super/i);
      if (landing.tiers.includes('cng')) assert.match(name, /ბუნებრივ|cng/i);
      if (landing.tiers.includes('lpg')) assert.match(name, /თხევად|lpg/i);
    }
  }
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (/google-analytics|googletagmanager|doubleclick|gpteng/.test(request.url()) || (request.url().includes('.supabase.co/') && !['GET', 'OPTIONS'].includes(request.method()))) return request.abort();
    request.continue();
  });
  await page.goto(`${base}/fuel-importers/`, { waitUntil: 'networkidle2' });
  await page.click('[aria-label="ფასის ტიპი"] a[href="/fuel-prices/self-service"]');
  await page.waitForFunction(() => location.pathname === '/fuel-prices/self-service');
  await page.click('a[href="/fuel-prices/self-service/premium"]');
  await page.waitForFunction(() => location.pathname === '/fuel-prices/self-service/premium');
  await page.reload({ waitUntil: 'networkidle2' });
  assert.match(await page.$eval('h1', node => node.textContent), /პრემიუმ.*თვითმომსახურებ/);
  assert.equal(await page.$eval('[aria-label="ფასის ტიპი"] a[aria-current="page"]', node => node.textContent), 'თვითმომსახურება');
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => location.pathname === '/fuel-prices/self-service');
  console.log(`Fuel landings: ${pages.length} nonempty static pages with unique H1/canonical, correct products/tariffs; filter navigation, reload and back passed.`);
} finally {
  await browser.close();
}
