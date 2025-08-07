import { supabase } from '@/integrations/supabase/client';
import { createSlug } from './slugUtils';

/**
 * Fix all duplicate slugs in the database
 * This function should be run once to clean up existing duplicates
 */
export async function fixDuplicateSlugs() {
  console.log('🔍 Starting duplicate slug fix...');
  
  try {
    // Step 1: Get all services and find duplicate slugs
    const { data: allServices, error: allServicesError } = await supabase
      .from('mechanic_services')
      .select('id, name, slug, created_at')
      .not('slug', 'is', null)
      .order('created_at', { ascending: true });

    if (allServicesError) {
      console.error('Error getting all services:', allServicesError);
      return false;
    }

    if (!allServices || allServices.length === 0) {
      console.log('✅ No services found!');
      return true;
    }

    // Group by slug and find duplicates
    const slugGroups: { [key: string]: any[] } = {};
    allServices.forEach(service => {
      if (service.slug) {
        if (!slugGroups[service.slug]) {
          slugGroups[service.slug] = [];
        }
        slugGroups[service.slug].push(service);
      }
    });

    const duplicateSlugGroups = Object.entries(slugGroups)
      .filter(([_, services]) => services.length > 1);

    console.log(`📊 Found ${duplicateSlugGroups.length} duplicate slug groups`);
    
    if (duplicateSlugGroups.length === 0) {
      console.log('✅ No duplicates found!');
      return true;
    }

    // Step 2: Fix each duplicate group
    for (const [duplicateSlug, services] of duplicateSlugGroups) {
      console.log(`🔧 Fixing slug: ${duplicateSlug} (${services.length} services)`);
      
      // Keep first service with original slug, update others
      for (let i = 1; i < services.length; i++) {
        const service = services[i];
        const newSlug = `${duplicateSlug}-${i}`;
        
        const { error: updateError } = await supabase
          .from('mechanic_services')
          .update({ slug: newSlug })
          .eq('id', service.id);

        if (updateError) {
          console.error(`Error updating service ${service.id}:`, updateError);
        } else {
          console.log(`✅ Updated service "${service.name}" slug to: ${newSlug}`);
        }
      }
    }

    // Step 3: Fix any NULL slugs
    const { data: nullSlugServices, error: nullError } = await supabase
      .from('mechanic_services')
      .select('id, name')
      .is('slug', null);

    if (nullError) {
      console.error('Error getting null slug services:', nullError);
    } else if (nullSlugServices && nullSlugServices.length > 0) {
      console.log(`🔧 Fixing ${nullSlugServices.length} services with NULL slugs`);
      
      for (const service of nullSlugServices) {
        const baseSlug = createSlug(service.name);
        if (baseSlug) {
          // Check if this slug already exists
          let finalSlug = baseSlug;
          let counter = 1;
          
          while (true) {
            const { data: existing } = await supabase
              .from('mechanic_services')
              .select('id')
              .eq('slug', finalSlug)
              .neq('id', service.id);
            
            if (!existing || existing.length === 0) break;
            
            finalSlug = `${baseSlug}-${counter}`;
            counter++;
          }

          const { error: updateError } = await supabase
            .from('mechanic_services')
            .update({ slug: finalSlug })
            .eq('id', service.id);

          if (updateError) {
            console.error(`Error updating NULL slug for service ${service.id}:`, updateError);
          } else {
            console.log(`✅ Updated service "${service.name}" slug to: ${finalSlug}`);
          }
        }
      }
    }

    console.log('✅ Duplicate slug fix completed!');
    return true;
  } catch (error) {
    console.error('❌ Error fixing duplicate slugs:', error);
    return false;
  }
}

/**
 * Run this in browser console to fix duplicates:
 * window.fixDuplicateSlugs()
 */
if (typeof window !== 'undefined') {
  (window as any).fixDuplicateSlugs = fixDuplicateSlugs;
}
