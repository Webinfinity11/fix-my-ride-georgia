import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('city demand counts every active service across Supabase pages and normalizes names', async () => {
  const ranges = [];
  const filters = [];
  const exports = {};
  const supabase = { from(table) {
    assert.equal(table, 'mechanic_services');
    return {
      select() { return this; }, not() { return this; },
      eq(...args) { filters.push(args); return this; }, order() { return this; },
      async range(from, to) {
        ranges.push([from, to]);
        return { data: from === 0 ? Array.from({ length: 1000 }, () => ({ city: 'ფოთი' }))
          : [{ city: ' თბილისი ' }, { city: 'თბილისი' }, { city: 'ბათუმი' }, { city: '' }, { city: null }], error: null };
      },
    };
  } };
  const source = ts.transpileModule(readFileSync(new URL('../src/lib/serviceMetadata.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, { exports, require(name) {
    if (name.includes('queryClient')) return { queryClient: {} };
    if (name.includes('supabase')) return { supabase };
    throw Error(name);
  } });
  const result = await exports.publicServiceCityCountsOptions.queryFn();
  assert.deepEqual(JSON.parse(JSON.stringify(result)), [{ city: 'ფოთი', count: 1000 }, { city: 'თბილისი', count: 2 }, { city: 'ბათუმი', count: 1 }]);
  assert.deepEqual(ranges, [[0, 999], [1000, 1999]]);
  assert.ok(filters.every(([column, value]) => column === 'is_active' && value === true));
});
