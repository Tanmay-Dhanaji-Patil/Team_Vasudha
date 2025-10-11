"use client";

import React from "react";
import { 
  ComposedChart, 
  Bar, 
  Line, 
  ResponsiveContainer, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from "recharts";
import { useState, useEffect } from "react";

// Gauge Chart Component (using CSS and JavaScript)
export function SoilHealthGauge({ value = 75, label = "Overall Soil Health" }) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 500);
    return () => clearTimeout(timer);
  }, [value]);

  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  const getColor = (val) => {
    if (val >= 80) return "#10B981"; // Green
    if (val >= 60) return "#F59E0B"; // Yellow
    if (val >= 40) return "#EF4444"; // Red
    return "#6B7280"; // Gray
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{label}</h3>
        <p className="text-gray-600 dark:text-gray-300">Real-time health score based on all parameters</p>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#E5E7EB"
              strokeWidth="8"
              fill="transparent"
              className="dark:stroke-gray-600"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={getColor(animatedValue)}
              strokeWidth="8"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
              style={{
                filter: `drop-shadow(0 0 8px ${getColor(animatedValue)}30)`
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              {animatedValue}%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Health Score</span>
          </div>
        </div>
        
        <div className="mt-6 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Poor (0-40)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Fair (40-60)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Good (60-80)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Excellent (80-100)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Heatmap-style visualization for soil parameters across field sections
export function SoilHeatmap() {
  const heatmapData = [
    { section: 'A1', nitrogen: 85, phosphorous: 70, potassium: 90, moisture: 65 },
    { section: 'A2', nitrogen: 78, phosphorous: 82, potassium: 88, moisture: 70 },
    { section: 'A3', nitrogen: 92, phosphorous: 75, potassium: 85, moisture: 60 },
    { section: 'B1', nitrogen: 88, phosphorous: 88, potassium: 92, moisture: 75 },
    { section: 'B2', nitrogen: 82, phosphorous: 78, potassium: 87, moisture: 68 },
    { section: 'B3', nitrogen: 90, phosphorous: 85, potassium: 90, moisture: 72 },
    { section: 'C1', nitrogen: 75, phosphorous: 70, potassium: 82, moisture: 58 },
    { section: 'C2', nitrogen: 80, phosphorous: 75, potassium: 85, moisture: 62 },
    { section: 'C3', nitrogen: 87, phosphorous: 80, potassium: 88, moisture: 65 },
  ];

  const getHeatColor = (value) => {
    const intensity = value / 100;
    if (intensity >= 0.8) return 'bg-green-500';
    if (intensity >= 0.6) return 'bg-yellow-500';
    if (intensity >= 0.4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Field Section Heatmap</h3>
        <p className="text-gray-600 dark:text-gray-300">Nutrient distribution across different field sections</p>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center font-semibold text-gray-700 dark:text-gray-300">Section</div>
        <div className="text-center font-semibold text-gray-700 dark:text-gray-300">Nitrogen</div>
        <div className="text-center font-semibold text-gray-700 dark:text-gray-300">Phosphorous</div>
        <div className="text-center font-semibold text-gray-700 dark:text-gray-300">Potassium</div>
        
        {heatmapData.map((row, index) => (
          <React.Fragment key={index}>
            <div className="text-center font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
              {row.section}
            </div>
            <div className={`text-center font-bold text-white rounded-lg p-3 ${getHeatColor(row.nitrogen)} transition-all duration-300 hover:scale-105`}>
              {row.nitrogen}%
            </div>
            <div className={`text-center font-bold text-white rounded-lg p-3 ${getHeatColor(row.phosphorous)} transition-all duration-300 hover:scale-105`}>
              {row.phosphorous}%
            </div>
            <div className={`text-center font-bold text-white rounded-lg p-3 ${getHeatColor(row.potassium)} transition-all duration-300 hover:scale-105`}>
              {row.potassium}%
            </div>
          </React.Fragment>
        ))}
      </div>
      
      <div className="mt-6 flex justify-center items-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Low (0-40%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Medium (40-60%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Good (60-80%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Excellent (80-100%)</span>
        </div>
      </div>
    </div>
  );
}

// Combined Chart with multiple data representations
export function CombinedChart() {
  const combinedData = [
    { month: 'Jan', temperature: 25, rainfall: 45, soilHealth: 72 },
    { month: 'Feb', temperature: 27, rainfall: 38, soilHealth: 75 },
    { month: 'Mar', temperature: 30, rainfall: 52, soilHealth: 78 },
    { month: 'Apr', temperature: 32, rainfall: 61, soilHealth: 82 },
    { month: 'May', temperature: 35, rainfall: 28, soilHealth: 79 },
    { month: 'Jun', temperature: 33, rainfall: 15, soilHealth: 75 },
  ];

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Climate vs Soil Health</h3>
        <p className="text-gray-600 dark:text-gray-300">Correlation between weather conditions and soil health scores</p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={combinedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="temperatureGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="text-gray-300 dark:text-gray-600" />
            <XAxis dataKey="month" className="text-gray-600 dark:text-gray-400" />
            <YAxis yAxisId="left" className="text-gray-600 dark:text-gray-400" domain={[0, 200]} />
            <YAxis yAxisId="right" orientation="right" className="text-gray-600 dark:text-gray-400" domain={[0, 200]} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="rainfall" 
              fill="#06B6D4" 
              name="Rainfall (mm)"
              radius={[4, 4, 0, 0]}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="temperature" 
              stroke="#EF4444" 
              strokeWidth={3}
              name="Temperature (°C)"
              dot={{ fill: '#EF4444', strokeWidth: 2, r: 6 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="soilHealth" 
              stroke="#10B981" 
              strokeWidth={3}
              name="Soil Health Score"
              dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}