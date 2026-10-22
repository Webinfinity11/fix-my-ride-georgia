import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export function assertLeafSitemapIndex(xml) {
 const urls=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
 if(!urls.length || urls.some(url=>/\/sitemap(?:_|-)?index\.xml$|\/sitemap\.xml$/.test(url))) throw new Error('A sitemap index must list leaf sitemaps, not other indexes');
 return urls;
}
async function main() {
 const root=new URL('../public/',import.meta.url);
 const xml=await readFile(new URL('sitemap_index.xml',root),'utf8');
 const urls=assertLeafSitemapIndex(xml);
 for(const url of urls) {
  const file=new URL(url).pathname.slice(1);
  const child=await readFile(new URL(file,root),'utf8');
  if(!/<urlset\b/.test(child)) throw new Error(`Not a leaf sitemap: ${file}`);
 }
 for(const name of ['sitemap.xml','sitemap-index.xml']) await writeFile(new URL(name,root),xml);
 console.log(`[sitemap index] main and both legacy aliases list ${urls.length} leaf sitemaps`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) await main();
