import { corsHeaders } from '../_shared/cors.ts';

const DOMAIN = 'https://fixup.ge';
const MAX_URLS = 2000;
const MIN_URLS_TARGET = 100;
const MAX_DEPTH = 4;
const TIMEOUT = 15000;
const CONCURRENT_REQUESTS = 5;

interface CrawlResult {
  url: string;
  finalUrl: string;
  status: number;
  redirectCount: number;
  lastmod: string;
  depth: number;
  contentType?: string;
}

interface UrlQueueItem {
  url: string;
  depth: number;
  source: string;
}

interface CrawlProgress {
  discovered: number;
  processed: number;
  valid: number;
  redirectsResolved: number;
  currentDepth: number;
  status: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting comprehensive deep crawl...');
    
    const discoveredUrls = new Map<string, number>(); // URL -> depth
    const processedUrls = new Set<string>();
    const validUrls = new Map<string, CrawlResult>();
    const urlQueue: UrlQueueItem[] = [];
    
    // Real content seed URLs - only pages with actual content
    const seedUrls = [
      // Main content pages only
      { url: DOMAIN, depth: 0, source: 'seed' },
      { url: `${DOMAIN}/services`, depth: 0, source: 'seed' },
      { url: `${DOMAIN}/mechanics`, depth: 0, source: 'seed' },
      { url: `${DOMAIN}/search`, depth: 0, source: 'seed' },
      { url: `${DOMAIN}/about`, depth: 0, source: 'seed' },
      { url: `${DOMAIN}/contact`, depth: 0, source: 'seed' },
      { url: `${DOMAIN}/laundries`, depth: 0, source: 'seed' },
    ];

    // Add search pattern URLs
    const searchPatterns = [
      '/services?category=',
      '/services?search=',
      '/mechanics?city=',
      '/mechanics?specialization=',
      '/search?q=',
      '/search?type=service',
      '/search?type=mechanic',
    ];

    const commonSearchTerms = [
      'ავტო', 'სერვისი', 'შეკეთება', 'ძრავა', 'ფრენები', 'ზეთი', 'ბატარეა',
      'მექანიკი', 'ელექტრო', 'კონდიციონერი', 'შუშა', 'საღებავი'
    ];

    // Generate search URLs
    searchPatterns.forEach(pattern => {
      commonSearchTerms.forEach(term => {
        const searchUrl = `${DOMAIN}${pattern}${encodeURIComponent(term)}`;
        seedUrls.push({ url: searchUrl, depth: 1, source: 'search-pattern' });
      });
    });

    // Add only first few pagination pages - will validate content later
    for (let page = 1; page <= 3; page++) {
      seedUrls.push({ url: `${DOMAIN}/services?page=${page}`, depth: 1, source: 'pagination' });
      seedUrls.push({ url: `${DOMAIN}/mechanics?page=${page}`, depth: 1, source: 'pagination' });
    }

    // Initialize queue
    seedUrls.forEach(item => {
      if (!discoveredUrls.has(item.url)) {
        discoveredUrls.set(item.url, item.depth);
        urlQueue.push(item);
      }
    });

    let progress: CrawlProgress = {
      discovered: discoveredUrls.size,
      processed: 0,
      valid: 0,
      redirectsResolved: 0,
      currentDepth: 0,
      status: 'Starting comprehensive crawl...'
    };

    console.log(`Initial queue: ${urlQueue.length} URLs`);

