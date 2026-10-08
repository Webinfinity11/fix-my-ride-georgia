import test, { afterEach } from 'node:test';
import { QueryClient } from '@tanstack/react-query';
import { countMapPoints } from './map-layer-counts.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const clients = [];
afterEach(() => { for (const client of clients.splice(0)) client.clear(); });

// Exercise the real hook against controllable, out-of-order network responses.
function harness() {
  const states = [];
  const requests = [];
  const notices = [];
  const react = {
    useState(initial) {
      const slot = states.length;
      states.push(initial);
      return [initial, value => { states[slot] = typeof value === 'function' ? value(states[slot]) : value; }];
    },
    useRef: current => ({ current }),
    useEffect() {},
  };
  const supabase = {
    from(table) {
      let resolve;
      const response = new Promise(done => { resolve = done; });
      requests.push({ table, resolve });
      const query = new Proxy({}, {
        get(_, key) {
          if (key === 'then') return response.then.bind(response);
          return () => query;
        },
      });
      return query;
    },
  };
  const queryClient = new QueryClient();
  clients.push(queryClient);
  const metadata = {};
  const metadataSource = ts.transpileModule(readFileSync(new URL('../src/lib/serviceMetadata.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(metadataSource, {
    exports: metadata,
    require(name) {
      if (name === '@/lib/queryClient') return { queryClient };
      if (name === '@/integrations/supabase/client') return { supabase };
      throw new Error(`Unexpected metadata dependency: ${name}`);
    },
  });
  const source = readFileSync(new URL('../src/hooks/useServices.ts', import.meta.url), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(output, {
    exports,
    require(name) {
      if (name === 'react') return react;
      if (name === '@/lib/serviceMetadata') return metadata;
      if (name === '@/integrations/supabase/client') return { supabase };
      if (name === 'sonner') return { toast: { error: message => notices.push(message) } };
      throw new Error(`Unexpected dependency: ${name}`);
    },
    console: { log() {}, warn() {}, error() {} },
  });
  return { hook: exports.useServices(), metadata, queryClient, states, requests, notices };
}
const filters = { searchTerm: '', selectedCategory: 'all', selectedCity: null, selectedDistrict: null, selectedBrands: [], onSiteOnly: false, minRating: null };
const tick = () => new Promise(resolve => setImmediate(resolve));

test('categories and cities start together and publish independently', async () => {
  const h = harness();
  const pending = h.hook.fetchInitialData();
  assert.deepEqual(h.requests.map(r => r.table), ['service_categories', 'mechanic_services']);
  h.requests[1].resolve({ data: [{ city: 'თბილისი' }, { city: 'თბილისი' }], error: null });
  await tick();
  assert.equal(h.states[2].join(','), 'თბილისი');
  assert.equal(h.states[1].length, 0, 'cities render even while categories are pending');
  h.requests[0].resolve({ data: [{ id: 1, name: 'Test' }], error: null });
  await pending;
  assert.equal(h.states[1][0].id, 1);
});

test('a slower older search cannot replace the newer search or clear its spinner', async () => {
  const h = harness();
  const old = h.hook.fetchServices({ ...filters, selectedCity: 'ბათუმი' });
  const newer = h.hook.fetchServices({ ...filters, selectedCity: 'თბილისი' });
  h.requests[0].resolve({ data: [{ id: 1 }], error: null, count: 1 });
  await old;
  assert.equal(h.states[4], true, 'newer search is still loading');
  assert.equal(h.states[0].length, 0);
  h.requests[1].resolve({ data: [{ id: 2 }], error: null, count: 1 });
  await newer;
  assert.equal(h.states[0][0].id, 2);
  assert.equal(h.states[4], false);
});

test('an obsolete failing search does not erase a successful newer result', async () => {
  const h = harness();
  const old = h.hook.fetchServices(filters);
  const newer = h.hook.fetchServices({ ...filters, selectedCity: 'თბილისი' });
  h.requests[1].resolve({ data: [{ id: 2 }], error: null, count: 1 });
  await newer;
  h.requests[0].resolve({ data: null, error: { message: 'Old request failed' }, count: null });
  await old;
  assert.equal(h.states[0][0].id, 2);
  assert.equal(h.notices.length, 0);
});

test('load more appends results and a new filter replaces the accumulated list', async () => {
  const h = harness();
  let pending = h.hook.fetchServices(filters);
  h.requests[0].resolve({ data: [{ id: 1 }], error: null, count: 50 });
  await pending;
  pending = h.hook.fetchServices(filters, 1);
  h.requests[1].resolve({ data: [{ id: 2 }], error: null, count: 50 });
  await pending;
  assert.equal(h.states[0].map(s => s.id).join(','), '1,2');
  pending = h.hook.fetchServices({ ...filters, selectedCity: 'ბათუმი' });
  h.requests[2].resolve({ data: [{ id: 3 }], error: null, count: 1 });
  await pending;
  assert.equal(h.states[0].map(s => s.id).join(','), '3');
  assert.equal(h.states[7], false, 'no more pages remain');
});

test('concurrent metadata users share one request and subsequent navigation uses fresh cache', async () => {
  const h = harness();
  const first = h.metadata.getPublicServiceCategories();
  const second = h.metadata.getPublicServiceCategories();
  assert.equal(h.requests.length, 1);
  h.requests[0].resolve({ data: [{ id: 1, name: 'Original', description: 'SEO' }], error: null });
  await Promise.all([first, second]);
  const cached = await h.metadata.getPublicServiceCategories();
  assert.equal(h.requests.length, 1);
  assert.equal(cached[0].description, 'SEO', 'category pages retain full metadata');
});

test('an admin category change invalidates cache; expired metadata is also refreshed', async () => {
  const h = harness();
  h.queryClient.setQueryData(['public-service-categories'], [{ id: 1, name: 'Old' }]);
  await h.metadata.invalidatePublicServiceCategories();
  let pending = h.metadata.getPublicServiceCategories();
  assert.equal(h.requests.length, 1);
  h.requests[0].resolve({ data: [{ id: 1, name: 'Updated' }], error: null });
  assert.equal((await pending)[0].name, 'Updated');
  h.queryClient.setQueryData(['public-service-categories'], [{ id: 1, name: 'Expired' }], { updatedAt: Date.now() - 61_000 });
  pending = h.metadata.getPublicServiceCategories();
  assert.equal(h.requests.length, 2);
  h.requests[1].resolve({ data: [{ id: 1, name: 'Fresh' }], error: null });
  assert.equal((await pending)[0].name, 'Fresh');
});

test('map tab counts use the same Point filtering as the datasets', () => {
  assert.equal(countMapPoints({ features: [
    { geometry: { type: 'Point', coordinates: [44, 41] } },
    { geometry: { type: 'Point', coordinates: [0, 0] } },
    { geometry: { type: 'LineString', coordinates: [] } },
    { geometry: null },
    { geometry: { type: 'Point' } },
  ] }), 2);
  const dataRoot = new URL('../public/data/', import.meta.url);
  assert.equal(countMapPoints(JSON.parse(readFileSync(new URL('fuel-stations.geojson', dataRoot)))), 559);
  assert.equal(countMapPoints(JSON.parse(readFileSync(new URL('chargers.geojson', dataRoot)))), 262);
});
