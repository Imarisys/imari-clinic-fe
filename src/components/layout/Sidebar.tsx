import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../context/TranslationContext';
import { LanguageSelector } from '../common/LanguageSelector';

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

  return (
    <aside className="w-80 bg-primary-800 m-4 rounded-3xl flex flex-col justify-between h-[calc(100vh-2rem)] overflow-hidden relative shadow-large">

      <div className="relative z-10 p-8">
        {/* Logo Section */}
        <div className="flex items-center space-x-4 mb-12 group">
          <div className="relative">
            <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center shadow-primary group-hover:scale-110 transition-transform duration-300">
              <span className="material-icons-round text-white text-2xl">local_hospital</span>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{t('clinic_name')}</h1>
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
                <div className={`relative p-2 rounded-xl ${isActive ? 'bg-primary-500' : 'bg-primary-700'} shadow-medium group-hover:scale-110 transition-all duration-300`}>
                  <span className="material-icons-round text-white text-xl">{item.icon}</span>
                </div>

                {/* Label */}
                <span className={`font-medium transition-colors duration-300 ${
                  isActive ? 'text-white' : 'text-primary-200 group-hover:text-white'
                }`}>
                  {t(item.labelKey)}
                </span>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              </Link>
            );
          })}
        </nav>

        {/* Quick Stats */}
        <div className="mt-12 space-y-4">
          <div className="bg-primary-700/50 rounded-2xl p-4 border border-primary-600 group hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-200 text-sm">Today's Appointments</p>
                <p className="text-white text-2xl font-bold">12</p>
              </div>
              <div className="w-10 h-10 bg-success-500 rounded-xl flex items-center justify-center">
                <span className="material-icons-round text-white">event</span>
              </div>
            </div>
          </div>

          <div className="bg-primary-700/50 rounded-2xl p-4 border border-primary-600 group hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-200 text-sm">Active Patients</p>
                <p className="text-white text-2xl font-bold">248</p>
              </div>
              <div className="w-10 h-10 bg-primary-400 rounded-xl flex items-center justify-center">
                <span className="material-icons-round text-white">people</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="relative z-10 p-8 mt-auto">
        <LanguageSelector />

        {/* User Profile */}
        <div className="mt-6 bg-primary-700/50 rounded-2xl p-4 border border-primary-600 group hover:scale-105 transition-transform duration-300">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-primary-400 rounded-full flex items-center justify-center">
                <span className="material-icons-round text-white text-lg">person</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">Dr. Sarah Wilson</p>
              <p className="text-primary-200 text-sm">Administrator</p>
            </div>
            <span className="material-icons-round text-primary-200 group-hover:text-white transition-colors duration-300">
              more_vert
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
