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

        <main className="flex-1 p-8 min-h-screen ml-64 lg:ml-80">
          {/* Main content area with clean styling */}
          <div className="fade-in-element">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
