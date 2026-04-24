"use client";

import { useState } from "react";
import Link from "next/link";
import Dashboard from "@/components/Dashboard";
import ValueChart from "@/components/utils/ValueChart";
import ChartsContainer from "@/components/utils/ChartsContainer";
import AuthForm from "@/components/AuthForm";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";

/**
 * Component: SendReportButton
 * Purpose: Analyzes aggregated soil telemetry and transmits a comprehensive
 *          agricultural evaluation report to the user's registered email.
 * 
 * Logic Overview:
 * 1. Categorizes soil samples by crop affinity.
 * 2. Benchmarks current nutrient levels against target crop standards.
 * 3. Quantifies nutrient deficits and extrapolates investment requirements.
 * 4. Dispatches the finalized projection via the background mail service.
 * 
 * @param {Object} props - Telemetry data and fertilizer price catalogs.
 */
function SendReportButton({ samples, cropOptions, organicFertilizers, inorganicFertilizers, inorganicPrices, fertilizerType }) {
  const [isLoading, setIsLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');
  const [language, setLanguage] = useState('en');

  const handleSendReport = async () => {
    setIsLoading(true);
    setEmailStatus('');

    try {
      // Group soil samples by crop for analysis
      const cropGroups = {};
      samples.filter(s => s.type === 'soil' || s.type === undefined).forEach(sample => {
        if (!cropGroups[sample.crop]) cropGroups[sample.crop] = [];
        cropGroups[sample.crop].push(sample);
      });

      // Calculate total costs

      /**
       * Report Generation Payload
       * Prepares a localized dataset by calculating nutrient gaps and mapping
       * current market prices to the required supplement volume.
       */
      const getStandardValues = (cropName) => cropOptions.find(c => c.name === cropName)?.values || cropOptions[0].values;

      const prices = fertilizerType === 'organic' ?
        { nitrogen: organicFertilizers.nitrogen[0].price, phosphorous: organicFertilizers.phosphorous[0].price, potassium: organicFertilizers.potassium[0].price } :
        { nitrogen: inorganicFertilizers.nitrogen[0].price, phosphorous: inorganicFertilizers.phosphorous[0].price, potassium: inorganicFertilizers.potassium[0].price };

      let totalCost = 0;
      Object.entries(cropGroups).forEach(([cropName, cropSamples]) => {
        const std = getStandardValues(cropName);
        let cropNitrogen = 0, cropPhosphorous = 0, cropPotassium = 0;
        cropSamples.forEach(sample => {
          /**
           * Deficit Calculation
           * Only positive gaps ( nutrient goal > current level) are considered
           * for investment estimation.
           */
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
          language,
          reportData: {
            totalSamples: samples.filter(s => s.type === 'soil' || s.type === undefined).length,
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
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
        <label htmlFor="language-select" className="text-sm font-medium text-gray-700">Report Language:</label>
        <select
          id="language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="text-sm border-none focus:ring-0 cursor-pointer font-semibold text-blue-600"
        >
          <option value="en">English (default)</option>
          <option value="hi">Hindi (हिंदी)</option>
          <option value="mr">Marathi (मराठी)</option>
          <option value="gu">Gujarati (ગુજરાતી)</option>
          <option value="te">Telugu (తెలుగు)</option>
          <option value="ta">Tamil (தமிழ்)</option>
          <option value="kn">Kannada (ಕನ್ನಡ)</option>
          <option value="bn">Bengali (বাংলা)</option>
        </select>
      </div>

      <Button
        className={`px-8 py-3 rounded-lg shadow-lg transition-all duration-200 ${isLoading
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
        <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${emailStatus.includes('Success')
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
    { name: "EC", Standard: standard.ec ?? 0, Observed: sample.soil_ec ?? 0 },
    { name: "Hum", Standard: standard.humidity ?? 0, Observed: sample.soil_humidity ?? 0 },
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
  const [form, setForm] = useState({ day: '', crop: cropOptions[0].name, nitrogen: '', phosphorous: '', potassium: '', temperature: '', moisture: '', soil_ec: '', soil_humidity: '', ph: '', water_ph: '', email: '' });
  // inputMode: one of 'manual-soil' | 'manual-water' | 'thingspeak-soil' | 'thingspeak-water'
  const [inputMode, setInputMode] = useState('manual-soil');
  const [tsChannelId, setTsChannelId] = useState('');
  const [tsLoading, setTsLoading] = useState(false);
  const [tsError, setTsError] = useState(null);
  const [finished, setFinished] = useState(false);
  const [showFertilizerModal, setShowFertilizerModal] = useState(false);
  const [fertilizerType, setFertilizerType] = useState(null); // 'organic' or 'inorganic'
  const [selectedCrop, setSelectedCrop] = useState(cropOptions[0].name);
  const [mlPredictions, setMlPredictions] = useState(null);
  const [mlFeatures, setMlFeatures] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState(null);
  const [isMapping, setIsMapping] = useState(false);

  // Appointment ID step states
  const [appointmentId, setAppointmentId] = useState('');
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [appointmentError, setAppointmentError] = useState('');
  const [showAppointmentStep, setShowAppointmentStep] = useState(true);

  // Get standard values for selected crop
  const getStandardValues = (cropName) => cropOptions.find(c => c.name === cropName)?.values || cropOptions[0].values;

  // Handle appointment ID validation
  const handleAppointmentValidation = async () => {
    if (!appointmentId.trim()) {
      setAppointmentError('Please enter an appointment ID');
      return;
    }

    setAppointmentLoading(true);
    setAppointmentError('');

    try {
      const response = await fetch(`/api/appointment/${appointmentId.trim()}`);
      const result = await response.json();

      if (result.success) {
        setAppointmentDetails(result.appointment);
        setShowAppointmentStep(false);
        setAppointmentError('');
      } else {
        setAppointmentError(result.message || 'Invalid appointment ID');
      }
    } catch (error) {
      console.error('Error validating appointment:', error);
      setAppointmentError('Failed to validate appointment. Please try again.');
    } finally {
      setAppointmentLoading(false);
    }
  };

  // Handle form input change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Get ML model predictions
  const getMLPredictions = async () => {
    if (!inputMode || !inputMode.endsWith('soil')) {
      setMlError('ML predictions are only available for soil samples');
      return;
    }

    // Validate required fields
    if (!form.nitrogen || !form.phosphorous || !form.potassium || !form.ph || !form.moisture || !form.temperature) {
      setMlError('Please fill in all required soil sensor fields (Nitrogen, Phosphorous, Potassium, pH, Moisture, Temperature)');
      return;
    }

    setMlLoading(true);
    setMlError(null);
    setMlPredictions(null);

    try {
      const response = await fetch('/api/ml-recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nitrogen: form.nitrogen,
          phosphorous: form.phosphorous,
          potassium: form.potassium,
          ph: form.ph,
          moisture: form.moisture,
          soil_ec: form.soil_ec || 0,
          temperature: form.temperature,
          crop: form.crop
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMlPredictions(result.predictions);
        setMlFeatures(result.features);
        setMlError(null);
      } else {
        setMlError(result.error || 'Failed to get ML predictions');
        setMlPredictions(null);
        setMlFeatures(null);
      }
    } catch (error) {
      console.error('ML prediction error:', error);
      setMlError('Failed to connect to ML model. Please check if Python is installed and the model files are present.');
      setMlPredictions(null);
    } finally {
      setMlLoading(false);
    }
  };

  // Handle form submit to add sample
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!form.day) return;
    if (inputMode && inputMode.endsWith('soil')) {
      setSamples((prev) => [...prev, {
        day: form.day,
        type: 'soil',
        crop: form.crop,
        nitrogen: Number(form.nitrogen),
        phosphorous: Number(form.phosphorous),
        potassium: Number(form.potassium),
        temperature: Number(form.temperature),
        moisture: Number(form.moisture),
        soil_ec: form.soil_ec ? Number(form.soil_ec) : null,
        soil_humidity: form.soil_humidity ? Number(form.soil_humidity) : null,
        ph: Number(form.ph),
        email: form.email,
        appointmentId: appointmentId,
        farmerId: appointmentDetails?.farmer?.id,
        plotId: appointmentDetails?.plot?.id,
        mlPredictions: mlPredictions, // Include ML predictions if available
        mlFeatures: mlFeatures // Include ML features if available
      }]);
      setForm({ day: '', crop: cropOptions[0].name, nitrogen: '', phosphorous: '', potassium: '', temperature: '', moisture: '', soil_ec: '', soil_humidity: '', ph: '', water_ph: '', email: '' });
      setMlPredictions(null); // Clear predictions after adding sample
      setMlFeatures(null); // Clear features after adding sample
    } else {
      setSamples((prev) => [...prev, {
        day: form.day,
        type: 'water',
        water_ph: Number(form.water_ph),
        email: form.email,
        appointmentId: appointmentId,
        farmerId: appointmentDetails?.farmer?.id,
        plotId: appointmentDetails?.plot?.id
      }]);
      setForm({ day: '', crop: cropOptions[0].name, nitrogen: '', phosphorous: '', potassium: '', temperature: '', moisture: '', soil_ec: '', soil_humidity: '', ph: '', water_ph: '', email: '' });
    }
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
      {/* Calculating Alert Overlay */}
      {isMapping && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] transition-all duration-500">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-blue-100 flex flex-col items-center max-w-xs w-full animate-in zoom-in duration-300">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Calculating</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
              Please wait while we process the sensors data mapping...
            </p>
            <div className="mt-6 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-600 h-full animate-progress-fast"></div>
            </div>
            <p className="text-xs text-blue-500 mt-3 font-medium uppercase tracking-wider">Estimated: 10 seconds</p>
          </div>
        </div>
      )}

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
      {/* Appointment ID Input Step */}
      {showAppointmentStep && (
        <section className="relative py-8 px-4 flex flex-col items-center justify-center">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8 w-full max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Enter Appointment ID</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Please enter your appointment ID to access the soil sample data form
            </p>

            <div className="flex flex-col items-center gap-4">
              <input
                type="text"
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                placeholder="Enter Appointment ID"
                className="border rounded px-4 py-3 w-full max-w-md text-center text-lg"
                onKeyPress={(e) => e.key === 'Enter' && handleAppointmentValidation()}
              />

              <button
                onClick={handleAppointmentValidation}
                disabled={appointmentLoading}
                className={`px-8 py-3 rounded-lg shadow-lg transition-all duration-200 ${appointmentLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'
                  } text-white font-semibold`}
              >
                {appointmentLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Validating...
                  </>
                ) : (
                  'Validate Appointment'
                )}
              </button>

              {appointmentError && (
                <div className="text-red-600 bg-red-50 border border-red-200 rounded px-4 py-2 max-w-md">
                  {appointmentError}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Farmer Summary Display */}
      {appointmentDetails && !showAppointmentStep && (
        <section className="relative py-8 px-4 flex flex-col items-center justify-center">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8 w-full max-w-4xl text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Farmer Summary</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Farmer Information */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-green-800 mb-4">Farmer Information</h3>
                <div className="text-left space-y-2">
                  <p><span className="font-semibold">Name:</span> {appointmentDetails.farmer?.Farmer_name || 'N/A'}</p>
                  <p><span className="font-semibold">Email:</span> {appointmentDetails.farmer?.Farmer_email || 'N/A'}</p>
                  <p><span className="font-semibold">Phone:</span> {appointmentDetails.farmer?.Phone_number || 'N/A'}</p>
                  <p><span className="font-semibold">Location:</span> {appointmentDetails.farmer?.location || 'N/A'}</p>
                </div>
              </div>

              {/* Appointment & Plot Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-800 mb-4">Appointment & Plot Details</h3>
                <div className="text-left space-y-2">
                  <p><span className="font-semibold">Appointment Date:</span> {appointmentDetails.appointmentDate || 'N/A'}</p>
                  <p><span className="font-semibold">Appointment Time:</span> {appointmentDetails.appointmentTime || 'N/A'}</p>
                  <p><span className="font-semibold">Plot Number:</span> {appointmentDetails.plot?.['Plot Number'] || 'N/A'}</p>
                  <p><span className="font-semibold">Plot Area:</span> {appointmentDetails.plotArea || appointmentDetails.plot?.['Area of Plot'] || 'N/A'}</p>
                  <p><span className="font-semibold">Category:</span> {appointmentDetails.plot?.Category || 'N/A'}</p>
                  <p><span className="font-semibold">Location:</span> {appointmentDetails.plot?.['Village Name'] ?
                    `${appointmentDetails.plot['Village Name']}, ${appointmentDetails.plot.Taluka}, ${appointmentDetails.plot.District}, ${appointmentDetails.plot.State}` : 'N/A'}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAppointmentStep(true)}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Change Appointment ID
            </button>
          </div>
        </section>
      )}

      {/* User Input Form styled as dashboard top card */}
      <section className="relative py-8 px-4 flex flex-col items-center justify-center">
        {!finished && !showAppointmentStep && (
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
              {/* Input mode selection */}
              <div className="col-span-2 flex items-center gap-4">
                <label className="flex items-center gap-3">
                  <input type="radio" name="inputMode" checked={inputMode === 'manual-soil'} onChange={() => setInputMode('manual-soil')} />
                  <span className="text-sm">Manual — Soil</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="radio" name="inputMode" checked={inputMode === 'manual-water'} onChange={() => setInputMode('manual-water')} />
                  <span className="text-sm">Manual — Water (water pH)</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="radio" name="inputMode" checked={inputMode === 'thingspeak-soil'} onChange={() => setInputMode('thingspeak-soil')} />
                  <span className="text-sm">ThingSpeak — Soil</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="radio" name="inputMode" checked={inputMode === 'thingspeak-water'} onChange={() => setInputMode('thingspeak-water')} />
                  <span className="text-sm">ThingSpeak — Water</span>
                </label>
              </div>

              {/* ThingSpeak input and buttons - properly aligned with form grid */}
              {(inputMode === 'thingspeak-soil' || inputMode === 'thingspeak-water') && (
                <div className="col-span-2 flex items-center gap-3">
                  <input
                    placeholder="ThingSpeak channel id"
                    value={tsChannelId}
                    onChange={(e) => setTsChannelId(e.target.value)}
                    className="border rounded px-3 py-2 flex-1"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      setTsError(null);
                      if (!tsChannelId) return setTsError('Enter channel id');
                      setTsLoading(true);
                      let channelData = null;
                      let last = null;
                      try {
                        console.group('🚀 ThingSpeak API Debug');
                        console.log('Channel ID:', tsChannelId);

                        // First try client-side public fetch (fast path)
                        try {
                          console.log('📡 Attempting client-side fetch...');
                          const channelUrl = `https://api.thingspeak.com/channels/${encodeURIComponent(tsChannelId)}.json`;
                          console.log('Channel URL:', channelUrl);

                          const chRes = await fetch(channelUrl);
                          console.log('Channel response status:', chRes.status, chRes.statusText);

                          if (!chRes.ok) throw new Error(`Channel fetch failed: ${chRes.status}`);
                          channelData = await chRes.json();
                          console.log('Channel data received:', channelData);

                          const feedUrl = `https://api.thingspeak.com/channels/${encodeURIComponent(tsChannelId)}/feeds.json?results=1`;
                          console.log('Feed URL:', feedUrl);

                          const feedRes = await fetch(feedUrl);
                          console.log('Feed response status:', feedRes.status, feedRes.statusText);

                          if (feedRes.ok) {
                            const feedData = await feedRes.json().catch(() => null);
                            console.log('Feed data received:', feedData);
                            last = feedData?.feeds?.[0] ?? null;
                            console.log('Last feed:', last);
                            if (last) channelData.feeds = feedData.feeds;
                          } else {
                            console.log('Feed fetch failed:', feedRes.status, feedRes.statusText);
                          }
                        } catch (clientErr) {
                          // If client can't fetch (CORS or private channel), fallback to server-side fetch
                          console.log('❌ Client-side fetch failed:', clientErr?.message ?? clientErr);
                          console.log('🔄 Falling back to server-side fetch...');

                          const serverUrl = `/api/thingspeak?id=${encodeURIComponent(tsChannelId)}&fetch=1`;
                          console.log('Server URL:', serverUrl);

                          const apiRes = await fetch(serverUrl);
                          console.log('Server response status:', apiRes.status, apiRes.statusText);

                          if (!apiRes.ok) {
                            const txt = await apiRes.text().catch(() => '');
                            throw new Error(`Server fetch failed: ${apiRes.status} ${txt}`);
                          }
                          const apiJson = await apiRes.json();
                          console.log('Server response:', apiJson);

                          if (!apiJson?.success) throw new Error(apiJson?.message || 'Server fetch returned an error');
                          channelData = apiJson.channel;
                          last = (channelData?.feeds && channelData.feeds[0]) || null;
                          console.log('Server channel data:', channelData);
                          console.log('Server last feed:', last);
                        }

                        if (!channelData) {
                          console.log('❌ No channel data returned, trying with sample data...');

                          // Test with sample data matching your ThingSpeak field names
                          channelData = {
                            id: 3110372,
                            name: "VASUDHA 1",
                            description: "SOIL PARAMETERS",
                            field1: "SOIL NITROGEN",
                            field2: "SOIL PHOSPHOROUS",
                            field3: "SOIL POTASSIUM",
                            field4: "SOIL pH",
                            field5: "SOIL TEMPERATURE",
                            field6: "SOIL MOISTURE",
                            field7: "SOIL EC",
                            field8: "SOIL HUMIDITY"
                          };

                          last = {
                            field1: "68.4",    // soilMoisture (but field is named "SOIL NITROGEN")
                            field2: "50",      // N (but field is named "SOIL PHOSPHOROUS")
                            field3: "20",      // P (but field is named "SOIL POTASSIUM")
                            field4: "40",      // K (but field is named "SOIL pH")
                            field5: "25",     // EC (but field is named "SOIL TEMPERATURE")
                            field6: "7.0",     // npkPH (but field is named "SOIL MOISTURE")
                            field7: "1.5",    // npkTemp (but field is named "SOIL EC")
                            field8: "55.0",    // npkHum (but field is named "SOIL HUMIDITY")
                            created_at: new Date().toISOString()
                          };

                          console.log('🧪 Using sample data for testing:', { channelData, last });
                        }

                        // Map ThingSpeak field names to our form keys based on Arduino code structure
                        const currentParam = inputMode && inputMode.endsWith('water') ? 'water' : 'soil';
                        const mapFieldNameToKey = (name) => {
                          if (!name) return null;
                          const n = String(name).toLowerCase();



                          // Direct mapping based on your ThingSpeak field names
                          if (n.includes('nitrogen')) return 'nitrogen';
                          if (n.includes('phosphorous') || n.includes('phosphorus')) return 'phosphorous';
                          if (n.includes('potassium')) return 'potassium';
                          if (n.includes('temperature')) return 'temperature';
                          if (n.includes('moisture')) return 'moisture';
                          if (n.includes('ec')) return 'soil_ec';
                          if (n.includes('humidity')) return 'soil_humidity';
                          if (n.includes('ph') && !n.includes('phosphorous')) return 'ph';

                          return null;
                        };

                        const newForm = { ...form };

                        // Enhanced debugging and data mapping
                        console.group('🔍 ThingSpeak Data Analysis');
                        console.log('Channel Data:', channelData);
                        console.log('Last Feed:', last);
                        console.log('Channel Fields:', {
                          field1: channelData.field1,
                          field2: channelData.field2,
                          field3: channelData.field3,
                          field4: channelData.field4,
                          field5: channelData.field5,
                          field6: channelData.field6,
                          field7: channelData.field7,
                          field8: channelData.field8
                        });

                        if (last) {
                          console.log('Feed Values:', {
                            field1: last.field1,
                            field2: last.field2,
                            field3: last.field3,
                            field4: last.field4,
                            field5: last.field5,
                            field6: last.field6,
                            field7: last.field7,
                            field8: last.field8
                          });

                          let mappedCount = 0;
                          for (let i = 1; i <= 8; i++) {
                            const fname = channelData[`field${i}`];
                            const fval = last[`field${i}`];
                            const key = mapFieldNameToKey(fname);

                            console.log(`Field ${i}: "${fname}" = "${fval}" → ${key}`);

                            if (key && fval != null && fval !== '') {
                              const num = parseFloat(fval);
                              newForm[key] = isNaN(num) ? fval : num;
                              mappedCount++;
                              console.log(`✅ Mapped: ${fname} (${fval}) → ${key}: ${newForm[key]}`);
                            } else if (fname) {
                              console.log(`❌ Skipped: ${fname} (${fval}) - ${!key ? 'no mapping' : 'empty value'}`);
                            }
                          }

                          console.log(`📊 Successfully mapped ${mappedCount} fields`);

                          // Only set day if we have mapped data and a valid timestamp
                          if (mappedCount > 0 && last.created_at) {
                            newForm.day = last.created_at;
                            console.log(`📅 Set timestamp: ${last.created_at}`);
                          }
                        } else {
                          console.log('❌ No feed data available');

                          // Fallback: Check if data is in channelData.feeds
                          if (channelData.feeds && Array.isArray(channelData.feeds) && channelData.feeds.length > 0) {
                            console.log('🔄 Trying fallback: using channelData.feeds');
                            const fallbackFeed = channelData.feeds[0];

                            let mappedCount = 0;
                            for (let i = 1; i <= 8; i++) {
                              const fname = channelData[`field${i}`];
                              const fval = fallbackFeed[`field${i}`];
                              const key = mapFieldNameToKey(fname);

                              if (key && fval != null && fval !== '') {
                                const num = parseFloat(fval);
                                newForm[key] = isNaN(num) ? fval : num;
                                mappedCount++;
                                console.log(`✅ Fallback mapped: ${fname} (${fval}) → ${key}: ${newForm[key]}`);
                              }
                            }

                            if (mappedCount > 0 && fallbackFeed.created_at) {
                              newForm.day = fallbackFeed.created_at;
                              console.log(`📅 Fallback timestamp: ${fallbackFeed.created_at}`);
                            }
                          }
                        }

                        console.log('Final form data:', newForm);
                        console.groupEnd();

                        setForm(newForm);
                      } catch (err) {
                        console.error('ThingSpeak fetch/fill error:', err);
                        setTsError(String(err.message ?? err));
                      } finally {
                        setTsLoading(false);
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 transition-colors"
                    disabled={tsLoading}
                  >
                    {tsLoading ? 'Fetching...' : 'Fetch & Fill'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMapping(true);
                      setTimeout(async () => {
                        console.group('🧪 Sensors Mapping with Generated Sensors Data');

                        // --- Blynk Integration ---
                        const BLYNK_AUTH_TOKEN = "B0hPaF6btoV5MkLys9cAoOdhgORvwulN";
                        let blynkState = "1"; // Default switch ON (V1)
                        let blynkAltMode = "0"; // Default Alt Mode OFF (V2)
                        let blynkMoisture = "50"; // Default moisture (V3)

                        try {
                          console.log('📡 Fetching Blynk data (V1, V2, V3)...');
                          const [resSwitch, resAltMode, resMoisture] = await Promise.all([
                            fetch(`https://blynk.cloud/external/api/get?token=${BLYNK_AUTH_TOKEN}&v1`),
                            fetch(`https://blynk.cloud/external/api/get?token=${BLYNK_AUTH_TOKEN}&v2`),
                            fetch(`https://blynk.cloud/external/api/get?token=${BLYNK_AUTH_TOKEN}&v3`)
                          ]);

                          if (resSwitch.ok) blynkState = await resSwitch.text();
                          if (resAltMode.ok) blynkAltMode = await resAltMode.text();
                          if (resMoisture.ok) blynkMoisture = await resMoisture.text();

                          console.log(`Blynk: V1 Switch=${blynkState}, V2 AltMode=${blynkAltMode}, V3 Moisture=${blynkMoisture}%`);
                        } catch (err) {
                          console.error('❌ Error fetching Blynk status:', err);
                        }

                        const isSystemActive = blynkState.includes("1");
                        const isAltModeActive = blynkAltMode.includes("1");
                        const manualMoisture = parseFloat(blynkMoisture.replace(/[\[\]"]/g, '')) || 0;

                        console.log('*** DEMO MODE: Generating sensors data... ***');

                        // Base values (equivalent to your Arduino BASE_ constants)
                        const BASE_N = 297;
                        const BASE_P = 23;
                        const BASE_K = 493;
                        const BASE_EC = 1.79;
                        const BASE_PH = 7.0;
                        const BASE_TEMP = 28.0;
                        const BASE_HUMIDITY = 95.0;
                        const BASE_WATER_PH = 7.1;
                        const BASE_WATER_TEMP = 26.0;

                        // Generate sensors data function (converted from your Arduino code)
                        function generateSensorsData() {
                          // 1. ALWAYS ACTIVE (Excluded from V1 switch master control)
                          // Generate pH levels
                          const npkPH = BASE_PH + (Math.floor(Math.random() * 21 - 10) / 100.0); // 6.90 to 7.10
                          const waterPH = BASE_WATER_PH + (Math.floor(Math.random() * 17 - 8) / 100.0); // 7.02 to 7.18
                          const constrainedWaterPH = Math.max(6.0, Math.min(8.5, waterPH));

                          // MOISTURE: Direct from Blynk V3 Slider
                          const soilMoisture = manualMoisture;
                          const constrainedSoilMoisture = Math.max(0, Math.min(100, soilMoisture));

                          // 2. SWITCH DEPENDENT (N, P, K, EC, Temp, Hum)
                          if (!isSystemActive) {
                            console.log('🛑 BLYNK: System NPK/EC/Temp is OFF. Returning 0 for those.');
                            return {
                              N: 0, P: 0, K: 0,
                              EC: 0, npkTemp: 0, npkHum: 0, waterTemp: 0,
                              npkPH, soilMoisture: constrainedSoilMoisture, waterPH: constrainedWaterPH
                            };
                          }

                          console.log(isAltModeActive ? '🌟 BLYNK: Alternative Range Mode (V2) is ON.' : '🌿 BLYNK: Normal Mode (V1) is ON.');

                          let N, P, K;

                          if (isAltModeActive) {
                            // Specific ranges for Button 2 (V2)
                            N = Math.floor(Math.random() * (258 - 250 + 1)) + 250; // 250-258
                            P = Math.floor(Math.random() * (23 - 20 + 1)) + 20;     // 20-23
                            K = Math.floor(Math.random() * (374 - 368 + 1)) + 368;  // 368-374
                          } else {
                            // Normal Mode Data Fluctuation
                            N = BASE_N + Math.floor(Math.random() * 11) - 5;
                            P = BASE_P + Math.floor(Math.random() * 5) - 2;
                            K = BASE_K + Math.floor(Math.random() * 15) - 7;

                            if (form.day && form.day.startsWith('S')) {
                              const delta = Math.floor(Math.random() * 2) + 5;
                              N += delta;
                              K -= delta;
                            }
                          }

                          const EC = BASE_EC + (Math.floor(Math.random() * 11 - 5) / 100.0);
                          const npkTemp = BASE_TEMP + (Math.floor(Math.random() * 9 - 4) / 10.0);
                          const npkHum = BASE_HUMIDITY + (Math.floor(Math.random() * 31 - 15) / 10.0);
                          const waterTemp = BASE_WATER_TEMP + (Math.floor(Math.random() * 11 - 5) / 10.0);

                          const constrainedNpkHum = Math.max(0, Math.min(100, npkHum));
                          const constrainedWaterTemp = Math.max(15, Math.min(35, waterTemp));

                          return {
                            N, P, K, EC, npkPH, npkTemp, npkHum: constrainedNpkHum,
                            soilMoisture: constrainedSoilMoisture, waterPH: constrainedWaterPH, waterTemp: constrainedWaterTemp
                          };
                        }

                        // Generate sensors data
                        const sensorsData = generateSensorsData();
                        console.log('Generated sensors data:', sensorsData);

                        // Send Sensors Data to ThingSpeak
                        try {
                          console.log('📡 Sending Sensors Data to ThingSpeak channel 3356668...');
                          const updateUrl = `https://api.thingspeak.com/update?api_key=LAGL2KTNL6MH9QMM&field1=${sensorsData.N}&field2=${sensorsData.P}&field3=${sensorsData.K}&field4=${sensorsData.npkPH.toFixed(2)}&field5=${sensorsData.npkTemp.toFixed(1)}&field6=${sensorsData.soilMoisture.toFixed(1)}&field7=${sensorsData.EC.toFixed(2)}&field8=${sensorsData.npkHum.toFixed(1)}`;
                          const tsResponse = await fetch(updateUrl);
                          if (tsResponse.ok) {
                            console.log('✅ Successfully updated ThingSpeak channel');
                          } else {
                            console.warn('⚠️ ThingSpeak update warning:', tsResponse.statusText);
                          }
                        } catch (tsErr) {
                          console.error('❌ Error sending data to ThingSpeak:', tsErr);
                        }

                        const sampleChannelData = {
                          field1: "SOIL NITROGEN",
                          field2: "SOIL PHOSPHOROUS",
                          field3: "SOIL POTASSIUM",
                          field4: "SOIL pH",
                          field5: "SOIL TEMPERATURE",
                          field6: "SOIL MOISTURE",
                          field7: "SOIL EC",
                          field8: "SOIL HUMIDITY"
                        };

                        // Use generated sensors data correctly mapped to names
                        const sampleFeed = {
                          field1: sensorsData.N.toString(),               // SOIL NITROGEN
                          field2: sensorsData.P.toString(),               // SOIL PHOSPHOROUS
                          field3: sensorsData.K.toString(),               // SOIL POTASSIUM
                          field4: sensorsData.npkPH.toFixed(2),           // SOIL pH
                          field5: sensorsData.npkTemp.toFixed(1),         // SOIL TEMPERATURE
                          field6: sensorsData.soilMoisture.toFixed(1),    // SOIL MOISTURE
                          field7: sensorsData.EC.toFixed(2),              // SOIL EC
                          field8: sensorsData.npkHum.toFixed(1)           // SOIL HUMIDITY
                        };

                        console.log('Sample feed with sensors data:', sampleFeed);

                        const mapFieldNameToKey = (name) => {
                          if (!name) return null;
                          const n = String(name).toLowerCase();

                          // Direct mapping based on your ThingSpeak field names
                          if (n.includes('nitrogen')) return 'nitrogen';
                          if (n.includes('phosphorous') || n.includes('phosphorus')) return 'phosphorous';
                          if (n.includes('potassium')) return 'potassium';
                          if (n.includes('temperature')) return 'temperature';
                          if (n.includes('moisture')) return 'moisture';
                          if (n.includes('ec')) return 'soil_ec';
                          if (n.includes('humidity')) return 'soil_humidity';
                          if (n.includes('ph') && !n.includes('phosphorous')) return 'ph';
                          return null;
                        };

                        const newForm = { ...form };
                        let mappedCount = 0;

                        for (let i = 1; i <= 8; i++) {
                          const fname = sampleChannelData[`field${i}`];
                          const fval = sampleFeed[`field${i}`];
                          const key = mapFieldNameToKey(fname);

                          console.log(`Field ${i}: "${fname}" = "${fval}" → ${key}`);

                          if (key && fval != null && fval !== '') {
                            const num = parseFloat(fval);
                            newForm[key] = isNaN(num) ? fval : num;
                            mappedCount++;
                            console.log(`✅ Mapped: ${fname} (${fval}) → ${key}: ${newForm[key]}`);
                          }
                        }

                        console.log(`📊 Successfully mapped ${mappedCount} fields`);
                        console.log('Final form data:', newForm);
                        console.groupEnd();

                        setForm(newForm);
                        setTsError(null);
                        setIsMapping(false);
                      }, 10000);
                    }}
                    disabled={isMapping}
                    className={`px-4 py-2 text-white rounded text-sm font-medium transition-colors ${isMapping ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {isMapping ? 'Processing...' : 'Sensors Mapping'}
                  </button>

                </div>
              )}
              <input name="day" type="text" value={form.day} onChange={handleFormChange} placeholder="Sample Number (e.g. S1)" className="border rounded px-4 py-2" required />
              <input name="email" type="email" value={form.email} onChange={handleFormChange} placeholder="Email for report" className="border rounded px-4 py-2" required />
              {inputMode && inputMode.endsWith('soil') ? (
                <>
                  <input name="nitrogen" type="number" value={form.nitrogen} onChange={handleFormChange} placeholder="Nitrogen" className="border rounded px-4 py-2" required />
                  <input name="phosphorous" type="number" value={form.phosphorous} onChange={handleFormChange} placeholder="Phosphorous" className="border rounded px-4 py-2" required />
                  <input name="potassium" type="number" value={form.potassium} onChange={handleFormChange} placeholder="Potassium" className="border rounded px-4 py-2" required />
                  <input name="temperature" type="number" value={form.temperature} onChange={handleFormChange} placeholder="Temperature" className="border rounded px-4 py-2" required />
                  <input name="moisture" type="number" value={form.moisture} onChange={handleFormChange} placeholder="Soil Moisture" className="border rounded px-4 py-2" required />
                  <input name="soil_ec" type="number" value={form.soil_ec} onChange={handleFormChange} placeholder="Soil EC" className="border rounded px-4 py-2" />
                  <input name="soil_humidity" type="number" value={form.soil_humidity} onChange={handleFormChange} placeholder="Soil Humidity" className="border rounded px-4 py-2" />
                  <input name="ph" type="number" step="0.1" value={form.ph} onChange={handleFormChange} placeholder="Soil pH" className="border rounded px-4 py-2" required />
                </>
              ) : (
                <>
                  <input name="water_ph" type="number" step="0.1" value={form.water_ph} onChange={handleFormChange} placeholder="Water pH" className="border rounded px-4 py-2" required />
                </>
              )}
              <div className="col-span-2 flex gap-4 justify-center flex-wrap">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 transition">Add Sample</button>
                <button type="button" className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition" onClick={() => setShowFertilizerModal(true)} disabled={samples.length === 0}>Finish</button>
                {inputMode && inputMode.endsWith('soil') && (
                  <button
                    type="button"
                    className="bg-purple-600 text-white px-6 py-2 rounded shadow hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={getMLPredictions}
                    disabled={mlLoading || !form.nitrogen || !form.phosphorous || !form.potassium || !form.ph || !form.moisture || !form.temperature}
                  >
                    {mlLoading ? 'Predicting...' : 'Get ML Recommendations'}
                  </button>
                )}
              </div>
            </form>
            {/* ML Predictions Display */}
            {mlPredictions && (
              <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <h3 className="text-lg font-bold text-purple-800 dark:text-purple-200 mb-3">🤖 ML Model Recommendations (kg/ha)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {Object.entries(mlPredictions).map(([fertilizer, amount]) => (
                    amount > 0 && (
                      <div key={fertilizer} className="bg-white dark:bg-gray-800 p-3 rounded border border-purple-200 dark:border-purple-700">
                        <div className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{fertilizer}</div>
                        <div className="text-purple-600 dark:text-purple-400 font-bold text-lg">{amount.toFixed(2)}</div>
                      </div>
                    )
                  ))}
                </div>

                {mlFeatures && (
                  <div className="mt-4">
                    <h4 className="text-md font-bold text-indigo-700 dark:text-indigo-300 mb-2">⚙️ Feature Engineering Results</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {Object.entries(mlFeatures).map(([feature, value]) => (
                        <div key={feature} className="bg-indigo-50/50 dark:bg-indigo-900/10 p-2 rounded border border-indigo-100 dark:border-indigo-800/50">
                          <div className="text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold">{feature.replace(/_/g, ' ')}</div>
                          <div className="font-mono text-indigo-800 dark:text-indigo-200">{typeof value === 'number' ? value.toFixed(3) : value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Object.values(mlPredictions).every(v => v === 0) && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">No fertilizer recommendations based on current soil conditions.</p>
                )}
              </div>
            )}
            {mlError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">❌ {mlError}</p>
              </div>
            )}
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
        {!finished && samples.filter(s => s.type === 'soil' || s.type === undefined).map((sample, idx) => {
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
          samples.filter(s => s.type === 'soil' || s.type === undefined).forEach(sample => {
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
          samples.filter(s => s.type === 'soil' || s.type === undefined).forEach(sample => {
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

        {/* Link to Krishi Fertilizer Hub */}
        {finished && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 text-center transition-all hover:shadow-md">
            <h3 className="text-xl font-bold text-green-800 mb-2">Buy Recommended Fertilizers</h3>
            <p className="mb-4 text-green-700">Find nearby stores and purchase the recommended fertilizers directly from our hub.</p>
            <Link href="/krishi-fertilizer-hub" target="_blank" rel="noopener noreferrer">
              <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 mx-auto">
                <span>🛒</span> Visit Krishi Fertilizer Hub
              </Button>
            </Link>
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

        {/* Physical Values Section */}
        {finished && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8 mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Physical Sensor Data Values</h2>
              <p className="text-gray-600 dark:text-gray-300">Raw numerical values for all collected samples</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="py-3 px-2 border border-gray-300 dark:border-gray-600">Sample</th>
                    <th className="py-3 px-2 border border-gray-300 dark:border-gray-600">Crop</th>
                    <th className="py-3 px-2 border border-gray-300 dark:border-gray-600">N</th>
                    <th className="py-3 px-2 border border-gray-300 dark:border-gray-600">P</th>
                    <th className="py-3 px-2 border border-gray-300 dark:border-gray-600">K</th>
                    <th className="py-3 px-2 border border-gray-300 dark:border-gray-600">pH</th>
                    <th className="py-3 px-2 border border-gray-300 dark:border-gray-600">Temp</th>
                    <th className="py-3 px-2 border border-gray-300 dark:border-gray-600">Mois</th>
                    <th className="py-3 px-2 border border-gray-300 dark:border-gray-600">EC</th>
                  </tr>
                </thead>
                <tbody>
                  {samples.filter(s => s.type === 'soil' || s.type === undefined).map((s, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-2 border border-gray-300 dark:border-gray-600 font-bold">{s.day}</td>
                      <td className="py-3 px-2 border border-gray-300 dark:border-gray-600">{s.crop}</td>
                      <td className="py-3 px-2 border border-gray-300 dark:border-gray-600">{s.nitrogen}</td>
                      <td className="py-3 px-2 border border-gray-300 dark:border-gray-600">{s.phosphorous}</td>
                      <td className="py-3 px-2 border border-gray-300 dark:border-gray-600">{s.potassium}</td>
                      <td className="py-3 px-2 border border-gray-300 dark:border-gray-600">{s.ph}</td>
                      <td className="py-3 px-2 border border-gray-300 dark:border-gray-600">{s.temperature}°C</td>
                      <td className="py-3 px-2 border border-gray-300 dark:border-gray-600">{s.moisture}%</td>
                      <td className="py-3 px-2 border border-gray-300 dark:border-gray-600">{s.soil_ec || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Engineered Features Physical Values */}
            <div className="mt-12 text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Engineered Feature Values</h2>
              <p className="text-gray-600 dark:text-gray-300">Derived features used for machine learning models</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="py-3 px-1 border border-gray-300 dark:border-gray-600">Sample</th>
                    <th className="py-3 px-1 border border-gray-300 dark:border-gray-600">N:P:K</th>
                    <th className="py-3 px-1 border border-gray-300 dark:border-gray-600">N Prop</th>
                    <th className="py-3 px-1 border border-gray-300 dark:border-gray-600">P Prop</th>
                    <th className="py-3 px-1 border border-gray-300 dark:border-gray-600">K Prop</th>
                    <th className="py-3 px-1 border border-gray-300 dark:border-gray-600">N/P</th>
                    <th className="py-3 px-1 border border-gray-300 dark:border-gray-600">N/K</th>
                    <th className="py-3 px-1 border border-gray-300 dark:border-gray-600">P/K</th>
                    <th className="py-3 px-1 border border-gray-300 dark:border-gray-600">pH*M</th>
                    <th className="py-3 px-1 border border-gray-300 dark:border-gray-600">T*M</th>
                    <th className="py-3 px-1 border border-gray-300 dark:border-gray-600">Salinity</th>
                    <th className="py-3 px-1 border border-gray-300 dark:border-gray-600">H-Stress</th>
                  </tr>
                </thead>
                <tbody>
                  {samples.filter(s => s.mlFeatures).map((s, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 font-mono text-indigo-700 dark:text-indigo-300">
                      <td className="py-3 px-1 border border-gray-300 dark:border-gray-600 font-bold">{s.day}</td>
                      <td className="py-3 px-1 border border-gray-300 dark:border-gray-600 whitespace-nowrap">{s.mlFeatures['N:P:K_Ratio']}</td>
                      <td className="py-3 px-1 border border-gray-300 dark:border-gray-600">{s.mlFeatures.N_proportion.toFixed(3)}</td>
                      <td className="py-3 px-1 border border-gray-300 dark:border-gray-600">{s.mlFeatures.P_proportion.toFixed(3)}</td>
                      <td className="py-3 px-1 border border-gray-300 dark:border-gray-600">{s.mlFeatures.K_proportion.toFixed(3)}</td>
                      <td className="py-3 px-1 border border-gray-300 dark:border-gray-600">{s.mlFeatures.N_P_ratio.toFixed(2)}</td>
                      <td className="py-3 px-1 border border-gray-300 dark:border-gray-600">{s.mlFeatures.N_K_ratio.toFixed(2)}</td>
                      <td className="py-3 px-1 border border-gray-300 dark:border-gray-600">{s.mlFeatures.P_K_ratio.toFixed(2)}</td>
                      <td className="py-3 px-1 border border-gray-300 dark:border-gray-600">{s.mlFeatures.pH_moisture.toFixed(2)}</td>
                      <td className="py-3 px-1 border border-gray-300 dark:border-gray-600">{s.mlFeatures.temp_moisture.toFixed(2)}</td>
                      <td className="py-3 px-1 border border-gray-300 dark:border-gray-600">{s.mlFeatures.salinity_proxy.toFixed(2)}</td>
                      <td className="py-3 px-1 border border-gray-300 dark:border-gray-600">{s.mlFeatures.heat_stress_index.toFixed(2)}</td>
                    </tr>
                  ))}
                  {samples.filter(s => !s.mlFeatures && (s.type === 'soil' || s.type === undefined)).map((s, idx) => {
                    const total = s.nitrogen + s.phosphorous + s.potassium + 1;
                    const minN = Math.min(s.nitrogen, s.phosphorous, s.potassium);
                    const ratioStr = minN > 0 
                      ? `${(s.nitrogen/minN).toFixed(1)}:${(s.phosphorous/minN).toFixed(1)}:${(s.potassium/minN).toFixed(1)}`
                      : `${s.nitrogen}:${s.phosphorous}:${s.potassium}`;
                    return (
                      <tr key={`calc-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 font-mono text-gray-500">
                        <td className="py-3 px-1 border border-gray-300 dark:border-gray-600 font-bold">{s.day}</td>
                        <td className="py-3 px-1 border border-gray-300 dark:border-gray-600 whitespace-nowrap">{ratioStr}</td>
                        <td className="py-3 px-1 border border-gray-300 dark:border-gray-600">{(s.nitrogen / total).toFixed(3)}</td>
                        <td className="py-3 px-1 border border-gray-300 dark:border-gray-600">{(s.phosphorous / total).toFixed(3)}</td>
                        <td className="py-3 px-1 border border-gray-300 dark:border-gray-600">{(s.potassium / total).toFixed(3)}</td>
                        <td className="py-3 px-1 border border-gray-300 dark:border-gray-600">{(s.nitrogen / (s.phosphorous + 1)).toFixed(2)}</td>
                        <td className="py-3 px-1 border border-gray-300 dark:border-gray-600">{(s.nitrogen / (s.potassium + 1)).toFixed(2)}</td>
                        <td className="py-3 px-1 border border-gray-300 dark:border-gray-600">{(s.phosphorous / (s.potassium + 1)).toFixed(2)}</td>
                        <td className="py-3 px-1 border border-gray-300 dark:border-gray-600">{(s.ph * s.moisture).toFixed(2)}</td>
                        <td className="py-3 px-1 border border-gray-300 dark:border-gray-600">{(s.temperature * s.moisture).toFixed(2)}</td>
                        <td className="py-3 px-1 border border-gray-300 dark:border-gray-600">{( (s.soil_ec || 0) / (s.moisture + 1)).toFixed(2)}</td>
                        <td className="py-3 px-1 border border-gray-300 dark:border-gray-600">{(s.temperature / (s.moisture + 1) ).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-12 flex justify-center">
              <Button
                onClick={() => {
                  setSamples([]);
                  setFinished(false);
                  setFertilizerType(null);
                  setMlPredictions(null);
                  setMlFeatures(null);
                  setShowAppointmentStep(true);
                  setAppointmentId('');
                  setAppointmentDetails(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-10 rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-3"
              >
                🔄 Check Other Sample
              </Button>
            </div>
          </div>
        )}

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