    // Process URLs from queue with depth-first approach
    while (urlQueue.length > 0 && processedUrls.size < MAX_URLS) {
      // Process in batches for efficiency
      const batch = urlQueue.splice(0, CONCURRENT_REQUESTS);
      const promises = batch.map(async (item) => {
        if (processedUrls.has(item.url)) return null;
        processedUrls.add(item.url);

        progress.processed = processedUrls.size;
        progress.currentDepth = item.depth;
        progress.status = `Processing depth ${item.depth}: ${item.url}`;
        
        console.log(`Processing ${processedUrls.size}/${discoveredUrls.size} (depth ${item.depth}): ${item.url}`);

        try {
          const result = await crawlUrl(item.url, item.depth);
          
          if (result && result.status === 200) {
            // Validate content before adding to valid URLs
            const hasRealContent = await validatePageContent(result.finalUrl);
            if (hasRealContent) {
              validUrls.set(result.finalUrl, result);
              progress.valid = validUrls.size;
            } else {
              console.log(`Filtered out empty/invalid content: ${result.finalUrl}`);
              continue;
            }
            
            if (result.redirectCount > 0) {
              progress.redirectsResolved++;
            }

            // Continue crawling deeper if within depth limit
            if (item.depth < MAX_DEPTH) {
              const newUrls = await extractUrlsFromContent(result.finalUrl, item.depth + 1);
              
              // Add discovered URLs to queue
              newUrls.forEach(newItem => {
                const existingDepth = discoveredUrls.get(newItem.url);
                if (!existingDepth || existingDepth > newItem.depth) {
                  discoveredUrls.set(newItem.url, newItem.depth);
                  if (!processedUrls.has(newItem.url)) {
                    urlQueue.push(newItem);
                  }
                }
              });
              
              progress.discovered = discoveredUrls.size;
            }

            return result;
          }
        } catch (error) {
          console.log(`Failed to process ${item.url}: ${error.message}`);
        }
        return null;
      });

      await Promise.all(promises);

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // If we haven't reached our target, try pattern-based discovery
    if (validUrls.size < MIN_URLS_TARGET) {
      console.log(`Only found ${validUrls.size} URLs, attempting pattern discovery...`);
      progress.status = 'Attempting pattern-based discovery...';
      
      const patternUrls = await discoverUrlPatterns(validUrls);
      
      for (const patternUrl of patternUrls) {
        if (processedUrls.size >= MAX_URLS) break;
        if (processedUrls.has(patternUrl)) continue;
        
        processedUrls.add(patternUrl);
        try {
          const result = await crawlUrl(patternUrl, MAX_DEPTH);
          if (result && result.status === 200) {
            // Validate content for pattern URLs too
            const hasRealContent = await validatePageContent(result.finalUrl);
            if (hasRealContent) {
              validUrls.set(result.finalUrl, result);
              progress.valid = validUrls.size;
            }
          }
        } catch (error) {
          console.log(`Pattern discovery failed for ${patternUrl}: ${error.message}`);
        }
      }
    }

    progress.status = 'Analyzing discovered content...';
    console.log(`Crawl complete. Found ${validUrls.size} valid URLs across ${Math.max(...Array.from(discoveredUrls.values())) + 1} depth levels`);

    // Generate comprehensive sitemap
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

    const depthStats = analyzeDepthDistribution(Array.from(validUrls.values()));
    const contentStats = analyzeContentTypes(Array.from(validUrls.values()));

    const breakdown = {
      discovered: discoveredUrls.size,
      processed: processedUrls.size,
      valid: validUrls.size,
      redirectsResolved: progress.redirectsResolved,
      maxDepth: Math.max(...Array.from(discoveredUrls.values())),
      depthDistribution: depthStats,
      contentTypes: contentStats
    };

    console.log('Comprehensive sitemap generation complete:', breakdown);

    return new Response(JSON.stringify({
      success: true,
      totalUrls: validUrls.size,
      breakdown,
      progress
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in comprehensive crawl-sitemap:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function crawlUrl(url: string, depth: number): Promise<CrawlResult | null> {
  try {
    let redirectCount = 0;
    let currentUrl = url;
    let finalResponse: Response;

    // Manual redirect following to count redirects
    while (redirectCount < 10) {
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT),
        headers: {
          'User-Agent': 'FixUp-Deep-Crawler/2.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
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

    const contentType = finalResponse.headers.get('content-type') || '';

    return {
      url,
      finalUrl: currentUrl,
      status: finalResponse.status,
      redirectCount,
      lastmod: new Date().toISOString().split('T')[0],
      depth,
      contentType
    };

  } catch (error) {
    console.log(`Error crawling ${url}: ${error.message}`);
    return null;
  }
}

async function extractUrlsFromContent(url: string, depth: number): Promise<UrlQueueItem[]> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT),
      headers: {
        'User-Agent': 'FixUp-Deep-Crawler/2.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!response.ok) return [];

    const html = await response.text();
    const discoveredUrls: UrlQueueItem[] = [];

    // Extract all href attributes
    const hrefMatches = html.matchAll(/href\s*=\s*["']([^"']+)["']/gi);
    for (const match of hrefMatches) {
      const href = match[1];
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && 
          !href.startsWith('tel:') && !href.startsWith('javascript:')) {
        try {
          const fullUrl = new URL(href, url).href;
          if (isInternalUrl(fullUrl) && isValidPageUrl(fullUrl)) {
            discoveredUrls.push({ url: fullUrl, depth, source: 'href-extraction' });
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    }

    // Extract JavaScript-generated URLs
    const jsUrlMatches = html.matchAll(/['"`](\/[^'"`\s<>]*?)['"`]/g);
    for (const match of jsUrlMatches) {
      const path = match[1];
      if (path && path.length > 1 && !path.includes('.')) {
        try {
          const fullUrl = new URL(path, DOMAIN).href;
          if (isInternalUrl(fullUrl) && isValidPageUrl(fullUrl)) {
            discoveredUrls.push({ url: fullUrl, depth, source: 'js-extraction' });
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    }

    // Extract data attributes that might contain URLs
    const dataUrlMatches = html.matchAll(/data-[^=]*=\s*["']([^"']*\/[^"']*)["']/gi);
    for (const match of dataUrlMatches) {
      const dataUrl = match[1];
      if (dataUrl && dataUrl.startsWith('/')) {
        try {
          const fullUrl = new URL(dataUrl, DOMAIN).href;
          if (isInternalUrl(fullUrl) && isValidPageUrl(fullUrl)) {
            discoveredUrls.push({ url: fullUrl, depth, source: 'data-attribute' });
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    }

    // Look for pagination patterns
    const paginationMatches = html.matchAll(/(?:page|გვერდი)\s*[=:]\s*(\d+)/gi);
    const currentPageMatch = url.match(/[?&]page=(\d+)/);
    const currentPage = currentPageMatch ? parseInt(currentPageMatch[1]) : 1;
    
    // Generate only a few pagination URLs - content will be validated
    const maxPages = Math.min(currentPage + 3, 10);
    for (let page = 1; page <= maxPages; page++) {
      if (page !== currentPage) {
        const baseUrl = url.split('?')[0];
        const paginationUrl = `${baseUrl}?page=${page}`;
        discoveredUrls.push({ url: paginationUrl, depth, source: 'pagination-discovery' });
      }
    }

    // Skip API endpoints - not user-facing content
    // Focus only on user-facing content pages

    console.log(`Extracted ${discoveredUrls.length} URLs from ${url} at depth ${depth}`);
    return discoveredUrls;

  } catch (error) {
    console.log(`Error extracting URLs from ${url}: ${error.message}`);
    return [];
  }
}

async function discoverUrlPatterns(validUrls: Map<string, CrawlResult>): Promise<string[]> {
  const patterns: string[] = [];
  const existingPaths = new Set<string>();
  
  // Analyze existing URLs for patterns
  validUrls.forEach((result) => {
    const url = new URL(result.finalUrl);
    existingPaths.add(url.pathname);
  });

  // Generate service detail pages based on found patterns
  const serviceMatches = Array.from(existingPaths).filter(path => path.includes('/service/'));
  serviceMatches.forEach(path => {
    const match = path.match(/\/service\/(\d+)/);
    if (match) {
      const serviceId = parseInt(match[1]);
      // Generate similar service IDs
      for (let i = Math.max(1, serviceId - 10); i <= serviceId + 50; i++) {
        patterns.push(`${DOMAIN}/service/${i}`);
      }
    }
  });

  // Generate mechanic profile pages
  const mechanicMatches = Array.from(existingPaths).filter(path => path.includes('/mechanic/'));
  mechanicMatches.forEach(path => {
    const match = path.match(/\/mechanic\/([^/]+)/);
    if (match) {
      // Try variations of mechanic IDs
      for (let i = 1; i <= 100; i++) {
        patterns.push(`${DOMAIN}/mechanic/${i}`);
      }
    }
  });

  // Generate category pages
  const categories = [
    'auto-service', 'engine-repair', 'brake-service', 'oil-change',
    'tire-service', 'electrical', 'body-work', 'diagnostics'
  ];
  
  categories.forEach(category => {
    patterns.push(`${DOMAIN}/services/category/${category}`);
    patterns.push(`${DOMAIN}/category/${category}`);
  });

  console.log(`Generated ${patterns.length} pattern-based URLs for discovery`);
  return patterns.slice(0, 200); // Limit pattern discovery
}

function analyzeDepthDistribution(results: CrawlResult[]): Record<number, number> {
  const distribution: Record<number, number> = {};
  results.forEach(result => {
    distribution[result.depth] = (distribution[result.depth] || 0) + 1;
  });
  return distribution;
}

function analyzeContentTypes(results: CrawlResult[]): Record<string, number> {
  const types: Record<string, number> = {};
  results.forEach(result => {
    const type = result.contentType?.split(';')[0] || 'unknown';
    types[type] = (types[type] || 0) + 1;
  });
  return types;
}

function isInternalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.origin === DOMAIN;
  } catch {
    return false;
  }
}

// Validate if page has real content
async function validatePageContent(url: string): Promise<boolean> {
  try {
    // Skip validation for static files and non-HTML content
    if (!isValidPageUrl(url)) {
      return false;
    }

    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT),
      headers: {
        'User-Agent': 'FixUp-Content-Validator/1.0',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });

    if (!response.ok) return false;

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return false;
    }

    const html = await response.text();
    
    // Check for real content indicators
    const hasTitle = /<title[^>]*>([^<]+)<\/title>/i.test(html) && 
                    !html.includes('<title></title>') &&
                    !html.includes('<title>404') &&
                    !html.includes('<title>Not Found');
    
    // Check for main content elements
    const hasContent = html.includes('<main') || 
                      html.includes('class="content') ||
                      html.includes('id="content') ||
                      html.length > 5000; // Substantial content
    
    // Check for specific FixUp content patterns
    const hasFixUpContent = html.includes('service') || 
                           html.includes('mechanic') || 
                           html.includes('სერვისი') ||
                           html.includes('მექანიკი') ||
                           html.includes('FixUp');
    
    // Filter out empty pagination pages
    if (url.includes('page=')) {
      const hasListItems = html.includes('<article') || 
                          html.includes('service-card') ||
                          html.includes('mechanic-card') ||
                          html.includes('class="card');
      if (!hasListItems) {
        return false;
      }
    }
    
    // Must have title and either content or FixUp-specific elements
    return hasTitle && (hasContent || hasFixUpContent);
    
  } catch (error) {
    console.log(`Content validation failed for ${url}: ${error.message}`);
    return false;
  }
}

function isValidPageUrl(url: string): boolean {
  const urlObj = new URL(url);
  const path = urlObj.pathname.toLowerCase();
  
  // Exclude static files and non-content URLs
  const invalidExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.rar',
    '.css', '.js', '.json', '.xml', '.txt', '.rss', '.map'
  ];
  
  if (invalidExtensions.some(ext => path.endsWith(ext))) {
    return false;
  }
  
  // Exclude admin, auth, and non-content paths
  const excludePaths = [
    '/admin', '/login', '/register', '/auth', '/api',
    '/dashboard', '/_', '/wp-admin', '/cms', '/robots.txt',
    '/sitemap.xml', '/.well-known', '/favicon'
  ];
  
  if (excludePaths.some(excludePath => path.startsWith(excludePath))) {
    return false;
  }

  // Exclude URLs with only fragments
  if (urlObj.hash && !urlObj.pathname.replace('/', '')) {
    return false;
  }
  
  // Must be a real content path
  const validPaths = [
    '/services', '/service/', '/mechanics', '/mechanic/',
    '/categories', '/category/', '/laundries', '/laundry/',
    '/search', '/about', '/contact', '/map'
  ];
  
  // Allow homepage and valid content paths
  return path === '/' || validPaths.some(validPath => path.startsWith(validPath));
}

function generateSitemapXml(results: CrawlResult[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Sort by URL for consistency
  results.sort((a, b) => a.finalUrl.localeCompare(b.finalUrl));
  
  for (const result of results) {
    // Only include HTML pages in sitemap
    if (result.contentType && !result.contentType.includes('text/html')) {
      continue;
    }

    const priority = calculatePriority(result.finalUrl, result.depth);
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

function calculatePriority(url: string, depth: number): string {
  const urlObj = new URL(url);
  const path = urlObj.pathname;
  
  // Base priority calculation
  let priority = 1.0;
  
  if (path === '/' || path === '') priority = 1.0;
  else if (path === '/services' || path === '/mechanics') priority = 0.9;
  else if (path === '/search' || path === '/laundries') priority = 0.8;
  else if (path.startsWith('/service/') || path.startsWith('/mechanic/')) priority = 0.8;
  else if (path.includes('/category/')) priority = 0.7;
  else if (path === '/about' || path === '/contact') priority = 0.6;
  else priority = 0.5;
  
  // Reduce priority based on depth
  const depthPenalty = depth * 0.1;
  priority = Math.max(0.1, priority - depthPenalty);
  
  return priority.toFixed(1);
}

function calculateChangeFreq(url: string): string {
  const path = new URL(url).pathname;
  
  if (path === '/' || path === '') return 'daily';
  if (path === '/services' || path === '/mechanics' || path === '/search') return 'daily';
  if (path.startsWith('/service/') || path.startsWith('/mechanic/')) return 'weekly';
  if (path.includes('/category/')) return 'weekly';
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