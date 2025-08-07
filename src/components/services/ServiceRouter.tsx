import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useEnhancedSlugManagement } from '@/hooks/useEnhancedSlugManagement';
import { useQuery } from '@tanstack/react-query';
import ServiceDetail from '@/pages/ServiceDetail';

/**
 * Service Router Component
 * Handles service routing by slug with fallback to ID
 */
export const ServiceRouter: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { findServiceBySlug } = useEnhancedSlugManagement();

  const { data: serviceResult, isLoading, error } = useQuery({
    queryKey: ['service-by-slug', slug],
    queryFn: () => findServiceBySlug(slug || ''),
    enabled: !!slug,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Show loading state
  if (isLoading) {
    return <ServiceDetail />;
  }

  // If service found, render ServiceDetail
  if (serviceResult?.data && !serviceResult.error) {
    return <ServiceDetail />;
  }

  // If slug looks like an ID, redirect to ID format
  if (slug && /^\d+$/.test(slug)) {
    return <ServiceDetail />;
  }

  // If no service found and error, redirect to services list
  if (error || serviceResult?.error) {
    console.log(`Service not found for slug: ${slug}, redirecting to services list`);
    return <Navigate to="/services" replace />;
  }

  return <ServiceDetail />;
};

export default ServiceRouter;