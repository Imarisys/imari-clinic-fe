import React from 'react';

interface AppointmentChartProps {
  data: any[];
}

export const AppointmentChart: React.FC<AppointmentChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Trends</h3>
        <div className="text-center text-gray-500 py-8">No data available</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.total));
  const chartHeight = 200;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Appointment Trends</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Total</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Cancelled</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>No Show</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <svg width="100%" height={chartHeight + 40} className="overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <g key={ratio}>
              <line
                x1="40"
                y1={chartHeight * (1 - ratio) + 20}
                x2="100%"
                y2={chartHeight * (1 - ratio) + 20}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text
                x="35"
                y={chartHeight * (1 - ratio) + 25}
                textAnchor="end"
                fontSize="12"
                fill="#6b7280"
              >
                {Math.round(maxValue * ratio)}
              </text>
            </g>
          ))}

          {/* Bars */}
          {data.map((item, index) => {
            const barWidth = (100 - 8) / data.length; // 8% for margins
            const x = 40 + (index * (100 - 8) / data.length) + '%';
            const totalHeight = (item.total / maxValue) * chartHeight;
            const completedHeight = (item.completed / maxValue) * chartHeight;
            const cancelledHeight = (item.cancelled / maxValue) * chartHeight;

            return (
              <g key={index}>
                {/* Total bar (background) */}
                <rect
                  x={`calc(${x} + 2px)`}
                  y={chartHeight - totalHeight + 20}
                  width={`calc(${barWidth}% - 4px)`}
                  height={totalHeight}
                  fill="#dbeafe"
                  rx="2"
                />

                {/* Completed bar */}
                <rect
                  x={`calc(${x} + 2px)`}
                  y={chartHeight - completedHeight + 20}
                  width={`calc(${barWidth}% - 4px)`}
                  height={completedHeight}
                  fill="#10b981"
                  rx="2"
                />

                {/* Cancelled and No Show indicators */}
                {item.cancelled > 0 && (
                  <rect
                    x={`calc(${x} + 2px)`}
                    y={chartHeight - totalHeight + 20}
                    width={`calc(${barWidth}% - 4px)`}
                    height={cancelledHeight}
                    fill="#ef4444"
                    rx="2"
                  />
                )}

                {/* Date label */}
                <text
                  x={`calc(${x} + ${barWidth / 2}%)`}
                  y={chartHeight + 35}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#6b7280"
                  transform={`rotate(-45 calc(${x} + ${barWidth / 2}%) ${chartHeight + 35})`}
                >
                  {new Date(item.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </text>

                {/* Hover tooltip area */}
                <rect
                  x={`calc(${x} + 2px)`}
                  y="20"
                  width={`calc(${barWidth}% - 4px)`}
                  height={chartHeight}
                  fill="transparent"
                  className="hover:fill-gray-100 hover:fill-opacity-10 cursor-pointer"
                >
                  <title>{`${item.date}: ${item.total} total, ${item.completed} completed, ${item.cancelled} cancelled, ${item.noShow} no-show`}</title>
                </rect>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Summary stats below chart */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{data.reduce((sum, d) => sum + d.total, 0)}</p>
          <p className="text-sm text-gray-600">Total Appointments</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{data.reduce((sum, d) => sum + d.completed, 0)}</p>
          <p className="text-sm text-gray-600">Completed</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{data.reduce((sum, d) => sum + d.cancelled, 0)}</p>
          <p className="text-sm text-gray-600">Cancelled</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">{data.reduce((sum, d) => sum + d.noShow, 0)}</p>
          <p className="text-sm text-gray-600">No Shows</p>
        </div>
      </div>
    </div>
  );
};
