import { supabase } from '@/integrations/supabase/client';

/**
 * Enhanced Slug Management System
 * Works with the database-level triggers for automatic slug generation
 */

// Georgian to Latin character mapping (for client-side preview)
const GEORGIAN_TO_LATIN: { [key: string]: string } = {
  'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z',
  'თ': 't', 'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o',
  'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'f',
  'ქ': 'q', 'ღ': 'gh', 'ყ': 'q', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz',
  'წ': 'ts', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
};

export class EnhancedSlugManager {
  /**
   * Generate a base slug from text (client-side preview)
   * This mimics the database function for UI preview purposes
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
      // Limit length
      .substring(0, 50);
  }

  /**
   * Preview what the slug would be (without saving)
   * Useful for real-time preview in forms
   */
  static previewSlug(serviceName: string): string {
    const baseSlug = this.generateBaseSlug(serviceName);
    return baseSlug || 'service';
  }

  /**
   * Check if a slug exists in the database
   */
  static async slugExists(slug: string, excludeId?: number): Promise<boolean> {
    try {
      const query = supabase
        .from('mechanic_services')
        .select('id')
        .eq('slug', slug)
        .eq('is_active', true);
      
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
   * Generate a unique slug using database function
   * This calls the database function for accurate results
   */
  static async generateUniqueSlug(serviceName: string, excludeId?: number): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_unique_slug_enhanced', {
        base_name: serviceName,
        exclude_id: excludeId || null
      });

      if (error) {
        console.error('Error generating unique slug:', error);
        return this.previewSlug(serviceName);
      }

      return data || this.previewSlug(serviceName);
    } catch (error) {
      console.error('Error in generateUniqueSlug:', error);
      return this.previewSlug(serviceName);
    }
  }

  /**
   * Find service by slug
   */
  static async findServiceBySlug(slug: string) {
    try {
      const { data, error } = await supabase
        .from('mechanic_services')
        .select(`
          id, name, description, price_from, price_to, estimated_hours,
          city, district, address, latitude, longitude, car_brands,
          on_site_service, accepts_card_payment, accepts_cash_payment,
          rating, review_count, photos, videos, category_id, mechanic_id, 
          slug, slug_is_manual,
          service_categories(id, name),
          mechanic_profiles(
            id, rating,
            profiles(id, first_name, last_name, phone)
          )
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error finding service by slug:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in findServiceBySlug:', error);
      return { data: null, error: 'Database error' };
    }
  }

  /**
   * Update service slug manually (marks as manual override)
   */
  static async updateServiceSlug(serviceId: number, newSlug: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('mechanic_services')
        .update({ 
          slug: newSlug,
          slug_is_manual: true 
        })
        .eq('id', serviceId);

      if (error) {
        console.error('Error updating service slug:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateServiceSlug:', error);
      return false;
    }
  }

  /**
   * Check if a service slug is manually set
   */
  static async isSlugManual(serviceId: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('mechanic_services')
        .select('slug_is_manual')
        .eq('id', serviceId)
        .maybeSingle();

      if (error || !data) {
        return false;
      }

      return data.slug_is_manual || false;
    } catch (error) {
      console.error('Error checking if slug is manual:', error);
      return false;
    }
  }

  /**
   * Reset slug to auto-generated (removes manual override)
   */
  static async resetSlugToAuto(serviceId: number, serviceName: string): Promise<boolean> {
    try {
      const autoSlug = await this.generateUniqueSlug(serviceName, serviceId);
      
      const { error } = await supabase
        .from('mechanic_services')
        .update({ 
          slug: autoSlug,
          slug_is_manual: false 
        })
        .eq('id', serviceId);

      if (error) {
        console.error('Error resetting slug to auto:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in resetSlugToAuto:', error);
      return false;
    }
  }

  /**
   * Validate slug format
   */
  static validateSlug(slug: string): { isValid: boolean; error?: string } {
    if (!slug || slug.trim() === '') {
      return { isValid: false, error: 'Slug cannot be empty' };
    }

    if (slug.length > 50) {
      return { isValid: false, error: 'Slug must be 50 characters or less' };
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return { isValid: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' };
    }

    if (slug.startsWith('-') || slug.endsWith('-')) {
      return { isValid: false, error: 'Slug cannot start or end with a hyphen' };
    }

    if (slug.includes('--')) {
      return { isValid: false, error: 'Slug cannot contain consecutive hyphens' };
    }

    return { isValid: true };
  }
}

export default EnhancedSlugManager;