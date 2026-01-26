"use client";

/**
 * Component: AuthForm
 * Purpose: Provides a secure interface for user authentication and 
 *          profile registration via internal backend API routes.
 * 
 * Flow:
 * 1. Collects user credentials (email, password, metadata).
 * 2. Authenticates against the backend login/register endpoints.
 * 3. Synchronizes session state to the parent dashboard.
 */

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";

/**
 * Stateful authentication component.
 * Supports toggle between 'Sign In' and 'Sign Up' modes with dynamic 
 * metadata collection for agricultural profiles.
 */
const AuthForm = ({ onLogin, onSignup, onClose, isOpen }) => {
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authForm, setAuthForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    location: '',
    email: '',
    phoneNumber: ''
  });

  /**
   * Universal Input Handler
   * Maps field names to state keys for the unified auth form object.
   */
  const handleAuthFormChange = (e) => {
    const { name, value } = e.target;
    setAuthForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Orchestrates the authentication lifecycle.
   * Directs requests to either the registration or login API pathways.
   */
  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { username, password, confirmPassword, name, location, email, phoneNumber } = authForm;

    if (isSignUpMode) {
      // Sign-up validation
      if (!name.trim()) {
        alert('Please enter your name!');
        setIsLoading(false);
        return;
      }
      if (!email.trim()) {
        alert('Please enter your email!');
        setIsLoading(false);
        return;
      }
      if (!phoneNumber.trim()) {
        alert('Please enter your phone number!');
        setIsLoading(false);
        return;
      }
      if (!location.trim()) {
        alert('Please enter your location!');
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        alert('Passwords do not match!');
        setIsLoading(false);
        return;
      }
      if (name.length < 2) {
        alert('Name must be at least 2 characters long!');
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        alert('Password must be at least 6 characters long!');
        setIsLoading(false);
        return;
      }

      try {
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
          })
        });

        const result = await response.json();
        if (result.success) {
          onSignup(result.user);
          setAuthForm({
            username: '',
            password: '',
            confirmPassword: '',
            name: '',
            location: '',
            email: '',
            phoneNumber: ''
          });
          setIsSignUpMode(false);
        } else {
          alert(`Registration failed: ${result.message} `);
        }
      } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
      }
    } else {
      // Login validation
      if (!username.trim() || !password.trim()) {
        alert('Please enter both username and password!');
        setIsLoading(false);
        return;
      }

      try {
        const loginEmail = username === 'crop' ? 'crop@demo.com' : username;

        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: loginEmail,
            password: password
          })
        });

        const result = await response.json();

        if (result.success) {
          onLogin(result.user);
          setAuthForm({
            username: '',
            password: '',
            confirmPassword: '',
            name: '',
            location: '',
            email: '',
            phoneNumber: ''
          });
        } else {
          alert(`Login failed: ${result.message} `);
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
      }
    }

    setIsLoading(false);
  };

  // Toggle between login and sign-up
  const toggleAuthMode = () => {
    setIsSignUpMode(!isSignUpMode);
    setAuthForm({
      username: '',
      password: '',
      confirmPassword: '',
      name: '',
      location: '',
      email: '',
      phoneNumber: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 w-full max-w-md">

          {/* Decorative Top Section */}
          <div className="relative bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 px-6 pt-6 pb-20">
            <div className="absolute inset-0 bg-black/10"></div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors duration-200 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Logo/Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              {isSignUpMode ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-white/80 text-center text-sm">
              {isSignUpMode ? 'Join our farming community' : 'Sign in to your account'}
            </p>
          </div>

          {/* Form Section */}
          <div className="px-6 py-8 -mt-12 relative z-10">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">

              {/* Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                <button
                  type="button"
                  onClick={() => !isLoading && setIsSignUpMode(false)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${!isSignUpMode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                  disabled={isLoading}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => !isLoading && setIsSignUpMode(true)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${isSignUpMode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                  disabled={isLoading}
                >
                  Sign Up
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAuth} className="space-y-4">
                {isSignUpMode ? (
                  // Sign Up Fields
                  <div className="space-y-4 animate-fade-in">
                    <div className="floating-label-group">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={authForm.name}
                        onChange={handleAuthFormChange}
                        className="floating-label-input peer"
                        placeholder=" "
                        required
                        disabled={isLoading}
                      />
                      <label htmlFor="name" className="floating-label">
                        Full Name
                      </label>
                    </div>

                    <div className="floating-label-group">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={authForm.email}
                        onChange={handleAuthFormChange}
                        className="floating-label-input peer"
                        placeholder=" "
                        required
                        disabled={isLoading}
                      />
                      <label htmlFor="email" className="floating-label">
                        Email Address
                      </label>
                    </div>

                    <div className="floating-label-group">
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={authForm.phoneNumber}
                        onChange={handleAuthFormChange}
                        className="floating-label-input peer"
                        placeholder=" "
                        required
                        disabled={isLoading}
                      />
                      <label htmlFor="phoneNumber" className="floating-label">
                        Phone Number
                      </label>
                    </div>

                    <div className="floating-label-group">
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={authForm.location}
                        onChange={handleAuthFormChange}
                        className="floating-label-input peer"
                        placeholder=" "
                        required
                        disabled={isLoading}
                      />
                      <label htmlFor="location" className="floating-label">
                        Farm Location
                      </label>
                    </div>

                    <div className="floating-label-group">
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={authForm.password}
                        onChange={handleAuthFormChange}
                        className="floating-label-input peer"
                        placeholder=" "
                        required
                        disabled={isLoading}
                        minLength={6}
                      />
                      <label htmlFor="password" className="floating-label">
                        Password
                      </label>
                    </div>

                    <div className="floating-label-group">
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={authForm.confirmPassword}
                        onChange={handleAuthFormChange}
                        className="floating-label-input peer"
                        placeholder=" "
                        required
                        disabled={isLoading}
                        minLength={6}
                      />
                      <label htmlFor="confirmPassword" className="floating-label">
                        Confirm Password
                      </label>
                    </div>
                  </div>
                ) : (
                  // Sign In Fields
                  <div className="space-y-4 animate-fade-in">
                    <div className="floating-label-group">
                      <input
                        type="email"
                        id="username"
                        name="username"
                        value={authForm.username}
                        onChange={handleAuthFormChange}
                        className="floating-label-input peer"
                        placeholder=" "
                        required
                        disabled={isLoading}
                      />
                      <label htmlFor="username" className="floating-label">
                        Email Address
                      </label>
                    </div>

                    <div className="floating-label-group">
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={authForm.password}
                        onChange={handleAuthFormChange}
                        className="floating-label-input peer"
                        placeholder=" "
                        required
                        disabled={isLoading}
                      />
                      <label htmlFor="password" className="floating-label">
                        Password
                      </label>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-medium py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      {isSignUpMode ? 'Creating Account...' : 'Signing In...'}
                    </div>
                  ) : (
                    isSignUpMode ? 'Create Account' : 'Sign In'
                  )}
                </Button>
              </form>

              {/* Demo Credentials for Login */}
              {!isSignUpMode && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm text-gray-600 font-medium mb-2">Demo Credentials:</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p><span className="font-mono bg-gray-200 px-1 rounded">crop@demo.com</span></p>
                    <p><span className="font-mono bg-gray-200 px-1 rounded">crop1234</span></p>
                  </div>
                </div>
              )}

              {/* Sign Up Requirements */}
              {isSignUpMode && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm text-blue-700 font-medium mb-2">Requirements:</p>
                  <ul className="text-xs text-blue-600 space-y-1">
                    <li>• Name: minimum 2 characters</li>
                    <li>• Password: minimum 6 characters</li>
                    <li>• Passwords must match</li>
                    <li>• All fields are required</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
