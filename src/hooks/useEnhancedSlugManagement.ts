import { useState, useCallback } from 'react';
import { EnhancedSlugManager } from '@/utils/enhancedSlugSystem';

export const useEnhancedSlugManagement = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastGeneratedSlug, setLastGeneratedSlug] = useState<string>('');

  /**
   * Generate a unique slug for a service using database function
   */
  const generateSlug = useCallback(async (serviceName: string, excludeId?: number): Promise<string> => {
    setIsGenerating(true);
    
    try {
      const slug = await EnhancedSlugManager.generateUniqueSlug(serviceName, excludeId);
      setLastGeneratedSlug(slug);
      return slug;
    } catch (error) {
      console.error('Error generating slug:', error);
      return EnhancedSlugManager.previewSlug(serviceName);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Preview what the slug would be (real-time, no database call)
   */
  const previewSlug = useCallback((serviceName: string): string => {
    return EnhancedSlugManager.previewSlug(serviceName);
  }, []);

  /**
   * Update service slug with manual override
   */
  const updateSlug = useCallback(async (serviceId: number, newSlug: string): Promise<boolean> => {
    try {
      return await EnhancedSlugManager.updateServiceSlug(serviceId, newSlug);
    } catch (error) {
      console.error('Error updating slug:', error);
      return false;
    }
  }, []);

  /**
   * Check if slug is available
   */
  const checkSlugAvailability = useCallback(async (slug: string, excludeId?: number): Promise<boolean> => {
    setIsChecking(true);
    
    try {
      const exists = await EnhancedSlugManager.slugExists(slug, excludeId);
      return !exists;
    } catch (error) {
      console.error('Error checking slug availability:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  /**
   * Find service by slug
   */
  const findServiceBySlug = useCallback(async (slug: string) => {
    try {
      return await EnhancedSlugManager.findServiceBySlug(slug);
    } catch (error) {
      console.error('Error finding service by slug:', error);
      return { data: null, error: 'Search error' };
    }
  }, []);

  /**
   * Validate slug format
   */
  const validateSlug = useCallback((slug: string) => {
    return EnhancedSlugManager.validateSlug(slug);
  }, []);

  /**
   * Check if service slug is manually set
   */
  const isSlugManual = useCallback(async (serviceId: number): Promise<boolean> => {
    try {
      return await EnhancedSlugManager.isSlugManual(serviceId);
    } catch (error) {
      console.error('Error checking if slug is manual:', error);
      return false;
    }
  }, []);

  /**
   * Reset slug to auto-generated
   */
  const resetSlugToAuto = useCallback(async (serviceId: number, serviceName: string): Promise<boolean> => {
    try {
      return await EnhancedSlugManager.resetSlugToAuto(serviceId, serviceName);
    } catch (error) {
      console.error('Error resetting slug to auto:', error);
      return false;
    }
  }, []);

  return {
    // Core functions
    generateSlug,
    previewSlug,
    updateSlug,
    checkSlugAvailability,
    findServiceBySlug,
    validateSlug,
    
    // Manual override functions
    isSlugManual,
    resetSlugToAuto,
    
    // State
    isGenerating,
    isChecking,
    lastGeneratedSlug
  };
};