import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/servicePhotoUpload.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports});
const name='owner/fixup-v2-12345-abcdef.webp';
function storage(failAt){let count=0;const calls=[];return {calls,async upload(path,file,options){calls.push({path,options});return {error:++count===failAt?new Error('upload failed'):null};},async remove(paths){calls.push({remove:Array.from(paths)});return {error:null};}};}
test('both photo versions are uploaded with a long cache and no overwrites',async()=>{const s=storage();await exports.uploadPreparedServicePhoto(s,name,{},{});assert.equal(s.calls.length,2);assert.equal(s.calls[1].path,name.replace('.webp','-card.webp'));assert.equal(s.calls[0].options.cacheControl,'31536000');assert.equal(s.calls[0].options.upsert,false);});
test('a failed card upload cleans up this attempt before exposing the photo',async()=>{const s=storage(2);await assert.rejects(exports.uploadPreparedServicePhoto(s,name,{},{}));assert.deepEqual(s.calls[2].remove,[name,name.replace('.webp','-card.webp')]);});
test('a failed gallery upload does not upload or remove a card',async()=>{const s=storage(1);await assert.rejects(exports.uploadPreparedServicePhoto(s,name,{},{}));assert.equal(s.calls.length,1);});
test('legacy deletion touches only the original and new photos include the card sibling',()=>{assert.deepEqual(Array.from(exports.photoStoragePaths('owner/legacy.webp')),['owner/legacy.webp']);assert.deepEqual(Array.from(exports.photoStoragePaths(name)),[name,name.replace('.webp','-card.webp')]);});
