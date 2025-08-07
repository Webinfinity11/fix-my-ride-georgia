import { useState, useCallback } from 'react';
import { SmartSlugManager } from '@/utils/smartSlugSystem';

export const useSlugManagement = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedSlug, setLastGeneratedSlug] = useState<string>('');

  /**
   * Generate a smart slug for a service (respects manual overrides)
   */
  const generateSlug = useCallback(async (serviceName: string, excludeId?: number): Promise<string> => {
    setIsGenerating(true);
    
    try {
      const slug = await SmartSlugManager.generateSmartSlug(serviceName, excludeId);
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
   * Generate a unique slug without checking manual override status
   */
  const generateUniqueSlug = useCallback(async (serviceName: string, excludeId?: number): Promise<string> => {
    setIsGenerating(true);
    
    try {
      const slug = await SmartSlugManager.generateUniqueSlug(serviceName, excludeId);
      setLastGeneratedSlug(slug);
      return slug;
    } catch (error) {
      console.error('Error generating unique slug:', error);
      return '';
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Update service slug in database and mark as manual
   */
  const updateSlug = useCallback(async (serviceId: number, newSlug: string, isManual: boolean = true): Promise<boolean> => {
    try {
      return await SmartSlugManager.updateServiceSlug(serviceId, newSlug, isManual);
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
      const exists = await SmartSlugManager.slugExists(slug, excludeId);
      return !exists;
    } catch (error) {
      console.error('Error checking slug availability:', error);
      return false;
    }
  }, []);

  /**
   * Check if service slug was manually set
   */
  const isSlugManual = useCallback(async (serviceId: number): Promise<boolean> => {
    try {
      return await SmartSlugManager.isSlugManual(serviceId);
    } catch (error) {
      console.error('Error checking manual slug status:', error);
      return false;
    }
  }, []);

  /**
   * Preview what slug would be generated from text
   */
  const previewSlug = useCallback((text: string): string => {
    return SmartSlugManager.previewSlug(text);
  }, []);

  /**
   * Validate slug format
   */
  const validateSlug = useCallback((slug: string): { valid: boolean; message?: string } => {
    return SmartSlugManager.validateSlug(slug);
  }, []);

  /**
   * Find service by slug
   */
  const findServiceBySlug = useCallback(async (slug: string) => {
    try {
      return await SmartSlugManager.findServiceBySlug(slug);
    } catch (error) {
      console.error('Error finding service by slug:', error);
      return { data: null, error: 'Search error' };
    }
  }, []);

  return {
    generateSlug,
    generateUniqueSlug,
    updateSlug,
    checkSlugAvailability,
    findServiceBySlug,
    isSlugManual,
    previewSlug,
    validateSlug,
    isGenerating,
    lastGeneratedSlug
  };
};