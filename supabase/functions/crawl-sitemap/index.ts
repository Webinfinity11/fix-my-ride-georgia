import { corsHeaders } from '../_shared/cors.ts';

const DOMAIN = 'https://fixup.ge';
const MAX_URLS = 1000;
const TIMEOUT = 10000;

interface CrawlResult {
  url: string;
  finalUrl: string;
  status: number;
  redirectCount: number;
  lastmod: string;
}

interface CrawlProgress {
  discovered: number;
  processed: number;
  valid: number;
  redirectsResolved: number;
  status: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting dynamic website crawl...');
    
    const discoveredUrls = new Set<string>();
    const processedUrls = new Set<string>();
    const validUrls = new Map<string, CrawlResult>();
    const urlQueue: string[] = [DOMAIN];
    
    // Add initial known routes
    const staticRoutes = [
      '',
      '/services',
      '/mechanics', 
      '/search',
      '/about',
      '/contact',
      '/laundries'
    ];
    
    staticRoutes.forEach(route => {
      const fullUrl = DOMAIN + route;
      discoveredUrls.add(fullUrl);
      urlQueue.push(fullUrl);
    });

    let progress: CrawlProgress = {
      discovered: discoveredUrls.size,
      processed: 0,
      valid: 0,
      redirectsResolved: 0,
      status: 'Starting crawl...'
    };

    console.log(`Initial queue: ${urlQueue.length} URLs`);

    // Process URLs from queue
    while (urlQueue.length > 0 && processedUrls.size < MAX_URLS) {
      const currentUrl = urlQueue.shift()!;
      
      if (processedUrls.has(currentUrl)) continue;
      processedUrls.add(currentUrl);

      progress.processed = processedUrls.size;
      progress.status = `Processing: ${currentUrl}`;
      console.log(`Processing ${processedUrls.size}/${discoveredUrls.size}: ${currentUrl}`);

      try {
        const result = await crawlUrl(currentUrl);
        
        if (result && result.status === 200) {
          validUrls.set(result.finalUrl, result);
          progress.valid = validUrls.size;
          
          if (result.redirectCount > 0) {
            progress.redirectsResolved++;
          }

          // Extract more URLs from HTML content
          const newUrls = await extractUrlsFromContent(result.finalUrl);
          newUrls.forEach(url => {
            if (!discoveredUrls.has(url) && isInternalUrl(url)) {
              discoveredUrls.add(url);
              urlQueue.push(url);
            }
          });
          
          progress.discovered = discoveredUrls.size;
        }
      } catch (error) {
        console.log(`Failed to process ${currentUrl}: ${error.message}`);
      }

      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    progress.status = 'Generating sitemap...';
    console.log(`Crawl complete. Found ${validUrls.size} valid URLs`);

    // Generate sitemap XML
    const sitemap = generateSitemapXml(Array.from(validUrls.values()));
    const sitemapIndex = generateSitemapIndexXml();

    progress.status = 'Uploading to storage...';

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Upload sitemap.xml
    const uploadResponse1 = await fetch(`${supabaseUrl}/storage/v1/object/service-photos/sitemap.xml`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/xml',
        'x-upsert': 'true'
      },
      body: sitemap
    });

    // Upload sitemap-index.xml
    const uploadResponse2 = await fetch(`${supabaseUrl}/storage/v1/object/service-photos/sitemap-index.xml`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/xml',
        'x-upsert': 'true'
      },
      body: sitemapIndex
    });

    if (!uploadResponse1.ok || !uploadResponse2.ok) {
      throw new Error('Failed to upload sitemap files');
    }

    progress.status = 'Complete';

    const breakdown = {
      static: staticRoutes.length,
      discovered: discoveredUrls.size,
      processed: processedUrls.size,
      valid: validUrls.size,
      redirectsResolved: progress.redirectsResolved
    };

    console.log('Sitemap generation complete:', breakdown);

    return new Response(JSON.stringify({
      success: true,
      totalUrls: validUrls.size,
      breakdown,
      progress
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in crawl-sitemap:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function crawlUrl(url: string): Promise<CrawlResult | null> {
  try {
    // Add cache busting parameter
    const urlWithTimestamp = new URL(url);
    urlWithTimestamp.searchParams.set('t', Date.now().toString());
    
    let redirectCount = 0;
    let currentUrl = url;
    let finalResponse: Response;

    // Manual redirect following to count redirects
    while (redirectCount < 10) { // Prevent infinite redirects
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT),
        headers: {
          'User-Agent': 'FixUp-Sitemap-Crawler/1.0'
        }
      });

      if (response.status >= 200 && response.status < 300) {
        finalResponse = response;
        break;
      }

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) break;
        
        const redirectUrl = new URL(location, currentUrl).href;
        
        // Only follow internal redirects
        if (!isInternalUrl(redirectUrl)) {
          return null;
        }
        
        currentUrl = redirectUrl;
        redirectCount++;
        continue;
      }

      // Non-2xx, non-3xx status
      return null;
    }

    if (!finalResponse! || finalResponse.status !== 200) {
      return null;
    }

    // Verify it's HTML content
    const contentType = finalResponse.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return null;
    }

    return {
      url,
      finalUrl: currentUrl,
      status: finalResponse.status,
      redirectCount,
      lastmod: new Date().toISOString().split('T')[0]
    };

  } catch (error) {
    console.log(`Error crawling ${url}: ${error.message}`);
    return null;
  }
}

