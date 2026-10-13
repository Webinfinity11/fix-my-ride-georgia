import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../public/app-recovery.js', import.meta.url), 'utf8');
function harness() {
  const listeners = {}, mounted = [], buttons = [{}, {}];
  let reloads = 0, updates = 0;
  for (const button of buttons) button.addEventListener = (event, fn) => { button[event] = fn; };
  const window = { addEventListener: (event, fn) => { listeners[event] = fn; }, location: { reload() { reloads++; } } };
  const document = {
    body: { appendChild: node => mounted.push(node) },
    getElementById: id => mounted.find(node => node.id === id),
    createElement: () => ({ style: {}, setAttribute() {}, querySelectorAll: () => buttons, remove() { mounted.splice(0, 1); } }),
  };
  vm.runInNewContext(source, { window, document, navigator: { serviceWorker: { getRegistration: async () => ({ update: async () => { updates++; } }) } }, setTimeout: () => 0 });
  return {listeners,mounted,buttons,get reloads(){return reloads;},get updates(){return updates;}};
}
test('chunk failure offers one recovery action without auto-reloading or masking unrelated errors', async () => {
  const h = harness();
  h.listeners['vite:preloadError']({ payload: new Error('A real application bug'), preventDefault() { throw new Error('Do not swallow logic errors'); } });
  assert.equal(h.mounted.length, 0);
  let prevented = 0;
  const event = { payload: new Error('Failed to fetch dynamically imported module: /assets/About-old.js'), preventDefault() { prevented++; } };
  h.listeners['vite:preloadError'](event); h.listeners['vite:preloadError'](event);
  assert.equal(prevented, 2); assert.equal(h.mounted.length, 1); assert.equal(h.reloads, 0);
  await h.buttons[0].click();
  assert.equal(h.updates, 1); assert.equal(h.reloads, 1);
});
test('missing entry files recover but missing images do not trigger a reload notice', () => {
  const h = harness();
  h.listeners.error({ target: { tagName: 'IMG', src: '/assets/photo-old.js' } });
  assert.equal(h.mounted.length, 0);
  h.listeners.error({ target: { tagName: 'SCRIPT', src: 'https://fixup.ge/assets/index-old.js' } });
  assert.equal(h.mounted.length, 1); assert.equal(h.reloads, 0);
});
