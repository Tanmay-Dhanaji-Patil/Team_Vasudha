// Enhanced debug script to check all column types
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTableStructure() {
  console.log('🔍 Checking table structure...');
  
  try {
    // Try different field combinations to identify which field is causing the UUID error
    
    console.log('\n1️⃣ Testing with just name and email:');
    const test1 = await supabase
      .from('Farmer Data')
      .insert([{
        Farmer_name: 'Test User 1',
        Farmer_email: 'test1@example.com'
      }])
      .select();
    
    if (test1.error) {
      console.log('❌', test1.error.message);
    } else {
      console.log('✅ Success with basic fields');
      // Clean up
      if (test1.data && test1.data[0]) {
        await supabase.from('Farmer Data').delete().eq('id', test1.data[0].id);
      }
    }
    
    console.log('\n2️⃣ Testing with name, email, and phone:');
    const test2 = await supabase
      .from('Farmer Data')
      .insert([{
        Farmer_name: 'Test User 2',
        Farmer_email: 'test2@example.com',
        Phone_number: '1234567890'
      }])
      .select();
    
    if (test2.error) {
      console.log('❌', test2.error.message);
    } else {
      console.log('✅ Success with phone number');
      // Clean up
      if (test2.data && test2.data[0]) {
        await supabase.from('Farmer Data').delete().eq('id', test2.data[0].id);
      }
    }
    
    console.log('\n3️⃣ Testing with name, email, phone, and location:');
    const test3 = await supabase
      .from('Farmer Data')
      .insert([{
        Farmer_name: 'Test User 3',
        Farmer_email: 'test3@example.com',
        Phone_number: '1234567890',
        location: 'Test Location'
      }])
      .select();
    
    if (test3.error) {
      console.log('❌', test3.error.message);
    } else {
      console.log('✅ Success with location');
      // Clean up
      if (test3.data && test3.data[0]) {
        await supabase.from('Farmer Data').delete().eq('id', test3.data[0].id);
      }
    }
    
    console.log('\n4️⃣ Testing with password field:');
    const test4 = await supabase
      .from('Farmer Data')
      .insert([{
        Farmer_name: 'Test User 4',
        Farmer_email: 'test4@example.com',
        Phone_number: '1234567890',
        location: 'Test Location',
        password: 'simplepassword'
      }])
      .select();
    
    if (test4.error) {
      console.log('❌', test4.error.message);
      console.log('🔍 This confirms the password field is the problem');
    } else {
      console.log('✅ Success with password - this would be unexpected!');
      // Clean up
      if (test4.data && test4.data[0]) {
        await supabase.from('Farmer Data').delete().eq('id', test4.data[0].id);
      }
    }
    
  } catch (err) {
    console.error('❌ Debug failed:', err);
  }
}

checkTableStructure();
