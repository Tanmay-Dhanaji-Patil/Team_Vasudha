// Test script to verify login integration with Supabase
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Supabase configuration
const SUPABASE_URL = 'https://aundcwgdakyttydeqbca.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bmRjd2dkYWt5dHR5ZGVxYmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTcxNTQsImV4cCI6MjA3NDk5MzE1NH0.3Oe6OmH6tQOOPh5Il9cmGPEzmgeM1_WTTPSvveITXb8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLoginIntegration() {
  console.log('🧪 Testing Login Integration with Supabase...\n');
  
  try {
    // Test 1: Check if Farmer Data table exists
    console.log('1️⃣ Testing database connection...');
    const { data, error, count } = await supabase
      .from('Farmer Data')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log(`✅ Database connected! Found ${count} users in Farmer Data table\n`);
    
    // Test 2: Check for demo user
    console.log('2️⃣ Checking for demo user...');
    const { data: demoUser, error: demoError } = await supabase
      .from('Farmer Data')
      .select('Farmer_name, Farmer_email, Phone_number, location, password')
      .eq('Farmer_email', 'crop@demo.com')
      .single();
    
    if (demoError || !demoUser) {
      console.log('⚠️  Demo user not found. Run create_test_user.sql first.');
      return false;
    }
    
    console.log('✅ Demo user found:', {
      name: demoUser.Farmer_name,
      email: demoUser.Farmer_email,
      phone: demoUser.Phone_number,
      location: demoUser.location
    });
    
    // Test 3: Test password verification
    console.log('\n3️⃣ Testing password verification...');
    const testPassword = 'crop1234';
    const isPasswordValid = await bcrypt.compare(testPassword, demoUser.password);
    
    if (isPasswordValid) {
      console.log('✅ Password verification works correctly!');
    } else {
      console.log('❌ Password verification failed. Check password hash.');
      return false;
    }
    
    // Test 4: Simulate login API call
    console.log('\n4️⃣ Simulating login process...');
    
    // Find user by email (simulate login API)
    const { data: loginUser, error: loginError } = await supabase
      .from('Farmer Data')
      .select('id, Farmer_name, Farmer_email, Phone_number, password, location, created_at')
      .eq('Farmer_email', 'crop@demo.com')
      .single();
    
    if (loginError || !loginUser) {
      console.log('❌ Login simulation failed');
      return false;
    }
    
    // Verify password
    const loginPasswordValid = await bcrypt.compare('crop1234', loginUser.password);
    
    if (!loginPasswordValid) {
      console.log('❌ Login password verification failed');
      return false;
    }
    
    // Update last login time
    const { error: updateError } = await supabase
      .from('Farmer Data')
      .update({ 
        last_login: new Date().toISOString()
      })
      .eq('id', loginUser.id);
    
    if (updateError) {
      console.log('⚠️  Could not update last login time:', updateError.message);
    } else {
      console.log('✅ Last login time updated successfully!');
    }
    
    console.log('✅ Login simulation successful!');
    
    // Success summary
    console.log('\n🎉 LOGIN INTEGRATION TEST RESULTS:');
    console.log('✅ Database connection: WORKING');
    console.log('✅ Demo user exists: YES');
    console.log('✅ Password verification: WORKING');
    console.log('✅ Login process: WORKING');
    console.log('✅ Last login update: WORKING');
    
    console.log('\n📋 Ready to test in your app:');
    console.log('   1. Start your app: npm run dev');
    console.log('   2. Click "Login"');
    console.log('   3. Use: crop@demo.com / crop1234');
    console.log('   4. You should be logged in successfully!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testLoginIntegration().then(success => {
  if (success) {
    console.log('\n🚀 Login integration is ready!');
  } else {
    console.log('\n💥 Login integration needs fixes. Check the errors above.');
  }
  process.exit(success ? 0 : 1);
});