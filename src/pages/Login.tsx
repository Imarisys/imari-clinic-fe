import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(''); // Clear previous errors

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (error) {
      // Display the specific error message from the backend
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setLoginError(errorMessage);
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
                placeholder="votre@email.com"
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
                error={loginError}
              />

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
          </div>
        </div>
      </div>
    </div>
  );
};
