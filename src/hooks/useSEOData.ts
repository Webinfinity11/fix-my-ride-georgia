import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SEOMetadata {
  id: string;
  page_type: string;
  page_id: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  h1_title?: string;
  h2_description?: string;
}

export const useSEOData = (pageType: string, pageId: string) => {
  const [seoData, setSeoData] = useState<SEOMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSEOData = async () => {
      if (!pageType || !pageId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('seo_metadata')
          .select('*')
          .eq('page_type', pageType)
          .eq('page_id', pageId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.warn('Error fetching SEO data:', error);
        }

        setSeoData(data || null);
      } catch (error) {
        console.warn('Error fetching SEO data:', error);
        setSeoData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSEOData();
  }, [pageType, pageId]);

  return { seoData, loading };
};