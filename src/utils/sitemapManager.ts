import { supabase } from '@/integrations/supabase/client';
// Sitemap manager - clean implementation
import { toast } from 'sonner';

export interface SitemapStats {
  services: number;
  categories: number;
  mechanics: number;
  searches: number;
  totalUrls: number;
}

// Simplified sitemap management utility
export class SitemapManager {
  private static instance: SitemapManager;
  private cachedSitemap: string | null = null;
  
  static getInstance(): SitemapManager {
    if (!SitemapManager.instance) {
      SitemapManager.instance = new SitemapManager();
    }
    return SitemapManager.instance;
  }

  // Generate complete sitemap and write to public folder
  async updateSitemap(): Promise<boolean> {
    try {
      console.log('Generating sitemap...');
      
      // Call edge function to generate sitemap
      const { data: sitemapXML, error } = await supabase.functions.invoke('update-sitemap', {
        body: {},
      });

      if (error) {
        console.error('Edge Function error:', error);
        toast.error('Failed to generate sitemap');
        return false;
      }

      if (typeof sitemapXML === 'string') {
        // Cache the sitemap content
        this.cachedSitemap = sitemapXML;
        
        // Write to public folder
        const success = await this.writeToPublicSitemap(sitemapXML);
        
        if (success) {
          const stats = this.extractSitemapStats(sitemapXML);
          toast.success(`Sitemap updated: ${stats.totalUrls} total URLs (${stats.services} services, ${stats.categories} categories, ${stats.mechanics} mechanics, ${stats.searches} searches)`);
          return true;
        }
      }

      toast.error('Invalid sitemap response');
      return false;
    } catch (error) {
      console.error('Error updating sitemap:', error);
      toast.error('Failed to update sitemap');
      return false;
    }
  }

  // Write sitemap to public folder via Edge Function
  private async writeToPublicSitemap(sitemapXML: string): Promise<boolean> {
    try {
      console.log('Writing sitemap to public folder...');
      
      const { data, error } = await supabase.functions.invoke('write-sitemap', {
        body: { sitemapXML },
      });

      if (error) {
        console.error('Edge Function error:', error);
        return false;
      }

      console.log('Public sitemap written successfully:', data);
      return true;
    } catch (error) {
      console.error('Error writing public sitemap:', error);
      return false;
    }
  }

  // Get cached or generate new sitemap
  async getSitemapContent(): Promise<string | null> {
    if (this.cachedSitemap) {
      return this.cachedSitemap;
    }
    
    // Generate new sitemap if none cached
    try {
      const { data: sitemapXML, error } = await supabase.functions.invoke('update-sitemap', {
        body: {},
      });

      if (error) {
        console.error('Error generating sitemap:', error);
        return null;
      }

      if (typeof sitemapXML === 'string') {
        this.cachedSitemap = sitemapXML;
        return sitemapXML;
      }
    } catch (error) {
      console.error('Error getting sitemap content:', error);
    }
    
    return null;
  }

  // Extract statistics from sitemap XML
  extractSitemapStats(sitemapXML: string): SitemapStats {
    const serviceMatches = sitemapXML.match(/<loc>https:\/\/fixup\.ge\/service\//g);
    const categoryMatches = sitemapXML.match(/<loc>https:\/\/fixup\.ge\/category\//g);
    const mechanicMatches = sitemapXML.match(/<loc>https:\/\/fixup\.ge\/mechanic\//g);
    const searchMatches = sitemapXML.match(/<loc>https:\/\/fixup\.ge\/search\?q=/g);
    const totalMatches = sitemapXML.match(/<url>/g);
    
    return {
      services: serviceMatches ? serviceMatches.length : 0,
      categories: categoryMatches ? categoryMatches.length : 0,
      mechanics: mechanicMatches ? mechanicMatches.length : 0,
      searches: searchMatches ? searchMatches.length : 0,
      totalUrls: totalMatches ? totalMatches.length : 0,
    };
  }
}

// Export singleton instance
export const sitemapManager = SitemapManager.getInstance();