async function extractUrlsFromContent(url: string): Promise<string[]> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT),
      headers: {
        'User-Agent': 'FixUp-Sitemap-Crawler/1.0'
      }
    });

    if (!response.ok) return [];

    const html = await response.text();
    const urls = new Set<string>();

    // Extract all href attributes
    const hrefMatches = html.matchAll(/href\s*=\s*["']([^"']+)["']/gi);
    for (const match of hrefMatches) {
      const href = match[1];
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        try {
          const fullUrl = new URL(href, url).href;
          if (isInternalUrl(fullUrl) && isValidPageUrl(fullUrl)) {
            urls.add(fullUrl);
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    }

    return Array.from(urls);
  } catch (error) {
    console.log(`Error extracting URLs from ${url}: ${error.message}`);
    return [];
  }
}

function isInternalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.origin === DOMAIN;
  } catch {
    return false;
  }
}

function isValidPageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.toLowerCase();
    
    // Exclude file extensions
    if (path.match(/\.(css|js|jpg|jpeg|png|gif|svg|pdf|zip|xml|json|ico|woff|woff2|ttf|eot)$/i)) {
      return false;
    }
    
    // Exclude admin/private pages
    if (path.includes('/admin') || path.includes('/login') || path.includes('/register') || 
        path.includes('/dashboard') || path.includes('/api/') || path.includes('/_')) {
      return false;
    }
    
    // Remove fragment-only URLs
    if (urlObj.hash && !urlObj.pathname.replace('/', '')) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

function generateSitemapXml(results: CrawlResult[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Sort by URL for consistency
  results.sort((a, b) => a.finalUrl.localeCompare(b.finalUrl));
  
  for (const result of results) {
    const priority = calculatePriority(result.finalUrl);
    const changefreq = calculateChangeFreq(result.finalUrl);
    
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(result.finalUrl)}</loc>\n`;
    xml += `    <lastmod>${result.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += '  </url>\n';
  }
  
  xml += '</urlset>';
  return xml;
}

function generateSitemapIndexXml(): string {
  const lastmod = new Date().toISOString().split('T')[0];
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${DOMAIN}/sitemap.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
</sitemapindex>`;
}

function calculatePriority(url: string): string {
  const path = new URL(url).pathname;
  
  if (path === '/' || path === '') return '1.0';
  if (path === '/services' || path === '/mechanics') return '0.9';
  if (path === '/search' || path === '/laundries') return '0.8';
  if (path.startsWith('/service/') || path.startsWith('/mechanic/')) return '0.8';
  if (path === '/about' || path === '/contact') return '0.6';
  
  return '0.5';
}

function calculateChangeFreq(url: string): string {
  const path = new URL(url).pathname;
  
  if (path === '/' || path === '') return 'daily';
  if (path === '/services' || path === '/mechanics' || path === '/search') return 'daily';
  if (path.startsWith('/service/') || path.startsWith('/mechanic/')) return 'weekly';
  if (path === '/about' || path === '/contact') return 'monthly';
  
  return 'weekly';
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}