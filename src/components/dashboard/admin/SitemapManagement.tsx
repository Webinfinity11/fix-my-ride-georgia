import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Globe, CheckCircle, AlertCircle, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SitemapManagement = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [crawlProgress, setCrawlProgress] = useState<string>('');
  const [sitemapStats, setSitemapStats] = useState({
    totalUrls: 0,
    discovered: 0,
    processed: 0,
    valid: 0,
    redirectsResolved: 0,
    maxDepth: 0,
    depthDistribution: {} as Record<number, number>,
    contentTypes: {} as Record<string, number>
  });

  const handleUpdateSitemap = async () => {
    setIsUpdating(true);
    setCrawlProgress('Starting website crawl...');
    
    try {
      const { data, error } = await supabase.functions.invoke('crawl-sitemap', {
        body: { trigger: 'manual_admin' }
      });

      if (error) {
        console.error('Error updating sitemap:', error);
        toast.error('Sitemap განახლება ვერ მოხერხდა');
        return;
      }

      if (data.success) {
        setSitemapStats({
          totalUrls: data.totalUrls,
          discovered: data.breakdown.discovered,
          processed: data.breakdown.processed,
          valid: data.breakdown.valid,
          redirectsResolved: data.breakdown.redirectsResolved,
          maxDepth: data.breakdown.maxDepth || 0,
          depthDistribution: data.breakdown.depthDistribution || {},
          contentTypes: data.breakdown.contentTypes || {}
        });
        setLastUpdate(new Date().toLocaleString('ka-GE'));
        setCrawlProgress('');
        toast.success(`Sitemap წარმატებით განახლდა! ${data.totalUrls} ვალიდური URL დამუშავდა (${data.breakdown.redirectsResolved} redirect გადაწყდა)`);
      } else {
        toast.error('Sitemap განახლება ვერ მოხერხდა');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Sitemap განახლება ვერ მოხერხდა');
    } finally {
      setIsUpdating(false);
      setCrawlProgress('');
    }
  };

  const handleDownloadSitemap = async () => {
    try {
      const { data: { publicUrl } } = supabase.storage
        .from('service-photos')
        .getPublicUrl('sitemap.xml');

      const response = await fetch(publicUrl);
      
      if (!response.ok) {
        toast.error('Sitemap ფაილი ვერ მოიძებნა. პირველად განაახლეთ');
        return;
      }

      const xmlContent = await response.text();
      
      // Create and download the file
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sitemap-${new Date().toISOString().split('T')[0]}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Sitemap ფაილი წარმატებით გადმოწერილია');
    } catch (error) {
      console.error('Error downloading sitemap:', error);
      toast.error('Sitemap ფაილის გადმოწერა ვერ მოხერხდა');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Sitemap მართვა
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">ავტომატური განახლება</h3>
            <p className="text-sm text-muted-foreground">
              Sitemap ავტომატურად განახლდება როცა სერვისები, კატეგორიები ან მექანიკოსები იცვლება
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            აქტიური
          </Badge>
        </div>

        <Separator />

        <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">მანუალური განახლება</h3>
                <p className="text-sm text-muted-foreground">
                  ვებსაიტის დინამიური crawling და redirect resolution - მხოლოდ საბოლოო, მუშა URLs-ები
                </p>
                {crawlProgress && (
                  <p className="text-xs text-primary mt-1 animate-pulse">
                    {crawlProgress}
                  </p>
                )}
              </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleDownloadSitemap}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                გადმოწერა
              </Button>
              <Button 
                onClick={handleUpdateSitemap}
                disabled={isUpdating}
                size="sm"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    განახლება...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    განახლება
                  </>
                )}
              </Button>
            </div>
          </div>

          {lastUpdate && (
            <div className="text-sm text-muted-foreground">
              ბოლო განახლება: {lastUpdate}
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-medium">Sitemap სტატისტიკა</h3>
          
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>აღმოჩენილი URLs:</span>
                  <Badge variant="secondary">{sitemapStats.discovered}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>დამუშავებული:</span>
                  <Badge variant="secondary">{sitemapStats.processed}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>მაქსიმალური სიღრმე:</span>
                  <Badge variant="secondary">{sitemapStats.maxDepth}</Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>ვალიდური URLs:</span>
                  <Badge variant="secondary">{sitemapStats.valid}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Redirects გადაწყვეტილი:</span>
                  <Badge variant="secondary">{sitemapStats.redirectsResolved}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>HTML გვერდები:</span>
                  <Badge variant="secondary">{sitemapStats.contentTypes['text/html'] || 0}</Badge>
                </div>
              </div>
            </div>

            {Object.keys(sitemapStats.depthDistribution).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">სიღრმის განაწილება:</h4>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(sitemapStats.depthDistribution).map(([depth, count]) => (
                    <div key={depth} className="flex justify-between text-xs bg-muted p-2 rounded">
                      <span>Lvl {depth}:</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-medium">სულ ლინკები:</span>
            <Badge className="text-base px-3 py-1">
              {sitemapStats.totalUrls}
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            ინფორმაცია
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• დინამიური website crawling რეალურ დროში</li>
            <li>• ყველა redirect-ის (301, 302, 307, 308) გადაწყვეტა საბოლოო URL-მდე</li>
            <li>• მხოლოდ მუშა, ვალიდური URLs-ები (200 status)</li>
            <li>• დუბლიკატების და external links-ების ავტომატური გაფილტვრა</li>
            <li>• <a href="/sitemap.xml" target="_blank" className="text-primary hover:underline">Live sitemap: /sitemap.xml</a> (ავტომატურად განახლდება)</li>
            <li>• Google Search Console-ისთვის ოპტიმიზებული</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SitemapManagement;