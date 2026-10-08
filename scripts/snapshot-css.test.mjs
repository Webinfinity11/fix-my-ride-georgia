import test from 'node:test';
import assert from 'node:assert/strict';
import { getSnapshotCSS } from './snapshot-css.mjs';

test('snapshot CSS preserves responsive, escaped and interactive styles in the current DOM', () => {
  const css = 'body{margin:0}.unused{color:red}.card:hover{color:blue}'
    + '@media(min-width:768px){.md\\:grid{display:grid}.hidden-panel{display:none}}'
    + '.card .badge{font-weight:bold}.card,.other{padding:1px}';
  const result = getSnapshotCSS(css, ['card', 'md:grid']);
  assert.ok(result.includes('body{margin:0}'));
  assert.ok(result.includes('.card:hover'));
  assert.ok(result.includes('.md\\:grid'));
  assert.ok(result.includes('.card,.other'));
  assert.ok(!result.includes('.unused'));
  assert.ok(!result.includes('.hidden-panel'));
  assert.ok(!result.includes('.card .badge'));
});

test('functional selectors, font definitions and keyframes remain safe', () => {
  const css = ':not(.absent){color:red}:is(.one,.two){padding:1px}'
    + '@font-face{font-family:Test;src:url(test.woff2)}'
    + '@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'
    + '@media(min-width:500px){.unused{color:blue}}';
  const result = getSnapshotCSS(css, []);
  assert.ok(result.includes(':not(.absent)'));
  assert.ok(result.includes(':is(.one,.two)'));
  assert.ok(result.includes('@font-face'));
  assert.ok(result.includes('@keyframes spin'));
  assert.ok(!result.includes('@media'));
});
