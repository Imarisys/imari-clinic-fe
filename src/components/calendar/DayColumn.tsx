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
}

export const DayColumn: React.FC<DayColumnProps> = ({ date, appointments = [], onAppointmentClick }) => {
  const isToday = new Date().toDateString() === date.toDateString();

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
    <div className={`absolute inset-0 ${isToday ? 'bg-blue-50/30' : ''}`}>
      {appointments.map((appointment) => {
        const statusColors = getStatusColor(appointment.status);
        return (
          <div
            key={appointment.id}
            className={`absolute w-[calc(100%-8px)] left-1 px-2 py-1.5 ${statusColors.bg} 
              ${statusColors.text} text-xs rounded border ${statusColors.border} cursor-pointer 
              transition-colors shadow-sm hover:shadow-md z-10 flex items-center justify-between`}
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
  );
};
