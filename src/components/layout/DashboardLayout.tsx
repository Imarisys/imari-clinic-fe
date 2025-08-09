import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AIChat } from '../common/AIChat';
import { SettingsService } from '../../services/settingsService';

interface DashboardLayoutProps {
  children: React.ReactNode;
  forceCollapsed?: boolean;
  onSidebarToggle?: (isCollapsed: boolean) => void;
}

export const DashboardLayout = ({ children, forceCollapsed, onSidebarToggle }: DashboardLayoutProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [layoutPosition, setLayoutPosition] = useState<'sidebar' | 'header'>('sidebar');
  const [isLoadingLayout, setIsLoadingLayout] = useState(true);

  // Load layout preference from settings
  useEffect(() => {
    const loadLayoutPreference = async () => {
      try {
        const settings = await SettingsService.getSettings();
        setLayoutPosition(settings.layout_position || 'sidebar');
      } catch (error) {
        console.error('Error loading layout preference:', error);
        setLayoutPosition('sidebar'); // Default fallback
      } finally {
        setIsLoadingLayout(false);
      }
    };

    loadLayoutPreference();

    // Listen for settings updates
    const handleSettingsUpdate = (event: any) => {
      const updatedSettings = event.detail;
      if (updatedSettings?.layout_position) {
        setLayoutPosition(updatedSettings.layout_position);
      }
    };

    const settingsEventDispatcher = (SettingsService as any).settingsEventDispatcher;
    if (settingsEventDispatcher) {
      settingsEventDispatcher.addEventListener('settingsUpdated', handleSettingsUpdate);
      return () => {
        settingsEventDispatcher.removeEventListener('settingsUpdated', handleSettingsUpdate);
      };
    }
  }, []);

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

  // Show loading state while determining layout
  if (isLoadingLayout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-300/20 rounded-full blur-3xl"></div>
      </div>

      {layoutPosition === 'header' ? (
        // Header Layout
        <div className="relative z-10">
          <Header />
          <main className="pt-20 min-h-screen">
            <div className="p-8 lg:p-12">
              <div className="fade-in-element">
                {children}
              </div>
            </div>
          </main>
        </div>
      ) : (
        // Sidebar Layout
        <div className="flex relative z-10">
          <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
          <main className={`flex-1 min-h-screen transition-all duration-500 ease-in-out ${
            isSidebarCollapsed ? 'ml-24' : 'ml-80'
          }`}>
            <div className="p-8 lg:p-12">
              <div className="fade-in-element">
                {children}
              </div>
            </div>
          </main>
        </div>
      )}

      {/* AI Chat Widget */}
      <AIChat />
    </div>
  );
};
