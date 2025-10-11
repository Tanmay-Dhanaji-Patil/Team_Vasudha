#!/usr/bin/env node

// Environment variables validation script
require('dotenv').config({ path: '.env.local' });

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'DATABASE_URL',
  'TOMORROW_API_KEY',
  'SMTP_USER',
  'SMTP_PASS',
  'NEXTAUTH_SECRET'
];

const optionalVars = [
  'SMTP_SERVICE',
  'NODE_ENV',
  'APP_URL',
  'NEXTAUTH_URL'
];

console.log('🔍 Validating Environment Variables...\n');

let missingRequired = [];
let foundOptional = [];

// Check required variables
requiredVars.forEach(varName => {
  if (process.env[varName]) {
    const maskedValue = varName.includes('KEY') || varName.includes('PASS') || varName.includes('SECRET')
      ? '***HIDDEN***'
      : process.env[varName];
    console.log(`✅ ${varName}: ${maskedValue}`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    missingRequired.push(varName);
  }
});

console.log('\n📋 Optional Variables:');

// Check optional variables
optionalVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: ${process.env[varName]}`);
    foundOptional.push(varName);
  } else {
    console.log(`⚪ ${varName}: Not set (optional)`);
  }
});

console.log('\n📊 Summary:');
console.log(`Required variables: ${requiredVars.length - missingRequired.length}/${requiredVars.length} found`);
console.log(`Optional variables: ${foundOptional.length}/${optionalVars.length} found`);

if (missingRequired.length > 0) {
  console.log('\n⚠️  Missing required variables:');
  missingRequired.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\nPlease add these to your .env.local file.');
  process.exit(1);
} else {
  console.log('\n🎉 All required environment variables are configured!');
  process.exit(0);
}
