import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../context/TranslationContext';
import { useAuth } from '../../context/AuthContext';
import { SettingsService, settingsEventDispatcher } from '../../services/settingsService';

interface NavItem {
  path: string;
  icon: string;
  labelKey: keyof typeof import('../../i18n/locales/en.json');
  color: string;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const navItems: NavItem[] = [
  {
    path: '/dashboard',
    icon: 'dashboard',
    labelKey: 'dashboard',
    color: 'bg-blue-500'
  },
  {
    path: '/calendar',
    icon: 'calendar_today',
    labelKey: 'calendar',
    color: 'bg-green-500'
  },
  {
    path: '/patients',
    icon: 'people',
    labelKey: 'patients',
    color: 'bg-purple-500'
  },
  {
    path: '/reports',
    icon: 'bar_chart',
    labelKey: 'reports',
    color: 'bg-orange-500'
  },
  {
    path: '/settings',
    icon: 'settings',
    labelKey: 'settings',
    color: 'bg-gray-500'
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [clinicName, setClinicName] = useState<string>('');

  useEffect(() => {
    const loadClinicName = async () => {
      try {
        // First try to get from cache
        const cachedName = SettingsService.getClinicName();
        if (cachedName) {
          setClinicName(cachedName);
        } else {
          // If not in cache, fetch settings
          const settings = await SettingsService.getSettings();
          setClinicName(settings.clinic_name);
        }
      } catch (error) {
        console.error('Error loading clinic name:', error);
        // Fallback to user clinic name or default
        setClinicName(user?.clinic_name || t('clinic_name'));
      }
    };

    // Load clinic name initially
    loadClinicName();

    // Listen for settings updates
    const handleSettingsUpdate = (event: any) => {
      const updatedSettings = event.detail;
      if (updatedSettings?.clinic_name) {
        setClinicName(updatedSettings.clinic_name);
      }
    };

    settingsEventDispatcher.addEventListener('settingsUpdated', handleSettingsUpdate);

    // Cleanup listener on unmount
    return () => {
      settingsEventDispatcher.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, [user, t]);

  // Reload clinic name when user changes (for different doctor logins)
  useEffect(() => {
    const loadClinicNameForUser = async () => {
      try {
        // Clear cache when user changes to ensure fresh data
        SettingsService.clearCache();
        const settings = await SettingsService.getSettings();
        setClinicName(settings.clinic_name);
      } catch (error) {
        console.error('Error loading clinic name for user:', error);
        setClinicName(user?.clinic_name || t('clinic_name'));
      }
    };

    if (user) {
      loadClinicNameForUser();
    }
  }, [user?.id, t]); // Trigger when user ID changes

  const handleLogout = () => {
    // Clear settings cache on logout
    SettingsService.clearCache();
    logout();
  };

  return (
    <div className="relative">
      {/* Sidebar Container */}
      <aside className={`fixed left-0 top-0 ${isCollapsed ? 'w-24' : 'w-80'} h-screen bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900 flex flex-col overflow-hidden shadow-2xl transition-all duration-500 ease-in-out z-50`}>

        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary-700/20 to-transparent"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.05) 1px, transparent 1px),
                           radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col h-full">

          {/* Header Section */}
          <div className={`${isCollapsed ? 'p-4' : 'p-8'} transition-all duration-300`}>

            {/* Toggle Button */}
            <button
              onClick={onToggle}
              className={`absolute ${isCollapsed ? 'top-4 right-2' : 'top-6 right-4'} w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group border border-white/10 z-20`}
            >
              <span className="material-icons-round text-white text-lg group-hover:rotate-180 transition-transform duration-300">
                {isCollapsed ? 'menu_open' : 'menu'}
              </span>
            </button>

            {/* Logo & Clinic Name */}
            <div className={`${isCollapsed ? 'items-center justify-center' : 'items-start'} flex flex-col transition-all duration-300 mt-4`}>
              <div className="relative mb-6">
                {/* Logo with animated background */}
                <div className={`${isCollapsed ? 'w-12 h-12' : 'w-16 h-16'} relative transition-all duration-300`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl"></div>
                  <div className="absolute inset-0 bg-white/10 rounded-2xl backdrop-blur-sm"></div>
                  <div className="relative w-full h-full flex items-center justify-center">
                    <span className={`material-icons-round text-white ${isCollapsed ? 'text-2xl' : 'text-3xl'}`}>
                      local_hospital
                    </span>
                  </div>
                  {/* Pulse animation */}
                  <div className="absolute inset-0 bg-primary-400/30 rounded-2xl animate-pulse"></div>
                </div>
              </div>

              {!isCollapsed && (
                <div className="text-center lg:text-left">
                  <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
                    {clinicName || t('clinic_name')}
                  </h1>
                  <div className="flex items-center space-x-2 text-primary-200">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Healthcare Excellence</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Section */}
          <div className={`flex-1 ${isCollapsed ? 'px-3' : 'px-6'} transition-all duration-300`}>
            <nav className="space-y-2">
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group relative flex items-center ${isCollapsed ? 'justify-center p-4' : 'p-4 space-x-4'} rounded-2xl transition-all duration-300 hover:scale-105 ${
                      isActive 
                        ? 'bg-white/15 backdrop-blur-sm border border-white/20' 
                        : 'hover:bg-white/10 backdrop-blur-sm border border-transparent hover:border-white/10'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                    title={isCollapsed ? t(item.labelKey) : undefined}
                  >

                    {/* Icon Container */}
                    <div className={`relative ${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'} transition-all duration-300`}>
                      {/* Icon Background */}
                      <div className={`${item.color} rounded-xl opacity-${isActive ? '100' : '70'} group-hover:opacity-100 transition-all duration-300 w-full h-full`}></div>

                      {/* Icon */}
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                        <span className={`material-icons-round text-white ${isCollapsed ? 'text-xl' : 'text-2xl'} transition-all duration-300 group-hover:scale-110`}>
                          {item.icon}
                        </span>
                      </div>
                    </div>

                    {/* Label */}
                    {!isCollapsed && (
                      <div className="flex-1">
                        <span className={`font-semibold transition-all duration-300 ${
                          isActive ? 'text-white' : 'text-primary-100 group-hover:text-white'
                        }`}>
                          {t(item.labelKey)}
                        </span>
                        {isActive && (
                          <div className="w-8 h-0.5 bg-white rounded-full mt-1 animate-pulse"></div>
                        )}
                      </div>
                    )}

                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile Section */}
          <div className={`${isCollapsed ? 'p-3' : 'p-6'} transition-all duration-300`}>
            <div className={`relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden transition-all duration-300 hover:bg-white/15 group ${isCollapsed ? 'p-3' : 'p-5'}`}>

              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-primary-800/20"></div>

              <div className={`relative flex items-center ${isCollapsed ? 'justify-center' : 'space-x-4'}`}>

                {/* User Avatar */}
                <div className="relative">
                  <div className={`${isCollapsed ? 'w-12 h-12' : 'w-14 h-14'} bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110`}>
                    <span className={`material-icons-round text-white ${isCollapsed ? 'text-xl' : 'text-2xl'}`}>
                      person
                    </span>
                  </div>
                  {/* Online Status */}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>

                {!isCollapsed && (
                  <>
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate text-lg">
                        {user ? `Dr. ${user.first_name} ${user.last_name}` : 'Dr. Ahmed Wilson'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <p className="text-primary-200 text-sm font-medium">Administrator</p>
                      </div>
                    </div>

                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="w-10 h-10 bg-white/10 hover:bg-red-500/20 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group/logout border border-white/10 hover:border-red-400/30"
                      title="Logout"
                    >
                      <span className="material-icons-round text-primary-200 group-hover/logout:text-red-400 transition-colors duration-300">
                        logout
                      </span>
                    </button>
                  </>
                )}

                {isCollapsed && (
                  <button
                    onClick={handleLogout}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                    title="Logout"
                  >
                    <span className="material-icons-round text-white text-xs">
                      logout
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar Backdrop for Mobile */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden z-40"
          onClick={onToggle}
        ></div>
      )}
    </div>
  );
};
