import React, { useState, useEffect } from 'react';
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
import { useNotification } from '../hooks/useNotification';
import { TimeSlot } from '../hooks/useTimeSlotDrag';

type CalendarView = 'month' | 'week' | 'day';

interface AppointmentData {
  id: string;
  patientName: string;
  time: string;
  duration: number;
  type: string;
  status: string;
  title: string;
}

export const Calendar: React.FC = () => {
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

  const { notification, showNotification, hideNotification } = useNotification();

  // Helper to get the start date and number of days for each view
  const getRange = () => {
    let start = new Date(currentDate);
    let days = 1;
    if (view === 'week') {
      start.setDate(start.getDate() - start.getDay());
      days = 7;
    } else if (view === 'month') {
      start.setDate(1);
      days = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    }
    return { start, days };
  };

  useEffect(() => {
    const { start, days } = getRange();
    setLoading(true);
    setError(null);
    AppointmentService.listAppointmentsByRange(start.toISOString().split('T')[0], days)
      .then(setAppointments)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentDate, view]);

  // Helper to group appointments by date (YYYY-MM-DD)
  const groupAppointmentsByDate = (appointments: Appointment[]) => {
    const map: { [date: string]: AppointmentData[] } = {};
    appointments.forEach((apt) => {
      const dateKey = apt.date.split('T')[0];

      // Parse start and end times properly
      const startTime = apt.start_time.split('.')[0]; // Remove microseconds
      const endTime = apt.end_time.split('.')[0]; // Remove microseconds

      // Calculate duration in minutes
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const duration = (eh * 60 + em) - (sh * 60 + sm);

      // Format time for display (24-hour format for positioning)
      const displayTime = `${sh.toString().padStart(2, '0')}:${sm.toString().padStart(2, '0')}`;

      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push({
        id: apt.id,
        patientName: `${apt.patient_first_name} ${apt.patient_last_name}`,
        time: displayTime,
        duration,
        type: apt.type,
        status: apt.status,
        title: apt.title,
      });
    });
    return map;
  };

  const groupedAppointments = groupAppointmentsByDate(appointments);

  const getAppointmentsForDate = (date: Date): AppointmentData[] => {
    const dateString = date.toISOString().split('T')[0];
    return groupedAppointments[dateString] || [];
  };

  const handleDateNavigation = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getDateRangeText = () => {
    if (view === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (view === 'week') {
      const weekStart = getWeekDates(currentDate)[0];
      const weekEnd = getWeekDates(currentDate)[6];
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const timeSlots = Array.from({ length: 10 }, (_, i) => {
    const hour = i + 8;
    return `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
  });

  const getWeekDates = (date: Date): Date[] => {
    const week: Date[] = [];
    const current = new Date(date);
    current.setDate(current.getDate() - current.getDay());

    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return week;
  };

  const handleAppointmentClick = async (appointmentId: string) => {
    try {
      setAppointmentLoading(true);
      const [appointment, patient] = await Promise.all([
        AppointmentService.getAppointment(appointmentId),
        // We need to get the patient from the appointment's patient_id
        PatientService.getPatient(appointments.find(apt => apt.id === appointmentId)?.patient_id || '')
      ]);
      setSelectedAppointment(appointment);
      setSelectedPatient(patient);
    } catch (err: any) {
      showNotification('error', 'Error', err.message);
    } finally {
      setAppointmentLoading(false);
    }
  };

  const handleEditAppointment = async (appointmentData: AppointmentUpdate) => {
    if (!selectedAppointment) return;

    try {
      setAppointmentLoading(true);
      await AppointmentService.updateAppointment(selectedAppointment.id, appointmentData);
      showNotification('success', 'Success', 'Appointment updated successfully');

      // Refresh appointments
      const { start, days } = getRange();
      const updatedAppointments = await AppointmentService.listAppointmentsByRange(start.toISOString().split('T')[0], days);
      setAppointments(updatedAppointments);

      setSelectedAppointment(null);
      setSelectedPatient(null);
    } catch (err: any) {
      showNotification('error', 'Error', err.message);
    } finally {
      setAppointmentLoading(false);
    }
  };

  const handleUpdateAppointmentStatus = async (status: AppointmentStatus) => {
    if (!selectedAppointment) return;

    try {
      setAppointmentLoading(true);
      await AppointmentService.updateAppointment(selectedAppointment.id, { status });
      showNotification('success', 'Success', 'Appointment status updated successfully');

      // Refresh appointments
      const { start, days } = getRange();
      const updatedAppointments = await AppointmentService.listAppointmentsByRange(start.toISOString().split('T')[0], days);
      setAppointments(updatedAppointments);

      setSelectedAppointment(null);
      setSelectedPatient(null);
    } catch (err: any) {
      showNotification('error', 'Error', err.message);
    } finally {
      setAppointmentLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      setAppointmentLoading(true);
      await AppointmentService.updateAppointment(selectedAppointment.id, { status: 'Cancelled' });
      showNotification('success', 'Success', 'Appointment cancelled successfully');

      // Refresh appointments
      const { start, days } = getRange();
      const updatedAppointments = await AppointmentService.listAppointmentsByRange(start.toISOString().split('T')[0], days);
      setAppointments(updatedAppointments);

      setSelectedAppointment(null);
      setSelectedPatient(null);
    } catch (err: any) {
      showNotification('error', 'Error', err.message);
    } finally {
      setAppointmentLoading(false);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      setAppointmentLoading(true);
      await AppointmentService.deleteAppointment(selectedAppointment.id);
      showNotification('success', 'Success', 'Appointment deleted successfully');

      // Refresh appointments
      const { start, days } = getRange();
      const updatedAppointments = await AppointmentService.listAppointmentsByRange(start.toISOString().split('T')[0], days);
      setAppointments(updatedAppointments);

      setSelectedAppointment(null);
      setSelectedPatient(null);
    } catch (err: any) {
      showNotification('error', 'Error', err.message);
    } finally {
      setAppointmentLoading(false);
    }
  };

  const handleCloseAppointmentDetail = () => {
    setSelectedAppointment(null);
    setSelectedPatient(null);
  };

  const handleNewAppointmentClick = () => {
    setBookingStep('time');
    setShowNewAppointmentForm(true);
  };

  const handleTimeSlotSelect = (date: string, time: string) => {
    setSelectedTimeSlot({ date, time });
    setBookingStep('patient');
  };

  const handlePatientSearchClick = async () => {
    try {
      setLoading(true);
      const allPatients = await PatientService.listPatients();
      setPatients(allPatients);
    } catch (err: any) {
      showNotification('error', 'Error', 'Failed to load patients: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatientForBooking = async (patientData: PatientCreate | PatientUpdate) => {
    try {
      setAppointmentLoading(true);
      // Cast to PatientCreate since we're only creating new patients in this context
      const newPatient = await PatientService.createPatient(patientData as PatientCreate);
      showNotification('success', 'Success', 'Patient created successfully.');
      setSelectedPatientForBooking(newPatient);
      setBookingStep('confirm');
    } catch (err: any) {
      showNotification('error', 'Error', `Failed to create patient: ${err.message}`);
    } finally {
      setAppointmentLoading(false);
    }
  };

  const handleCreateAppointment = async (appointmentData: AppointmentCreate) => {
    try {
      setAppointmentLoading(true);
      await AppointmentService.createAppointment(appointmentData);
      showNotification('success', 'Success', 'Appointment created successfully');

      // Refresh appointments
      const { start, days } = getRange();
      const updatedAppointments = await AppointmentService.listAppointmentsByRange(start.toISOString().split('T')[0], days);
      setAppointments(updatedAppointments);

      // Close and reset form immediately
      setShowNewAppointmentForm(false);
      setSelectedPatientForBooking(null);
      setSelectedTimeSlot(null);
      setBookingStep('time');
      setSearchQuery('');
    } catch (err: any) {
      showNotification('error', 'Error', err.message);
    } finally {
      setAppointmentLoading(false);
    }
  };

  const handleCancelNewAppointment = () => {
    setShowNewAppointmentForm(false);
    setSelectedPatientForBooking(null);
    setSelectedTimeSlot(null);
    setBookingStep('time');
    setSearchQuery('');
  };

  const filteredPatients = patients.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // New handler for time slot selection from drag
  const handleTimeSlotSelected = (slot: TimeSlot) => {
    setSelectedTimeSlot({
      date: slot.date,
      time: slot.startTime,
      endTime: slot.endTime
    });
    setShowNewAppointmentForm(true);
    setBookingStep('patient');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {loading && <div className="text-center text-blue-600">Loading appointments...</div>}
        {error && <div className="text-center text-red-600">{error}</div>}

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Appointment Calendar</h2>
            <p className="text-gray-500">Manage and schedule patient appointments.</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleNewAppointmentClick}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md flex items-center space-x-2 transition-colors duration-150"
            >
              <span className="material-icons text-base">add</span>
              <span>New Appointment</span>
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors duration-150">
              <span className="material-icons">menu</span>
            </button>
          </div>
        </div>

        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setView('month')}
            className={`px-4 py-2 rounded-md transition-colors duration-150 ${
              view === 'month'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-4 py-2 rounded-md transition-colors duration-150 ${
              view === 'week'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setView('day')}
            className={`px-4 py-2 rounded-md transition-colors duration-150 ${
              view === 'day'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Day
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDateNavigation('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                >
                  <span className="material-icons">chevron_left</span>
                </button>
                <button
                  onClick={() => handleDateNavigation('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                >
                  <span className="material-icons">chevron_right</span>
                </button>
              </div>
              <span className="text-lg font-medium">
                {getDateRangeText()}
              </span>
            </div>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
            >
              Today
            </button>
          </div>

          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              appointments={groupedAppointments}
              onAppointmentClick={handleAppointmentClick}
            />
          )}

          {view === 'week' && (
            <div className="flex h-[600px]">
              {/* Time column */}
              <div className="w-20 flex-shrink-0">
                {/* Header spacer */}
                <div className="h-12 border-b border-gray-200"></div>
                {/* Time slots */}
                {timeSlots.map((time) => (
                  <div
                    key={time}
                    className="h-[60px] border-b border-gray-200 px-2 py-1 text-xs text-gray-500 text-right flex items-start"
                  >
                    {time}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="flex-1 flex">
                {getWeekDates(currentDate).map((date, index) => (
                  <div key={date.toISOString()} className="flex-1 flex flex-col">
                    {/* Day header */}
                    <div className="h-12 border-b border-gray-200 p-2 text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {weekDays[index]}
                      </div>
                      <div className={`text-sm ${
                        new Date().toDateString() === date.toDateString()
                          ? 'text-blue-600 font-semibold'
                          : 'text-gray-500'
                      }`}>
                        {date.getDate()}
                      </div>
                    </div>

                    {/* Day content with drag functionality */}
                    <div className="flex-1 relative border-r border-gray-200 last:border-r-0">
                      <DayColumn
                        date={date}
                        appointments={getAppointmentsForDate(date)}
                        onAppointmentClick={handleAppointmentClick}
                        onTimeSlotSelected={handleTimeSlotSelected}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'day' && (
            <DayView
              date={currentDate}
              appointments={getAppointmentsForDate(currentDate)}
              onAppointmentClick={handleAppointmentClick}
              onTimeSlotSelected={handleTimeSlotSelected}
            />
          )}
        </div>

        {selectedAppointment && selectedPatient && (
          <AppointmentDetail
            appointment={selectedAppointment}
            patient={selectedPatient}
            isLoading={appointmentLoading}
            onClose={handleCloseAppointmentDetail}
            onEdit={handleEditAppointment}
            onUpdateStatus={handleUpdateAppointmentStatus}
            onCancel={handleCancelAppointment}
            onDelete={handleDeleteAppointment}
          />
        )}

        {/* Multi-step appointment booking modal */}
        {showNewAppointmentForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {bookingStep === 'time' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Select Date & Time</h2>
                    <button onClick={handleCancelNewAppointment} className="text-gray-400 hover:text-gray-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <p className="text-gray-600 mb-6">Select the date and time for the appointment</p>

                  <div className="space-y-6">
                    {/* Date Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={selectedTimeSlot?.date || ''}
                        onChange={(e) => setSelectedTimeSlot(prev => ({ ...prev, date: e.target.value, time: prev?.time || '', endTime: prev?.endTime || '' }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Duration Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Appointment Duration *
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { minutes: 15, label: '15 min' },
                          { minutes: 30, label: '30 min' },
                          { minutes: 45, label: '45 min' },
                          { minutes: 60, label: '1 hour' },
                          { minutes: 90, label: '1.5 hours' },
                          { minutes: 120, label: '2 hours' }
                        ].map((duration) => (
                          <button
                            key={duration.minutes}
                            type="button"
                            onClick={() => {
                              const currentTime = selectedTimeSlot?.time;
                              if (currentTime) {
                                const [hours, minutes] = currentTime.split(':').map(Number);
                                const endMinutes = (hours * 60) + minutes + duration.minutes;
                                const endHours = Math.floor(endMinutes / 60);
                                const endMins = endMinutes % 60;
                                const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
                                setSelectedTimeSlot(prev => ({
                                  date: prev?.date || '',
                                  time: prev?.time || '',
                                  endTime
                                }));
                              }
                            }}
                            className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                              selectedTimeSlot?.time && selectedTimeSlot?.endTime && 
                              (() => {
                                const [startH, startM] = selectedTimeSlot.time.split(':').map(Number);
                                const [endH, endM] = selectedTimeSlot.endTime.split(':').map(Number);
                                const actualDuration = (endH * 60 + endM) - (startH * 60 + startM);
                                return actualDuration === duration.minutes;
                              })()
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {duration.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time Slot Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Available Time Slots *
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                        {Array.from({ length: 20 }, (_, i) => {
                          const hour = 8 + Math.floor(i / 2);
                          const minute = (i % 2) * 30;
                          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                          const displayTime = `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;

                          return (
                            <button
                              key={timeString}
                              type="button"
                              onClick={() => {
                                setSelectedTimeSlot(prev => {
                                  const newSlot = { ...prev, date: prev?.date || '', time: timeString };

                                  // Auto-calculate end time if we have a previous duration selection
                                  if (prev?.endTime && prev?.time) {
                                    const [prevStartH, prevStartM] = prev.time.split(':').map(Number);
                                    const [prevEndH, prevEndM] = prev.endTime.split(':').map(Number);
                                    const duration = (prevEndH * 60 + prevEndM) - (prevStartH * 60 + prevStartM);

                                    const endMinutes = (hour * 60) + minute + duration;
                                    const endHours = Math.floor(endMinutes / 60);
                                    const endMins = endMinutes % 60;
                                    newSlot.endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
                                  } else {
                                    // Default to 30 minutes if no previous duration
                                    const endMinutes = (hour * 60) + minute + 30;
                                    const endHours = Math.floor(endMinutes / 60);
                                    const endMins = endMinutes % 60;
                                    newSlot.endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
                                  }

                                  return newSlot;
                                });
                              }}
                              className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                                selectedTimeSlot?.time === timeString
                                  ? 'bg-blue-500 text-white border-blue-500'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {displayTime}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Time Input (Alternative) */}
                    <div className="pt-4 border-t">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Or Set Custom Time
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                          <input
                            type="time"
                            value={selectedTimeSlot?.time || ''}
                            onChange={(e) => setSelectedTimeSlot(prev => ({ ...prev, date: prev?.date || '', time: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">End Time</label>
                          <input
                            type="time"
                            value={selectedTimeSlot?.endTime || ''}
                            onChange={(e) => setSelectedTimeSlot(prev => ({ ...prev, date: prev?.date || '', time: prev?.time || '', endTime: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Selected Time Summary */}
                    {selectedTimeSlot?.date && selectedTimeSlot?.time && selectedTimeSlot?.endTime && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-1">Selected Appointment Time</h4>
                        <p className="text-sm text-blue-700">
                          {new Date(selectedTimeSlot.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-blue-700">
                          {(() => {
                            const [startH, startM] = selectedTimeSlot.time.split(':').map(Number);
                            const [endH, endM] = selectedTimeSlot.endTime.split(':').map(Number);
                            const startTime = `${startH > 12 ? startH - 12 : startH === 0 ? 12 : startH}:${startM.toString().padStart(2, '0')} ${startH >= 12 ? 'PM' : 'AM'}`;
                            const endTime = `${endH > 12 ? endH - 12 : endH === 0 ? 12 : endH}:${endM.toString().padStart(2, '0')} ${endH >= 12 ? 'PM' : 'AM'}`;
                            const duration = (endH * 60 + endM) - (startH * 60 + startM);
                            return `${startTime} - ${endTime} (${duration} minutes)`;
                          })()}
                        </p>
                      </div>
                    )}

                    {/* Continue Button */}
                    <div className="flex justify-end pt-4">
                      <button
                        onClick={() => {
                          if (selectedTimeSlot?.date && selectedTimeSlot?.time && selectedTimeSlot?.endTime) {
                            setBookingStep('patient');
                          }
                        }}
                        disabled={!selectedTimeSlot?.date || !selectedTimeSlot?.time || !selectedTimeSlot?.endTime}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors duration-150"
                      >
                        Continue to Patient Selection
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {bookingStep === 'patient' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Select Patient</h2>
                      {selectedTimeSlot && (
                        <p className="text-sm text-gray-600">
                          For {new Date(selectedTimeSlot.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })} at {selectedTimeSlot.time}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => setBookingStep('time')} className="text-sm text-blue-600 hover:underline">
                        &larr; Back to Time
                      </button>
                      <button onClick={handleCancelNewAppointment} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={handlePatientSearchClick}
                    className="w-full p-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => {
                          setSelectedPatientForBooking(patient);
                          setBookingStep('confirm');
                        }}
                        className="p-3 border rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <p className="font-medium text-gray-800">{patient.first_name} {patient.last_name}</p>
                        <p className="text-sm text-gray-500">{patient.email}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <button onClick={() => setBookingStep('create')} className="w-full text-center text-blue-600 hover:underline font-medium py-2">
                      + Or Create a New Patient
                    </button>
                  </div>
                </div>
              )}

              {bookingStep === 'create' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Create New Patient</h2>
                    <button onClick={() => setBookingStep('patient')} className="text-sm text-blue-600 hover:underline">
                      &larr; Back to Patient Search
                    </button>
                  </div>
                  <PatientForm
                    onSubmit={handleCreatePatientForBooking}
                    onCancel={() => setBookingStep('patient')}
                    isLoading={appointmentLoading}
                  />
                </div>
              )}

              {bookingStep === 'confirm' && selectedPatientForBooking && selectedTimeSlot && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Confirm Appointment</h2>
                      <p className="text-sm text-gray-600">
                        {selectedPatientForBooking.first_name} {selectedPatientForBooking.last_name} - {' '}
                        {new Date(selectedTimeSlot.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric'
                        })} at {selectedTimeSlot.time}
                      </p>
                    </div>
                    <button onClick={() => setBookingStep('patient')} className="text-sm text-blue-600 hover:underline">
                      &larr; Back to Patient
                    </button>
                  </div>
                  <AppointmentBookingForm
                    patient={selectedPatientForBooking}
                    preselectedDate={selectedTimeSlot.date}
                    preselectedTime={selectedTimeSlot.time}
                    preselectedEndTime={selectedTimeSlot.endTime}
                    onSubmit={handleCreateAppointment}
                    onCancel={handleCancelNewAppointment}
                    isLoading={appointmentLoading}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
