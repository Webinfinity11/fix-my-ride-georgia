import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
try {
const page=await browser.newPage();
for(const width of [320,390]) {
await page.setViewport({width,height:844});
await page.goto('http://localhost:4180/fuel-prices/self-service/premium/',{waitUntil:'networkidle2'});
const links=await page.$$eval('[aria-label="ფასის ტიპი"] a',els=>els.map(e=>{const r=e.getBoundingClientRect(); return {top:r.top,left:r.left,right:r.right,height:r.height}}));
assert.equal(links[0].top,links[1].top); assert.ok(links[0].right<=links[1].left); assert.ok(links[1].right<=width);
const title='[aria-label="გვერდის სათაური"]';
assert.ok(await page.$eval(title,e=>e.style.maskImage.includes('transparent')));
await page.$eval(title,e=>e.scrollLeft=e.scrollWidth);
await new Promise(r=>setTimeout(r,200));
assert.equal(await page.$eval(title,e=>e.parentElement.querySelector('button')===null),true);
await page.$eval(title,e=>e.scrollLeft=0);
if(width===390) await page.screenshot({path:'/tmp/fixup-scroll-hints-mobile.png'});
}
console.log('320/390 tariffs side by side; heading fade and end-aware scroll hints passed');
} finally {await browser.close()}
