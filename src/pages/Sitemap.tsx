import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import SitemapGenerator from "@/components/seo/SitemapGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download } from "lucide-react";
import { generateSitemap } from "@/utils/seoUtils";

const Sitemap = () => {
  const [sitemapXML, setSitemapXML] = useState<string>('');
  
  useEffect(() => {
    const loadSitemap = async () => {
      try {
        const xml = await generateSitemap();
        setSitemapXML(xml);
      } catch (error) {
        console.error('Error loading sitemap:', error);
      }
    };

    loadSitemap();
  }, []);

  const downloadSitemap = () => {
    if (!sitemapXML) return;
    
    const blob = new Blob([sitemapXML], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const viewXMLSitemap = () => {
    window.open('/sitemap.xml', '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="საიტის რუკა (Sitemap)"
        description="ავტოხელოსნის საიტის რუკა - ყველა გვერდის სრული ჩამონათვალი"
        keywords="sitemap, საიტის რუკა, ავტოხელოსანი, ნავიგაცია"
        url="https://fixup.ge/sitemap"
      />
      
      <Header />
      
      <main className="flex-grow">
        <div className="bg-muted py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold mb-6 text-center">საიტის რუკა</h1>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto">
              ავტოხელოსნის ყველა გვერდის სრული ჩამონათვალი და XML Sitemap გენერატორი
            </p>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Manual Sitemap */}
            <Card>
              <CardHeader>
                <CardTitle>გვერდების ჩამონათვალი</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">მთავარი გვერდები</h3>
                  <ul className="space-y-1 text-sm">
                    <li><a href="/" className="text-primary hover:underline">მთავარი გვერდი</a></li>
                    <li><a href="/services" className="text-primary hover:underline">სერვისები</a></li>
                    <li><a href="/mechanics" className="text-primary hover:underline">მექანიკოსები</a></li>
                    <li><a href="/search" className="text-primary hover:underline">ძებნა</a></li>
                    <li><a href="/about" className="text-primary hover:underline">ჩვენს შესახებ</a></li>
                    <li><a href="/contact" className="text-primary hover:underline">კონტაქტი</a></li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">ავტორიზაცია</h3>
                  <ul className="space-y-1 text-sm">
                    <li><a href="/login" className="text-primary hover:underline">შესვლა</a></li>
                    <li><a href="/register" className="text-primary hover:underline">რეგისტრაცია</a></li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">სხვა გვერდები</h3>
                  <ul className="space-y-1 text-sm">
                    <li><a href="/book" className="text-primary hover:underline">ჯავშნა</a></li>
                    <li><a href="/add-service" className="text-primary hover:underline">სერვისის დამატება</a></li>
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={viewXMLSitemap}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    XML Sitemap-ის ნახვა
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sitemap Generator */}
            <div>
              <SitemapGenerator />
              
              {sitemapXML && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>მიმდინარე Sitemap</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        URL-ების რაოდენობა: {(sitemapXML.match(/<url>/g) || []).length}
                      </div>
                      
                      <Button
                        variant="outline"
                        onClick={downloadSitemap}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        XML ფაილის ჩამოტვირთვა
                      </Button>
                      
                      <div className="bg-muted p-4 rounded-lg max-h-60 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap">
                          {sitemapXML.substring(0, 1000)}
                          {sitemapXML.length > 1000 && '...'}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Sitemap;