import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import * as Router from 'react-router-dom';

// Render actual route guards with fixture roles; no backend calls or account changes.
function renderDashboard(role, path) {
  const rendered = [];
  const source = ts.transpileModule(readFileSync(new URL('../src/pages/Dashboard.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  const stub = ({ children }) => React.createElement('div', null, children);
  vm.runInNewContext(source, {
    exports,
    console: { log() {}, error() {} },
    require(name) {
      if (name === 'react/jsx-runtime') return ReactRuntime;
      if (name === 'react') return { ...React, useEffect() {}, useState: () => [false, () => {}], lazy(loader) {
        const section = loader.toString().match(/dashboard\/(?:customer|mechanic|admin)\/([^"']+)/)?.[1];
        assert.ok(section, 'lazy import points to a dashboard section');
        return () => { rendered.push(section); return React.createElement('div', null, section); };
      } };
      if (name === 'react-router-dom') return Router;
      if (name === 'react-helmet-async') return { Helmet: () => null };
      if (name === '@/context/AuthContext') return { useAuth: () => ({ user: role ? { id: 'fixture', role } : null, initialized: true, loading: false }) };
      if (name === 'sonner') return { toast: { error() {} } };
      if (/\/dashboard\/(customer|mechanic|admin)\//.test(name) && !name.endsWith('MechanicMobileHeader')) throw new Error(`Section loaded eagerly: ${name}`);
      return { default: stub, Header: stub };
    },
  });
  renderToString(React.createElement(MemoryRouter, { initialEntries: [`/dashboard${path}`] },
    React.createElement(Router.Routes, null, React.createElement(Router.Route, { path: '/dashboard/*', element: React.createElement(exports.default) }))));
  return rendered;
}
import * as ReactRuntime from 'react/jsx-runtime';

for (const [role, section] of [['customer', 'CustomerDashboard'], ['mechanic', 'MechanicDashboard'], ['admin', 'AdminDashboard']]) {
  test(`${role} opens only its own overview`, () => assert.deepEqual(renderDashboard(role, ''), [section]));
}
test('section routes select only the requested component', () => {
  assert.deepEqual(renderDashboard('customer', '/profile'), ['CustomerProfile']);
  assert.deepEqual(renderDashboard('mechanic', '/services'), ['MechanicServices']);
  assert.deepEqual(renderDashboard('admin', '/admin/blog'), ['BlogManagement']);
  assert.deepEqual(renderDashboard('admin', '/admin/analytics'), ['AdminAnalytics']);
});
test('unauthorized roles never render administrative sections', () => {
  assert.deepEqual(renderDashboard('customer', '/admin/blog'), []);
  assert.deepEqual(renderDashboard('mechanic', '/admin/analytics'), []);
  assert.deepEqual(renderDashboard(null, ''), []);
});
