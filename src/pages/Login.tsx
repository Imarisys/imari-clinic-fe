import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';

export const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      showNotification('success', 'Login Successful', 'Welcome back to your dashboard!');
      navigate('/dashboard');
    } catch (error) {
      // Display the specific error message from the backend
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      showNotification('error', 'Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-500 relative overflow-hidden">
      {/* Clean background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Medical icons */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 text-white/10">
          <span className="material-icons-round text-6xl">medical_services</span>
        </div>
        <div className="absolute top-40 right-32 text-white/10">
          <span className="material-icons-round text-4xl">favorite</span>
        </div>
        <div className="absolute bottom-32 left-32 text-white/10">
          <span className="material-icons-round text-5xl">local_hospital</span>
        </div>
        <div className="absolute bottom-20 right-20 text-white/10">
          <span className="material-icons-round text-4xl">healing</span>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-md">
          {/* Main login card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-large fade-in-element border border-white/20">
            {/* Logo section */}
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <div className="w-20 h-20 bg-primary-500 rounded-3xl flex items-center justify-center shadow-primary mb-4 mx-auto hover:scale-110 transition-transform duration-300">
                  <span className="material-icons-round text-white text-3xl">local_hospital</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-primary-600 mb-2">HealthCare Pro</h1>
              <p className="text-neutral-600">Secure Doctor Portal Access</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email Address"
                type="email"
                icon="alternate_email"
                placeholder="doctor@healthcare.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                variant="default"
              />

              <Input
                label="Password"
                type="password"
                icon="lock"
                placeholder="Enter your secure password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                variant="default"
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2" />
                  <span className="text-neutral-600">Remember me</span>
                </label>
                <a href="#" className="text-primary-600 hover:text-primary-700 transition-colors duration-300">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                icon="login"
                className="mt-8"
                loading={isLoading}
              >
                Sign In to Dashboard
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-neutral-500">Or continue with</span>
              </div>
            </div>

            {/* Alternative login methods */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" icon="fingerprint" size="md" fullWidth>
                Biometric
              </Button>
              <Button variant="secondary" icon="badge" size="md" fullWidth>
                ID Card
              </Button>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 pt-6 border-t border-neutral-200">
              <p className="text-neutral-500 text-sm">
                Need help? <a href="#" className="text-primary-600 hover:text-primary-700 transition-colors duration-300">Contact Support</a>
              </p>
            </div>
          </div>

          {/* Info cards */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center slide-up-element border border-white/20" style={{ animationDelay: '0.1s' }}>
              <div className="w-8 h-8 bg-success-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                <span className="material-icons-round text-white text-sm">security</span>
              </div>
              <p className="text-xs text-neutral-600">Secure</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center slide-up-element border border-white/20" style={{ animationDelay: '0.2s' }}>
              <div className="w-8 h-8 bg-primary-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                <span className="material-icons-round text-white text-sm">speed</span>
              </div>
              <p className="text-xs text-neutral-600">Fast</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center slide-up-element border border-white/20" style={{ animationDelay: '0.3s' }}>
              <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                <span className="material-icons-round text-white text-sm">verified</span>
              </div>
              <p className="text-xs text-neutral-600">Trusted</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
