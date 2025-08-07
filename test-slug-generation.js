// Test script to verify slug generation functionality
import { createClient } from '@supabase/supabase-js';

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSlugGeneration() {
  console.log('🧪 Testing slug generation...');
  
  // Test 1: Generate unique slug for Georgian text
  try {
    const { data, error } = await supabase.rpc('generate_unique_slug', {
      base_name: 'ძრავის დიაგნოსტიკა'
    });
    
    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Generated slug for "ძრავის დიაგნოსტიკა":', data);
    }
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
  
  // Test 2: Test duplicate handling
  try {
    const { data: slug1, error: error1 } = await supabase.rpc('generate_unique_slug', {
      base_name: 'ტესტი სერვისი'
    });
    
    const { data: slug2, error: error2 } = await supabase.rpc('generate_unique_slug', {
      base_name: 'ტესტი სერვისი'
    });
    
    if (error1 || error2) {
      console.error('❌ Error in duplicate test:', error1 || error2);
    } else {
      console.log('✅ First slug:', slug1);
      console.log('✅ Second slug (should be different):', slug2);
    }
  } catch (err) {
    console.error('❌ Duplicate test failed:', err);
  }
}

// Run the test
testSlugGeneration();