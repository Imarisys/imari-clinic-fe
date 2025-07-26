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
  getAppointmentDate: (apt: Appointment) => string;
  formatAppointmentTime: (apt: Appointment) => string;
  getAppointmentDuration: (apt: Appointment) => number;
  getAppointmentBackgroundColor: (status: AppointmentStatus) => string;
  getAppointmentTextColor: (status: AppointmentStatus) => string;
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({
  currentDate,
  appointments,
  handleMouseUp,
  handleMouseDown,
  handleMouseEnter,
  onSelectSlot,
  isSlotSelected,
  getAppointmentDate,
  formatAppointmentTime,
  getAppointmentDuration,
  getAppointmentBackgroundColor,
  getAppointmentTextColor,
}) => {
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  const timeSlots = Array.from({ length: 40 }, (_, i) => {
    const hour = Math.floor(i / 4) + 8;
    const minutes = (i % 4) * 15;
    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });

  return (
    <div className="card overflow-hidden">
      {/* Week header */}
      <div className="grid grid-cols-8 border-b border-gray-300">
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
            <p className="text-sm text-neutral-500">
              {day.toLocaleDateString('en-US', { weekday: 'short' })}
            </p>
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

      {/* Time slots grid - 15 minute precision */}
      <div
        className="max-h-96 overflow-y-auto"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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

              let borderBottomClass;
              if (timeIndex % 4 === 3) {
                borderBottomClass = 'border-b border-gray-300';
              } else if (timeIndex % 2 === 1) {
                borderBottomClass = 'border-b border-gray-200';
              } else {
                borderBottomClass = 'border-b border-gray-100';
              }

              return (
                <div
                  key={`${dayStr}-${time}`}
                  className={`p-1 min-h-[15px] relative group cursor-pointer border-r border-gray-200 ${borderBottomClass} ${isSelected ? 'bg-blue-200 border-blue-400' : ''}`}
                  style={{
                    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.3)' : '',
                    borderColor: isSelected ? '#3b82f6' : ''
                  }}
                  onClick={() => onSelectSlot(dayStr, time)}
                  onMouseDown={(e) => handleMouseDown(e, dayStr, time)}
                  onMouseEnter={() => handleMouseEnter(dayStr, time)}
                >
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
                    >
                      {appointment.patient_first_name} {appointment.patient_last_name}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
