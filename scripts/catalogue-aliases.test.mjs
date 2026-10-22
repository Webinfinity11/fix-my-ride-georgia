import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,copyFile,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';

test('all catalogue redirects build, including a mechanic with a numeric canonical URL',async()=>{
 const root=await mkdtemp(join(tmpdir(),'fixup-aliases-'));
 try{
  await mkdir(join(root,'scripts'));
  await copyFile(new URL('./write-catalogue-aliases.mjs',import.meta.url),join(root,'scripts/write-catalogue-aliases.mjs'));
  await copyFile(new URL('./catalogue-aliases.json',import.meta.url),join(root,'scripts/catalogue-aliases.json'));
  execFileSync(process.execPath,[join(root,'scripts/write-catalogue-aliases.mjs')]);
  const html=await readFile(join(root,'dist/mechanic/230-/index.html'),'utf8');
  assert.ok(html.includes('href="https://fixup.ge/mechanic/230"'));
  assert.ok(html.includes('noindex, follow'));
  await writeFile(join(root,'scripts/catalogue-aliases.json'),JSON.stringify([{path:'/mechanic/old',target:'/mechanic/../admin'}]));
  assert.throws(()=>execFileSync(process.execPath,[join(root,'scripts/write-catalogue-aliases.mjs')],{stdio:'pipe'}),/Invalid catalogue alias/);
 }finally{await rm(root,{recursive:true,force:true});}
});
