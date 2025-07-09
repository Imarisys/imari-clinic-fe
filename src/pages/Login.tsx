import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

export const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement login logic later
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8 md:py-12 bg-[--neutral-background-light]">
      <div className="relative p-8 md:p-12 rounded-xl w-full max-w-md bg-[--neutral-background-card] shadow-lg border border-gray-200">
        <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-[#0057A3] via-[#00B09B] to-[#FFA500] rounded-tl-xl rounded-tr-xl"></div>

        <div className="flex justify-center mb-6 pt-6">
          <div className="bg-[--secondary-blue] p-3 rounded-full shadow-md">
            <span className="material-icons text-[--primary-blue] text-4xl">medical_services</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Doctor Portal Login</h1>
        <p className="text-[--neutral-text-secondary] text-center mb-8 text-sm">
          Access your dashboard to manage patient appointments.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            icon="alternate_email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />

          <Input
            label="Password"
            type="password"
            icon="lock"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            required
          />

          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center">
              <input type="checkbox" className="rounded text-[--primary-blue]" />
              <span className="ml-2 text-sm">Remember me</span>
            </label>
            <a href="#" className="text-sm text-[--primary-blue] hover:underline">
              Forgot Password?
            </a>
          </div>

          <Button type="submit" fullWidth>
            Log In
          </Button>
        </form>
      </div>
    </div>
  );
};
