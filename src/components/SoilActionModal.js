"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function SoilActionModal({ notification, isOpen, onClose, onSuccess }) {
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedPlot, setSelectedPlot] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Soil health improvement actions
  const soilActions = [
    { 
      value: 'lime_application', 
      label: 'Apply Lime', 
      icon: '🪨', 
      description: 'Increase soil pH with agricultural lime',
      urgency: 'high'
    },
    { 
      value: 'compost_addition', 
      label: 'Add Compost', 
      icon: '🍂', 
      description: 'Improve organic matter content',
      urgency: 'medium'
    },
    { 
      value: 'soil_testing', 
      label: 'Schedule Soil Test', 
      icon: '🧪', 
      description: 'Get detailed soil analysis',
      urgency: 'high'
    },
    { 
      value: 'mulching', 
      label: 'Apply Mulch', 
      icon: '🌿', 
      description: 'Protect soil and retain moisture',
      urgency: 'low'
    },
    { 
      value: 'cover_crop', 
      label: 'Plant Cover Crop', 
      icon: '🌱', 
      description: 'Improve soil structure naturally',
      urgency: 'medium'
    },
    { 
      value: 'fertilizer_adjustment', 
      label: 'Adjust Fertilizer', 
      icon: '⚗️', 
      description: 'Modify nutrient application',
      urgency: 'high'
    }
  ];

  // Generate date options (next 14 days)
  const generateDateOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      const displayDate = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
      options.push({ value: dateString, label: displayDate });
    }
    return options;
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'border-red-200 bg-red-50 hover:border-red-300';
      case 'medium': return 'border-yellow-200 bg-yellow-50 hover:border-yellow-300';
      case 'low': return 'border-green-200 bg-green-50 hover:border-green-300';
      default: return 'border-gray-200 hover:border-gray-300';
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAction || !actionDate) {
      alert('Please select an action and date');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call for soil action
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const soilAction = {
        action: selectedAction,
        plot: selectedPlot || 'Not specified',
        actionDate: actionDate,
        notes: notes,
        notificationId: notification.id,
        urgency: soilActions.find(a => a.value === selectedAction)?.urgency || 'medium'
      };

      console.log('Soil action planned:', soilAction);
      
      // Show success message
      const actionLabel = soilActions.find(a => a.value === selectedAction)?.label || 'Action';
      alert(`${actionLabel} scheduled successfully for ${new Date(actionDate).toLocaleDateString()}`);
      
      if (onSuccess) {
        onSuccess(soilAction);
      }
      
      onClose();
      
      // Reset form
      setSelectedAction('');
      setSelectedPlot('');
      setActionDate('');
      setNotes('');
      
    } catch (error) {
      console.error('Error planning soil action:', error);
      alert('Failed to plan soil action. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Take Action</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Notification Info */}
          <div className="bg-red-50 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🌱</span>
              <div>
                <h3 className="font-medium text-gray-900">{notification.title}</h3>
                <p className="text-sm text-gray-600">Soil pH is low - immediate action recommended</p>
              </div>
            </div>
            <p className="text-sm text-gray-700">{notification.message}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Action Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Recommended Action
              </label>
              <div className="grid grid-cols-1 gap-3">
                {soilActions.map((action) => (
                  <button
                    key={action.value}
                    type="button"
                    onClick={() => setSelectedAction(action.value)}
                    className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${getUrgencyColor(action.urgency)} ${
                      selectedAction === action.value
                        ? 'ring-2 ring-blue-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{action.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900">{action.label}</div>
                          <div className="text-sm text-gray-600">{action.description}</div>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getUrgencyBadge(action.urgency)}`}>
                        {action.urgency}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Plot Selection (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Plot (Optional)
              </label>
              <input
                type="text"
                value={selectedPlot}
                onChange={(e) => setSelectedPlot(e.target.value)}
                placeholder="Enter plot number or name..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Action Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Action Date
              </label>
              <select
                value={actionDate}
                onChange={(e) => setActionDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Choose action date...</option>
                {generateDateOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific requirements or notes for this action..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                rows="3"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !selectedAction || !actionDate}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Planning...
                  </div>
                ) : (
                  'Schedule Action'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
