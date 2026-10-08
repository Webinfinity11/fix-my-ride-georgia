import type { ServiceType } from '@/hooks/useServices';

export type CategorySnapshot = {
  path: string;
  category: {
    id: number;
    name: string;
    description: string;
    icon: string;
    seo_intro?: string | null;
    seo_faq?: import('@/utils/categoryContent').FAQItem[] | null;
    seo_meta_title?: string | null;
    seo_meta_description?: string | null;
  };
  services: ServiceType[];
  totalCount: number;
  hasMore: boolean;
};

declare global {
  interface Window {
    __fixupPrerenderCapture?: boolean;
    __fixupCategorySnapshotCapture?: CategorySnapshot;
  }
}

// A route's own anonymous build snapshot only. Never use the homepage fallback
// or a snapshot from a previous client-side navigation to seed another route.
export function readCategorySnapshot(): CategorySnapshot | null {
  const path = window.location.pathname.replace(/\/$/, '');
  if (document.documentElement.getAttribute('data-ssg') !== path) return null;
  try {
    const data: CategorySnapshot = JSON.parse(document.getElementById('category-initial-data')?.textContent || 'null');
    if (!data || data.path !== path || !Number.isInteger(data.category?.id)
      || !Array.isArray(data.services) || data.services.length > 24
      || !data.services.every(service => service.category?.id === data.category.id)) return null;
    return data;
  } catch {
    return null;
  }
}
