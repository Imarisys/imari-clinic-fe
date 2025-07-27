import React, { useState } from 'react';
import { Appointment, AppointmentUpdate } from '../../types/Appointment';
import { Patient } from '../../types/Patient';

interface RescheduleConfirmationProps {
  appointment: Appointment;
  patient: Patient;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
  onConfirm: (appointmentData: AppointmentUpdate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const RescheduleConfirmation: React.FC<RescheduleConfirmationProps> = ({
  appointment,
  patient,
  newDate,
  newStartTime,
  newEndTime,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const [startTime, setStartTime] = useState(newStartTime);
  const [endTime, setEndTime] = useState(newEndTime);
  const [date, setDate] = useState(newDate);

  const handleConfirm = async () => {
    const updateData: AppointmentUpdate = {
      date: date,
      start_time: startTime,
      end_time: endTime,
    };

    await onConfirm(updateData);
  };

  const formatDisplayTime = (timeString: string) => {
    return timeString.split(':').slice(0, 2).join(':');
  };

  const formatDisplayDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const originalDate = appointment.date.split('T')[0];
  const originalStartTime = appointment.start_time.split('.')[0];
  const originalEndTime = appointment.end_time.split('.')[0];

  return (
    <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center z-50 fade-in-element">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Reschedule Appointment</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <span className="material-icons-round">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Patient Info */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {patient.first_name} {patient.last_name}
            </h3>
            <p className="text-sm text-gray-600">{appointment.type}</p>
          </div>

          {/* Time Changes */}
          <div className="space-y-4 mb-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={isLoading}
              />
              {originalDate !== date && (
                <p className="text-xs text-gray-500 mt-1">
                  Previously: {formatDisplayDate(originalDate)}
                </p>
              )}
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <input
                type="time"
                value={formatDisplayTime(startTime)}
                onChange={(e) => setStartTime(e.target.value + ':00')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={isLoading}
              />
              {originalStartTime !== startTime && (
                <p className="text-xs text-gray-500 mt-1">
                  Previously: {formatDisplayTime(originalStartTime)}
                </p>
              )}
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
              <input
                type="time"
                value={formatDisplayTime(endTime)}
                onChange={(e) => setEndTime(e.target.value + ':00')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={isLoading}
              />
              {originalEndTime !== endTime && (
                <p className="text-xs text-gray-500 mt-1">
                  Previously: {formatDisplayTime(originalEndTime)}
                </p>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-primary-50 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-primary-900 mb-2">Summary of Changes</h4>
            <div className="text-sm text-primary-800">
              <p>Moving appointment to:</p>
              <p className="font-medium">
                {formatDisplayDate(date)} at {formatDisplayTime(startTime)} - {formatDisplayTime(endTime)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </div>
              ) : (
                'Confirm Reschedule'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
