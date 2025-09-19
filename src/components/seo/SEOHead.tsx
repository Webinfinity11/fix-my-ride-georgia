
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  structuredData?: object;
  canonical?: string;
}

const SEOHead = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  structuredData,
  canonical
}: SEOHeadProps) => {
  const baseUrl = 'https://fixup.ge';
  const defaultImage = `${baseUrl}/fixup-og-image.jpg`;
  const fullTitle = `${title} | ავტოხელოსანი`;
  const imageUrl = image || defaultImage;
  
  // Generate clean canonical URL without query params or fragments
  const getCanonicalUrl = () => {
    if (canonical) return canonical;
    if (url) return url.startsWith('http') ? url : `${baseUrl}${url}`;
    
    if (typeof window !== 'undefined') {
      const cleanPath = window.location.pathname;
      return `${baseUrl}${cleanPath}`;
    }
    return baseUrl;
  };
  
  const canonicalUrl = getCanonicalUrl();
  const pageUrl = url || canonicalUrl;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="ავტოხელოსანი" />
      <meta name="language" content="ka" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content="ავტოხელოსანი" />
      <meta property="og:locale" content="ka_GE" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={title} />
      
      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#000000" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
