"use client";

/**
 * Component: Dashboard
 * Purpose: Central analytical hub for agricultural management.
 *          Handles real-time telemetry, expert appointment scheduling, 
 *          and AI-driven notifications.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import WeatherCard from "@/components/utils/WeatherCard";
import Chatbot from "@/components/Chatbot";
import PlotDetailsForm from "@/components/PlotDetailsForm";
import AppointmentForm from "@/components/AppointmentForm";
import RescheduleModal from "@/components/RescheduleModal";
import PlanSowingModal from "@/components/PlanSowingModal";
import SoilActionModal from "@/components/SoilActionModal";

/**
 * Main dashboard view for authenticated users.
 * Orchestrates the display of farm plots, weather alerts, and task calendars.
 */
export default function Dashboard({ user, onLogout }) {
  // Notification and Recommendation States
  const [notifications, setNotifications] = useState([]);
  const [weatherRecommendations, setWeatherRecommendations] = useState([]);

  // UI Modal Management States
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isPlotDetailsOpen, setIsPlotDetailsOpen] = useState(false);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedTaskForReschedule, setSelectedTaskForReschedule] = useState(null);
  const [isPlanSowingOpen, setIsPlanSowingOpen] = useState(false);
  const [isSoilActionOpen, setIsSoilActionOpen] = useState(false);
  const [selectedNotificationForAction, setSelectedNotificationForAction] = useState(null);

  // Profile and Media States
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const staticNotifications = [
    {
      id: 1,
      type: "planting",
      title: "Planting Recommendation",
      message: "October is optimal for Rabi crop sowing. Consider planting wheat, gram, mustard, and barley for best yields.",
      time: "Real-time",
      priority: "high",
      action: "Plan Sowing"
    },
    {
      id: 2,
      type: "market",
      title: "Market Update",
      message: "Tomato hybrid prices rising in your region.",
      time: "4 hours ago",
      priority: "medium",
      action: null
    },
    {
      id: 3,
      type: "soil",
      title: "Soil Health Alert",
      message: "Your soil pH is low, recommended action available.",
      time: "6 hours ago",
      priority: "high",
      action: "Take Action"
    },
    {
      id: 4,
      type: "irrigation",
      title: "Irrigation Reminder",
      message: "Cotton field needs watering based on soil moisture levels.",
      time: "8 hours ago",
      priority: "medium",
      action: null
    }
  ];

  // Loading screen effect with fallback timer
  useEffect(() => {
    // Fallback timer in case video doesn't end properly (10 seconds max)
    const fallbackTimer = setTimeout(() => {
      setIsLoading(false);
    }, 10000);

    return () => clearTimeout(fallbackTimer);
  }, []);

  // Fetch weather recommendations
  useEffect(() => {
    if (user?.location) {
      fetchWeatherRecommendations(user.location);
    } else {
      setNotifications(staticNotifications);
    }
  }, [user]);

  const [tasks, setTasks] = useState([
    {
      id: 1,
      type: "irrigation",
      crop: "Wheat",
      task: "Water the wheat field - Morning irrigation recommended",
      due: "Tomorrow",
      priority: "high",
      status: "pending"
    },
    {
      id: 2,
      type: "fertilizer",
      crop: "Rice",
      task: "Apply NPK fertilizer before flowering stage",
      due: "In 3 days",
      priority: "medium",
      status: "pending"
    },
    {
      id: 3,
      type: "pest",
      crop: "Cotton",
      task: "Check for bollworm infestation",
      due: "Today",
      priority: "high",
      status: "overdue"
    }
  ]);

  const markTaskComplete = (taskId) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, status: 'completed' } : task
    ));
  };

  const dismissNotification = (notificationId) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
  };

  const handleNotificationAction = (notification) => {
    if (notification.action === 'Refresh Weather' || notification.action === 'Check Later') {
      // Refresh weather data
      if (user?.location) {
        fetchWeatherRecommendations(user.location);
      }
    } else if (notification.action === 'Monitor Soil' || notification.action === 'Adjust Irrigation') {
      // You can add specific actions for different notification types here
      console.log(`Action: ${notification.action} for ${notification.title}`);
    } else if (notification.action === 'Plan Sowing') {
      // Open Plan Sowing modal
      setSelectedNotificationForAction(notification);
      setIsPlanSowingOpen(true);
    } else if (notification.action === 'Take Action') {
      // Open Soil Action modal
      setSelectedNotificationForAction(notification);
      setIsSoilActionOpen(true);
    }
  };

  const fetchWeatherRecommendations = async (location) => {
    try {
      const response = await fetch(`/ api / weather ? location = ${encodeURIComponent(location)}`);
      const data = await response.json();

      if (data.success && data.data.recommendations && data.data.recommendations.length > 0) {
        const weatherNotifications = data.data.recommendations.map((rec, index) => ({
          id: `weather_${index + 1}_${Math.floor(Math.random() * 1000000)} `, // Use random instead of Date.now()
          type: "weather",
          subType: rec.type,
          title: getWeatherAlertTitle(rec.type),
          message: rec.message,
          time: data.fallback ? "Estimated" : "Real-time",
          priority: rec.priority,
          action: rec.action,
          isWeatherAlert: true,
          isFallback: data.fallback
        }));

        setWeatherRecommendations(weatherNotifications);
        setNotifications([...weatherNotifications, ...staticNotifications]);
      } else {
        const generalWeatherNotification = [{
          id: `weather_general_${Math.floor(Math.random() * 1000000)} `,
          type: "weather",
          subType: "general",
          title: "Weather Update",
          message: data.fallback ?
            "Weather service busy. Using seasonal estimates for your region." :
            "Current weather conditions are favorable for farming activities.",
          time: data.fallback ? "Estimated" : "Real-time",
          priority: "low",
          action: data.fallback ? "Refresh Weather" : null,
          isWeatherAlert: true,
          isFallback: data.fallback
        }];

        setWeatherRecommendations(generalWeatherNotification);
        setNotifications([...generalWeatherNotification, ...staticNotifications]);
      }
    } catch (error) {
      console.error('Failed to fetch weather recommendations:', error);
      setNotifications(staticNotifications);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getWeatherAlertColor = (notification) => {
    if (notification.subType === 'heat' && notification.priority === 'high') {
      return 'text-red-600 bg-red-50 border-red-200';
    }
    if (notification.subType === 'irrigation' || notification.subType === 'humidity') {
      return 'text-blue-600 bg-blue-50 border-blue-200';
    }
    if (notification.subType === 'wind') {
      return 'text-gray-600 bg-gray-50 border-gray-200';
    }
    if (notification.subType === 'pesticide') {
      return 'text-orange-600 bg-orange-50 border-orange-200';
    }
    if (notification.subType === 'general') {
      return 'text-sky-600 bg-sky-50 border-sky-200';
    }
    return getPriorityColor(notification.priority);
  };

  const getTaskIcon = (type) => {
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
  };

  const getWeatherAlertTitle = (alertType) => {
    switch (alertType) {
      case 'irrigation': return 'Irrigation Guidance';
      case 'pesticide': return 'Pesticide Alert';
      case 'heat': return 'Heat Warning';
      case 'wind': return 'Wind Advisory';
      case 'humidity': return 'Humidity Alert';
      case 'planting': return 'Planting Recommendation';
      case 'general': return 'Weather Service';
      default: return 'Weather Alert';
    }
  };

  const getNotificationIcon = (notification) => {
    if (notification.type === 'weather') {
      switch (notification.subType) {
        case 'irrigation': return '💧';
        case 'pesticide': return '🚫';
        case 'heat': return '🌡️';
        case 'wind': return '💨';
        case 'humidity': return '�';
        case 'general': return '🌤️';
        default: return '⛈️';
      }
    }

    switch (notification.type) {
      case 'market': return '📈';
      case 'soil': return '🌱';
      case 'irrigation': return '💧';
      case 'planting': return '🌱';
      case 'sowing': return '🌾';
      case 'soil_action': return '🪨';
      case 'reschedule': return '📅';
      default: return '🔔';
    }
  };

  const handleProfileImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      // Create a local URL for immediate preview
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);

      // Here you would typically upload to your server/cloud storage
      // For now, we'll just store it locally

      // Example API call (uncomment when you have an upload endpoint):
      /*
      const formData = new FormData();
      formData.append('profileImage', file);
      formData.append('userId', user.id);

      const response = await fetch('/api/upload-profile-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfileImage(data.imageUrl);
      } else {
        throw new Error('Upload failed');
      }
      */

      // Show success message
      setShowUploadSuccess(true);
      setTimeout(() => setShowUploadSuccess(false), 3000);

    } catch (error) {
      console.error('Error uploading profile image:', error);
      alert('Failed to upload profile image. Please try again.');
      setProfileImage(user?.profileImage || null);
    } finally {
      setUploadingImage(false);
    }
  };

  // Action Modal Handlers
  const handlePlanSowingSuccess = (sowingPlan) => {
    console.log('Sowing plan created:', sowingPlan);

    // Show success notification
    const newNotification = {
      id: `sowing_plan_${Math.floor(Math.random() * 1000000)} `,
      type: "sowing",
      title: "Sowing Plan Created",
      message: `${sowingPlan.crop} sowing scheduled for ${sowingPlan.sowingDate}`,
      time: "Just now",
      priority: "medium",
      action: null
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-dismiss notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

  const handleSoilActionSuccess = (soilAction) => {
    console.log('Soil action planned:', soilAction);

    // Show success notification
    const actionLabel = soilAction.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    const newNotification = {
      id: `soil_action_${Math.floor(Math.random() * 1000000)} `,
      type: "soil_action",
      title: "Soil Action Scheduled",
      message: `${actionLabel} scheduled for ${soilAction.actionDate}`,
      time: "Just now",
      priority: "medium",
      action: null
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-dismiss notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

  const closePlanSowingModal = () => {
    setIsPlanSowingOpen(false);
    setSelectedNotificationForAction(null);
  };

  const closeSoilActionModal = () => {
    setIsSoilActionOpen(false);
    setSelectedNotificationForAction(null);
  };

  // Loading Screen Component - Full video playback
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <video
          autoPlay
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
          onEnded={() => setIsLoading(false)}
          onLoadedData={(e) => {
            console.log('Video loaded successfully');
            e.target.currentTime = 0;
          }}
          onCanPlay={() => {
            console.log('Video can start playing');
          }}
          onError={(e) => {
            console.error('Video failed to load:', e);
            setIsLoading(false);
          }}
          onLoadStart={() => {
            console.log('Video load started');
          }}
        >
          <source src="/start.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🌾</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Vasu Vaidya</h1>
                <p className="text-sm text-gray-500">Your Farming Companion</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-gray-600 hover:text-gray-900 text-sm">Support</button>
              <button className="text-gray-600 hover:text-gray-900 text-sm">English</button>
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-2xl shadow-2xl p-6 mb-6">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Enhanced Avatar */}
              <div className="relative group cursor-pointer">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl border border-white/30 overflow-hidden transition-all duration-300 group-hover:scale-105 relative">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-2xl sm:text-3xl drop-shadow-lg">
                      {user?.name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}

                  {/* Loading overlay during upload */}
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}

                  {/* Hover Overlay */}
                  {!uploadingImage && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-6 h-6 text-white mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-white text-xs font-medium">
                          {profileImage ? 'Change' : 'Upload'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  title="Upload profile picture"
                />

                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-300 rounded-full flex items-center justify-center border-2 border-white">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></div>
                </div>

                {/* Success notification */}
                {showUploadSuccess && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-lg animate-bounce">
                    ✓ Uploaded!
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-md">
                    Hello, {user?.name || user?.username || 'Farmer'}! 👋
                  </h2>
                  <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium border border-white/30">
                    Premium Member
                  </span>
                </div>

                {/* Location and ID Cards */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white/80 text-xs font-medium">Location</p>
                      <p className="text-white font-semibold text-sm">{user?.location || 'Not set'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" clipRule="evenodd" />
                        <path d="M8 8h4v4H8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white/80 text-xs font-medium">Farmer ID</p>
                      <p className="text-white font-mono text-sm font-semibold">#{user?.id || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status and Stats */}
            <div className="flex sm:flex-col items-center sm:items-end gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30 text-center">
                <div className="text-white text-2xl mb-1">🌟</div>
                <p className="text-white/90 text-xs font-medium">Active</p>
                <p className="text-white text-sm font-bold">Farmer</p>
              </div>

              <div className="bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                  <span className="text-white text-xs font-medium">Online Now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Plot Details Section */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">🏡 Plot Management</h2>
                <p className="text-gray-600">Add and manage your farm plot details for better crop planning and analysis.</p>
              </div>
              <Button
                onClick={() => setIsPlotDetailsOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                <span className="mr-2">📝</span>
                Add Plot Details
              </Button>
            </div>
          </div>
        </div>

        {/* Appointment Booking Section */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">📅 Book Appointment</h2>
                <p className="text-gray-600">Schedule appointments for your farm plots with agricultural experts.</p>
              </div>
              <Button
                onClick={() => setIsAppointmentOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                <span className="mr-2">📅</span>
                Book Appointment
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Weather Card */}
          <div className="lg:col-span-1">
            <WeatherCard user={user} />
          </div>

          {/* Crop Calendar & Reminders */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">📅</span>
                  <h2 className="text-lg font-semibold text-gray-900">Crop Calendar & Reminders</h2>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">03</span>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getTaskIcon(task.type)}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">{task.type.charAt(0).toUpperCase() + task.type.slice(1)}</span>
                            <span className={`text - xs px - 2 py - 1 rounded - full ${task.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  task.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                              } `}>
                              {task.status === 'overdue' ? 'Overdue' :
                                task.status === 'completed' ? 'Completed' :
                                  task.priority === 'high' ? 'High' : 'Medium'}
                            </span>
                            <span className="text-xs text-gray-500">{task.priority === 'high' ? 'pending' : 'pending'}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span>Crop: <strong>{task.crop}</strong></span>
                            <span>Due: <strong>{task.due}</strong></span>
                            <span className="font-medium">{task.crop}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-3">{task.task}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => markTaskComplete(task.id)}
                              className="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700"
                              disabled={task.status === 'completed'}
                            >
                              {task.status === 'completed' ? 'Completed' : 'Mark Complete'}
                            </button>
                            <button className="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded hover:bg-gray-300">
                              Reschedule
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Smart Notifications */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">🔔</span>
                  <h2 className="text-lg font-semibold text-gray-900">Smart Notifications</h2>
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{notifications.length}</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {notifications.map((notification) => (
                  <div key={notification.id} className={`border rounded - lg p - 4 ${notification.isWeatherAlert ? getWeatherAlertColor(notification) : getPriorityColor(notification.priority)
                    } `}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-xl">{getNotificationIcon(notification)}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-sm">{notification.title}</h3>
                            {notification.isWeatherAlert && (
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                Weather
                              </span>
                            )}
                            {notification.source === 'gemini' && (
                              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                                ✨ AI
                              </span>
                            )}
                            <span className={`text - xs px - 2 py - 1 rounded - full ${notification.priority === 'high' ? 'bg-red-100 text-red-700' :
                                notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                              } `}>
                              {notification.priority === 'high' ? 'High' :
                                notification.priority === 'medium' ? 'Medium' : 'Low'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{notification.time}</span>
                            {notification.action && (
                              <button
                                onClick={() => handleNotificationAction(notification)}
                                className={`text - xs px - 2 py - 1 rounded transition - colors ${notification.isWeatherAlert
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                  } `}
                              >
                                {notification.action}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => dismissNotification(notification.id)}
                        className="text-gray-400 hover:text-gray-600 ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chatbot Button */}
      <button
        onClick={() => setIsChatbotOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40 group"
        title="Ask AI Assistant"
      >
        <span className="text-2xl group-hover:scale-110 transition-transform">🤖</span>
      </button>

      {/* Chatbot Component */}
      <Chatbot
        user={user}
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
      />

      {/* Plot Details Form */}
      {isPlotDetailsOpen && (
        <PlotDetailsForm
          user={user}
          onClose={() => setIsPlotDetailsOpen(false)}
          onSuccess={() => {
            // You can add any success handling here
            console.log('Plot details saved successfully');
          }}
        />
      )}

      {/* Appointment Form */}
      {isAppointmentOpen && (
        <AppointmentForm
          user={user}
          onClose={() => setIsAppointmentOpen(false)}
          onSuccess={() => {
            // You can add any success handling here
            console.log('Appointment booked successfully');
          }}
        />
      )}

      {/* Plan Sowing Modal */}
      {isPlanSowingOpen && selectedNotificationForAction && (
        <PlanSowingModal
          task={selectedNotificationForAction}
          isOpen={isPlanSowingOpen}
          onClose={closePlanSowingModal}
          onReschedule={handlePlanSowingSuccess}
        />
      )}

      {/* Soil Action Modal */}
      {isSoilActionOpen && selectedNotificationForAction && (
        <SoilActionModal
          task={selectedNotificationForAction}
          isOpen={isSoilActionOpen}
          onClose={closeSoilActionModal}
          onReschedule={handleSoilActionSuccess}
        />
      )}
    </div>
  );
}
