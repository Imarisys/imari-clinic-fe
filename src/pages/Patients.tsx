import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PatientList } from '../components/patients/PatientList';
import { PatientForm } from '../components/patients/PatientForm';
import { PatientDetail } from '../components/patients/PatientDetail';
import { PatientSearch, PatientSearchFilters } from '../components/patients/PatientSearch';
import { Button } from '../components/common/Button';
import { Notification } from '../components/common/Notification';
import { Patient, PatientCreate, PatientUpdate } from '../types/Patient';
import { PatientService } from '../services/patientService';
import { useNotification } from '../hooks/useNotification';

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

// Patient management component with full CRUD functionality
export const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<PatientSearchFilters>({});

  const { notification, hideNotification, showSuccess, showError, showWarning, showInfo } = useNotification();

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allPatients, activeFilters]);

  // Helper function to calculate age from date of birth
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

  // Apply search filters to patient list
  const applyFilters = () => {
    let filtered = [...allPatients];

    // Apply each filter
    if (activeFilters.first_name) {
      filtered = filtered.filter(patient =>
        patient.first_name.toLowerCase().includes(activeFilters.first_name!.toLowerCase())
      );
    }

    if (activeFilters.last_name) {
      filtered = filtered.filter(patient =>
        patient.last_name.toLowerCase().includes(activeFilters.last_name!.toLowerCase())
      );
    }

    if (activeFilters.email) {
      filtered = filtered.filter(patient =>
        patient.email.toLowerCase().includes(activeFilters.email!.toLowerCase())
      );
    }

    if (activeFilters.phone) {
      filtered = filtered.filter(patient =>
        patient.phone.toLowerCase().includes(activeFilters.phone!.toLowerCase())
      );
    }

    if (activeFilters.city) {
      filtered = filtered.filter(patient =>
        patient.city.toLowerCase().includes(activeFilters.city!.toLowerCase())
      );
    }

    if (activeFilters.state) {
      filtered = filtered.filter(patient =>
        patient.state.toLowerCase().includes(activeFilters.state!.toLowerCase())
      );
    }

    if (activeFilters.gender && activeFilters.gender !== 'male' && activeFilters.gender !== 'female' && activeFilters.gender !== 'other') {
      // Skip invalid gender values
    } else if (activeFilters.gender) {
      filtered = filtered.filter(patient => patient.gender === activeFilters.gender);
    }

    // Age range filtering
    if (activeFilters.age_from !== undefined || activeFilters.age_to !== undefined) {
      filtered = filtered.filter(patient => {
        const age = calculateAge(patient.date_of_birth);
        const meetsMinAge = activeFilters.age_from === undefined || age >= activeFilters.age_from;
        const meetsMaxAge = activeFilters.age_to === undefined || age <= activeFilters.age_to;
        return meetsMinAge && meetsMaxAge;
      });
    }

    setFilteredPatients(filtered);
  };

  const loadPatients = async () => {
    setIsLoading(true);

    try {
      const patientsData = await PatientService.listPatients();
      setPatients(patientsData);
      setAllPatients(patientsData); // Keep a copy of all patients
      if (patientsData.length === 0) {
        showInfo('No patients found', 'Start by adding your first patient to the system.');
      }
    } catch (err: any) {
      console.error('Error loading patients:', err);
      const errorMessage = err?.message || 'Failed to load patients. Please check your connection and try again.';
      showError('Failed to Load Patients', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for creating new patients
  const handleCreatePatient = async (patientData: PatientCreate | PatientUpdate): Promise<void> => {
    setIsLoading(true);

    try {
      const newPatient = await PatientService.createPatient(patientData as PatientCreate);
      setPatients(prev => [...prev, newPatient]);
      setViewMode('list');
      setSelectedPatient(null);
      showSuccess(
        'Patient Created Successfully',
        `${newPatient.first_name} ${newPatient.last_name} has been added to the system.`
      );
    } catch (err: any) {
      console.error('Error creating patient:', err);
      const errorMessage = err?.message || 'Unable to create patient. Please check your input and try again.';
      showError('Failed to Create Patient', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for updating existing patients
  const handleUpdatePatient = async (patientData: PatientCreate | PatientUpdate): Promise<void> => {
    if (!selectedPatient) return;

    setIsLoading(true);

    try {
      const updatedPatient = await PatientService.updatePatient(selectedPatient.id, patientData as PatientUpdate);

      // Update patients in both lists
      setPatients(prev => prev.map(p =>
        p.id === selectedPatient.id ? updatedPatient : p
      ));
      setAllPatients(prev => prev.map(p =>
        p.id === selectedPatient.id ? updatedPatient : p
      ));

      // Update the selected patient for the detail view
      setSelectedPatient(updatedPatient);

      setViewMode('detail'); // Go back to detail view instead of list
      showSuccess(
        'Patient Updated Successfully',
        `${updatedPatient.first_name} ${updatedPatient.last_name}'s information has been updated.`
      );
    } catch (err: any) {
      console.error('Error updating patient:', err);
      const errorMessage = err?.message || 'Unable to update patient. Please try again.';
      showError('Failed to Update Patient', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatientUpdated = (updatedPatient: Patient) => {
    // Update patients in both lists
    setPatients(prev => prev.map(p =>
      p.id === updatedPatient.id ? updatedPatient : p
    ));
    setAllPatients(prev => prev.map(p =>
      p.id === updatedPatient.id ? updatedPatient : p
    ));

    // Update the selected patient
    setSelectedPatient(updatedPatient);
  };

  const handleDeletePatient = async (patientId: string) => {
    const patientToDelete = patients.find(p => p.id === patientId);
    const patientName = patientToDelete ? `${patientToDelete.first_name} ${patientToDelete.last_name}` : 'this patient';

    if (!window.confirm(`Are you sure you want to delete ${patientName}? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);

    try {
      await PatientService.deletePatient(patientId);
      setPatients(prev => prev.filter(p => p.id !== patientId));
      showSuccess(
        'Patient Deleted Successfully',
        `${patientName} has been removed from the system.`
      );
    } catch (err: any) {
      console.error('Error deleting patient:', err);
      const errorMessage = err?.message || 'Unable to delete patient. Please try again.';
      showError('Failed to Delete Patient', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setViewMode('edit');
  };

  const handleViewPatientDetail = (patient: Patient) => {
    setSelectedPatient(patient);
    setViewMode('detail');
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedPatient(null);
  };

  const handleSearch = (filters: PatientSearchFilters) => {
    setActiveFilters(filters);
  };

  const handleClearSearch = () => {
    setActiveFilters({});
    setFilteredPatients(allPatients);
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'create':
        return (
          <PatientForm
            onSubmit={handleCreatePatient}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        );

      case 'edit':
        return (
          <PatientForm
            patient={selectedPatient}
            onSubmit={handleUpdatePatient}
            onCancel={handleCancel}
            isEditing={true}
            isLoading={isLoading}
          />
        );

      case 'detail':
        return selectedPatient ? (
          <PatientDetail
            patient={selectedPatient}
            onEdit={handleEditPatient}
            onDelete={handleDeletePatient}
            onBack={handleCancel}
            isLoading={isLoading}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Patient not found</p>
            <Button variant="secondary" onClick={handleCancel}>
              Back to List
            </Button>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            {/* Advanced Search Component */}
            <PatientSearch
              onSearch={handleSearch}
              onClear={handleClearSearch}
              isLoading={isLoading}
            />

            {/* Header with add button */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {filteredPatients.length} of {allPatients.length} patients
              </div>
              <Button
                variant="primary"
                onClick={() => setViewMode('create')}
              >
                Add New Patient
              </Button>
            </div>

            {/* Patient list */}
            <PatientList
              patients={filteredPatients}
              onEditPatient={handleEditPatient}
              onViewDetail={handleViewPatientDetail}
              onDeletePatient={handleDeletePatient}
              isLoading={isLoading}
            />
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {viewMode === 'create' ? 'Add New Patient' :
             viewMode === 'edit' ? 'Edit Patient' :
             viewMode === 'detail' ? 'Patient Details' : 'Patients'}
          </h1>

          {viewMode !== 'list' && (
            <Button
              variant="secondary"
              onClick={handleCancel}
            >
              Back to List
            </Button>
          )}
        </div>

        {/* Notification component */}
        {notification && (
          <Notification
            type={notification.type}
            title={notification.title}
            message={notification.message}
            isVisible={notification.isVisible}
            onClose={hideNotification}
          />
        )}

        {/* Main content */}
        {renderContent()}
      </div>
    </DashboardLayout>
  );
};
