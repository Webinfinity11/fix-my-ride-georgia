import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { categoryPreloadPlugin } from './route-preload.mjs';

test('category entry and its dependencies preload only on category routes', () => {
  const bundle = {
    'index.html': { type: 'asset', source: '<head><link rel="modulepreload" href="/assets/react.js"></head>' },
    'assets/category.js': { type: 'chunk', fileName: 'assets/category.js', facadeModuleId: '/app/src/pages/ServiceCategory.tsx', imports: ['assets/services.js', 'assets/react.js', 'assets/layout.js'] },
    'assets/services.js': { type: 'chunk', imports: ['assets/react.js'] },
    'assets/react.js': { type: 'chunk', imports: [] },
    'assets/main.js': { type: 'chunk', fileName: 'assets/main.js', isEntry: true, imports: ['assets/react.js', 'assets/layout.js'] },
    'assets/layout.js': { type: 'chunk', imports: [] },
  };
  categoryPreloadPlugin().generateBundle({}, bundle);
  const code = bundle['index.html'].source.match(/<script data-category-preload>(.*?)<\/script>/)[1];
  for (const pathname of ['/', '/services', '/category/parebis-aghdgena', '/category/parebis-aghdgena/gldani']) {
    const links = [];
    const context = vm.createContext({ location: { pathname }, document: {
      querySelector: selector => links.some(link => selector.includes('href="' + link.href + '"')),
      createElement: () => ({}), head: { appendChild: link => links.push(link) },
    } });
    vm.runInContext(code, context);
    vm.runInContext(code, context);
    assert.deepEqual(links.map(link => link.href), pathname.startsWith('/category/')
      ? ['/assets/category.js', '/assets/services.js'] : []);
  }
});
