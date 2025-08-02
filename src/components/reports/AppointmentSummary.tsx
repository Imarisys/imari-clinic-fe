import React from 'react';
import {
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface AppointmentSummaryProps {
  data: any[];
}

export const AppointmentSummary: React.FC<AppointmentSummaryProps> = ({ data }) => {
  const summary = data[0] || {};

  const stats = [
    {
      title: 'Total Appointments',
      value: summary.total || 0,
      icon: CalendarIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Completed',
      value: summary.completed || 0,
      percentage: summary.completionRate || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Cancelled',
      value: summary.cancelled || 0,
      percentage: summary.cancellationRate || 0,
      icon: XCircleIcon,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'No Shows',
      value: summary.noShow || 0,
      percentage: summary.noShowRate || 0,
      icon: ExclamationTriangleIcon,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className={`${stat.bgColor} rounded-lg p-6 border border-gray-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <div className="flex items-center space-x-2 mt-2">
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                {stat.percentage !== undefined && (
                  <span className={`text-sm font-medium ${stat.textColor}`}>
                    ({stat.percentage}%)
                  </span>
                )}
              </div>
              {stat.percentage !== undefined && (
                <div className="flex items-center mt-2">
                  {stat.percentage > 85 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className="text-xs text-gray-500">vs last period</span>
                </div>
              )}
            </div>
            <div className={`${stat.color} p-3 rounded-lg`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
