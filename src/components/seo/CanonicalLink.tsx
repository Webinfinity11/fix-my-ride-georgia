import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

interface CanonicalLinkProps {
  customUrl?: string;
}

export const CanonicalLink = ({ customUrl }: CanonicalLinkProps) => {
  const location = useLocation();
  
  const getCanonicalUrl = () => {
    if (customUrl) {
      return customUrl.startsWith('http') ? customUrl : `https://fixup.ge${customUrl}`;
    }
    
    const baseUrl = 'https://fixup.ge';
    let path = location.pathname;
    
    // Remove trailing slash except for root
    if (path !== '/' && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    
    // Clean up duplicate slashes
    path = path.replace(/\/+/g, '/');
    
    return `${baseUrl}${path}`;
  };

  return (
    <Helmet>
      <link rel="canonical" href={getCanonicalUrl()} />
    </Helmet>
  );
};