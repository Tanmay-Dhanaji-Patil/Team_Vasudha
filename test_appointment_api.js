// Test script to verify appointment API functionality
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAppointmentAPI() {
  console.log('🧪 Testing Appointment API...');
  
  try {
    // First, let's check if we have any appointments
    console.log('\n1️⃣ Checking for existing appointments:');
    const { data: appointments, error: appointmentsError } = await supabase
      .from('Appointment')
      .select(`
        *,
        "Farmer Data" (
          id,
          "Farmer_name",
          "Farmer_email",
          "Phone_number",
          location
        ),
        "Plot Details" (
          id,
          "Plot Number",
          "Area of Plot",
          "Category",
          "State",
          "District",
          "Taluka",
          "Village Name"
        )
      `)
      .limit(1);
    
    if (appointmentsError) {
      console.log('❌ Error fetching appointments:', appointmentsError);
      return;
    }
    
    if (!appointments || appointments.length === 0) {
      console.log('⚠️  No appointments found in database.');
      console.log('📋 To test the appointment ID functionality, you need to:');
      console.log('   1. Create a farmer account');
      console.log('   2. Add plot details for the farmer');
      console.log('   3. Book an appointment');
      console.log('   4. Use the appointment ID in the soil data form');
      return;
    }
    
    const testAppointment = appointments[0];
    console.log('✅ Found appointment:', testAppointment['Appointment ID id']);
    console.log('   Farmer:', testAppointment['Farmer Data']?.Farmer_name);
    console.log('   Plot:', testAppointment['Plot Details']?.['Plot Number']);
    console.log('   Date:', testAppointment['Appointment Date']);
    
    // Test the API endpoint
    console.log('\n2️⃣ Testing API endpoint:');
    const response = await fetch(`http://localhost:3000/api/appointment/${testAppointment['Appointment ID id']}`);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ API endpoint working correctly!');
      console.log('   Appointment ID:', result.appointment.id);
      console.log('   Farmer Name:', result.appointment.farmer?.Farmer_name);
      console.log('   Plot Number:', result.appointment.plot?.Plot_Number);
    } else {
      console.log('❌ API endpoint error:', result.message);
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testAppointmentAPI();
