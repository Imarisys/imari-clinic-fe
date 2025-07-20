import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { weatherService } from '../services/weatherService';
import { WeatherResponse } from '../types/Weather';
import { AppointmentService } from '../services/appointmentService';
import { Appointment } from '../types/Appointment';

export const Dashboard: React.FC = () => {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setWeatherLoading(true);
        const weatherData = await weatherService.getWeather('TN', 'Sidi Bouzid');
        setWeather(weatherData);
        setWeatherError(null);
      } catch (error) {
        console.error('Failed to fetch weather data:', error);
        setWeatherError('Failed to load weather data');
      } finally {
        setWeatherLoading(false);
      }
    };

    const fetchTodayAppointments = async () => {
      try {
        setAppointmentsLoading(true);
        const todayAppointments = await AppointmentService.getTodayAppointments();
        setAppointments(todayAppointments);
        setAppointmentsError(null);
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
        setAppointmentsError('Failed to load appointments');
      } finally {
        setAppointmentsLoading(false);
      }
    };

    fetchWeather();
    fetchTodayAppointments();
  }, []);

  const getCurrentTemperature = () => {
    if (!weather?.forecast?.hourly?.temperature_2m) return null;
    return Math.round(weather.forecast.hourly.temperature_2m[0]);
  };

  const getCurrentWeatherDescription = () => {
    if (!weather?.forecast?.hourly?.weathercode) return 'Partly Cloudy';
    const weathercode = weather.forecast.hourly.weathercode[0];

    // Weather code mapping based on WMO codes
    if (weathercode === 0) return 'Clear Sky';
    if (weathercode >= 1 && weathercode <= 3) return 'Partly Cloudy';
    if (weathercode >= 45 && weathercode <= 48) return 'Foggy';
    if (weathercode >= 51 && weathercode <= 67) return 'Rainy';
    if (weathercode >= 71 && weathercode <= 77) return 'Snowy';
    if (weathercode >= 80 && weathercode <= 82) return 'Rain Showers';
    if (weathercode >= 95 && weathercode <= 99) return 'Thunderstorm';

    return 'Partly Cloudy';
  };

  const getWeatherIcon = (temperature: number | null) => {
    if (!temperature) return '🌤️';
    if (temperature >= 30) return '☀️';
    if (temperature >= 20) return '🌤️';
    if (temperature >= 10) return '⛅';
    return '🌧️';
  };

  // Map API appointment status to UI status
  const mapAppointmentStatus = (apiStatus: string): string => {
    switch (apiStatus) {
      case 'Booked': return 'confirmed';
      case 'Completed': return 'completed';
      case 'Cancelled': return 'cancelled';
      case 'No Show': return 'no-show';
      default: return 'pending';
    }
  };

  // Format time from API time format to display format
  const formatTime = (timeString: string): string => {
    try {
      const timePart = timeString.split('.')[0]; // Remove microseconds if present
      const [hours, minutes] = timePart.split(':');
      return `${hours}:${minutes}`;
    } catch (error) {
      return timeString;
    }
  };

  // Update first stats card to show actual appointment count
  const stats = [
    {
      title: "Today's Appointments",
      value: appointmentsLoading ? "..." : appointmentsError ? "Error" : appointments.length.toString(),
      change: "+15%", // This could be calculated in a real scenario
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
                {appointmentsLoading ? (
                  <div className="text-center py-8">
                    <span className="material-icons-round text-4xl text-primary-300 animate-pulse">schedule</span>
                    <p className="mt-2 text-neutral-500">Loading appointments...</p>
                  </div>
                ) : appointmentsError ? (
                  <div className="text-center py-8">
                    <span className="material-icons-round text-4xl text-error-400">error_outline</span>
                    <p className="mt-2 text-neutral-500">{appointmentsError}</p>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="material-icons-round text-4xl text-neutral-300">event_busy</span>
                    <p className="mt-2 text-neutral-500">No appointments scheduled for today</p>
                  </div>
                ) : (
                  appointments.map((appointment, index) => (
                    <div key={appointment.id} className={`bg-neutral-50 rounded-xl p-4 hover:scale-[1.01] transition-all duration-300 slide-up-element border border-neutral-100`}
                         style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center border border-primary-200">
                            <span className="text-primary-600 font-semibold text-sm">{formatTime(appointment.start_time)}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-neutral-800 truncate">
                            {appointment.patient_first_name} {appointment.patient_last_name}
                          </p>
                          <p className="text-neutral-600 text-sm">{appointment.type}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-white text-xs font-medium ${getStatusColor(mapAppointmentStatus(appointment.status))}`}>
                          {appointment.status}
                        </div>
                      </div>
                    </div>
                  ))
                )}
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
            <div className="card bg-primary-500 text-white border-0 p-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <span className="material-icons-round text-primary-100 mr-2">location_on</span>
                  <p className="text-primary-100 text-sm font-medium">
                    {weatherLoading ? '' : weatherError ? '' : weather?.city || 'Sidi Bouzid'}
                  </p>
                </div>

                <div className="mb-4">
                  <div className="text-6xl mb-2 opacity-90">
                    {weatherLoading ? '⏳' : weatherError ? '❌' : getWeatherIcon(getCurrentTemperature())}
                  </div>
                  <p className="text-4xl font-bold mb-1">
                    {weatherLoading ? 'Loading...' : weatherError ? 'Error' : `${getCurrentTemperature()}°C`}
                  </p>
                  <p className="text-primary-100 text-base font-medium">
                    {weatherLoading ? 'Fetching weather data...' : weatherError ? weatherError : getCurrentWeatherDescription()}
                  </p>
                </div>

                <div className="border-t border-primary-400 pt-3 mt-3">
                  <p className="text-primary-100 text-xs uppercase tracking-wider font-medium">
                    Today's Weather
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
