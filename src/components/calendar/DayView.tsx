import React from 'react';
import { Appointment, AppointmentStatus } from '../../types/Appointment';

interface DayViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onTimeSlotClick: (date: string, time: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  onAppointmentDrop?: (appointment: Appointment, newDate: string, newTime: string) => void;
  getAppointmentDate: (apt: Appointment) => string;
  formatAppointmentTime: (apt: Appointment) => string;
  getAppointmentDuration: (apt: Appointment) => number;
  getAppointmentBackgroundColor: (status: AppointmentStatus) => string;
  getAppointmentTextColor: (status: AppointmentStatus) => string;
  getPatientName: (apt: Appointment) => string;
  // Add drag and drop props similar to WeeklyView
  handleMouseUp: () => void;
  handleMouseDown: (e: React.MouseEvent, date: string, time: string) => void;
  handleMouseEnter: (date: string, time: string) => void;
  isSlotSelected: (date: string, time: string) => boolean;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  appointments,
  onTimeSlotClick,
  onAppointmentClick,
  onAppointmentDrop,
  getAppointmentDate,
  formatAppointmentTime,
  getAppointmentDuration,
  getAppointmentBackgroundColor,
  getAppointmentTextColor,
  getPatientName,
  handleMouseUp,
  handleMouseDown,
  handleMouseEnter,
  isSlotSelected,
}) => {
  const [draggedAppointment, setDraggedAppointment] = React.useState<Appointment | null>(null);
  const [dragPreviewPosition, setDragPreviewPosition] = React.useState<{date: string, time: string} | null>(null);

  // Handle appointment drag start
  const handleAppointmentDragStart = (e: React.DragEvent, appointment: Appointment) => {
    e.stopPropagation();
    setDraggedAppointment(appointment);
    e.dataTransfer.setData('text/plain', appointment.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle appointment drag end
  const handleAppointmentDragEnd = () => {
    setDraggedAppointment(null);
    setDragPreviewPosition(null);
  };

  // Handle drop on time slot
  const handleTimeSlotDrop = (e: React.DragEvent, date: string, time: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedAppointment && onAppointmentDrop) {
      onAppointmentDrop(draggedAppointment, date, time);
    }
    setDraggedAppointment(null);
    setDragPreviewPosition(null);
  };

  // Handle drag over to allow drop and show preview
  const handleTimeSlotDragOver = (e: React.DragEvent, date: string, time: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedAppointment) {
      setDragPreviewPosition({ date, time });
    }
  };

  // Handle drag leave to hide preview when leaving time slot
  const handleTimeSlotDragLeave = (e: React.DragEvent) => {
    // Only hide preview if we're actually leaving the time slot area
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX, clientY } = e;

    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      setDragPreviewPosition(null);
    }
  };

  // Create 15-minute time slots from 8 AM to 6 PM (40 slots total)
  const timeSlots = Array.from({ length: 40 }, (_, i) => {
    const hour = Math.floor(i / 4) + 8;
    const minutes = (i % 4) * 15;
    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });

  const dayStr = currentDate.toISOString().split('T')[0];

  return (
    <div className="card overflow-hidden">
      {/* Day header - similar to week header but for a single day */}
      <div className="grid grid-cols-[80px_1fr] border-b border-gray-300">
        <div className="p-2"></div>
        <div
          className={`p-4 text-center slide-up-element ${
            currentDate.toDateString() === new Date().toDateString()
              ? 'bg-primary-50 border-primary-200'
              : 'bg-neutral-50'
          }`}
          style={{ animationDelay: '0.05s' }}
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

      {/* Time slots grid - 15 minute precision with drag and drop */}
      <div
        className="flex-1 overflow-y-auto"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ height: 'calc(100vh - 280px)' }}
      >
        {timeSlots.map((time, timeIndex) => {
          const isSelected = isSlotSelected(dayStr, time);
          const dayAppointments = appointments.filter(apt => {
            const aptDate = getAppointmentDate(apt);
            const aptTime = formatAppointmentTime(apt);
            const aptHour = parseInt(aptTime.split(':')[0]);
            const aptMinute = parseInt(aptTime.split(':')[1]);
            const timeHour = parseInt(time.split(':')[0]);
            const timeMinute = parseInt(time.split(':')[1]);

            return aptDate === dayStr &&
              aptHour === timeHour &&
              aptMinute >= timeMinute &&
              aptMinute < timeMinute + 15;
          });

          // Define border classes for visual hierarchy
          let borderBottomClass;
          if (timeIndex % 4 === 3) {
            borderBottomClass = 'border-b border-gray-300'; // Hour boundaries
          } else if (timeIndex % 2 === 1) {
            borderBottomClass = 'border-b border-gray-200'; // 30-minute boundaries
          } else {
            borderBottomClass = 'border-b border-gray-100'; // 15-minute boundaries
          }

          return (
            <div
              key={time}
              className="grid grid-cols-[80px_1fr] hover:bg-primary-50 transition-all duration-300 slide-up-element"
              style={{ animationDelay: `${timeIndex * 0.02}s` }}
            >
              {/* Time label column - show hour labels in the middle of each hour block */}
              <div className="p-2 text-right text-sm text-neutral-500 bg-neutral-50 border-r border-gray-300 relative">
                {timeIndex % 4 === 1 ? ( // Show in the second slot (middle of the hour)
                  <span className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    {time.split(':')[0]}:00
                  </span>
                ) : null}
              </div>

              {/* Time slot column with drag and drop */}
              <div
                className={`p-1 min-h-[15px] relative group cursor-pointer ${borderBottomClass} ${isSelected ? 'bg-blue-200 border-blue-400' : ''}`}
                style={{
                  backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.3)' : '',
                  borderColor: isSelected ? '#3b82f6' : ''
                }}
                onClick={() => onTimeSlotClick(dayStr, time)}
                onMouseDown={(e) => handleMouseDown(e, dayStr, time)}
                onMouseEnter={() => handleMouseEnter(dayStr, time)}
                onDragOver={(e) => handleTimeSlotDragOver(e, dayStr, time)}
                onDrop={(e) => handleTimeSlotDrop(e, dayStr, time)}
                onDragLeave={handleTimeSlotDragLeave}
              >
                {/* Appointments in this time slot */}
                {dayAppointments.map((appointment, aptIndex) => (
                  <div
                    key={appointment.id}
                    className="absolute inset-x-1 rounded-lg p-1 text-xs shadow-medium hover:opacity-80 transition-opacity cursor-pointer z-10"
                    style={{
                      top: `${aptIndex * 2}px`,
                      height: `${Math.max(Math.min(getAppointmentDuration(appointment) / 15 * 15, 60), 15)}px`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      backgroundColor: getAppointmentBackgroundColor(appointment.status),
                      color: getAppointmentTextColor(appointment.status)
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentClick(appointment);
                    }}
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    draggable
                    onDragStart={(e) => handleAppointmentDragStart(e, appointment)}
                    onDragEnd={handleAppointmentDragEnd}
                  >
                    <p className="font-semibold truncate">{getPatientName(appointment)}</p>
                    <p className="opacity-90 truncate">{appointment.type}</p>
                  </div>
                ))}

                {/* Drag preview shadow - shows where appointment will be dropped */}
                {draggedAppointment && dragPreviewPosition &&
                 dragPreviewPosition.date === dayStr && dragPreviewPosition.time === time && (
                  <div
                    className="absolute inset-x-1 rounded-lg p-1 text-xs shadow-lg border-2 border-dashed border-primary-400 bg-primary-100/50 pointer-events-none z-20"
                    style={{
                      top: '1px',
                      height: `${Math.max(Math.min(getAppointmentDuration(draggedAppointment) / 15 * 15, 60), 15)}px`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      backdropFilter: 'blur(1px)',
                    }}
                  >
                    <div className="text-primary-700 font-medium opacity-75">
                      {getPatientName(draggedAppointment)}
                    </div>
                    <div className="text-primary-600 text-xs opacity-60">
                      Moving...
                    </div>
                  </div>
                )}

                {/* Hover effect */}
                <div className="absolute inset-0 bg-primary-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
