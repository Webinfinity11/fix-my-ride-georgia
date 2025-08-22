import { supabase } from '@/integrations/supabase/client';

// Georgian to Latin transliteration mapping
const georgianToLatin: { [key: string]: string } = {
  'ა': 'a',
  'ბ': 'b',
  'გ': 'g',
  'დ': 'd',
  'ე': 'e',
  'ვ': 'v',
  'ზ': 'z',
  'თ': 't',
  'ი': 'i',
  'კ': 'k',
  'ლ': 'l',
  'მ': 'm',
  'ნ': 'n',
  'ო': 'o',
  'პ': 'p',
  'ჟ': 'zh',
  'რ': 'r',
  'ს': 's',
  'ტ': 't',
  'უ': 'u',
  'ფ': 'p',
  'ქ': 'q',
  'ღ': 'gh',
  'ყ': 'q',
  'შ': 'sh',
  'ჩ': 'ch',
  'ც': 'ts',
  'ძ': 'dz',
  'წ': 'ts',
  'ჭ': 'ch',
  'ხ': 'kh',
  'ჯ': 'j',
  'ჰ': 'h'
};

/**
 * Convert Georgian text to URL-friendly slug
 */
export function createSlug(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split('')
    .map(char => georgianToLatin[char] || char)
    .join('')
    .replace(/[^\w\s-]/g, '') // Remove special characters except words, spaces, and hyphens
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Extract service ID from slug or return the slug if it's already an ID
 */
export function extractServiceId(slugOrId: string): string {
  // If it's already a number, return it
  if (/^\d+$/.test(slugOrId)) {
    return slugOrId;
  }
  
  // Check if it follows the ID-slug format (e.g., "425-slug-name")
  const idSlugMatch = slugOrId.match(/^(\d+)-(.+)$/);
  if (idSlugMatch) {
    return idSlugMatch[1]; // Return the ID part
  }
  
  // Legacy slug format - return as is for database lookup
  return slugOrId;
}

/**
 * Create full slug with ID for backwards compatibility
 */
export function createServiceSlug(id: number, name: string): string {
  const slug = createSlug(name);
  return `${id}-${slug}` || id.toString();
}

/**
 * Create mechanic slug with display_id for backwards compatibility
 */
export function createMechanicSlug(displayId: number, firstName: string, lastName: string): string {
  const fullName = `${firstName} ${lastName}`;
  const slug = createSlug(fullName);
  return `${displayId}-${slug}` || displayId.toString();
}
/**
 * Extract mechanic display ID from slug or return the slug if it's already an ID
 */
export function extractMechanicDisplayId(slugOrId: string): string {
  // Check if it follows the display_id-slug format (e.g., "123-slug-name")
  const idSlugMatch = slugOrId.match(/^(\d+)-(.+)$/);
  if (idSlugMatch) {
    return idSlugMatch[1]; // Return the display_id part
  }
  
  // If it's just a number, return it
  if (/^\d+$/.test(slugOrId)) {
    return slugOrId;
  }
  
  // Legacy UUID format - return as is for database lookup
  return slugOrId;
}

/**
 * Create category slug from name
 */
export function createCategorySlug(categoryName: string): string {
  return createSlug(categoryName);
}

/**
 * Get category by slug or ID (for backward compatibility)
 */
export async function getCategoryFromSlug(slug: string) {
  try {
    // First try to get by ID (for backward compatibility)
    const numericId = parseInt(slug);
    if (!isNaN(numericId)) {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .eq('id', numericId)
        .single();
      
      if (!error && data) {
        return data;
      }
    }
    
    // If not found by ID, try to find by matching slug
    const { data: categories, error } = await supabase
      .from('service_categories')
      .select('*');
    
    if (error) {
      console.error("Error fetching categories for slug match:", error);
      return null;
    }
    
    if (categories) {
      const category = categories.find(cat => 
        createCategorySlug(cat.name) === slug
      );
      return category || null;
    }
    
    return null;
  } catch (error) {
    console.error("Error in getCategoryFromSlug:", error);
    return null;
  }
}