import React, { useState, useEffect } from 'react';

interface CurrentTimeLineProps {
  startHour?: number; // Default 8 AM
  endHour?: number;   // Default 6 PM
  className?: string;
}

export const CurrentTimeLine: React.FC<CurrentTimeLineProps> = ({
  startHour = 8,
  endHour = 18,
  className = ''
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const getCurrentTimePosition = (): number => {
    const now = currentTime;
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    // Only show line during business hours
    if (currentHour < startHour || currentHour >= endHour) {
      return -1; // Hide the line
    }

    const totalMinutes = (currentHour - startHour) * 60 + currentMinutes;
    const totalBusinessMinutes = (endHour - startHour) * 60;
    return (totalMinutes / totalBusinessMinutes) * 100;
  };

  const formatCurrentTime = (): string => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const position = getCurrentTimePosition();

  // Don't render if outside business hours
  if (position < 0) return null;

  return (
    <div
      className={`absolute left-0 right-0 z-20 pointer-events-none ${className}`}
      style={{ top: `${position}%` }}
    >
      {/* Time indicator circle */}
      <div className="absolute -left-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>

      {/* Current time line */}
      <div className="w-full h-0.5 bg-red-500 shadow-sm"></div>

      {/* Time label */}
      <div className="absolute -left-16 -top-2 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-md font-medium">
        {formatCurrentTime()}
      </div>
    </div>
  );
};
