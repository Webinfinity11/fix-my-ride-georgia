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
    static: 0,
    services: 0,
    categories: 0,
    mechanics: 0
  });

  const handleUpdateSitemap = async () => {
    setIsUpdating(true);
    setCrawlProgress('რეალური ლინკების გენერირება...');
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-sitemap', {
        body: { trigger: 'manual_admin' }
      });

      if (error) {
        console.error('Error updating sitemap:', error);
        toast.error('Sitemap განახლება ვერ მოხერხდა: ' + error.message);
        setCrawlProgress('შეცდომა: ' + error.message);
        return;
      }

      if (data && data.success) {
        setSitemapStats({
          totalUrls: data.totalUrls || 0,
          static: data.breakdown?.static || 0,
          services: data.breakdown?.services || 0,
          categories: data.breakdown?.categories || 0,
          mechanics: data.breakdown?.mechanics || 0
        });
        setLastUpdate(new Date().toLocaleString('ka-GE'));
        setCrawlProgress('');
        toast.success(`Sitemap წარმატებით განახლდა! ${data.totalUrls} რეალური URL გენერირდა`);
      } else {
        toast.error('Sitemap განახლება ვერ მოხერხდა: ' + (data?.error || 'უცნობი შეცდომა'));
        setCrawlProgress('შეცდომა: ' + (data?.error || 'უცნობი შეცდომა'));
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Sitemap განახლება ვერ მოხერხდა: ' + error.message);
      setCrawlProgress('შეცდომა: ' + error.message);
    } finally {
      setIsUpdating(false);
      setTimeout(() => setCrawlProgress(''), 3000);
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
                  დათაბეისიდან რეალური სერვისების, კატეგორიებისა და მექანიკოსების მიხედვით - მხოლოდ ინდექსირებადი URLs-ები
                </p>
                {crawlProgress && (
                  <p className={`text-xs mt-1 ${crawlProgress.includes('შეცდომა') ? 'text-red-500' : 'text-primary animate-pulse'}`}>
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
                  <span>სტატიკური გვერდები:</span>
                  <Badge variant="secondary">{sitemapStats.static}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>სერვისები:</span>
                  <Badge variant="secondary">{sitemapStats.services}</Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>კატეგორიები:</span>
                  <Badge variant="secondary">{sitemapStats.categories}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>მექანიკოსები:</span>
                  <Badge variant="secondary">{sitemapStats.mechanics}</Badge>
                </div>
              </div>
            </div>

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
            <li>• მხოლოდ რეალური, ინდექსირებადი URLs-ები database-იდან</li>
            <li>• სერვისები, კატეგორიები და მექანიკოსები რომლებიც მართლაც არსებობს</li>
            <li>• URLs-ები რომელიც იუზერი ხედავს გარედან</li>
            <li>• საძიებო სისტემებისთვის ოპტიმიზებული</li>
            <li>• <a href="/sitemap.xml" target="_blank" className="text-primary hover:underline">Live sitemap: /sitemap.xml</a> (ავტომატურად განახლდება)</li>
            <li>• Google Search Console-ისთვის მზადაა</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SitemapManagement;