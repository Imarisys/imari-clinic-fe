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
import { PatientCreate, PatientUpdate, Patient, PatientSummary } from '../types/Patient';
import { AppointmentBookingForm } from '../components/patients/AppointmentBookingForm';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { SettingsService } from '../services/settingsService';
import { useTranslation } from '../context/TranslationContext';

export const Dashboard: React.FC = () => {
  const { t, language } = useTranslation();
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  // Restored states
  const [patientSummary, setPatientSummary] = useState<PatientSummary | null>(null);
  const [patientSummaryLoading, setPatientSummaryLoading] = useState(true);
  const [patientSummaryError, setPatientSummaryError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>('$');
  const [workingHours, setWorkingHours] = useState({ startTime: '08:00', endTime: '17:00' });
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  // Derived displays
  const totalPatientsDisplay = patientSummaryLoading ? t('loading') : patientSummaryError ? t('error') : patientSummary?.total_patients?.toString() || '0';

  // New state variables for appointment scheduling
  const [showNewAppointmentForm, setShowNewAppointmentForm] = useState(false);
  const [bookingStep, setBookingStep] = useState<'patient' | 'appointment'>('patient');
  const [selectedPatientForBooking, setSelectedPatientForBooking] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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

    const fetchSettings = async () => {
      try {
        const settings = await SettingsService.getSettings();
        setWorkingHours({
          startTime: settings.appointments_start_time || '08:00',
          endTime: settings.appointments_end_time || '17:00'
        });
        setCurrency(settings.display_currency || '$'); // Use display_currency from settings
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };

    const fetchPatientSummary = async () => {
      try {
        setPatientSummaryLoading(true);
        const summary = await PatientService.getPatientSummary();
        setPatientSummary(summary);
        setPatientSummaryError(null);
      } catch (error) {
        console.error('Failed to fetch patient summary:', error);
        setPatientSummaryError('Failed to load patient summary');
      } finally {
        setPatientSummaryLoading(false);
      }
    };

    fetchWeather();
    fetchTodayAppointments();
    fetchPatients();
    fetchSettings();
    fetchPatientSummary();
  }, []);

  const getCurrentTemperature = () => {
    if (!weather?.forecast?.hourly?.temperature_2m) return null;
    return Math.round(weather.forecast.hourly.temperature_2m[0]);
  };

  const getCurrentWeatherDescription = () => {
    if (!weather?.forecast?.hourly?.weathercode) return t('partly_cloudy');
    const weathercode = weather.forecast.hourly.weathercode[0];

    // Weather code mapping based on WMO codes
    if (weathercode === 0) return t('clear_sky');
    if (weathercode >= 1 && weathercode <= 3) return t('partly_cloudy');
    if (weathercode >= 45 && weathercode <= 48) return t('foggy');
    if (weathercode >= 51 && weathercode <= 67) return t('rainy');
    if (weathercode >= 71 && weathercode <= 77) return t('snowy');
    if (weathercode >= 80 && weathercode <= 82) return t('rain_showers');
    if (weathercode >= 95 && weathercode <= 99) return t('thunderstorm');

    return t('partly_cloudy');
  };

  const getWeatherIcon = (temperature: number | null) => {
    if (!temperature) return '🌤️';
    if (temperature >= 30) return '☀️';
    if (temperature >= 20) return '🌤️';
    if (temperature >= 10) return '⛅';
    return '🌧��';
  };

  // Calculate unique patients from today's appointments
  const getUniquePatientCount = (): string => {
    if (appointmentsLoading) return t('loading');
    if (appointmentsError) return t('error');
    const ids = new Set(appointments.map(a => a.patient_id));
    return ids.size.toString();
  };

  // Determine next upcoming appointment based on current time (HH:MM comparison)
  const getUpcomingAppointment = () => {
    if (!appointments || appointments.length === 0) return null;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const parseMinutes = (time: string) => {
      try { const [h,m] = time.split(':'); return parseInt(h)*60 + parseInt(m);} catch { return 0; }
    };
    const future = appointments
      .map(a => ({ a, mins: parseMinutes(a.start_time) }))
      .filter(x => x.mins >= nowMinutes)
      .sort((a,b)=>a.mins-b.mins);
    return future.length ? future[0].a : null;
  };
  const upcomingAppointment = getUpcomingAppointment();

  // Stats chips data
  const statChips = [
    { key: 'appointments', label: t('todays_appointments'), value: appointmentsLoading ? t('loading') : appointmentsError ? t('error') : appointments.length.toString(), icon: 'event' },
    { key: 'unique_patients', label: t('total_patients'), value: totalPatientsDisplay, icon: 'people' },
    { key: 'unique_today', label: t('patients') || 'Patients (Today)', value: getUniquePatientCount(), icon: 'groups' },
    { key: 'revenue', label: t('revenue_today'), value: `${currency} --`, icon: 'attach_money' },
    { key: 'hours', label: 'Working Hours', value: `${workingHours.startTime} - ${workingHours.endTime}` , icon: 'schedule' }
  ];

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

  // Time formatting helper (restored)
  const formatTime = (timeString: string): string => {
    try {
      const timePart = timeString.split('.')[0];
      const [h, m] = timePart.split(':');
      return `${h}:${m}`;
    } catch {
      return timeString;
    }
  };

  // Handle creating a patient inside booking flow (restored)
  const handleCreatePatient = async (patientData: PatientCreate | PatientUpdate): Promise<void> => {
    try {
      const createData: any = {
        first_name: patientData.first_name || '',
        last_name: patientData.last_name || '',
        phone: patientData.phone || '',
        gender: patientData.gender || 'male'
      };
      if (patientData.email?.trim()) createData.email = patientData.email.trim();
      if (patientData.date_of_birth?.trim()) createData.date_of_birth = patientData.date_of_birth.trim();
      if (patientData.street?.trim()) createData.street = patientData.street.trim();
      if (patientData.city?.trim()) createData.city = patientData.city.trim();
      if (patientData.state?.trim()) createData.state = patientData.state.trim();
      if (patientData.zip_code?.trim()) createData.zip_code = patientData.zip_code.trim();
      const newPatient = await PatientService.createPatient(createData);
      setPatients(prev => [...prev, newPatient]);
      setSelectedPatientForBooking(newPatient);
      setShowCreatePatientForm(false);
      setBookingStep('appointment');
      showNotification('success', 'Success', 'Patient created successfully');
    } catch (err) {
      console.error('Error creating patient:', err);
      showNotification('error', 'Error', 'Failed to create patient');
      throw err;
    }
  };

  // Add Patient Modal
  return (
    <DashboardLayout>
      {/* Top Banner with Doctor name (left) and Weather (right) */}
      <div className="relative overflow-hidden rounded-3xl mb-8 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 text-white p-6 md:p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_25%_25%,white,transparent_60%)]" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              {t('welcome_back_dr', { name: user?.last_name || '' })}
            </h2>
            <p className="text-primary-100 font-medium">
              {t('today_is', {
                date: new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              })}
            </p>
          </div>
          {/* Compact Weather */}
          <div className="shrink-0 w-full md:w-auto">
            <div className="flex items-center gap-4 bg-white/10 rounded-2xl px-5 py-4 backdrop-blur-sm border border-white/20">
              <div className="text-5xl leading-none">
                {weatherLoading ? '⏳' : weatherError ? '❌' : getWeatherIcon(getCurrentTemperature())}
              </div>
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold">
                    {weatherLoading ? '--' : weatherError ? '--' : `${getCurrentTemperature()}°C`}
                  </span>
                  <span className="material-icons-round text-primary-100 text-lg">thermostat</span>
                </div>
                <p className="text-sm text-primary-100 font-medium mt-1">
                  {weatherLoading ? t('loading') : weatherError ? t('error') : `${getCurrentWeatherDescription()} • ${weather?.city || 'Sidi Bouzid'}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Stats Chips Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          {statChips.map(chip => (
            <div key={chip.key} className="group relative overflow-hidden rounded-2xl bg-white border border-neutral-100 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-neutral-500 text-xs font-medium tracking-wide truncate">{chip.label}</span>
                <span className="material-icons-round text-primary-500 text-base opacity-70 group-hover:opacity-100 transition-opacity">{chip.icon}</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-neutral-800 leading-none">{chip.value}</div>
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-5 bg-[radial-gradient(circle_at_70%_30%,#2563eb,transparent_60%)] transition-opacity" />
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          {/* Schedule (single consolidated panel spans 2 columns) */}
          <div className="xl:col-span-2">
            {/* Schedule List Panel (now sole 'Today's Schedule' area) */}
            <div className="card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <h3 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
                  <span className="material-icons-round text-primary-500">list_alt</span>{t('todays_schedule')}
                </h3>
                <button
                  onClick={() => navigate('/calendar')}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors self-start md:self-auto"
                >
                  <span className="material-icons-round text-sm mr-1">calendar_today</span>{t('view_calendar')}
                </button>
              </div>

              {/* Inline upcoming / summary section */}
              <div className="mb-6 bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  {upcomingAppointment ? (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center border border-primary-200">
                        <span className="material-icons-round text-primary-500 text-xl">schedule</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 mb-0.5">Next</p>
                        <p className="text-sm font-medium text-neutral-800 truncate">{upcomingAppointment.patient_first_name} {upcomingAppointment.patient_last_name}</p>
                        <p className="text-xs text-neutral-500">
                          {formatTime(upcomingAppointment.start_time)} - {formatTime(upcomingAppointment.end_time)} • {upcomingAppointment.type}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-neutral-600 font-medium flex items-center gap-2">
                      <span className="material-icons-round text-neutral-400 text-base">event_busy</span>
                      {t('no_appointments_scheduled_today')}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-100 text-primary-700 font-medium">
                    <span className="material-icons-round text-sm">event</span>
                    {appointmentsLoading ? t('loading') : appointmentsError ? t('error') : `${appointments.length} ${t('appointments')}`}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success-100 text-success-700 font-medium">
                    <span className="material-icons-round text-sm">groups</span>
                    {getUniquePatientCount()} {t('patients')}
                  </span>
                  {upcomingAppointment && upcomingAppointment.status === 'Booked' && (
                    <button
                      onClick={() => navigate(`/appointment/${upcomingAppointment.id}/start`)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium shadow-sm transition-colors"
                    >
                      <span className="material-icons-round text-sm">play_arrow</span>{t('start')}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {appointmentsLoading ? (
                  <div className="text-center py-8">
                    <span className="material-icons-round text-4xl text-primary-300 animate-pulse">schedule</span>
                    <p className="mt-2 text-neutral-500">{t('loading_appointments')}</p>
                  </div>
                ) : appointmentsError ? (
                  <div className="text-center py-8">
                    <span className="material-icons-round text-4xl text-error-400">error_outline</span>
                    <p className="mt-2 text-neutral-500">{appointmentsError}</p>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="material-icons-round text-4xl text-neutral-300">event_busy</span>
                    <p className="mt-2 text-neutral-500">{t('no_appointments_scheduled_today')}</p>
                  </div>
                ) : (
                  appointments.map((appointment, index) => (
                    <div key={appointment.id} className={`bg-neutral-50 rounded-xl p-4 hover:bg-white hover:shadow-sm transition-all duration-300 slide-up-element border border-neutral-100`}
                         style={{ animationDelay: `${index * 0.04}s` }}>
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-14 h-14 bg-primary-100 rounded-xl flex flex-col items-center justify-center border border-primary-200 text-center">
                            <span className="text-primary-600 font-semibold text-sm leading-tight">{formatTime(appointment.start_time)}</span>
                            <span className="text-neutral-400 text-[10px]">{formatTime(appointment.end_time)}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-neutral-800 truncate text-sm md:text-base">
                            {appointment.patient_first_name} {appointment.patient_last_name}
                          </p>
                          <p className="text-neutral-600 text-xs md:text-sm">{appointment.type}</p>
                          <div className="flex items-center mt-1 gap-3 text-[11px] text-neutral-500">
                            <span className="flex items-center gap-1"><span className="material-icons-round text-[14px] text-neutral-400">event</span>{appointment.status}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          {appointment.status === 'Booked' && (
                            <button
                              onClick={() => navigate(`/appointment/${appointment.id}/start`)}
                              className="bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm"
                            >
                              <span className="material-icons-round text-xs">play_arrow</span>{t('start')}
                            </button>
                          )}
                          {(appointment.status === 'IN_PROGRESS' || appointment.status === 'In Progress') && (
                            <button
                              onClick={() => navigate(`/appointment/${appointment.id}/start`)}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm"
                            >
                              <span className="material-icons-round text-xs">play_circle</span>{t('resume')}
                            </button>
                          )}
                          {appointment.status === 'Completed' && (
                            <button
                              onClick={() => navigate(`/appointment/${appointment.id}/start`)}
                              className="bg-neutral-200 hover:bg-neutral-300 text-neutral-800 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm"
                            >
                              <span className="material-icons-round text-xs">visibility</span>{t('view')}
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

          {/* Side Panels */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2"><span className="material-icons-round text-primary-500">flash_on</span>{t('quick_actions')}</h3>
              <div className="grid grid-cols-1 gap-3">
                <button className="w-full px-4 py-3 rounded-xl border border-primary-200 bg-primary-50 hover:bg-primary-100 text-primary-700 font-medium text-sm flex items-center gap-2 transition-colors" onClick={() => setIsAddPatientModalOpen(true)}>
                  <span className="material-icons-round text-base">person_add</span>{t('add_new_patient')}
                </button>
                <button className="w-full px-4 py-3 rounded-xl border border-neutral-300 hover:border-primary-400 hover:bg-neutral-50 text-neutral-700 font-medium text-sm flex items-center gap-2 transition-colors" onClick={() => setShowNewAppointmentForm(true)}>
                  <span className="material-icons-round text-base">event</span>{t('schedule_appointment')}
                </button>
                <button className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium text-sm flex items-center gap-2 transition-colors">
                  <span className="material-icons-round text-base">description</span>{t('generate_report')}
                </button>
              </div>
            </div>

            {/* Activity Overview */}
            <div className="card">
              <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2"><span className="material-icons-round text-primary-500">insights</span>{t('activity_overview')}</h3>
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1 text-sm"><span className="text-neutral-600">{t('appointments_completed')}</span><span className="font-semibold text-success-600">8/12</span></div>
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden"><div className="h-full w-2/3 bg-success-500" /></div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1 text-sm"><span className="text-neutral-600">{t('patient_satisfaction')}</span><span className="font-semibold text-primary-600">4.8/5</span></div>
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden"><div className="h-full w-[96%] bg-primary-500" /></div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1 text-sm"><span className="text-neutral-600">{t('revenue_target')}</span><span className="font-semibold text-primary-600">$2.3K/$3K</span></div>
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden"><div className="h-full w-[77%] bg-primary-600" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Patient Modal */}
        <Modal
          isOpen={isAddPatientModalOpen}
          onClose={() => setIsAddPatientModalOpen(false)}
          title={t('add_new_patient')}
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
                  {bookingStep === 'patient' ? t('select_patient') : t('book_appointment')}
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
                    <span className="text-sm font-medium">{t('select_patient')}</span>
                  </div>
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <div className={`flex items-center space-x-2 ${bookingStep === 'appointment' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      bookingStep === 'appointment' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      2
                    </div>
                    <span className="text-sm font-medium">{t('book_appointment')}</span>
                  </div>
                </div>
              </div>
              {/* Content */}
              <div className="h-[600px] overflow-y-auto">
                <div className="p-6">
                  {bookingStep === 'patient' && (
                    <div className="min-h-full">
                      {showCreatePatientForm ? (
                        <div>
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-medium text-gray-900">{t('create_new_patient')}</h3>
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
                                placeholder={t('search_patients_placeholder')}
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
                              <div className="text-sm font-medium">{t('create_new_patient')}</div>
                            </button>
                          </div>
                          {/* Patient list */}
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
                                  {t('no_patients_found', { query: searchQuery })}
                                </div>
                              )}
                              {displayedPatients.length === 0 && !searchQuery && (
                                <div className="text-center py-8 text-gray-500">
                                  {t('no_patients_available')}
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
                          <h3 className="text-lg font-medium text-gray-900">{t('book_appointment')}</h3>
                          <p className="text-sm text-gray-600">
                            {t('for_patient', {
                              firstName: selectedPatientForBooking.first_name,
                              lastName: selectedPatientForBooking.last_name
                            })}
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
                        workingHours={workingHours}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div> {/* end space-y-8 wrapper */}
    </DashboardLayout>
  );
};
