"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppointmentForm({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    plotNumber: '',
    appointmentDate: '',
    appointmentTime: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [plots, setPlots] = useState([]);
  const [loadingPlots, setLoadingPlots] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlot, setSelectedPlot] = useState(null);

  // Fetch farmer's plots on component mount
  useEffect(() => {
    const fetchPlots = async () => {
      try {
        console.log('Fetching plots for farmer ID:', user.id);
        const response = await fetch(`/api/farmer-plots?farmerId=${user.id}`);
        const result = await response.json();
        
        console.log('Plots API response:', result);
        
        if (result.success) {
          setPlots(result.plots);
          console.log('Plots loaded:', result.plots.length);
        } else {
          console.error('Failed to load plots:', result.message);
          setError('Failed to load your plots: ' + result.message);
        }
      } catch (error) {
        console.error('Error fetching plots:', error);
        setError('Failed to load your plots. Please try again.');
      } finally {
        setLoadingPlots(false);
      }
    };

    if (user?.id) {
      fetchPlots();
    }
  }, [user?.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Update selected plot when plot number changes
    if (name === 'plotNumber') {
      const plot = plots.find(p => String(p['Plot Number']).trim() === String(value).trim());
      setSelectedPlot(plot);
    }
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          farmerId: user.id
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Appointment booked successfully!');
        setFormData({
          plotNumber: '',
          appointmentDate: '',
          appointmentTime: ''
        });
        setSelectedPlot(null);
        setCurrentStep(1);
        
        // Call success callback after a brief delay
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 2000);
      } else {
        setError(result.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToStep2 = formData.plotNumber && selectedPlot;
  const canProceedToStep3 = canProceedToStep2 && formData.appointmentDate;
  const canSubmit = canProceedToStep3 && formData.appointmentTime;

  const timeSlots = [
    { value: "09:00", label: "9:00 AM", icon: "🌅" },
    { value: "10:00", label: "10:00 AM", icon: "☀️" },
    { value: "11:00", label: "11:00 AM", icon: "☀️" },
    { value: "12:00", label: "12:00 PM", icon: "🌞" },
    { value: "14:00", label: "2:00 PM", icon: "🌞" },
    { value: "15:00", label: "3:00 PM", icon: "🌤️" },
    { value: "16:00", label: "4:00 PM", icon: "🌤️" },
    { value: "17:00", label: "5:00 PM", icon: "🌅" }
  ];

  // Get today's date for min date validation
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 w-full max-w-2xl animate-slide-up">
          
          {/* Header with gradient background */}
          <div className="relative bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 px-6 pt-6 pb-20">
            <div className="absolute inset-0 bg-white/10"></div>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors duration-200 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            
            {/* Title */}
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Book Soil Test Appointment
            </h2>
            <p className="text-white/80 text-center text-sm">
              Schedule professional soil analysis for your farm
            </p>

            {/* Progress Steps */}
            <div className="flex justify-center mt-6 space-x-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    currentStep >= step 
                      ? 'bg-white text-green-600' 
                      : 'bg-white/20 text-white/60'
                  }`}>
                    {currentStep > step ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step
                    )}
                  </div>
                  {step < 3 && (
                    <div className={`w-8 h-1 mx-2 rounded transition-all duration-300 ${
                      currentStep > step ? 'bg-white' : 'bg-white/20'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Section */}
          <div className="px-6 py-8 -mt-12 relative z-10">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg animate-fade-in">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg animate-fade-in">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {success}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Step 1: Select Plot */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Select Your Plot</h3>
                      <p className="text-gray-600">Choose which plot you'd like to test</p>
                    </div>

                    {loadingPlots ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <span className="ml-3 text-gray-600">Loading your plots...</span>
                      </div>
                    ) : plots.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <p className="text-gray-600 mb-4">No plots found. Please add plot details first.</p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={onClose}
                          className="mx-auto"
                        >
                          Add Plot Details
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {plots.map((plot) => (
                          <div
                            key={plot.id}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, plotNumber: plot['Plot Number'] }));
                              setSelectedPlot(plot);
                            }}
                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                              formData.plotNumber === plot['Plot Number']
                                ? 'border-green-500 bg-green-50 shadow-md'
                                : 'border-gray-200 hover:border-green-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900">Plot {plot['Plot Number']}</h4>
                                <p className="text-gray-600 text-sm">{plot['Village Name']}, {plot['District']}</p>
                                <p className="text-green-600 text-sm font-medium">{plot['Area of Plot']} acres</p>
                              </div>
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                formData.plotNumber === plot['Plot Number']
                                  ? 'border-green-500 bg-green-500'
                                  : 'border-gray-300'
                              }`}>
                                {formData.plotNumber === plot['Plot Number'] && (
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Select Date */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose Date</h3>
                      <p className="text-gray-600">When would you like the soil test?</p>
                    </div>

                    {selectedPlot && (
                      <div className="bg-green-50 p-4 rounded-lg mb-6">
                        <h4 className="font-medium text-green-800 mb-1">Selected Plot</h4>
                        <p className="text-green-700 text-sm">
                          Plot {selectedPlot['Plot Number']} - {selectedPlot['Area of Plot']} acres
                        </p>
                        <p className="text-green-600 text-sm">{selectedPlot['Village Name']}, {selectedPlot['District']}</p>
                      </div>
                    )}

                    <div className="floating-label-group">
                      <input
                        type="date"
                        id="appointmentDate"
                        name="appointmentDate"
                        value={formData.appointmentDate}
                        onChange={handleInputChange}
                        min={today}
                        className="floating-label-input peer text-lg py-4"
                        placeholder=" "
                        required
                      />
                      <label htmlFor="appointmentDate" className="floating-label">
                        Appointment Date
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 3: Select Time */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Select Time</h3>
                      <p className="text-gray-600">Choose your preferred time slot</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h4 className="font-medium text-gray-800 mb-1">Appointment Details</h4>
                      <p className="text-gray-700 text-sm">Plot {selectedPlot?.['Plot Number']} on {new Date(formData.appointmentDate).toLocaleDateString()}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, appointmentTime: slot.value }))}
                          className={`p-4 border-2 rounded-xl transition-all duration-200 text-left hover:shadow-md ${
                            formData.appointmentTime === slot.value
                              ? 'border-green-500 bg-green-50 shadow-md'
                              : 'border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{slot.icon}</span>
                            <div>
                              <div className="font-medium text-gray-900">{slot.label}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={currentStep === 1 ? onClose : prevStep}
                    className="px-6"
                  >
                    {currentStep === 1 ? 'Cancel' : 'Previous'}
                  </Button>

                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={
                        (currentStep === 1 && !canProceedToStep2) ||
                        (currentStep === 2 && !canProceedToStep3)
                      }
                      className="px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isLoading || !canSubmit}
                      className="px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                          Booking...
                        </div>
                      ) : (
                        'Book Appointment'
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
