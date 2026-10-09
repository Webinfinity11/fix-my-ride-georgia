import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const code=ts.transpileModule(readFileSync(new URL('../src/components/ui/lazy-image.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
function harness(){const exports={};const values=[];let cursor=0;const jsx=(type,props)=>({type,props});vm.runInNewContext(code+'\nexports.renderImage=LoadedImage;',{exports,require(name){if(name==='react')return {useState(initial){const slot=cursor++;if(!(slot in values))values[slot]=initial;return [values[slot],value=>values[slot]=value];}};if(name==='react/jsx-runtime')return {jsx,jsxs:jsx,Fragment:'fragment'};return {cn:(...args)=>args.filter(Boolean).join(' ')};}});return {render(props){cursor=0;return exports.renderImage(props);}};}
test('failed card image leaves a placeholder instead of silently requesting a large original',()=>{const h=harness();const props={src:'/assets/small.webp',priority:true};const view=h.render(props);const image=view.props.children.find(x=>x.type==='img');assert.equal(image.props.src,props.src);image.props.onError({});const failed=h.render(props);assert.equal(failed.type,'span');assert.equal(failed.props.role,'img');assert.ok(failed.props['aria-label']);assert.equal(failed.props.src,undefined);});
test('an explicitly requested fallback is tried once, then gives a readable placeholder',()=>{const h=harness();const props={src:'/small.webp',fallbackSrc:'/fallback.webp'};h.render(props).props.children.find(x=>x.type==='img').props.onError({});const fallback=h.render(props).props.children.find(x=>x.type==='img');assert.equal(fallback.props.src,props.fallbackSrc);fallback.props.onError({});assert.equal(h.render(props).props.role,'img');});

// A thumbnail is rendered inside a button, whose content must be phrasing.
// Exercise both SSR branches, including the loading placeholder.
test('thumbnail HTML remains valid inside buttons before images load', () => {
  const exports = {};
  vm.runInNewContext(code, { exports, require(name) {
    return name === '@/lib/utils' ? { cn: (...args) => args.filter(Boolean).join(' ') } : require(name);
  }});
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  for (const priority of [false, true]) {
    const html = renderToStaticMarkup(React.createElement('button', {type: 'button'},
      React.createElement(exports.LazyImage, {src: '/photo.webp', alt: '', priority})));
    assert.doesNotMatch(html, /<(?:div|section|p)[ >]/);
    assert.match(html, /<span class="relative block w-full h-full">/);
  }
});
