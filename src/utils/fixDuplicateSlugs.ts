import { supabase } from '@/integrations/supabase/client';

// Georgian to Latin transliteration
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
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * NUCLEAR OPTION: Complete slug rebuild
 * This rebuilds ALL slugs from scratch with guaranteed uniqueness
 */
export async function fixDuplicateSlugs() {
  console.log('🚀 Starting COMPLETE slug rebuild...');
  console.log('⚠️ This will rebuild ALL slugs to ensure 100% uniqueness');
  
  try {
    // Step 1: Get ALL services ordered by creation date (oldest first)
    const { data: allServices, error } = await supabase
      .from('mechanic_services')
      .select('id, name, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Database error:', error);
      return false;
    }

    if (!allServices || allServices.length === 0) {
      console.log('✅ No services found');
      return true;
    }

    console.log(`📊 Found ${allServices.length} services to process`);

    // Step 2: Create a map to track used slugs
    const usedSlugs = new Set<string>();
    const updates: Array<{id: number, oldName: string, newSlug: string}> = [];

    // Step 3: Generate unique slug for each service
    for (const service of allServices) {
      const baseName = service.name || `service-${service.id}`;
      console.log(`🔧 Processing: "${baseName}" (ID: ${service.id})`);
      
      // Create base slug
      let baseSlug = createSlug(baseName);
      if (!baseSlug) {
        baseSlug = `service-${service.id}`;
      }
      
      // Find unique variant
      let finalSlug = baseSlug;
      let counter = 1;
      
      while (usedSlugs.has(finalSlug)) {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
        
        // Safety: prevent infinite loops
        if (counter > 1000) {
          finalSlug = `${baseSlug}-${Date.now()}`;
          break;
        }
      }
      
      // Mark as used
      usedSlugs.add(finalSlug);
      updates.push({
        id: service.id,
        oldName: baseName,
        newSlug: finalSlug
      });
      
      console.log(`✅ Assigned: "${baseName}" → "${finalSlug}"`);
    }

    console.log(`🔄 Ready to update ${updates.length} services...`);

    // Step 4: Apply all updates
    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('mechanic_services')
        .update({ slug: update.newSlug })
        .eq('id', update.id);

      if (updateError) {
        console.error(`❌ Failed to update ${update.id}:`, updateError);
        errorCount++;
      } else {
        successCount++;
      }
      
      // Small delay to avoid overwhelming DB
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`📊 Update Results:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    // Step 5: Final verification
    console.log('🔍 Running final verification...');
    
    const { data: finalCheck } = await supabase
      .from('mechanic_services')
      .select('slug')
      .not('slug', 'is', null);

    if (finalCheck) {
      const finalSlugs = finalCheck.map(s => s.slug!);
      const uniqueSlugs = new Set(finalSlugs);
      
      if (finalSlugs.length === uniqueSlugs.size) {
        console.log('🎉 SUCCESS! All slugs are now unique!');
        console.log(`📈 Total: ${finalSlugs.length} services, ${uniqueSlugs.size} unique slugs`);
        return true;
      } else {
        console.error('❌ Still found duplicates after rebuild!');
        return false;
      }
    }

    return successCount > 0 && errorCount === 0;

  } catch (error) {
    console.error('💥 Critical error:', error);
    return false;
  }
}

/**
 * Check current duplicate status
 */
export async function checkDuplicates() {
  console.log('🔍 Checking for duplicate slugs...');
  
  try {
    const { data: allSlugs } = await supabase
      .from('mechanic_services')
      .select('id, name, slug')
      .not('slug', 'is', null);

    if (!allSlugs) {
      console.log('❌ Could not fetch slugs');
      return;
    }

    // Count occurrences
    const slugCount: { [key: string]: Array<{id: number, name: string}> } = {};
    
    allSlugs.forEach(service => {
      const slug = service.slug!;
      if (!slugCount[slug]) {
        slugCount[slug] = [];
      }
      slugCount[slug].push({id: service.id, name: service.name});
    });

    // Find duplicates
    const duplicates = Object.entries(slugCount)
      .filter(([_, services]) => services.length > 1);

    if (duplicates.length === 0) {
      console.log('✅ No duplicate slugs found!');
      console.log(`📊 Total services: ${allSlugs.length}`);
    } else {
      console.log(`⚠️ Found ${duplicates.length} duplicate slug(s):`);
      duplicates.forEach(([slug, services]) => {
        console.log(`  📌 "${slug}" → ${services.length} services:`);
        services.forEach(service => {
          console.log(`     - ID: ${service.id}, Name: "${service.name}"`);
        });
      });
      
      console.log(`\n🔧 Run fixDuplicateSlugs() to fix these duplicates`);
    }

  } catch (error) {
    console.error('❌ Error checking duplicates:', error);
  }
}

/**
 * Preview what changes will be made (without applying them)
 */
export async function previewChanges() {
  console.log('👁️ Previewing slug changes...');
  
  try {
    const { data: allServices } = await supabase
      .from('mechanic_services')
      .select('id, name, slug, created_at')
      .order('created_at', { ascending: true });

    if (!allServices) {
      console.log('❌ Could not fetch services');
      return;
    }

    const usedSlugs = new Set<string>();
    const changes: Array<{
      id: number,
      name: string, 
      currentSlug: string | null,
      newSlug: string,
      willChange: boolean
    }> = [];

    for (const service of allServices) {
      const currentSlug = service.slug;
      const baseName = service.name || `service-${service.id}`;
      
      let baseSlug = createSlug(baseName);
      if (!baseSlug) {
        baseSlug = `service-${service.id}`;
      }
      
      let finalSlug = baseSlug;
      let counter = 1;
      
      while (usedSlugs.has(finalSlug)) {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
        if (counter > 1000) {
          finalSlug = `${baseSlug}-${Date.now()}`;
          break;
        }
      }
      
      usedSlugs.add(finalSlug);
      
      changes.push({
        id: service.id,
        name: baseName,
        currentSlug,
        newSlug: finalSlug,
        willChange: currentSlug !== finalSlug
      });
    }

    const willChangeCount = changes.filter(c => c.willChange).length;
    
    console.log(`📊 Preview Results:`);
    console.log(`   Total services: ${changes.length}`);
    console.log(`   Will change: ${willChangeCount}`);
    console.log(`   Will stay same: ${changes.length - willChangeCount}`);
    
    if (willChangeCount > 0) {
      console.log(`\n🔄 Services that will change:`);
      changes.filter(c => c.willChange).forEach(change => {
        console.log(`   "${change.name}": "${change.currentSlug}" → "${change.newSlug}"`);
      });
    }

  } catch (error) {
    console.error('❌ Error previewing changes:', error);
  }
}

// Browser console setup
if (typeof window !== 'undefined') {
  (window as any).fixDuplicateSlugs = fixDuplicateSlugs;
  (window as any).checkDuplicates = checkDuplicates;
  (window as any).previewChanges = previewChanges;
  
  console.log(`
🔧 NUCLEAR SLUG FIXER - Ready to use!

Commands:
  checkDuplicates()     - See current duplicate status
  previewChanges()      - See what will change (safe preview)  
  fixDuplicateSlugs()   - REBUILD ALL SLUGS (nuclear option)

⚠️ WARNING: fixDuplicateSlugs() will rebuild ALL slugs from scratch!
This ensures 100% uniqueness but changes existing URLs.

🎯 Process:
1. Gets ALL services ordered by creation date
2. Rebuilds slug for each service in order
3. Oldest services get priority for shorter slugs  
4. Newer services get numbered suffixes
5. 100% guaranteed unique results

💡 Safe workflow:
1. checkDuplicates() - see current problems
2. previewChanges() - see what will change  
3. fixDuplicateSlugs() - apply the fix
4. checkDuplicates() - verify success
  `);
}