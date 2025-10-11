// Debug script to check the exact table schema
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://aundcwgdakyttydeqbca.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bmRjd2dkYWt5dHR5ZGVxYmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTcxNTQsImV4cCI6MjA3NDk5MzE1NH0.3Oe6OmH6tQOOPh5Il9cmGPEzmgeM1_WTTPSvveITXb8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugSchema() {
  console.log('🔍 Debugging table schema...');
  
  try {
    // Try to insert a minimal record to see what fields are required
    const testData = {
      Farmer_name: 'Test User',
      Farmer_email: 'test@example.com',
      Phone_number: '1234567890',
      password: 'testpassword',
      location: 'Test Location'
    };
    
    console.log('📝 Attempting insert with data:', testData);
    
    const { data, error } = await supabase
      .from('Farmer Data')
      .insert([testData])
      .select();
    
    if (error) {
      console.error('❌ Insert failed:', error);
      console.log('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Insert successful:', data);
      
      // Clean up the test record
      if (data && data[0] && data[0].id) {
        await supabase
          .from('Farmer Data')
          .delete()
          .eq('id', data[0].id);
        console.log('🧹 Test record cleaned up');
      }
    }
    
  } catch (err) {
    console.error('❌ Debug failed:', err);
  }
}

debugSchema();