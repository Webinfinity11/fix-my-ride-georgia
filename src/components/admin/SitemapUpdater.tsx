import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { sitemapManager } from '@/utils/sitemapManager';

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

  const handleUpdateSitemap = async () => {
    setIsUpdating(true);
    try {
      console.log('Starting sitemap update and writing to public/sitemap.xml...');
      
      // Generate sitemap and write all links to public/sitemap.xml
      const success = await sitemapManager.updateSitemap();
      
      if (success) {
        // Get the updated sitemap content to show stats
        const sitemapContent = await sitemapManager.getSitemapContent();
        if (sitemapContent) {
          const newStats = sitemapManager.extractSitemapStats(sitemapContent);
          console.log('Sitemap updated with stats:', newStats);
          setStats(newStats);
        }
      }
    } catch (error) {
      console.error('Error updating sitemap:', error);
    }
    setIsUpdating(false);
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
          როდესაც დააჭირებთ "Update Sitemap"-ს, სისტემა მოძებნის ყველა სერვისს, კატეგორიას, მექანიკოსს და საძიებო ლინკს რეალურ დროში 
          და ყველა ლინკს ჩაწერს public/sitemap.xml ფაილში.
        </p>
      </CardContent>
    </Card>
  );
};