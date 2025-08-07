/**
 * Smart Slug Management System
 * Works with database triggers for automatic Georgian transliteration,
 * uniqueness validation, and manual override detection
 */

import { supabase } from '@/integrations/supabase/client';

// Georgian to Latin character mapping
const GEORGIAN_TO_LATIN: { [key: string]: string } = {
  'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z',
  'თ': 't', 'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o',
  'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'p',
  'ქ': 'q', 'ღ': 'gh', 'ყ': 'q', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz',
  'წ': 'ts', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
};

export class SmartSlugManager {
  /**
   * Generate a clean base slug from text (client-side validation)
   */
  static generateBaseSlug(text: string): string {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .toLowerCase()
      .trim()
      // Replace Georgian characters
      .replace(/[ა-ჰ]/g, (char) => GEORGIAN_TO_LATIN[char] || char)
      // Remove special characters except spaces and hyphens
      .replace(/[^\w\s-]/g, '')
      // Replace multiple spaces/underscores with single hyphen
      .replace(/[\s_]+/g, '-')
      // Remove multiple consecutive hyphens
      .replace(/-+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '')
      // Limit length to prevent extremely long slugs
      .substring(0, 50);
  }

  /**
   * Check if a slug exists in the database
   */
  static async slugExists(slug: string, excludeId?: number): Promise<boolean> {
    try {
      const query = supabase
        .from('mechanic_services')
        .select('id')
        .eq('slug', slug);
      
      if (excludeId) {
        query.neq('id', excludeId);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error) {
        console.error('Error checking slug existence:', error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error('Error in slugExists:', error);
      return false;
    }
  }

  /**
   * Check if a service slug was manually set by admin
   */
  static async isSlugManual(serviceId: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('mechanic_services')
        .select('slug_is_manual')
        .eq('id', serviceId)
        .maybeSingle();

      if (error) {
        console.error('Error checking slug manual status:', error);
        return false;
      }

      return data?.slug_is_manual || false;
    } catch (error) {
      console.error('Manual slug check failed:', error);
      return false;
    }
  }

  /**
   * Generate unique slug using database function (preferred method)
   * This leverages the database trigger for automatic generation
   */
  static async generateUniqueSlug(text: string, excludeId?: number): Promise<string> {
    try {
      // Use database function for reliable generation
      const { data, error } = await supabase.rpc('generate_unique_slug', {
        base_name: text,
        exclude_id: excludeId || null
      });

      if (error) {
        console.error('Database slug generation failed:', error);
        // Fallback to client-side generation
        return this.generateClientSideSlug(text, excludeId);
      }

      return data || this.generateClientSideSlug(text, excludeId);
    } catch (error) {
      console.error('Error in generateUniqueSlug:', error);
      return this.generateClientSideSlug(text, excludeId);
    }
  }

  /**
   * Client-side fallback slug generation
   */
  static async generateClientSideSlug(text: string, excludeId?: number): Promise<string> {
    const baseSlug = this.generateBaseSlug(text);
    
    if (!baseSlug) {
      return 'service';
    }

    // First, try the base slug
    const baseExists = await this.slugExists(baseSlug, excludeId);
    if (!baseExists) {
      return baseSlug;
    }

    // If base exists, try with numbers
    let counter = 1;
    let uniqueSlug = `${baseSlug}-${counter}`;
    
    while (counter <= 100) { // Reasonable limit
      const exists = await this.slugExists(uniqueSlug, excludeId);
      if (!exists) {
        return uniqueSlug;
      }
      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;
    }

    // Fallback with timestamp if we hit the limit
    const timestamp = Date.now().toString().slice(-6);
    return `${baseSlug}-${timestamp}`;
  }

  /**
   * Smart slug generation that respects manual overrides
   */
  static async generateSmartSlug(
    serviceName: string, 
    serviceId?: number, 
    forceGenerate: boolean = false
  ): Promise<string> {
    try {
      // If updating existing service and not forcing, check if slug is manual
      if (serviceId && !forceGenerate) {
        const isManual = await this.isSlugManual(serviceId);
        if (isManual) {
          // Return current slug since it was manually set
          const { data } = await supabase
            .from('mechanic_services')
            .select('slug')
            .eq('id', serviceId)
            .maybeSingle();
          
          return data?.slug || await this.generateUniqueSlug(serviceName, serviceId);
        }
      }

      // Generate new unique slug
      return await this.generateUniqueSlug(serviceName, serviceId);
    } catch (error) {
      console.error('Smart slug generation failed:', error);
      return this.generateBaseSlug(serviceName);
    }
  }

  /**
   * Update service slug and mark it as manually set
   */
  static async updateServiceSlug(serviceId: number, newSlug: string, isManual: boolean = true): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('mechanic_services')
        .update({ 
          slug: newSlug,
          slug_is_manual: isManual 
        })
        .eq('id', serviceId);

      if (error) {
        console.error('Error updating service slug:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Service slug update failed:', error);
      return false;
    }
  }

