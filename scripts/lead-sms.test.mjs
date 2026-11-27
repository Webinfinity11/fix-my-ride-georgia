import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const lib = {};
new Function('exports', ts.transpileModule(readFileSync(new URL('../supabase/functions/_shared/lead-sms.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(lib);

test('a long request still fits two SMS and keeps the driver number', () => {
  const message = lib.requestMessage('ძრავი ხურდება და კვამლი ამოდის '.repeat(10), 'Toyota Prius', '555111111');
  assert.ok(message.length <= lib.MAX_LENGTH, String(message.length));
  assert.ok(message.endsWith('დარეკეთ: 555111111'));
  assert.ok(message.includes('Toyota Prius'));
});

test('the expiry reminder names the day, the results and the page', () => {
  const message = lib.expiryMessage('2026-12-05', 120, 15);
  assert.equal(message, 'VIP იწურება 05.12: ნახვა 120, დარეკა 15.\nhttps://fixup.ge/vip');
  assert.ok(message.length <= 70);
});
