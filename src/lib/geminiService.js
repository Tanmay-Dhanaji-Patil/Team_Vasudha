import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate AI-powered agricultural recommendations based on weather data
 * @param {Object} weatherData - Current weather and forecast data from Tomorrow.io API
 * @param {string} location - Location of the farm
 * @param {string} userCrops - Crops grown by user (optional)
 * @returns {Promise<Array>} Array of AI-generated recommendations
 */
export async function generateSmartRecommendations(weatherData, location, userCrops = null) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Construct a detailed prompt for agricultural recommendations
    const prompt = `
You are an expert agricultural advisor with deep knowledge of farming practices in India. Based on the following weather data and location, provide specific, actionable agricultural recommendations for farmers.

**Location:** ${location}
**Current Date:** ${new Date().toLocaleDateString('en-IN')}

**Current Weather Conditions:**
- Temperature: ${weatherData.current?.temperature || 'N/A'}°C (Feels like: ${weatherData.current?.feelsLike || 'N/A'}°C)
- Humidity: ${weatherData.current?.humidity || 'N/A'}%
- Wind Speed: ${weatherData.current?.windSpeed || 'N/A'} km/h
- Pressure: ${weatherData.current?.pressure || 'N/A'} hPa
- Weather: ${weatherData.current?.description || 'N/A'}

**5-Day Forecast:**
${weatherData.forecast?.map((day, index) => 
  `Day ${index + 1} (${day.day}): ${day.tempMax}°C/${day.tempMin}°C, ${day.humidity}% humidity, ${day.precipitationProbability}% rain chance - ${day.description}`
).join('\n') || 'No forecast data available'}

${userCrops ? `**User's Crops:** ${userCrops}` : ''}

**Instructions:**
1. Provide EXACTLY 4-6 specific, actionable recommendations
2. Each recommendation must include:
   - A clear category (irrigation, fertilizer, pesticide, planting, harvesting, soil_management, or weather_protection)
   - Priority level (high, medium, low)
   - Specific action with timing
   - Brief scientific reasoning

3. Consider seasonal factors for ${location} in October (post-monsoon season)
4. Focus on practical actions farmers can take within the next 1-7 days
5. Be specific about quantities, timing, and methods where applicable

Format your response as a JSON array with this exact structure:
[
  {
    "type": "category_name",
    "priority": "high|medium|low",
    "title": "Brief title (max 50 characters)",
    "message": "Detailed actionable message with specific guidance",
    "action": "Specific action button text",
    "reasoning": "Brief scientific explanation"
  }
]

Focus on immediate, practical actions based on current and upcoming weather conditions.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse the JSON response
    try {
      const recommendations = JSON.parse(text);
      
      // Validate the structure and add IDs
      if (Array.isArray(recommendations)) {
        return recommendations.map((rec, index) => ({
          id: `gemini_${Date.now()}_${index}`,
          type: rec.type || 'general',
          priority: rec.priority || 'medium',
          title: rec.title || 'AI Recommendation',
          message: rec.message || rec.description || 'AI-generated recommendation',
          action: rec.action || 'Take Action',
          reasoning: rec.reasoning || '',
          source: 'gemini',
          timestamp: new Date().toISOString()
        }));
      }
    } catch (parseError) {
      console.warn('Failed to parse Gemini JSON response, falling back to text processing:', parseError);
      
      // Fallback: Extract recommendations from text response
      return parseTextRecommendations(text);
    }
    
    // If JSON parsing fails, return fallback recommendations
    return getFallbackGeminiRecommendations(weatherData, location);
    
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Return enhanced fallback recommendations
    return getFallbackGeminiRecommendations(weatherData, location);
  }
}

/**
 * Parse recommendations from text response (fallback method)
 */
function parseTextRecommendations(text) {
  const recommendations = [];
  const lines = text.split('\n').filter(line => line.trim());
  
  let currentRec = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Look for recommendation patterns
    if (trimmedLine.includes('irrigation') || trimmedLine.includes('water')) {
      currentRec = {
        type: 'irrigation',
        priority: 'medium',
        title: 'Irrigation Management',
        message: trimmedLine,
        action: 'Adjust Watering'
      };
    } else if (trimmedLine.includes('fertilizer') || trimmedLine.includes('nutrient')) {
      currentRec = {
        type: 'fertilizer',
        priority: 'medium',
        title: 'Fertilizer Application',
        message: trimmedLine,
        action: 'Apply Fertilizer'
      };
    } else if (trimmedLine.includes('pesticide') || trimmedLine.includes('pest')) {
      currentRec = {
        type: 'pesticide',
        priority: 'high',
        title: 'Pest Management',
        message: trimmedLine,
        action: 'Treat Pests'
      };
    }
    
    if (currentRec && recommendations.length < 5) {
      recommendations.push({
        ...currentRec,
        id: `gemini_text_${Date.now()}_${recommendations.length}`,
        source: 'gemini_text',
        timestamp: new Date().toISOString()
      });
      currentRec = null;
    }
  }
  
  return recommendations.length > 0 ? recommendations : getFallbackGeminiRecommendations();
}

