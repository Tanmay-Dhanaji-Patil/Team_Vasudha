import React from "react";
import { TimeSeriesChart, ThreeDAreaChart, SoilHealthRadar, NutrientPieChart } from "./AdvancedCharts";

export default function ChartsContainer({ samples = [] }) {
  // Convert samples to timeSeriesData format for charts
  const timeSeriesData = samples.map((s, i) => ({
    day: s.day || `S${i + 1}`,
    nitrogen: Number(s.nitrogen) || 0,
    phosphorous: Number(s.phosphorous) || 0,
    potassium: Number(s.potassium) || 0,
    temperature: Number(s.temperature) || 0,
    moisture: Number(s.moisture) || 0,
    ph: Number(s.ph) || 0
  }));

  return (
    <div>
      <TimeSeriesChart timeSeriesData={timeSeriesData} />
      <ThreeDAreaChart timeSeriesData={timeSeriesData} />
      <SoilHealthRadar />
      <NutrientPieChart />
    </div>
  );
}