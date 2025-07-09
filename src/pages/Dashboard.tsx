import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

export const Dashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome back, Dr. Smith</h1>
            <p className="text-gray-600">Here's your activity overview</p>
          </div>
          <div className="flex space-x-4">
            <button className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow">
              <span className="material-icons text-gray-600">notifications</span>
            </button>
            <button className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow">
              <span className="material-icons text-gray-600">person</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <span className="material-icons text-blue-600">calendar_today</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Today's Appointments</p>
                <p className="text-xl font-semibold">8</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-full">
                <span className="material-icons text-green-600">people</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-xl font-semibold">145</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-yellow-100 rounded-full">
                <span className="material-icons text-yellow-600">schedule</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Reviews</p>
                <p className="text-xl font-semibold">5</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <span className="material-icons text-purple-600">payment</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-xl font-semibold">$12,850</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Upcoming Appointments</h2>
            <div className="space-y-4">
              {/* Appointment items would go here */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                  <div>
                    <p className="font-medium">Sarah Johnson</p>
                    <p className="text-sm text-gray-600">General Checkup</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">10:00 AM</p>
                  <p className="text-sm text-gray-600">Today</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {/* Activity items would go here */}
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <span className="material-icons text-blue-600 text-sm">check_circle</span>
                </div>
                <div>
                  <p className="text-sm">Appointment completed with Michael Brown</p>
                  <p className="text-xs text-gray-600">2 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
