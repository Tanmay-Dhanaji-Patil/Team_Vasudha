"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DropdownMenuRadioGroupDemo from "@/components/utils/DropdownMenu";
import ValueChart from "@/components/utils/ValueCharts";
import { TimeSeriesChart, ThreeDAreaChart, SoilHealthRadar, NutrientPieChart } from "@/components/utils/AdvancedCharts";
import { SoilHealthGauge, SoilHeatmap, CombinedChart } from "@/components/utils/InteractiveCharts";
import { useState, useEffect } from "react";

const chartData = [
  { month: "Nitrogen", desktop: 125, mobile: 0 },
  { month: "Phosphorous", desktop: 55, mobile: 0 },
  { month: "Potassium", desktop: 135, mobile: 0 },
  { month: "Temperature", desktop: 32, mobile: 0 },
  { month: "Moisture", desktop: 7, mobile: 0 },
  { month: "Soil pH", desktop: 60, mobile: 0 },
];

const standardValues = [
  {
    name: "Sugarcane",
    values: {
      Nitrogen: 125,
      Phosphorous: 55,
      Potassium: 135,
      Temperature: 32,
      "Soil pH": 7.0,
      Moisture: 60,
    },
  },
  {
    name: "Wheat",
    values: {
      Nitrogen: 105,
      Phosphorous: 55,
      Potassium: 65,
      Temperature: 25,
      "Soil pH": 6.2,
      Moisture: 25,
    },
  },
  {
    name: "Rice",
    values: {
      Nitrogen: 90,
      Phosphorous: 45,
      Potassium: 55,
      Temperature: 31,
      "Soil pH": 6.0,
      Moisture: 70,
    },
  },
  {
    name: "Sorghum",
    values: {
      Nitrogen: 90,
      Phosphorous: 45,
      Potassium: 45,
      Temperature: 33,
      "Soil pH": 6.5,
      Moisture: 30,
    },
  },
  {
    name: "Groundnut",
    values: {
      Nitrogen: 40,
      Phosphorous: 60,
      Potassium: 40,
      Temperature: 22,
      "Soil pH": 6.3,
      Moisture: 35,
    },
  },
];

