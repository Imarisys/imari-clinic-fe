import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { AIChat } from '../common/AIChat';

interface DashboardLayoutProps {
  children: React.ReactNode;
  forceCollapsed?: boolean;
  onSidebarToggle?: (isCollapsed: boolean) => void;
}

export const DashboardLayout = ({ children, forceCollapsed, onSidebarToggle }: DashboardLayoutProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Update sidebar state when forceCollapsed prop changes
  useEffect(() => {
    if (forceCollapsed !== undefined && forceCollapsed !== isSidebarCollapsed) {
      setIsSidebarCollapsed(forceCollapsed);
    }
  }, [forceCollapsed]);

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    onSidebarToggle?.(newState);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-300/20 rounded-full blur-3xl"></div>
      </div>

      <div className="flex relative z-10">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />

        <main className={`flex-1 min-h-screen transition-all duration-500 ease-in-out ${
          isSidebarCollapsed ? 'ml-24' : 'ml-80'
        }`}>
          <div className="p-8 lg:p-12">
            {/* Main content area with enhanced styling */}
            <div className="fade-in-element">
              {children}
            </div>
          </div>
        </main>
      </div>
      
      {/* AI Chat Widget */}
      <AIChat />
    </div>
  );
};
