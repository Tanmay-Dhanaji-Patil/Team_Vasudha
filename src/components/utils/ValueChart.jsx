"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  desktop: {
    label: "Standard",
    color: "#fbb02d",
  },
  mobile: {
    label: "Observed",
    color: "#7cb518",
  },
};

function ValueChart({ chartData }) {
  return (
    <div className="w-full max-w-4xl">
      <ChartContainer config={chartConfig} className="min-h-[400px] w-full bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-lg">
        <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barCategoryGap={30} barGap={8}>
          <defs>
            <linearGradient id="standardBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbb02d" />
              <stop offset="100%" stopColor="#fbb02d33" />
            </linearGradient>
            <linearGradient id="observedBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7cb518" />
              <stop offset="100%" stopColor="#7cb51833" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="currentColor" className="text-gray-300 dark:text-gray-600" />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={15}
            axisLine={false}
            tickFormatter={(value) => value.slice(0, 3)}
            className="text-gray-600 dark:text-gray-400"
            fontSize={12}
          />
          <ChartTooltip 
            content={<ChartTooltipContent 
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl rounded-xl"
              formatter={(value, name) => [`${value}`, name === 'desktop' ? 'Standard' : 'Observed']}
              labelFormatter={(label) => `Parameter: ${label}`}
            />} 
          />
          <ChartLegend content={<ChartLegendContent className="text-gray-700 dark:text-gray-300" />} />
          <Bar 
            dataKey="desktop" 
            fill="url(#standardBar)"
            radius={[12, 12, 0, 0]}
            className="drop-shadow-lg"
            isAnimationActive={true}
            animationDuration={1200}
          />
          <Bar 
            dataKey="mobile" 
            fill="url(#observedBar)"
            radius={[12, 12, 0, 0]}
            className="drop-shadow-lg"
            isAnimationActive={true}
            animationDuration={1200}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

export default ValueChart;
