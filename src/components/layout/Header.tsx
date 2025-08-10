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

export const Header: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [clinicName, setClinicName] = useState<string>('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const loadClinicName = async () => {
      try {
        const cachedName = SettingsService.getClinicName();
        if (cachedName) {
          setClinicName(cachedName);
        } else {
          const settings = await SettingsService.getSettings();
          setClinicName(settings.clinic_name);
        }
      } catch (error) {
        console.error('Error loading clinic name:', error);
        setClinicName(user?.clinic_name || t('clinic_name'));
      }
    };

    loadClinicName();

    const handleSettingsUpdate = (event: any) => {
      const updatedSettings = event.detail;
      if (updatedSettings?.clinic_name) {
        setClinicName(updatedSettings.clinic_name);
      }
    };

    settingsEventDispatcher.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => {
      settingsEventDispatcher.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, [user, t]);

  const handleLogout = () => {
    SettingsService.clearCache();
    logout();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 shadow-2xl border-b border-primary-700/30">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary-700/20 to-transparent"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.05) 1px, transparent 1px),
                         radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>

      <div className="relative z-10 h-full flex items-center justify-between px-6 lg:px-8">
        {/* Left Section - Logo & Clinic Name */}
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            {/* Logo */}
            <div className="relative w-12 h-12 transition-all duration-300 group-hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl"></div>
              <div className="absolute inset-0 bg-white/10 rounded-2xl backdrop-blur-sm"></div>
              <div className="relative w-full h-full flex items-center justify-center">
                <span className="material-icons-round text-white text-2xl">
                  local_hospital
                </span>
              </div>
              <div className="absolute inset-0 bg-primary-400/30 rounded-2xl animate-pulse"></div>
            </div>

            {/* Clinic Name */}
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {clinicName || t('clinic_name')}
              </h1>
              <div className="flex items-center space-x-2 text-primary-200">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">Healthcare Excellence</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Center Section - Navigation */}
        <nav className="flex items-center space-x-1">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex items-center px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 ${
                  isActive 
                    ? 'bg-white/15 backdrop-blur-sm border border-white/20' 
                    : 'hover:bg-white/10 backdrop-blur-sm border border-transparent hover:border-white/10'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Icon */}
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <div className={`absolute inset-0 ${item.color} rounded-lg opacity-20 transition-opacity duration-300 ${
                    isActive ? 'opacity-40' : 'group-hover:opacity-30'
                  }`}></div>
                  <span className={`material-icons-round relative z-10 text-white transition-all duration-300 ${
                    isActive ? 'text-lg' : 'text-base group-hover:text-lg'
                  }`}>
                    {item.icon}
                  </span>
                </div>

                {/* Label */}
                <span className={`ml-2 font-medium text-white transition-all duration-300 hidden lg:block ${
                  isActive ? 'text-white' : 'text-white/80 group-hover:text-white'
                }`}>
                  {t(item.labelKey)}
                </span>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Section - User Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 group"
          >
            {/* User Avatar */}
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
              <span className="material-icons-round text-white text-sm">person</span>
            </div>

            {/* User Info */}
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-white">
                Dr. {user?.first_name} {user?.last_name}
              </div>
              <div className="text-xs text-primary-200">Healthcare Professional</div>
            </div>

            {/* Dropdown Arrow */}
            <span className={`material-icons-round text-white text-sm transition-transform duration-300 ${
              isUserMenuOpen ? 'rotate-180' : ''
            }`}>
              expand_more
            </span>
          </button>

          {/* User Dropdown Menu */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
              <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                    <span className="material-icons-round text-white">person</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">
                      Dr. {user?.first_name} {user?.last_name}
                    </div>
                    <div className="text-sm text-gray-600">{user?.clinic_name}</div>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-colors duration-200"
                >
                  <span className="material-icons-round mr-3 text-red-500">logout</span>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        ></div>
      )}
    </header>
  );
};
