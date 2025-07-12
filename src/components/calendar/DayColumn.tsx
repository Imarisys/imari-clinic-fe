import React, { useRef } from 'react';
import { useTimeSlotDrag, TimeSlot } from '../../hooks/useTimeSlotDrag';
import { CurrentTimeLine } from './CurrentTimeLine';

interface AppointmentData {
  id: string;
  patientName: string;
  time: string;
  duration: number;
  type: string;
  status: string;
  title: string;
}

interface DayColumnProps {
  date: Date;
  appointments?: AppointmentData[];
  onAppointmentClick?: (appointmentId: string) => void;
  onTimeSlotSelected?: (slot: TimeSlot) => void;
}

export const DayColumn: React.FC<DayColumnProps> = ({ date, appointments = [], onAppointmentClick, onTimeSlotSelected }) => {
  const isToday = new Date().toDateString() === date.toDateString();
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
    return Math.max(0, (totalMinutes / (10 * 60)) * 100); // 10 hours total (8 AM to 6 PM)
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

  const getAppointmentHeight = (duration: number): number => {
    // Calculate height as percentage of total container height to fit within bounds
    const heightPercentage = (duration / (10 * 60)) * 100; // 10 hours = 600 minutes
    return Math.max(3, Math.min(heightPercentage, 15)); // Min 3%, max 15% of container
  };

  return (
    <div
      className={`absolute inset-0 ${isToday ? 'bg-blue-50/30' : ''}`}
      ref={containerRef}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Conflict Message */}
      {conflictMessage && (
        <div className="absolute top-2 left-1 right-1 z-30 bg-red-500 text-white px-2 py-1 rounded text-xs shadow-lg">
          <div className="flex items-center space-x-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="font-medium">Slot taken</span>
          </div>
        </div>
      )}

      {/* 15-minute time grid for dragging */}
      <div className="absolute inset-0">
        {timeSlots.map((time, index) => (
          <div
            key={`${time}-${index}`}
            className="h-[15px] border-b border-gray-50 hover:bg-blue-100/50 cursor-pointer relative"
            style={getSelectionStyle(dateString, index)}
            onMouseDown={(e) => handleMouseDown(e, dateString, containerRef)}
            onMouseMove={(e) => handleMouseMove(e, dateString, containerRef)}
          />
        ))}
      </div>

      {/* Appointments */}
      <div className="absolute inset-0 pointer-events-none">
        {appointments.map((appointment) => {
          const statusColors = getStatusColor(appointment.status);
          return (
            <div
              key={appointment.id}
              className={`absolute w-[calc(100%-8px)] left-1 px-2 py-1.5 ${statusColors.bg} 
                ${statusColors.text} text-xs rounded border ${statusColors.border} cursor-pointer 
                transition-colors shadow-sm hover:shadow-md z-10 flex items-center justify-between pointer-events-auto`}
              style={{
                top: `${getTimePosition(appointment.time)}%`,
                height: `${getAppointmentHeight(appointment.duration)}%`,
              }}
              onClick={() => onAppointmentClick && onAppointmentClick(appointment.id)}
            >
              <div className="flex-1 truncate text-left">
                <span className="font-medium">{appointment.title}</span>
                <span className="mx-1 opacity-75">•</span>
                <span className="opacity-90">{appointment.patientName}</span>
              </div>
              <div className="opacity-60 ml-1 flex-shrink-0">
                {formatTimeDisplay(appointment.time)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Drag selection overlay */}
      {isDragging && (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute inset-x-1 bg-blue-500/20 border-2 border-blue-500 border-dashed rounded" />
        </div>
      )}

      {/* Current Time Line - only show for today */}
      {isToday && (
        <CurrentTimeLine startHour={8} endHour={18} />
      )}
    </div>
  );
};
