import test from 'node:test';import assert from 'node:assert/strict';import {assertLeafSitemapIndex} from './sync-sitemap-index.mjs';
test('legacy sitemap indexes must list leaf sitemaps instead of nesting the master index',()=>{
 assert.throws(()=>assertLeafSitemapIndex('<sitemapindex><loc>https://fixup.ge/sitemap_index.xml</loc></sitemapindex>'),/leaf sitemaps/);
 assert.deepEqual(assertLeafSitemapIndex('<sitemapindex><loc>https://fixup.ge/service-sitemap.xml</loc><loc>https://fixup.ge/category-sitemap.xml</loc></sitemapindex>'),['https://fixup.ge/service-sitemap.xml','https://fixup.ge/category-sitemap.xml']);
});
