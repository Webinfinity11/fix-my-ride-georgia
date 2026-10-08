import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { injectCategoryBootShells } from './category-boot-shell.mjs';

test('only mismatched known parent category routes receive an early heading', () => {
  const source = '<html data-ssg="/"><body><div id="root"></div></body></html>';
  const html = injectCategoryBootShells(source, '<header>FixUp</header>', {
    '/category/lights': '<h1>Lights</h1>',
  });
  const code = html.match(/<script id="category-boot-shell">([\s\S]*?)<\/script>/)[1];
  for (const [path, stamped, expected] of [
    ['/category/lights', '/', true], ['/category/lights/', '/', true],
    ['/category/lights', '/category/lights', false],
    ['/', '/', false], ['/login', '/', false],
    ['/category/unknown', '/', false], ['/category/lights/gldani', '/', false],
    ['/category/toString', '/', false],
  ]) {
    const root = { innerHTML: 'original' };
    let removed = false;
    const context = { location: { pathname: path }, window: {}, document: {
      documentElement: { getAttribute: () => stamped },
      getElementById: id => id === 'root' ? root : { remove: () => { removed = true; } },
    } };
    vm.runInNewContext(code, context);
    assert.equal(removed, expected, path);
    assert.equal(!!context.window.__fixupCategoryBoot, expected, path);
    assert.equal(root.innerHTML.includes('<h1>Lights</h1>'), expected, path);
  }
});

test('payload cannot break out of its script, and empty captures keep the existing fallback', () => {
  const source = '<body></body>';
  assert.equal(injectCategoryBootShells(source, '', { '/category/a': 'A' }), source);
  assert.equal(injectCategoryBootShells(source, 'header', {}), source);
  const html = injectCategoryBootShells(source, 'header', { '/category/a': '</script><h1>A</h1>' });
  assert.equal((html.match(/<\/script>/g) || []).length, 1);
  assert.ok(html.includes('\\u003c/script>'));
});

test('refreshing a captured document replaces the boot payload instead of duplicating it', () => {
  const first = injectCategoryBootShells('<body></body>', 'header', { '/category/a': 'A' });
  assert.equal(injectCategoryBootShells(first, 'header', { '/category/a': 'A' }), first);
  const refreshed = injectCategoryBootShells(first, 'header', { '/category/a': 'Updated' });
  assert.equal((refreshed.match(/id="category-boot-shell"/g) || []).length, 1);
  assert.ok(refreshed.includes('Updated'));
});
