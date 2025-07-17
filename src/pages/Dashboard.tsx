import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

export const Dashboard: React.FC = () => {
  const stats = [
    {
      title: "Today's Appointments",
      value: "12",
      change: "+15%",
      trend: "up",
      icon: "event",
      bgColor: "bg-primary-50",
      iconColor: "bg-primary-500"
    },
    {
      title: "Total Patients",
      value: "248",
      change: "+8%",
      trend: "up",
      icon: "people",
      bgColor: "bg-success-50",
      iconColor: "bg-success-500"
    },
    {
      title: "Pending Reviews",
      value: "6",
      change: "-12%",
      trend: "down",
      icon: "schedule",
      bgColor: "bg-warning-50",
      iconColor: "bg-warning-500"
    },
    {
      title: "Revenue Today",
      value: "$2,340",
      change: "+22%",
      trend: "up",
      icon: "attach_money",
      bgColor: "bg-primary-50",
      iconColor: "bg-primary-600"
    }
  ];

  const recentAppointments = [
    { time: "09:00", patient: "John Doe", type: "Consultation", status: "confirmed" },
    { time: "10:30", patient: "Sarah Wilson", type: "Follow-up", status: "in-progress" },
    { time: "11:15", patient: "Mike Johnson", type: "Check-up", status: "waiting" },
    { time: "14:00", patient: "Emily Davis", type: "Surgery", status: "confirmed" },
    { time: "15:30", patient: "Robert Brown", type: "Consultation", status: "pending" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-success-500';
      case 'in-progress': return 'bg-primary-500';
      case 'waiting': return 'bg-warning-500';
      case 'pending': return 'bg-neutral-400';
      default: return 'bg-neutral-400';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={stat.title} className={`card card-hover slide-up-element ${stat.bgColor} border-0`}
                 style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${stat.iconColor} shadow-medium`}>
                  <span className="material-icons-round text-white text-2xl">{stat.icon}</span>
                </div>
                <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
                  stat.trend === 'up' ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'
                }`}>
                  <span className="material-icons-round text-xs">
                    {stat.trend === 'up' ? 'trending_up' : 'trending_down'}
                  </span>
                  <span>{stat.change}</span>
                </div>
              </div>
              <div>
                <p className="text-neutral-600 text-sm mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-neutral-800">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Appointments */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-neutral-800">Today's Schedule</h3>
                <button className="btn-secondary text-sm">
                  <span className="material-icons-round mr-2 text-lg">calendar_today</span>
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {recentAppointments.map((appointment, index) => (
                  <div key={index} className={`bg-neutral-50 rounded-xl p-4 hover:scale-[1.01] transition-all duration-300 slide-up-element border border-neutral-100`}
                       style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center border border-primary-200">
                          <span className="text-primary-600 font-semibold text-sm">{appointment.time}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-800 truncate">{appointment.patient}</p>
                        <p className="text-neutral-600 text-sm">{appointment.type}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-white text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions & Overview */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-xl font-bold text-neutral-800 mb-6">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full btn-primary text-left">
                  <span className="material-icons-round mr-3">person_add</span>
                  Add New Patient
                </button>
                <button className="w-full btn-secondary text-left">
                  <span className="material-icons-round mr-3">event</span>
                  Schedule Appointment
                </button>
                <button className="w-full btn-accent text-left">
                  <span className="material-icons-round mr-3">description</span>
                  Generate Report
                </button>
              </div>
            </div>

            {/* Activity Overview */}
            <div className="card">
              <h3 className="text-xl font-bold text-neutral-800 mb-6">Activity Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Appointments Completed</span>
                  <span className="font-semibold text-success-600">8/12</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div className="bg-success-500 h-2 rounded-full" style={{ width: '66%' }}></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Patient Satisfaction</span>
                  <span className="font-semibold text-primary-600">4.8/5</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full" style={{ width: '96%' }}></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Revenue Target</span>
                  <span className="font-semibold text-primary-600">$2.3K/$3K</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: '77%' }}></div>
                </div>
              </div>
            </div>

            {/* Weather Widget */}
            <div className="card bg-primary-500 text-white border-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-100 text-sm">Today's Weather</p>
                  <p className="text-2xl font-bold">24°C</p>
                  <p className="text-primary-100 text-sm">Partly Cloudy</p>
                </div>
                <div className="text-4xl opacity-80">⛅</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
