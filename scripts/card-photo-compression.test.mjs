import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=ts.transpileModule(readFileSync(new URL('../src/utils/imageCompression.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
function harness(){const exports={};let draw,canvas;class Image{width=1600;height=900;set src(_){this.onload();}}class File{constructor(parts,name,options){this.name=name;this.type=options.type;this.size=100;}}vm.runInNewContext(source,{exports,require:()=>({}),Image,File,URL:{createObjectURL:()=>'/image',revokeObjectURL:()=>{}},console:{log:()=>{}},document:{createElement(){canvas={getContext:()=>({drawImage(...args){draw=args;}}),toBlob(callback){callback({size:100});}};return canvas;}}});return {exports,get canvas(){return canvas;},get draw(){return draw;}};}
test('card compression crops the center into exactly 400 by 300',async()=>{const h=harness();const file=await h.exports.compressImage({name:'photo.jpg',type:'image/jpeg',size:5000},{maxWidth:400,maxHeight:300,cropToFit:true});assert.equal(h.canvas.width,400);assert.equal(h.canvas.height,300);assert.deepEqual(h.draw.slice(1),[200,0,1200,900,0,0,400,300]);assert.equal(file.type,'image/webp');});
test('gallery compression preserves the full photo aspect ratio',async()=>{const h=harness();await h.exports.compressImage({name:'photo.jpg',type:'image/jpeg',size:5000});assert.equal(h.canvas.width,1200);assert.equal(h.canvas.height,675);assert.deepEqual(h.draw.slice(1),[0,0,1200,675]);});
