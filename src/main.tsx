import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { readServiceSnapshot } from './lib/serviceSnapshot'

const root = document.getElementById('root')!;
if (readServiceSnapshot() && document.documentElement.dataset.ssg === location.pathname.replace(/\/$/, '')) {
  // Keep the server-rendered nodes (especially the LCP image) in place while
  // route code arrives, then attach React behavior through real hydration.
  import('./pages/ServiceDetail').then(({ default: ServicePage }) => {
    hydrateRoot(root, <App initialServiceComponent={ServicePage} />);
  }).catch(() => createRoot(root).render(<App />));
} else {
  createRoot(root).render(<App />);
}

if (window.__fixupPrerenderCapture) {
  window.__fixupRenderServiceSnapshot = async () => {
    const { renderServiceSnapshot } = await import('./prerender-service');
    return renderServiceSnapshot();
  };
}
