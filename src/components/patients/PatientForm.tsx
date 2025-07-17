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
    phone: '',
    date_of_birth: '',
    gender: 'male',
    email: '',
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
        phone: patient.phone,
        date_of_birth: patient.date_of_birth || '',
        gender: patient.gender || 'male',
        email: patient.email || '',
        street: patient.street || '',
        city: patient.city || '',
        state: patient.state || '',
        zip_code: patient.zip_code || '',
      });
    }
  }, [patient, isEditing]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'Invalid email format';
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
    } catch (error) {
      console.error('Form submission error:', error);
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
    <div className="card max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary-600 mb-2">
          {isEditing ? 'Edit Patient' : 'Add New Patient'}
        </h2>
        <p className="text-neutral-600">
          {isEditing ? 'Update patient information' : 'Enter patient details to create a new record'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={formData.first_name}
            onChange={(e) => handleInputChange('first_name', e.target.value)}
            error={errors.first_name}
            required
            placeholder="Enter first name"
          />

          <Input
            label="Last Name"
            value={formData.last_name}
            onChange={(e) => handleInputChange('last_name', e.target.value)}
            error={errors.last_name}
            required
            placeholder="Enter last name"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            error={errors.phone}
            required
            placeholder="+1 (555) 123-4567"
          />

          <Input
            label="Email (Optional)"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
            placeholder="email@example.com"
          />

          <Input
            label="Date of Birth (Optional)"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
          />
        </div>

        {/* Gender Selection */}
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            Gender (Optional)
          </label>
          <div className="flex space-x-4">
            {(['male', 'female', 'other'] as const).map((gender) => (
              <label key={gender} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={gender}
                  checked={formData.gender === gender}
                  onChange={(e) => handleInputChange('gender', e.target.value as any)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 focus:ring-2"
                />
                <span className="text-neutral-700 capitalize">{gender}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Address Information */}
        <div className="border-t border-neutral-200 pt-6">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Address (Optional)</h3>

          <div className="space-y-4">
            <Input
              label="Street Address"
              value={formData.street}
              onChange={(e) => handleInputChange('street', e.target.value)}
              placeholder="123 Main Street"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="City"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="New York"
              />

              <Input
                label="State"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="NY"
              />

              <Input
                label="ZIP Code"
                value={formData.zip_code}
                onChange={(e) => handleInputChange('zip_code', e.target.value)}
                placeholder="10001"
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
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            icon={isEditing ? "save" : "person_add"}
          >
            {isEditing ? 'Update Patient' : 'Create Patient'}
          </Button>
        </div>
      </form>
    </div>
  );
};
