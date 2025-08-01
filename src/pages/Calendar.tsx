import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../context/TranslationContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { MonthView } from '../components/calendar/MonthView';
import { WeeklyView } from '../components/calendar/WeeklyView';
import { DayView } from '../components/calendar/DayView';
import { AppointmentDetail } from '../components/patients/AppointmentDetail';
import { AppointmentBookingForm } from '../components/patients/AppointmentBookingForm';
import { PatientForm } from '../components/patients/PatientForm';
import { AppointmentService } from '../services/appointmentService';
import { PatientService } from '../services/patientService';
import { Appointment, AppointmentUpdate, AppointmentStatus, AppointmentCreate } from '../types/Appointment';
import { Patient, PatientCreate, PatientUpdate } from '../types/Patient';
import { useNotification } from '../context/NotificationContext';
import '../styles/calendar-day.css'; // Import the calendar day CSS
import { RescheduleConfirmation } from '../components/calendar/RescheduleConfirmation';

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
  const [bookingStep, setBookingStep] = useState<'patient' | 'appointment'>('patient');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{date: string, time: string, endTime?: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [showCreatePatientForm, setShowCreatePatientForm] = useState(false);

  // Reschedule confirmation state
  const [showRescheduleConfirmation, setShowRescheduleConfirmation] = useState(false);
  const [rescheduleData, setRescheduleData] = useState<{
    appointment: Appointment;
    patient: Patient;
    newDate: string;
    newStartTime: string;
    newEndTime: string;
  } | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{date: string, time: string} | null>(null);
  const [dragEnd, setDragEnd] = useState<{date: string, time: string} | null>(null);

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

  // Handle appointment status update
  const handleUpdateAppointmentStatus = async (appointmentId: string, status: AppointmentStatus) => {
    setAppointmentLoading(true);
    try {
      const updatedAppointment = await AppointmentService.updateAppointment(appointmentId, { status });
      setAppointments(prev => prev.map(apt => apt.id === appointmentId ? updatedAppointment : apt));
      setSelectedAppointment(updatedAppointment);
      showNotification('success', 'Success', `Appointment ${status.toLowerCase()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update appointment status');
      console.error('Error updating appointment status:', err);
    } finally {
      setAppointmentLoading(false);
    }
  };

  // Handle appointment cancellation
  const handleCancelAppointment = async (appointmentId: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    setAppointmentLoading(true);
    try {
      const updatedAppointment = await AppointmentService.updateAppointment(appointmentId, { status: 'Cancelled' });
      setAppointments(prev => prev.map(apt => apt.id === appointmentId ? updatedAppointment : apt));
      setSelectedAppointment(updatedAppointment);
      showNotification('success', 'Success', 'Appointment cancelled');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel appointment');
      console.error('Error cancelling appointment:', err);
    } finally {
      setAppointmentLoading(false);
    }
  };

  // Handle new appointment flow
  const handleNewAppointmentClick = () => {
    setShowNewAppointmentForm(true);
    setBookingStep('patient');
    setSelectedPatientForBooking(null);
    setSearchQuery('');
    setShowCreatePatientForm(false);
  };

  // Handle patient selection for booking
  const handlePatientSelect = (patient: Patient) => {
    // Set the selected patient and transition to appointment booking step
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

  // Handle appointment booking completion
  const handleAppointmentBookingComplete = async (appointmentData: AppointmentCreate) => {
    await handleCreateAppointment(appointmentData);
    // Reset booking state
    setBookingStep('patient');
    setSelectedPatientForBooking(null);
    setSearchQuery('');
    setShowCreatePatientForm(false);
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
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Booked': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'No Show': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get background color for appointment status
  const getAppointmentBackgroundColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'Completed': return '#dcfce7'; // Light green
      case 'Booked': return '#dbeafe';    // Light blue
      case 'Cancelled': return '#fee2e2';  // Light red
      case 'No Show': return '#ffedd5';    // Light orange
      default: return '#f3f4f6';          // Light gray
    }
  };

  // Get text color for appointment status
  const getAppointmentTextColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'Completed': return '#166534'; // Dark green
      case 'Booked': return '#1e40af';    // Dark blue
      case 'Cancelled': return '#b91c1c';  // Dark red
      case 'No Show': return '#c2410c';    // Dark orange
      default: return '#4b5563';          // Dark gray
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

  // Load patient data for the selected appointment
  const loadPatientForAppointment = useCallback(async (appointment: Appointment) => {
    if (!appointment || !appointment.patient_id) return;

    try {
      setAppointmentLoading(true);
      const patientData = await PatientService.getPatient(appointment.patient_id);
      setSelectedPatient(patientData);
    } catch (err) {
      console.error('Error loading patient data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load patient data');
      showNotification('error', 'Error', 'Failed to load patient data');
    } finally {
      setAppointmentLoading(false);
    }
  }, [showNotification]);

  // Handle appointment selection
  useEffect(() => {
    if (selectedAppointment) {
      loadPatientForAppointment(selectedAppointment);
    } else {
      setSelectedPatient(null);
    }
  }, [selectedAppointment, loadPatientForAppointment]);

  // Format appointments data for MonthView component
  const groupAppointmentsByDate = () => {
    const grouped: Record<string, any[]> = {};

    appointments.forEach(appointment => {
      const dateStr = getAppointmentDate(appointment);

      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }

      grouped[dateStr].push({
        id: appointment.id,
        patientName: getPatientName(appointment),
        time: formatAppointmentTime(appointment),
        duration: getAppointmentDuration(appointment),
        type: appointment.type,
        status: appointment.status,
        title: appointment.type || 'Appointment'
      });
    });

    return grouped;
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
          <button
            onClick={handleNewAppointmentClick}
            className="btn-primary"
          >
            <span className="material-icons-round mr-2">add</span>
            New Appointment
          </button>
        </div>
      </div>
    </div>
  );

  // Drag and drop handlers
  const handleMouseDown = (e: React.MouseEvent, date: string, time: string) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ date, time });
    setDragEnd({ date, time });
    console.log('Starting drag at:', date, time);
  };

  const handleMouseEnter = (date: string, time: string) => {
    if (isDragging && dragStart && dragStart.date === date) {
      setDragEnd({ date, time });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
      const timeSlots = Array.from({ length: 40 }, (_, i) => {
        const hour = Math.floor(i / 4) + 8;
        const minutes = (i % 4) * 15;
        return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      });

      const startIndex = timeSlots.indexOf(dragStart.time);
      const endIndex = timeSlots.indexOf(dragEnd.time);

      if (startIndex !== -1 && endIndex !== -1) {
        const minIndex = Math.min(startIndex, endIndex);
        const maxIndex = Math.max(startIndex, endIndex);
        const startTime = timeSlots[minIndex];
        const endTime = timeSlots[maxIndex + 1] || timeSlots[maxIndex]; // End time is next slot or same if last

        console.log('Drag completed:', {
          date: dragStart.date,
          startTime,
          endTime
        });

        setSelectedTimeSlot({
          date: dragStart.date,
          time: startTime,
          endTime
        });

        handleNewAppointmentClick();
      }
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // Check if a slot is selected in the drag
  const isSlotSelected = (date: string, time: string) => {
    if (!isDragging || !dragStart || !dragEnd || dragStart.date !== date) {
      return false;
    }

    const timeSlots = Array.from({ length: 40 }, (_, i) => {
      const hour = Math.floor(i / 4) + 8;
      const minutes = (i % 4) * 15;
      return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    });

    const currentIndex = timeSlots.indexOf(time);
    const startIndex = timeSlots.indexOf(dragStart.time);
    const endIndex = timeSlots.indexOf(dragEnd.time);

    if (currentIndex === -1 || startIndex === -1 || endIndex === -1) {
      return false;
    }

    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);

    return currentIndex >= minIndex && currentIndex <= maxIndex;
  };

  // Handle appointment rescheduling via drag and drop
  const handleAppointmentDrop = async (appointment: Appointment, newDate: string, newTime: string) => {
    // Calculate new end time based on appointment duration
    const duration = getAppointmentDuration(appointment);
    const [hours, minutes] = newTime.split(':').map(Number);
    const newStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    
    // Calculate end time
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    const newEndTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:00`;

    // Load patient data and show reschedule confirmation
    try {
      setAppointmentLoading(true);
      const patientData = await PatientService.getPatient(appointment.patient_id);
      
      setRescheduleData({
        appointment,
        patient: patientData,
        newDate,
        newStartTime,
        newEndTime
      });
      setShowRescheduleConfirmation(true);
    } catch (err) {
      console.error('Error loading patient data:', err);
      showNotification('error', 'Error', 'Failed to load patient data');
    } finally {
      setAppointmentLoading(false);
    }
  };

  // Handle reschedule confirmation
  const handleRescheduleConfirm = async (appointmentData: AppointmentUpdate) => {
    if (!rescheduleData) return;

    try {
      setAppointmentLoading(true);
      const updatedAppointment = await AppointmentService.updateAppointment(rescheduleData.appointment.id, appointmentData);
      setAppointments(prev => prev.map(apt => apt.id === rescheduleData.appointment.id ? updatedAppointment : apt));
      showNotification('success', 'Success', 'Appointment rescheduled successfully');
      setShowRescheduleConfirmation(false);
      setRescheduleData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reschedule appointment');
      showNotification('error', 'Error', 'Failed to reschedule appointment');
      console.error('Error rescheduling appointment:', err);
    } finally {
      setAppointmentLoading(false);
    }
  };

  // Handle reschedule cancel
  const handleRescheduleCancel = () => {
    setShowRescheduleConfirmation(false);
    setRescheduleData(null);
  };

  // Handle day click to switch to daily view
  const handleDayClick = (selectedDate: Date) => {
    setCurrentDate(selectedDate);
    setView('day');
  };

  return (
    <DashboardLayout>
      <div className="fade-in-element">
        {renderCalendarHeader()}

        {view === 'week' && (
          <WeeklyView
            currentDate={currentDate}
            appointments={appointments}
            handleMouseUp={handleMouseUp}
            handleMouseDown={handleMouseDown}
            handleMouseEnter={handleMouseEnter}
            onSelectSlot={(date, time) => { setSelectedTimeSlot({ date, time }); handleNewAppointmentClick(); }}
            onAppointmentClick={setSelectedAppointment}
            onAppointmentDrop={handleAppointmentDrop}
            isSlotSelected={isSlotSelected}
            getAppointmentDate={getAppointmentDate}
            formatAppointmentTime={formatAppointmentTime}
            getAppointmentDuration={getAppointmentDuration}
            getAppointmentBackgroundColor={getAppointmentBackgroundColor}
            getAppointmentTextColor={getAppointmentTextColor}
            onDayClick={handleDayClick} // Pass the handleDayClick function
          />
        )}
        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            appointments={appointments}
            onTimeSlotClick={(date, time) => { setSelectedTimeSlot({ date, time }); handleNewAppointmentClick(); }}
            onAppointmentClick={setSelectedAppointment}
            onAppointmentDrop={handleAppointmentDrop}
            getAppointmentDate={getAppointmentDate}
            formatAppointmentTime={formatAppointmentTime}
            getAppointmentDuration={getAppointmentDuration}
            getAppointmentBackgroundColor={getAppointmentBackgroundColor}
            getAppointmentTextColor={getAppointmentTextColor}
            getPatientName={getPatientName}
            handleMouseUp={handleMouseUp}
            handleMouseDown={handleMouseDown}
            handleMouseEnter={handleMouseEnter}
            isSlotSelected={isSlotSelected}
          />
        )}
        {view === 'month' && (
          <div className="card">
            <MonthView
              currentDate={currentDate}
              appointments={groupAppointmentsByDate()}
              onAppointmentClick={(appointmentId) => {
                const appointment = appointments.find(apt => apt.id === appointmentId);
                if (appointment) {
                  setSelectedAppointment(appointment);
                }
              }}
              onDayClick={(date) => {
                setCurrentDate(date);
                setView('day');
              }}
            />
          </div>
        )}

        {/* Appointment Detail Modal */}
        {selectedAppointment && selectedPatient && (
          <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center z-50 fade-in-element" onClick={() => setSelectedAppointment(null)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <AppointmentDetail
                appointment={selectedAppointment}
                patient={selectedPatient}
                onEdit={(appointmentData) => handleUpdateAppointment(selectedAppointment.id, appointmentData)}
                onCancel={() => handleCancelAppointment(selectedAppointment.id)}
                onUpdateStatus={(status) => handleUpdateAppointmentStatus(selectedAppointment.id, status)}
                onDelete={() => handleDeleteAppointment(selectedAppointment.id)}
                onClose={() => setSelectedAppointment(null)}
                isLoading={appointmentLoading}
              />
            </div>
          </div>
        )}

        {/* New Appointment Form Modal */}
        {showNewAppointmentForm && (
          <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center z-50 fade-in-element">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in relative">
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
                              {patients.map((patient) => (
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
                              {patients.length === 0 && searchQuery && (
                                <div className="text-center py-8 text-gray-500">
                                  No patients found matching "{searchQuery}"
                                </div>
                              )}
                              {patients.length === 0 && !searchQuery && (
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
                        onSubmit={handleAppointmentBookingComplete}
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

        {/* Reschedule Confirmation Modal */}
        {showRescheduleConfirmation && rescheduleData && (
          <RescheduleConfirmation
            appointment={rescheduleData.appointment}
            patient={rescheduleData.patient}
            newDate={rescheduleData.newDate}
            newStartTime={rescheduleData.newStartTime}
            newEndTime={rescheduleData.newEndTime}
            onConfirm={handleRescheduleConfirm}
            onCancel={handleRescheduleCancel}
            isLoading={appointmentLoading}
          />
        )}
      </div>
    </DashboardLayout>
  );
};
