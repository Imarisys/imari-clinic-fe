import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Calendar } from './pages/Calendar';
import { Patients } from './pages/Patients';
import { NotificationProvider } from './context/NotificationContext';
import './styles/globals.css';

function App() {
  // Mock authentication state (replace with actual auth later)
  const isAuthenticated = true;

  return (
    <Router>
      <NotificationProvider>
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route
            path="/dashboard"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/calendar"
            element={isAuthenticated ? <Calendar /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/patients"
            element={isAuthenticated ? <Patients /> : <Navigate to="/login" replace />}
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </NotificationProvider>
    </Router>
  );
}

export default App;