export default function Home() {
  const [sensorData, setSensorData] = useState(null);
  const [currCrop, setCurrCrop] = useState("Sugarcane");

  const nitro_rate = 7;
  const phos_rate = 8;
  const potas_rate = 19;

  // Check if sensorData is available before accessing it
  const nitro_diff = sensorData
    ? findDeference(chartData[0]["desktop"], sensorData[0])
    : 0;
  const phos_diff = sensorData
    ? findDeference(chartData[1]["desktop"], sensorData[1])
    : 0;
  const potas_diff = sensorData
    ? findDeference(chartData[2]["desktop"], sensorData[2])
    : 0;

  const nitro_cost = nitro_diff * nitro_rate;
  const phos_cost = phos_diff * phos_rate;
  const potas_cost = potas_diff * potas_rate;

  useEffect(() => {
    async function fetchData() {
      const urls = [
        "https://blynk.cloud/external/api/get?token=HD7FULD1O_gX37a_-UxvVPS4Y1XupTki&V1", // * nitrogen
        "https://blynk.cloud/external/api/get?token=HD7FULD1O_gX37a_-UxvVPS4Y1XupTki&v2", // *  phosphorous
        "https://blynk.cloud/external/api/get?token=HD7FULD1O_gX37a_-UxvVPS4Y1XupTki&v3", // * potassium
        "https://blynk.cloud/external/api/get?token=HD7FULD1O_gX37a_-UxvVPS4Y1XupTki&v4", // * temperature
        "https://blynk.cloud/external/api/get?token=HD7FULD1O_gX37a_-UxvVPS4Y1XupTki&v0", // * moisture
        "https://blynk.cloud/external/api/get?token=HD7FULD1O_gX37a_-UxvVPS4Y1XupTki&v5", // * pH
      ];
      try {
        const responses = await Promise.all(urls.map((url) => fetch(url)));
        const data = await Promise.all(
          responses.map((response) => response.json())
        );

        // Process the data to ensure we have numeric values
        const processedData = data.map((item, index) => {
          // If the response is an object with an error property, handle it
          if (typeof item === 'object' && item !== null) {
            if ('error' in item) {
              console.warn(`API error for sensor ${index}:`, item.error);
              return 0; // Return default value
            }
            // If it's an object but not an error, try to extract the value
            if ('value' in item) {
              return parseFloat(item.value) || 0;
            }
            // If it's just a plain object, try to convert to number
            return parseFloat(item) || 0;
          }
          // If it's already a primitive, ensure it's a number
          return parseFloat(item) || 0;
        });

        chartData[0]["mobile"] = processedData[0];
        chartData[1]["mobile"] = processedData[1];
        chartData[2]["mobile"] = processedData[2];
        chartData[3]["mobile"] = processedData[3];
        chartData[4]["mobile"] = processedData[4];
        chartData[5]["mobile"] = processedData[5];
        setSensorData(processedData);
      } catch (error) {
        console.error("Error fetching sensor data:", error);
        setSensorData(null);
      }
    }

    fetchData();
  }, []);

  // useEffect(
  //   (_) => {
  //     nitro_diff = 0;
  //     phos_diff = 0;
  //     potas_diff = 0;
  //     nitro_cost = 0;
  //     phos_cost = 0;
  //     potas_cost = 0;
  //   },
  //   [sensorData]
  // );

  // console.log(sensorData);

  function findDeference(a, b) {
    const d = a - b;
    return d > 0 ? d : 0;
  }

  function updateCropState(selectedCrop) {
    // Find the selected crop object from standardValues
    const cropData = standardValues.find((crop) => crop.name === selectedCrop);

    // Update chartData with the selected crop's values
    chartData.forEach((item) => {
      // Use desktop for standard values
      item.desktop = cropData.values[item.month];
    });

    setCurrCrop(selectedCrop);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-green-900/20 dark:to-blue-900/20">
      {/* Hero Section */}
      <section className="relative py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full text-sm font-medium text-green-800 dark:text-green-300 mb-6 animate-float">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Real-time Soil Monitoring
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-6">
            Smart Agriculture
            <span className="block text-3xl md:text-5xl mt-2">Soil Health Analytics</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Monitor soil nutrients, analyze crop requirements, and optimize fertilizer usage with our intelligent IoT-powered system.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
              Current Crop: <span className="font-semibold ml-1 text-gray-700 dark:text-gray-300">{currCrop}</span>
            </div>
            <DropdownMenuRadioGroupDemo
              state={currCrop}
              setState={updateCropState}
              data={standardValues}
            />
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Real-time Monitoring</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Continuous tracking of soil nutrients, pH levels, and environmental conditions.</p>
            </div>
            
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Smart Analytics</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">AI-powered insights for optimal crop selection and fertilizer recommendations.</p>
            </div>
            
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Cost Optimization</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Calculate precise fertilizer requirements and costs for maximum efficiency.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Chart Section */}
      <section className="px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Soil Parameter Analysis</h2>
              <p className="text-gray-600 dark:text-gray-300">Compare standard values with real-time sensor readings</p>
            </div>
            <div className="flex justify-center">
              <ValueChart chartData={chartData} />
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Charts Section */}
      <section className="px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Advanced Analytics Dashboard
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Comprehensive data visualization with time series, 3D effects, radar analysis, and distribution charts
            </p>
          </div>

          {/* Time Series Chart */}
          <div className="mb-8">
            <TimeSeriesChart />
          </div>

          {/* 3D Area Chart and Radar Chart Side by Side */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <ThreeDAreaChart />
            <SoilHealthRadar />
          </div>

          {/* Nutrient Distribution Pie Chart */}
          <div className="flex justify-center mb-8">
            <div className="w-full max-w-2xl">
              <NutrientPieChart />
            </div>
          </div>

          {/* Interactive Charts Section */}
          <div className="space-y-8">
            {/* Soil Health Gauge and Heatmap */}
            <div className="grid lg:grid-cols-2 gap-8">
              <SoilHealthGauge value={85} />
              <SoilHeatmap />
            </div>

            {/* Combined Climate Chart */}
            <CombinedChart />
          </div>
        </div>
      </section>
      {/* Fertilizer Analysis Section */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Fertilizer Analysis</h2>
              <p className="text-gray-600 dark:text-gray-300">Comprehensive fertilizer requirement and cost analysis per hectare</p>
            </div>
            
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-b-2 border-gray-200 dark:border-gray-700">
                    <TableHead className="text-left font-semibold text-gray-900 dark:text-white py-4">Reading Type</TableHead>
                    <TableHead className="text-center font-semibold text-gray-900 dark:text-white py-4">
                      <div className="flex flex-col items-center">
                        <span>Nitrogen</span>
                        <span className="text-xs text-gray-500 font-normal">(ppm)</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center font-semibold text-gray-900 dark:text-white py-4">
                      <div className="flex flex-col items-center">
                        <span>Phosphorous</span>
                        <span className="text-xs text-gray-500 font-normal">(ppm)</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center font-semibold text-gray-900 dark:text-white py-4">
                      <div className="flex flex-col items-center">
                        <span>Potassium</span>
                        <span className="text-xs text-gray-500 font-normal">(ppm)</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right font-semibold text-gray-900 dark:text-white py-4">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <TableCell className="font-semibold py-6 text-blue-600 dark:text-blue-400">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                        Standard Values
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-6 font-mono text-lg">
                      {typeof chartData[0]["desktop"] === 'number' ? chartData[0]["desktop"] : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center py-6 font-mono text-lg">
                      {typeof chartData[1]["desktop"] === 'number' ? chartData[1]["desktop"] : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center py-6 font-mono text-lg">
                      {typeof chartData[2]["desktop"] === 'number' ? chartData[2]["desktop"] : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right py-6 text-gray-500">-</TableCell>
                  </TableRow>
                  
                  {sensorData ? (
                    <>
                      <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <TableCell className="font-semibold py-6 text-green-600 dark:text-green-400">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                            Current Readings
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-6 font-mono text-lg">
                          {typeof sensorData[0] === 'number' ? sensorData[0].toFixed(1) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-center py-6 font-mono text-lg">
                          {typeof sensorData[1] === 'number' ? sensorData[1].toFixed(1) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-center py-6 font-mono text-lg">
                          {typeof sensorData[2] === 'number' ? sensorData[2].toFixed(1) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right py-6 text-gray-500">-</TableCell>
                      </TableRow>
                      
                      <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors bg-orange-50 dark:bg-orange-900/20">
                        <TableCell className="font-semibold py-6 text-orange-600 dark:text-orange-400">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                            Required Addition
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-6 font-mono text-lg font-semibold">
                          {typeof nitro_diff === 'number' ? nitro_diff.toFixed(1) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-center py-6 font-mono text-lg font-semibold">
                          {typeof phos_diff === 'number' ? phos_diff.toFixed(1) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-center py-6 font-mono text-lg font-semibold">
                          {typeof potas_diff === 'number' ? potas_diff.toFixed(1) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right py-6 text-gray-500">-</TableCell>
                      </TableRow>
                      
                      <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors bg-green-50 dark:bg-green-900/20 border-t-2 border-green-200 dark:border-green-700">
                        <TableCell className="font-bold py-6 text-green-700 dark:text-green-300 text-lg">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-600 rounded-full mr-3"></div>
                            Estimated Cost
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-6">
                          <div className="font-bold text-lg text-green-600 dark:text-green-400">
                            ₹{typeof nitro_cost === 'number' ? nitro_cost.toFixed(2) : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">@₹{nitro_rate}/kg</div>
                        </TableCell>
                        <TableCell className="text-center py-6">
                          <div className="font-bold text-lg text-green-600 dark:text-green-400">
                            ₹{typeof phos_cost === 'number' ? phos_cost.toFixed(2) : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">@₹{phos_rate}/kg</div>
                        </TableCell>
                        <TableCell className="text-center py-6">
                          <div className="font-bold text-lg text-green-600 dark:text-green-400">
                            ₹{typeof potas_cost === 'number' ? potas_cost.toFixed(2) : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">@₹{potas_rate}/kg</div>
                        </TableCell>
                        <TableCell className="text-right py-6">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            ₹{typeof nitro_cost === 'number' && typeof phos_cost === 'number' && typeof potas_cost === 'number' ? (nitro_cost + phos_cost + potas_cost).toFixed(2) : 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">per hectare</div>
                        </TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <>
                      {[1, 2, 3].map((i) => (
                        <TableRow key={i} className="animate-pulse">
                          <TableCell className="py-6">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full mr-3"></div>
                              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-6">
                            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16 mx-auto"></div>
                          </TableCell>
                          <TableCell className="text-center py-6">
                            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16 mx-auto"></div>
                          </TableCell>
                          <TableCell className="text-center py-6">
                            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16 mx-auto"></div>
                          </TableCell>
                          <TableCell className="text-right py-6">
                            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20 ml-auto"></div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {sensorData && (
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-2xl border border-blue-200 dark:border-blue-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">💡 Recommendations</h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Apply fertilizers in split doses for better nutrient absorption
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Monitor soil moisture levels before and after fertilizer application
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Consider organic supplements alongside chemical fertilizers
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}