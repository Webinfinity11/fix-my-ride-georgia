import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Try to get sitemap from storage
    const { data: sitemapData, error } = await supabase.storage
      .from('service-photos')
      .download('sitemap.xml')

    if (error || !sitemapData) {
      console.log('No sitemap found in storage, generating new one...')
      
      // Generate new sitemap if not found
      const { error: generateError } = await supabase.functions.invoke('generate-sitemap', {
        body: { trigger: 'serve_request' }
      })

      if (generateError) {
        console.error('Error generating sitemap:', generateError)
        throw generateError
      }

      // Try to get the newly generated sitemap
      const { data: newSitemapData, error: newError } = await supabase.storage
        .from('service-photos')
        .download('sitemap.xml')

      if (newError || !newSitemapData) {
        throw new Error('Failed to generate or retrieve sitemap')
      }

      const xmlContent = await newSitemapData.text()
      
      return new Response(xmlContent, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      })
    }

    const xmlContent = await sitemapData.text()
    
    return new Response(xmlContent, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })

  } catch (error) {
    console.error('Error serving sitemap:', error)
    
    // Fallback sitemap
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://fixup.ge/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`
    
    return new Response(fallbackSitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=60', // Short cache for fallback
      },
    })
  }
})