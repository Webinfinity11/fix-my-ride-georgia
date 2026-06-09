// Re-export from canonical SEO utils to avoid duplication.
// Keep this file as a stable import path; all logic lives in seoUtils.
export {
  generateMetaTags,
  generateStructuredData,
  generateBreadcrumbStructuredData,
  generateFAQStructuredData,
  generateProductStructuredData,
  generateSEOTitle,
  generateSEODescription,
  generateCanonicalURL,
} from "./seoUtils";

/** Default OG image (placeholder until per-page dynamic OG generation lands). */
export const createOGImageURL = (_title?: string, _description?: string) =>
  "https://fixup.ge/fixup-og-image.jpg";
