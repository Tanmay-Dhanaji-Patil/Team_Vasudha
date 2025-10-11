// Test script for Plot Details API
// Run this with: node test-plot-details.js

const testPlotDetailsAPI = async () => {
  const testData = {
    category: 'Rural',
    state: 'Maharashtra',
    district: 'Pune',
    taluka: 'Mulshi',
    villageName: 'Test Village',
    areaOfPlot: '5.5',
    farmerId: 'test-farmer-id-123'
  };

  try {
    console.log('🧪 Testing Plot Details API...');
    console.log('📤 Sending test data:', testData);

    const response = await fetch('http://localhost:3000/api/plot-details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response data:', result);

    if (result.success) {
      console.log('✅ Plot Details API test PASSED');
    } else {
      console.log('❌ Plot Details API test FAILED:', result.message);
    }
  } catch (error) {
    console.log('❌ Plot Details API test ERROR:', error.message);
  }
};

// Test GET endpoint
const testGetPlotDetails = async () => {
  try {
    console.log('\n🧪 Testing GET Plot Details API...');
    
    const response = await fetch('http://localhost:3000/api/plot-details?farmerId=test-farmer-id-123');
    const result = await response.json();
    
    console.log('📥 GET Response status:', response.status);
    console.log('📥 GET Response data:', result);

    if (result.success) {
      console.log('✅ GET Plot Details API test PASSED');
    } else {
      console.log('❌ GET Plot Details API test FAILED:', result.message);
    }
  } catch (error) {
    console.log('❌ GET Plot Details API test ERROR:', error.message);
  }
};

// Run tests
testPlotDetailsAPI().then(() => {
  testGetPlotDetails();
});
