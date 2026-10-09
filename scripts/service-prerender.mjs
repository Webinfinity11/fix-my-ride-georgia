import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { injectLcpImagePreload } from './prerender-resources.mjs';

const letters = { 'ა':'a','ბ':'b','გ':'g','დ':'d','ე':'e','ვ':'v','ზ':'z','თ':'t','ი':'i','კ':'k','ლ':'l','მ':'m','ნ':'n','ო':'o','პ':'p','ჟ':'zh','რ':'r','ს':'s','ტ':'t','უ':'u','ფ':'p','ქ':'q','ღ':'gh','ყ':'q','შ':'sh','ჩ':'ch','ც':'ts','ძ':'dz','წ':'ts','ჭ':'ch','ხ':'kh','ჯ':'j','ჰ':'h' };
export function servicePath(service) {
  const slug = service.name.toLowerCase().split('').map(c => letters[c] || c).join('')
    .replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return `/service/${service.id}-${slug}`;
}

// The prebuild already fetched active public services with the anonymous client.
// Reuse that inventory instead of silently requiring a second set of env vars.
export function getServiceRoutes(root) {
  const index = JSON.parse(readFileSync(join(root, 'scripts/service-boot-data.json'), 'utf8'));
  return Object.values(index).map(({ data }) => {
    const service = JSON.parse(readFileSync(join(root, 'public', data), 'utf8'));
    return servicePath(service);
  });
}

export function prepareServiceSnapshot(html, image, snapshot) {
  // Matching static documents already contain their real content. Do not replace
  // it with a second JSON request and a delayed JavaScript-created image.
  html = html.replace(/<script id="(?:service-image-preload|service-boot-shell|category-boot-shell)">[\s\S]*?<\/script>/g, '');
  const preserve = `<script id="service-static-snapshot">(function(){var path=location.pathname.replace(/\\/$/,'');if(document.documentElement.getAttribute('data-ssg')!==path)return;var root=document.getElementById('root');if(root)window.__fixupServiceBoot={path:path,html:root.innerHTML};})();</script>`;
  const data = snapshot ? `<script type="application/json" id="service-initial-data">${JSON.stringify(snapshot).replace(/</g, '\\u003c')}</script>` : '';
  return injectLcpImagePreload(html, image).replace('</body>', data + preserve + '</body>');
}

export function assertServiceDocument(html, route) {
  const data = html.match(/<script type="application\/json" id="service-initial-data">([\s\S]*?)<\/script>/)?.[1];
  if (!data || !html.includes('<!--$-->')) throw new Error(`Missing hydratable service HTML: ${route}`);
  const snapshot = JSON.parse(data);
  if (snapshot.path !== route || !html.includes(`data-service-page-id="${snapshot.service.id}"`)) {
    throw new Error(`Service HTML/data mismatch: ${route}`);
  }
  if (/id="service-(?:image-preload|boot-shell)"/.test(html)) throw new Error(`Redundant service loading chain: ${route}`);
}
