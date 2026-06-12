-- Optional SEO override fields for service_categories.
-- All NULLable — the React side falls back to template-generated content
-- when these are empty, so admins can populate them gradually.

ALTER TABLE public.service_categories
  ADD COLUMN IF NOT EXISTS seo_intro TEXT,
  ADD COLUMN IF NOT EXISTS seo_faq JSONB,
  ADD COLUMN IF NOT EXISTS seo_meta_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_meta_description TEXT;

COMMENT ON COLUMN public.service_categories.seo_intro IS 'HTML intro paragraph for category landing page; NULL → template fallback';
COMMENT ON COLUMN public.service_categories.seo_faq IS 'Array of {q, a} objects for FAQ section + structured data; NULL → template fallback';
COMMENT ON COLUMN public.service_categories.seo_meta_title IS 'Override <title> tag; NULL → template fallback';
COMMENT ON COLUMN public.service_categories.seo_meta_description IS 'Override meta description; NULL → template fallback';
