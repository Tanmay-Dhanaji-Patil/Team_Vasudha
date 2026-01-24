// Test script to verify the appointment API fix
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAppointmentAPI() {
  console.log('🧪 Testing Appointment API fix...');
  
  try {
    // First, let's check if we have any farmer data to use
    console.log('\n1️⃣ Checking for existing farmers:');
    const { data: farmers, error: farmersError } = await supabase
      .from('Farmer Data')
      .select('*')
      .limit(1);
    
    if (farmersError) {
      console.log('❌ Error fetching farmers:', farmersError);
      return;
    }
    
    if (!farmers || farmers.length === 0) {
      console.log('⚠️  No farmers found in database. Creating a test farmer...');
      
      const { data: newFarmer, error: createError } = await supabase
        .from('Farmer Data')
        .insert([{
          Farmer_name: 'Test Farmer',
          Farmer_email: 'test@farmer.com',
          Phone_number: '1234567890',
          location: 'Test Location'
        }])
        .select()
        .single();
      
      if (createError) {
        console.log('❌ Error creating test farmer:', createError);
        return;
      }
      
      console.log('✅ Test farmer created:', newFarmer);
      farmers[0] = newFarmer;
    }
    
    const testFarmer = farmers[0];
    console.log('🧑‍🌾 Using farmer:', testFarmer.Farmer_name, '(ID:', testFarmer.id, ')');
    
    // Check for plot details
    console.log('\n2️⃣ Checking for plot details:');
    const { data: plots, error: plotsError } = await supabase
      .from('Plot Details')
      .select('*')
      .eq('Owner ID', testFarmer.id)
      .limit(1);
    
    if (plotsError) {
      console.log('❌ Error fetching plots:', plotsError);
      return;
    }
    
    if (!plots || plots.length === 0) {
      console.log('⚠️  No plots found. Creating a test plot...');
      
      const { data: newPlot, error: plotCreateError } = await supabase
        .from('Plot Details')
        .insert([{
          'Owner ID': testFarmer.id,
          'Plot Number': 'TEST001',
          'Plot Area': '10 acres',
          'Location': 'Test Field'
        }])
        .select()
        .single();
      
      if (plotCreateError) {
        console.log('❌ Error creating test plot:', plotCreateError);
        return;  
      }
      
      console.log('✅ Test plot created:', newPlot);
      plots[0] = newPlot;
    }
    
    const testPlot = plots[0];
    console.log('🌾 Using plot:', testPlot['Plot Number'], '(Area:', testPlot['Plot Area'], ')');
    
    // Now test the appointment creation
    console.log('\n3️⃣ Testing appointment creation:');
    
    const testAppointment = {
      farmerId: testFarmer.id,
      plotNumber: testPlot['Plot Number'],
      appointmentDate: '2024-12-01',
      appointmentTime: '10:00:00'
    };
    
    console.log('📋 Test appointment data:', testAppointment);
    
    // Simulate the API call
    const { data: newAppointment, error: appointmentError } = await supabase
      .from('Appointment')
      .insert([{
        "Farmer Id": testAppointment.farmerId,
        "Plot ID": testPlot.id,
        "Plot Area": testPlot['Area of Plot'] || null,
        "Appointment Date": testAppointment.appointmentDate,
        "Appointment Time": testAppointment.appointmentTime
      }])
      .select('*')
      .single();
    
    if (appointmentError) {
      console.log('❌ Appointment creation failed:', appointmentError);
    } else {
      console.log('✅ Appointment created successfully!');
      console.log('📅 Appointment details:', newAppointment);
      
      // Clean up the test appointment
      console.log('\n4️⃣ Cleaning up test appointment...');
      const { error: deleteError } = await supabase
        .from('Appointment')
        .delete()
        .eq('Appointment ID id', newAppointment['Appointment ID id']);
      
      if (deleteError) {
        console.log('⚠️  Failed to clean up test appointment:', deleteError);
      } else {
        console.log('🧹 Test appointment cleaned up successfully');
      }
    }
    
    console.log('\n🎉 API test completed!');
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testAppointmentAPI();
