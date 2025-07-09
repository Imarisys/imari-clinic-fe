import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { path: '/calendar', icon: 'calendar_today', label: 'Calendar' },
  { path: '/patients', icon: 'people', label: 'Patients' },
  { path: '/reports', icon: 'bar_chart', label: 'Reports' },
  { path: '/settings', icon: 'settings', label: 'Settings' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white p-6 shadow-lg rounded-r-xl flex flex-col justify-between h-screen">
      <div>
        <div className="flex items-center space-x-2 mb-10">
          <div className="h-8 w-8 rounded-full bg-blue-500"></div>
          <h1 className="text-xl font-semibold text-gray-700">Imarisys Clinic</h1>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center space-x-3 p-2 rounded-lg transition-colors duration-150
                ${location.pathname === item.path
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }
              `}
            >
              <span className="material-icons">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
};
