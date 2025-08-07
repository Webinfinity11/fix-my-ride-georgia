import { supabase } from '@/integrations/supabase/client';

// Improved slug creation function
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

// Generate truly unique slug by checking database
async function generateUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
  if (!baseSlug) return `service-${Date.now()}`;
  
  let counter = 0;
  let finalSlug = baseSlug;
  
  while (true) {
    // Check if this exact slug exists
    const { data: existing, error } = await supabase
      .from('mechanic_services')
      .select('id')
      .eq('slug', finalSlug);
    
    if (error) {
      console.error('Error checking slug existence:', error);
      // Fallback: add timestamp to ensure uniqueness
      return `${baseSlug}-${Date.now()}`;
    }
    
    // If no existing records, or only our own record (when updating)
    const conflicts = existing?.filter(record => record.id !== excludeId) || [];
    if (conflicts.length === 0) {
      return finalSlug;
    }
    
    // Generate next variant
    counter++;
    finalSlug = `${baseSlug}-${counter}`;
    
    // Safety check to prevent infinite loop
    if (counter > 999) {
      return `${baseSlug}-${Date.now()}`;
    }
  }
}

/**
 * Enhanced function to fix all duplicate slugs
 * This version ensures NO new duplicates are created
 */
export async function fixDuplicateSlugs() {
  console.log('🔍 Starting comprehensive duplicate slug fix...');
  
  try {
    // Step 1: Get all services ordered by creation date (oldest first)
    const { data: allServices, error: allServicesError } = await supabase
      .from('mechanic_services')
      .select('id, name, slug, created_at')
      .order('created_at', { ascending: true });

    if (allServicesError) {
      console.error('❌ Error getting all services:', allServicesError);
      return false;
    }

    if (!allServices || allServices.length === 0) {
      console.log('✅ No services found in database!');
      return true;
    }

    console.log(`📊 Processing ${allServices.length} total services...`);

    // Step 2: Handle services with missing/invalid slugs first
    const servicesWithBadSlugs = allServices.filter(service => 
      !service.slug || 
      service.slug.trim() === '' ||
      service.slug === 'undefined' ||
      service.slug === 'null'
    );

    console.log(`🛠️ Found ${servicesWithBadSlugs.length} services with missing/invalid slugs`);

    for (const service of servicesWithBadSlugs) {
      console.log(`🔧 Generating slug for: "${service.name}" (ID: ${service.id})`);
      
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
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Step 3: Re-fetch all services after fixing empty slugs
    const { data: updatedServices, error: refetchError } = await supabase
      .from('mechanic_services')
      .select('id, name, slug, created_at')
      .not('slug', 'is', null)
      .order('created_at', { ascending: true });

    if (refetchError || !updatedServices) {
      console.error('❌ Error re-fetching services:', refetchError);
      return false;
    }

    // Step 4: Group by slug and identify duplicates
    const slugGroups: { [key: string]: any[] } = {};
    updatedServices.forEach(service => {
      const slug = service.slug!.trim();
      if (slug && slug !== 'undefined' && slug !== 'null') {
        if (!slugGroups[slug]) {
          slugGroups[slug] = [];
        }
        slugGroups[slug].push(service);
      }
    });

    const duplicateGroups = Object.entries(slugGroups)
      .filter(([_, services]) => services.length > 1);

    console.log(`🔄 Found ${duplicateGroups.length} duplicate slug groups`);

    if (duplicateGroups.length === 0) {
      console.log('🎉 No duplicates found! All slugs are unique.');
      return true;
    }

    // Step 5: Fix duplicates (keep oldest, number the rest)
    for (const [duplicateSlug, services] of duplicateGroups) {
      console.log(`🔧 Fixing duplicate slug: "${duplicateSlug}" (${services.length} services)`);
      
      // Sort by creation date - oldest first
      services.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      console.log(`👑 Keeping original slug for oldest: "${services[0].name}" (${services[0].created_at})`);
      
      // Process duplicates (skip the first/oldest one)
      for (let i = 1; i < services.length; i++) {
        const service = services[i];
        
        // Generate a unique slug for this duplicate
        const uniqueSlug = await generateUniqueSlug(duplicateSlug, service.id);
        
        const { error: updateError } = await supabase
          .from('mechanic_services')
          .update({ slug: uniqueSlug })
          .eq('id', service.id);

        if (updateError) {
          console.error(`❌ Failed to fix duplicate for service ${service.id}:`, updateError);
        } else {
          console.log(`✅ Fixed duplicate #${i}: "${service.name}" → "${uniqueSlug}"`);
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Step 6: Final verification - check for any remaining duplicates
    console.log('🔍 Running final verification...');
    
    const { data: finalCheck, error: finalError } = await supabase
      .from('mechanic_services')
      .select('slug')
      .not('slug', 'is', null);

    if (finalError) {
      console.error('❌ Error during final verification:', finalError);
      return false;
    }

    const allFinalSlugs = finalCheck?.map(s => s.slug) || [];
    const uniqueFinalSlugs = new Set(allFinalSlugs);
    
    if (allFinalSlugs.length !== uniqueFinalSlugs.size) {
      console.error('⚠️ Warning: Some duplicates may still exist after cleanup!');
      
      // Show remaining duplicates
      const slugCounts: { [key: string]: number } = {};
      allFinalSlugs.forEach(slug => {
        slugCounts[slug!] = (slugCounts[slug!] || 0) + 1;
      });
      
      const stillDuplicates = Object.entries(slugCounts)
        .filter(([_, count]) => count > 1)
        .map(([slug, count]) => `${slug} (${count})`);
      
      console.error('Remaining duplicates:', stillDuplicates.join(', '));
      return false;
    }

    console.log('🎉 SUCCESS! All slugs are now unique!');
    console.log(`📊 Final stats: ${uniqueFinalSlugs.size} unique slugs across ${allFinalSlugs.length} services`);
    console.log('✅ No services were deleted - all preserved with unique identifiers');
    
    return true;

  } catch (error) {
    console.error('💥 Critical error during slug cleanup:', error);
    return false;
  }
}

/**
 * Quick check function to see current duplicate status
 */
export async function checkDuplicateStatus() {
  try {
    const { data: allSlugs } = await supabase
      .from('mechanic_services')
      .select('slug, name, id')
      .not('slug', 'is', null);

    if (!allSlugs) return;

    const slugCounts: { [key: string]: any[] } = {};
    allSlugs.forEach(service => {
      const slug = service.slug!;
      if (!slugCounts[slug]) {
        slugCounts[slug] = [];
      }
      slugCounts[slug].push(service);
    });

    const duplicates = Object.entries(slugCounts)
      .filter(([_, services]) => services.length > 1);

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
    } else {
      console.log(`⚠️ Found ${duplicates.length} duplicate slugs:`);
      duplicates.forEach(([slug, services]) => {
        console.log(`  "${slug}": ${services.length} services`);
        services.forEach(service => {
          console.log(`    - ${service.name} (ID: ${service.id})`);
        });
      });
    }

    return duplicates;
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return null;
  }
}

/**
 * Browser console utilities
 */
if (typeof window !== 'undefined') {
  (window as any).fixDuplicateSlugs = fixDuplicateSlugs;
  (window as any).checkDuplicateStatus = checkDuplicateStatus;
  
  console.log(`
🔧 Enhanced Slug Management Utilities Loaded!

📋 Commands:
  await checkDuplicateStatus()  - See current duplicate status
  await fixDuplicateSlugs()     - Fix all duplicates (safe, no deletions)

🎯 What this does:
  1. Keeps oldest service with original slug unchanged
  2. Adds unique numbers to newer duplicates (-1, -2, etc.)
  3. Handles NULL/empty slugs
  4. Verifies no new duplicates are created
  5. 100% safe - no data loss

Example output:
  "minebis-damuqeba" (oldest) → stays "minebis-damuqeba"
  "minebis-damuqeba" (newer)  → becomes "minebis-damuqeba-1"  
  "minebis-damuqeba" (newest) → becomes "minebis-damuqeba-2"
  `);
}