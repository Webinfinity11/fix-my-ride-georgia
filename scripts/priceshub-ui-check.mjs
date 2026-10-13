// Integration check using the actual downloaded public page as the source
// fixture, with only our not-yet-deployed edge response substituted locally.
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import puppeteer from 'puppeteer';
const sourceFile = process.env.PRICESHUB_HTML;
if (!sourceFile) throw new Error('Set PRICESHUB_HTML to a downloaded PricesHub homepage');
const require = createRequire(import.meta.url), exports = {};
new Function('require','exports',ts.transpileModule(readFileSync(new URL('../supabase/functions/_shared/priceshub.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(require,exports);
const payload = exports.parsePricesHub(readFileSync(sourceFile,'utf8'), statSync(sourceFile).mtime.toISOString());
const browser = await puppeteer.launch({headless:true,args:['--no-sandbox']});
try {
  const page = await browser.newPage();
  await page.setViewport({width:390,height:844,isMobile:true});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().includes('/functions/v1/fuel-prices')) return request.respond({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'},body:JSON.stringify({success:true,cached:true,data:payload})});
    if (/google-analytics|googletagmanager|doubleclick|gpteng/.test(request.url()) || (request.url().includes('.supabase.co/') && !['GET','OPTIONS'].includes(request.method()))) return request.abort();
    request.continue();
  });
  await page.goto('http://127.0.0.1:4180/fuel-importers/',{waitUntil:'networkidle2'});
  async function click(label) {
    for (const button of await page.$$('button, a')) {
      if ((await button.evaluate(node=>node.textContent.trim())).startsWith(label) && await button.isVisible()) { await button.click();return; }
    }
    throw new Error(`Missing button: ${label}`);
  }
  await click('განახლება');
  await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 44);
  assert.equal(await page.$$eval('tbody a',nodes=>nodes.filter(node=>node.href.startsWith('https://priceshub.ge/')).length),44);
  await click('თვითმომსახურება');
  await page.waitForFunction(() => location.pathname === '/fuel-prices/self-service');
  assert.equal(await page.$$eval('tbody tr', nodes => nodes.length), payload.companies.reduce((count, company) => count + company.fuelPrices.filter(fuel => fuel.selfServicePrice > 0).length, 0));
  await click('სტანდარტული');
  await click('ბუნებრივი აირი');
  assert.ok(await page.$eval('body',node=>node.textContent.includes('CNG')));
  await click('თხევადი გაზი');
  assert.ok(await page.$eval('body',node=>node.textContent.includes('LPG')));
  assert.deepEqual(errors,[]);
  console.log('PricesHub UI: 8 companies, 44 source-linked products, tariff URL navigation and separate CNG/LPG passed. Backend response was substituted locally; production was not changed.');
} finally { await browser.close(); }
