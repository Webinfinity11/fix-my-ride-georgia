import { readFileSync } from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';
export function loadModelHelpers() {
  const output = ts.transpileModule(readFileSync(new URL('../src/utils/serviceModels.ts',import.meta.url),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const exports = {};
  vm.runInNewContext(output,{exports,require(name){
    if(name==='@/data/car-models.json') return {default:JSON.parse(readFileSync(new URL('../src/data/car-models.json',import.meta.url),'utf8'))};
    throw new Error(name);
  }});
  return exports;
}
