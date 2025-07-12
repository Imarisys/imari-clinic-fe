import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Patient } from '../../types/Patient';
import { AppointmentCreate, AppointmentStatus } from '../../types/Appointment';
import { AppointmentTypeService, AppointmentType } from '../../services/appointmentTypeService';
import { useNotification } from '../../hooks/useNotification';

interface AppointmentBookingFormProps {
  patient: Patient;
  onSubmit: (appointmentData: AppointmentCreate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  preselectedDate?: string;
  preselectedTime?: string;
  preselectedEndTime?: string;
}

export const AppointmentBookingForm: React.FC<AppointmentBookingFormProps> = ({
  patient,
  onSubmit,
  onCancel,
  isLoading = false,
  preselectedDate,
  preselectedTime,
  preselectedEndTime,
}) => {
  const { showNotification } = useNotification();
  const [isClosing, setIsClosing] = useState(false);

  const [formData, setFormData] = useState<AppointmentCreate>({
    patient_id: patient.id,
    date: '',
    start_time: '',
    end_time: '',
    type: 'Consultation',
    appointment_type_name: '',
    status: 'Booked',
    title: '',
    notes: '',
  });

  // Auto-populate form with preselected values
  useEffect(() => {
    if (preselectedDate && preselectedTime) {
      // Use preselected end time if provided, otherwise calculate default (1 hour after start)
      let endTime: string;
      if (preselectedEndTime) {
        endTime = preselectedEndTime;
      } else {
        const [hours, minutes] = preselectedTime.split(':').map(Number);
        const endHour = hours + 1;
        endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }

      setFormData(prev => ({
        ...prev,
        date: preselectedDate,
        start_time: preselectedTime,
        end_time: endTime,
        title: `Consultation with ${patient.first_name} ${patient.last_name}`,
      }));
    }
  }, [preselectedDate, preselectedTime, preselectedEndTime, patient.first_name, patient.last_name]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [selectedAppointmentType, setSelectedAppointmentType] = useState<AppointmentType | null>(null);

  // Fetch appointment types from the API
  useEffect(() => {
    const fetchAppointmentTypes = async () => {
      try {
        const types = await AppointmentTypeService.getAll();
        setAppointmentTypes(types);

        // Set default appointment type if we have types and the form doesn't have one yet
        if (types.length > 0 && !formData.appointment_type_name) {
          // Get the name from the first appointment type
          const typeName = types[0].name;

          setFormData(prev => ({
            ...prev,
            // Only set the appointment_type_name field, which expects a string
            appointment_type_name: typeName
          }));
          setSelectedAppointmentType(types[0]);
        }
      } catch (error) {
        console.error('Error fetching appointment types:', error);
      }
    };

    fetchAppointmentTypes();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.date = 'Date cannot be in the past';
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Convert time format to include microseconds for API compatibility
      const appointmentData: AppointmentCreate = {
        ...formData,
        start_time: `${formData.start_time}:00.000000`,
        end_time: `${formData.end_time}:00.000000`,
        date: `${formData.date}T${formData.start_time}:00.000000`,
      };

      await onSubmit(appointmentData);

      // Show success notification
      showNotification(
        'success',
        'Appointment Confirmed',
        `Appointment with ${patient.first_name} ${patient.last_name} has been booked successfully.`
      );

      // Trigger smooth closing animation
      handleSmoothClose();
    } catch (error) {
      console.error('Error submitting appointment:', error);
      showNotification(
        'error',
        'Booking Failed',
        'There was a problem booking the appointment. Please try again.'
      );
    }
  };

  // Handle smooth closing of the modal
  const handleSmoothClose = () => {
    setIsClosing(true);
    // Wait for the animation to complete before actually closing
    setTimeout(() => {
      onCancel();
    }, 500);
  };

  const handleChange = (field: keyof AppointmentCreate, value: string) => {
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

  const handleAppointmentTypeChange = (typeName: string) => {
    const selectedType = appointmentTypes.find(type => type.name === typeName);
    setSelectedAppointmentType(selectedType || null);

    // Update the form data with the selected type name for both fields
    handleChange('type', typeName);
    handleChange('appointment_type_name', typeName);

    // Auto-calculate end time if start time is set
    if (selectedType && formData.start_time) {
      const [hours, minutes] = formData.start_time.split(':').map(Number);
      const durationMinutes = selectedType.duration_minutes;

      const endDateTime = new Date();
      endDateTime.setHours(hours, minutes + durationMinutes, 0);

      const endHours = endDateTime.getHours().toString().padStart(2, '0');
      const endMinutes = endDateTime.getMinutes().toString().padStart(2, '0');
      const calculatedEndTime = `${endHours}:${endMinutes}`;

      handleChange('end_time', calculatedEndTime);
    }
  };

  // Auto-calculate end time when start time changes if appointment type is selected
  const handleStartTimeChange = (startTime: string) => {
    handleChange('start_time', startTime);

    if (selectedAppointmentType && startTime) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const durationMinutes = selectedAppointmentType.duration_minutes;

      const endDateTime = new Date();
      endDateTime.setHours(hours, minutes + durationMinutes, 0);

      const endHours = endDateTime.getHours().toString().padStart(2, '0');
      const endMinutes = endDateTime.getMinutes().toString().padStart(2, '0');
      const calculatedEndTime = `${endHours}:${endMinutes}`;

      handleChange('end_time', calculatedEndTime);
    }
  };

  const getTomorrowDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className={`bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all duration-500 ease-in-out ${
          isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Book New Appointment
            </h2>
            <button
              onClick={handleSmoothClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appointment Title *
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Regular Checkup, Follow-up Visit"
                error={errors.title}
                disabled={isLoading}
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appointment Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleAppointmentTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading || appointmentTypes.length === 0}
              >
                {appointmentTypes.length === 0 ? (
                  <option>Loading appointment types...</option>
                ) : (
                  appointmentTypes.map((type) => (
                    <option key={type.name} value={type.name}>
                      {type.name} ({type.duration_minutes} min)
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                min={getTomorrowDate()}
                error={errors.date}
                disabled={isLoading}
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
                  value={formData.start_time}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  error={errors.start_time}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time *
                </label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleChange('end_time', e.target.value)}
                  error={errors.end_time}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Additional notes or instructions..."
                disabled={isLoading}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
              >
                {isLoading ? 'Booking...' : 'Book Appointment'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
