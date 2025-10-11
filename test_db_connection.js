// Test script to verify database connection and table creation
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase configuration from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
      .select('Farmer_name, Farmer_email, username')
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
