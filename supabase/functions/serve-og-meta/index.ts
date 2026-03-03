import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://fixup.ge'
const DEFAULT_OG_IMAGE = `${SITE_URL}/fixup-og-image.jpg`
const SITE_NAME = 'Fixup.ge - ავტოხელოსანი'

// Georgian to Latin for slug matching
const georgianToLatin = (text: string): string => {
  if (!text) return '';
  const mapping: Record<string, string> = {
    'ა':'a','ბ':'b','გ':'g','დ':'d','ე':'e','ვ':'v','ზ':'z','თ':'t',
    'ი':'i','კ':'k','ლ':'l','მ':'m','ნ':'n','ო':'o','პ':'p','ჟ':'zh',
    'რ':'r','ს':'s','ტ':'t','უ':'u','ფ':'f','ქ':'q','ღ':'gh','ყ':'q',
    'შ':'sh','ჩ':'ch','ც':'ts','ძ':'dz','წ':'ts','ჭ':'ch','ხ':'kh','ჯ':'j','ჰ':'h'
  };
  return text.toLowerCase().split('').map(c => mapping[c] || c).join('')
    .replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
};

function buildOgHtml(meta: { title: string; description: string; url: string; image: string; type?: string }) {
  return `<!DOCTYPE html>
<html lang="ka" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(meta.title)}</title>
  <meta name="description" content="${escapeHtml(meta.description)}">
  <meta property="og:title" content="${escapeHtml(meta.title)}">
  <meta property="og:description" content="${escapeHtml(meta.description)}">
  <meta property="og:url" content="${escapeHtml(meta.url)}">
  <meta property="og:image" content="${escapeHtml(meta.image)}">
  <meta property="og:type" content="${meta.type || 'website'}">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:locale" content="ka_GE">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(meta.title)}">
  <meta name="twitter:description" content="${escapeHtml(meta.description)}">
  <meta name="twitter:image" content="${escapeHtml(meta.image)}">
  <link rel="canonical" href="${escapeHtml(meta.url)}">
</head>
<body>
  <p>${escapeHtml(meta.description)}</p>
  <a href="${escapeHtml(meta.url)}">Visit ${escapeHtml(meta.title)}</a>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path') || '/';
    const fullUrl = `${SITE_URL}${path}`;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let meta = {
      title: 'Fixup.ge - ავტოხელოსანი | ავტოსერვისები საქართველოში',
      description: 'იპოვეთ საუკეთესო ავტოხელოსნები და ავტოსერვისები საქართველოში. ონლაინ დაჯავშნა, შეფასებები, ფასების შედარება.',
      url: fullUrl,
      image: DEFAULT_OG_IMAGE,
      type: 'website'
    };

    // /service/:id-slug
    const serviceMatch = path.match(/^\/service\/(\d+)/);
    if (serviceMatch) {
      const serviceId = parseInt(serviceMatch[1]);
      const { data } = await supabase
        .from('mechanic_services')
        .select('name, description, photos, city, district, address, rating, review_count')
        .eq('id', serviceId)
        .eq('is_active', true)
        .single();

      if (data) {
        const location = data.address || (data.city && data.district ? `${data.city}, ${data.district}` : data.city || '');
        meta.title = `${data.name}${location ? ` - ${location}` : ''} | Fixup.ge`;
        meta.description = data.description?.substring(0, 160) || `${data.name} - ავტოსერვისი${location ? ` ${location}` : ''} | Fixup.ge`;
        meta.image = data.photos?.[0] || DEFAULT_OG_IMAGE;
        meta.type = 'product';
      }
    }

    // /mechanic/:id-slug
    const mechanicMatch = path.match(/^\/mechanic\/(\d+)/);
    if (mechanicMatch) {
      const displayId = parseInt(mechanicMatch[1]);
      const { data } = await supabase
        .from('mechanic_profiles')
        .select('id, display_id, rating, review_count, specialization, profiles!inner(first_name, last_name, city, avatar_url)')
        .eq('display_id', displayId)
        .single();

      if (data) {
        const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
        const name = `${profile.first_name} ${profile.last_name}`;
        meta.title = `${name} - ავტოხელოსანი${profile.city ? ` ${profile.city}` : ''} | Fixup.ge`;
        meta.description = `${name}${data.specialization ? ` - ${data.specialization}` : ''}.${data.rating ? ` რეიტინგი: ${data.rating}` : ''} | Fixup.ge`;
        meta.image = profile.avatar_url || DEFAULT_OG_IMAGE;
        meta.type = 'profile';
      }
    }

    // /blog/:slug
    const blogMatch = path.match(/^\/blog\/(.+)/);
    if (blogMatch) {
      const slug = blogMatch[1];
      const { data } = await supabase
        .from('blog_posts')
        .select('title, excerpt, meta_description, featured_image')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (data) {
        meta.title = `${data.title} | Fixup.ge ბლოგი`;
        meta.description = data.meta_description || data.excerpt?.substring(0, 160) || data.title;
        meta.image = data.featured_image || DEFAULT_OG_IMAGE;
        meta.type = 'article';
      }
    }

    const html = buildOgHtml(meta);

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });

  } catch (error) {
    console.error('Error in serve-og-meta:', error);
    const html = buildOgHtml({
      title: 'Fixup.ge - ავტოხელოსანი',
      description: 'ავტოსერვისები საქართველოში',
      url: SITE_URL,
      image: DEFAULT_OG_IMAGE,
    });
    return new Response(html, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
});
