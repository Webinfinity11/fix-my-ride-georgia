import { NavigateFunction } from 'react-router-dom';

export interface RedirectOptions {
  permanent?: boolean;
  replace?: boolean;
  preserveQuery?: boolean;
}

/**
 * Performs SEO-friendly redirects with proper status codes
 */
export const performRedirect = (
  navigate: NavigateFunction,
  to: string,
  options: RedirectOptions = {}
) => {
  const { replace = true, preserveQuery = false } = options;
  
  // If we need to preserve query params
  let redirectUrl = to;
  if (preserveQuery && typeof window !== 'undefined') {
    const currentSearch = window.location.search;
    if (currentSearch && !to.includes('?')) {
      redirectUrl = `${to}${currentSearch}`;
    }
  }
  
  // Use replace to avoid creating history entries for SEO redirects
  navigate(redirectUrl, { replace });
  
  // For server-side rendering, we would set proper status codes here
  // This is handled by the routing system in production
};

/**
 * Creates canonical URL from current route and parameters
 */
export const createCanonicalUrl = (pathname: string, params?: Record<string, string>) => {
  const baseUrl = 'https://fixup.ge';
  let url = pathname;
  
  // Replace route parameters with actual values
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value);
    });
  }
  
  // Remove trailing slashes and ensure proper format
  url = url.replace(/\/$/, '') || '/';
  
  return `${baseUrl}${url}`;
};

/**
 * Checks if current URL needs redirect to canonical version
 */
export const needsCanonicalRedirect = (currentSlug: string, canonicalSlug: string): boolean => {
  return currentSlug !== canonicalSlug && canonicalSlug.length > 0;
};