import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Patient } from '../../types/Patient';
import { AppointmentCreate } from '../../types/Appointment';
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
  const { t } = useTranslation();
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
        title: t('consultation_with', { name: `${patient.first_name} ${patient.last_name}` }),
      }));
    }
  }, [preselectedDate, preselectedTime, preselectedEndTime, patient.first_name, patient.last_name, t]);

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
  }, [formData.appointment_type_name]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('title_required');
    }

    if (!formData.date) {
      newErrors.date = t('date_required_error');
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.date = t('date_past_error');
      }
    }

    if (!formData.start_time) {
      newErrors.start_time = t('start_time_required_error');
    }

    if (!formData.end_time) {
      newErrors.end_time = t('end_time_required_error');
    }

    if (formData.start_time && formData.end_time) {
      const startTime = new Date(`2000-01-01T${formData.start_time}`);
      const endTime = new Date(`2000-01-01T${formData.end_time}`);

      if (endTime <= startTime) {
        newErrors.end_time = t('end_time_after_start');
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
        t('appointment_confirmed'),
        t('appointment_booked_with', { name: `${patient.first_name} ${patient.last_name}` })
      );

      // Trigger smooth closing animation
      handleSmoothClose();
    } catch (error) {
      console.error('Error submitting appointment:', error);
      showNotification(
        'error',
        t('booking_failed'),
        t('booking_error')
      );
    }
  };

  // Handle smooth closing of the modal
  const handleSmoothClose = () => {
    setIsClosing(true);
    // Wait for the animation to complete before actually closing
    setTimeout(() => {
      onCancel();
    }, 300);
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
    <div className={`transition-all duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      {/* Patient Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-2">{t('patient')}</h3>
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
            {t('appointment_title_required')}
          </label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder={t('appointment_title_placeholder')}
            error={errors.title}
            disabled={isLoading}
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('appointment_type')}
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.appointment_type_name}
            onChange={(e) => handleAppointmentTypeChange(e.target.value)}
            disabled={isLoading}
          >
            {appointmentTypes.map((type, index) => (
              <option key={index} value={type.name}>
                {type.name} ({type.duration_minutes} min)
              </option>
            ))}
          </select>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('date_required')}
            </label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              error={errors.date}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('start_time_required')}
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
              {t('end_time_required')}
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
            {t('notes')}
          </label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32 resize-none"
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Add appointment notes here..."
            disabled={isLoading}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleSmoothClose}
            disabled={isLoading}
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
          >
            {t('book_appointment')}
          </Button>
        </div>
      </form>
    </div>
  );
};
