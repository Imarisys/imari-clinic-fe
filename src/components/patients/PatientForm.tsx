import React, { useState, useEffect } from 'react';
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
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }
    // Only validate email format if it's provided
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
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
        {isEditing ? 'Edit Patient' : 'Add New Patient'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="First Name"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              error={errors.first_name}
              required
            />
          </div>

          <div>
            <Input
              label="Last Name"
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
              label="Date of Birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
              error={errors.date_of_birth}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value as 'male' | 'female' | 'other')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={errors.email}
            />
          </div>

          <div>
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              error={errors.phone}
              required
            />
          </div>
        </div>

        <div>
          <Input
            label="Street Address"
            value={formData.street}
            onChange={(e) => handleInputChange('street', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
            />
          </div>

          <div>
            <Input
              label="State"
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Zip Code"
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
            {isLoading ? 'Saving...' : (isEditing ? 'Update Patient' : 'Create Patient')}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
