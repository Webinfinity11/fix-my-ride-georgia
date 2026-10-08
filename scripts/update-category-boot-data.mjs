// Run after a successful full npm run build to refresh the public heading cache.
// Review the diff before committing; listings and service counts are excluded.
import { readFileSync, writeFileSync } from 'node:fs';
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const script = html.match(/<script id="category-boot-shell">([\s\S]*?)<\/script>/)?.[1];
const payload = script?.match(/var data=([\s\S]*?);\s*if\(!Object\.prototype/)?.[1];
if (!payload) throw new Error('Build has no category boot payload');
const data = JSON.parse(payload);
writeFileSync(new URL('./category-boot-data.json', import.meta.url), JSON.stringify(data, null, 2) + '\n');
console.log(`Updated ${Object.keys(data.categories).length} public category headings`);
