import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { readServiceSnapshot } from './lib/serviceSnapshot'

const root = document.getElementById('root')!;
if (readServiceSnapshot() && document.documentElement.dataset.ssg === location.pathname.replace(/\/$/, '')) {
  // Keep the server-rendered nodes (especially the LCP image) in place while
  // route code arrives, then attach React behavior through real hydration.
  import('./pages/ServiceDetail').then(({ default: ServicePage }) => {
    hydrateRoot(root, <App initialServiceComponent={ServicePage} />, {
      onRecoverableError(error, info) {
        // Keep hydration failures visible, including the component that differs
        // from the static document (the minified error alone loses that context).
        const diagnostic = new Error(`Service hydration failed: ${error instanceof Error ? error.message : String(error)}\n${info.componentStack}`);
        // Production deliberately strips console calls. Use the same browser
        // error channel as React's default reporter so audits retain failures.
        if (typeof window.reportError === 'function') window.reportError(diagnostic);
        else setTimeout(() => { throw diagnostic; }, 0);
      },
    });
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
