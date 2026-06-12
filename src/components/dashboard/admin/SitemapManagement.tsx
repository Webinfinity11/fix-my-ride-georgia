import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Globe, CheckCircle, ExternalLink, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Breakdown = {
  static: number;
  services: number;
  mechanics: number;
  categories: number;
  blog: number;
  vacancies: number;
  videos: number;
};

const SUB_SITEMAPS: { key: keyof Breakdown; label: string; filename: string }[] = [
  { key: 'static',     label: 'სტატიკური გვერდები', filename: 'static-sitemap.xml' },
  { key: 'services',   label: 'სერვისები',          filename: 'service-sitemap.xml' },
  { key: 'mechanics',  label: 'მექანიკოსები',       filename: 'mechanic-sitemap.xml' },
  { key: 'categories', label: 'კატეგორიები',        filename: 'category-sitemap.xml' },
  { key: 'blog',       label: 'ბლოგი',              filename: 'blog-sitemap.xml' },
  { key: 'vacancies',  label: 'ვაკანსიები',         filename: 'vacancy-sitemap.xml' },
  { key: 'videos',     label: 'ვიდეოები',           filename: 'video-sitemap.xml' },
];

const SitemapManagement = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown>({
    static: 0, services: 0, mechanics: 0, categories: 0, blog: 0, vacancies: 0, videos: 0,
  });
  const [totalUrls, setTotalUrls] = useState(0);
  const [subSitemaps, setSubSitemaps] = useState(0);
  const [indexNowStatus, setIndexNowStatus] = useState<number | null>(null);

  const handleRegenerate = async () => {
    setIsUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-sitemap', {
        body: { trigger: 'manual_admin' },
      });

      if (error) {
        toast.error('Sitemap ვერ განახლდა: ' + error.message);
        return;
      }

      if (data?.success) {
        setBreakdown(data.breakdown || breakdown);
        setTotalUrls(data.totalUrls || 0);
        setSubSitemaps(data.subSitemaps || 0);
        setIndexNowStatus(data.indexNowStatus ?? null);
        setLastUpdate(new Date().toLocaleString('ka-GE'));
        toast.success(`Sitemap განახლდა — ${data.subSitemaps} sub-sitemap, ${data.totalUrls} URL`);
      } else {
        toast.error('Sitemap ვერ განახლდა: ' + (data?.error || 'უცნობი შეცდომა'));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error('Sitemap ვერ განახლდა: ' + message);
    } finally {
      setIsUpdating(false);
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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-medium">RankMath-სტილის sitemap_index</h3>
            <p className="text-sm text-muted-foreground">
              ცალკე sub-sitemap თითო კონტენტ ტიპზე. ცარიელი sub-sitemap-ები ავტომატურად გამოირიცხება.
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1 shrink-0">
            <CheckCircle className="h-3 w-3 text-green-500" />
            აქტიური
          </Badge>
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-medium">რეგენერაცია</h3>
            <p className="text-sm text-muted-foreground">
              ღამის cron 03:00-ზე ავტომატურად. manual ჩამოტვირთვა: ქვემოთა ღილაკი.
            </p>
            {lastUpdate && (
              <p className="text-xs text-muted-foreground mt-1">
                ბოლო განახლება: {lastUpdate}
              </p>
            )}
          </div>
          <Button onClick={handleRegenerate} disabled={isUpdating} size="sm">
            {isUpdating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                გენერაცია...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </>
            )}
          </Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-medium">Sub-sitemap სტატისტიკა</h3>

          <div className="space-y-1.5">
            {SUB_SITEMAPS.map(({ key, label, filename }) => (
              <div
                key={key}
                className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-muted/50"
              >
                <a
                  href={`/${filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  {filename}
                  <ExternalLink className="h-3 w-3" />
                </a>
                <Badge variant={breakdown[key] > 0 ? 'secondary' : 'outline'}>
                  {breakdown[key]}
                </Badge>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-3 border-t">
            <a
              href="/sitemap_index.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-medium text-primary hover:underline"
            >
              sitemap_index.xml
              <ExternalLink className="h-3 w-3" />
            </a>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{subSitemaps} sub-sitemap</Badge>
              <Badge className="text-base px-3 py-1">{totalUrls} URL</Badge>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            ინფორმაცია
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>RankMath-სტილი:</strong> sitemap_index.xml ცალკე sub-sitemap-ებით</li>
            <li>• <strong>2000 URL / ფაილი:</strong> ავტომატური pagination (service-sitemap1.xml, …)</li>
            <li>• <strong>ISO 8601 lastmod</strong> timezone-ით — Google-ისთვის ზუსტი სიგნალი</li>
            <li>• <strong>XSL stylesheet:</strong> ბრაუზერში ცოცხალი ცხრილის ხედი</li>
            <li>• <strong>hreflang:</strong> ka-ge + x-default ყველა URL-ზე</li>
            <li>• <strong>IndexNow ping:</strong> Bing + Yandex ავტომატური notification
              {indexNowStatus !== null && (
                <Badge variant={indexNowStatus < 300 ? 'secondary' : 'destructive'} className="ml-2">
                  HTTP {indexNowStatus}
                </Badge>
              )}
            </li>
            <li>• ცარიელი sub-sitemap არ გენერდება (Google warning-ის თავიდან ასაცილებლად)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SitemapManagement;
