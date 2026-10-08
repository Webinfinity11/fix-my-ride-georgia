import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync, existsSync } from 'node:fs';
import ts from 'typescript';

const manifest = JSON.parse(readFileSync(new URL('../src/data/service-thumbnails.json', import.meta.url), 'utf8'));
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/utils/imageCompression.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, {
  exports, require: () => manifest,
});

test('known small card photos use valid local WebP files', () => {
  for (const [source, thumbnail] of Object.entries(manifest)) {
    assert.equal(exports.getOptimizedImageUrl(source, 400, 300, 70, { cropToFit: true }), thumbnail);
    const file = new URL('../public' + thumbnail, import.meta.url);
    assert.equal(existsSync(file), true);
    assert.equal(readFileSync(file).subarray(8, 12).toString(), 'WEBP');
  }
});

test('gallery images and unknown photos keep the original transformation pipeline', () => {
  const source = Object.keys(manifest)[0];
  assert.ok(exports.getOptimizedImageUrl(source, 800, 600).includes('/render/image/public/'));
  assert.ok(exports.getOptimizedImageUrl('https://example.com/image.jpg').startsWith('https://example.com/'));
});
