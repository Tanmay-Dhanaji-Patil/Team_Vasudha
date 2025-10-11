"use client";

import { useState } from "react";
import Dashboard from "@/components/Dashboard";
import ValueChart from "@/components/utils/ValueChart";
import ChartsContainer from "@/components/utils/ChartsContainer";
import AuthForm from "@/components/AuthForm";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";

// Send Report Button Component
function SendReportButton({ samples, cropOptions, organicFertilizers, inorganicFertilizers, inorganicPrices, fertilizerType }) {
  const [isLoading, setIsLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');

  const handleSendReport = async () => {
    setIsLoading(true);
    setEmailStatus('');

    try {
      // Group samples by crop for analysis
      const cropGroups = {};
      samples.forEach(sample => {
        if (!cropGroups[sample.crop]) cropGroups[sample.crop] = [];
        cropGroups[sample.crop].push(sample);
      });

      // Calculate total costs
      
      const getStandardValues = (cropName) => cropOptions.find(c => c.name === cropName)?.values || cropOptions[0].values;
      
      // Use selected fertilizer type for pricing
      const prices = fertilizerType === 'organic' ? 
        { nitrogen: organicFertilizers.nitrogen[0].price, phosphorous: organicFertilizers.phosphorous[0].price, potassium: organicFertilizers.potassium[0].price } :
        { nitrogen: inorganicFertilizers.nitrogen[0].price, phosphorous: inorganicFertilizers.phosphorous[0].price, potassium: inorganicFertilizers.potassium[0].price };
      
      let totalCost = 0;
      Object.entries(cropGroups).forEach(([cropName, cropSamples]) => {
        const std = getStandardValues(cropName);
        let cropNitrogen = 0, cropPhosphorous = 0, cropPotassium = 0;
        cropSamples.forEach(sample => {
          cropNitrogen += Math.max(0, std.nitrogen - sample.nitrogen);
          cropPhosphorous += Math.max(0, std.phosphorous - sample.phosphorous);
          cropPotassium += Math.max(0, std.potassium - sample.potassium);
        });
        totalCost += cropNitrogen * prices.nitrogen + cropPhosphorous * prices.phosphorous + cropPotassium * prices.potassium;
      });

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          samples,
          cropGroups,
          totalCost,
          fertilizerType,
          organicFertilizers,
          inorganicFertilizers,
          reportData: {
            totalSamples: samples.length,
            crops: Object.keys(cropGroups),
            generatedDate: new Date().toISOString()
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        setEmailStatus(`✅ Success! Report sent to ${result.emails.length} email(s): ${result.emails.join(', ')}`);
      } else {
        setEmailStatus(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error sending report:', error);
      setEmailStatus(`❌ Error: Failed to send report. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button 
        className={`px-8 py-3 rounded-lg shadow-lg transition-all duration-200 ${
          isLoading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'
        } text-white font-semibold`}
        onClick={handleSendReport}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending Report...
          </>
        ) : (
          '📧 Send Report'
        )}
      </Button>
      
      {emailStatus && (
        <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${
          emailStatus.includes('Success') 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {emailStatus}
        </div>
      )}
    </div>
  );
}

// Chart for each sample input
function SampleBarChart({ sample, standard }) {
  // Prepare chart data
  const chartData = [
    { name: "Nit", Standard: standard.nitrogen, Observed: sample.nitrogen },
    { name: "Pho", Standard: standard.phosphorous, Observed: sample.phosphorous },
    { name: "Pot", Standard: standard.potassium, Observed: sample.potassium },
    { name: "Tem", Standard: standard.temperature, Observed: sample.temperature },
    { name: "Moi", Standard: standard.moisture, Observed: sample.moisture },
    { name: "Soi", Standard: standard.ph, Observed: sample.ph },
  ];
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl border border-white/20 shadow p-6 mb-6" style={{ width: 500, height: 350 }}>
      <div className="text-center font-bold mb-4 text-gray-900 dark:text-white text-xl">Sample: {sample.day}</div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} barCategoryGap={30} barGap={12}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={16} />
          <YAxis fontSize={16} domain={[0, 200]} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: '16px' }} />
          <Bar dataKey="Standard" fill="#fbb02d" radius={[12, 12, 0, 0]} />
          <Bar dataKey="Observed" fill="#10B981" radius={[12, 12, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Home() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);

  // Crop options and fertilizer data
  const cropOptions = [
    { name: "Wheat", values: { nitrogen: 90, phosphorous: 45, potassium: 45, temperature: 25, moisture: 15, ph: 7.0 } },
    { name: "Rice", values: { nitrogen: 110, phosphorous: 50, potassium: 60, temperature: 28, moisture: 20, ph: 6.5 } },
    { name: "Maize", values: { nitrogen: 80, phosphorous: 40, potassium: 50, temperature: 24, moisture: 12, ph: 6.8 } },
  ];

  // Organic fertilizer data based on the provided table
  const organicFertilizers = {
    nitrogen: [
      { name: "Neem Cake Fertilizer", form: "Granules", price: 225, notes: "Natural source of nitrogen, improves soil microbial activity" },
      { name: "Bio NPK Liquid Fertilizer", form: "Liquid", price: 150, notes: "Microbial synthesis of nitrogen, promotes soil health" }
    ],
    phosphorous: [
      { name: "Bone Meal", form: "Powder/Granules", price: 325, notes: "Slow release phosphorus source, improves root development" },
      { name: "Rock Phosphate", form: "Granules", price: 275, notes: "Natural mineral phosphate, slow nutrient release" }
    ],
    potassium: [
      { name: "Wood Ash", form: "Powder", price: 0, notes: "Rich in potash, can be collected from burnt wood" },
      { name: "Seaweed/Kelp Meal", form: "Powder/Granules", price: 400, notes: "Provides potassium and micronutrients, supports plant stress tolerance" }
    ]
  };

  // Inorganic fertilizer data with specific names and prices
  const inorganicFertilizers = {
    nitrogen: [
      { name: "Urea", form: "Granules/Pellets", npk: "46-0-0", price: 5.5, notes: "Most widely used nitrogen fertilizer" },
      { name: "Ammonium Sulfate", form: "Granules", npk: "21-0-0 + Sulfur", price: 9, notes: "Provides nitrogen and sulfur, used for alkaline soils" }
    ],
    phosphorous: [
      { name: "Diammonium Phosphate (DAP)", form: "Granules/Powder", npk: "18-46-0", price: 27.5, notes: "High phosphorus content, also supplies nitrogen" },
      { name: "Single Superphosphate (SSP)", form: "Granules/Powder", npk: "0-16-0 + Calcium", price: 9, notes: "Provides phosphorus and calcium" }
    ],
    potassium: [
      { name: "Potassium Chloride (MOP)", form: "Granules/Powder", npk: "0-0-60", price: 21, notes: "Most common potassium fertilizer" },
      { name: "Potassium Sulfate", form: "Granules/Powder", npk: "0-0-50 + Sulfur", price: 37.5, notes: "Provides potassium and sulfur, used for sensitive crops" }
    ]
  };

  // Inorganic fertilizer prices (existing - keeping for backward compatibility)
  const inorganicPrices = { nitrogen: 7, phosphorous: 8, potassium: 19 };
  const [user, setUser] = useState(null);  // State for all samples entered by user
  const [samples, setSamples] = useState([]);
  const [form, setForm] = useState({ day: '', crop: cropOptions[0].name, nitrogen: '', phosphorous: '', potassium: '', temperature: '', moisture: '', ph: '', email: '' });
  const [finished, setFinished] = useState(false);
  const [showFertilizerModal, setShowFertilizerModal] = useState(false);
  const [fertilizerType, setFertilizerType] = useState(null); // 'organic' or 'inorganic'
  const [selectedCrop, setSelectedCrop] = useState(cropOptions[0].name);

  // Get standard values for selected crop
  const getStandardValues = (cropName) => cropOptions.find(c => c.name === cropName)?.values || cropOptions[0].values;

  // Handle form input change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submit to add sample
  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (!form.day || !form.day.trim()) {
      alert('Please enter a sample number (e.g. S1)');
      return;
    }
    if (!form.email || !form.email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    // Safely parse numeric inputs; fall back to 0 if parsing fails
    const safeNumber = (v) => {
      const n = parseFloat(String(v).trim());
      return Number.isFinite(n) ? n : 0;
    };

    setSamples((prev) => [...prev, {
      day: form.day,
      crop: form.crop,
      nitrogen: safeNumber(form.nitrogen),
      phosphorous: safeNumber(form.phosphorous),
      potassium: safeNumber(form.potassium),
      temperature: safeNumber(form.temperature),
      moisture: safeNumber(form.moisture),
      ph: safeNumber(form.ph),
      email: form.email.trim()
    }]);

    setForm({ day: '', crop: cropOptions[0].name, nitrogen: '', phosphorous: '', potassium: '', temperature: '', moisture: '', ph: '', email: '' });
  };

  // Handle successful login
  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setUser(user);
    setShowAuthForm(false);
    alert(`Welcome back, ${user.name}!`);
  };

  // Handle successful signup
  const handleSignup = (user) => {
    setIsAuthenticated(true);
    setUser(user);
    setShowAuthForm(false);
    alert(`Account created successfully! Welcome ${user.name}!`);
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  // If user is authenticated, show the dashboard
  if (isAuthenticated) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Authentication Section */}
      <div className="flex justify-end p-4">
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-700">
                Welcome, {user?.name}
              </span>
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={handleLogout}
              className="flex items-center gap-2 border-red-400 text-red-700 hover:bg-red-100"
            >
              Logout
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowAuthForm(true)}
            className="flex items-center gap-2 border-blue-400 text-blue-700 hover:bg-blue-100"
          >
            Sign Up / Login
          </Button>
        )}
      </div>

      {/* Modern Authentication Form */}
      <AuthForm
        isOpen={showAuthForm && !isAuthenticated}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onClose={() => setShowAuthForm(false)}
      />
      {/* User Input Form styled as dashboard top card */}
      <section className="relative py-8 px-4 flex flex-col items-center justify-center">
        {!finished && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8 w-full max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Enter Your Soil Sample Data</h2>
            <form onSubmit={handleFormSubmit} className="mb-4 grid grid-cols-2 gap-4 items-center justify-center">
              <div className="col-span-2">
                <label htmlFor="crop" className="font-bold text-gray-700 dark:text-gray-200 mr-2">Select Crop:</label>
                <select id="crop" name="crop" value={form.crop} onChange={handleFormChange} className="border rounded px-4 py-2">
                  {cropOptions.map(crop => (
                    <option key={crop.name} value={crop.name}>{crop.name}</option>
                  ))}
                </select>
              </div>

              <input name="day" type="text" value={form.day} onChange={handleFormChange} placeholder="Sample Number (e.g. S1)" className="border rounded px-4 py-2" required />

              {/* Full-width email input so users can enter the recipient address for the report */}
              <div className="col-span-2">
                <label htmlFor="email" className="sr-only">Email for report</label>
                <input name="email" id="email" type="email" value={form.email} onChange={handleFormChange} placeholder="Email for report (you@example.com)" className="w-full border rounded px-4 py-2" required />
              </div>
              <input name="nitrogen" type="number" min="0" step="0.1" value={form.nitrogen} onChange={handleFormChange} placeholder="Nitrogen" className="border rounded px-4 py-2" />
              <input name="phosphorous" type="number" min="0" step="0.1" value={form.phosphorous} onChange={handleFormChange} placeholder="Phosphorous" className="border rounded px-4 py-2" />
              <input name="potassium" type="number" min="0" step="0.1" value={form.potassium} onChange={handleFormChange} placeholder="Potassium" className="border rounded px-4 py-2" />
              <input name="temperature" type="number" min="-50" max="100" step="0.1" value={form.temperature} onChange={handleFormChange} placeholder="Temperature" className="border rounded px-4 py-2" />
              <input name="moisture" type="number" min="0" max="100" step="0.1" value={form.moisture} onChange={handleFormChange} placeholder="Moisture" className="border rounded px-4 py-2" />
              <input name="ph" type="number" min="0" max="14" step="0.1" value={form.ph} onChange={handleFormChange} placeholder="Soil pH" className="border rounded px-4 py-2" />
              <div className="col-span-2 flex gap-4 justify-center">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 transition">Add Sample</button>
                <button type="button" className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition" onClick={() => setShowFertilizerModal(true)} disabled={samples.length === 0}>Finish</button>
              </div>
            </form>
            {samples.length > 0 && (
              <div className="mt-4">
                <div className="text-lg text-green-700 font-semibold mb-3">
                  {samples.length} sample(s) added.
                </div>
                <div className="flex justify-center">
                  <SendReportButton samples={samples} cropOptions={cropOptions} organicFertilizers={organicFertilizers} inorganicFertilizers={inorganicFertilizers} inorganicPrices={inorganicPrices} fertilizerType={fertilizerType} />
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Main dashboard sections */}
      <section className="max-w-7xl mx-auto px-4 pb-8">
        {/* Soil Parameter Analysis for each sample */}
        {!finished && samples.map((sample, idx) => {
          const std = getStandardValues(sample.crop);
          const chartData = [
            { month: "Nitrogen", desktop: std.nitrogen, mobile: sample.nitrogen },
            { month: "Phosphorous", desktop: std.phosphorous, mobile: sample.phosphorous },
            { month: "Potassium", desktop: std.potassium, mobile: sample.potassium },
            { month: "Temperature", desktop: std.temperature, mobile: sample.temperature },
            { month: "Moisture", desktop: std.moisture, mobile: sample.moisture },
            { month: "Soil pH", desktop: std.ph, mobile: sample.ph },
          ];
          return (
            <div key={idx} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8 mb-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Soil Parameter Analysis for sample {sample.day}</h2>
                <p className="text-gray-600 dark:text-gray-300">Compare standard values with real-time sensor readings</p>
              </div>
              <div className="flex justify-center">
                <ValueChart chartData={chartData} />
              </div>
            </div>
          );
        })}

        {/* Fertilizer Recommendation Table */}
        {finished && fertilizerType && (() => {
          const fertilizers = fertilizerType === 'organic' ? organicFertilizers : inorganicFertilizers;
          const fertilizerTypeName = fertilizerType === 'organic' ? 'Organic' : 'Inorganic';
          
          return (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8 mb-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {fertilizerTypeName} Fertilizer Recommendations
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Recommended {fertilizerTypeName.toLowerCase()} fertilizers for your soil analysis
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="py-4 px-4 border border-gray-300 dark:border-gray-600 font-semibold text-gray-900 dark:text-white">Nutrient</th>
                      <th className="py-4 px-4 border border-gray-300 dark:border-gray-600 font-semibold text-gray-900 dark:text-white">Fertilizer Name</th>
                      <th className="py-4 px-4 border border-gray-300 dark:border-gray-600 font-semibold text-gray-900 dark:text-white">Form</th>
                      <th className="py-4 px-4 border border-gray-300 dark:border-gray-600 font-semibold text-gray-900 dark:text-white">NPK Ratio</th>
                      <th className="py-4 px-4 border border-gray-300 dark:border-gray-600 font-semibold text-gray-900 dark:text-white">Price (₹/kg)</th>
                      <th className="py-4 px-4 border border-gray-300 dark:border-gray-600 font-semibold text-gray-900 dark:text-white">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fertilizers.nitrogen.map((fertilizer, index) => (
                      <tr key={`nitrogen-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Nitrogen (N)</td>
                        <td className="py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium">{fertilizer.name}</td>
                        <td className="py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">{fertilizer.form}</td>
                        <td className="py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">{fertilizer.npk || 'High Nitrogen'}</td>
                        <td className="py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold">₹{fertilizer.price}</td>
                        <td className="py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm">{fertilizer.notes}</td>
                      </tr>
                    ))}
                    {fertilizers.phosphorous.map((fertilizer, index) => (
                      <tr key={`phosphorous-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Phosphorous (P)</td>
                        <td className="py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium">{fertilizer.name}</td>
                        <td className="py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">{fertilizer.form}</td>
                        <td className="py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">{fertilizer.npk || 'High Phosphorous'}</td>
                        <td className="py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold">₹{fertilizer.price}</td>
                        <td className="py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm">{fertilizer.notes}</td>
                      </tr>
                    ))}
                    {fertilizers.potassium.map((fertilizer, index) => (
                      <tr key={`potassium-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Potassium (K)</td>
                        <td className="py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium">{fertilizer.name}</td>
                        <td className="py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">{fertilizer.form}</td>
                        <td className="py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">{fertilizer.npk || 'High Potassium'}</td>
                        <td className="py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold">₹{fertilizer.price}</td>
                        <td className="py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm">{fertilizer.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* Required Addition Graphs after finish */}
        {/* Group samples by crop and show individual graphs for each crop */}
        {finished && (() => {
          // Group samples by crop
          const cropGroups = {};
          samples.forEach(sample => {
            if (!cropGroups[sample.crop]) cropGroups[sample.crop] = [];
            cropGroups[sample.crop].push(sample);
          });
          // Prices per kg for nutrients based on selected fertilizer type
          const prices = fertilizerType === 'organic' ? 
            { nitrogen: organicFertilizers.nitrogen[0].price, phosphorous: organicFertilizers.phosphorous[0].price, potassium: organicFertilizers.potassium[0].price } :
            { nitrogen: inorganicFertilizers.nitrogen[0].price, phosphorous: inorganicFertilizers.phosphorous[0].price, potassium: inorganicFertilizers.potassium[0].price };
          // Render graphs for each crop
          return Object.entries(cropGroups).map(([cropName, cropSamples], i) => {
            const std = getStandardValues(cropName);
            return (
              <div key={cropName} className="mb-16">
                <h2 className="text-3xl font-bold text-orange-600 mb-6 text-center">Required Addition for crop: {cropName}</h2>
                {cropSamples.map((sample, idx) => {
                  const requiredAdditionData = [
                    { month: "Nitrogen", required: Math.max(0, std.nitrogen - sample.nitrogen) },
                    { month: "Phosphorous", required: Math.max(0, std.phosphorous - sample.phosphorous) },
                    { month: "Potassium", required: Math.max(0, std.potassium - sample.potassium) },
                  ];
                  return (
                    <div key={idx} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-orange-400/40 shadow-xl p-8 mb-8">
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-orange-600 mb-2">Sample {sample.day}</h3>
                        <p className="text-gray-600 dark:text-gray-300">Amount needed to reach standard values</p>
                      </div>
                      <div className="flex justify-center">
                        <BarChart width={500} height={300} data={requiredAdditionData} barCategoryGap={30} barGap={12}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" fontSize={16} />
                          <YAxis fontSize={16} domain={[0, 200]} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="required" fill="#F59E0B" radius={[12, 12, 0, 0]} name="Required Addition" />
                        </BarChart>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          });
        })()}

        {/* Overall summary table for all crops and samples */}
  {finished && (() => {
          // Group samples by crop
          const cropGroups = {};
          samples.forEach(sample => {
            if (!cropGroups[sample.crop]) cropGroups[sample.crop] = [];
            cropGroups[sample.crop].push(sample);
          });
          // Prices per kg for nutrients based on selected fertilizer type
          const prices = fertilizerType === 'organic' ? 
            { nitrogen: organicFertilizers.nitrogen[0].price, phosphorous: organicFertilizers.phosphorous[0].price, potassium: organicFertilizers.potassium[0].price } :
            { nitrogen: inorganicFertilizers.nitrogen[0].price, phosphorous: inorganicFertilizers.phosphorous[0].price, potassium: inorganicFertilizers.potassium[0].price };
          // Calculate totals
          let totalNitrogen = 0, totalPhosphorous = 0, totalPotassium = 0, totalCost = 0;
          const cropSummary = Object.entries(cropGroups).map(([cropName, cropSamples]) => {
            const std = getStandardValues(cropName);
            let cropNitrogen = 0, cropPhosphorous = 0, cropPotassium = 0;
            cropSamples.forEach(sample => {
              cropNitrogen += Math.max(0, std.nitrogen - sample.nitrogen);
              cropPhosphorous += Math.max(0, std.phosphorous - sample.phosphorous);
              cropPotassium += Math.max(0, std.potassium - sample.potassium);
            });
            const cropCost = cropNitrogen * prices.nitrogen + cropPhosphorous * prices.phosphorous + cropPotassium * prices.potassium;
            totalNitrogen += cropNitrogen;
            totalPhosphorous += cropPhosphorous;
            totalPotassium += cropPotassium;
            totalCost += cropCost;
            return { cropName, cropNitrogen, cropPhosphorous, cropPotassium, cropCost };
          });
          return (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-green-400/40 shadow-xl p-8 mb-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-green-700 mb-2">Overall Fertilizer Requirement Summary</h2>
                <p className="text-gray-600 dark:text-gray-300">Total amount and cost required for all selected crops</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-center">
                  <thead>
                    <tr>
                      <th className="py-4">Crop</th>
                      <th className="py-4">Nitrogen<br /><span className="text-xs text-gray-500">(kg)</span></th>
                      <th className="py-4">Phosphorous<br /><span className="text-xs text-gray-500">(kg)</span></th>
                      <th className="py-4">Potassium<br /><span className="text-xs text-gray-500">(kg)</span></th>
                      <th className="py-4">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cropSummary.map((row, idx) => (
                      <tr key={row.cropName}>
                        <td className="font-semibold text-blue-600">{row.cropName}</td>
                        <td>{row.cropNitrogen.toFixed(2)}</td>
                        <td>{row.cropPhosphorous.toFixed(2)}</td>
                        <td>{row.cropPotassium.toFixed(2)}</td>
                        <td className="text-green-600 font-bold text-lg">₹{row.cropCost.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-green-50">
                      <td className="font-bold text-green-700 text-lg">Total</td>
                      <td className="text-green-600 font-bold text-lg">{totalNitrogen.toFixed(2)}</td>
                      <td className="text-green-600 font-bold text-lg">{totalPhosphorous.toFixed(2)}</td>
                      <td className="text-green-600 font-bold text-lg">{totalPotassium.toFixed(2)}</td>
                      <td className="text-green-600 font-bold text-2xl">₹{totalCost.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* Advanced Analytics Dashboard */}
        {/* Prompt to send report via email */}
        {finished && samples.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-center">
            <h3 className="text-xl font-bold text-blue-700 mb-2">Send Report via Email</h3>
            <p className="mb-4">Would you like to send the comprehensive soil analysis report to the following email(s)?</p>
            <div className="mb-4 flex flex-wrap gap-2 justify-center">
              {samples.map((s, idx) => (
                <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">{s.email}</span>
              ))}
            </div>
            <SendReportButton samples={samples} cropOptions={cropOptions} organicFertilizers={organicFertilizers} inorganicFertilizers={inorganicFertilizers} inorganicPrices={inorganicPrices} fertilizerType={fertilizerType} />
          </div>
        )}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Advanced Analytics Dashboard
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Comprehensive data visualization with time series, 3D effects, radar analysis, and distribution charts
          </p>
        </div>
  <ChartsContainer samples={samples} />

        {/* Fertilizer Analysis Section removed as per user request */}
      </section>

      {/* Fertilizer Type Selection Modal */}
      {showFertilizerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Select Fertilizer Type</h3>
            <p className="text-gray-600 mb-6 text-center">Choose the type of fertilizer you plan to use for your crops:</p>
            
            <div className="space-y-4">
              <button
                onClick={() => {
                  setFertilizerType('organic');
                  setShowFertilizerModal(false);
                  setFinished(true);
                }}
                className="w-full p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all duration-200 text-left"
              >
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">🌱 Organic Fertilizers</h4>
                    <p className="text-sm text-gray-600">Natural, eco-friendly options like Neem Cake, Bone Meal, Wood Ash</p>
                    <p className="text-xs text-green-600 mt-1">₹150-400 per kg</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setFertilizerType('inorganic');
                  setShowFertilizerModal(false);
                  setFinished(true);
                }}
                className="w-full p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-left"
              >
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">⚗️ Inorganic Fertilizers</h4>
                    <p className="text-sm text-gray-600">Chemical fertilizers with precise NPK ratios</p>
                    <p className="text-xs text-blue-600 mt-1">₹7-19 per kg</p>
                  </div>
                </div>
              </button>
            </div>
            
            <button
              onClick={() => setShowFertilizerModal(false)}
              className="w-full mt-6 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}