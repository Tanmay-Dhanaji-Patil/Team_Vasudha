"use client";

import { useState } from "react";

export default function AuthForm({ isOpen, onLogin, onSignup, onClose }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  if (!isOpen) return null;

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = { name: form.name || form.email.split("@")[0], email: form.email };
    if (mode === "login") onLogin?.(user);
    else onSignup?.(user);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{mode === "login" ? "Sign In" : "Create Account"}</h3>
          <button onClick={onClose} className="text-sm text-gray-500">Close</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <input name="name" value={form.name} onChange={handleChange} placeholder="Full name" className="w-full border rounded px-3 py-2" />
          )}
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" className="w-full border rounded px-3 py-2" required />
          <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" className="w-full border rounded px-3 py-2" required />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{mode === "login" ? "Sign In" : "Sign Up"}</button>
              <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-sm text-gray-600">{mode === "login" ? "Create account" : "Have an account? Sign in"}</button>
            </div>
            <button type="button" onClick={onClose} className="text-sm text-red-500">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
