import { supabase } from '@/integrations/supabase/client';

// Improved Georgian to Latin slug creation
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[ა-ჰ]/g, (char) => {
      const georgianToLatin: { [key: string]: string } = {
        'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 
        'თ': 't', 'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 
        'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'f', 
        'ქ': 'q', 'ღ': 'gh', 'ყ': 'q', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 
        'წ': 'ts', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
      };
      return georgianToLatin[char] || char;
    })
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_]+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length
}

// Generate unique slug by checking database
async function generateUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
  if (!baseSlug) return 'service';
  
  let counter = 0;
  let finalSlug = baseSlug;
  
  while (true) {
    // Check if slug exists
    const { data: existing, error } = await supabase
      .from('mechanic_services')
      .select('id')
      .eq('slug', finalSlug)
      .neq('id', excludeId || 0); // Exclude current service if updating
    
    if (error) {
      console.error('Error checking slug existence:', error);
      // Fallback: add random number
      return `${baseSlug}-${Date.now()}`;
    }
    
    if (!existing || existing.length === 0) {
      return finalSlug;
    }
    
    // Generate next variant
    counter++;
    finalSlug = `${baseSlug}-${counter}`;
    
    // Safety check to prevent infinite loop
    if (counter > 1000) {
      return `${baseSlug}-${Date.now()}`;
    }
  }
}

/**
 * Enhanced function to fix all duplicate slugs with numbered suffixes
 * - Keeps the oldest service with original slug
 * - Adds -1, -2, -3 etc. to newer duplicates  
 * - Preserves all services, just makes slugs unique
 */
