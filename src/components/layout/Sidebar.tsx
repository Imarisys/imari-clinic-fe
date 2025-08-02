import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../context/TranslationContext';
import { useAuth } from '../../context/AuthContext';
import { SettingsService, settingsEventDispatcher } from '../../services/settingsService';

interface NavItem {
  path: string;
  icon: string;
  labelKey: keyof typeof import('../../i18n/locales/en.json');
}

const navItems: NavItem[] = [
  {
    path: '/dashboard',
    icon: 'dashboard',
    labelKey: 'dashboard'
  },
  {
    path: '/calendar',
    icon: 'calendar_today',
    labelKey: 'calendar'
  },
  {
    path: '/patients',
    icon: 'people',
    labelKey: 'patients'
  },
  {
    path: '/reports',
    icon: 'bar_chart',
    labelKey: 'reports'
  },
  {
    path: '/settings',
    icon: 'settings',
    labelKey: 'settings'
  },
];

export const Sidebar: React.FC = () => {
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
    <aside className="fixed left-4 top-4 w-64 lg:w-80 bg-primary-800 h-[calc(100vh-2rem)] flex flex-col overflow-y-auto shadow-large z-50 rounded-3xl sidebar-scroll-left">
      <div className="relative z-10 p-8 flex-1">
        {/* Logo Section */}
        <div className="flex items-center space-x-4 mb-12 group">
          <div className="relative">
            <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center shadow-primary group-hover:scale-110 transition-transform duration-300">
              <span className="material-icons-round text-white text-2xl">local_hospital</span>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{clinicName || t('clinic_name')}</h1>
            <p className="text-primary-200 text-sm">Healthcare Excellence</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item group relative overflow-hidden ${
                  isActive ? 'nav-item-active' : 'nav-item-inactive'
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-400 rounded-full"></div>
                )}

                {/* Icon with solid background */}
                <div className={`relative p-2 rounded-2xl ${isActive ? 'bg-primary-500' : 'bg-primary-700'} shadow-medium group-hover:scale-110 transition-all duration-300`}>
                  <span className="material-icons-round text-white text-xl">{item.icon}</span>
                </div>

                {/* Label */}
                <span className={`font-medium transition-colors duration-300 ${
                  isActive ? 'text-white' : 'text-primary-200 group-hover:text-white'
                }`}>
                  {t(item.labelKey)}
                </span>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section - User Profile centered with margin */}
      <div className="relative z-10 p-4 mx-4 mb-4">
        <div className="bg-primary-700/50 rounded-3xl p-4 border border-primary-600 group hover:scale-105 transition-transform duration-300">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-primary-400 rounded-full flex items-center justify-center">
                <span className="material-icons-round text-white text-lg">person</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {user ? `Dr. ${user.first_name} ${user.last_name}` : 'Dr. Ahmed Wilson'}
              </p>
              <p className="text-primary-200 text-sm">Administrator</p>
            </div>
            <button
              onClick={handleLogout}
              className="material-icons-round text-primary-200 group-hover:text-white transition-colors duration-300 hover:bg-primary-600 rounded-lg p-1"
              title="Logout"
            >
              logout
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
