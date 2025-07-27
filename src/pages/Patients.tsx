import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../context/TranslationContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PatientList } from '../components/patients/PatientList';
import { PatientForm } from '../components/patients/PatientForm';
import { PatientDetail } from '../components/patients/PatientDetail';
import { PatientHistory } from '../components/patients/PatientHistory';
import { PatientSearch, PatientSearchFilters } from '../components/patients/PatientSearch';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Notification } from '../components/common/Notification';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { Pagination } from '../components/common/Pagination';
import { Patient, PatientCreate, PatientUpdate, PatientSummary, PatientWithAppointments } from '../types/Patient';
import { PatientService } from '../services/patientService';
import { useNotification } from '../context/NotificationContext';

type ViewMode = 'list' | 'grid' | 'create' | 'edit' | 'detail' | 'history';

export const Patients: React.FC = () => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedPatientWithHistory, setSelectedPatientWithHistory] = useState<PatientWithAppointments | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<any[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { showNotification } = useNotification();
  const location = useLocation();

  // Escape key listener for detail view
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewMode === 'detail') {
        setViewMode('grid');
      }
    };

    if (viewMode === 'detail') {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [viewMode]);

  // Reset to grid view when navigating to patients page
  useEffect(() => {
    if (location.pathname === '/patients') {
      setViewMode('grid');
      setSelectedPatient(null);
      setSelectedPatientWithHistory(null);
      setSearchQuery('');
    }
  }, [location.pathname]);

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

  // Load patient appointments for statistics
  const loadPatientAppointments = async (patientId: string) => {
    setAppointmentsLoading(true);
    try {
      const patientWithHistory = await PatientService.getPatientWithAppointments(patientId);
      setPatientAppointments(patientWithHistory.appointments || []);
    } catch (error) {
      console.error('Error loading patient appointments:', error);
      setPatientAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  // Load appointments when patient is selected for detail view
  useEffect(() => {
    if (selectedPatient && viewMode === 'detail') {
      loadPatientAppointments(selectedPatient.id);
    }
  }, [selectedPatient, viewMode]);

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

  // Handle refresh with animation
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadPatients(currentPage);
      await loadPatientSummary();
      showNotification('success', 'Refreshed', 'Patient data has been refreshed successfully');
    } catch (err) {
      console.error('Error refreshing data:', err);
      showNotification('error', 'Refresh Failed', 'Failed to refresh patient data');
    } finally {
      // Add a small delay to show the animation even if the request is very fast
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
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
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className={isRefreshing ? 'animate-spin' : ''}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
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
                
                {/* Contact and Address Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-3">Contact Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="material-icons-round text-lg text-gray-400">phone</span>
                        <span className="text-gray-800">{selectedPatient.phone}</span>
                      </div>
                      {selectedPatient.email && (
                        <div className="flex items-center space-x-2">
                          <span className="material-icons-round text-lg text-gray-400">email</span>
                          <span className="text-gray-800">{selectedPatient.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-3">Personal Information</h3>
                    <div className="space-y-2">
                      {selectedPatient.date_of_birth && (
                        <div className="flex items-center space-x-2">
                          <span className="material-icons-round text-lg text-gray-400">cake</span>
                          <span className="text-gray-800">
                            {new Date(selectedPatient.date_of_birth).toLocaleDateString()} 
                            <span className="text-gray-500 ml-2">
                              (Age {calculateAge(selectedPatient.date_of_birth)})
                            </span>
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <span className="material-icons-round text-lg text-gray-400">person</span>
                        <span className="text-gray-800 capitalize">{selectedPatient.gender || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-3">Address</h3>
                    <div className="space-y-2">
                      {selectedPatient.street || selectedPatient.city || selectedPatient.state || selectedPatient.zip_code ? (
                        <>
                          {selectedPatient.street && (
                            <div className="flex items-center space-x-2">
                              <span className="material-icons-round text-lg text-gray-400">home</span>
                              <span className="text-gray-800">{selectedPatient.street}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <span className="material-icons-round text-lg text-gray-400">location_on</span>
                            <span className="text-gray-800">
                              {[selectedPatient.city, selectedPatient.state, selectedPatient.zip_code]
                                .filter(Boolean)
                                .join(', ')}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="material-icons-round text-lg text-gray-400">location_off</span>
                          <span className="text-gray-500 italic">No address provided</span>
                        </div>
                      )}
                    </div>
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

          {/* Patient Statistics */}
          <div className="card mb-6">
            <h3 className="text-xl font-bold text-neutral-800 mb-4">Patient Statistics</h3>
            {appointmentsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="text-center p-4 bg-gray-50 rounded-lg animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-teal-50 rounded-lg border border-teal-100">
                  <div className="text-2xl font-bold text-teal-600">{patientAppointments.length}</div>
                  <div className="text-sm text-gray-600">Total Appointments</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="text-2xl font-bold text-green-600">
                    {patientAppointments.filter(apt => apt.status === 'Completed').length}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600">
                    {patientAppointments.filter(apt => apt.status === 'Booked' && new Date(apt.date) >= new Date()).length}
                  </div>
                  <div className="text-sm text-gray-600">Upcoming</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="text-2xl font-bold text-orange-600">
                    {patientAppointments.filter(apt => apt.status === 'Cancelled').length}
                  </div>
                  <div className="text-sm text-gray-600">Cancelled</div>
                </div>
              </div>
            )}
          </div>

          {/* Appointments List */}
          <div className="card">
            <h3 className="text-xl font-bold text-neutral-800 mb-4">Appointment History</h3>
            {appointmentsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : patientAppointments.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-8 0a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V8a1 1 0 00-1-1m-8 0h8m-4 4v4" />
                </svg>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h4>
                <p className="text-gray-500">This patient hasn't had any appointments yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {patientAppointments
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((appointment) => {
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'Completed':
                          return 'bg-green-100 text-green-800';
                        case 'Booked':
                          return 'bg-blue-100 text-blue-800';
                        case 'Cancelled':
                          return 'bg-red-100 text-red-800';
                        case 'No Show':
                          return 'bg-orange-100 text-orange-800';
                        case 'In Progress':
                          return 'bg-purple-100 text-purple-800';
                        default:
                          return 'bg-gray-100 text-gray-800';
                      }
                    };

                    const getTypeColor = (type: string) => {
                      switch (type) {
                        case 'Consultation':
                          return 'bg-indigo-100 text-indigo-800';
                        case 'Follow Up':
                          return 'bg-emerald-100 text-emerald-800';
                        case 'Emergency':
                          return 'bg-red-100 text-red-800';
                        case 'Routine Check':
                          return 'bg-amber-100 text-amber-800';
                        default:
                          return 'bg-gray-100 text-gray-800';
                      }
                    };

                    const formatDate = (dateString: string) => {
                      return new Date(dateString).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      });
                    };

                    const formatTime = (timeString: string) => {
                      const time = timeString.split('.')[0]; // Remove microseconds
                      const [hours, minutes] = time.split(':');
                      const hour = parseInt(hours);
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      const displayHour = hour % 12 || 12;
                      return `${displayHour}:${minutes} ${ampm}`;
                    };

                    return (
                      <div
                        key={appointment.id}
                        className="p-4 rounded-xl bg-white border-2 border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            {appointment.appointment_type_name ? (
                              <span className="block mb-2 text-base font-bold text-gray-900">{appointment.appointment_type_name}</span>
                            ) : null}
                            {appointment.title ? (
                              <h4 className="text-lg font-semibold text-gray-900">{appointment.title}</h4>
                            ) : null}
                          </div>
                          <div className="flex items-center justify-center h-full">
                            <span className={`px-4 py-2 text-sm font-medium rounded-full ${getStatusColor(appointment.status)}`}>{appointment.status}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <span className="material-icons-round text-base">calendar_today</span>
                            <span>{formatDate(appointment.date)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="material-icons-round text-base">schedule</span>
                            <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
                          </div>
                        </div>
                        
                        {appointment.notes && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Notes:</span> {appointment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
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

  if (viewMode === 'history' && selectedPatientWithHistory) {
    return (
      <PatientHistory
        patient={selectedPatientWithHistory}
        onBack={() => setViewMode('detail')}
        onScheduleNew={() => {
          // TODO: Navigate to appointment booking for this patient
          console.log('Schedule new appointment for', selectedPatientWithHistory);
        }}
      />
    );
  }

  // Handle patient history view
  const handleViewHistory = async (patient: Patient) => {
    try {
      setIsLoading(true);
      const patientWithHistory = await PatientService.getPatientWithAppointments(patient.id);
      setSelectedPatientWithHistory(patientWithHistory);
      setViewMode('history');
    } catch (error) {
      console.error('Error loading patient history:', error);
      showNotification('error', 'Error', 'Failed to load patient history');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="fade-in-element">
        {renderHeader()}

        {/* Patient List */}
        <div className="mt-6">
          {viewMode === 'grid' && renderGridView()}
          {viewMode === 'list' && renderListView()}

          {/* Pagination */}
          {totalPatients > itemsPerPage && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalItems={totalPatients}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
