import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
      console.error('No sitemap XML provided');
      return new Response(
        JSON.stringify({ error: 'No sitemap XML provided' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Received sitemap XML with length: ${sitemapXML.length} characters`);
    
    // Since we can't write directly to public folder from edge function,
    // we'll store this in a way that can be retrieved by the frontend
    // The frontend will handle writing to public/sitemap.xml
    
    // Extract statistics for logging
    const serviceMatches = sitemapXML.match(/<loc>https:\/\/fixup\.ge\/service\//g);
    const categoryMatches = sitemapXML.match(/<loc>https:\/\/fixup\.ge\/category\//g);
    const mechanicMatches = sitemapXML.match(/<loc>https:\/\/fixup\.ge\/mechanic\//g);
    const searchMatches = sitemapXML.match(/<loc>https:\/\/fixup\.ge\/search\?q=/g);
    const totalMatches = sitemapXML.match(/<url>/g);
    
    const stats = {
      services: serviceMatches ? serviceMatches.length : 0,
      categories: categoryMatches ? categoryMatches.length : 0,
      mechanics: mechanicMatches ? mechanicMatches.length : 0,
      searches: searchMatches ? searchMatches.length : 0,
      totalUrls: totalMatches ? totalMatches.length : 0,
      timestamp: new Date().toISOString()
    };
    
    console.log('Sitemap statistics:', JSON.stringify(stats, null, 2));
    console.log('Sitemap content ready for public folder update');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Sitemap processed successfully',
        stats,
        sitemapContent: sitemapXML
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Error processing sitemap:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process sitemap' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});