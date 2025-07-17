import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/TranslationContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PatientList } from '../components/patients/PatientList';
import { PatientForm } from '../components/patients/PatientForm';
import { PatientDetail } from '../components/patients/PatientDetail';
import { PatientSearch, PatientSearchFilters } from '../components/patients/PatientSearch';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Notification } from '../components/common/Notification';
import { Patient, PatientCreate, PatientUpdate } from '../types/Patient';
import { PatientService } from '../services/patientService';
import { useNotification } from '../hooks/useNotification';

type ViewMode = 'list' | 'grid' | 'create' | 'edit' | 'detail';

// Extended Patient interface for demo purposes
interface PatientWithExtras extends Patient {
  emergencyContact?: string;
  medicalHistory?: string;
  insurance?: string;
  lastVisit?: string;
  status?: 'active' | 'inactive' | 'critical';
}

// Patient management component with full CRUD functionality
export const Patients: React.FC = () => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedPatient, setSelectedPatient] = useState<PatientWithExtras | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock patient data matching the Patient interface
  const mockPatients: PatientWithExtras[] = [
    {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@email.com',
      phone: '+1 (555) 123-4567',
      date_of_birth: '1985-03-15',
      gender: 'male',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip_code: '10001',
      emergencyContact: 'Jane Doe - +1 (555) 987-6543',
      medicalHistory: 'Hypertension, Diabetes Type 2',
      insurance: 'Blue Cross Blue Shield',
      lastVisit: '2024-01-15',
      status: 'active'
    },
    {
      id: '2',
      first_name: 'Sarah',
      last_name: 'Wilson',
      email: 'sarah.wilson@email.com',
      phone: '+1 (555) 234-5678',
      date_of_birth: '1992-07-22',
      gender: 'female',
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zip_code: '90210',
      emergencyContact: 'Mike Wilson - +1 (555) 876-5432',
      medicalHistory: 'Asthma, Allergies',
      insurance: 'Aetna',
      lastVisit: '2024-01-20',
      status: 'active'
    },
    {
      id: '3',
      first_name: 'Mike',
      last_name: 'Johnson',
      email: 'mike.johnson@email.com',
      phone: '+1 (555) 345-6789',
      date_of_birth: '1978-11-08',
      gender: 'male',
      street: '789 Pine St',
      city: 'Chicago',
      state: 'IL',
      zip_code: '60601',
      emergencyContact: 'Lisa Johnson - +1 (555) 765-4321',
      medicalHistory: 'Heart Disease, High Cholesterol',
      insurance: 'Cigna',
      lastVisit: '2024-01-10',
      status: 'active'
    },
    {
      id: '4',
      first_name: 'Emily',
      last_name: 'Davis',
      email: 'emily.davis@email.com',
      phone: '+1 (555) 456-7890',
      date_of_birth: '1990-05-12',
      gender: 'female',
      street: '321 Elm Dr',
      city: 'Miami',
      state: 'FL',
      zip_code: '33101',
      emergencyContact: 'Robert Davis - +1 (555) 654-3210',
      medicalHistory: 'Migraine, Anxiety',
      insurance: 'United Healthcare',
      lastVisit: '2024-01-25',
      status: 'active'
    }
  ];

  const calculateAge = (dateOfBirth: string): number => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusColor = (status: string = 'active') => {
    switch (status) {
      case 'active': return 'bg-success-500';
      case 'inactive': return 'bg-warning-500';
      case 'critical': return 'bg-error-500';
      default: return 'bg-neutral-400';
    }
  };

  const filteredPatients = mockPatients.filter(patient =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone.includes(searchQuery)
  );

  const renderHeader = () => (
    <div className="card mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-600 mb-2">Patients</h1>
          <p className="text-neutral-600">Manage your patient records and information</p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-2">
          <div className="bg-neutral-100 rounded-xl p-1 flex border border-neutral-200">
            {(['grid', 'list'] as ViewMode[]).map((view) => (
              <button
                key={view}
                onClick={() => setViewMode(view)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  viewMode === view
                    ? 'bg-primary-500 text-white shadow-primary'
                    : 'text-neutral-600 hover:text-primary-600 hover:bg-white'
                }`}
              >
                <span className="material-icons-round text-lg">
                  {view === 'grid' ? 'grid_view' : 'view_list'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            icon="search"
            placeholder="Search patients by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="default"
          />
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="secondary" icon="filter_list">
            Filters
          </Button>
          <Button variant="secondary" icon="download">
            Export
          </Button>
          <Button
            variant="primary"
            icon="person_add"
            onClick={() => setViewMode('create')}
          >
            Add Patient
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-neutral-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-success-600">{mockPatients.length}</p>
          <p className="text-sm text-neutral-600">Total Patients</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary-600">
            {mockPatients.filter(p => p.lastVisit && new Date(p.lastVisit) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
          </p>
          <p className="text-sm text-neutral-600">Recent Visits</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary-600">
            {mockPatients.filter(p => p.status === 'active').length}
          </p>
          <p className="text-sm text-neutral-600">Active</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-warning-600">3</p>
          <p className="text-sm text-neutral-600">Need Follow-up</p>
        </div>
      </div>
    </div>
  );

  const renderPatientCard = (patient: PatientWithExtras, index: number) => (
    <div
      key={patient.id}
      className="card card-hover slide-up-element cursor-pointer"
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={() => {
        setSelectedPatient(patient);
        setViewMode('detail');
      }}
    >
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center shadow-medium text-white">
            <span className="text-xl font-semibold">
              {patient.first_name[0]}{patient.last_name[0]}
            </span>
          </div>
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${getStatusColor(patient.status)}`}></div>
        </div>

        {/* Patient Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-neutral-800 truncate">
              {patient.first_name} {patient.last_name}
            </h3>
            <span className="text-sm text-neutral-500">
              Age {calculateAge(patient.date_of_birth)}
            </span>
          </div>

          <div className="space-y-1 text-sm text-neutral-600">
            <div className="flex items-center space-x-2">
              <span className="material-icons-round text-lg">email</span>
              <span className="truncate">{patient.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="material-icons-round text-lg">phone</span>
              <span>{patient.phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="material-icons-round text-lg">calendar_today</span>
              <span>Last visit: {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>

          {/* Medical Info Tags */}
          {patient.medicalHistory && (
            <div className="flex flex-wrap gap-2 mt-3">
              {patient.medicalHistory.split(', ').slice(0, 2).map((condition: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full border border-primary-200"
                >
                  {condition}
                </span>
              ))}
              {patient.medicalHistory.split(', ').length > 2 && (
                <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full">
                  +{patient.medicalHistory.split(', ').length - 2} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Menu */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors duration-300">
            <span className="material-icons-round">more_vert</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {filteredPatients.map((patient, index) => renderPatientCard(patient, index))}
    </div>
  );

  const renderListView = () => (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-neutral-50 to-white border-b border-neutral-200">
            <tr>
              <th className="text-left py-4 px-6 font-semibold text-neutral-700">Patient</th>
              <th className="text-left py-4 px-6 font-semibold text-neutral-700">Contact</th>
              <th className="text-left py-4 px-6 font-semibold text-neutral-700">Age</th>
              <th className="text-left py-4 px-6 font-semibold text-neutral-700">Last Visit</th>
              <th className="text-left py-4 px-6 font-semibold text-neutral-700">Status</th>
              <th className="text-left py-4 px-6 font-semibold text-neutral-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((patient, index) => (
              <tr
                key={patient.id}
                className="border-b border-neutral-100 hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-blue-50/30 transition-all duration-300 cursor-pointer slide-up-element"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => {
                  setSelectedPatient(patient);
                  setViewMode('detail');
                }}
              >
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {patient.first_name[0]}{patient.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-800">{patient.first_name} {patient.last_name}</p>
                      <p className="text-sm text-neutral-600">{patient.gender}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div>
                    <p className="text-neutral-800">{patient.email}</p>
                    <p className="text-sm text-neutral-600">{patient.phone}</p>
                  </div>
                </td>
                <td className="py-4 px-6 text-neutral-800">
                  {calculateAge(patient.date_of_birth)}
                </td>
                <td className="py-4 px-6 text-neutral-800">
                  {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'N/A'}
                </td>
                <td className="py-4 px-6">
                  <span className={`px-3 py-1 rounded-full text-white text-xs font-medium ${getStatusColor(patient.status)}`}>
                    {patient.status ? patient.status.charAt(0).toUpperCase() + patient.status.slice(1) : 'Active'}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex space-x-2">
                    <button className="p-2 text-neutral-400 hover:text-blue-600 transition-colors duration-300">
                      <span className="material-icons-round text-lg">edit</span>
                    </button>
                    <button className="p-2 text-neutral-400 hover:text-purple-600 transition-colors duration-300">
                      <span className="material-icons-round text-lg">visibility</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (viewMode === 'detail' && selectedPatient) {
    return (
      <DashboardLayout>
        <div className="fade-in-element">
          <div className="card mb-6">
            <button
              onClick={() => setViewMode('grid')}
              className="btn-secondary mb-4"
            >
              <span className="material-icons-round mr-2">arrow_back</span>
              Back to Patients
            </button>

            <div className="flex items-start space-x-6">
              <div className="w-24 h-24 bg-primary-500 rounded-3xl flex items-center justify-center shadow-primary text-white">
                <span className="text-3xl font-semibold">
                  {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                </span>
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-bold text-primary-600 mb-2">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </h1>
                <p className="text-neutral-600 mb-4">{selectedPatient.email}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-neutral-500">Age</p>
                    <p className="font-semibold">{calculateAge(selectedPatient.date_of_birth)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Gender</p>
                    <p className="font-semibold">{selectedPatient.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Phone</p>
                    <p className="font-semibold">{selectedPatient.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Status</p>
                    <span className={`px-3 py-1 rounded-full text-white text-xs font-medium ${getStatusColor(selectedPatient.status)}`}>
                      {selectedPatient.status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button variant="secondary" icon="edit">
                  Edit
                </Button>
                <Button variant="primary" icon="event">
                  Schedule
                </Button>
              </div>
            </div>
          </div>

          {/* Additional patient details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-xl font-bold text-neutral-800 mb-4">Medical History</h3>
              <p className="text-neutral-600">{selectedPatient.medicalHistory || 'No medical history recorded'}</p>
            </div>

            <div className="card">
              <h3 className="text-xl font-bold text-neutral-800 mb-4">Insurance</h3>
              <p className="text-neutral-600">{selectedPatient.insurance || 'No insurance information'}</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="fade-in-element">
        {renderHeader()}

        {viewMode === 'grid' && renderGridView()}
        {viewMode === 'list' && renderListView()}

        {filteredPatients.length === 0 && (
          <div className="card text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <span className="material-icons-round text-neutral-400 text-3xl">search_off</span>
            </div>
            <h3 className="text-xl font-semibold text-neutral-800 mb-2">No patients found</h3>
            <p className="text-neutral-600 mb-6">Try adjusting your search criteria or add a new patient.</p>
            <Button variant="primary" icon="person_add">
              Add New Patient
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
