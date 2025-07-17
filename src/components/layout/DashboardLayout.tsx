import React from 'react';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-neutral-50 relative overflow-hidden">

      <div className="flex relative z-10">
        <Sidebar />

        <main className="flex-1 p-8 min-h-screen">
          {/* Header with clean design */}
          <div className="bg-white rounded-3xl p-6 mb-8 shadow-medium border border-neutral-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-primary-600 mb-2">
                  Welcome back, Dr. Wilson
                </h2>
                <p className="text-neutral-600">
                  Today is {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* Quick actions */}
              <div className="flex items-center space-x-4">
                <button className="btn-secondary">
                  <span className="material-icons-round mr-2">search</span>
                  Quick Search
                </button>
                <button className="btn-primary">
                  <span className="material-icons-round mr-2">add</span>
                  New Appointment
                </button>
              </div>
            </div>
          </div>

          {/* Main content area with clean styling */}
          <div className="fade-in-element">
            {children}
          </div>

          {/* Floating action button */}
          <button className="fixed bottom-8 right-8 w-16 h-16 bg-primary-500 text-white rounded-full shadow-primary hover:bg-primary-600 hover:scale-110 transition-all duration-300 z-50 group">
            <span className="material-icons-round text-white text-2xl group-hover:rotate-45 transition-transform duration-300">
              add
            </span>
          </button>
        </main>
      </div>
    </div>
  );
};
