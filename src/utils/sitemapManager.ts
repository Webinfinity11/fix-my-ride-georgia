// Sitemap manager - clean implementation
import { supabase } from '@/integrations/supabase/client';
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

  // Generate complete sitemap and write directly to public/sitemap.xml
  async updateSitemap(): Promise<boolean> {
    try {
      console.log('Generating sitemap and writing to public/sitemap.xml...');
      
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
        
        // Write directly to public/sitemap.xml
        await this.writeToPublicSitemapFile(sitemapXML);
        
        const stats = this.extractSitemapStats(sitemapXML);
        toast.success(`Sitemap updated: ${stats.totalUrls} links written to public/sitemap.xml`);
        return true;
      }

      toast.error('Invalid sitemap response');
      return false;
    } catch (error) {
      console.error('Error updating sitemap:', error);
      toast.error('Failed to update sitemap');
      return false;
    }
  }

  // Write sitemap directly to public/sitemap.xml file
  private async writeToPublicSitemapFile(sitemapXML: string): Promise<void> {
    try {
      console.log('Writing all links to public/sitemap.xml...');
      
      // Use the write edge function to handle file writing
      const { data, error } = await supabase.functions.invoke('write-sitemap-to-public', {
        body: { sitemapXML },
      });

      if (error) {
        console.error('Error writing sitemap:', error);
        throw error;
      }

      console.log('Successfully wrote sitemap with stats:', data?.stats);
      
    } catch (error) {
      console.error('Error in writeToPublicSitemapFile:', error);
      throw error;
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