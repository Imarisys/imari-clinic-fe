import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { useNotification } from '../../context/NotificationContext';
import { Patient, PatientCreate, PatientUpdate } from '../../types/Patient';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface PatientFormProps {
  patient?: Patient | null;
  onSubmit: (patientData: PatientCreate | PatientUpdate) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  isLoading?: boolean;
  fullWidth?: boolean; // Add prop to control full width usage
}

export const PatientForm: React.FC<PatientFormProps> = ({
  patient,
  onSubmit,
  onCancel,
  isEditing = false,
  isLoading = false,
  fullWidth = false, // Default to false
}) => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState<PatientCreate>({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    gender: 'male',
    email: '',
    street: '',
    city: '',
    state: '',
    zip_code: '',
    preconditions: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (patient && isEditing) {
      setFormData({
        first_name: patient.first_name,
        last_name: patient.last_name,
        phone: patient.phone,
        date_of_birth: patient.date_of_birth || '',
        gender: patient.gender || 'male',
        email: patient.email || '',
        street: patient.street || '',
        city: patient.city || '',
        state: patient.state || '',
        zip_code: patient.zip_code || '',
        preconditions: patient.preconditions || [],
      });
    }
  }, [patient, isEditing]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = t('first_name_required');
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = t('last_name_required');
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('phone_required');
    } else {
      // Remove any non-digit characters for validation
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length !== 8) {
        newErrors.phone = t('phone_invalid_format');
      }
    }

    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = t('email_invalid');
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
      // Clean up the data - remove empty strings for optional fields
      const cleanData = {
        ...formData,
        date_of_birth: formData.date_of_birth || undefined,
        email: formData.email || undefined,
        street: formData.street || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zip_code: formData.zip_code || undefined,
      };

      await onSubmit(cleanData);

      // Show success notification only if onSubmit doesn't throw an error
      showNotification(
        'success',
        isEditing ? t('patient_updated_successfully') : t('patient_created_successfully'),
        isEditing
          ? `${formData.first_name} ${formData.last_name} ${t('patient_info_updated')}`
          : `${formData.first_name} ${formData.last_name} ${t('patient_added_to_system')}`
      );

    } catch (error) {
      console.error('Form submission error:', error);

      // Show error notification
      showNotification(
        'error',
        isEditing ? t('failed_to_update_patient') : t('failed_to_create_patient'),
        error instanceof Error
          ? error.message
          : isEditing ? t('unable_to_update_patient') : t('unable_to_create_patient')
      );
    }
  };

  const handleInputChange = (field: keyof PatientCreate, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className={`${fullWidth ? 'w-full' : 'card max-w-4xl mx-auto'}`}>
      <div className={`${fullWidth ? 'bg-white rounded-lg shadow-sm border border-gray-200 p-8' : ''} mb-6`}>
        <h2 className="text-2xl font-bold text-primary-600 mb-2">
          {isEditing ? t('edit_patient') : t('add_new_patient')}
        </h2>
        <p className="text-neutral-600">
          {isEditing ? t('update_patient_information') : t('enter_patient_details')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className={`space-y-6 ${fullWidth ? 'bg-white rounded-lg shadow-sm border border-gray-200 p-8' : ''}`}>
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Input
            label={t('first_name')}
            value={formData.first_name}
            onChange={(e) => handleInputChange('first_name', e.target.value)}
            error={errors.first_name}
            required
            placeholder={t('enter_first_name')}
          />

          <Input
            label={t('last_name')}
            value={formData.last_name}
            onChange={(e) => handleInputChange('last_name', e.target.value)}
            error={errors.last_name}
            required
            placeholder={t('enter_last_name')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Input
            label={t('phone_number')}
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            error={errors.phone}
            required
            placeholder={t('phone_placeholder')}
          />

          <Input
            label={t('email_optional')}
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
            placeholder={t('email_placeholder')}
          />

          <Input
            label={t('date_of_birth_optional')}
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
          />
        </div>

        {/* Gender Selection */}
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            {t('gender_optional')}
          </label>
          <div className="flex space-x-4">
            {(['male', 'female'] as const).map((gender) => (
              <label key={gender} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={gender}
                  checked={formData.gender === gender}
                  onChange={(e) => handleInputChange('gender', e.target.value as any)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 focus:ring-2"
                />
                <span className="text-neutral-700 capitalize">{t(gender)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Address Information */}
        <div className="border-t border-neutral-200 pt-6">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">{t('address_optional')}</h3>

          <div className="space-y-4">
            <Input
              label={t('street_address')}
              value={formData.street}
              onChange={(e) => handleInputChange('street', e.target.value)}
              placeholder={t('street_placeholder')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Input
                label={t('city')}
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder={t('city_placeholder')}
              />

              <Input
                label={t('state')}
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder={t('state_placeholder')}
              />

              <Input
                label={t('zip_code')}
                value={formData.zip_code}
                onChange={(e) => handleInputChange('zip_code', e.target.value)}
                placeholder={t('zip_placeholder')}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-neutral-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t('cancel')}
          </Button>

          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            icon={isEditing ? "save" : "person_add"}
          >
            {isEditing ? t('update_patient') : t('create_patient')}
          </Button>
        </div>
      </form>
    </div>
  );
};
