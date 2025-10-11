"use client";

import { useState, useEffect } from 'react';

// Weather icons based on weather codes
const getWeatherIcon = (weatherCode) => {
  const iconMap = {
    1000: '☀️', // Clear, Sunny
    1100: '🌤️', // Mostly Clear
    1101: '⛅', // Partly Cloudy
    1102: '🌥️', // Mostly Cloudy
    1001: '☁️', // Cloudy
    2000: '🌫️', // Fog
    2100: '🌫️', // Light Fog
    4000: '🌦️', // Drizzle
    4001: '🌧️', // Rain
    4200: '🌦️', // Light Rain
    4201: '⛈️', // Heavy Rain
    5000: '🌨️', // Snow
    5001: '❄️', // Flurries
    5100: '🌨️', // Light Snow
    5101: '🌨️', // Heavy Snow
    6000: '🌧️', // Freezing Drizzle
    6001: '🌧️', // Freezing Rain
    6200: '🌧️', // Light Freezing Rain
    6201: '🌧️', // Heavy Freezing Rain
    7000: '🧊', // Ice Pellets
    7101: '🧊', // Heavy Ice Pellets
    7102: '🧊', // Light Ice Pellets
    8000: '⛈️'  // Thunderstorm
  };
  
  return iconMap[weatherCode] || '🌤️';
};

const WeatherCard = ({ user }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.location) {
      fetchWeatherData(user.location);
    }
  }, [user]);

  const fetchWeatherData = async (location) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
      const data = await response.json();
      
      if (data.success) {
        setWeatherData(data.data);
      } else {
        setError(data.message || 'Failed to fetch weather data');
      }
    } catch (err) {
      setError('Network error while fetching weather data');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div className="w-32 h-5 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-3">
            <div className="w-full h-4 bg-gray-200 rounded"></div>
            <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
            <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-red-500">⚠️</span>
          <h2 className="text-lg font-semibold text-gray-900">Weather Unavailable</h2>
        </div>
        <p className="text-red-600 text-sm">{error}</p>
        <button 
          onClick={() => fetchWeatherData(user.location)}
          className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!weatherData) return null;

  const { current, forecast } = weatherData;

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <span className="text-blue-600">🌤️</span>
          <h2 className="text-lg font-semibold text-gray-900">Weather for {current.location}</h2>
        </div>
      </div>

      {/* Current Weather */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{getWeatherIcon(current.weatherCode)}</span>
            <div>
              <div className="text-3xl font-bold text-gray-900">{current.temperature}°C</div>
              <div className="text-sm text-gray-500">Feels like {current.feelsLike}°C</div>
              <div className="text-sm text-gray-600">{current.description}</div>
            </div>
          </div>
        </div>

        {/* Weather Details Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span>💧</span>
            <span className="text-gray-600">Humidity:</span>
            <span className="font-medium">{current.humidity}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span>💨</span>
            <span className="text-gray-600">Wind:</span>
            <span className="font-medium">{current.windSpeed} km/h</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🌡️</span>
            <span className="text-gray-600">Pressure:</span>
            <span className="font-medium">{current.pressure} hPa</span>
          </div>
          <div className="flex items-center gap-2">
            <span>☀️</span>
            <span className="text-gray-600">UV Index:</span>
            <span className="font-medium">{current.uvIndex}</span>
          </div>
        </div>
      </div>

      {/* 5-Day Forecast */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-3">5-Day Forecast</h3>
        <div className="space-y-2">
          {forecast.map((day, index) => (
            <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-lg">{getWeatherIcon(day.weatherCode)}</span>
                <div>
                  <div className="font-medium text-sm">
                    {day.isToday ? 'Today' : day.day}
                  </div>
                  <div className="text-xs text-gray-500">{day.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-sm">
                  {day.tempMax}° / {day.tempMin}°
                </div>
                <div className="text-xs text-blue-600">
                  {day.precipitationProbability}% rain
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Last Updated */}
      <div className="px-4 pb-3">
        <div className="text-xs text-gray-400">
          Last updated: {new Date(weatherData.lastUpdated).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
