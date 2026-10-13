import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, unlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPreviewServer } from './preview-static.mjs';

test('open local tabs keep lazy chunks after a rebuild; HTML is fresh and missing assets are real 404s', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'fixup-preview-'));
  mkdirSync(join(dir, 'assets'));
  writeFileSync(join(dir, 'index.html'), 'version one');
  writeFileSync(join(dir, 'assets', 'About-old.js'), 'export default 1;');
  const server = createPreviewServer(dir);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    // The old lazy file was never requested by the tab before deployment.
    unlinkSync(join(dir, 'assets', 'About-old.js'));
    writeFileSync(join(dir, 'index.html'), 'version two');
    writeFileSync(join(dir, 'assets', 'About-new.js'), 'export default 2;');
    assert.equal(await (await fetch(`${base}/assets/About-old.js`)).text(), 'export default 1;');
    assert.equal(await (await fetch(`${base}/assets/About-new.js`)).text(), 'export default 2;');
    const html = await fetch(`${base}/about`);
    assert.equal(await html.text(), 'version two');
    assert.equal(html.headers.get('cache-control'), 'no-store');
    assert.equal((await fetch(`${base}/assets/missing.js`)).status, 404);
    // dist can temporarily disappear during a build; the preview must stay up.
    unlinkSync(join(dir, 'index.html'));
    assert.equal((await fetch(`${base}/about`)).status, 503);
    writeFileSync(join(dir, 'index.html'), 'version three');
    assert.equal(await (await fetch(`${base}/about`)).text(), 'version three');
  } finally {
    await new Promise(resolve => server.close(resolve));
    rmSync(dir, { recursive: true, force: true });
  }
});
