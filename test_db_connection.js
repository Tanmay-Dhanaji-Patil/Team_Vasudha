// Test script to verify database connection and table creation
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://aundcwgdakyttydeqbca.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bmRjd2dkYWt5dHR5ZGVxYmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTcxNTQsImV4cCI6MjA3NDk5MzE1NH0.3Oe6OmH6tQOOPh5Il9cmGPEzmgeM1_WTTPSvveITXb8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase database connection...');
  
  try {
    // Test basic connection
    const { data, error, count } = await supabase
      .from('Farmer Data')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful!');
    console.log(`📊 Users table exists with ${count} records`);
    
    // Test demo user
    const { data: demoUser, error: demoError } = await supabase
      .from('Farmer Data')
      .select('Farmer_name, Farmer_email, Phone_number, password, location')
      .eq('Farmer_email', 'crop@demo.com')
      .single();
    
    if (demoError) {
      console.log('⚠️  Demo user not found. You may need to create it manually.');
    } else {
      console.log('✅ Demo user found:', demoUser);
    }
    
    return true;
  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
    return false;
  }
}

// Run the test
testDatabaseConnection().then(success => {
  if (success) {
    console.log('\n🎉 Database is ready for authentication!');
    console.log('📋 Next steps:');
    console.log('   1. Install dependencies: npm install bcryptjs');
    console.log('   2. Start dev server: npm run dev');
    console.log('   3. Test registration and login');
  } else {
    console.log('\n❌ Please check your database setup.');
  }
});