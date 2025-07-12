interface AppointmentData {
  id: string;
  patientName: string;
  time: string;
  duration: number;
  type: string;
  status: string;
  title: string;
}

interface MonthViewProps {
  currentDate: Date;
  appointments: Record<string, AppointmentData[]>;
  onAppointmentClick?: (appointmentId: string) => void;
}

export const MonthView = ({ currentDate, appointments, onAppointmentClick }: MonthViewProps) => {
  const getMonthDays = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);

    // Get the first day to display (might be from previous month)
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    const days: Date[] = [];
    const currentDay = new Date(startDate);

    // Generate 6 weeks of dates
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  const getAppointmentsForDate = (date: string): AppointmentData[] => {
    return appointments[date] || [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Booked':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800'
        };
      case 'Completed':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800'
        };
      case 'Cancelled':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800'
        };
      case 'No Show':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-800'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800'
        };
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthDays = getMonthDays(currentDate);

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {weekDays.map(day => (
          <div key={day} className="bg-white p-2 text-sm font-medium text-gray-600 text-center">
            {day}
          </div>
        ))}

        {monthDays.map((date, index) => {
          const dateString = date.toISOString().split('T')[0];
          const dayAppointments = getAppointmentsForDate(dateString);

          return (
            <div
              key={index}
              className={`bg-white min-h-[120px] p-2 border-t relative ${
                isCurrentMonth(date) ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <div className={`text-sm ${
                isToday(date)
                  ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                  : isCurrentMonth(date)
                    ? 'text-gray-900'
                    : 'text-gray-400'
              }`}>
                {date.getDate()}
              </div>

              <div className="mt-1 space-y-1">
                {dayAppointments.slice(0, 3).map((apt) => {
                  const statusColors = getStatusColor(apt.status);
                  return (
                    <div
                      key={apt.id}
                      className={`text-xs ${statusColors.bg} ${statusColors.text} p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity`}
                      onClick={() => onAppointmentClick && onAppointmentClick(apt.id)}
                    >
                      <div className="font-medium">{apt.time}</div>
                      <div className="truncate">{apt.patientName}</div>
                    </div>
                  );
                })}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-gray-500 pl-1">
                    +{dayAppointments.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
