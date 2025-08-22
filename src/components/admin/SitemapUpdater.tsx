import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { sitemapManager } from '@/utils/sitemapManager';
import { useSitemapSync } from '@/hooks/useSitemapSync';
import { supabase } from '@/integrations/supabase/client';

interface SitemapStats {
  services: number;
  categories: number;
  mechanics: number;
  searches: number;
  totalUrls: number;
}

export const SitemapUpdater = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [stats, setStats] = useState<SitemapStats | null>(null);
  const { updateSitemap } = useSitemapSync();

  const handleUpdateSitemap = async () => {
    setIsUpdating(true);
    try {
      const success = await updateSitemap();
      if (success) {
        // Get updated stats after successful update
        const sitemapXML = await getSitemapXML();
        if (sitemapXML) {
          const newStats = sitemapManager.extractSitemapStats(sitemapXML);
          setStats(newStats);
        }
      }
    } catch (error) {
      console.error('Error updating sitemap:', error);
    }
    setIsUpdating(false);
  };

  const getSitemapXML = async () => {
    try {
      const { data } = await supabase.functions.invoke('update-sitemap', { body: {} });
      return typeof data === 'string' ? data : null;
    } catch {
      return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sitemap Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Badge variant="secondary">
              Services: {stats.services}
            </Badge>
            <Badge variant="secondary">
              Categories: {stats.categories}
            </Badge>
            <Badge variant="secondary">
              Mechanics: {stats.mechanics}
            </Badge>
            <Badge variant="secondary">
              Searches: {stats.searches}
            </Badge>
            <Badge variant="outline">
              Total: {stats.totalUrls}
            </Badge>
          </div>
        )}
        
        <Button 
          onClick={handleUpdateSitemap}
          disabled={isUpdating}
          className="w-full"
        >
          {isUpdating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Updating Sitemap...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Sitemap
            </>
          )}
        </Button>
        
        <p className="text-sm text-muted-foreground">
          This will regenerate public/sitemap.xml with all current services, categories, mechanics, and search queries.
          The sitemap automatically updates when data changes.
        </p>
      </CardContent>
    </Card>
  );
};