export async function fixDuplicateSlugs(): Promise<boolean> {
  console.log('🔍 Starting comprehensive slug cleanup...');
  
  try {
    // Step 1: Get all services ordered by creation date
    const { data: allServices, error: fetchError } = await supabase
      .from('mechanic_services')
      .select('id, name, slug, created_at')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching services:', fetchError);
      return false;
    }

    if (!allServices || allServices.length === 0) {
      console.log('✅ No services found in database');
      return true;
    }

    console.log(`📊 Found ${allServices.length} total services`);

    // Step 2: Identify services that need slug fixes
    const servicesToFix = allServices.filter(service => 
      !service.slug || 
      service.slug.trim() === '' ||
      service.slug === 'undefined' ||
      service.slug === 'null'
    );

    // Step 3: Find duplicate slugs among valid ones
    const slugCounts: { [key: string]: any[] } = {};
    allServices
      .filter(service => service.slug && service.slug.trim() && service.slug !== 'undefined' && service.slug !== 'null')
      .forEach(service => {
        const slug = service.slug!;
        if (!slugCounts[slug]) {
          slugCounts[slug] = [];
        }
        slugCounts[slug].push(service);
      });

    const duplicateGroups = Object.entries(slugCounts)
      .filter(([_, services]) => services.length > 1);

    console.log(`🔧 Services needing slug generation: ${servicesToFix.length}`);
    console.log(`🔄 Duplicate slug groups: ${duplicateGroups.length}`);

    // Step 4: Fix services with missing/invalid slugs
    for (const service of servicesToFix) {
      console.log(`🛠️ Generating slug for: "${service.name}"`);
      
      const baseSlug = createSlug(service.name);
      const uniqueSlug = await generateUniqueSlug(baseSlug, service.id);
      
      const { error: updateError } = await supabase
        .from('mechanic_services')
        .update({ slug: uniqueSlug })
        .eq('id', service.id);

      if (updateError) {
        console.error(`❌ Failed to update service ${service.id}:`, updateError);
      } else {
        console.log(`✅ Updated "${service.name}" → "${uniqueSlug}"`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Step 5: Fix duplicate slugs (keep oldest, add numbers to newer ones)
    for (const [duplicateSlug, services] of duplicateGroups) {
      console.log(`🔄 Fixing duplicate slug: "${duplicateSlug}" (${services.length} services)`);
      
      // Sort by creation date, keep the oldest unchanged
      services.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      console.log(`📅 Oldest service keeps original slug: "${services[0].name}" (${services[0].created_at})`);
      
      // Add numbered suffixes to all newer duplicates
      for (let i = 1; i < services.length; i++) {
        const service = services[i];
        const numberedSlug = `${duplicateSlug}-${i}`;
        
        // Make sure this numbered slug doesn't already exist
        let finalSlug = numberedSlug;
        let extraCounter = 1;
        
        while (true) {
          const { data: existing } = await supabase
            .from('mechanic_services')
            .select('id')
            .eq('slug', finalSlug)
            .neq('id', service.id);
          
          if (!existing || existing.length === 0) break;
          
          finalSlug = `${duplicateSlug}-${i}-${extraCounter}`;
          extraCounter++;
        }
        
        const { error: updateError } = await supabase
          .from('mechanic_services')
          .update({ slug: finalSlug })
          .eq('id', service.id);

        if (updateError) {
          console.error(`❌ Failed to fix duplicate for service ${service.id}:`, updateError);
        } else {
          console.log(`✅ Fixed duplicate: "${service.name}" → "${finalSlug}"`);
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Step 6: Final verification
    const { data: finalCheck, error: finalError } = await supabase
      .from('mechanic_services')
      .select('slug')
      .not('slug', 'is', null);

    if (finalError) {
      console.error('❌ Error during final verification:', finalError);
      return false;
    }

    const finalSlugs = finalCheck?.map(s => s.slug) || [];
    const uniqueFinalSlugs = new Set(finalSlugs);
    
    if (finalSlugs.length !== uniqueFinalSlugs.size) {
      console.warn('⚠️ Some duplicates may still exist after cleanup');
      return false;
    }

    console.log('🎉 Slug cleanup completed successfully!');
    console.log(`📊 Final stats: ${uniqueFinalSlugs.size} unique slugs`);
    console.log(`✅ All services preserved with unique slugs`);
    return true;

  } catch (error) {
    console.error('💥 Critical error during slug cleanup:', error);
    return false;
  }
}

/**
 * Function to prevent future duplicates when creating new services
 */
export async function createServiceWithUniqueSlug(serviceData: {
  name: string;
  [key: string]: any;
}): Promise<{ data: any; error: any }> {
  try {
    const baseSlug = createSlug(serviceData.name);
    const uniqueSlug = await generateUniqueSlug(baseSlug);
    
    const { data, error } = await supabase
      .from('mechanic_services')
      .insert({
        ...serviceData,
        slug: uniqueSlug
      } as any)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Function to update service name and regenerate slug if needed
 */
export async function updateServiceWithSlugCheck(
  serviceId: number, 
  updates: { name?: string; [key: string]: any }
): Promise<{ data: any; error: any }> {
  try {
    let finalUpdates = { ...updates };
    
    // If name is being updated, regenerate slug
    if (updates.name) {
      const baseSlug = createSlug(updates.name);
      const uniqueSlug = await generateUniqueSlug(baseSlug, serviceId);
      finalUpdates.slug = uniqueSlug;
    }
    
    const { data, error } = await supabase
      .from('mechanic_services')
      .update(finalUpdates)
      .eq('id', serviceId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Get preview of what will be changed without actually changing
 */
export async function previewSlugChanges(): Promise<{
  duplicateGroups: Array<{
    originalSlug: string;
    services: Array<{
      id: number;
      name: string;
      currentSlug: string;
      newSlug: string;
      willChange: boolean;
      isOldest: boolean;
    }>;
  }>;
  emptySlugServices: Array<{
    id: number;
    name: string;
    newSlug: string;
  }>;
}> {
  try {
    const { data: allServices } = await supabase
      .from('mechanic_services')
      .select('id, name, slug, created_at')
      .order('created_at', { ascending: true });

    if (!allServices) return { duplicateGroups: [], emptySlugServices: [] };

    // Find services with empty slugs
    const emptySlugServices = allServices
      .filter(service => 
        !service.slug || 
        service.slug.trim() === '' ||
        service.slug === 'undefined' ||
        service.slug === 'null'
      )
      .map(service => ({
        id: service.id,
        name: service.name,
        newSlug: createSlug(service.name)
      }));

    // Find duplicate groups
    const slugCounts: { [key: string]: any[] } = {};
    allServices
      .filter(service => service.slug && service.slug.trim() && service.slug !== 'undefined' && service.slug !== 'null')
      .forEach(service => {
        const slug = service.slug!;
        if (!slugCounts[slug]) {
          slugCounts[slug] = [];
        }
        slugCounts[slug].push(service);
      });

    const duplicateGroups = Object.entries(slugCounts)
      .filter(([_, services]) => services.length > 1)
      .map(([slug, services]) => {
        // Sort by creation date
        services.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
        return {
          originalSlug: slug,
          services: services.map((service, index) => ({
            id: service.id,
            name: service.name,
            currentSlug: service.slug,
            newSlug: index === 0 ? slug : `${slug}-${index}`,
            willChange: index !== 0,
            isOldest: index === 0
          }))
        };
      });

    return { duplicateGroups, emptySlugServices };

  } catch (error) {
    console.error('Error previewing changes:', error);
    return { duplicateGroups: [], emptySlugServices: [] };
  }
}
export async function checkForDuplicateSlugs(): Promise<string[]> {
  try {
    const { data: allSlugs, error } = await supabase
      .from('mechanic_services')
      .select('slug')
      .not('slug', 'is', null);

    if (error || !allSlugs) return [];

    const slugCounts: { [key: string]: number } = {};
    allSlugs.forEach(item => {
      const slug = item.slug!;
      slugCounts[slug] = (slugCounts[slug] || 0) + 1;
    });

    return Object.keys(slugCounts).filter(slug => slugCounts[slug] > 1);
  } catch {
    return [];
  }
}

// Export utilities for browser console
if (typeof window !== 'undefined') {
  (window as any).fixDuplicateSlugs = fixDuplicateSlugs;
  (window as any).checkForDuplicateSlugs = checkForDuplicateSlugs;
  (window as any).previewSlugChanges = previewSlugChanges;
  
  console.log(`
🔧 Enhanced Slug Management Utilities:

📋 Preview changes (see what will change before fixing):
await previewSlugChanges()

🔍 Check for duplicates:
await checkForDuplicateSlugs()

🔍 Check for any remaining duplicates:
await checkForDuplicateSlugs()

🛠️ Fix all duplicates (preserves oldest, numbers newer):
await fixDuplicateSlugs()

💡 Example:
- Original: "minebis-damuqeba" (oldest service keeps this)
- Duplicate 1: "minebis-damuqeba-1"  
- Duplicate 2: "minebis-damuqeba-2"
  `);
}