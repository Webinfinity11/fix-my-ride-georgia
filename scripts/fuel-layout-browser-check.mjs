import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
const base = process.env.FUEL_CHECK_URL || 'http://localhost:4180';
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  let breakAbout = false;
  page.on('request', request => {
    if (breakAbout && /\/assets\/About-[^/]+\.js/.test(request.url())) return request.respond({ status: 404, contentType: 'text/plain', body: 'Old chunk removed' });
    if (/google-analytics|googletagmanager|doubleclick|gpteng/.test(request.url()) || (request.url().includes('.supabase.co/') && !['GET', 'OPTIONS'].includes(request.method()))) return request.abort();
    request.continue();
  });
  for (const width of [320, 390]) {
    await page.setViewport({ width, height: 844 });
    await page.goto(`${base}/fuel-prices/self-service/premium/`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('[aria-label="ფასების შეჯამება"]');
    const state = await page.evaluate(() => ({
      width: innerWidth, bodyWidth: document.documentElement.scrollWidth,
      titleHeight: document.querySelector('h1').getBoundingClientRect().height,
      priceBottom: document.querySelector('[aria-label="ფასების შეჯამება"]').getBoundingClientRect().bottom,
      rowBottom: document.querySelector('[aria-label="კომპანიების ფასების შედარება"] > div').getBoundingClientRect().bottom,
      closed: [...document.querySelectorAll('main details')].every(node => !node.open),
      rows: document.querySelectorAll('tbody tr').length,
    }));
    assert.equal(state.bodyWidth, state.width, 'Horizontal scroll belongs to the heading/pills, not the whole page');
    assert.ok(state.titleHeight <= 34, 'Mobile heading must occupy one line');
    assert.ok(state.priceBottom < 500, 'Real price summary must appear on the first screen');
    assert.ok(state.rowBottom < 776, 'A full company price row must clear the bottom navigation');
    assert.equal(state.closed, true);
    assert.ok(state.rows > 0, 'Collapsed price table remains in the document');
    await page.$eval('main details summary', node => node.click());
    assert.equal(await page.$eval('main details', node => node.open), true);
    await page.$eval('main details summary', node => node.click());
    if (width === 390) await page.screenshot({ path: '/tmp/fixup-fuel-compact-mobile.png' });
    console.log('Mobile fuel layout', width, state);
  }
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${base}/fuel-importers/`, { waitUntil: 'networkidle2' });
  const before = page.url();
  breakAbout = true;
  await page.click('a[href="/about"]');
  await page.waitForSelector('#fixup-update-notice');
  assert.ok(!await page.$eval('#fixup-update-notice button', node => node.disabled));
  await new Promise(resolve => setTimeout(resolve, 300));
  assert.equal(new URL(page.url()).pathname, '/about', 'Chunk failure must not auto-reload or move the user elsewhere');
  assert.notEqual(page.url(), before);
  breakAbout = false;
  await page.click('#fixup-update-notice button');
  await page.waitForFunction(() => !document.getElementById('fixup-update-notice') && document.querySelector('h1'));
  console.log('A real missing lazy chunk shows manual recovery; restoring the asset and clicking refresh recovers the page.');
} finally { await browser.close(); }
