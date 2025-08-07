/**
 * Enhanced Smart Slug Management System
 * Complete rewrite with database triggers, Georgian transliteration,
 * and manual override protection
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
   */
  static async generateUniqueSlug(text: string, excludeId?: number): Promise<string> {
    try {
      // Use database function for reliable generation
      const { data, error } = await supabase.rpc('generate_unique_slug', {
        base_name: text,
        exclude_id: excludeId || null
      });

      if (error) {
        console.warn('Database slug generation failed, using client fallback:', error);
        return this.generateClientSideSlug(text, excludeId);
      }

      return data || this.generateClientSideSlug(text, excludeId);
    } catch (error) {
      console.warn('Error in generateUniqueSlug, using client fallback:', error);
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
   * Find service by slug - enhanced and simplified
   */
  static async findServiceBySlug(slug: string) {
    try {
      if (!slug) {
        return { data: null, error: 'No slug provided' };
      }

      // Try to find by slug first
      let query = supabase
        .from('mechanic_services')
        .select(`
          *,
          mechanic:mechanic_profiles!mechanic_id (
            id,
            rating,
            review_count,
            is_mobile,
            description,
            hourly_rate,
            verified_at,
            working_hours,
            specialization,
            experience_years,
            accepts_card_payment,
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
          )
        `)
        .eq('is_active', true);

      // Try slug match first
      const { data: slugMatch, error: slugError } = await query
        .eq('slug', slug)
        .maybeSingle();

      if (slugError && slugError.code !== 'PGRST116') {
        console.error('Error finding service by slug:', slugError);
      }

      if (slugMatch) {
        return { data: slugMatch, error: null };
      }

      // If no slug match and slug looks like a number, try ID lookup
      if (/^\d+$/.test(slug)) {
        const { data: idMatch, error: idError } = await query
          .eq('id', parseInt(slug))
          .maybeSingle();

        if (idError && idError.code !== 'PGRST116') {
          console.error('Error finding service by ID:', idError);
        }

        if (idMatch) {
          return { data: idMatch, error: null };
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
// ...შენი სხვა იმპორტები

  /**
   * Generate a clean base slug from text
   */
  static generateBaseSlug(text: string): string {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .toLowerCase()
      .trim()
      // Replace Georgian characters (შენი არსებული GEORGIAN_TO_LATIN გამოიყენე)
      .replace(/[ა-ჰ]/g, (char) => GEORGIAN_TO_LATIN[char] || char)
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  /**
   * Check if a slug exists in the database
   */
  static async slugExists(slug: string, excludeId?: number): Promise<boolean> {
    const query = supabase
      .from('mechanic_services')
      .select('id')
      .eq('slug', slug);

    if (excludeId) query.neq('id', excludeId);

    const { data, error } = await query.maybeSingle();
    if (error) return false;
    return !!data;
  }

  /**
   * Generate a unique slug by adding numbers if needed
   */
  static async generateUniqueSlug(text: string, excludeId?: number): Promise<string> {
    const baseSlug = this.generateBaseSlug(text);

    if (!baseSlug) return this.generateUniqueSlug('service', excludeId);

    // Check if base slug exists
    const baseExists = await this.slugExists(baseSlug, excludeId);
    if (!baseExists) return baseSlug;

    // Try with numbers
    let counter = 1;
    let uniqueSlug = `${baseSlug}-${counter}`;

    while (counter <= 1000) { // safety limit
      const exists = await this.slugExists(uniqueSlug, excludeId);
      if (!exists) return uniqueSlug;
      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;
    }

    // fallback
    const timestamp = Date.now().toString().slice(-6);
    return `${baseSlug}-${timestamp}`;
  }

  /**
   * When inserting/updating mechanic_service, always call generateUniqueSlug
   * Example usage:
   * const slug = await SlugSystem.generateUniqueSlug(name);
   * await supabase.from('mechanic_services').insert({ name, slug, ... });
   */


export default SmartSlugManager;