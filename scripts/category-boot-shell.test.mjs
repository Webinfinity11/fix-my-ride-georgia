import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { injectCategoryBootShells, injectCategoryInitialData } from './category-boot-shell.mjs';

test('only mismatched known parent category routes receive an early heading', () => {
  const source = '<html data-ssg="/"><body><div id="root"></div></body></html>';
  const html = injectCategoryBootShells(source, '<header>FixUp</header>', {
    '/category/lights': '<h1>Lights</h1>',
  });
  const code = html.match(/<script id="category-boot-shell">([\s\S]*?)<\/script>/)[1];
  for (const [path, stamped, expected] of [
    ['/category/lights', '/', true], ['/category/lights/', '/', true],
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

test('matching snapshots keep their full HTML and initialize the React loading fallback', () => {
  const html = injectCategoryBootShells('<body></body>', '<header>FixUp</header>', { '/category/lights': '<h1>Lights</h1>' });
  const code = html.match(/<script id="category-boot-shell">([\s\S]*?)<\/script>/)[1];
  const root = { innerHTML: '<h1>Lights</h1><article>Current service</article>' };
  const context = { location: { pathname: '/category/lights' }, window: {}, document: {
    documentElement: { getAttribute: () => '/category/lights' },
    getElementById: id => id === 'root' ? root : { remove: () => assert.fail('Matching snapshots have no guard to remove') },
  } };
  vm.runInNewContext(code, context);
  assert.equal(root.innerHTML, '<h1>Lights</h1><article>Current service</article>');
  assert.equal(context.window.__fixupCategoryBoot.html, root.innerHTML);
  assert.equal(context.window.__fixupCategoryBoot.snapshot, true);
});

test('initial public data is script-safe and replaced on subsequent captures', () => {
  const first = injectCategoryInitialData('<body></body>', { description: '</script><script>bad()</script>' });
  assert.equal((first.match(/<\/script>/g) || []).length, 1);
  const refreshed = injectCategoryInitialData(first, { description: 'Fresh' });
  assert.equal((refreshed.match(/id="category-initial-data"/g) || []).length, 1);
  assert.ok(!refreshed.includes('bad()'));
  const parsed = JSON.parse(first.match(/id="category-initial-data">([\s\S]*?)<\/script>/)[1]);
  assert.equal(parsed.description, '</script><script>bad()</script>');
});