/**
 * Generate fallback recommendations when Gemini API fails
 */
function getFallbackGeminiRecommendations(weatherData = {}, location = '') {
  const temp = weatherData.current?.temperature || 25;
  const humidity = weatherData.current?.humidity || 60;
  const hasRainForecast = weatherData.forecast?.some(day => day.precipitationProbability > 50) || false;
  
  const recommendations = [
    {
      id: `fallback_${Date.now()}_1`,
      type: 'planting',
      priority: 'high',
      title: 'Rabi Season Planting',
      message: 'October is optimal for Rabi crop sowing. Consider planting wheat, gram, mustard, and barley for best yields.',
      action: 'Plan Sowing',
      reasoning: 'Post-monsoon conditions ideal for winter crop establishment',
      source: 'fallback',
      timestamp: new Date().toISOString()
    }
  ];
  
  if (temp > 30) {
    recommendations.push({
      id: `fallback_${Date.now()}_2`,
      type: 'irrigation',
      priority: 'high',
      title: 'Heat Management',
      message: `High temperature (${temp}°C) detected. Increase irrigation frequency and consider shade protection for sensitive crops.`,
      action: 'Increase Watering',
      reasoning: 'High temperatures increase crop water stress',
      source: 'fallback',
      timestamp: new Date().toISOString()
    });
  }
  
  if (hasRainForecast) {
    recommendations.push({
      id: `fallback_${Date.now()}_3`,
      type: 'pesticide',
      priority: 'medium',
      title: 'Rain Advisory',
      message: 'Rain expected in forecast. Delay pesticide and fertilizer applications to prevent nutrient runoff.',
      action: 'Delay Application',
      reasoning: 'Rain can wash away applied chemicals, reducing effectiveness',
      source: 'fallback',
      timestamp: new Date().toISOString()
    });
  }
  
  if (humidity < 40) {
    recommendations.push({
      id: `fallback_${Date.now()}_4`,
      type: 'soil_management',
      priority: 'medium',
      title: 'Low Humidity Alert',
      message: 'Low humidity levels may cause crop stress. Monitor plants closely and consider mulching to retain soil moisture.',
      action: 'Apply Mulch',
      reasoning: 'Low humidity increases evapotranspiration rates',
      source: 'fallback',
      timestamp: new Date().toISOString()
    });
  }
  
  return recommendations;
}

/**
 * Generate crop-specific recommendations
 * @param {string} cropType - Type of crop
 * @param {Object} weatherData - Weather information
 * @returns {Promise<Array>} Crop-specific recommendations
 */
export async function generateCropSpecificRecommendations(cropType, weatherData) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
As an agricultural expert, provide specific recommendations for ${cropType} cultivation based on current weather conditions:

Temperature: ${weatherData.current?.temperature || 'N/A'}°C
Humidity: ${weatherData.current?.humidity || 'N/A'}%
Upcoming weather: ${weatherData.forecast?.[0]?.description || 'N/A'}

Provide 3-4 specific, actionable recommendations for ${cropType} in JSON format:
[
  {
    "type": "category",
    "priority": "priority_level",
    "title": "title",
    "message": "detailed_message",
    "action": "action_text"
  }
]
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const recommendations = JSON.parse(text);
      return recommendations.map((rec, index) => ({
        ...rec,
        id: `crop_${cropType}_${Date.now()}_${index}`,
        source: 'gemini_crop',
        timestamp: new Date().toISOString()
      }));
    } catch (parseError) {
      console.warn('Failed to parse crop-specific recommendations');
      return [];
    }
    
  } catch (error) {
    console.error('Error generating crop-specific recommendations:', error);
    return [];
  }
}

export default {
  generateSmartRecommendations,
  generateCropSpecificRecommendations
};
