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
  
  // For now, we'll need to fetch from database to find ID by slug
  // This is a placeholder - the actual lookup will be done in the component
  return slugOrId;
}

/**
 * Create full slug with ID for backwards compatibility
 */
export function createServiceSlug(id: number, name: string): string {
  const slug = createSlug(name);
  return slug || id.toString();
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