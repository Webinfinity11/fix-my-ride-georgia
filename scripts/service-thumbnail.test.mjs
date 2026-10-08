import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync, existsSync } from 'node:fs';
import ts from 'typescript';

const manifest = JSON.parse(readFileSync(new URL('../src/data/service-thumbnails.json', import.meta.url), 'utf8'));
const display = JSON.parse(readFileSync(new URL("../src/data/service-display-images.json", import.meta.url), "utf8"));
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/utils/imageCompression.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, {
  exports, require: (name) => name.includes("display-images") ? display : manifest,
});

test('known small card photos use valid local WebP files', () => {
  for (const [source, thumbnail] of Object.entries(manifest)) {
    assert.equal(exports.getOptimizedImageUrl(source, 400, 300, 70, { cropToFit: true }), thumbnail);
    const file = new URL('../public' + thumbnail, import.meta.url);
    assert.equal(existsSync(file), true);
    assert.equal(readFileSync(file).subarray(8, 12).toString(), 'WEBP');
  }
});

test('gallery images and unknown photos never invoke metered transformations', () => {
  const source = Object.keys(manifest)[0];
  assert.equal(exports.getOptimizedImageUrl(source, 800, 600), display[source]);
  assert.equal(exports.getOptimizedImageUrl(source), display[source]);
  assert.ok(exports.getOptimizedImageUrl('https://example.com/image.jpg').startsWith('https://example.com/'));
});


test('new uploads use their prepared card sibling while old and gallery URLs stay unchanged', () => {
  const source = 'https://kwozniwtygkdoagjegom.supabase.co/storage/v1/object/public/service-photos/owner/fixup-v2-123456-abcdef.webp';
  assert.equal(exports.getOptimizedImageUrl(source,400,300,70,{cropToFit:true}), source.replace('.webp','-card.webp'));
  assert.equal(exports.getOptimizedImageUrl(source,800,600),source);
  assert.equal(exports.getOptimizedImageUrl(source+'?x=1',400,300,70,{cropToFit:true}),source+'?x=1');
});


test('legacy transformation URLs are converted back to plain public files', () => {
  const source=Object.keys(manifest)[0];
  const rendered=source.replace('/object/public/','/render/image/public/')+'?width=400&quality=70';
  assert.equal(exports.getOptimizedImageUrl(rendered,800,600),display[source]);
  assert.equal(exports.getOptimizedImageUrl(rendered,400,300,70,{cropToFit:true}),manifest[source]);
});

test("full size lightbox keeps originals while prepared display assets exist", () => {
 for (const [source, file] of Object.entries(display)) {
 assert.equal(exports.getOptimizedImageUrl(source,1400,1000),source);
 assert.ok(existsSync(new URL("../public"+file,import.meta.url)));
 }
});
