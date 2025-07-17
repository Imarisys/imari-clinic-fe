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

  // Mock appointments for demo
  const mockAppointments = [
    { id: '1', patientName: 'John Doe', time: '09:00', duration: 60, type: 'Consultation', status: 'confirmed', date: new Date().toISOString().split('T')[0] },
    { id: '2', patientName: 'Sarah Wilson', time: '10:30', duration: 45, type: 'Follow-up', status: 'in-progress', date: new Date().toISOString().split('T')[0] },
    { id: '3', patientName: 'Mike Johnson', time: '14:00', duration: 30, type: 'Check-up', status: 'waiting', date: new Date().toISOString().split('T')[0] },
    { id: '4', patientName: 'Emily Davis', time: '15:30', duration: 90, type: 'Surgery', status: 'confirmed', date: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
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
                const dayAppointments = mockAppointments.filter(apt => apt.date === dayStr && apt.time === time);

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
                          height: `${Math.min(appointment.duration, 60)}px`
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAppointment(appointment as any);
                        }}
                      >
                        <p className="font-semibold truncate">{appointment.patientName}</p>
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

  const renderDayView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="card">
          <h3 className="text-xl font-bold text-neutral-800 mb-6">
            {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          <div className="space-y-2">
            {mockAppointments
              .filter(apt => apt.date === currentDate.toISOString().split('T')[0])
              .map((appointment, index) => (
                <div
                  key={appointment.id}
                  className={`bg-neutral-50 rounded-xl p-4 hover:scale-[1.01] transition-all duration-300 slide-up-element cursor-pointer border border-neutral-100`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => setSelectedAppointment(appointment as any)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center border border-primary-200">
                        <span className="text-primary-600 font-semibold text-sm">{appointment.time}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-neutral-800">{appointment.patientName}</p>
                      <p className="text-neutral-600 text-sm">{appointment.type} • {appointment.duration} min</p>
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

      {/* Quick stats sidebar */}
      <div className="space-y-6">
        <div className="card bg-primary-50 border-primary-200">
          <h4 className="font-semibold text-neutral-800 mb-4">Today's Overview</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-neutral-600">Total Appointments</span>
              <span className="font-semibold text-primary-600">8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Completed</span>
              <span className="font-semibold text-success-600">5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Remaining</span>
              <span className="font-semibold text-warning-600">3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
