"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";



// Radar chart data for soil health parameters
const radarData = [
  { parameter: 'Nitrogen', value: 85, fullMark: 100 },
  { parameter: 'Phosphorous', value: 75, fullMark: 100 },
  { parameter: 'Potassium', value: 90, fullMark: 100 },
  { parameter: 'pH Level', value: 80, fullMark: 100 },
  { parameter: 'Moisture', value: 70, fullMark: 100 },
  { parameter: 'Temperature', value: 88, fullMark: 100 },
];

// Pie chart data for nutrient distribution
const pieData = [
  { name: 'Nitrogen', value: 35, color: '#10B981' },
  { name: 'Phosphorous', value: 25, color: '#3B82F6' },
  { name: 'Potassium', value: 30, color: '#F59E0B' },
  { name: 'Others', value: 10, color: '#8B5CF6' },
];

// Time series chart component
export function TimeSeriesChart({ timeSeriesData }) {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nutrient Trends over sample</h3>
        <p className="text-gray-600 dark:text-gray-300">Historical data showing nutrient level changes over time</p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timeSeriesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="nitrogenGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="phosphorousGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="potassiumGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="text-gray-300 dark:text-gray-600" />
            <XAxis dataKey="day" className="text-gray-600 dark:text-gray-400" />
            <YAxis className="text-gray-600 dark:text-gray-400" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="nitrogen" 
              stroke="#10B981" 
              strokeWidth={3}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
              name="Nitrogen"
            />
            <Line 
              type="monotone" 
              dataKey="phosphorous" 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
              name="Phosphorous"
            />
            <Line 
              type="monotone" 
              dataKey="potassium" 
              stroke="#F59E0B" 
              strokeWidth={3}
              dot={{ fill: '#F59E0B', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }}
              name="Potassium"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// 3D-style area chart component
export function ThreeDAreaChart({ timeSeriesData }) {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Environmental Conditions</h3>
        <p className="text-gray-600 dark:text-gray-300">Temperature and moisture levels with 3D visualization effect</p>
      </div>
      <div className="h-80 transform perspective-1000 rotate-x-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeSeriesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="temperatureArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="moistureArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.1}/>
              </linearGradient>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="3" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.3"/>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="text-gray-300 dark:text-gray-600" />
            <XAxis dataKey="day" className="text-gray-600 dark:text-gray-400" />
            <YAxis className="text-gray-600 dark:text-gray-400" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="temperature" 
              stackId="1"
              stroke="#EF4444" 
              fill="url(#temperatureArea)"
              strokeWidth={2}
              name="Temperature (°C)"
              filter="url(#shadow)"
            />
            <Area 
              type="monotone" 
              dataKey="moisture" 
              stackId="2"
              stroke="#06B6D4" 
              fill="url(#moistureArea)"
              strokeWidth={2}
              name="Moisture (%)"
              filter="url(#shadow)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Radar chart for soil health analysis
export function SoilHealthRadar() {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Soil Health Radar</h3>
        <p className="text-gray-600 dark:text-gray-300">Comprehensive soil parameter analysis in radar view</p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
            <defs>
              <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <PolarGrid gridType="polygon" className="text-gray-300 dark:text-gray-600" />
            <PolarAngleAxis dataKey="parameter" className="text-gray-600 dark:text-gray-400" />
            <PolarRadiusAxis domain={[0, 100]} tickCount={5} className="text-gray-600 dark:text-gray-400" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Radar
              name="Soil Health Score"
              dataKey="value"
              stroke="#8B5CF6"
              fill="url(#radarGradient)"
              strokeWidth={3}
              dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Animated pie chart for nutrient distribution
export function NutrientPieChart() {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nutrient Distribution</h3>
        <p className="text-gray-600 dark:text-gray-300">Current soil nutrient composition breakdown</p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <filter id="pieGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#000" floodOpacity="0.3"/>
              </filter>
            </defs>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={40}
              paddingAngle={5}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
              filter="url(#pieGlow)"
            >
              {pieData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value) => [`${value}%`, 'Percentage']}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              wrapperStyle={{ paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function ChartsContainer() {
  // State for dynamic sample count
  const [sampleCount, setSampleCount] = useState(7);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <label htmlFor="sampleCount" style={{ fontWeight: "bold", marginRight: "8px" }}>
          Number of samples:
        </label>
        <input
          id="sampleCount"
          type="number"
          min={1}
          value={sampleCount}
          onChange={e => setSampleCount(Number(e.target.value))}
          style={{
            padding: "6px 12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            width: "80px"
          }}
        />
      </div>
      <TimeSeriesChart sampleCount={sampleCount} />
      <ThreeDAreaChart sampleCount={sampleCount} />
      <SoilHealthRadar />
      <NutrientPieChart />
    </div>
  );
}