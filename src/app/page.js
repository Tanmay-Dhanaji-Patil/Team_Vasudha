"use client";

import { useState } from "react";
import Dashboard from "@/components/Dashboard";
import ValueChart from "@/components/utils/ValueChart";
import ChartsContainer from "@/components/utils/ChartsContainer";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";

// Send Report Button Component
function SendReportButton({ samples }) {
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
      const cropOptions = [
        { name: "Wheat", values: { nitrogen: 90, phosphorous: 45, potassium: 45, temperature: 25, moisture: 15, ph: 7.0 } },
        { name: "Rice", values: { nitrogen: 110, phosphorous: 50, potassium: 60, temperature: 28, moisture: 20, ph: 6.5 } },
        { name: "Maize", values: { nitrogen: 80, phosphorous: 40, potassium: 50, temperature: 24, moisture: 12, ph: 6.8 } },
      ];
      
      const getStandardValues = (cropName) => cropOptions.find(c => c.name === cropName)?.values || cropOptions[0].values;
      const prices = { nitrogen: 7, phosphorous: 8, potassium: 19 };
      
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
          <YAxis fontSize={16} />
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
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [authForm, setAuthForm] = useState({ 
    username: '', 
    password: '', 
    confirmPassword: '', 
    name: '', 
    location: '',
    email: '',
    phoneNumber: ''
  });
  const [user, setUser] = useState(null);

  // Crop options and their standard values
  const cropOptions = [
    { name: "Wheat", values: { nitrogen: 90, phosphorous: 45, potassium: 45, temperature: 25, moisture: 15, ph: 7.0 } },
    { name: "Rice", values: { nitrogen: 110, phosphorous: 50, potassium: 60, temperature: 28, moisture: 20, ph: 6.5 } },
    { name: "Maize", values: { nitrogen: 80, phosphorous: 40, potassium: 50, temperature: 24, moisture: 12, ph: 6.8 } },
    // Add more crops as needed
  ];

  // State for all samples entered by user
  const [samples, setSamples] = useState([]);
  const [form, setForm] = useState({ day: '', crop: cropOptions[0].name, nitrogen: '', phosphorous: '', potassium: '', temperature: '', moisture: '', ph: '', email: '' });
  const [finished, setFinished] = useState(false);
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
    if (!form.day) return;
    setSamples((prev) => [...prev, {
      day: form.day,
      crop: form.crop,
      nitrogen: Number(form.nitrogen),
      phosphorous: Number(form.phosphorous),
      potassium: Number(form.potassium),
      temperature: Number(form.temperature),
      moisture: Number(form.moisture),
      ph: Number(form.ph),
      email: form.email
    }]);
    setForm({ day: '', crop: cropOptions[0].name, nitrogen: '', phosphorous: '', potassium: '', temperature: '', moisture: '', ph: '', email: '' });
  };

  // Handle authentication form changes
  const handleAuthFormChange = (e) => {
    const { name, value } = e.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle login/signup
  const handleAuth = async (e) => {
    e.preventDefault();
    const { username, password, confirmPassword, name, location, email, phoneNumber } = authForm;
    
    if (isSignUpMode) {
      // Sign-up validation
      if (!name.trim()) {
        alert('Please enter your name!');
        return;
      }
      if (!email.trim()) {
        alert('Please enter your email!');
        return;
      }
      if (!phoneNumber.trim()) {
        alert('Please enter your phone number!');
        return;
      }
      if (!location.trim()) {
        alert('Please enter your location!');
        return;
      }
      if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
      if (name.length < 2) {
        alert('Name must be at least 2 characters long!');
        return;
      }
      if (password.length < 6) {
        alert('Password must be at least 6 characters long!');
        return;
      }

      try {
        // Call registration API
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password: password,
            location: location.trim(),
            phoneNumber: phoneNumber.trim()
          }),
        });

        const result = await response.json();

        if (result.success) {
          setIsAuthenticated(true);
          setUser(result.user);
          setShowAuthForm(false);
          setAuthForm({ username: '', password: '', confirmPassword: '', name: '', location: '', email: '', phoneNumber: '' });
          setIsSignUpMode(false);
          alert(`Account created successfully! Welcome ${result.user.name}!`);
        } else {
          alert(`Registration failed: ${result.message}`);
        }
      } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
      }
    } else {
      // Login validation
      if (!username.trim() || !password.trim()) {
        alert('Please enter both username and password!');
        return;
      }

      try {
        // For demo user, use email-based login
        const loginEmail = username === 'crop' ? 'crop@demo.com' : username;
        
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: loginEmail,
            password: password
          }),
        });

        const result = await response.json();

        if (result.success) {
          setIsAuthenticated(true);
          setUser(result.user);
          setShowAuthForm(false);
          setAuthForm({ username: '', password: '', confirmPassword: '', name: '', location: '', email: '', phoneNumber: '' });
          alert(`Welcome back, ${result.user.name}!`);
        } else {
          alert(`Login failed: ${result.message}`);
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
      }
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  // Toggle between login and sign-up
  const toggleAuthMode = () => {
    setIsSignUpMode(!isSignUpMode);
    setAuthForm({ username: '', password: '', confirmPassword: '', name: '', location: '', email: '', phoneNumber: '' });
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

      {/* Authentication Modal */}
      {showAuthForm && !isAuthenticated && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-center mb-6">
              {isSignUpMode ? 'Sign Up' : 'Login'}
            </h2>
            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUpMode ? (
                <>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={authForm.name}
                      onChange={handleAuthFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={authForm.location}
                      onChange={handleAuthFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your city/farm location"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={authForm.email}
                      onChange={handleAuthFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={authForm.phoneNumber}
                      onChange={handleAuthFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={authForm.password}
                      onChange={handleAuthFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Choose a password (min 6 characters)"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={authForm.confirmPassword}
                      onChange={handleAuthFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="username"
                      value={authForm.username}
                      onChange={handleAuthFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email (crop@demo.com)"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={authForm.password}
                      onChange={handleAuthFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter password (crop1234)"
                      required
                    />
                  </div>
                </>
              )}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isSignUpMode ? 'Sign Up' : 'Login'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAuthForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
            
            {/* Toggle between Login and Sign Up */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={toggleAuthMode}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                {isSignUpMode 
                  ? "Already have an account? Login here" 
                  : "Don't have an account? Sign up here"
                }
              </button>
            </div>

            {!isSignUpMode && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-xs text-gray-600 text-center">
                  <strong>Demo Credentials:</strong><br />
                  Email: <code>crop@demo.com</code><br />
                  Password: <code>crop1234</code>
                </p>
              </div>
            )}

            {isSignUpMode && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-xs text-blue-600 text-center">
                  <strong>Sign Up Requirements:</strong><br />
                  • Name: minimum 2 characters<br />
                  • Location: required field<br />
                  • Password: minimum 6 characters<br />
                  • Passwords must match
                </p>
              </div>
            )}
          </div>
        </div>
      )}
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
              <input name="email" type="email" value={form.email} onChange={handleFormChange} placeholder="Email for report" className="border rounded px-4 py-2" required />
              <input name="nitrogen" type="number" value={form.nitrogen} onChange={handleFormChange} placeholder="Nitrogen" className="border rounded px-4 py-2" required />
              <input name="phosphorous" type="number" value={form.phosphorous} onChange={handleFormChange} placeholder="Phosphorous" className="border rounded px-4 py-2" required />
              <input name="potassium" type="number" value={form.potassium} onChange={handleFormChange} placeholder="Potassium" className="border rounded px-4 py-2" required />
              <input name="temperature" type="number" value={form.temperature} onChange={handleFormChange} placeholder="Temperature" className="border rounded px-4 py-2" required />
              <input name="moisture" type="number" value={form.moisture} onChange={handleFormChange} placeholder="Moisture" className="border rounded px-4 py-2" required />
              <input name="ph" type="number" step="0.1" value={form.ph} onChange={handleFormChange} placeholder="Soil pH" className="border rounded px-4 py-2" required />
              <div className="col-span-2 flex gap-4 justify-center">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 transition">Add Sample</button>
                <button type="button" className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition" onClick={() => setFinished(true)} disabled={samples.length === 0}>Finish</button>
              </div>
            </form>
            {samples.length > 0 && (
              <div className="mt-4">
                <div className="text-lg text-green-700 font-semibold mb-3">
                  {samples.length} sample(s) added.
                </div>
                <div className="flex justify-center">
                  <SendReportButton samples={samples} />
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

        {/* Required Addition Graphs after finish */}
        {/* Group samples by crop and show individual graphs for each crop */}
        {finished && (() => {
          // Group samples by crop
          const cropGroups = {};
          samples.forEach(sample => {
            if (!cropGroups[sample.crop]) cropGroups[sample.crop] = [];
            cropGroups[sample.crop].push(sample);
          });
          // Prices per kg for nutrients
          const prices = { nitrogen: 7, phosphorous: 8, potassium: 19 };
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
                          <YAxis fontSize={16} />
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
          // Prices per kg for nutrients
          const prices = { nitrogen: 7, phosphorous: 8, potassium: 19 };
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
            <SendReportButton samples={samples} />
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
    </div>
  );
}