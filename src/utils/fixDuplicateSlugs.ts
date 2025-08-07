import { supabase } from '@/integrations/supabase/client';

/**
 * STEP BY STEP DEBUG VERSION
 * Let's see exactly what's happening
 */
export async function fixDuplicateSlugs() {
  console.log('🔍 Starting DEBUG slug fix...');
  
  try {
    // Step 1: Test database connection
    console.log('📡 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('mechanic_services')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return false;
    }
    console.log('✅ Database connection OK');

    // Step 2: Get all services
    console.log('📋 Fetching all services...');
    const { data: allServices, error: fetchError } = await supabase
      .from('mechanic_services')
      .select('id, name, slug')
      .order('id', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching services:', fetchError);
      return false;
    }

    if (!allServices || allServices.length === 0) {
      console.log('⚠️ No services found in database');
      return true;
    }

    console.log(`📊 Found ${allServices.length} services`);
    
    // Step 3: Show first few services for debugging
    console.log('🔍 First 5 services:');
    allServices.slice(0, 5).forEach((service, index) => {
      console.log(`  ${index + 1}. ID: ${service.id}, Name: "${service.name}", Slug: "${service.slug}"`);
    });

    // Step 4: Find duplicates manually
    console.log('🔍 Analyzing duplicates...');
    const slugMap = new Map();
    
    allServices.forEach(service => {
      if (service.slug) {
        if (slugMap.has(service.slug)) {
          slugMap.get(service.slug).push(service);
        } else {
          slugMap.set(service.slug, [service]);
        }
      }
    });

    const duplicates = Array.from(slugMap.entries()).filter(([_, services]) => services.length > 1);
    
    console.log(`📊 Found ${duplicates.length} duplicate groups:`);
    duplicates.forEach(([slug, services]) => {
      console.log(`  "${slug}": ${services.length} services`);
      services.forEach((service, idx) => {
        console.log(`    ${idx + 1}. ID: ${service.id}, Name: "${service.name}"`);
      });
    });

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
      return true;
    }

    // Step 5: Fix ONE duplicate group at a time
    for (const [duplicateSlug, services] of duplicates) {
      console.log(`\n🔧 Fixing slug: "${duplicateSlug}" (${services.length} services)`);
      
      // Keep first one unchanged, number the rest
      for (let i = 1; i < services.length; i++) {
        const service = services[i];
        const newSlug = `${duplicateSlug}-${i}`;
        
        console.log(`  📝 Updating service ${service.id}: "${service.name}" → "${newSlug}"`);
        
        // Try to update
        const { error: updateError } = await supabase
          .from('mechanic_services')
          .update({ slug: newSlug })
          .eq('id', service.id);

        if (updateError) {
          console.error(`  ❌ Update failed for service ${service.id}:`, updateError);
          
          // Show detailed error info
          console.error('  🔍 Error details:', {
            code: updateError.code,
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint
          });
          
          return false;
        } else {
          console.log(`  ✅ Successfully updated service ${service.id}`);
        }
        
        // Wait a bit between updates
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Step 6: Final check
    console.log('\n🔍 Final verification...');
    const { data: finalServices } = await supabase
      .from('mechanic_services')
      .select('slug');

    if (finalServices) {
      const finalSlugs = finalServices.map(s => s.slug).filter(Boolean);
      const uniqueSlugs = new Set(finalSlugs);
      
      if (finalSlugs.length === uniqueSlugs.size) {
        console.log('🎉 SUCCESS! All slugs are now unique!');
        console.log(`📊 Total: ${finalSlugs.length} unique slugs`);
        return true;
      } else {
        console.log('⚠️ Some duplicates still remain');
        return false;
      }
    }

    return false;

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    console.error('🔍 Error stack:', error.stack);
    return false;
  }
}

/**
 * Simple duplicate checker
 */
export async function showDuplicates() {
  console.log('🔍 Checking for duplicates...');
  
  try {
    const { data: services, error } = await supabase
      .from('mechanic_services')
      .select('id, name, slug');

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    if (!services) {
      console.log('⚠️ No services found');
      return;
    }

    console.log(`📊 Total services: ${services.length}`);

    const slugCount = {};
    services.forEach(service => {
      if (service.slug) {
        slugCount[service.slug] = (slugCount[service.slug] || 0) + 1;
      }
    });

    const duplicateSlugNames = Object.keys(slugCount).filter(slug => slugCount[slug] > 1);

    if (duplicateSlugNames.length === 0) {
      console.log('✅ No duplicate slugs found!');
    } else {
      console.log(`⚠️ Found ${duplicateSlugNames.length} duplicate slugs:`);
      duplicateSlugNames.forEach(slug => {
        console.log(`  "${slug}": appears ${slugCount[slug]} times`);
        
        // Show which services have this slug
        const servicesWithSlug = services.filter(s => s.slug === slug);
        servicesWithSlug.forEach((service, idx) => {
          console.log(`    ${idx + 1}. ID: ${service.id}, Name: "${service.name}"`);
        });
      });
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

/**
 * Test basic database operations
 */
export async function testDatabase() {
  console.log('🧪 Testing database operations...');
  
  try {
    // Test 1: Can we read data?
    console.log('📖 Test 1: Reading data...');
    const { data: readData, error: readError } = await supabase
      .from('mechanic_services')
      .select('id, name, slug')
      .limit(3);

    if (readError) {
      console.error('❌ Read failed:', readError);
      return false;
    }

    console.log('✅ Read success:', readData);

    if (!readData || readData.length === 0) {
      console.log('⚠️ No data found in table');
      return false;
    }

    // Test 2: Can we update data?
    const firstService = readData[0];
    const testSlug = `test-${Date.now()}`;
    
    console.log(`✏️ Test 2: Updating service ${firstService.id} slug to "${testSlug}"`);
    
    const { error: updateError } = await supabase
      .from('mechanic_services')
      .update({ slug: testSlug })
      .eq('id', firstService.id);

    if (updateError) {
      console.error('❌ Update failed:', updateError);
      return false;
    }

    console.log('✅ Update success');

    // Test 3: Verify update worked
    console.log('🔍 Test 3: Verifying update...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('mechanic_services')
      .select('slug')
      .eq('id', firstService.id)
      .single();

    if (verifyError) {
      console.error('❌ Verify failed:', verifyError);
      return false;
    }

    if (verifyData.slug === testSlug) {
      console.log('✅ Verify success - update worked!');
      
      // Restore original slug
      await supabase
        .from('mechanic_services')
        .update({ slug: firstService.slug })
        .eq('id', firstService.id);
      
      return true;
    } else {
      console.error('❌ Verify failed - slug not updated');
      return false;
    }

  } catch (error) {
    console.error('💥 Test error:', error);
    return false;
  }
}

// Browser console utilities
if (typeof window !== 'undefined') {
  (window as any).fixDuplicateSlugs = fixDuplicateSlugs;
  (window as any).showDuplicates = showDuplicates;
  (window as any).testDatabase = testDatabase;
  
  console.log(`
🔧 DEBUG SLUG FIXER v3.0

🧪 Run these commands in order:

1. testDatabase()      - Test if database operations work
2. showDuplicates()    - See current duplicate status  
3. fixDuplicateSlugs() - Try to fix duplicates (with detailed logging)

This version shows EXACTLY what's happening at each step.
If it fails, you'll see detailed error information.
  `);
}