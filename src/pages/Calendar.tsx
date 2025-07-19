import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../context/TranslationContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { DayColumn } from '../components/calendar/DayColumn';
import { MonthView } from '../components/calendar/MonthView';
import { DayView } from '../components/calendar/DayView';
import { AppointmentDetail } from '../components/patients/AppointmentDetail';
import { AppointmentBookingForm } from '../components/patients/AppointmentBookingForm';
import { PatientForm } from '../components/patients/PatientForm';
import { AppointmentService } from '../services/appointmentService';
import { PatientService } from '../services/patientService';
import { Appointment, AppointmentUpdate, AppointmentStatus, AppointmentCreate } from '../types/Appointment';
import { Patient, PatientCreate, PatientUpdate } from '../types/Patient';
import { useNotification } from '../context/NotificationContext';
import { TimeSlot } from '../hooks/useTimeSlotDrag';
import '../styles/calendar-day.css'; // Import the calendar day CSS

type CalendarView = 'month' | 'week' | 'day';

export const Calendar: React.FC = () => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('week');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [showNewAppointmentForm, setShowNewAppointmentForm] = useState(false);
  const [selectedPatientForBooking, setSelectedPatientForBooking] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [bookingStep, setBookingStep] = useState<'time' | 'patient' | 'create' | 'confirm'>('time');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{date: string, time: string, endTime?: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { showNotification } = useNotification();

  // Load appointments from API
  const loadAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      // Calculate date range based on current view
      const startDate = getViewStartDate();
      const days = getViewDays();

      const appointmentData = await AppointmentService.listAppointmentsByRange(
        startDate.toISOString().split('T')[0],
        days
      );
      setAppointments(appointmentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
      console.error('Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load patients for appointment booking
  const loadPatients = async () => {
    try {
      const response = await PatientService.listPatients();
      setPatients(response.data);
    } catch (err) {
      console.error('Error loading patients:', err);
    }
  };

  // Load data on component mount and when date/view changes
  useEffect(() => {
    loadAppointments();
    loadPatients();
  }, [currentDate, view]);

  // Handle appointment creation
  const handleCreateAppointment = async (appointmentData: AppointmentCreate) => {
    setAppointmentLoading(true);
    try {
      const newAppointment = await AppointmentService.createAppointment(appointmentData);
      setAppointments(prev => [...prev, newAppointment]);
      setShowNewAppointmentForm(false);
      setSelectedTimeSlot(null);
      showNotification('success', 'Success', 'Appointment created successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create appointment');
      console.error('Error creating appointment:', err);
    } finally {
      setAppointmentLoading(false);
    }
  };

  // Handle appointment update
  const handleUpdateAppointment = async (appointmentId: string, appointmentData: AppointmentUpdate) => {
    setAppointmentLoading(true);
    try {
      const updatedAppointment = await AppointmentService.updateAppointment(appointmentId, appointmentData);
      setAppointments(prev => prev.map(apt => apt.id === appointmentId ? updatedAppointment : apt));
      setSelectedAppointment(updatedAppointment);
      showNotification('success', 'Success', 'Appointment updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update appointment');
      console.error('Error updating appointment:', err);
    } finally {
      setAppointmentLoading(false);
    }
  };

  // Handle appointment deletion
  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    setAppointmentLoading(true);
    try {
      await AppointmentService.deleteAppointment(appointmentId);
      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
      setSelectedAppointment(null);
      showNotification('success', 'Success', 'Appointment deleted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete appointment');
      console.error('Error deleting appointment:', err);
    } finally {
      setAppointmentLoading(false);
    }
  };

  // Helper functions for date calculations
  const getViewStartDate = () => {
    const date = new Date(currentDate);
    if (view === 'week') {
      date.setDate(date.getDate() - date.getDay()); // Start of week
    } else if (view === 'month') {
      date.setDate(1); // Start of month
    }
    return date;
  };

  const getViewDays = () => {
    switch (view) {
      case 'day': return 1;
      case 'week': return 7;
      case 'month': return 31; // Approximate
      default: return 7;
    }
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'Completed': return 'bg-success-500';
      case 'Booked': return 'bg-primary-500';
      case 'Cancelled': return 'bg-error-500';
      case 'No Show': return 'bg-warning-500';
      default: return 'bg-neutral-400';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  // Format appointment time from API response
  const formatAppointmentTime = (appointment: Appointment) => {
    if (appointment.start_time) {
      // Convert time format (e.g., "09:00:00.000000") to "09:00"
      return appointment.start_time.split(':').slice(0, 2).join(':');
    }
    return '00:00';
  };

  // Get appointment date from API response
  const getAppointmentDate = (appointment: Appointment) => {
    if (appointment.date) {
      return appointment.date.split('T')[0]; // Extract date part from ISO string
    }
    return new Date().toISOString().split('T')[0];
  };

  // Get patient name from appointment
  const getPatientName = (appointment: Appointment) => {
    return `${appointment.patient_first_name} ${appointment.patient_last_name}`;
  };

  // Calculate appointment duration in minutes
  const getAppointmentDuration = (appointment: Appointment) => {
    if (appointment.start_time && appointment.end_time) {
      const start = new Date(`2000-01-01T${appointment.start_time}`);
      const end = new Date(`2000-01-01T${appointment.end_time}`);
      return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // Duration in minutes
    }
    return 30; // Default duration
  };

  const renderCalendarHeader = () => (
    <div className="card mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-600 mb-2">Calendar</h1>
          <p className="text-neutral-600">{formatDate(currentDate)}</p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-2">
          <div className="bg-neutral-100 rounded-xl p-1 flex border border-neutral-200">
            {(['month', 'week', 'day'] as CalendarView[]).map((viewType) => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  view === viewType
                    ? 'bg-primary-500 text-white shadow-primary'
                    : 'text-neutral-600 hover:text-primary-600 hover:bg-white'
                }`}
              >
                {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigateDate('prev')}
            className="btn-secondary p-3"
          >
            <span className="material-icons-round">chevron_left</span>
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="btn-secondary"
          >
            Today
          </button>
          <button
            onClick={() => navigateDate('next')}
            className="btn-secondary p-3"
          >
            <span className="material-icons-round">chevron_right</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button className="btn-secondary">
            <span className="material-icons-round mr-2">search</span>
            Search
          </button>
          <button
            onClick={() => setShowNewAppointmentForm(true)}
            className="btn-primary"
          >
            <span className="material-icons-round mr-2">add</span>
            New Appointment
          </button>
        </div>
      </div>
    </div>
  );

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());

    const days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return day;
    });

    const timeSlots = Array.from({ length: 12 }, (_, i) => {
      const hour = i + 8; // 8 AM to 8 PM
      return `${hour.toString().padStart(2, '0')}:00`;
    });

    return (
      <div className="card overflow-hidden">
        {/* Week header */}
        <div className="grid grid-cols-8 border-b border-neutral-200">
          <div className="p-4"></div>
          {days.map((day, index) => (
            <div
              key={index}
              className={`p-4 text-center slide-up-element ${
                day.toDateString() === new Date().toDateString()
                  ? 'bg-primary-50 border-primary-200'
                  : 'bg-neutral-50'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <p className="text-sm text-neutral-500">{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
              <p className={`text-lg font-semibold ${
                day.toDateString() === new Date().toDateString()
                  ? 'text-primary-600'
                  : 'text-neutral-800'
              }`}>
                {day.getDate()}
              </p>
            </div>
          ))}
        </div>

        {/* Time slots grid */}
        <div className="max-h-96 overflow-y-auto">
          {timeSlots.map((time, timeIndex) => (
            <div key={time} className="grid grid-cols-8 border-b border-neutral-100 hover:bg-primary-50 transition-all duration-300">
              <div className="p-4 text-right text-sm text-neutral-500 bg-neutral-50">
                {time}
              </div>
              {days.map((day, dayIndex) => {
                const dayStr = day.toISOString().split('T')[0];
                const dayAppointments = appointments.filter(apt => getAppointmentDate(apt) === dayStr && formatAppointmentTime(apt) === time);

                return (
                  <div
                    key={`${dayStr}-${time}`}
                    className="p-2 min-h-[60px] relative group cursor-pointer"
                    onClick={() => setSelectedTimeSlot({ date: dayStr, time })}
                  >
                    {dayAppointments.map((appointment, aptIndex) => (
                      <div
                        key={appointment.id}
                        className={`
                          absolute inset-x-1 ${getStatusColor(appointment.status)}
                          rounded-lg p-2 text-white text-xs shadow-medium
                          hover:scale-105 hover:shadow-large transition-all duration-300
                          cursor-pointer z-10
                        `}
                        style={{
                          top: `${aptIndex * 4}px`,
                          height: `${Math.min(getAppointmentDuration(appointment), 60)}px`
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAppointment(appointment as any);
                        }}
                      >
                        <p className="font-semibold truncate">{getPatientName(appointment)}</p>
                        <p className="opacity-90 truncate">{appointment.type}</p>
                      </div>
                    ))}
                    <div className="absolute inset-0 bg-primary-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    // Create time slots from 8 AM to 7 PM
    const timeSlots = Array.from({ length: 12 }, (_, i) => {
      const hour = i + 8; // 8 AM to 7 PM
      return `${hour.toString().padStart(2, '0')}:00`;
    });

    const dayStr = currentDate.toISOString().split('T')[0];

    return (
      <div className="card overflow-hidden">
        {/* Day header - similar to week header but for a single day */}
        <div className="grid grid-cols-[80px_1fr] border-b border-neutral-200">
          <div className="p-2"></div>
          <div
            className={`p-4 text-center slide-up-element ${
              currentDate.toDateString() === new Date().toDateString()
                ? 'bg-primary-50 border-primary-200'
                : 'bg-neutral-50'
            }`}
            style={{ animationDelay: '0.1s' }}
          >
            <p className="text-sm text-neutral-500">{currentDate.toLocaleDateString('en-US', { weekday: 'short' })}</p>
            <p className={`text-lg font-semibold ${
              currentDate.toDateString() === new Date().toDateString()
                ? 'text-primary-600'
                : 'text-neutral-800'
            }`}>
              {currentDate.getDate()}
            </p>
          </div>
        </div>

        {/* Time slots grid - similar to week view but only one day column */}
        <div className="max-h-96 overflow-y-auto">
          {timeSlots.map((time, timeIndex) => {
            const dayAppointments = appointments.filter(apt =>
              getAppointmentDate(apt) === dayStr &&
              formatAppointmentTime(apt).split(':')[0] === time.split(':')[0]
            );

            return (
              <div
                key={time}
                className="grid grid-cols-[80px_1fr] border-b border-neutral-100 hover:bg-primary-50 transition-all duration-300 slide-up-element"
                style={{ animationDelay: `${timeIndex * 0.05}s` }}
              >
                <div className="p-4 text-right text-sm text-neutral-500 bg-neutral-50">
                  {time}
                </div>
                <div
                  className="p-2 min-h-[60px] relative group cursor-pointer"
                  onClick={() => setSelectedTimeSlot({ date: dayStr, time })}
                >
                  {dayAppointments.map((appointment, aptIndex) => (
                    <div
                      key={appointment.id}
                      className={`
                        absolute inset-x-1 ${getStatusColor(appointment.status)}
                        rounded-lg p-2 text-white text-xs shadow-medium
                        hover:scale-105 hover:shadow-large transition-all duration-300
                        cursor-pointer z-10
                      `}
                      style={{
                        top: `${aptIndex * 4}px`,
                        height: `${Math.min(getAppointmentDuration(appointment), 60)}px`
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAppointment(appointment as any);
                      }}
                    >
                      <p className="font-semibold truncate">{getPatientName(appointment)}</p>
                      <p className="opacity-90 truncate">{appointment.type}</p>
                    </div>
                  ))}
                  <div className="absolute inset-0 bg-primary-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="fade-in-element">
        {renderCalendarHeader()}

        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
        {view === 'month' && (
          <div className="card">
            <p className="text-center text-neutral-600 py-12">Month view coming soon...</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
