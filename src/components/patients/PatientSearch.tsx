import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

export interface PatientSearchFilters {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  gender?: 'male' | 'female' | 'other' | '';
  age_from?: number;
  age_to?: number;
}

interface PatientSearchProps {
  onSearch: (filters: PatientSearchFilters) => void;
  onClear: () => void;
  isLoading?: boolean;
}

export const PatientSearch: React.FC<PatientSearchProps> = ({
  onSearch,
  onClear,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<PatientSearchFilters>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    gender: '',
    age_from: undefined,
    age_to: undefined,
  });

  const handleFilterChange = (field: keyof PatientSearchFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value,
    }));
  };

  const handleSearch = () => {
    // Filter out empty values
    const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key as keyof PatientSearchFilters] = value;
      }
      return acc;
    }, {} as PatientSearchFilters);

    onSearch(activeFilters);
  };

  const handleClear = () => {
    setFilters({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      city: '',
      state: '',
      gender: '',
      age_from: undefined,
      age_to: undefined,
    });
    onClear();
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      {/* Basic Search Row */}
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <Input
            label="Quick Search"
            placeholder="Search by name, email, or phone..."
            value={filters.first_name || ''}
            onChange={(e) => handleFilterChange('first_name', e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={handleSearch}
            disabled={isLoading}
          >
            Search
          </Button>

          <Button
            variant="secondary"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Less Filters' : 'More Filters'}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="secondary"
              onClick={handleClear}
              disabled={isLoading}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Search Options */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Name Fields */}
            <div>
              <Input
                label="First Name"
                placeholder="Enter first name..."
                value={filters.first_name || ''}
                onChange={(e) => handleFilterChange('first_name', e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Last Name"
                placeholder="Enter last name..."
                value={filters.last_name || ''}
                onChange={(e) => handleFilterChange('last_name', e.target.value)}
              />
            </div>

            {/* Contact Fields */}
            <div>
              <Input
                label="Email"
                placeholder="Enter email..."
                value={filters.email || ''}
                onChange={(e) => handleFilterChange('email', e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Phone"
                placeholder="Enter phone..."
                value={filters.phone || ''}
                onChange={(e) => handleFilterChange('phone', e.target.value)}
              />
            </div>

            {/* Location Fields */}
            <div>
              <Input
                label="City"
                placeholder="Enter city..."
                value={filters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value)}
              />
            </div>

            <div>
              <Input
                label="State"
                placeholder="Enter state..."
                value={filters.state || ''}
                onChange={(e) => handleFilterChange('state', e.target.value)}
              />
            </div>

            {/* Gender Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                value={filters.gender || ''}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Age Range */}
            <div>
              <Input
                label="Age From"
                type="number"
                placeholder="Min age..."
                value={filters.age_from?.toString() || ''}
                onChange={(e) => handleFilterChange('age_from', e.target.value ? parseInt(e.target.value) : '')}
              />
            </div>

            <div>
              <Input
                label="Age To"
                type="number"
                placeholder="Max age..."
                value={filters.age_to?.toString() || ''}
                onChange={(e) => handleFilterChange('age_to', e.target.value ? parseInt(e.target.value) : '')}
              />
            </div>
          </div>

          {/* Advanced Search Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
            <Button
              variant="primary"
              onClick={handleSearch}
              disabled={isLoading}
            >
              Apply Filters
            </Button>

            <Button
              variant="secondary"
              onClick={handleClear}
              disabled={isLoading}
            >
              Clear All Filters
            </Button>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && !isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {Object.entries(filters).map(([key, value]) => {
              if (value === undefined || value === '') return null;

              const displayKey = key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
              return (
                <span
                  key={key}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {displayKey}: {value}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
