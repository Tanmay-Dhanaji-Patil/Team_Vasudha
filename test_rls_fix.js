// Test script to verify RLS fix
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://aundcwgdakyttydeqbca.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bmRjd2dkYWt5dHR5ZGVxYmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTcxNTQsImV4cCI6MjA3NDk5MzE1NH0.3Oe6OmH6tQOOPh5Il9cmGPEzmgeM1_WTTPSvveITXb8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRegistration() {
  console.log('🧪 Testing registration after RLS fix...');
  
  try {
    const testData = {
      Farmer_name: 'Test User',
      Farmer_email: `test${Date.now()}@example.com`, // Unique email
      Phone_number: '1234567890',
      password: '$2a$10$test.hash.password.string.example',
      location: 'Test Farm Location'
    };
    
    console.log('📝 Attempting registration with:', {
      ...testData,
      password: '[HASHED PASSWORD]'
    });
    
    const { data, error } = await supabase
      .from('Farmer Data')
      .insert([testData])
      .select('id, Farmer_name, Farmer_email, Phone_number, location, created_at');
    
    if (error) {
      console.error('❌ Registration failed:', error);
      return false;
    } else {
      console.log('✅ Registration successful!');
      console.log('📊 User created:', data);
      
      // Clean up test user
      if (data && data[0] && data[0].id) {
        await supabase
          .from('Farmer Data')
          .delete()
          .eq('id', data[0].id);
        console.log('🧹 Test user cleaned up');
      }
      
      return true;
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err);
    return false;
  }
}

testRegistration().then(success => {
  if (success) {
    console.log('\n🎉 Registration is now working! You can test it in your app.');
  } else {
    console.log('\n⚠️  There are still issues. Check the Supabase dashboard.');
  }
});