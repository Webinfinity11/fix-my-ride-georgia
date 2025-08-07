import { useState, useCallback } from 'react';
import { SlugManager } from '@/utils/slugSystem';

export const useSlugManagement = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedSlug, setLastGeneratedSlug] = useState<string>('');

  /**
   * Generate a unique slug for a service
   */
  const generateSlug = useCallback(async (serviceName: string, excludeId?: number): Promise<string> => {
    setIsGenerating(true);
    
    try {
      const slug = await SlugManager.generateUniqueSlug(serviceName, excludeId);
      setLastGeneratedSlug(slug);
      return slug;
    } catch (error) {
      console.error('Error generating slug:', error);
      return '';
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Update service slug in database
   */
  const updateSlug = useCallback(async (serviceId: number, newSlug: string): Promise<boolean> => {
    try {
      return await SlugManager.updateServiceSlug(serviceId, newSlug);
    } catch (error) {
      console.error('Error updating slug:', error);
      return false;
    }
  }, []);

  /**
   * Check if slug is available
   */
  const checkSlugAvailability = useCallback(async (slug: string, excludeId?: number): Promise<boolean> => {
    try {
      const exists = await SlugManager.slugExists(slug, excludeId);
      return !exists;
    } catch (error) {
      console.error('Error checking slug availability:', error);
      return false;
    }
  }, []);

  /**
   * Find service by slug
   */
  const findServiceBySlug = useCallback(async (slug: string) => {
    try {
      return await SlugManager.findServiceBySlug(slug);
    } catch (error) {
      console.error('Error finding service by slug:', error);
      return { data: null, error: 'Search error' };
    }
  }, []);

  return {
    generateSlug,
    updateSlug,
    checkSlugAvailability,
    findServiceBySlug,
    isGenerating,
    lastGeneratedSlug
  };
};