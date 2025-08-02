import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Patient } from '../../types/Patient';
import { AppointmentCreate } from '../../types/Appointment';
import { AppointmentTypeService, AppointmentType } from '../../services/appointmentTypeService';
import { AppointmentService, TimeSlot } from '../../services/appointmentService';
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

  // New state for time slots
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showSlots, setShowSlots] = useState(false); // New state to toggle slot display

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
            appointment_type_name: typeName,
            // Also set a default title if it's empty
            title: prev.title || t('consultation_with', { name: `${patient.first_name} ${patient.last_name}` })
          }));
          setSelectedAppointmentType(types[0]);
        }
      } catch (error) {
        console.error('Error fetching appointment types:', error);
      }
    };

    fetchAppointmentTypes();
  }, []); // Remove the dependency on formData.appointment_type_name to prevent infinite loop

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    console.log('Validating form with data:', formData);

    if (!formData.title.trim()) {
      newErrors.title = t('title_required');
      console.log('Title validation failed - title is empty');
    }

    if (!formData.date) {
      newErrors.date = t('date_required_error');
      console.log('Date validation failed - date is empty');
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.date = t('date_past_error');
        console.log('Date validation failed - date is in the past');
      }
    }

    if (!formData.start_time) {
      newErrors.start_time = t('start_time_required_error');
      console.log('Start time validation failed - start_time is empty');
    }

    if (!formData.end_time) {
      newErrors.end_time = t('end_time_required_error');
      console.log('End time validation failed - end_time is empty');
    }

    if (formData.start_time && formData.end_time) {
      const startTime = new Date(`2000-01-01T${formData.start_time}`);
      const endTime = new Date(`2000-01-01T${formData.end_time}`);

      if (endTime <= startTime) {
        newErrors.end_time = t('end_time_after_start');
        console.log('End time validation failed - end time is not after start time');
      }
    }

    console.log('Validation errors found:', newErrors);
    console.log('Validation will return:', Object.keys(newErrors).length === 0);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Form submitted!', { formData, isLoading });

    const validationResult = validateForm();
    console.log('Validation result:', validationResult);

    if (!validationResult) {
      console.log('Form validation failed - current errors state:', errors);
      return;
    }

    console.log('Form validation passed, submitting...');

    try {
      // Format data for API - date as date string, times as time strings
      const appointmentData: AppointmentCreate = {
        ...formData,
        date: formData.date, // Keep date as YYYY-MM-DD format
        start_time: formData.start_time, // Keep time as HH:MM format
        end_time: formData.end_time, // Keep time as HH:MM format
      };

      console.log('Calling onSubmit with data:', appointmentData);
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

    // Clear previous slot selection
    setSelectedSlot(null);
    setAvailableSlots([]);

    // Fetch slots if date is already selected
    if (formData.date && typeName) {
      fetchAvailableSlots(typeName, formData.date);
    }

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

  // Function to fetch available slots
  const fetchAvailableSlots = async (appointmentTypeName: string, date: string) => {
    if (!appointmentTypeName || !date) return;

    setLoadingSlots(true);
    try {
      const slots = await AppointmentService.getAvailableSlots(appointmentTypeName, date);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      showNotification('error', 'Error', 'Failed to fetch available time slots');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Handle date change and fetch slots
  const handleDateChange = (date: string) => {
    handleChange('date', date);
    setSelectedSlot(null);

    // Fetch slots if appointment type is selected
    if (formData.appointment_type_name && date) {
      fetchAvailableSlots(formData.appointment_type_name, date);
    }
  };

  // Handle slot selection
  const handleSlotSelection = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    handleChange('start_time', slot.start_time);
    handleChange('end_time', slot.end_time);
  };

  // Format time for display
  const formatTimeForDisplay = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Group slots by time periods
  const groupSlotsByPeriod = (slots: TimeSlot[]) => {
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const evening: TimeSlot[] = [];

    slots.forEach(slot => {
      const hour = parseInt(slot.start_time.split(':')[0]);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
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

        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('date_required')}
          </label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => handleDateChange(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            error={errors.date}
            disabled={isLoading}
          />
        </div>

        {/* Time Input Section - Always visible */}
        <div className="space-y-4">
          {/* Manual Time Input - Always shown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
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
                End Time
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

          {/* Show Available Slots Button - Only show if appointment type and date are selected */}
          {formData.appointment_type_name && formData.date && (
            <div className="flex justify-center">
              <Button
                type="button"
                variant={showSlots ? "secondary" : "primary"}
                onClick={() => {
                  if (!showSlots) {
                    fetchAvailableSlots(formData.appointment_type_name, formData.date);
                  }
                  setShowSlots(!showSlots);
                }}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>
                  {showSlots ? 'Hide Available Slots' : 'Show Available Slots'}
                </span>
                {loadingSlots && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Available Time Slots - Only show when toggled on */}
        {showSlots && formData.appointment_type_name && formData.date && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                📅 Recommended Time Slots
              </label>
              <span className="text-xs text-gray-500">Click any slot to use that time</span>
            </div>

            {!loadingSlots && availableSlots.length > 0 && (
              <div className="space-y-6">
                {(() => {
                  const { morning, afternoon, evening } = groupSlotsByPeriod(availableSlots);
                  return (
                    <>
                      {morning.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                            </svg>
                            Morning (Before 12 PM)
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {morning.map((slot, index) => (
                              <button
                                key={`morning-${index}`}
                                type="button"
                                className={`p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md
                                  ${selectedSlot?.start_time === slot.start_time 
                                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md' 
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                                  }`}
                                onClick={() => handleSlotSelection(slot)}
                                disabled={isLoading}
                              >
                                <div className="text-sm font-medium">
                                  {formatTimeForDisplay(slot.start_time)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {selectedAppointmentType?.duration_minutes} min
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {afternoon.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                            </svg>
                            Afternoon (12 PM - 5 PM)
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {afternoon.map((slot, index) => (
                              <button
                                key={`afternoon-${index}`}
                                type="button"
                                className={`p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md
                                  ${selectedSlot?.start_time === slot.start_time 
                                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md' 
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                                  }`}
                                onClick={() => handleSlotSelection(slot)}
                                disabled={isLoading}
                              >
                                <div className="text-sm font-medium">
                                  {formatTimeForDisplay(slot.start_time)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {selectedAppointmentType?.duration_minutes} min
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {evening.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" clipRule="evenodd" />
                            </svg>
                            Evening (After 5 PM)
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {evening.map((slot, index) => (
                              <button
                                key={`evening-${index}`}
                                type="button"
                                className={`p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md
                                  ${selectedSlot?.start_time === slot.start_time 
                                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md' 
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                                  }`}
                                onClick={() => handleSlotSelection(slot)}
                                disabled={isLoading}
                              >
                                <div className="text-sm font-medium">
                                  {formatTimeForDisplay(slot.start_time)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {selectedAppointmentType?.duration_minutes} min
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {!loadingSlots && availableSlots.length === 0 && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No available slots</h3>
                <p className="mt-1 text-sm text-gray-500">
                  There are no available time slots for the selected date and appointment type.
                </p>
              </div>
            )}

            {/* Selected Time Display */}
            {selectedSlot && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Using Recommended Slot: {formatTimeForDisplay(selectedSlot.start_time)} - {formatTimeForDisplay(selectedSlot.end_time)}
                    </p>
                    <p className="text-xs text-blue-700">
                      {selectedAppointmentType?.name} ({selectedAppointmentType?.duration_minutes} minutes)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
