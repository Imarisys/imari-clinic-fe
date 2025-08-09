import React from 'react';
import { Appointment, AppointmentStatus } from '../../types/Appointment';
import { useTranslation } from '../../context/TranslationContext';

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
  workingHours?: {
    startTime: string;
    endTime: string;
  };
  workingDays?: string[];
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
  workingHours = { startTime: '08:00', endTime: '17:00' },
  workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
}) => {
  const { t } = useTranslation();
  const [draggedAppointment, setDraggedAppointment] = React.useState<Appointment | null>(null);
  const [dragPreviewPosition, setDragPreviewPosition] = React.useState<{date: string, time: string} | null>(null);

  // Check if current date is a working day
  const isWorkingDay = (): boolean => {
    // Get the English day name to compare with settings
    const englishDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const englishDayName = englishDayNames[currentDate.getDay()];
    return workingDays.includes(englishDayName);
  };

  // Helper function to get translated day name
  const getDayName = (): string => {
    const dayNames = [t('sunday'), t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday')];
    return dayNames[currentDate.getDay()];
  };

  // Helper function to get translated short day name
  const getShortDayName = (): string => {
    const shortDayNames = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];
    return shortDayNames[currentDate.getDay()];
  };

  const isWorking = isWorkingDay();

  // Generate time slots based on working hours
  const generateTimeSlots = () => {
    const startHour = parseInt(workingHours.startTime.split(':')[0]);
    const endHour = parseInt(workingHours.endTime.split(':')[0]);
    const totalHours = endHour - startHour;
    const slotsPerHour = 4; // 15-minute intervals
    const totalSlots = totalHours * slotsPerHour;

    return Array.from({ length: totalSlots }, (_, i) => {
      const hour = Math.floor(i / slotsPerHour) + startHour;
      const minutes = (i % slotsPerHour) * 15;
      return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    });
  };

  const timeSlots = generateTimeSlots();

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

  const dayStr = currentDate.toISOString().split('T')[0];

  return (
    <div className="card overflow-hidden">
      {/* Day header - similar to week header but for a single day */}
      <div className="grid grid-cols-[80px_1fr] border-b border-gray-300">
        <div className="p-2"></div>
        <div
          className={`p-4 text-center slide-up-element ${
            currentDate.toDateString() === new Date().toDateString()
              ? isWorking
                ? 'bg-primary-50 border-primary-200'
                : 'bg-red-200'
              : isWorking
              ? 'bg-neutral-50'
              : 'bg-red-50'
          }`}
          style={{ animationDelay: '0.05s' }}
        >
          <p className={`text-sm ${
            currentDate.toDateString() === new Date().toDateString()
              ? isWorking 
                ? 'text-neutral-500'
                : 'text-red-600'
              : isWorking 
              ? 'text-neutral-500' 
              : 'text-red-400'
          }`}>
            {getShortDayName()}
          </p>
          <p className={`text-lg font-semibold ${
            currentDate.toDateString() === new Date().toDateString()
              ? isWorking
                ? 'text-primary-600'
                : 'text-red-700'
              : isWorking
              ? 'text-neutral-800'
              : 'text-red-600'
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

            // Only show appointment in its starting time slot
            return aptDate === dayStr &&
              aptHour === timeHour &&
              aptMinute === timeMinute;
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

          // Apply red hue to non-working days
          const baseBackground = isWorking ? '' : 'bg-red-50/30';
          const hoverBackground = isWorking ? 'hover:bg-primary-50' : 'hover:bg-red-100/50';

          return (
            <div
              key={time}
              className={`grid grid-cols-[80px_1fr] transition-all duration-300 slide-up-element ${hoverBackground}`}
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
                className={`p-1 min-h-[15px] relative group cursor-pointer ${borderBottomClass} ${baseBackground} ${isSelected ? 'bg-blue-200 border-blue-400' : ''}`}
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
                      height: `${getAppointmentDuration(appointment)}px`,
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
                      height: `${getAppointmentDuration(draggedAppointment)}px`,
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
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg ${
                  isWorking ? 'bg-primary-100/30' : 'bg-red-100/30'
                }`}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
