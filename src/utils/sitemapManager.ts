import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SitemapStats {
  services: number;
  categories: number;
  mechanics: number;
  searches: number;
  lastGenerated: string;
  totalUrls: number;
}

// Central sitemap management utility
export class SitemapManager {
  private static instance: SitemapManager;
  
  static getInstance(): SitemapManager {
    if (!SitemapManager.instance) {
      SitemapManager.instance = new SitemapManager();
    }
    return SitemapManager.instance;
  }

  // Call the Edge Function to generate the complete sitemap
  async generateCompleteSitemap(): Promise<string | null> {
    try {
      console.log('Calling Edge Function to generate sitemap...');
      
      const { data, error } = await supabase.functions.invoke('update-sitemap', {
        body: {},
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw error;
      }

      if (typeof data === 'string') {
        console.log('Sitemap generated successfully via Edge Function');
        return data;
      }

      throw new Error('Invalid response from Edge Function');
    } catch (error) {
      console.error('Error calling Edge Function:', error);
      return null;
    }
  }

  // Update the local storage with the latest sitemap
  async updateLocalSitemap(): Promise<boolean> {
    try {
      const sitemapXML = await this.generateCompleteSitemap();
      
      if (!sitemapXML) {
        toast.error('Failed to generate sitemap');
        return false;
      }

      // Store in localStorage
      localStorage.setItem('complete-sitemap-xml', sitemapXML);
      localStorage.setItem('sitemap-last-generated', new Date().toISOString().split('T')[0]);
      
      // Store stats
      const stats = this.extractSitemapStats(sitemapXML);
      localStorage.setItem('sitemap-stats', JSON.stringify(stats));
      
      // Write to public sitemap.xml
      await this.writeToPublicSitemap(sitemapXML);
      
      toast.success(`Sitemap updated: ${stats.services} services, ${stats.categories} categories, ${stats.mechanics} mechanics, ${stats.searches} searches`);
      return true;
    } catch (error) {
      console.error('Error updating local sitemap:', error);
      toast.error('Failed to update sitemap');
      return false;
    }
  }

  // Write sitemap to public folder via Edge Function
  async writeToPublicSitemap(sitemapXML: string): Promise<boolean> {
    try {
      console.log('Writing sitemap to public folder...');
      
      const { data, error } = await supabase.functions.invoke('write-sitemap', {
        body: { sitemapXML },
      });

      if (error) {
        console.error('Edge Function error:', error);
        toast.error('Failed to write public sitemap');
        return false;
      }

      console.log('Public sitemap written successfully:', data);
      return true;
    } catch (error) {
      console.error('Error writing public sitemap:', error);
      toast.error('Failed to write public sitemap');
      return false;
    }
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
      lastGenerated: new Date().toISOString().split('T')[0],
      totalUrls: totalMatches ? totalMatches.length : 0,
    };
  }

  // Get current sitemap stats from localStorage
  getCurrentStats(): SitemapStats | null {
    try {
      const stored = localStorage.getItem('sitemap-stats');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  // Get the current sitemap XML from localStorage
  getCurrentSitemap(): string | null {
    return localStorage.getItem('complete-sitemap-xml');
  }

  // Check if sitemap needs updating (older than 24 hours)
  needsUpdate(): boolean {
    const lastGenerated = localStorage.getItem('sitemap-last-generated');
    if (!lastGenerated) return true;
    
    const lastDate = new Date(lastGenerated);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff > 24;
  }

  // Download sitemap as XML file
  downloadSitemap(): void {
    const sitemap = this.getCurrentSitemap();
    if (!sitemap) {
      toast.error('No sitemap available to download');
      return;
    }

    const blob = new Blob([sitemap], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sitemap-${new Date().toISOString().split('T')[0]}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Sitemap downloaded successfully');
  }
}

// Export singleton instance
export const sitemapManager = SitemapManager.getInstance();