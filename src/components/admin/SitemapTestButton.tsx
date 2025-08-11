import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { sitemapManager } from '@/utils/sitemapManager';
import { toast } from 'sonner';

export const SitemapTestButton = () => {
  const [isTestingEdgeFunction, setIsTestingEdgeFunction] = useState(false);
  const [isTestingLocalGeneration, setIsTestingLocalGeneration] = useState(false);
  const [edgeFunctionResult, setEdgeFunctionResult] = useState<string | null>(null);
  const [localGenerationResult, setLocalGenerationResult] = useState<string | null>(null);

  const testEdgeFunction = async () => {
    setIsTestingEdgeFunction(true);
    setEdgeFunctionResult(null);
    
    try {
      const sitemap = await sitemapManager.generateCompleteSitemap();
      
      if (sitemap) {
        const stats = sitemapManager.extractSitemapStats(sitemap);
        setEdgeFunctionResult(`✅ Success: ${stats.services} services, ${stats.categories} categories, ${stats.totalUrls} total URLs`);
        toast.success('Edge Function test successful');
      } else {
        setEdgeFunctionResult('❌ Failed to generate sitemap');
        toast.error('Edge Function test failed');
      }
    } catch (error) {
      setEdgeFunctionResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Edge Function test failed');
    } finally {
      setIsTestingEdgeFunction(false);
    }
  };

  const testLocalGeneration = async () => {
    setIsTestingLocalGeneration(true);
    setLocalGenerationResult(null);
    
    try {
      const success = await sitemapManager.updateLocalSitemap();
      
      if (success) {
        const stats = sitemapManager.getCurrentStats();
        setLocalGenerationResult(`✅ Success: Generated and stored locally with ${stats?.services || 0} services`);
        toast.success('Local generation test successful');
      } else {
        setLocalGenerationResult('❌ Failed to update local sitemap');
        toast.error('Local generation test failed');
      }
    } catch (error) {
      setLocalGenerationResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Local generation test failed');
    } finally {
      setIsTestingLocalGeneration(false);
    }
  };

  const openSitemap = () => {
    window.open('/sitemap.xml', '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Sitemap Testing & Validation
        </CardTitle>
        <CardDescription>
          Test sitemap generation and validate XML output
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Edge Function Test</p>
              <p className="text-xs text-muted-foreground">Test Supabase Edge Function directly</p>
            </div>
            <Button
              onClick={testEdgeFunction}
              disabled={isTestingEdgeFunction}
              variant="outline"
              size="sm"
            >
              {isTestingEdgeFunction ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Test Function'
              )}
            </Button>
          </div>
          
          {edgeFunctionResult && (
            <div className="p-2 rounded bg-muted">
              <p className="text-xs font-mono">{edgeFunctionResult}</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Local Generation Test</p>
              <p className="text-xs text-muted-foreground">Test full update pipeline</p>
            </div>
            <Button
              onClick={testLocalGeneration}
              disabled={isTestingLocalGeneration}
              variant="outline"
              size="sm"
            >
              {isTestingLocalGeneration ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Test Pipeline'
              )}
            </Button>
          </div>
          
          {localGenerationResult && (
            <div className="p-2 rounded bg-muted">
              <p className="text-xs font-mono">{localGenerationResult}</p>
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">View Live Sitemap</p>
              <p className="text-xs text-muted-foreground">Open /sitemap.xml in browser</p>
            </div>
            <Button
              onClick={openSitemap}
              variant="default"
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View XML
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <Badge variant="outline" className="justify-center text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Edge Function
          </Badge>
          <Badge variant="outline" className="justify-center text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Auto-sync
          </Badge>
          <Badge variant="outline" className="justify-center text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            SEO Ready
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};