// Run against a static dist/ server after prerender: SEO_CHECK_URL=http://127.0.0.1:4180 node scripts/seo-browser-check.mjs
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import puppeteer from 'puppeteer';
const base = process.env.SEO_CHECK_URL ?? 'http://127.0.0.1:4180';
const routes = ['/fuel-importers', '/fuel-prices/petrol', '/fuel-prices/diesel', '/map/chargers', '/category/saqare-minebi', '/category/vulkanizatsia', '/category/parebis-aghdgena', '/category/akumulatori', '/category/piris-gadakvra', '/category/tvlebis-sheqra'];
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const results = [];
try {
  const raw = await browser.newPage();
  await raw.setJavaScriptEnabled(false);
  for (const route of routes) {
    await raw.goto(`${base}${route}/`, { waitUntil: 'domcontentloaded' });
    const page = await raw.evaluate(() => ({
      title: document.title, canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      h1: document.querySelector('h1')?.textContent?.trim(), rows: document.querySelectorAll('tbody tr').length,
      times: document.querySelectorAll('time[datetime]').length,
      guide: Boolean(document.querySelector('section[aria-label="მომსახურების არჩევა"]')),
      products: [...document.querySelectorAll('tbody tr')].map(row => row.cells[1]?.textContent),
    }));
    assert.equal(page.canonical, `https://fixup.ge${route}`);
    assert.ok(page.h1);
    if (route.startsWith('/fuel')) { assert.ok(page.rows > 0); assert.equal(page.times, page.rows); }
    if (route === '/fuel-prices/petrol') assert.ok(page.products.every(product => !/დიზელ|diesel|გაზ|აირ|lpg|cng/i.test(product)));
    if (route === '/fuel-prices/diesel') assert.ok(page.products.every(product => /დიზელ|diesel/i.test(product)));
    if (route.startsWith('/category')) assert.ok(page.guide);
    results.push({ route, javascriptDisabled: page });
  }
  await raw.close();
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  const session = await page.createCDPSession();
  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (/google-analytics|googletagmanager|doubleclick|gpteng/.test(request.url()) || (request.url().includes('.supabase.co/') && !['GET', 'OPTIONS'].includes(request.method()))) return request.abort();
    request.continue();
  });
  await page.evaluateOnNewDocument(() => {
    window.__lab = { lcp: 0, cls: 0, longTasks: 0 };
    new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__lab.lcp = entry.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__lab.cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver(list => { window.__lab.longTasks += list.getEntries().length; }).observe({ type: 'longtask', buffered: true });
  });
  await page.goto(`${base}/fuel-importers/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('tbody tr');
  await page.waitForNetworkIdle({ idleTime: 800, timeout: 20000 });
  await new Promise(resolve => setTimeout(resolve, 500));
  assert.ok(!await page.$eval('body', node => [...node.querySelectorAll('h3')].some(heading => heading.textContent.trim() === 'ფასების ისტორია')), 'History must remain closed initially');
  const lab = await page.evaluate(() => window.__lab);
  const history = (await page.$$('button'));
  for (const button of history) if ((await button.evaluate(node => node.textContent.trim())) === 'ისტორია') { await button.click(); break; }
  await page.waitForFunction(() => [...document.querySelectorAll('h3')].some(node => node.textContent.trim() === 'ფასების ისტორია'));
  assert.deepEqual(errors, []);
  results.push({ route: '/fuel-importers', runtime: { errors, historyInteraction: 'passed', lab, viewport: '390x844', cpuSlowdown: 4, note: 'Local diagnostic, not CrUX or a production Core Web Vitals pass.' } });
  await writeFile(new URL('../seo/local-verification.json', import.meta.url), JSON.stringify({ testedAt: new Date().toISOString(), results }, null, 2) + '\n');
  console.log(`SEO browser checks passed for ${routes.length} routes; history interaction passed.`, lab);
} finally { await browser.close(); }
