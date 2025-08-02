import React from 'react';
import { Appointment, AppointmentStatus } from '../../types/Appointment';

interface WeeklyViewProps {
  isSlotSelected: (date: string, time: string) => boolean;
  currentDate: Date;
  appointments: Appointment[];
  handleMouseUp: () => void;
  handleMouseDown: (e: React.MouseEvent, date: string, time: string) => void;
  handleMouseEnter: (date: string, time: string) => void;
  onSelectSlot: (date: string, time: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  onAppointmentDrop?: (appointment: Appointment, newDate: string, newTime: string) => void;
  onDayClick?: (date: Date) => void;
  getAppointmentDate: (apt: Appointment) => string;
  formatAppointmentTime: (apt: Appointment) => string;
  getAppointmentDuration: (apt: Appointment) => number;
  getAppointmentBackgroundColor: (status: AppointmentStatus) => string;
  getAppointmentTextColor: (status: AppointmentStatus) => string;
  workingHours?: {
    startTime: string;
    endTime: string;
  };
  workingDays?: string[];
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({
  currentDate,
  appointments,
  handleMouseUp,
  handleMouseDown,
  handleMouseEnter,
  onSelectSlot,
  onAppointmentClick,
  isSlotSelected,
  getAppointmentDate,
  formatAppointmentTime,
  getAppointmentDuration,
  getAppointmentBackgroundColor,
  getAppointmentTextColor,
  onAppointmentDrop,
  onDayClick,
  workingHours = { startTime: '08:00', endTime: '17:00' },
  workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
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

  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  // Check if a day is a working day
  const isWorkingDay = (date: Date): boolean => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return workingDays.includes(dayName);
  };

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

  return (
    <div className="card overflow-hidden">
      {/* Week header */}
      <div className="grid grid-cols-8 border-b border-gray-300">
        <div className="p-4"></div>
        {days.map((day, index) => {
          const isWorking = isWorkingDay(day);
          const isToday = day.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={index}
              className={`p-4 text-center slide-up-element cursor-pointer transition-colors duration-200 ${
                isToday
                  ? isWorking 
                    ? 'bg-primary-50 border-primary-200'
                    : 'bg-red-200 hover:bg-red-250'
                  : isWorking
                  ? 'bg-neutral-50 hover:bg-primary-50'
                  : 'bg-red-50 hover:bg-red-100'
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => onDayClick && onDayClick(day)}
            >
              <p className={`text-sm ${
                isToday
                  ? isWorking 
                    ? 'text-neutral-500'
                    : 'text-red-600'
                  : isWorking 
                  ? 'text-neutral-500' 
                  : 'text-red-400'
              }`}>
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </p>
              <p className={`text-lg font-semibold ${
                isToday
                  ? isWorking
                    ? 'text-primary-600'
                    : 'text-red-700'
                  : isWorking
                  ? 'text-neutral-800'
                  : 'text-red-600'
              }`}>
                {day.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Time slots grid - 15 minute precision */}
      <div
        className="flex-1 overflow-y-auto"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ height: 'calc(100vh - 280px)' }}
      >
        {timeSlots.map((time, timeIndex) => (
          <div key={time} className="grid grid-cols-8 hover:bg-primary-50 transition-all duration-300">
            <div className="p-2 text-right text-sm text-neutral-500 bg-neutral-50 border-r border-gray-300 relative">
              {timeIndex % 4 === 1 ? ( // Show in the second slot (middle of the hour)
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  {time.split(':')[0]}:00
                </span>
              ) : null}
            </div>
            {days.map((day) => {
              const dayStr = day.toISOString().split('T')[0];
              const isSelected = isSlotSelected(dayStr, time);
              const isWorking = isWorkingDay(day);
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

              let borderBottomClass;
              if (timeIndex % 4 === 3) {
                borderBottomClass = 'border-b border-gray-300';
              } else if (timeIndex % 2 === 1) {
                borderBottomClass = 'border-b border-gray-200';
              } else {
                borderBottomClass = 'border-b border-gray-100';
              }

              // Apply red hue to non-working days
              const baseBackground = isWorking ? '' : 'bg-red-50/30';
              const hoverBackground = isWorking ? 'hover:bg-primary-50' : 'hover:bg-red-100/50';

              return (
                <div
                  key={`${dayStr}-${time}`}
                  className={`p-1 min-h-[15px] relative group cursor-pointer border-r border-gray-200 ${borderBottomClass} ${baseBackground} ${hoverBackground} ${isSelected ? 'bg-blue-200 border-blue-400' : ''}`}
                  style={{
                    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.3)' : '',
                    borderColor: isSelected ? '#3b82f6' : ''
                  }}
                  onClick={() => onSelectSlot(dayStr, time)}
                  onMouseDown={(e) => handleMouseDown(e, dayStr, time)}
                  onMouseEnter={() => handleMouseEnter(dayStr, time)}
                  onDragOver={(e) => handleTimeSlotDragOver(e, dayStr, time)}
                  onDrop={(e) => handleTimeSlotDrop(e, dayStr, time)}
                  onDragLeave={handleTimeSlotDragLeave}
                >
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
                      {appointment.patient_first_name} {appointment.patient_last_name}
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
                        {draggedAppointment.patient_first_name} {draggedAppointment.patient_last_name}
                      </div>
                      <div className="text-primary-600 text-xs opacity-60">
                        Moving...
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
