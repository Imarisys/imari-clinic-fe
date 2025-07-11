import React, { useRef } from 'react';
import { useTimeSlotDrag, TimeSlot } from '../../hooks/useTimeSlotDrag';

interface AppointmentData {
  id: string;
  patientName: string;
  time: string;
  duration: number;
  type: string;
  status: string;
  title: string;
}

interface DayViewProps {
  date: Date;
  appointments: AppointmentData[];
  onAppointmentClick?: (appointmentId: string) => void;
  onTimeSlotSelected?: (slot: TimeSlot) => void;
}

export const DayView = ({ date, appointments, onAppointmentClick, onTimeSlotSelected }: DayViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dateString = date.toISOString().split('T')[0];

  const {
    isDragging,
    timeSlots,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    getSelectionStyle,
    conflictMessage
  } = useTimeSlotDrag(onTimeSlotSelected || (() => {}), appointments);

  const getTimePosition = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    const startHour = 8; // 8 AM
    const totalMinutes = (hours - startHour) * 60 + minutes;
    return Math.max(0, Math.min(100, (totalMinutes / (10 * 60)) * 100)); // 10 hours total (8 AM to 6 PM)
  };

  const getAppointmentHeight = (duration: number): number => {
    // Calculate height as percentage of total container height
    const heightPercentage = (duration / (10 * 60)) * 100; // 10 hours = 600 minutes
    return Math.max(4, Math.min(heightPercentage, 20)); // Min 4%, max 20% of container
  };

  const formatTimeDisplay = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Booked':
        return {
          bg: 'bg-blue-100 hover:bg-blue-200',
          text: 'text-blue-800',
          border: 'border-blue-200'
        };
      case 'Completed':
        return {
          bg: 'bg-green-100 hover:bg-green-200',
          text: 'text-green-800',
          border: 'border-green-200'
        };
      case 'Cancelled':
        return {
          bg: 'bg-red-100 hover:bg-red-200',
          text: 'text-red-800',
          border: 'border-red-200'
        };
      case 'No Show':
        return {
          bg: 'bg-orange-100 hover:bg-orange-200',
          text: 'text-orange-800',
          border: 'border-orange-200'
        };
      default:
        return {
          bg: 'bg-gray-100 hover:bg-gray-200',
          text: 'text-gray-800',
          border: 'border-gray-200'
        };
    }
  };

  return (
    <div className="w-full h-[600px] overflow-hidden">
      {/* Conflict Message */}
      {conflictMessage && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm font-medium">{conflictMessage}</span>
          </div>
        </div>
      )}

      <div className="relative w-full h-full border rounded-lg bg-white flex">
        {/* Time slots */}
        <div className="w-20 flex-shrink-0 border-r">
          {timeSlots.filter((_, index) => index % 4 === 0).map((time) => (
            <div
              key={time}
              className="h-[60px] border-b px-2 py-1 text-xs text-gray-500 text-right flex items-start"
            >
              {formatTimeDisplay(time)}
            </div>
          ))}
        </div>

        {/* Appointments area */}
        <div
          className="flex-1 relative overflow-hidden select-none"
          ref={containerRef}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* 15-minute grid lines and drag zones */}
          <div className="absolute inset-0">
            {timeSlots.map((time, index) => (
              <div
                key={`${time}-${index}`}
                className="h-[15px] border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer relative"
                style={getSelectionStyle(dateString, index)}
                onMouseDown={(e) => handleMouseDown(e, dateString, containerRef)}
                onMouseMove={(e) => handleMouseMove(e, dateString, containerRef)}
              >
                {/* Show time labels for quarter hours */}
                {index % 4 !== 0 && (
                  <div className="absolute left-1 top-0 text-xs text-gray-400 pointer-events-none">
                    {time}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Appointments */}
          <div className="absolute inset-0 pointer-events-none">
            {appointments.map((appointment) => {
              const statusColors = getStatusColor(appointment.status);
              return (
                <div
                  key={appointment.id}
                  className={`absolute left-1 right-1 ${statusColors.bg} ${statusColors.text}
                    rounded-lg border ${statusColors.border} p-2 cursor-pointer
                    transition-colors shadow-sm hover:shadow-md overflow-hidden
                    flex items-center justify-between pointer-events-auto z-10`}
                  style={{
                    top: `${getTimePosition(appointment.time)}%`,
                    height: `${getAppointmentHeight(appointment.duration)}%`,
                  }}
                  onClick={() => onAppointmentClick?.(appointment.id)}
                >
                  <div className="flex-1 truncate text-left">
                    <span className="font-medium text-sm">{appointment.title}</span>
                    <span className="mx-2 opacity-75">•</span>
                    <span className="text-xs opacity-90">{appointment.patientName}</span>
                    <span className="mx-2 opacity-60">•</span>
                    <span className="text-xs opacity-75">{appointment.type}</span>
                  </div>
                  <div className="text-xs opacity-60 ml-2 flex-shrink-0">
                    {formatTimeDisplay(appointment.time)} • <span className="font-bold">{appointment.status}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drag selection overlay */}
          {isDragging && (
            <div className="absolute inset-0 pointer-events-none z-20">
              <div className="absolute inset-x-1 bg-blue-500/20 border-2 border-blue-500 border-dashed rounded"
                   style={{
                     top: '0px',
                     height: '100%'
                   }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
