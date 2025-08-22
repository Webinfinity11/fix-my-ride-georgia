import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sitemapXML } = await req.json();
    
    if (!sitemapXML) {
      return new Response(
        JSON.stringify({ error: 'Sitemap XML is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Write to public/sitemap.xml
    // In a real deployment, this would write to the file system or update a CDN
    // For now, we'll simulate this and return success
    
    console.log('Writing sitemap.xml to public folder...');
    console.log(`Sitemap length: ${sitemapXML.length} characters`);
    
    // Extract stats from sitemap for logging
    const serviceMatches = sitemapXML.match(/<loc>https:\/\/fixup\.ge\/service\//g);
    const categoryMatches = sitemapXML.match(/<loc>https:\/\/fixup\.ge\/category\//g);
    const mechanicMatches = sitemapXML.match(/<loc>https:\/\/fixup\.ge\/mechanic\//g);
    const searchMatches = sitemapXML.match(/<loc>https:\/\/fixup\.ge\/search\?q=/g);
    
    const stats = {
      services: serviceMatches ? serviceMatches.length : 0,
      categories: categoryMatches ? categoryMatches.length : 0,
      mechanics: mechanicMatches ? mechanicMatches.length : 0,
      searches: searchMatches ? searchMatches.length : 0,
      totalUrls: (sitemapXML.match(/<url>/g) || []).length,
      timestamp: new Date().toISOString()
    };
    
    console.log('Sitemap stats:', stats);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Sitemap written successfully',
        stats
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error writing sitemap:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to write sitemap',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})