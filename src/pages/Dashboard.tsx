import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { weatherService } from '../services/weatherService';
import { WeatherResponse } from '../types/Weather';
import { AppointmentService } from '../services/appointmentService';
import { Appointment, AppointmentCreate } from '../types/Appointment';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../components/common/Modal';
import { PatientForm } from '../components/patients/PatientForm';
import { PatientService } from '../services/patientService';
import { PatientCreate, PatientUpdate, Patient } from '../types/Patient';
import { AppointmentBookingForm } from '../components/patients/AppointmentBookingForm';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);

  // New state variables for appointment scheduling
  const [showNewAppointmentForm, setShowNewAppointmentForm] = useState(false);
  const [bookingStep, setBookingStep] = useState<'patient' | 'appointment'>('patient');
  const [selectedPatientForBooking, setSelectedPatientForBooking] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [showCreatePatientForm, setShowCreatePatientForm] = useState(false);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{date: string, time: string, endTime?: string} | null>(null);

  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { user } = useAuth();

  // Load patients for appointment booking
  const loadPatients = async () => {
    try {
      const response = await PatientService.listPatients();
      setPatients(response.data);
    } catch (err) {
      console.error('Error loading patients:', err);
    }
  };

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
        const todayAppointments = await AppointmentService.getTodaysAppointments();
        setAppointments(todayAppointments);
        setAppointmentsError(null);
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
        setAppointmentsError('Failed to load appointments');
      } finally {
        setAppointmentsLoading(false);
      }
    };

    const fetchPatients = async () => {
      try {
        const response = await PatientService.listPatients();
        setPatients(response.data);
      } catch (error) {
        console.error('Failed to fetch patients:', error);
      }
    };

    fetchWeather();
    fetchTodayAppointments();
    fetchPatients();
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
      icon: "event",
      bgColor: "bg-primary-50",
      iconColor: "bg-primary-500"
    },
    {
      title: "Total Patients",
      value: "248",
      icon: "people",
      bgColor: "bg-success-50",
      iconColor: "bg-success-500"
    },
    {
      title: "Weather",
      value: weatherLoading ? "..." : weatherError ? "Error" : `${getCurrentTemperature()}°C`,
      subtitle: weatherLoading ? "Loading..." : weatherError ? weatherError : `${getCurrentWeatherDescription()} in ${weather?.city || 'Sidi Bouzid'}`,
      icon: "wb_sunny",
      bgColor: "bg-sky-50",
      iconColor: "bg-sky-500",
      customIcon: weatherLoading ? "⏳" : weatherError ? "❌" : getWeatherIcon(getCurrentTemperature())
    },
    {
      title: "Revenue Today",
      value: "$2,340",
      icon: "attach_money",
      bgColor: "bg-amber-50",
      iconColor: "bg-amber-600"
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

  // Handle adding a new patient
  const handleAddPatient = async (patientData: PatientCreate | PatientUpdate) => {
    try {
      setIsCreatingPatient(true);
      // Since we're only creating new patients in this modal, cast to PatientCreate
      // The form will always provide the required fields for creation
      const createData = patientData as PatientCreate;
      await PatientService.createPatient(createData);
      setIsCreatingPatient(false);
      setIsAddPatientModalOpen(false);
      // Optionally, refetch patients or update state to include the new patient
    } catch (error) {
      setIsCreatingPatient(false);
      console.error('Failed to create patient:', error);
      // Handle error (e.g., show notification)
    }
  };

  // Handle the create patient button click inside the modal
  const handleCreatePatientClick = () => {
    // This function intentionally left empty as the form handles the submission
    // The PatientForm component will call handleAddPatient when the form is submitted
  };

  // Handle creating an appointment
  const handleCreateAppointment = async (appointmentData: AppointmentCreate) => {
    try {
      setAppointmentLoading(true);
      const newAppointment = await AppointmentService.createAppointment(appointmentData);
      setAppointments(prev => [...prev, newAppointment]);
      setShowNewAppointmentForm(false);
      setSelectedPatientForBooking(null);
      showNotification('success', 'Success', 'Appointment created successfully');

      // Refresh today's appointments
      const todayAppointments = await AppointmentService.getTodaysAppointments();
      setAppointments(todayAppointments);
    } catch (err) {
      console.error('Error creating appointment:', err);
      showNotification('error', 'Error', err instanceof Error ? err.message : 'Failed to create appointment');
    } finally {
      setAppointmentLoading(false);
    }
  };

  // Handle patient selection for booking
  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatientForBooking(patient);
    setBookingStep('appointment');
  };

  // Reset booking flow when closing the modal
  const closeNewAppointmentModal = () => {
    setShowNewAppointmentForm(false);

    // Reset the booking flow after the animation completes
    setTimeout(() => {
      setBookingStep('patient');
      setSelectedPatientForBooking(null);
      setSelectedTimeSlot(null);
      setShowCreatePatientForm(false);
      setSearchQuery('');
    }, 300);
  };

  // Handle patient creation
  const handleCreatePatient = async (patientData: PatientCreate | PatientUpdate): Promise<void> => {
    try {
      // Create clean data object with only non-empty fields
      const createData: any = {
        first_name: patientData.first_name || '',
        last_name: patientData.last_name || '',
        phone: patientData.phone || '',
        gender: patientData.gender || 'male',
      };

      // Only add optional fields if they have values
      if (patientData.email && patientData.email.trim()) {
        createData.email = patientData.email.trim();
      }
      if (patientData.date_of_birth && patientData.date_of_birth.trim()) {
        createData.date_of_birth = patientData.date_of_birth.trim();
      }
      if (patientData.street && patientData.street.trim()) {
        createData.street = patientData.street.trim();
      }
      if (patientData.city && patientData.city.trim()) {
        createData.city = patientData.city.trim();
      }
      if (patientData.state && patientData.state.trim()) {
        createData.state = patientData.state.trim();
      }
      if (patientData.zip_code && patientData.zip_code.trim()) {
        createData.zip_code = patientData.zip_code.trim();
      }

      const newPatient = await PatientService.createPatient(createData);
      setPatients(prev => [...prev, newPatient]);
      setSelectedPatientForBooking(newPatient);
      setShowCreatePatientForm(false);
      setBookingStep('appointment');
      showNotification('success', 'Success', 'Patient created successfully');
    } catch (err) {
      console.error('Error creating patient:', err);
      showNotification('error', 'Error', 'Failed to create patient');
      // Re-throw the error so PatientForm can handle it appropriately
      throw err;
    }
  };

  // Search patients using API
  const searchPatients = useCallback(async (query: string) => {
    if (!query.trim()) {
      loadPatients();
      return;
    }

    setIsSearchingPatients(true);
    try {
      const response = await PatientService.searchPatients(query.trim(), 0, 100);
      setPatients(response.data);
    } catch (err) {
      console.error('Error searching patients:', err);
      showNotification('error', 'Error', 'Failed to search patients');
    } finally {
      setIsSearchingPatients(false);
    }
  }, []);

  // Debounced search effect for patients
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchPatients(searchQuery);
      } else {
        loadPatients();
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchPatients]);

  // Remove the filteredPatients filter since we're now using API search
  const displayedPatients = patients;

  // Handle starting an appointment
  const handleStartAppointment = async (appointmentId: string) => {
    const updated = await AppointmentService.updateAppointmentStatus(appointmentId, 'Booked'); // Change to 'Booked' or 'Completed' as needed
    setAppointments(prev =>
      prev.map(appt =>
        appt.id === appointmentId ? { ...appt, status: updated.status } : appt
      )
    );
    showNotification('success', 'Appointment Started', `Appointment #${appointmentId} is now In Progress.`);
  };

  return (
    <DashboardLayout>
      {/* Welcome Header - only show on Dashboard */}
      <div className="bg-white rounded-3xl p-6 mb-8 shadow-medium border border-neutral-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-800 mb-1">
              {`Welcome back, Dr. ${user?.last_name || ''}`}
            </h2>
            <p className="text-neutral-600">
              Today is {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

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
              </div>
              <div>
                <p className="text-neutral-600 text-sm mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-neutral-800">{stat.value}</p>
                {stat.subtitle && <p className="text-neutral-500 text-sm">{stat.subtitle}</p>}
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
                <button
                  className="btn-secondary text-sm"
                  onClick={() => navigate('/calendar')}
                >
                  <span className="material-icons-round mr-2 text-lg">calendar_today</span>
                  View Calendar
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
                          <div className="flex items-center mt-1 space-x-2">
                            <span className="material-icons-round text-neutral-400 text-sm">schedule</span>
                            <span className="text-xs text-neutral-500">
                              {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className={`px-3 py-1 rounded-full text-white text-xs font-medium ${getStatusColor(mapAppointmentStatus(appointment.status))}`}>
                            {appointment.status}
                          </div>
                          {appointment.status === 'Booked' && (
                            <button
                              onClick={() => navigate(`/appointment/${appointment.id}/start`)}
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center space-x-1"
                            >
                              <span className="material-icons-round text-sm">play_arrow</span>
                              <span>Start</span>
                            </button>
                          )}
                          {appointment.status === 'Completed' && (
                            <button
                              onClick={() => navigate(`/appointment/${appointment.id}/start`)}
                              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center space-x-1"
                            >
                              <span className="material-icons-round text-sm">visibility</span>
                              <span>View</span>
                            </button>
                          )}
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
                <button className="w-full btn-primary text-left" onClick={() => setIsAddPatientModalOpen(true)}>
                  <span className="material-icons-round mr-3">person_add</span>
                  Add New Patient
                </button>
                <button className="w-full btn-secondary text-left" onClick={() => setShowNewAppointmentForm(true)}>
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

        {/* Add Patient Modal */}
        <Modal
          isOpen={isAddPatientModalOpen}
          onClose={() => setIsAddPatientModalOpen(false)}
          title="Add New Patient"
          size="xl"
        >
          <PatientForm
            onSubmit={handleAddPatient}
            onCancel={() => setIsAddPatientModalOpen(false)}
            isLoading={isCreatingPatient}
          />
        </Modal>

        {/* New Appointment Form Modal */}
        {showNewAppointmentForm && (
          <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center z-50 fade-in-element" onClick={closeNewAppointmentModal}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in relative" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {bookingStep === 'patient' ? 'Select Patient' : 'Book Appointment'}
                </h2>
                <button
                  onClick={closeNewAppointmentModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="material-icons-round">close</span>
                </button>
              </div>

              {/* Step indicator */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center space-x-2 ${bookingStep === 'patient' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      bookingStep === 'patient' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      1
                    </div>
                    <span className="text-sm font-medium">Select Patient</span>
                  </div>
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <div className={`flex items-center space-x-2 ${bookingStep === 'appointment' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      bookingStep === 'appointment' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      2
                    </div>
                    <span className="text-sm font-medium">Book Appointment</span>
                  </div>
                </div>
              </div>

              {/* Content - Fixed height container for consistency */}
              <div className="h-[600px] overflow-y-auto">
                <div className="p-6">
                  {bookingStep === 'patient' && (
                    <div className="min-h-full">
                      {showCreatePatientForm ? (
                        <div>
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-medium text-gray-900">Create New Patient</h3>
                            <button
                              onClick={() => setShowCreatePatientForm(false)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <span className="material-icons-round">arrow_back</span>
                            </button>
                          </div>
                          <PatientForm
                            onSubmit={handleCreatePatient}
                            onCancel={() => setShowCreatePatientForm(false)}
                          />
                        </div>
                      ) : (
                        <div className="h-full flex flex-col">
                          {/* Search patients */}
                          <div className="mb-6">
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Search patients by name, email, or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 material-icons-round text-gray-400">
                                search
                              </span>
                            </div>
                          </div>

                          {/* Create new patient button */}
                          <div className="mb-6">
                            <button
                              onClick={() => setShowCreatePatientForm(true)}
                              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                            >
                              <span className="material-icons-round mb-2">add</span>
                              <div className="text-sm font-medium">Create New Patient</div>
                            </button>
                          </div>

                          {/* Patient list - flexible height */}
                          <div className="flex-1 min-h-0">
                            <div className="space-y-3 h-full overflow-y-auto">
                              {displayedPatients.map((patient) => (
                                <div
                                  key={patient.id}
                                  onClick={() => handlePatientSelect(patient)}
                                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-medium text-gray-900">
                                        {patient.first_name} {patient.last_name}
                                      </h4>
                                      <p className="text-sm text-gray-600">{patient.email}</p>
                                      {patient.phone && (
                                        <p className="text-sm text-gray-600">{patient.phone}</p>
                                      )}
                                    </div>
                                    <span className="material-icons-round text-gray-400">chevron_right</span>
                                  </div>
                                </div>
                              ))}
                              {displayedPatients.length === 0 && searchQuery && (
                                <div className="text-center py-8 text-gray-500">
                                  No patients found matching "{searchQuery}"
                                </div>
                              )}
                              {displayedPatients.length === 0 && !searchQuery && (
                                <div className="text-center py-8 text-gray-500">
                                  No patients available. Create a new patient to get started.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {bookingStep === 'appointment' && selectedPatientForBooking && (
                    <div className="min-h-full">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Book Appointment</h3>
                          <p className="text-sm text-gray-600">
                            for {selectedPatientForBooking.first_name} {selectedPatientForBooking.last_name}
                          </p>
                        </div>
                        <button
                          onClick={() => setBookingStep('patient')}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <span className="material-icons-round">arrow_back</span>
                        </button>
                      </div>
                      <AppointmentBookingForm
                        patient={selectedPatientForBooking}
                        onSubmit={handleCreateAppointment}
                        onCancel={closeNewAppointmentModal}
                        isLoading={appointmentLoading}
                        preselectedDate={selectedTimeSlot?.date}
                        preselectedTime={selectedTimeSlot?.time}
                        preselectedEndTime={selectedTimeSlot?.endTime}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
