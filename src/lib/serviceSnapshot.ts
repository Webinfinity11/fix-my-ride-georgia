import type { ServiceType } from '@/types/service';

type ServiceSnapshot = { path: string; service: ServiceType };
declare global {
  interface Window {
    __fixupServiceSnapshotCapture?: ServiceSnapshot;
    __fixupRenderServiceSnapshot?: () => Promise<{ html: string; snapshot: ServiceSnapshot }>;
  }
}

export function readServiceSnapshot(): ServiceType | null {
  try {
    const snapshot: ServiceSnapshot | undefined = (window.__fixupPrerenderCapture && window.__fixupServiceSnapshotCapture)
      || JSON.parse(document.getElementById('service-initial-data')?.textContent || 'null');
    if (snapshot?.path !== window.location.pathname.replace(/\/$/, '')) return null;
    const service = snapshot.service;
    return service && Number.isInteger(service.id) && typeof service.name === 'string'
      && service.mechanic && Array.isArray(service.photos) ? service : null;
  } catch {
    return null;
  }
}
