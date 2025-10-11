"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function RescheduleModal({ task, isOpen, onClose, onReschedule }) {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Generate date options (next 30 days)
  const generateDateOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
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

  // Time slots
  const timeSlots = [
    { value: '06:00', label: '6:00 AM - Early Morning', icon: '🌅' },
    { value: '08:00', label: '8:00 AM - Morning', icon: '☀️' },
    { value: '10:00', label: '10:00 AM - Late Morning', icon: '🌤️' },
    { value: '14:00', label: '2:00 PM - Afternoon', icon: '☀️' },
    { value: '16:00', label: '4:00 PM - Late Afternoon', icon: '🌤️' },
    { value: '18:00', label: '6:00 PM - Evening', icon: '🌅' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDate || !newTime) {
      alert('Please select both date and time');
      return;
    }

    setIsLoading(true);
    
    try {
      // Calculate new due date text
      const selectedDate = new Date(newDate);
      const today = new Date();
      const diffTime = selectedDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let dueText = '';
      if (diffDays === 1) {
        dueText = 'Tomorrow';
      } else if (diffDays === 0) {
        dueText = 'Today';
      } else if (diffDays < 0) {
        dueText = 'Overdue';
      } else {
        dueText = `In ${diffDays} days`;
      }

      const rescheduleData = {
        taskId: task.id,
        newDate: newDate,
        newTime: newTime,
        newDueText: dueText,
        reason: reason || 'No reason provided'
      };

      await onReschedule(rescheduleData);
      onClose();
      
      // Reset form
      setNewDate('');
      setNewTime('');
      setReason('');
      
    } catch (error) {
      console.error('Error rescheduling task:', error);
      alert('Failed to reschedule task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Reschedule Task</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Task Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{getTaskIcon(task.type)}</span>
              <div>
                <h3 className="font-medium text-gray-900 capitalize">{task.type}</h3>
                <p className="text-sm text-gray-600">Crop: {task.crop}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700">{task.task}</p>
            <p className="text-xs text-gray-500 mt-1">Current due: {task.due}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select New Date
              </label>
              <select
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Choose a date...</option>
                {generateDateOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Time
              </label>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.value}
                    type="button"
                    onClick={() => setNewTime(slot.value)}
                    className={`p-3 border-2 rounded-lg text-left transition-all duration-200 ${
                      newTime === slot.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{slot.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {slot.value}
                        </div>
                        <div className="text-xs text-gray-600">
                          {slot.label.split(' - ')[1]}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Reason (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rescheduling (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Weather conditions, equipment availability..."
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
                disabled={isLoading || !newDate || !newTime}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Rescheduling...
                  </div>
                ) : (
                  'Reschedule Task'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Helper function to get task icon
function getTaskIcon(type) {
  switch (type) {
    case 'irrigation':
      return '💧';
    case 'fertilizer':
      return '🌱';
    case 'pest':
      return '🐛';
    default:
      return '📋';
  }
}
