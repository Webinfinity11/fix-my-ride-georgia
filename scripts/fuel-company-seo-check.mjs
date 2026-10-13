import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import { readFile } from 'node:fs/promises';
const companies = JSON.parse(await readFile(new URL('../src/data/fuel-companies.json', import.meta.url)));
const base = process.env.FUEL_CHECK_URL || 'http://localhost:4180';
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const raw = await browser.newPage();
  await raw.setJavaScriptEnabled(false);
  const headings = new Set();
  for (const company of companies) {
    const path = `/fuel-prices/company/${company.slug}`;
    const response = await raw.goto(`${base}${path}/`, { waitUntil: 'domcontentloaded' });
    assert.equal(response.status(), 200);
    const data = await raw.evaluate(() => ({
      h1: document.querySelector('h1')?.textContent,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      noindex: document.querySelector('meta[name="robots"]')?.content.includes('noindex'),
      cards: [...document.querySelectorAll('[aria-label="კომპანიების ფასები"] article')].map(card => ({ name: card.querySelector('h3')?.textContent, rows: card.querySelectorAll('li').length })),
      details: [...document.querySelectorAll('main details')].map(node => ({ open: node.open, text: node.textContent })),
      links: [...document.querySelectorAll('a[href^="/fuel-prices/company/"]')].map(a => a.getAttribute('href')),
      breadcrumbs: [...document.querySelectorAll('script[type="application/ld+json"]')].map(node => JSON.parse(node.textContent)).some(schema => schema['@type'] === 'BreadcrumbList'),
    }));
    assert.equal(data.canonical, `https://fixup.ge${path}`);
    assert.ok(!data.noindex);
    assert.ok(data.h1.includes(company.label)); assert.ok(!headings.has(data.h1)); headings.add(data.h1);
    assert.equal(data.cards.length, 1); assert.equal(data.cards[0].name, company.name); assert.ok(data.cards[0].rows > 0);
    assert.ok(data.details.length >= 2 && data.details.every(detail => !detail.open));
    assert.ok(data.links.length >= 8); assert.ok(data.breadcrumbs);
    const sitemap = await readFile(new URL('../public/static-sitemap.xml', import.meta.url), 'utf8');
    assert.ok(sitemap.includes(`<loc>https://fixup.ge${path}</loc>`));
  }
  const page = await browser.newPage();
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${base}/fuel-prices/company/gulf/`, { waitUntil: 'networkidle2' });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  assert.ok(!requests.some(url => /\/FuelPriceHistory-/.test(url)), 'History chart should load only on demand');
  await page.$eval('main details summary', summary => summary.click());
  await page.waitForSelector('[role="combobox"]');
  assert.ok(requests.some(url => /\/FuelPriceHistory-/.test(url)));
  const selected = await page.$$eval('[role="combobox"]', nodes => nodes.map(node => node.textContent));
  assert.ok(selected.some(value => /Gulf/.test(value)), JSON.stringify(selected));
  assert.ok(selected.every(value => value.trim()), 'Every history selector has a visible selection');
  await page.screenshot({ path: '/tmp/fixup-gulf-company-page.png', fullPage: true });
  await page.goto(`${base}/fuel-prices/company/unknown/`, { waitUntil: 'networkidle2' });
  assert.ok(await page.$eval('meta[name="robots"]', node => node.content.includes('noindex')));
  console.log('8 unique, nonempty static company pages with canonical, breadcrumbs, sitemap and links; mobile/history/unknown-route checks passed.');
} finally { await browser.close(); }
