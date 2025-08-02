import React from 'react';
import {
  ClockIcon,
  ChartBarIcon,
  StarIcon,
  UserPlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface PerformanceMetricsProps {
  data: any;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
        <div className="text-center text-gray-500 py-8">No data available</div>
      </div>
    );
  }

  const metrics = data.metrics || {};

  const performanceStats = [
    {
      title: 'Average Wait Time',
      value: `${metrics.averageWaitTime || 0}`,
      unit: 'min',
      icon: ClockIcon,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      target: '< 15 min',
      status: (metrics.averageWaitTime || 0) <= 15 ? 'good' : 'warning'
    },
    {
      title: 'Patient Satisfaction',
      value: `${metrics.patientSatisfaction || 0}`,
      unit: '/5.0',
      icon: StarIcon,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      target: '> 4.5',
      status: (metrics.patientSatisfaction || 0) >= 4.5 ? 'good' : 'warning'
    },
    {
      title: 'No-Show Rate',
      value: `${metrics.noShowRate || 0}`,
      unit: '%',
      icon: ChartBarIcon,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      target: '< 5%',
      status: (metrics.noShowRate || 0) <= 5 ? 'good' : 'warning'
    },
    {
      title: 'New Patients',
      value: `${metrics.newPatients || 0}`,
      unit: '',
      icon: UserPlusIcon,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      target: '> 20',
      status: (metrics.newPatients || 0) >= 20 ? 'good' : 'warning'
    }
  ];

  const operationalMetrics = [
    {
      title: 'Appointment Completion Rate',
      value: metrics.totalAppointments > 0 ?
        Math.round((metrics.completedAppointments / metrics.totalAppointments) * 100) : 0,
      target: 90,
      unit: '%'
    },
    {
      title: 'Capacity Utilization',
      value: 85, // This would be calculated based on available vs booked slots
      target: 80,
      unit: '%'
    },
    {
      title: 'Patient Retention Rate',
      value: 78, // This would come from patient visit frequency analysis
      target: 75,
      unit: '%'
    },
    {
      title: 'Revenue per Patient',
      value: metrics.totalAppointments > 0 ?
        Math.round(metrics.revenue / metrics.totalAppointments) : 0,
      target: 250,
      unit: '$'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'danger':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return ArrowTrendingUpIcon;
      case 'warning':
      case 'danger':
        return ArrowTrendingDownIcon;
      default:
        return ArrowTrendingUpIcon;
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceStats.map((stat, index) => {
          const StatusIcon = getStatusIcon(stat.status);
          return (
            <div key={index} className={`${stat.bgColor} rounded-lg p-6 border border-gray-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <div className="flex items-baseline space-x-1 mt-2">
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <span className="text-sm text-gray-600">{stat.unit}</span>
                  </div>
                  <div className="flex items-center mt-2 space-x-2">
                    <StatusIcon className={`h-4 w-4 ${getStatusColor(stat.status)}`} />
                    <span className="text-xs text-gray-500">Target: {stat.target}</span>
                  </div>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Operational Metrics */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Operational Efficiency</h3>
        <div className="space-y-6">
          {operationalMetrics.map((metric, index) => {
            const percentage = (metric.value / metric.target) * 100;
            const isAboveTarget = metric.value >= metric.target;

            return (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{metric.title}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-900">
                      {metric.unit === '$' ? '$' : ''}{metric.value}{metric.unit !== '$' ? metric.unit : ''}
                    </span>
                    <span className={`text-sm ${isAboveTarget ? 'text-green-600' : 'text-red-600'}`}>
                      {isAboveTarget ? '✓' : '⚠'}
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        isAboveTarget ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div
                    className="absolute top-0 h-3 w-0.5 bg-gray-600"
                    style={{ left: `${(metric.target / Math.max(metric.value, metric.target)) * 100}%` }}
                  >
                    <span className="absolute -top-6 -left-4 text-xs text-gray-600 font-medium">
                      Target: {metric.unit === '$' ? '$' : ''}{metric.target}{metric.unit !== '$' ? metric.unit : ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {performanceStats.filter(s => s.status === 'good').length}
            </div>
            <div className="text-sm text-gray-600">Metrics Above Target</div>
          </div>

          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {performanceStats.filter(s => s.status === 'warning').length}
            </div>
            <div className="text-sm text-gray-600">Metrics Need Attention</div>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {Math.round(((performanceStats.filter(s => s.status === 'good').length) / performanceStats.length) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Overall Performance Score</div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            {metrics.averageWaitTime > 15 && (
              <li className="flex items-start space-x-2">
                <span className="text-yellow-500">•</span>
                <span>Consider optimizing appointment scheduling to reduce wait times</span>
              </li>
            )}
            {metrics.noShowRate > 5 && (
              <li className="flex items-start space-x-2">
                <span className="text-yellow-500">•</span>
                <span>Implement reminder system to reduce no-show appointments</span>
              </li>
            )}
            {metrics.patientSatisfaction < 4.5 && (
              <li className="flex items-start space-x-2">
                <span className="text-yellow-500">•</span>
                <span>Focus on improving patient experience and service quality</span>
              </li>
            )}
            {metrics.newPatients < 20 && (
              <li className="flex items-start space-x-2">
                <span className="text-yellow-500">•</span>
                <span>Enhance marketing efforts to attract new patients</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
