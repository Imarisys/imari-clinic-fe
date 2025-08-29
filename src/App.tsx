import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Calendar } from './pages/Calendar';
import { Patients } from './pages/Patients';
import { SettingsPage } from './pages/Settings';
import { Reports } from './pages/Reports';
import { AppointmentStart } from './pages/AppointmentStart';
import { AppointmentDetails } from './pages/AppointmentDetails';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { TranslationProvider } from './context/TranslationContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLoadingSpinner } from './components/common/AppLoadingSpinner';
import { HealthCheckService } from './services/healthCheckService';
import './styles/globals.css';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// App Routes component (needs to be inside AuthProvider)
const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <Patients />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointment/:appointmentId/start"
        element={
          <ProtectedRoute>
            <AppointmentStart />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointment/:appointmentId/details"
        element={
          <ProtectedRoute>
            <AppointmentDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);

  useEffect(() => {
    const checkBackendHealth = async () => {
      setIsCheckingBackend(true);

      try {
        const isHealthy = await HealthCheckService.checkBackendHealth();
        setIsBackendReady(isHealthy);
      } catch (error) {
        console.error('Failed to check backend health:', error);
        setIsBackendReady(false);
      } finally {
        setIsCheckingBackend(false);
      }
    };

    checkBackendHealth();
  }, []);

  // Show loading spinner while checking backend
  if (isCheckingBackend) {
    return <AppLoadingSpinner />;
  }

  // Show error state if backend is not ready after all retries
  if (!isBackendReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-error-50 to-error-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-error-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="material-icons-round text-white text-3xl">error_outline</span>
          </div>
          <h1 className="text-2xl font-bold text-error-700 mb-4">Backend Server Unavailable</h1>
          <p className="text-error-600 mb-4">
            Unable to connect to the backend server. This is a test environment and the server might be starting up.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-error-500 hover:bg-error-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <TranslationProvider>
      <AuthProvider>
        <Router>
          <NotificationProvider>
            <ThemeProvider>
              <AppRoutes />
            </ThemeProvider>
          </NotificationProvider>
        </Router>
      </AuthProvider>
    </TranslationProvider>
  );
}

export default App;
