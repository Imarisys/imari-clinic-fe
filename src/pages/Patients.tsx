import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../context/TranslationContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PatientList } from '../components/patients/PatientList';
import { PatientForm } from '../components/patients/PatientForm';
import { PatientDetail } from '../components/patients/PatientDetail';
import { PatientSearch, PatientSearchFilters } from '../components/patients/PatientSearch';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Notification } from '../components/common/Notification';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { Pagination } from '../components/common/Pagination';
import { Patient, PatientCreate, PatientUpdate, PatientSummary } from '../types/Patient';
import { PatientService } from '../services/patientService';
import { useNotification } from '../context/NotificationContext';

type ViewMode = 'list' | 'grid' | 'create' | 'edit' | 'detail';

export const Patients: React.FC = () => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  // Patient summary state
  const [patientSummary, setPatientSummary] = useState<PatientSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const { showNotification } = useNotification();

  // Load patient summary statistics
  const loadPatientSummary = async () => {
    setSummaryLoading(true);
    try {
      const summary = await PatientService.getPatientSummary();
      setPatientSummary(summary);
    } catch (err) {
      console.error('Error loading patient summary:', err);
      // Don't show error notification for summary as it's not critical
    } finally {
      setSummaryLoading(false);
    }
  };

  // Load patients from API
  const loadPatients = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * itemsPerPage;
      const response = await PatientService.listPatients(offset, itemsPerPage);
      setPatients(response.data);
      setTotalPatients(response.total);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
      console.error('Error loading patients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Search patients using API
  const searchPatients = useCallback(async (query: string, page: number = 1) => {
    if (!query.trim()) {
      loadPatients(page);
      return;
    }

    setIsSearching(true);
    setError(null);
    try {
      const offset = (page - 1) * itemsPerPage;
      const response = await PatientService.searchPatients(query.trim(), offset, itemsPerPage);
      setPatients(response.data);
      setTotalPatients(response.total);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search patients');
      console.error('Error searching patients:', err);
    } finally {
      setIsSearching(false);
    }
  }, [itemsPerPage]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchPatients(searchQuery, 1);
      } else {
        loadPatients(1);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchPatients]);

  // Load initial data on component mount
  useEffect(() => {
    loadPatients(1);
    loadPatientSummary();
  }, []);

  // Reload patients when itemsPerPage changes
  useEffect(() => {
    loadPatients(1);
  }, [itemsPerPage]);

  // Handle page change for pagination
  const handlePageChange = (page: number) => {
    loadPatients(page);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setItemsPerPage(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Handle patient creation
  const handleCreatePatient = async (patientData: PatientCreate) => {
    setIsLoading(true);
    try {
      const newPatient = await PatientService.createPatient(patientData);
      setPatients(prev => [...prev, newPatient]);
      setViewMode('detail');
      setSelectedPatient(newPatient);
      setError(null);
      // Refresh summary statistics after creating a patient
      loadPatientSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create patient');
      console.error('Error creating patient:', err);
      // Re-throw the error so PatientForm can catch it and show appropriate notification
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Wrapper function for create form to handle union type
  const handleCreateFormSubmit = async (patientData: PatientCreate | PatientUpdate) => {
    await handleCreatePatient(patientData as PatientCreate);
  };

  // Handle patient update
  const handleUpdatePatient = async (patientId: string, patientData: PatientUpdate) => {
    setIsLoading(true);
    try {
      const updatedPatient = await PatientService.updatePatient(patientId, patientData);
      setPatients(prev => prev.map(p => p.id === patientId ? updatedPatient : p));
      setSelectedPatient(updatedPatient);
      setViewMode('detail');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update patient');
      console.error('Error updating patient:', err);
      // Re-throw the error so PatientForm can catch it and show appropriate notification
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle patient deletion
  const handleDeletePatient = async (patientId: string) => {
    setIsLoading(true);
    try {
      // Get patient info before deletion for notification
      const deletedPatient = patients.find(p => p.id === patientId);

      await PatientService.deletePatient(patientId);
      setPatients(prev => prev.filter(p => p.id !== patientId));
      setSelectedPatient(null);
      setViewMode('grid');

      // Refresh summary statistics after deleting a patient
      loadPatientSummary();

      // Show success notification
      if (deletedPatient) {
        showNotification(
          'success',
          'Patient Deleted!',
          `${deletedPatient.first_name} ${deletedPatient.last_name} has been successfully removed from your patient records.`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete patient');
      console.error('Error deleting patient:', err);

      // Show error notification
      showNotification(
        'error',
        'Deletion Failed',
        err instanceof Error ? err.message : 'Failed to delete patient. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirmation = (patient: Patient) => {
    setPatientToDelete(patient);
    setShowDeleteConfirmation(true);
  };

  // Handle confirmed deletion
  const handleConfirmDelete = async () => {
    if (patientToDelete) {
      await handleDeletePatient(patientToDelete.id);
      setShowDeleteConfirmation(false);
      setPatientToDelete(null);
    }
  };

  // Handle patient export
  const handleExportPatients = async () => {
    setIsExporting(true);
    try {
      await PatientService.exportPatients();
      showNotification('success', 'Export Successful', 'Patients data has been exported successfully');
    } catch (err) {
      console.error('Error exporting patients:', err);
      showNotification('error', 'Export Failed', err instanceof Error ? err.message : 'Failed to export patients');
    } finally {
      setIsExporting(false);
    }
  };

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

  // Remove the filteredPatients filter since we're now using API search
  const displayedPatients = patients;

  const renderHeader = () => (
    <div className="card mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-600 mb-2">Patients</h1>
          <p className="text-neutral-600">Manage your patient records and information</p>
          {error && (
            <div className="mt-2 p-3 bg-error-50 border border-error-200 rounded-lg">
              <p className="text-error-700 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-error-600 text-xs hover:text-error-800 mt-1"
              >
                Dismiss
              </button>
            </div>
          )}
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
          <Button
            variant="secondary"
            icon="refresh"
            onClick={() => loadPatients(currentPage)}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="secondary"
            icon="download"
            onClick={handleExportPatients}
            disabled={isExporting || isLoading}
          >
            {isExporting ? 'Exporting...' : 'Export'}
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
          <p className="text-2xl font-bold text-success-600">
            {summaryLoading ? '...' : patientSummary?.total_patients || patients.length}
          </p>
          <p className="text-sm text-neutral-600">Total Patients</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary-600">
            {summaryLoading ? '...' : patientSummary?.new_patients || 0}
          </p>
          <p className="text-sm text-neutral-600">New Patients</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {summaryLoading ? '...' : patientSummary?.patients_with_follow_up || 0}
          </p>
          <p className="text-sm text-neutral-600">Follow-up Patients</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary-600">
            {summaryLoading ? '...' : patientSummary?.patients_with_email || patients.filter(p => p.email).length}
          </p>
          <p className="text-sm text-neutral-600">With Email</p>
        </div>
      </div>
    </div>
  );

  const renderPatientCard = (patient: Patient, index: number) => (
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
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center shadow-medium text-white">
            <span className="text-xl font-semibold">
              {patient.first_name[0]}{patient.last_name[0]}
            </span>
          </div>
        </div>

        {/* Patient Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-neutral-800 truncate">
              {patient.first_name} {patient.last_name}
            </h3>
            {patient.date_of_birth && (
              <span className="text-sm text-neutral-500">
                Age {calculateAge(patient.date_of_birth)}
              </span>
            )}
          </div>

          <div className="space-y-1 text-sm text-neutral-600">
            {patient.email && (
              <div className="flex items-center space-x-2">
                <span className="material-icons-round text-lg">email</span>
                <span className="truncate">{patient.email}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <span className="material-icons-round text-lg">phone</span>
              <span>{patient.phone}</span>
            </div>
            {patient.city && patient.state && (
              <div className="flex items-center space-x-2">
                <span className="material-icons-round text-lg">location_on</span>
                <span>{patient.city}, {patient.state}</span>
              </div>
            )}
          </div>
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

  // Loading state
  if (isLoading && patients.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="loading-spinner w-12 h-12 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading patients...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const renderGridView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {displayedPatients.map((patient, index) => renderPatientCard(patient, index))}
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
              <th className="text-left py-4 px-6 font-semibold text-neutral-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedPatients.map((patient, index) => (
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

  // Handle create/edit form views
  if (viewMode === 'create') {
    return (
      <DashboardLayout>
        <div className="fade-in-element">
          <PatientForm
            onSubmit={handleCreateFormSubmit}
            onCancel={() => setViewMode('grid')}
            isLoading={isLoading}
          />
        </div>
      </DashboardLayout>
    );
  }

  if (viewMode === 'edit' && selectedPatient) {
    return (
      <DashboardLayout>
        <div className="fade-in-element">
          <PatientForm
            patient={selectedPatient}
            onSubmit={(data) => handleUpdatePatient(selectedPatient.id, data as PatientUpdate)}
            onCancel={() => setViewMode('detail')}
            isEditing={true}
            isLoading={isLoading}
          />
        </div>
      </DashboardLayout>
    );
  }

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
                <p className="text-neutral-600 mb-4">{selectedPatient.email || 'No email provided'}</p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-neutral-500">Age</p>
                    <p className="font-semibold">
                      {selectedPatient.date_of_birth ? calculateAge(selectedPatient.date_of_birth) : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Gender</p>
                    <p className="font-semibold capitalize">{selectedPatient.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Phone</p>
                    <p className="font-semibold">{selectedPatient.phone}</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  icon="edit"
                  onClick={() => setViewMode('edit')}
                >
                  Edit
                </Button>
                <Button
                  variant="primary"
                  icon="event"
                  onClick={() => {
                    // TODO: Navigate to appointment booking for this patient
                    console.log('Schedule appointment for', selectedPatient);
                  }}
                >
                  Schedule
                </Button>
                <Button
                  variant="danger"
                  icon="delete"
                  onClick={() => {
                    handleDeleteConfirmation(selectedPatient);
                  }}
                  disabled={isLoading}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-xl font-bold text-neutral-800 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-neutral-500">Email</p>
                  <p className="text-neutral-800">{selectedPatient.email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Phone</p>
                  <p className="text-neutral-800">{selectedPatient.phone}</p>
                </div>
                {selectedPatient.date_of_birth && (
                  <div>
                    <p className="text-sm text-neutral-500">Date of Birth</p>
                    <p className="text-neutral-800">{new Date(selectedPatient.date_of_birth).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="text-xl font-bold text-neutral-800 mb-4">Address</h3>
              <div className="space-y-3">
                {selectedPatient.street || selectedPatient.city || selectedPatient.state || selectedPatient.zip_code ? (
                  <>
                    {selectedPatient.street && (
                      <div>
                        <p className="text-sm text-neutral-500">Street</p>
                        <p className="text-neutral-800">{selectedPatient.street}</p>
                      </div>
                    )}
                    <div className="flex space-x-4">
                      {selectedPatient.city && (
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500">City</p>
                          <p className="text-neutral-800">{selectedPatient.city}</p>
                        </div>
                      )}
                      {selectedPatient.state && (
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500">State</p>
                          <p className="text-neutral-800">{selectedPatient.state}</p>
                        </div>
                      )}
                      {selectedPatient.zip_code && (
                        <div className="flex-1">
                          <p className="text-sm text-neutral-500">ZIP Code</p>
                          <p className="text-neutral-800">{selectedPatient.zip_code}</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-neutral-500 italic">No address information provided</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showDeleteConfirmation}
          onClose={() => setShowDeleteConfirmation(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Patient"
          message={`Are you sure you want to delete ${patientToDelete?.first_name} ${patientToDelete?.last_name}? This action cannot be undone and will permanently remove all patient data.`}
          confirmButtonText="Delete Patient"
          cancelButtonText="Cancel"
          isLoading={isLoading}
          variant="danger"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="fade-in-element">
        {renderHeader()}

        {viewMode === 'grid' && renderGridView()}
        {viewMode === 'list' && renderListView()}

        {displayedPatients.length === 0 && (
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

        {/* Pagination */}
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalItems={totalPatients}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};
