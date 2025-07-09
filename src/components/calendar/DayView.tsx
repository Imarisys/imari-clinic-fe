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
}

export const DayView = ({ appointments, onAppointmentClick }: DayViewProps) => {
  const timeSlots = Array.from({ length: 10 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

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
      <div className="relative w-full h-full border rounded-lg bg-white flex">
        {/* Time slots */}
        <div className="w-20 flex-shrink-0 border-r">
          {timeSlots.map((time) => (
            <div
              key={time}
              className="h-[60px] border-b px-2 py-1 text-xs text-gray-500 text-right flex items-start"
            >
              {formatTimeDisplay(time)}
            </div>
          ))}
        </div>

        {/* Appointments area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Time grid lines */}
          <div className="absolute inset-0">
            {timeSlots.map((time) => (
              <div
                key={time}
                className="h-[60px] border-b border-gray-100"
              />
            ))}
          </div>

          {/* Appointments */}
          <div className="absolute inset-0">
            {appointments.map((appointment) => {
              const statusColors = getStatusColor(appointment.status);
              return (
                <div
                  key={appointment.id}
                  className={`absolute left-1 right-1 ${statusColors.bg} ${statusColors.text}
                    rounded-lg border ${statusColors.border} p-2 cursor-pointer
                    transition-colors shadow-sm hover:shadow-md overflow-hidden
                    flex items-center justify-between`}
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
        </div>
      </div>
    </div>
  );
};
