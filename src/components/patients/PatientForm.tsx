import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { Patient, PatientCreate, PatientUpdate } from '../../types/Patient';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface PatientFormProps {
  patient?: Patient | null;
  onSubmit: (patientData: PatientCreate | PatientUpdate) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  isLoading?: boolean;
}

export const PatientForm: React.FC<PatientFormProps> = ({
  patient,
  onSubmit,
  onCancel,
  isEditing = false,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<PatientCreate>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'male',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip_code: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (patient && isEditing) {
      setFormData({
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth,
        gender: patient.gender,
        email: patient.email,
        phone: patient.phone,
        street: patient.street,
        city: patient.city,
        state: patient.state,
        zip_code: patient.zip_code,
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
    }
    // Only validate email format if it's provided
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('email_invalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PatientCreate, value: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Filter out empty string values before submitting
      const filteredData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== '') {
          acc[key as keyof PatientCreate] = value;
        }
        return acc;
      }, {} as PatientCreate);

      await onSubmit(filteredData);
    } catch (error) {
      console.error('Error submitting patient form:', error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        {isEditing ? t('edit_patient') : t('add_new_patient')}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label={t('first_name')}
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              error={errors.first_name}
              required
            />
          </div>

          <div>
            <Input
              label={t('last_name')}
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              error={errors.last_name}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label={t('date_of_birth')}
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
              error={errors.date_of_birth}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('gender')}
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value as 'male' | 'female' | 'other')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="male">{t('male')}</option>
              <option value="female">{t('female')}</option>
              <option value="other">{t('other')}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label={t('email')}
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={errors.email}
            />
          </div>

          <div>
            <Input
              label={t('phone')}
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              error={errors.phone}
              required
            />
          </div>
        </div>

        <div>
          <Input
            label={t('street_address')}
            value={formData.street}
            onChange={(e) => handleInputChange('street', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              label={t('city')}
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
            />
          </div>

          <div>
            <Input
              label={t('state')}
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
            />
          </div>

          <div>
            <Input
              label={t('zip_code')}
              value={formData.zip_code}
              onChange={(e) => handleInputChange('zip_code', e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? t('saving') : (isEditing ? t('update_patient') : t('create_patient'))}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t('cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};
