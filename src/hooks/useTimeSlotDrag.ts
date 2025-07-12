import { useState, useCallback, useRef } from 'react';

export interface TimeSlot {
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

interface AppointmentData {
  id: string;
  patientName: string;
  time: string;
  duration: number;
  type: string;
  status: string;
  title: string;
}

export const useTimeSlotDrag = (onSlotSelected: (slot: TimeSlot) => void, appointments: AppointmentData[] = []) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ date: string; timeIndex: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ date: string; timeIndex: number } | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const dragStartedRef = useRef(false);

  // Generate 15-minute time slots from 8 AM to 6 PM (40 slots total)
  const getTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let quarter = 0; quarter < 4; quarter++) {
        const minutes = quarter * 15;
        const time = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeSlots = getTimeSlots();

  const getTimeFromIndex = (index: number): string => {
    return timeSlots[index] || '08:00';
  };

  const getIndexFromPosition = (y: number, containerHeight: number): number => {
    const slotHeight = containerHeight / timeSlots.length;
    const index = Math.floor(y / slotHeight);
    return Math.max(0, Math.min(timeSlots.length - 1, index));
  };

  const handleMouseDown = useCallback((event: React.MouseEvent, date: string, containerRef: React.RefObject<HTMLDivElement | null>) => {
    if (!containerRef.current) return;
    
    event.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const timeIndex = getIndexFromPosition(y, rect.height);
    
    setIsDragging(true);
    setDragStart({ date, timeIndex });
    setDragEnd({ date, timeIndex });
    dragStartedRef.current = true;
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent, date: string, containerRef: React.RefObject<HTMLDivElement | null>) => {
    if (!isDragging || !dragStart || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const timeIndex = getIndexFromPosition(y, rect.height);
    
    // Only allow dragging within the same date for now
    if (date === dragStart.date) {
      setDragEnd({ date, timeIndex });
    }
  }, [isDragging, dragStart]);

  // Check if a time slot conflicts with existing appointments
  const checkSlotConflict = (date: string, startTime: string, endTime: string): boolean => {
    return appointments.some(appointment => {
      // Parse appointment time
      const [aptHours, aptMinutes] = appointment.time.split(':').map(Number);
      const aptStartMinutes = aptHours * 60 + aptMinutes;
      const aptEndMinutes = aptStartMinutes + appointment.duration;

      // Parse selected time slot
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      const slotStartMinutes = startHours * 60 + startMinutes;
      const slotEndMinutes = endHours * 60 + endMinutes;

      // Check for overlap
      return slotStartMinutes < aptEndMinutes && slotEndMinutes > aptStartMinutes;
    });
  };

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !dragStart || !dragEnd || !dragStartedRef.current) {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      dragStartedRef.current = false;
      return;
    }

    const startIndex = Math.min(dragStart.timeIndex, dragEnd.timeIndex);
    const endIndex = Math.max(dragStart.timeIndex, dragEnd.timeIndex);
    
    const startTime = getTimeFromIndex(startIndex);
    const endTime = getTimeFromIndex(endIndex + 1); // End time is the start of the next slot
    
    // Check for conflicts with existing appointments
    const hasConflict = checkSlotConflict(dragStart.date, startTime, endTime);

    if (hasConflict) {
      setConflictMessage('This time slot conflicts with an existing appointment. Please select a different time.');
      // Clear the message after 3 seconds
      setTimeout(() => setConflictMessage(null), 3000);
    } else {
      setConflictMessage(null);
      const slot: TimeSlot = {
        date: dragStart.date,
        startTime,
        endTime
      };
      onSlotSelected(slot);
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    dragStartedRef.current = false;
  }, [isDragging, dragStart, dragEnd, onSlotSelected, appointments]);

  const getSelectionStyle = (date: string, timeIndex: number) => {
    if (!isDragging || !dragStart || !dragEnd || dragStart.date !== date) {
      return {};
    }

    const startIndex = Math.min(dragStart.timeIndex, dragEnd.timeIndex);
    const endIndex = Math.max(dragStart.timeIndex, dragEnd.timeIndex);

    if (timeIndex >= startIndex && timeIndex <= endIndex) {
      return {
        backgroundColor: 'rgba(59, 130, 246, 0.3)', // Blue with opacity
        borderTop: timeIndex === startIndex ? '2px solid #3b82f6' : undefined,
        borderBottom: timeIndex === endIndex ? '2px solid #3b82f6' : undefined,
      };
    }

    return {};
  };

  const reset = () => {
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    dragStartedRef.current = false;
  };

  return {
    isDragging,
    timeSlots,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    getSelectionStyle,
    conflictMessage,
    reset
  };
};
