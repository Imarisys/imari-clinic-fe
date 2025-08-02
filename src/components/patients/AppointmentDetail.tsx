import React, { useState, useEffect } from 'react';
import { Appointment, AppointmentUpdate, AppointmentType, AppointmentStatus } from '../../types/Appointment';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Patient } from '../../types/Patient';

interface AppointmentDetailProps {
  appointment: Appointment;
  patient: Patient;
  onEdit: (appointmentData: AppointmentUpdate) => Promise<void>;
  onCancel: () => Promise<void>;
  onUpdateStatus: (status: AppointmentStatus) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export const AppointmentDetail: React.FC<AppointmentDetailProps> = ({
  appointment,
  patient,
  onEdit,
  onCancel,
  onUpdateStatus,
  onDelete,
  onClose,
  isLoading = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isCancelLoading, setIsCancelLoading] = useState(false);
  const [tempStatus, setTempStatus] = useState<AppointmentStatus>(appointment.status);
  const [hasStatusChanged, setHasStatusChanged] = useState(false);
  const [formData, setFormData] = useState<AppointmentUpdate>({
    date: appointment.date.split('T')[0], // Extract date part
    start_time: appointment.start_time.split('.')[0], // Remove microseconds
    end_time: appointment.end_time.split('.')[0], // Remove microseconds
    type: appointment.type,
    status: appointment.status,
    title: appointment.title,
    notes: appointment.notes,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when appointment changes
  useEffect(() => {
    setFormData({
      date: appointment.date.split('T')[0],
      start_time: appointment.start_time.split('.')[0],
      end_time: appointment.end_time.split('.')[0],
      type: appointment.type,
      status: appointment.status,
      title: appointment.title || '', // Ensure title is preserved
      notes: appointment.notes || '',
    });
  }, [appointment]);

  // Reset form data when entering edit mode to ensure fresh data from API
  useEffect(() => {
    if (isEditing) {
      setFormData({
        date: appointment.date.split('T')[0],
        start_time: appointment.start_time.split('.')[0],
        end_time: appointment.end_time.split('.')[0],
        type: appointment.type,
        status: appointment.status,
        title: appointment.title || '', // Ensure API title is loaded
        notes: appointment.notes || '',
      });
      // Clear any existing errors
      setErrors({});
    }
  }, [isEditing, appointment]);

  const appointmentTypes: AppointmentType[] = ['Consultation', 'Follow Up', 'Emergency', 'Routine Check'];
  const appointmentStatuses: AppointmentStatus[] = ['Booked', 'Completed', 'No Show'];

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string): string => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Booked':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'No Show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'Consultation':
        return 'bg-purple-100 text-purple-800';
      case 'Follow Up':
        return 'bg-yellow-100 text-yellow-800';
      case 'Emergency':
        return 'bg-red-100 text-red-800';
      case 'Routine Check':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }

    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
    }

    if (formData.start_time && formData.end_time) {
      const startTime = new Date(`2000-01-01T${formData.start_time}`);
      const endTime = new Date(`2000-01-01T${formData.end_time}`);

      if (endTime <= startTime) {
        newErrors.end_time = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEdit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsEditLoading(true);
    try {
      // Convert time format to include microseconds for API compatibility
      const updateData: AppointmentUpdate = {
        ...formData,
        start_time: `${formData.start_time}:00.000000`,
        end_time: `${formData.end_time}:00.000000`,
        date: `${formData.date}T${formData.start_time}:00.000000`,
      };

      await onEdit(updateData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating appointment:', error);
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: AppointmentStatus) => {
    setIsCancelLoading(true);
    try {
      await onUpdateStatus(newStatus);
      onClose(); // Close the popup after successful status update
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsCancelLoading(false);
    }
  };

  const handleDelete = async () => {
    // Remove the window.confirm - let the parent component handle confirmation
    setIsCancelLoading(true);
    try {
      await onDelete();
    } catch (error) {
      console.error('Error deleting appointment:', error);
    } finally {
      setIsCancelLoading(false);
    }
  };

  const handleChange = (field: keyof AppointmentUpdate, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const isUpcoming = new Date(appointment.date) > new Date();
  const canEdit = appointment.status !== 'Cancelled'; // Allow editing of all appointments except cancelled ones

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Appointment' : 'Appointment Details'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading || isEditLoading || isCancelLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Patient Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Patient</h3>
            <p className="text-sm text-gray-600">
              {patient.first_name} {patient.last_name}
            </p>
            <p className="text-sm text-gray-500">{patient.email}</p>
          </div>

          {isEditing ? (
            /* Edit Form */
            <div className="space-y-4">
              {/* Type and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.type || ''}
                    onChange={(e) => handleChange('type', e.target.value as AppointmentType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isEditLoading}
                  >
                    {appointmentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status || ''}
                    onChange={(e) => handleChange('status', e.target.value as AppointmentStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isEditLoading}
                  >
                    {appointmentStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <Input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => handleChange('date', e.target.value)}
                  error={errors.date}
                  disabled={isEditLoading}
                />
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <Input
                    type="time"
                    value={formData.start_time || ''}
                    onChange={(e) => handleChange('start_time', e.target.value)}
                    error={errors.start_time}
                    disabled={isEditLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <Input
                    type="time"
                    value={formData.end_time || ''}
                    onChange={(e) => handleChange('end_time', e.target.value)}
                    error={errors.end_time}
                    disabled={isEditLoading}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Additional notes or instructions..."
                  disabled={isEditLoading}
                />
              </div>

              {/* Edit Actions - Left aligned action buttons, Right aligned save */}
              <div className="flex justify-between items-center pt-6">
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsEditing(false)}
                    disabled={isEditLoading}
                  >
                    Cancel Edit
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={handleDelete}
                    disabled={isEditLoading || isCancelLoading}
                  >
                    {isCancelLoading ? 'Deleting...' : 'Delete Appointment'}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleEdit}
                  disabled={isEditLoading}
                >
                  {isEditLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-6">
              {/* Appointment Info */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{appointment.title}</h3>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getTypeColor(appointment.type)}`}>
                    {appointment.type}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Date & Time</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>{formatDate(appointment.date)}</p>
                      <p>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                    <select
                      value={tempStatus}
                      onChange={(e) => {
                        const newStatus = e.target.value as AppointmentStatus;
                        setTempStatus(newStatus);
                        setHasStatusChanged(newStatus !== appointment.status);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isCancelLoading}
                    >
                      {appointmentStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {appointment.notes && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{appointment.notes}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  disabled={isLoading || isCancelLoading}
                >
                  Close
                </Button>

                {canEdit && (
                  <Button
                    variant="primary"
                    onClick={() => setIsEditing(true)}
                    disabled={isLoading}
                  >
                    Edit Appointment
                  </Button>
                )}

                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={isLoading || isCancelLoading}
                >
                  {isCancelLoading ? 'Deleting...' : 'Cancel Appointment'}
                </Button>

                <Button
                  onClick={() => handleStatusUpdate(tempStatus)}
                  disabled={isCancelLoading || !hasStatusChanged}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isCancelLoading ? 'Saving...' : 'Save Status'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
