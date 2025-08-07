import { supabase } from '@/integrations/supabase/client';

/**
 * Debug utility to check and fix duplicate slugs
 */
export const debugSlugs = {
  /**
   * Check for duplicate slugs in the database
   */
  async checkDuplicates() {
    console.group('🔍 SLUG DUPLICATE CHECK');
    
    const { data: services, error } = await supabase
      .from('mechanic_services')
      .select('id, name, slug, created_at')
      .order('slug', { ascending: true });

    if (error) {
      console.error('❌ Error fetching services:', error);
      console.groupEnd();
      return [];
    }

    if (!services) {
      console.log('📋 No services found');
      console.groupEnd();
      return [];
    }

    // Group by slug
    const slugGroups: { [key: string]: typeof services } = {};
    
    services.forEach(service => {
      if (service.slug) {
        if (!slugGroups[service.slug]) {
          slugGroups[service.slug] = [];
        }
        slugGroups[service.slug].push(service);
      }
    });

    // Find duplicates
    const duplicates = Object.entries(slugGroups)
      .filter(([slug, group]) => group.length > 1)
      .map(([slug, group]) => ({ slug, services: group }));

    console.log(`📊 Total services: ${services.length}`);
    console.log(`🔗 Unique slugs: ${Object.keys(slugGroups).length}`);
    console.log(`⚠️ Duplicate slugs found: ${duplicates.length}`);

    if (duplicates.length > 0) {
      console.group('🚨 DUPLICATE DETAILS:');
      duplicates.forEach(({ slug, services }) => {
        console.group(`Slug: "${slug}" (${services.length} duplicates)`);
        services.forEach((service, index) => {
          console.log(`${index + 1}. ID: ${service.id}, Name: "${service.name}", Created: ${service.created_at}`);
        });
        console.groupEnd();
      });
      console.groupEnd();
    }

    console.groupEnd();
    return duplicates;
  },

  /**
   * Fix duplicate slugs by adding numbers
   */
  async fixDuplicates() {
    console.group('🔧 FIXING DUPLICATE SLUGS');
    
    const duplicates = await this.checkDuplicates();
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicates found to fix');
      console.groupEnd();
      return;
    }

    let totalFixed = 0;

    for (const { slug, services } of duplicates) {
      console.group(`🔄 Processing slug: "${slug}"`);
      
      // Sort by created_at to keep the oldest one unchanged
      const sortedServices = services.sort((a, b) => 
        new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
      );

      // Keep the first one (oldest) unchanged, rename others
      for (let i = 1; i < sortedServices.length; i++) {
        const service = sortedServices[i];
        const newSlug = `${slug}-${i}`;
        
        console.log(`📝 Updating service ID ${service.id}: "${slug}" → "${newSlug}"`);
        
        const { error } = await supabase
          .from('mechanic_services')
          .update({ slug: newSlug })
          .eq('id', service.id);

        if (error) {
          console.error(`❌ Failed to update service ${service.id}:`, error);
        } else {
          console.log(`✅ Successfully updated service ${service.id}`);
          totalFixed++;
        }
      }
      
      console.groupEnd();
    }

    console.log(`🎉 Fixed ${totalFixed} duplicate slugs`);
    console.groupEnd();
    
    // Check again to verify
    await this.checkDuplicates();
  },

  /**
   * Generate a unique slug for a service name
   */
  async generateUniqueSlug(name: string, excludeId?: number): Promise<string> {
    console.group(`🏷️ GENERATING UNIQUE SLUG for: "${name}"`);
    
    // Georgian to Latin transliteration
    const georgianToLatin: { [key: string]: string } = {
      'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 
      'თ': 't', 'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 
      'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'p', 
      'ქ': 'q', 'ღ': 'gh', 'ყ': 'q', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 
      'წ': 'ts', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
    };

    const createSlug = (text: string): string => {
      return text
        .toLowerCase()
        .replace(/[ა-ჰ]/g, (char) => georgianToLatin[char] || char)
        .replace(/[^\\w\\s-]/g, '')
        .replace(/[\\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    const baseSlug = createSlug(name);
    console.log(`📝 Base slug: "${baseSlug}"`);

    if (!baseSlug) {
      console.log('❌ Empty slug generated');
      console.groupEnd();
      return '';
    }

    let uniqueSlug = baseSlug;
    let counter = 1;

    while (true) {
      console.log(`🔍 Checking availability of: "${uniqueSlug}"`);
      
      const { data: existingService, error } = await supabase
        .from('mechanic_services')
        .select('id')
        .eq('slug', uniqueSlug)
        .neq('id', excludeId || 0)
        .maybeSingle();

      if (error) {
        console.error('❌ Slug check error:', error);
        break;
      }

      if (!existingService) {
        console.log(`✅ Unique slug found: "${uniqueSlug}"`);
        break;
      }

      console.log(`⚠️ Slug "${uniqueSlug}" already exists`);
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
      
      if (counter > 100) {
        console.error('❌ Too many attempts, breaking loop');
        break;
      }
    }

    console.groupEnd();
    return uniqueSlug;
  }
};

// Make it available globally for debugging
(window as any).debugSlugs = debugSlugs;

console.log('🐛 Debug slug utilities loaded. Use window.debugSlugs to access:');
console.log('  - debugSlugs.checkDuplicates() - Check for duplicate slugs');
console.log('  - debugSlugs.fixDuplicates() - Fix all duplicate slugs');
console.log('  - debugSlugs.generateUniqueSlug(name, excludeId?) - Generate unique slug');
