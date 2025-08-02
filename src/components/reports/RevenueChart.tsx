import React from 'react';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

interface RevenueChartProps {
  data: {
    revenue: Array<{ date: string; amount: number; appointmentType: string }>;
    summary: { total: number; average: number; count: number };
  };
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  if (!data || !data.revenue || data.revenue.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Analysis</h3>
        <div className="text-center text-gray-500 py-8">No data available</div>
      </div>
    );
  }

  const revenue = data.revenue;
  const summary = data.summary;

  const maxRevenue = Math.max(...revenue.map((d: any) => d.amount));
  const chartHeight = 220;

  // Calculate trends
  const recentRevenue = revenue.slice(-7).reduce((sum: number, d: any) => sum + d.amount, 0);
  const previousRevenue = revenue.slice(-14, -7).reduce((sum: number, d: any) => sum + d.amount, 0);
  const trendPercentage = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${summary.total?.toLocaleString() || '0'}`,
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      change: `${trendPercentage > 0 ? '+' : ''}${trendPercentage.toFixed(1)}%`,
      changeType: trendPercentage >= 0 ? 'increase' : 'decrease'
    },
    {
      title: 'Average per Appointment',
      value: `$${summary.average?.toFixed(2) || '0'}`,
      icon: BanknotesIcon,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      change: '+3.2%',
      changeType: 'increase'
    },
    {
      title: 'This Week',
      value: `$${recentRevenue.toLocaleString()}`,
      icon: ArrowTrendingUpIcon,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      change: `${trendPercentage > 0 ? '+' : ''}${trendPercentage.toFixed(1)}%`,
      changeType: trendPercentage >= 0 ? 'increase' : 'decrease'
    },
    {
      title: 'Appointments Count',
      value: summary.count || 0,
      icon: CurrencyDollarIcon,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      change: '+5.8%',
      changeType: 'increase'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} rounded-lg p-6 border border-gray-200`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <div className="flex items-center mt-2">
                  {stat.changeType === 'increase' ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Daily Revenue Trend</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-600 rounded"></div>
            <span>Daily Revenue</span>
          </div>
        </div>

        <div className="relative">
          <svg width="100%" height={chartHeight + 60} className="overflow-visible">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
              <g key={ratio}>
                <line
                  x1="50"
                  y1={chartHeight * (1 - ratio) + 20}
                  x2="100%"
                  y2={chartHeight * (1 - ratio) + 20}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
                <text
                  x="45"
                  y={chartHeight * (1 - ratio) + 25}
                  textAnchor="end"
                  fontSize="12"
                  fill="#9ca3af"
                >
                  ${Math.round(maxRevenue * ratio).toLocaleString()}
                </text>
              </g>
            ))}

            {/* Revenue area chart */}
            <defs>
              <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.05"/>
              </linearGradient>
            </defs>

            {/* Area path */}
            <path
              d={`M 50 ${chartHeight + 20} ${revenue.map((item: any, index: number) => {
                const x = 50 + (index * (100 - 10) / revenue.length) + '%';
                const y = chartHeight - (item.amount / maxRevenue) * chartHeight + 20;
                return `L ${x} ${y}`;
              }).join(' ')} L ${50 + ((revenue.length - 1) * (100 - 10) / revenue.length)}% ${chartHeight + 20} Z`}
              fill="url(#revenueGradient)"
            />

            {/* Revenue line */}
            <path
              d={`M ${revenue.map((item: any, index: number) => {
                const x = 50 + (index * (100 - 10) / revenue.length);
                const y = chartHeight - (item.amount / maxRevenue) * chartHeight + 20;
                return `${index === 0 ? 'M' : 'L'} ${x}% ${y}`;
              }).join(' ')}`}
              stroke="#10b981"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {revenue.map((item: any, index: number) => {
              const x = 50 + (index * (100 - 10) / revenue.length);
              const y = chartHeight - (item.amount / maxRevenue) * chartHeight + 20;

              return (
                <g key={index}>
                  <circle
                    cx={`${x}%`}
                    cy={y}
                    r="4"
                    fill="#10b981"
                    stroke="white"
                    strokeWidth="2"
                    className="hover:r-6 cursor-pointer transition-all"
                  >
                    <title>{`${item.date}: $${item.amount.toLocaleString()}`}</title>
                  </circle>
                </g>
              );
            })}

            {/* Date labels */}
            {revenue.map((item: any, index: number) => {
              if (index % Math.ceil(revenue.length / 6) === 0 || index === revenue.length - 1) {
                const x = 50 + (index * (100 - 10) / revenue.length);
                return (
                  <text
                    key={index}
                    x={`${x}%`}
                    y={chartHeight + 45}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#6b7280"
                  >
                    {new Date(item.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </text>
                );
              }
              return null;
            })}
          </svg>
        </div>

        {/* Revenue breakdown */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">
                ${Math.max(...revenue.map((d: any) => d.amount)).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Highest Daily Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">
                ${Math.min(...revenue.map((d: any) => d.amount)).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Lowest Daily Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-purple-600">
                ${Math.round(revenue.reduce((sum: number, d: any) => sum + d.amount, 0) / revenue.length).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Daily Average</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
