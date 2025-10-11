"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Dashboard({ user, onLogout }) {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "weather",
      title: "Weather Alert",
      message: "Rain expected tomorrow, avoid pesticide spraying.",
      time: "2 hours ago",
      priority: "high",
      action: "Take Action"
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
  ]);

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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'weather':
        return '⛈️';
      case 'market':
        return '📈';
      case 'soil':
        return '🌱';
      case 'irrigation':
        return '💧';
      default:
        return '🔔';
    }
  };

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
              <button className="text-gray-600 hover:text-gray-900">Support</button>
              <button className="text-gray-600 hover:text-gray-900">English</button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
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
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Crop Calendar & Reminders */}
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
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            task.status === 'overdue' ? 'bg-red-100 text-red-700' :
                            task.status === 'completed' ? 'bg-green-100 text-green-700' :
                            task.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
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

          {/* Smart Notifications */}
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
                <div key={notification.id} className={`border rounded-lg p-4 ${getPriorityColor(notification.priority)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm">{notification.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            notification.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {notification.priority === 'high' ? 'High' : 'Medium'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{notification.time}</span>
                          {notification.action && (
                            <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
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
  );
}