import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface PageMetaProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  canonicalUrl?: string;
  noIndex?: boolean;
  structuredData?: object;
}

export const PageMeta = ({
  title,
  description,
  keywords,
  image,
  type = 'website',
  canonicalUrl,
  noIndex = false,
  structuredData
}: PageMetaProps) => {
  const location = useLocation();
  
  const defaultTitle = "FixUp - ავტომობილის სერვისი საქართველოში";
  const defaultDescription = "FixUp-ზე იპოვეთ საუკეთესო ავტომობილის სერვისები საქართველოში. მექანიკები, დიაგნოსტიკა, შეკეთება და მეტი.";
  const defaultImage = "https://fixup.ge/fixup-og-image.jpg";
  
  const finalTitle = title || defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalImage = image || defaultImage;
  
  const getCanonicalUrl = () => {
    if (canonicalUrl) {
      return canonicalUrl.startsWith('http') ? canonicalUrl : `https://fixup.ge${canonicalUrl}`;
    }
    
    const baseUrl = 'https://fixup.ge';
    let path = location.pathname;
    
    // Clean path
    if (path !== '/' && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    path = path.replace(/\/+/g, '/');
    
    return `${baseUrl}${path}`;
  };

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={getCanonicalUrl()} />
      
      {/* Open Graph */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={getCanonicalUrl()} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="FixUp" />
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
      
      {/* SEO Meta */}
      <meta name="robots" content={noIndex ? "noindex,nofollow" : "index,follow"} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="ka" />
      <meta name="author" content="FixUp Georgia" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};