  /**
   * Find service by slug with enhanced lookup
   */
  static async findServiceBySlug(slug: string) {
    try {
      // First try direct slug match
      const { data: directMatch, error: directError } = await supabase
        .from('mechanic_services')
        .select(`
          *,
          mechanic:mechanic_profiles!mechanic_id (
            *,
            profile:profiles!id (
              first_name,
              last_name,
              avatar_url,
              phone
            )
          ),
          category:service_categories!category_id (
            id,
            name,
            description
          ),
          reviews:service_reviews (
            id,
            rating,
            comment,
            user_id,
            created_at,
            images
          )
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (directError) {
        console.error('Error finding service by exact slug:', directError);
        return { data: null, error: directError.message };
      }

      if (directMatch) {
        return { data: directMatch, error: null };
      }

      // If no exact match and slug looks like an ID, try legacy lookup
      if (/^\d+$/.test(slug)) {
        const { data: legacyMatch, error: legacyError } = await supabase
          .from('mechanic_services')
          .select(`
            *,
            mechanic:mechanic_profiles!mechanic_id (
              *,
              profile:profiles!id (
                first_name,
                last_name,
                avatar_url,
                phone
              )
            ),
            category:service_categories!category_id (
              id,
              name,
              description
            ),
            reviews:service_reviews (
              id,
              rating,
              comment,
              user_id,
              created_at,
              images
            )
          `)
          .eq('id', parseInt(slug))
          .eq('is_active', true)
          .maybeSingle();

        if (legacyError) {
          console.error('Error in legacy ID lookup:', legacyError);
          return { data: null, error: legacyError.message };
        }

        if (legacyMatch) {
          return { data: legacyMatch, error: null };
        }
      }

      return { data: null, error: 'Service not found' };
    } catch (error) {
      console.error('Service lookup failed:', error);
      return { data: null, error: 'Search error' };
    }
  }

  /**
   * Preview what slug would be generated from text
   */
  static previewSlug(text: string): string {
    return this.generateBaseSlug(text);
  }

  /**
   * Validate slug format (client-side)
   */
  static validateSlug(slug: string): { valid: boolean; message?: string } {
    if (!slug || slug.trim() === '') {
      return { valid: false, message: 'Slug cannot be empty' };
    }

    if (slug.length > 50) {
      return { valid: false, message: 'Slug must be 50 characters or less' };
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return { valid: false, message: 'Slug can only contain lowercase letters, numbers, and hyphens' };
    }

    if (slug.startsWith('-') || slug.endsWith('-')) {
      return { valid: false, message: 'Slug cannot start or end with hyphen' };
    }

    if (slug.includes('--')) {
      return { valid: false, message: 'Slug cannot contain consecutive hyphens' };
    }

    return { valid: true };
  }
}

export default SmartSlugManager;