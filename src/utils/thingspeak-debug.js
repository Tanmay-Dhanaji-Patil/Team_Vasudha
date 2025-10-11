// ThingSpeak Sensor Data Fix
// This file contains debugging and fixes for ThingSpeak sensor data fetching

// Debug function to log ThingSpeak data structure
function debugThingSpeakData(channelData, lastFeed) {
  console.group('🔍 ThingSpeak Data Debug');
  console.log('Channel Data:', channelData);
  console.log('Last Feed:', lastFeed);
  
  if (lastFeed) {
    console.log('Available Fields:');
    for (let i = 1; i <= 8; i++) {
      const fieldName = channelData[`field${i}`];
      const fieldValue = lastFeed[`field${i}`];
      console.log(`  Field ${i}: "${fieldName}" = "${fieldValue}"`);
    }
  }
  
  console.groupEnd();
}

// Enhanced field mapping function
function mapThingSpeakFields(channelData, lastFeed, inputMode) {
  const currentParam = inputMode && inputMode.endsWith('water') ? 'water' : 'soil';
  const mappedData = {};
  
  const mapFieldNameToKey = (name) => {
    if (!name) return null;
    const n = String(name).toLowerCase();
    
    // Soil parameters
    if (n.includes('nitrogen') || n.includes('nitro')) return 'nitrogen';
    if (n.includes('phosphor') || n.includes('phosphorous') || n.includes('phosphorus')) return 'phosphorous';
    if (n.includes('potass')) return 'potassium';
    if (n.includes('temp')) return 'temperature';
    if (n.includes('moisture')) return 'moisture';
    if (n.includes('ec') || n.includes('conductivity')) return 'soil_ec';
    if (n.includes('humidity')) return 'soil_humidity';
    
    // pH handling
    if (currentParam === 'water') {
      if ((n.includes('water') && (n.includes('ph') || n.includes('pH'.toLowerCase()))) || /\bph\b/.test(n)) {
        return 'water_ph';
      }
    } else {
      if ((/\bph\b/.test(n) && !n.includes('phosph')) || n === 'ph') {
        return 'ph';
      }
    }
    
    return null;
  };
  
  if (lastFeed) {
    for (let i = 1; i <= 8; i++) {
      const fieldName = channelData[`field${i}`];
      const fieldValue = lastFeed[`field${i}`];
      const mappedKey = mapFieldNameToKey(fieldName);
      
      if (mappedKey && fieldValue != null && fieldValue !== '') {
        const numericValue = parseFloat(fieldValue);
        mappedData[mappedKey] = isNaN(numericValue) ? fieldValue : numericValue;
        
        console.log(`✅ Mapped: ${fieldName} (${fieldValue}) → ${mappedKey}: ${mappedData[mappedKey]}`);
      } else if (fieldName) {
        console.log(`❌ Skipped: ${fieldName} (${fieldValue}) - no mapping or empty value`);
      }
    }
    
    // Set timestamp only if we have valid data
    if (lastFeed.created_at && Object.keys(mappedData).length > 0) {
      mappedData.day = lastFeed.created_at;
    }
  }
  
  return mappedData;
}

// Alternative data source handling
function handleAlternativeDataSources(channelData, lastFeed) {
  const mappedData = {};
  
  // Check if data is in different structure
  if (channelData.feeds && Array.isArray(channelData.feeds)) {
    const latestFeed = channelData.feeds[0];
    if (latestFeed) {
      console.log('📊 Using feeds array data:', latestFeed);
      return mapThingSpeakFields(channelData, latestFeed, 'soil');
    }
  }
  
  // Check for direct field values in channel data
  const directFields = {};
  for (let i = 1; i <= 8; i++) {
    const fieldName = channelData[`field${i}`];
    const fieldValue = channelData[`field${i}_value`] || channelData[`value${i}`];
    
    if (fieldName && fieldValue != null) {
      directFields[`field${i}`] = fieldValue;
    }
  }
  
  if (Object.keys(directFields).length > 0) {
    console.log('📊 Using direct field values:', directFields);
    return mapThingSpeakFields(channelData, directFields, 'soil');
  }
  
  return mappedData;
}

// Export functions for use in components
if (typeof window !== 'undefined') {
  window.debugThingSpeakData = debugThingSpeakData;
  window.mapThingSpeakFields = mapThingSpeakFields;
  window.handleAlternativeDataSources = handleAlternativeDataSources;
}
