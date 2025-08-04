import { useEffect, useState } from 'react';
import { generateSearchSitemap } from '@/utils/seoUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';

const SearchSitemapGenerator = () => {
  const [sitemap, setSitemap] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const generateSitemapXML = async () => {
    setLoading(true);
    try {
      const xml = await generateSearchSitemap();
      setSitemap(xml);
      setLastGenerated(new Date());
      toast.success('Search Sitemap წარმატებით გენერირდა');
    } catch (error) {
      console.error('Error generating search sitemap:', error);
      toast.error('Search Sitemap-ის გენერაცია ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };

  const downloadSitemap = () => {
    if (!sitemap) return;
    
    const blob = new Blob([sitemap], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap-search.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    generateSitemapXML();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search Sitemap Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={generateSitemapXML} 
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'იტვირთება...' : 'განახლება'}
          </Button>
          
          <Button 
            onClick={downloadSitemap} 
            disabled={!sitemap}
            variant="default"
          >
            <Download className="h-4 w-4 mr-2" />
            ჩამოტვირთვა
          </Button>
        </div>
        
        {lastGenerated && (
          <p className="text-sm text-muted-foreground">
            ბოლო განახლება: {lastGenerated.toLocaleString('ka-GE')}
          </p>
        )}
        
        {sitemap && (
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm mb-2">
              Search URLs რაოდენობა: {(sitemap.match(/<url>/g) || []).length}
            </p>
            <div className="text-xs text-muted-foreground mb-2">
              მხოლოდ ის search queries არის შეტანილი რომლებიც მინიმუმ 2-ჯერ მოიძებნა
            </div>
            <pre className="text-xs bg-background p-2 rounded max-h-40 overflow-y-auto">
              {sitemap.substring(0, 500)}...
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchSitemapGenerator;