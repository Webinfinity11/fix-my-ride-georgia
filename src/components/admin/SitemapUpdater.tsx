import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { generateSitemapWithAllServices, updateSitemapFile } from '@/utils/generateSitemapWithAllServices';
import { useSitemapSync } from '@/hooks/useSitemapSync';

export const SitemapUpdater = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [serviceCount, setServiceCount] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Use the automatic sync hook
  useSitemapSync();

  useEffect(() => {
    // Check localStorage for last update info
    const lastUpdated = localStorage.getItem('sitemap-last-updated');
    const storedContent = localStorage.getItem('updated-sitemap-content');
    
    if (lastUpdated) {
      setLastUpdate(lastUpdated);
    }
    
    if (storedContent) {
      // Count service URLs in the stored content
      const serviceUrlMatches = storedContent.match(/<loc>https:\/\/fixup\.ge\/service\//g);
      setServiceCount(serviceUrlMatches ? serviceUrlMatches.length : 0);
    }
  }, []);

  const handleManualUpdate = async () => {
    setIsUpdating(true);
    setStatus('idle');
    
    try {
      const success = await updateSitemapFile();
      
      if (success) {
        const sitemapContent = localStorage.getItem('complete-sitemap-xml');
        
        if (sitemapContent) {
          // Count services in the generated sitemap
          const serviceUrlMatches = sitemapContent.match(/<loc>https:\/\/fixup\.ge\/service\//g);
          const count = serviceUrlMatches ? serviceUrlMatches.length : 0;
          
          setServiceCount(count);
          setLastUpdate(new Date().toISOString().split('T')[0]);
          setStatus('success');
          
          console.log(`Complete sitemap generated with ALL ${count} services`);
        }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Sitemap Management
          {status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
          {status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
        </CardTitle>
        <CardDescription>
          Manage and update the static sitemap with all active services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Service Count</p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {serviceCount !== null ? `${serviceCount} services` : 'Unknown'}
              </Badge>
              {serviceCount === 334 && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  All services synced ✓
                </Badge>
              )}
            </div>
          </div>
          
          <Button 
            onClick={handleManualUpdate}
            disabled={isUpdating}
            size="sm"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Sitemap'
            )}
          </Button>
        </div>
        
        {lastUpdate && (
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdate}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          Note: Changes are automatically synced when services are added/modified.
          The sitemap content is generated and stored for deployment.
        </div>
      </CardContent>
    </Card>
  );
};