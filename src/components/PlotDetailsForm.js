"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function PlotDetailsForm({ user, onClose, onSuccess, editPlot = null }) {
  const [formData, setFormData] = useState({
    category: editPlot?.Category || '',
    state: editPlot?.State || '',
    district: editPlot?.District || '',
    taluka: editPlot?.Taluka || '',
    plotNumber: editPlot?.['Plot Number'] || '',
    villageName: editPlot?.['Village Name'] || '',
    areaOfPlot: editPlot?.['Area of Plot'] || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditMode, setIsEditMode] = useState(!!editPlot);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicatePlot, setDuplicatePlot] = useState(null);
  const [currentEditPlot, setCurrentEditPlot] = useState(editPlot);
  const [currentStep, setCurrentStep] = useState(1);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/plot-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          farmerId: user.id,
          isEdit: isEditMode,
          plotId: currentEditPlot?.id
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(isEditMode ? 'Plot details updated successfully!' : 'Plot details saved successfully!');
        // Call success callback after a delay
        setTimeout(() => {
          onSuccess && onSuccess();
          onClose && onClose();
        }, 2000);
      } else if (result.isDuplicate) {
        // Handle duplicate case
        setDuplicatePlot(result.existingPlot);
        setShowDuplicateDialog(true);
        setError('');
      } else {
        setError(result.message || 'Failed to save plot details');
      }
    } catch (error) {
      console.error('Error saving plot details:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditExisting = () => {
    // Populate form with existing plot data
    setFormData({
      category: duplicatePlot.Category,
      state: duplicatePlot.State,
      district: duplicatePlot.District,
      taluka: duplicatePlot.Taluka,
      plotNumber: duplicatePlot['Plot Number'],
      villageName: duplicatePlot['Village Name'],
      areaOfPlot: duplicatePlot['Area of Plot']
    });
    setIsEditMode(true);
    setShowDuplicateDialog(false);
    setError('');
    setSuccess('');
    // Store the plot ID for editing
    setCurrentEditPlot(duplicatePlot);
  };

  const handleCancelEdit = () => {
    setShowDuplicateDialog(false);
    setDuplicatePlot(null);
    setIsEditMode(false);
    setCurrentEditPlot(null);
    // Reset form to original values
    setFormData({
      category: '',
      state: '',
      district: '',
      taluka: '',
      plotNumber: '',
      villageName: '',
      areaOfPlot: ''
    });
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

  const canProceedToStep2 = formData.category && formData.state;
  const canProceedToStep3 = canProceedToStep2 && formData.district && formData.taluka;
  const canSubmit = canProceedToStep3 && formData.plotNumber && formData.villageName && formData.areaOfPlot;

  const categories = [
    { value: "Rural", label: "Rural Area", icon: "🌾", description: "Agricultural and farming areas" },
    { value: "Urban", label: "Urban Area", icon: "🏢", description: "City and metropolitan areas" }
  ];

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
          <div className="relative bg-gradient-to-r from-blue-400 via-purple-500 to-pink-600 px-6 pt-6 pb-20">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
            </div>
            
            {/* Title */}
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              {isEditMode ? 'Edit Plot Details' : 'Add New Plot'}
            </h2>
            <p className="text-white/80 text-center text-sm">
              {isEditMode ? 'Update your plot information' : 'Register your agricultural land details'}
            </p>

            {/* Progress Steps */}
            <div className="flex justify-center mt-6 space-x-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    currentStep >= step 
                      ? 'bg-white text-purple-600' 
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
                {/* Step 1: Category & Location */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Category & Location</h3>
                      <p className="text-gray-600">Select plot category and location details</p>
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900">Plot Category</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {categories.map((cat) => (
                          <div
                            key={cat.value}
                            onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                              formData.category === cat.value
                                ? 'border-purple-500 bg-purple-50 shadow-md'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="text-3xl mr-4">{cat.icon}</span>
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900">{cat.label}</h5>
                                <p className="text-gray-600 text-sm">{cat.description}</p>
                              </div>
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                formData.category === cat.value
                                  ? 'border-purple-500 bg-purple-500'
                                  : 'border-gray-300'
                              }`}>
                                {formData.category === cat.value && (
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* State Input */}
                    <div className="floating-label-group">
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="floating-label-input peer"
                        placeholder=" "
                        required
                      />
                      <label htmlFor="state" className="floating-label">
                        State
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 2: District & Taluka */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Administrative Details</h3>
                      <p className="text-gray-600">Enter district and taluka information</p>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg mb-6">
                      <h4 className="font-medium text-purple-800 mb-1">Selected Details</h4>
                      <p className="text-purple-700 text-sm">Category: {formData.category}</p>
                      <p className="text-purple-600 text-sm">State: {formData.state}</p>
                    </div>

                    <div className="floating-label-group">
                      <input
                        type="text"
                        id="district"
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        className="floating-label-input peer"
                        placeholder=" "
                        required
                      />
                      <label htmlFor="district" className="floating-label">
                        District
                      </label>
                    </div>

                    <div className="floating-label-group">
                      <input
                        type="text"
                        id="taluka"
                        name="taluka"
                        value={formData.taluka}
                        onChange={handleInputChange}
                        className="floating-label-input peer"
                        placeholder=" "
                        required
                      />
                      <label htmlFor="taluka" className="floating-label">
                        Taluka
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 3: Plot Specific Details */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Plot Information</h3>
                      <p className="text-gray-600">Enter specific plot details</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h4 className="font-medium text-gray-800 mb-1">Location Summary</h4>
                      <p className="text-gray-700 text-sm">{formData.taluka}, {formData.district}, {formData.state}</p>
                      <p className="text-gray-600 text-sm">Category: {formData.category}</p>
                    </div>

                    <div className="floating-label-group">
                      <input
                        type="text"
                        id="plotNumber"
                        name="plotNumber"
                        value={formData.plotNumber}
                        onChange={handleInputChange}
                        className="floating-label-input peer"
                        placeholder=" "
                        required
                      />
                      <label htmlFor="plotNumber" className="floating-label">
                        Plot Number
                      </label>
                    </div>

                    <div className="floating-label-group">
                      <input
                        type="text"
                        id="villageName"
                        name="villageName"
                        value={formData.villageName}
                        onChange={handleInputChange}
                        className="floating-label-input peer"
                        placeholder=" "
                        required
                      />
                      <label htmlFor="villageName" className="floating-label">
                        Village Name
                      </label>
                    </div>

                    <div className="floating-label-group">
                      <input
                        type="number"
                        id="areaOfPlot"
                        name="areaOfPlot"
                        value={formData.areaOfPlot}
                        onChange={handleInputChange}
                        className="floating-label-input peer"
                        placeholder=" "
                        min="0"
                        step="0.01"
                        required
                      />
                      <label htmlFor="areaOfPlot" className="floating-label">
                        Area (in acres)
                      </label>
                    </div>

                    {/* Owner ID Display */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-1">Owner Information</h4>
                      <p className="text-blue-700 text-sm">Owner ID: #{user?.id || 'N/A'}</p>
                      <p className="text-blue-600 text-sm">Name: {user?.name || 'N/A'}</p>
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
                      className="px-6 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isLoading || !canSubmit}
                      className="px-6 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                          {isEditMode ? 'Updating...' : 'Saving...'}
                        </div>
                      ) : (
                        isEditMode ? 'Update Plot' : 'Save Plot Details'
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Duplicate Plot Dialog */}
      {showDuplicateDialog && duplicatePlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Plot Number Already Exists</h3>
              <p className="text-gray-600 mb-4">
                Plot Number "{duplicatePlot['Plot Number']}" already exists in your records.
              </p>
              
              {/* Show existing plot details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h4 className="font-semibold text-gray-900 mb-2">Existing Plot Details:</h4>
                <div className="space-y-1 text-sm text-gray-700">
                  <p><strong>Category:</strong> {duplicatePlot.Category}</p>
                  <p><strong>State:</strong> {duplicatePlot.State}</p>
                  <p><strong>District:</strong> {duplicatePlot.District}</p>
                  <p><strong>Taluka:</strong> {duplicatePlot.Taluka}</p>
                  <p><strong>Plot Number:</strong> {duplicatePlot['Plot Number']}</p>
                  <p><strong>Village:</strong> {duplicatePlot['Village Name']}</p>
                  <p><strong>Area:</strong> {duplicatePlot['Area of Plot']} acres</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleEditExisting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Yes, Edit It
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  className="flex-1"
                >
                  No, Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
