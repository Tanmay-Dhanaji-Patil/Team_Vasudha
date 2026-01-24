// Script to check actual table structure
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTableStructure() {
  console.log('🔍 Checking table structures...');
  
  try {
    // Check Appointment table structure
    console.log('\n1️⃣ Checking Appointment table:');
    const { data: appointments, error: appointmentError } = await supabase
      .from('Appointment')
      .select('*')
      .limit(1);
    
    if (appointmentError) {
      console.log('❌ Appointment table error:', appointmentError);
    } else {
      console.log('✅ Appointment table columns:', appointments.length > 0 ? Object.keys(appointments[0]) : 'No data found');
    }
    
    // Check Farmer Data table structure
    console.log('\n2️⃣ Checking Farmer Data table:');
    const { data: farmers, error: farmerError } = await supabase
      .from('Farmer Data')
      .select('*')
      .limit(1);
    
    if (farmerError) {
      console.log('❌ Farmer Data table error:', farmerError);
    } else {
      console.log('✅ Farmer Data table columns:', farmers.length > 0 ? Object.keys(farmers[0]) : 'No data found');
    }
    
    // Check Plot Details table structure
    console.log('\n3️⃣ Checking Plot Details table:');
    const { data: plots, error: plotError } = await supabase
      .from('Plot Details')
      .select('*')
      .limit(1);
    
    if (plotError) {
      console.log('❌ Plot Details table error:', plotError);
    } else {
      console.log('✅ Plot Details table columns:', plots.length > 0 ? Object.keys(plots[0]) : 'No data found');
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

checkTableStructure();
