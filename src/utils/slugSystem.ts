import { supabase } from '@/integrations/supabase/client';

/**
 * Enhanced slug system for managing service URLs
 * Handles Georgian text, duplicates, and ensures unique slugs
 */

// Georgian to Latin character mapping
const GEORGIAN_TO_LATIN: { [key: string]: string } = {
  'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z',
  'თ': 't', 'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o',
  'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'p',
  'ქ': 'q', 'ღ': 'gh', 'ყ': 'q', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz',
  'წ': 'ts', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
};

export class SlugManager {
  /**
   * Generate a clean base slug from text
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
   * Generate a unique slug by adding numbers if needed
   */
  static async generateUniqueSlug(text: string, excludeId?: number): Promise<string> {
    const baseSlug = this.generateBaseSlug(text);
    
    if (!baseSlug) {
      // Fallback to a generic slug if text produces empty result
      return this.generateUniqueSlug('service', excludeId);
    }

    // First, try the base slug
    const baseExists = await this.slugExists(baseSlug, excludeId);
    if (!baseExists) {
      return baseSlug;
    }

    // If base exists, try with numbers
    let counter = 1;
    let uniqueSlug = `${baseSlug}-${counter}`;
    
    while (counter <= 1000) { // Safety limit
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
   * Update service slug in database
   */
  static async updateServiceSlug(serviceId: number, newSlug: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('mechanic_services')
        .update({ slug: newSlug })
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
   * Find service by slug or generated slug
   */
  static async findServiceBySlug(slug: string) {
    try {
      // First try direct slug match
      const directMatch = await supabase
        .from('mechanic_services')
        .select(`
          id, name, description, price_from, price_to, estimated_hours,
          city, district, address, latitude, longitude, car_brands,
          on_site_service, accepts_card_payment, accepts_cash_payment,
          rating, review_count, photos, videos, category_id, mechanic_id, slug,
          service_categories(id, name),
          mechanic_profiles(
            id, rating,
            profiles(id, first_name, last_name, phone)
          )
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (directMatch.data && !directMatch.error) {
        return { data: directMatch.data, error: null };
      }

      // If no direct match, try to find by generated slug from names
      const allServices = await supabase
        .from('mechanic_services')
        .select(`
          id, name, description, price_from, price_to, estimated_hours,
          city, district, address, latitude, longitude, car_brands,
          on_site_service, accepts_card_payment, accepts_cash_payment,
          rating, review_count, photos, videos, category_id, mechanic_id, slug,
          service_categories(id, name),
          mechanic_profiles(
            id, rating,
            profiles(id, first_name, last_name, phone)
          )
        `)
        .eq('is_active', true);

      if (allServices.data && !allServices.error) {
        // Find service where generated slug matches
        const foundService = allServices.data.find(service => {
          const generatedSlug = this.generateBaseSlug(service.name);
          return generatedSlug === slug;
        });

        if (foundService) {
          return { data: foundService, error: null };
        }
      }

      return { data: null, error: 'Service not found' };
    } catch (error) {
      console.error('Error in findServiceBySlug:', error);
      return { data: null, error: 'Database error' };
    }
  }

  /**
   * Repair all malformed slugs in the database
   */
  static async repairAllSlugs(): Promise<void> {
    try {
      console.log('🔧 Starting slug repair process...');
      
      // Get all services
      const { data: services, error } = await supabase
        .from('mechanic_services')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error || !services) {
        console.error('Error fetching services for repair:', error);
        return;
      }

      let repairedCount = 0;
      const slugCounts: { [key: string]: number } = {};

      for (const service of services) {
        const baseSlug = this.generateBaseSlug(service.name);
        
        // Check if current slug is malformed (too long, null, or duplicate pattern)
        const needsRepair = !service.slug || 
                           service.slug.length > 100 || 
                           service.slug.includes(baseSlug.repeat(2));

        if (needsRepair && baseSlug) {
          // Generate unique slug considering already processed services
          let uniqueSlug = baseSlug;
          if (slugCounts[baseSlug]) {
            slugCounts[baseSlug]++;
            uniqueSlug = `${baseSlug}-${slugCounts[baseSlug]}`;
          } else {
            slugCounts[baseSlug] = 0;
          }

          // Update in database
          const updated = await this.updateServiceSlug(service.id, uniqueSlug);
          if (updated) {
            console.log(`✅ Repaired slug for service ${service.id}: "${service.slug}" → "${uniqueSlug}"`);
            repairedCount++;
          }
        } else if (service.slug) {
          // Track existing good slugs
          const currentBase = service.slug.replace(/-\d+$/, '');
          if (!slugCounts[currentBase]) {
            slugCounts[currentBase] = 0;
          }
        }
      }

      console.log(`🎉 Slug repair completed. ${repairedCount} slugs repaired.`);
    } catch (error) {
      console.error('Error in repairAllSlugs:', error);
    }
  }
}

// Auto-repair slugs on module load (runs once when app starts)
setTimeout(() => {
  SlugManager.repairAllSlugs();
}, 3000);

export default SlugManager;