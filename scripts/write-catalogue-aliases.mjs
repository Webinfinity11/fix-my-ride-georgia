import {readFile,writeFile,mkdir} from 'node:fs/promises';
const aliases=JSON.parse(await readFile(new URL('./catalogue-aliases.json',import.meta.url),'utf8'));
const root=new URL('../dist/',import.meta.url);
const escape=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
for(const {path,target} of aliases) {
 if(!/^\/(?:service|mechanic)\/[a-z0-9-]+$/.test(path) || !/^\/(?:(?:service|mechanic)\/\d+(?:-[a-z0-9-]+)?|category\/[a-z0-9-]+)$/.test(target) || path===target) throw new Error(`Invalid catalogue alias: ${path} → ${target}`);
 const directory=new URL(`.${path}/`,root);await mkdir(directory,{recursive:true});
 await writeFile(new URL('index.html',directory),`<!doctype html><html lang="ka"><head><meta charset="UTF-8"><meta name="robots" content="noindex, follow"><link rel="canonical" href="https://fixup.ge${escape(target)}"><meta http-equiv="refresh" content="0;url=${escape(target)}"><title>გადასვლა შესაბამის გვერდზე | FixUp</title></head><body><a href="${escape(target)}">შესაბამის გვერდზე გადასვლა</a></body></html>\n`);
}
console.log(`[catalogue aliases] ${aliases.length} numeric/legacy URLs point directly to their canonical page`);
