import { NextResponse } from 'next/server';
import { generateSmartRecommendations } from '../../../lib/geminiService.js';

const TOMORROW_API_KEY = process.env.TOMORROW_API_KEY;
const TOMORROW_BASE_URL = 'https://api.tomorrow.io/v4';

// Validate API keys
if (!TOMORROW_API_KEY) {
  console.warn('TOMORROW_API_KEY not found in environment variables. Weather API will use fallback data.');
}

if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY not found in environment variables. AI recommendations will use fallback data.');
}

// Function to geocode location string to coordinates
async function geocodeLocation(location) {
  try {
    // Use OpenStreetMap Nominatim API for free geocoding
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`;
    
    const response = await fetch(geocodeUrl, {
      headers: {
        'User-Agent': 'CropWeatherApp/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }
    
    const data = await response.json();
    if (data && data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        name: result.display_name.split(',')[0] || location
      };
    }
    
    // Fallback to predefined locations if geocoding fails
    return getLocationFromName(location);
  } catch (error) {
    console.error('Geocoding error:', error);
    // Return location from predefined list or default
    return getLocationFromName(location);
  }
}

// Function to get coordinates from predefined locations
function getLocationFromName(location) {
  const locationLower = location.toLowerCase();
  
  // Common Indian cities and agricultural regions
  const predefinedLocations = {
    'mumbai': { lat: 19.0760, lon: 72.8777, name: 'Mumbai, Maharashtra' },
    'delhi': { lat: 28.6139, lon: 77.2090, name: 'Delhi' },
    'bangalore': { lat: 12.9716, lon: 77.5946, name: 'Bangalore, Karnataka' },
    'bengaluru': { lat: 12.9716, lon: 77.5946, name: 'Bengaluru, Karnataka' },
    'hyderabad': { lat: 17.3850, lon: 78.4867, name: 'Hyderabad, Telangana' },
    'chennai': { lat: 13.0827, lon: 80.2707, name: 'Chennai, Tamil Nadu' },
    'kolkata': { lat: 22.5726, lon: 88.3639, name: 'Kolkata, West Bengal' },
    'pune': { lat: 18.5204, lon: 73.8567, name: 'Pune, Maharashtra' },
    'ahmedabad': { lat: 23.0225, lon: 72.5714, name: 'Ahmedabad, Gujarat' },
    'jaipur': { lat: 26.9124, lon: 75.7873, name: 'Jaipur, Rajasthan' },
    'surat': { lat: 21.1702, lon: 72.8311, name: 'Surat, Gujarat' },
    'lucknow': { lat: 26.8467, lon: 80.9462, name: 'Lucknow, Uttar Pradesh' },
    'kanpur': { lat: 26.4499, lon: 80.3319, name: 'Kanpur, Uttar Pradesh' },
    'nagpur': { lat: 21.1458, lon: 79.0882, name: 'Nagpur, Maharashtra' },
    'indore': { lat: 22.7196, lon: 75.8577, name: 'Indore, Madhya Pradesh' },
    'bhopal': { lat: 23.2599, lon: 77.4126, name: 'Bhopal, Madhya Pradesh' },
    'visakhapatnam': { lat: 17.6868, lon: 83.2185, name: 'Visakhapatnam, Andhra Pradesh' },
    'patna': { lat: 25.5941, lon: 85.1376, name: 'Patna, Bihar' },
    'vadodara': { lat: 22.3072, lon: 73.1812, name: 'Vadodara, Gujarat' },
    'ghaziabad': { lat: 28.6692, lon: 77.4538, name: 'Ghaziabad, Uttar Pradesh' },
    'kavathepiran': { lat: 16.8734, lon: 74.1822, name: 'Kavathepiran, Maharashtra' },
    'sangli': { lat: 16.8524, lon: 74.5815, name: 'Sangli, Maharashtra' },
    'kolhapur': { lat: 16.7050, lon: 74.2433, name: 'Kolhapur, Maharashtra' },
    'satara': { lat: 17.6805, lon: 74.0183, name: 'Satara, Maharashtra' }
  };
  
  // Try to find exact match
  if (predefinedLocations[locationLower]) {
    return predefinedLocations[locationLower];
  }
  
  // Try to find partial match
  for (const [key, value] of Object.entries(predefinedLocations)) {
    if (locationLower.includes(key) || key.includes(locationLower)) {
      return value;
    }
  }
  
  // Default to Delhi if no match found
  return { lat: 28.6139, lon: 77.2090, name: `${location} (using Delhi coordinates)` };
}

// Function to fetch current weather
async function getCurrentWeather(lat, lon) {
  const url = `${TOMORROW_BASE_URL}/weather/realtime?location=${lat},${lon}&apikey=${TOMORROW_API_KEY}&fields=temperature,temperatureApparent,humidity,windSpeed,windDirection,pressureSeaLevel,cloudCover,visibility,uvIndex,weatherCode`;
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Current weather API error:', response.status, errorText);
    
    if (response.status === 429) {
      throw new Error('RATE_LIMITED');
    }
    
    throw new Error(`Weather API error: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

// Function to fetch weather forecast
async function getWeatherForecast(lat, lon, days = 5) {
  const url = `${TOMORROW_BASE_URL}/weather/forecast?location=${lat},${lon}&apikey=${TOMORROW_API_KEY}&timesteps=1d&fields=temperatureMax,temperatureMin,humidity,windSpeed,precipitationProbability,weatherCode&endTime=${new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()}`;
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Forecast API error:', response.status, errorText);
    
    if (response.status === 429) {
      throw new Error('RATE_LIMITED');
    }
    
    throw new Error(`Forecast API error: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

// Function to get weather alerts
async function getWeatherAlerts(lat, lon) {
  try {
    const url = `${TOMORROW_BASE_URL}/weather/alerts?location=${lat},${lon}&apikey=${TOMORROW_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      return { alerts: [] }; // Return empty alerts if API fails
    }
    
    return response.json();
  } catch (error) {
    console.error('Weather alerts error:', error);
    return { alerts: [] };
  }
}

// Function to get weather description from weather code
function getWeatherDescription(weatherCode) {
  const weatherCodes = {
    0: 'Unknown',
    1000: 'Clear, Sunny',
    1100: 'Mostly Clear',
    1101: 'Partly Cloudy',
    1102: 'Mostly Cloudy',
    1001: 'Cloudy',
    2000: 'Fog',
    2100: 'Light Fog',
    4000: 'Drizzle',
    4001: 'Rain',
    4200: 'Light Rain',
    4201: 'Heavy Rain',
    5000: 'Snow',
    5001: 'Flurries',
    5100: 'Light Snow',
    5101: 'Heavy Snow',
    6000: 'Freezing Drizzle',
    6001: 'Freezing Rain',
    6200: 'Light Freezing Rain',
    6201: 'Heavy Freezing Rain',
    7000: 'Ice Pellets',
    7101: 'Heavy Ice Pellets',
    7102: 'Light Ice Pellets',
    8000: 'Thunderstorm'
  };
  
  return weatherCodes[weatherCode] || 'Unknown';
}

// Function to provide enhanced fallback weather data when API fails
async function getEnhancedFallbackWeatherData(locationName, originalLocation, isRateLimited) {
  // Get seasonal weather patterns for India (October is post-monsoon)
  const currentMonth = new Date().getMonth(); // October = 9
  const isPostMonsoon = currentMonth >= 9 && currentMonth <= 11; // Oct, Nov, Dec
  const isPeakWinter = currentMonth >= 11 || currentMonth <= 1; // Dec, Jan, Feb
  const isSummer = currentMonth >= 3 && currentMonth <= 5; // Apr, May, Jun
  
  // Base temperatures based on location and season
  let baseTemp = 25;
  let humidity = 65;
  let precipitationChance = 20;
  
  if (originalLocation.toLowerCase().includes('maharashtra') || 
      originalLocation.toLowerCase().includes('kavathepiran')) {
    if (isPostMonsoon) {
      baseTemp = 26; // Pleasant post-monsoon weather
      humidity = 60;
      precipitationChance = 15;
    } else if (isPeakWinter) {
      baseTemp = 22;
      humidity = 55;
      precipitationChance = 10;
    } else if (isSummer) {
      baseTemp = 35;
      humidity = 40;
      precipitationChance = 5;
    }
  }
  
  const currentHour = new Date().getHours();
  const tempVariation = Math.sin((currentHour - 6) * Math.PI / 12) * 6;
  
  return {
    current: {
      location: locationName,
      temperature: Math.round(baseTemp + tempVariation),
      feelsLike: Math.round(baseTemp + tempVariation + 3),
      humidity: humidity + Math.round(Math.random() * 10 - 5),
      windSpeed: 6 + Math.round(Math.random() * 8),
      pressure: 1013 + Math.round(Math.random() * 10 - 5),
      visibility: 8 + Math.round(Math.random() * 7),
      uvIndex: currentHour > 6 && currentHour < 18 ? Math.max(0, 7 - Math.abs(currentHour - 12)) : 0,
      description: getRealisticWeatherDescription(currentHour, isPostMonsoon, precipitationChance),
      weatherCode: getRealisticWeatherCode(currentHour, isPostMonsoon)
    },
    forecast: Array.from({ length: 5 }, (_, index) => ({
      date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toLocaleDateString(),
      day: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
      tempMax: Math.round(baseTemp + 4 + Math.random() * 4),
      tempMin: Math.round(baseTemp - 4 + Math.random() * 3),
      humidity: humidity + Math.round(Math.random() * 15 - 7),
      windSpeed: 5 + Math.round(Math.random() * 10),
      precipitationProbability: Math.max(0, precipitationChance + Math.round(Math.random() * 20 - 10)),
      description: getRealisticWeatherDescription(12, isPostMonsoon, precipitationChance),
      weatherCode: getRealisticWeatherCode(12, isPostMonsoon),
      isToday: index === 0
    })),
    alerts: [],
    recommendations: await getEnhancedRecommendations(locationName, baseTemp, humidity, precipitationChance, isPostMonsoon, isRateLimited),
    lastUpdated: new Date().toISOString()
  };
}

// Helper function for realistic weather descriptions
function getRealisticWeatherDescription(hour, isPostMonsoon, precipitationChance) {
  if (precipitationChance > 60) {
    return 'Light Rain';
  }
  if (isPostMonsoon && hour >= 6 && hour <= 18) {
    return Math.random() > 0.5 ? 'Partly Cloudy' : 'Clear, Sunny';
  }
  if (hour >= 20 || hour <= 5) {
    return 'Clear';
  }
  return Math.random() > 0.7 ? 'Mostly Cloudy' : 'Partly Cloudy';
}

// Helper function for realistic weather codes
function getRealisticWeatherCode(hour, isPostMonsoon) {
  if (hour >= 20 || hour <= 5) return 1000; // Clear night
  if (isPostMonsoon) {
    return Math.random() > 0.6 ? 1101 : 1000; // Partly cloudy or clear
  }
  return Math.random() > 0.5 ? 1101 : 1102; // Partly cloudy or mostly cloudy
}

// Enhanced recommendations using Gemini AI when available
async function getEnhancedRecommendations(locationName, temp, humidity, precipChance, isPostMonsoon, isRateLimited) {
  try {
    // Try to get AI-powered recommendations first
    const mockWeatherData = {
      current: {
        temperature: temp,
        humidity: humidity,
        description: isPostMonsoon ? 'Post-monsoon conditions' : 'Seasonal weather'
      },
      forecast: [
        {
          tempMax: temp + 2,
          tempMin: temp - 3,
          precipitationProbability: precipChance,
          description: precipChance > 40 ? 'Possible showers' : 'Partly cloudy'
        }
      ]
    };
    
    const aiRecommendations = await generateSmartRecommendations(mockWeatherData, locationName);
    if (aiRecommendations && aiRecommendations.length > 0) {
      return aiRecommendations;
    }
  } catch (error) {
    console.warn('Gemini AI unavailable for fallback recommendations, using basic ones:', error.message);
  }
  
  // Fallback to basic recommendations
  return getRealisticFarmingRecommendations(temp, humidity, precipChance, isPostMonsoon, isRateLimited);
}

// Enhanced farming recommendations
function getRealisticFarmingRecommendations(temp, humidity, precipChance, isPostMonsoon, isRateLimited) {
  const recommendations = [];
  
  if (isRateLimited) {
    recommendations.push({
      type: 'general',
      priority: 'medium',
      message: `Weather service temporarily busy. Based on seasonal patterns for October in Maharashtra: Post-monsoon conditions with ${temp}°C average temperature.`,
      action: 'Try Again Later'
    });
  }
  
  if (isPostMonsoon) {
    recommendations.push({
      type: 'irrigation',
      priority: 'medium',
      message: 'Post-monsoon season: Soil moisture should be adequate. Monitor field conditions and adjust irrigation as needed.',
      action: 'Check Soil Moisture'
    });
    
    recommendations.push({
      type: 'planting',
      priority: 'high',
      message: 'October is ideal for Rabi crop sowing in Maharashtra. Consider wheat, gram, mustard, and barley plantation.',
      action: 'Plan Rabi Crops'
    });
  }
  
  if (temp > 30) {
    recommendations.push({
      type: 'heat',
      priority: 'high',
      message: `High temperature (${temp}°C) detected. Ensure adequate water supply and consider shade for sensitive crops.`,
      action: 'Increase Watering'
    });
  }
  
  if (precipChance > 40) {
    recommendations.push({
      type: 'pesticide',
      priority: 'medium',
      message: `${precipChance}% chance of precipitation. Avoid pesticide/fertilizer application to prevent runoff.`,
      action: 'Delay Application'
    });
  }
  
  if (humidity < 40) {
    recommendations.push({
      type: 'humidity',
      priority: 'medium',
      message: 'Low humidity levels may stress crops. Monitor for signs of water stress and adjust irrigation.',
      action: 'Monitor Plants'
    });
  }
  
  return recommendations;
}

// Original fallback function (keeping for backward compatibility)
function getFallbackWeatherData(locationName) {
  const baseTemp = 25; // Average temperature for agricultural regions in India
  const currentHour = new Date().getHours();
  const tempVariation = Math.sin((currentHour - 6) * Math.PI / 12) * 5; // Natural temperature variation
  
  return {
    current: {
      location: locationName,
      temperature: Math.round(baseTemp + tempVariation),
      feelsLike: Math.round(baseTemp + tempVariation + 2),
      humidity: 65,
      windSpeed: 8,
      pressure: 1013,
      visibility: 10,
      uvIndex: currentHour > 6 && currentHour < 18 ? 6 : 0,
      description: currentHour > 6 && currentHour < 18 ? 'Partly Cloudy' : 'Clear',
      weatherCode: currentHour > 6 && currentHour < 18 ? 1101 : 1000
    },
    forecast: Array.from({ length: 5 }, (_, index) => ({
      date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toLocaleDateString(),
      day: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
      tempMax: Math.round(baseTemp + 5 + Math.random() * 3),
      tempMin: Math.round(baseTemp - 3 + Math.random() * 2),
      humidity: 60 + Math.round(Math.random() * 20),
      windSpeed: 5 + Math.round(Math.random() * 10),
      precipitationProbability: Math.round(Math.random() * 40),
      description: index % 2 === 0 ? 'Partly Cloudy' : 'Clear, Sunny',
      weatherCode: index % 2 === 0 ? 1101 : 1000,
      isToday: index === 0
    })),
    alerts: [],
    recommendations: [
      {
        type: 'general',
        priority: 'medium',
        message: 'Weather data temporarily unavailable. Using estimated conditions for your region. Check back later for real-time updates.',
        action: 'Refresh Weather'
      },
      {
        type: 'irrigation',
        priority: 'low',
        message: 'Moderate temperature and humidity levels detected. Maintain regular watering schedule.',
        action: 'Monitor Soil'
      }
    ],
    lastUpdated: new Date().toISOString()
  };
}

// Function to generate farming recommendations based on weather
function getFarmingRecommendations(currentWeather, forecast) {
  const recommendations = [];
  const temp = currentWeather.data.values.temperature;
  const humidity = currentWeather.data.values.humidity;
  const windSpeed = currentWeather.data.values.windSpeed;
  
  // Check for rain in forecast
  const hasRainForecast = forecast.timelines.daily.some(day => 
    day.values.precipitationProbability > 60
  );
  
  if (hasRainForecast) {
    recommendations.push({
      type: 'irrigation',
      priority: 'medium',
      message: 'Rain expected in the forecast. Consider reducing irrigation schedule.',
      action: 'Adjust Irrigation'
    });
    
    recommendations.push({
      type: 'pesticide',
      priority: 'high',
      message: 'Avoid pesticide spraying before expected rain to prevent waste.',
      action: 'Delay Spraying'
    });
  }
  
  if (temp > 35) {
    recommendations.push({
      type: 'heat',
      priority: 'high',
      message: 'High temperature alert. Ensure adequate water supply for crops.',
      action: 'Increase Watering'
    });
  }
  
  if (windSpeed > 10) {
    recommendations.push({
      type: 'wind',
      priority: 'medium',
      message: 'High wind conditions. Secure lightweight structures and check for plant damage.',
      action: 'Secure Equipment'
    });
  }
  
  if (humidity < 30) {
    recommendations.push({
      type: 'humidity',
      priority: 'medium',
      message: 'Low humidity detected. Monitor crops for stress and consider additional watering.',
      action: 'Monitor Crops'
    });
  }
  
  return recommendations;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    
    if (!location) {
      return NextResponse.json(
        { success: false, message: 'Location parameter is required' },
        { status: 400 }
      );
    }
    
    // Get coordinates from location
    const coords = await geocodeLocation(location);
    
    // Check if API key is available
    if (!TOMORROW_API_KEY) {
      console.log('Weather API key not available, using fallback data');
      return NextResponse.json({
        success: true,
        data: await getEnhancedFallbackWeatherData(coords.name, location, false),
        fallback: true,
        rateLimited: false
      });
    }

    // Fetch weather data in parallel with better error handling
    const [currentWeather, forecast, alerts] = await Promise.allSettled([
      getCurrentWeather(coords.lat, coords.lon),
      getWeatherForecast(coords.lat, coords.lon),
      getWeatherAlerts(coords.lat, coords.lon)
    ]);

    // Check if critical data (current weather and forecast) failed
    if (currentWeather.status === 'rejected' || forecast.status === 'rejected') {
      const isRateLimited = currentWeather.status === 'rejected' && currentWeather.reason.message === 'RATE_LIMITED';
      
      console.error('Weather API failed, using enhanced fallback data');
      console.error('Current weather error:', currentWeather.status === 'rejected' ? currentWeather.reason.message : 'OK');
      console.error('Forecast error:', forecast.status === 'rejected' ? forecast.reason.message : 'OK');
      
      // Return enhanced fallback weather data with realistic farming recommendations
      return NextResponse.json({
        success: true,
        data: await getEnhancedFallbackWeatherData(coords.name, location, isRateLimited),
        fallback: true,
        rateLimited: isRateLimited
      });
    }
    
    // Process current weather data
    const currentData = currentWeather.value;
    const forecastData = forecast.value;
    const alertsData = alerts.status === 'fulfilled' ? alerts.value : { alerts: [] };

    const current = {
      location: coords.name,
      temperature: Math.round(currentData.data.values.temperature),
      feelsLike: Math.round(currentData.data.values.temperatureApparent),
      humidity: Math.round(currentData.data.values.humidity),
      windSpeed: Math.round(currentData.data.values.windSpeed),
      pressure: Math.round(currentData.data.values.pressureSeaLevel),
      visibility: Math.round(currentData.data.values.visibility),
      uvIndex: Math.round(currentData.data.values.uvIndex),
      description: getWeatherDescription(currentData.data.values.weatherCode),
      weatherCode: currentData.data.values.weatherCode
    };
    
    // Process forecast data
    const forecastArray = forecastData.timelines.daily.slice(0, 5).map((day, index) => ({
      date: new Date(day.time).toLocaleDateString(),
      day: new Date(day.time).toLocaleDateString('en-US', { weekday: 'short' }),
      tempMax: Math.round(day.values.temperatureMax || 0),
      tempMin: Math.round(day.values.temperatureMin || 0),
      humidity: day.values.humidity ? Math.round(day.values.humidity) : 50,
      windSpeed: day.values.windSpeed ? Math.round(day.values.windSpeed) : 5,
      precipitationProbability: day.values.precipitationProbability ? Math.round(day.values.precipitationProbability) : 0,
      description: getWeatherDescription(day.values.weatherCode || 1000),
      weatherCode: day.values.weatherCode || 1000,
      isToday: index === 0
    }));
    
    // Prepare weather data for Gemini AI
    const weatherDataForAI = {
      current,
      forecast: forecastArray,
      alerts: alertsData.alerts || []
    };
    
    // Generate AI-powered farming recommendations using Gemini
    let recommendations = [];
    try {
      const geminiRecommendations = await generateSmartRecommendations(
        weatherDataForAI, 
        coords.name, 
        searchParams.get('crops') // Optional crops parameter
      );
      
      // Combine AI recommendations with basic weather-based ones
      const basicRecommendations = getFarmingRecommendations(currentData, forecastData);
      
      // Prioritize Gemini recommendations, fall back to basic ones if needed
      recommendations = geminiRecommendations.length > 0 
        ? geminiRecommendations 
        : basicRecommendations;
        
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      // Fallback to basic recommendations
      recommendations = getFarmingRecommendations(currentData, forecastData);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        current,
        forecast: forecastArray,
        alerts: alertsData.alerts || [],
        recommendations,
        lastUpdated: new Date().toISOString(),
        aiPowered: recommendations.length > 0 && recommendations[0].source === 'gemini'
      }
    });
    
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch weather data', error: error.message },
      { status: 500 }
    );
  }
}
