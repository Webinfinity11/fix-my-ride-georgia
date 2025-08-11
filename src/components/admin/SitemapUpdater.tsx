import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Download, RefreshCw } from 'lucide-react';
import { sitemapManager, SitemapStats } from '@/utils/sitemapManager';
import { useSitemapSync } from '@/hooks/useSitemapSync';

export const SitemapUpdater = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [stats, setStats] = useState<SitemapStats | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Use the automatic sync hook
  useSitemapSync();

  useEffect(() => {
    // Load current stats
    const currentStats = sitemapManager.getCurrentStats();
    setStats(currentStats);
    
    // Check if update is needed
    if (sitemapManager.needsUpdate()) {
      setStatus('idle');
    } else if (currentStats) {
      setStatus('success');
    }
  }, []);

  const handleManualUpdate = async () => {
    setIsUpdating(true);
    setStatus('idle');
    
    try {
      const success = await sitemapManager.updateLocalSitemap();
      
      if (success) {
        const newStats = sitemapManager.getCurrentStats();
        setStats(newStats);
        setStatus('success');
        console.log('Sitemap update completed successfully');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Error updating sitemap:', error);
      setStatus('error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownload = () => {
    sitemapManager.downloadSitemap();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Sitemap Management
          {status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
          {status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
        </CardTitle>
        <CardDescription>
          Generate and manage XML sitemaps for search engine optimization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Services</p>
            <Badge variant="secondary" className="w-full justify-center">
              {stats?.services || 0} pages
            </Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Categories</p>
            <Badge variant="secondary" className="w-full justify-center">
              {stats?.categories || 0} pages
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Total URLs</p>
          <Badge variant="outline" className="w-full justify-center">
            {stats?.totalUrls || 0} URLs
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleManualUpdate}
            disabled={isUpdating}
            variant="default"
            className="flex-1"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Sitemap
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleDownload}
            disabled={!stats}
            variant="outline"
            size="default"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
        
        {stats?.lastGenerated && (
          <div className="text-sm text-muted-foreground">
            Last generated: {stats.lastGenerated}
          </div>
        )}
        
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Automatic sync when services/categories change</p>
            <p>• Generated via Supabase Edge Function</p>
            <p>• Available at /sitemap.xml for search engines</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};