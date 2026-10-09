// Imported only by the build capture. Visitors never download the server renderer.
import { renderToString } from 'react-dom/server';
import { QueryClient } from '@tanstack/react-query';
import App from './App';
import ServiceDetail from './pages/ServiceDetail';

export function renderServiceSnapshot() {
  const snapshot = window.__fixupServiceSnapshotCapture;
  if (!snapshot) throw new Error('Service data is not ready for static rendering');
  // Start optional widgets in the same empty query state as a fresh visitor.
  const html = renderToString(<App initialServiceComponent={ServiceDetail} queryClientOverride={new QueryClient()} />);
  return { html, snapshot };
}
