import React from 'react';
import {
  UserPlusIcon,
  UsersIcon,
  HeartIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

interface PatientInsightsProps {
  data: any;
}

export const PatientInsights: React.FC<PatientInsightsProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Insights</h3>
        <div className="text-center text-gray-500 py-8">No data available</div>
      </div>
    );
  }

  const insights = data.insights || {};
  const genderData = insights.genderDistribution || {};

  const stats = [
    {
      title: 'Total Patients',
      value: insights.total || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'New Patients',
      value: Math.floor((insights.total || 0) * 0.15),
      icon: UserPlusIcon,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: 'Average Age',
      value: insights.averageAge || 0,
      icon: HeartIcon,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      unit: 'years'
    },
    {
      title: 'Return Rate',
      value: '78%',
      icon: CalendarDaysIcon,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      change: '+5%',
      changeType: 'increase'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} rounded-lg p-6 border border-gray-200`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <div className="flex items-baseline space-x-2 mt-2">
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                    {stat.unit && <span className="text-lg text-gray-600 ml-1">{stat.unit}</span>}
                  </p>
                </div>
                {stat.change && (
                  <div className="flex items-center mt-2">
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">vs last period</span>
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

      {/* Gender Distribution */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Gender Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Female</span>
              <span className="text-sm font-bold text-pink-600">
                {genderData.female || 0} ({Math.round(((genderData.female || 0) / insights.total) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="h-4 bg-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${((genderData.female || 0) / insights.total) * 100}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Male</span>
              <span className="text-sm font-bold text-blue-600">
                {genderData.male || 0} ({Math.round(((genderData.male || 0) / insights.total) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="h-4 bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${((genderData.male || 0) / insights.total) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Visual representation */}
          <div className="flex items-center justify-center">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="8"
                  strokeDasharray={`${((genderData.female || 0) / insights.total) * 251.2} 251.2`}
                  strokeDashoffset="0"
                  transform="rotate(-90 50 50)"
                  className="transition-all duration-500"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeDasharray={`${((genderData.male || 0) / insights.total) * 251.2} 251.2`}
                  strokeDashoffset={-((genderData.female || 0) / insights.total) * 251.2}
                  transform="rotate(-90 50 50)"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{insights.total}</p>
                  <p className="text-xs text-gray-600">Patients</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
