import React from 'react';
import { UserGroupIcon } from '@heroicons/react/24/outline';

interface PatientDemographicsProps {
  data: any[];
}

export const PatientDemographics: React.FC<PatientDemographicsProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Demographics</h3>
        <div className="text-center text-gray-500 py-8">No data available</div>
      </div>
    );
  }

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-yellow-500',
    'bg-pink-500',
    'bg-indigo-500'
  ];

  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <UserGroupIcon className="h-5 w-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Patient Demographics by Age</h3>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={item.ageGroup} className="flex items-center space-x-4">
            <div className="w-16 text-sm font-medium text-gray-700">
              {item.ageGroup}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">{item.count} patients</span>
                <span className="text-sm font-medium text-gray-900">{item.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${colors[index % colors.length]} transition-all duration-500`}
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="w-12 text-right text-sm font-semibold text-gray-900">
              {item.count}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {data.reduce((sum, d) => sum + d.count, 0)}
            </p>
            <p className="text-sm text-gray-600">Total Patients</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {data.find(d => d.ageGroup === '30-44')?.count || 0}
            </p>
            <p className="text-sm text-gray-600">Largest Age Group</p>
          </div>
        </div>
      </div>
    </div>
  );
};
