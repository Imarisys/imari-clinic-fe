import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../context/TranslationContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PatientList } from '../components/patients/PatientList';
import { PatientForm } from '../components/patients/PatientForm';
import { PatientHistory } from '../components/patients/PatientHistory';
import { PatientPreconditions } from '../components/patients/PatientPreconditions';
import { PatientSearch, PatientSearchFilters } from '../components/patients/PatientSearch';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Notification } from '../components/common/Notification';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { Patient, PatientCreate, PatientUpdate, PatientSummary, PatientWithAppointments } from '../types/Patient';
import { PatientService } from '../services/patientService';
import { PreconditionService } from '../services/preconditionService';
import { PatientFileService } from '../services/patientFileService';
import { AppointmentService } from '../services/appointmentService';
import { AppointmentTypeService, AppointmentType } from '../services/appointmentTypeService';
import { AppointmentBookingForm } from '../components/patients/AppointmentBookingForm';
import { Appointment, AppointmentCreate } from '../types/Appointment';
import { PatientFileRead } from '../types/PatientFile';
import { useNotification } from '../context/NotificationContext';
import { SettingsService } from '../services/settingsService';

type ViewMode = 'list' | 'grid' | 'create' | 'edit' | 'detail' | 'history';
type PatientDetailTab = 'upcoming' | 'past' | 'files' | 'preconditions';

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

  // Patient detail tabs state
  const [activePatientTab, setActivePatientTab] = useState<PatientDetailTab>('upcoming');
  const [patientFiles, setPatientFiles] = useState<PatientFileRead[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [patientPreconditions, setPatientPreconditions] = useState<any>(null);
  const [loadingPreconditions, setLoadingPreconditions] = useState(false);

  // Patient summary state
  const [patientSummary, setPatientSummary] = useState<PatientSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // File management state - Add these new state variables
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileViewMode, setFileViewMode] = useState<'grid' | 'list'>('grid');
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    file: PatientFileRead | null;
    imageUrl: string | null;
  }>({
    isOpen: false,
    file: null,
    imageUrl: null
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Add appointment booking state
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedPatientForBooking, setSelectedPatientForBooking] = useState<Patient | null>(null);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [appointmentTypesLoading, setAppointmentTypesLoading] = useState(false);

  // Working hours from settings
  const [workingHours, setWorkingHours] = useState({
    startTime: '08:00',
    endTime: '17:00'
  });

  const { showNotification } = useNotification();
  const location = useLocation();

  // ESC key listener for edit mode
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && viewMode === 'edit') {
        setViewMode('detail');
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
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

    // Load settings for working hours
    const loadSettings = async () => {
      try {
        const settings = await SettingsService.getSettings();
        console.log('Patients - Settings loaded:', settings);
        console.log('Patients - appointments_start_time:', settings.appointments_start_time);
        console.log('Patients - appointments_end_time:', settings.appointments_end_time);

        const newWorkingHours = {
          startTime: settings.appointments_start_time || '08:00',
          endTime: settings.appointments_end_time || '17:00'
        };

        console.log('Patients - Setting working hours to:', newWorkingHours);
        setWorkingHours(newWorkingHours);
      } catch (error) {
        console.error('Patients - Failed to fetch settings:', error);
      }
    };

    loadSettings();
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

  // Load patient files
  const loadPatientFiles = async (patientId: string) => {
    setLoadingFiles(true);
    try {
      const response = await PatientFileService.getPatientFiles(patientId);
      setPatientFiles(response.files);

      // Fetch thumbnails for image files
      fetchThumbnails(response.files, patientId);
    } catch (error) {
      console.error('Error loading patient files:', error);
      setPatientFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  // Function to fetch thumbnails for image files
  const fetchThumbnails = async (files: PatientFileRead[], patientId: string) => {
    const imageFiles = files.filter(file => PatientFileService.isImageFile(file));

    // Fetch thumbnails in parallel for all image files
    const thumbnailPromises = imageFiles.map(async (file) => {
      try {
        const thumbnailUrl = await PatientFileService.getThumbnailBlob(patientId, file.id);
        return { fileId: file.id, thumbnailUrl };
      } catch (error) {
        console.error(`Failed to fetch thumbnail for file ${file.id}:`, error);
        return { fileId: file.id, thumbnailUrl: null };
      }
    });

    const thumbnailResults = await Promise.all(thumbnailPromises);

    // Update thumbnail URLs state
    const newThumbnailUrls: Record<string, string> = {};
    thumbnailResults.forEach(({ fileId, thumbnailUrl }) => {
      if (thumbnailUrl) {
        newThumbnailUrls[fileId] = thumbnailUrl;
      }
    });

    setThumbnailUrls(newThumbnailUrls);
  };

  // Function to handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedPatient?.id) return;

    try {
      setUploadingFile(true);
      const fileData = { file };
      await PatientFileService.uploadPatientFile(selectedPatient.id, fileData);
      showNotification('success', t('success'), t('file_uploaded_successfully'));
      loadPatientFiles(selectedPatient.id); // Refresh the files list
    } catch (error) {
      console.error('Failed to upload file:', error);
      showNotification('error', t('error'), t('failed_to_upload_file'));
    } finally {
      setUploadingFile(false);
      // Reset the input
      event.target.value = '';
    }
  };

  // Function to handle file preview
  const handleFilePreview = async (file: PatientFileRead) => {
    if (!selectedPatient?.id) return;

    if (PatientFileService.isImageFile(file)) {
      // For images, show full-size image in modal popup using preview URL
      try {
        const previewUrl = PatientFileService.getPreviewUrl(selectedPatient.id, file.id);
        setPreviewModal({
          isOpen: true,
          file: file,
          imageUrl: previewUrl
        });
      } catch (error) {
        console.error('Failed to load image preview:', error);
        showNotification('error', t('error'), t('failed_to_load_image_preview'));
      }
    } else {
      // For non-images, open preview URL in new window
      const previewUrl = PatientFileService.getPreviewUrl(selectedPatient.id, file.id);
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Function to handle file download
  const handleFileDownload = async (file: PatientFileRead) => {
    if (!selectedPatient?.id) return;

    try {
      await PatientFileService.downloadFile(selectedPatient.id, file.id, file.filename);
    } catch (error) {
      console.error('Failed to download file:', error);
      showNotification('error', t('error'), t('failed_to_download_file'));
    }
  };

  // Function to handle file deletion
  const handleFileDelete = async (file: PatientFileRead) => {
    if (!selectedPatient?.id) return;

    if (!window.confirm(t('confirm_delete_file', { filename: file.filename }))) {
      return;
    }

    try {
      await PatientFileService.deletePatientFile(selectedPatient.id, file.id);
      showNotification('success', t('success'), t('file_deleted_successfully'));
      loadPatientFiles(selectedPatient.id); // Refresh the files list
    } catch (error) {
      console.error('Failed to delete file:', error);
      showNotification('error', t('error'), t('failed_to_delete_file'));
    }
  };

  // Load patient preconditions
  const loadPatientPreconditions = async (patientId: string) => {
    setLoadingPreconditions(true);
    try {
      // Use the new PreconditionService instead of PatientService
      const response = await PreconditionService.getPatientPreconditions(patientId);
      setPatientPreconditions(response.data || []);
    } catch (error) {
      console.error('Error loading patient preconditions:', error);
      setPatientPreconditions([]);
    } finally {
      setLoadingPreconditions(false);
    }
  };

  // Load appointments when patient is selected for detail view
  useEffect(() => {
    if (selectedPatient && viewMode === 'detail') {
      loadPatientAppointments(selectedPatient.id);
      // Load patient files and preconditions when detail view is opened
      loadPatientFiles(selectedPatient.id);
      loadPatientPreconditions(selectedPatient.id);
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

      // Get backend message
      const backendMessage = await PatientService.deletePatient(patientId);
      setPatients(prev => prev.filter(p => p.id !== patientId));
      setSelectedPatient(null);
      setViewMode('grid');

      // Refresh summary statistics after deleting a patient
      loadPatientSummary();

      // Show success notification with backend message
      showNotification(
        'success',
        t('patient_deleted'),
        backendMessage
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed_to_delete_patient'));
      console.error('Error deleting patient:', err);
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
      showNotification('success', t('export_successful'), t('patients_data_exported_successfully'));
    } catch (err) {
      console.error('Error exporting patients:', err);
      showNotification('error', t('export_failed'), err instanceof Error ? err.message : t('failed_to_export_patients'));
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
      showNotification('success', t('refreshed'), t('patient_data_refreshed_successfully'));
    } catch (err) {
      console.error('Error refreshing data:', err);
      showNotification('error', t('refresh_failed'), t('failed_to_refresh_patient_data'));
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
          <h1 className="text-3xl font-bold text-primary-600 mb-2">{t('patients')}</h1>
          <p className="text-neutral-600">{t('manage_patient_records')}</p>
          {error && (
            <div className="mt-2 p-3 bg-error-50 border border-error-200 rounded-lg">
              <p className="text-error-700 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-error-600 text-xs hover:text-error-800 mt-1"
              >
                {t('dismiss')}
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
            placeholder={t('search_patients_placeholder')}
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
            {isRefreshing ? t('refreshing') : t('refresh')}
          </Button>
          <Button
            variant="secondary"
            icon="download"
            onClick={handleExportPatients}
            disabled={isExporting || isLoading}
          >
            {isExporting ? t('exporting') : t('export')}
          </Button>
          <Button
            variant="primary"
            icon="person_add"
            onClick={() => setViewMode('create')}
          >
            {t('add_patient')}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-neutral-200">
        <div className="text-center">
          <p className="text-lg font-semibold text-success-600">
            {summaryLoading ? '...' : patientSummary?.total_patients || patients.length}
          </p>
          <p className="text-xs text-neutral-600">{t('total_patients')}</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-primary-600">
            {summaryLoading ? '...' : patientSummary?.new_patients || 0}
          </p>
          <p className="text-xs text-neutral-600">{t('new_patients')}</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-blue-600">
            {summaryLoading ? '...' : patientSummary?.patients_with_follow_up || 0}
          </p>
          <p className="text-xs text-neutral-600">{t('follow_up_patients')}</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-primary-600">
            {summaryLoading ? '...' : patientSummary?.patients_with_email || patients.filter(p => p.email).length}
          </p>
          <p className="text-xs text-neutral-600">{t('with_email')}</p>
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
                {t('age')} {calculateAge(patient.date_of_birth)}
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
            <p className="text-neutral-600">{t('loading_patients')}</p>
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
              <th className="text-left py-4 px-6 font-semibold text-neutral-700">{t('patient')}</th>
              <th className="text-left py-4 px-6 font-semibold text-neutral-700">{t('contact')}</th>
              <th className="text-left py-4 px-6 font-semibold text-neutral-700">{t('age')}</th>
              <th className="text-left py-4 px-6 font-semibold text-neutral-700">{t('actions')}</th>
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
          <div className="mb-6">
            <button
              onClick={() => setViewMode('grid')}
              className="btn-secondary mb-4"
            >
              <span className="material-icons-round mr-2">arrow_back</span>
              {t('back_to_patients')}
            </button>
          </div>
          <PatientForm
            onSubmit={handleCreateFormSubmit}
            onCancel={() => setViewMode('grid')}
            isLoading={isLoading}
            fullWidth={true}
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
            fullWidth={true}
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
                    <h3 className="text-lg font-medium text-gray-700 mb-3">{t('contact_information')}</h3>
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
                    <h3 className="text-lg font-medium text-gray-700 mb-3">{t('personal_information')}</h3>
                    <div className="space-y-2">
                      {selectedPatient.date_of_birth && (
                        <div className="flex items-center space-x-2">
                          <span className="material-icons-round text-lg text-gray-400">cake</span>
                          <span className="text-gray-800">
                            {new Date(selectedPatient.date_of_birth).toLocaleDateString()} 
                            <span className="text-gray-500 ml-2">
                              ({t('age')} {calculateAge(selectedPatient.date_of_birth)})
                            </span>
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <span className="material-icons-round text-lg text-gray-400">person</span>
                        <span className="text-gray-800 capitalize">{selectedPatient.gender || t('not_specified')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-3">{t('address')}</h3>
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
                          <span className="text-gray-500 italic">{t('no_address_provided')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setViewMode('grid')}
                  className="btn-secondary"
                  title={t('back_to_patients')}
                >
                  <span className="material-icons-round">arrow_back</span>
                </button>
                <Button
                  variant="secondary"
                  icon="edit"
                  onClick={() => setViewMode('edit')}
                >
                  {t('edit')}
                </Button>
                <Button
                  variant="primary"
                  icon="event"
                  onClick={() => {
                    setSelectedPatientForBooking(selectedPatient);
                    setShowAppointmentModal(true);
                  }}
                >
                  {t('schedule')}
                </Button>
                <Button
                  variant="danger"
                  icon="delete"
                  onClick={() => {
                    handleDeleteConfirmation(selectedPatient);
                  }}
                  disabled={isLoading}
                >
                  {t('delete')}
                </Button>
              </div>
            </div>
          </div>

          {/* Patient Detail Tabs */}
          <div className="mb-6">
            <div className="flex space-x-2">
              <Button
                variant={activePatientTab === 'upcoming' ? 'primary' : 'secondary'}
                onClick={() => setActivePatientTab('upcoming')}
                className="flex-1"
              >
                {t('upcoming_appointments')}
              </Button>
              <Button
                variant={activePatientTab === 'past' ? 'primary' : 'secondary'}
                onClick={() => setActivePatientTab('past')}
                className="flex-1"
              >
                {t('past_appointments')}
              </Button>
              <Button
                variant={activePatientTab === 'files' ? 'primary' : 'secondary'}
                onClick={() => setActivePatientTab('files')}
                className="flex-1"
              >
                {t('patient_files')}
              </Button>
              <Button
                variant={activePatientTab === 'preconditions' ? 'primary' : 'secondary'}
                onClick={() => setActivePatientTab('preconditions')}
                className="flex-1"
              >
                {t('preconditions')}
              </Button>
            </div>
          </div>

          {/* Patient Detail Content */}
          <div className="card p-4">
            {activePatientTab === 'upcoming' && (
              <div>
                <h4 className="text-lg font-semibold text-neutral-800 mb-4">{t('upcoming_appointments')}</h4>
                {appointmentsLoading ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ) : patientAppointments.filter(apt => new Date(apt.date) >= new Date()).length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-blue-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-8 0a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V8a1 1 0 00-1-1m-8 0h8m-4 4v4" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">{t('no_upcoming_appointments')}</h4>
                    <p className="text-gray-500">{t('schedule_new_appointment')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patientAppointments
                      .filter(apt => new Date(apt.date) >= new Date())
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
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
                            className={`p-3 rounded-xl bg-white border-2 hover:shadow-md transition-all duration-200 ${
                              appointment.status === 'Completed' ? 'border-green-200' :
                              appointment.status === 'Booked' ? 'border-blue-200' :
                              appointment.status === 'Cancelled' ? 'border-red-200' :
                              appointment.status === 'No Show' ? 'border-orange-200' :
                              appointment.status === 'In Progress' ? 'border-purple-200' :
                              'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex-1">
                                {appointment.appointment_type_name && (
                                  <span className="block mb-1 text-base font-bold text-gray-900">{appointment.appointment_type_name}</span>
                                )}
                                {appointment.title && (
                                  <h4 className="text-lg font-semibold text-gray-900">{appointment.title}</h4>
                                )}
                              </div>

                              {/* Action Buttons for Upcoming Appointments */}
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log('Edit appointment:', appointment.id);
                                    // TODO: Implement edit appointment functionality
                                  }}
                                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs transition-all duration-300"
                                  title={t('edit_appointment')}
                                >
                                  <span className="material-icons-round text-sm mr-1">edit</span>
                                  {t('edit')}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log('Delete appointment:', appointment.id);
                                    // TODO: Implement delete appointment functionality
                                  }}
                                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs transition-all duration-300"
                                  title={t('delete_appointment')}
                                >
                                  <span className="material-icons-round text-sm mr-1">delete</span>
                                  {t('delete')}
                                </button>
                              </div>
                            </div>

                            {/* Date, Time and Status in one line */}
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <span className="material-icons-round text-base text-blue-500">calendar_today</span>
                                  <span>{formatDate(appointment.date)}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="material-icons-round text-base text-blue-500">schedule</span>
                                  <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
                                </div>
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                                  {appointment.status}
                                </span>
                              </div>
                            </div>

                            {appointment.notes && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">{t('notes')}:</span> {appointment.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {activePatientTab === 'past' && (
              <div>
                <h4 className="text-lg font-semibold text-neutral-800 mb-4">{t('past_appointments')}</h4>
                {appointmentsLoading ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ) : patientAppointments.filter(apt => new Date(apt.date) < new Date()).length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">{t('no_past_appointments')}</h4>
                    <p className="text-gray-500">{t('appointment_history_will_appear_here')}</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {patientAppointments
                      .filter(apt => new Date(apt.date) < new Date())
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
                            className={`p-3 rounded-xl bg-white border-2 hover:shadow-md transition-all duration-200 ${
                              appointment.status === 'Completed' ? 'border-green-200' :
                              appointment.status === 'Booked' ? 'border-blue-200' :
                              appointment.status === 'Cancelled' ? 'border-red-200' :
                              appointment.status === 'No Show' ? 'border-orange-200' :
                              appointment.status === 'In Progress' ? 'border-purple-200' :
                              'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex-1">
                                {appointment.appointment_type_name && (
                                  <span className="block mb-1 text-base font-bold text-gray-900">{appointment.appointment_type_name}</span>
                                )}
                                {appointment.title && (
                                  <h4 className="text-lg font-semibold text-gray-900">{appointment.title}</h4>
                                )}
                              </div>

                              {/* Action Buttons for Past Appointments */}
                              <div className="flex items-center space-x-2">
                                {appointment.status === 'Completed' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log('View consultation details:', appointment.id);
                                    }}
                                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs transition-all duration-300"
                                    title={t('view_details')}
                                  >
                                    <span className="material-icons-round text-sm mr-1">description</span>
                                    {t('details')}
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log('Edit appointment:', appointment.id);
                                  }}
                                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs transition-all duration-300"
                                  title={t('edit')}
                                >
                                  <span className="material-icons-round text-sm mr-1">edit</span>
                                  {t('edit')}
                                </button>
                              </div>
                            </div>

                            {/* Date, Time and Status in one line */}
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <span className="material-icons-round text-base text-gray-500">calendar_today</span>
                                  <span>{formatDate(appointment.date)}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="material-icons-round text-base text-gray-500">schedule</span>
                                  <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
                                </div>
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                                  {appointment.status}
                                </span>
                              </div>
                            </div>

                            {appointment.notes && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">{t('notes')}:</span> {appointment.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                </div>
                )}
              </div>
            )}

            {activePatientTab === 'files' && (
              <div className="space-y-4">
                <div className="bg-neutral-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-neutral-800">{t('patient_files')}</h4>
                    <div className="flex items-center space-x-2">
                      {/* File Upload Button */}
                      <label className="flex items-center space-x-2 bg-primary-50 text-primary-600 px-3 py-2 rounded-lg hover:bg-primary-100 transition-colors border border-primary-200 cursor-pointer">
                        <span className="material-icons-round text-sm">upload_file</span>
                        <span className="text-sm font-medium">
                          {uploadingFile ? t('uploading') : t('upload_file')}
                        </span>
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          disabled={uploadingFile}
                          className="hidden"
                          accept="*/*"
                        />
                      </label>

                      {/* View Mode Toggle */}
                      <button
                        onClick={() => setFileViewMode(fileViewMode === 'grid' ? 'list' : 'grid')}
                        className="flex items-center space-x-2 bg-white text-neutral-600 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors border border-neutral-200"
                      >
                        <span className="material-icons-round text-sm">
                          {fileViewMode === 'grid' ? 'view_list' : 'grid_view'}
                        </span>
                        <span className="text-sm font-medium">{fileViewMode === 'grid' ? t('list') : t('grid')}</span>
                      </button>
                    </div>
                  </div>

                  {loadingFiles ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-neutral-600">{t('loading_files')}</p>
                    </div>
                  ) : fileViewMode === 'grid' ? (
                    /* Grid View */
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {patientFiles.map((file) => (
                        <div key={file.id} className="bg-white rounded-xl p-4 border-2 border-neutral-100 hover:border-primary-200 transition-all hover:shadow-lg group cursor-pointer">
                          <div className="flex flex-col items-center space-y-3">
                            {/* File Icon/Thumbnail */}
                            <div className="w-20 h-20 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-primary-50 group-hover:to-primary-100 transition-all duration-200 relative overflow-hidden border border-blue-100 group-hover:border-primary-200 shadow-sm">
                              {PatientFileService.isImageFile(file) && thumbnailUrls[file.id] ? (
                                <img
                                  src={thumbnailUrls[file.id]}
                                  alt={file.filename}
                                  className="w-full h-full object-cover rounded-xl transition-transform group-hover:scale-105"
                                  onError={(e) => {
                                    // Fallback to icon if thumbnail fails
                                    const target = e.target as HTMLImageElement;
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<span class="material-icons-round text-blue-600 text-2xl">${PatientFileService.getFileIcon(file)}</span>`;
                                    }
                                  }}
                                />
                              ) : (
                                <span className="material-icons-round text-blue-600 text-2xl group-hover:text-primary-600 transition-colors">
                                  {PatientFileService.getFileIcon(file)}
                                </span>
                              )}
                            </div>

                            {/* File Info */}
                            <div className="text-center w-full space-y-1">
                              <p className="text-sm font-semibold text-neutral-800 truncate w-full leading-tight" title={file.filename}>
                                {file.filename}
                              </p>
                              <p className="text-xs text-neutral-500 font-medium">
                                {new Date(file.upload_date).toLocaleDateString()}
                              </p>
                              {file.description && (
                                <p className="text-xs text-neutral-600 mt-1 italic truncate leading-tight" title={file.description}>
                                  {file.description}
                                </p>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-2 mt-3 transition-opacity duration-200">
                              <button
                                onClick={() => handleFilePreview(file)}
                                className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-all hover:scale-105 shadow-sm border border-blue-100"
                                title={PatientFileService.isImageFile(file) ? t('preview_image') : t('open_file')}
                              >
                                <span className="material-icons-round text-base">
                                  {PatientFileService.isImageFile(file) ? 'visibility' : 'open_in_new'}
                                </span>
                              </button>
                              <button
                                onClick={() => handleFileDownload(file)}
                                className="w-9 h-9 bg-green-50 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-100 transition-all hover:scale-105 shadow-sm border border-green-100"
                                title={t('download_file')}
                              >
                                <span className="material-icons-round text-base">download</span>
                              </button>
                              <button
                                onClick={() => handleFileDelete(file)}
                                className="w-9 h-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all hover:scale-105 shadow-sm border border-red-100"
                                title={t('delete_file')}
                              >
                                <span className="material-icons-round text-base">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* List View */
                    <div className="space-y-3">
                      {patientFiles.map((file) => (
                        <div key={file.id} className="bg-white rounded-xl p-4 border-2 border-neutral-100 hover:border-primary-200 transition-all hover:shadow-md group">
                          <div className="flex items-center space-x-4">
                            {/* File Icon/Thumbnail */}
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-primary-50 group-hover:to-primary-100 transition-all duration-200 relative overflow-hidden flex-shrink-0 border border-blue-100 group-hover:border-primary-200 shadow-sm">
                              {PatientFileService.isImageFile(file) && thumbnailUrls[file.id] ? (
                                <img
                                  src={thumbnailUrls[file.id]}
                                  alt={file.filename}
                                  className="w-full h-full object-cover rounded-xl transition-transform group-hover:scale-105"
                                  onError={(e) => {
                                    // Fallback to icon if thumbnail fails
                                    const target = e.target as HTMLImageElement;
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<span class="material-icons-round text-blue-600 text-xl group-hover:text-primary-600 transition-colors">${PatientFileService.getFileIcon(file)}</span>`;
                                    }
                                  }}
                                />
                              ) : (
                                <span className="material-icons-round text-blue-600 text-xl group-hover:text-primary-600 transition-colors">
                                  {PatientFileService.getFileIcon(file)}
                                </span>
                              )}
                            </div>

                            {/* File Details */}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-neutral-800 truncate leading-tight">{file.filename}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <p className="text-sm text-neutral-500 font-medium">
                                  {file.file_type.toUpperCase()}
                                </p>
                              </div>
                              {file.description && (
                                <p className="text-sm text-neutral-600 mt-1 italic truncate leading-tight" title={file.description}>
                                  {file.description}
                                </p>
                              )}
                            </div>

                            {/* Upload Date */}
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm text-neutral-600 font-medium">
                                {new Date(file.upload_date).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-neutral-400">
                                {new Date(file.upload_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-2 flex-shrink-0 opacity-100 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleFilePreview(file)}
                                className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-all hover:scale-105 shadow-sm border border-blue-100"
                                title={PatientFileService.isImageFile(file) ? t('preview_image') : t('open_file')}
                              >
                                <span className="material-icons-round text-base">
                                  {PatientFileService.isImageFile(file) ? 'visibility' : 'open_in_new'}
                                </span>
                              </button>
                              <button
                                onClick={() => handleFileDownload(file)}
                                className="w-9 h-9 bg-green-50 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-100 transition-all hover:scale-105 shadow-sm border border-green-100"
                                title={t('download_file')}
                              >
                                <span className="material-icons-round text-base">download</span>
                              </button>
                              <button
                                onClick={() => handleFileDelete(file)}
                                className="w-9 h-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all hover:scale-105 shadow-sm border border-red-100"
                                title={t('delete_file')}
                              >
                                <span className="material-icons-round text-base">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activePatientTab === 'preconditions' && (
              <div>
                <PatientPreconditions
                  patientId={selectedPatient.id}
                  isEditable={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showDeleteConfirmation}
          onClose={() => setShowDeleteConfirmation(false)}
          onConfirm={handleConfirmDelete}
          title={t('delete_patient')}
          message={t('delete_patient_confirmation', {
            firstName: patientToDelete?.first_name || '',
            lastName: patientToDelete?.last_name || ''
          })}
          confirmButtonText={t('delete_patient')}
          cancelButtonText={t('cancel')}
          isLoading={isLoading}
          variant="danger"
        />

        {/* Appointment Booking Modal */}
        {showAppointmentModal && selectedPatientForBooking && (
          <Modal
            isOpen={showAppointmentModal}
            onClose={() => setShowAppointmentModal(false)}
            title={t('schedule_appointment')}
            size="xl"
          >
            <AppointmentBookingForm
              patient={selectedPatientForBooking}
              onSubmit={async (appointmentData: AppointmentCreate) => {
                setAppointmentLoading(true);
                try {
                  const newAppointment = await AppointmentService.createAppointment(appointmentData);

                  // Refresh patient appointments
                  if (selectedPatientForBooking) {
                    await loadPatientAppointments(selectedPatientForBooking.id);
                  }

                  showNotification('success', t('appointment_scheduled'), t('appointment_scheduled_successfully'));
                  setShowAppointmentModal(false);
                  setSelectedPatientForBooking(null);
                } catch (err) {
                  console.error('Error scheduling appointment:', err);
                  showNotification('error', t('failed_to_schedule'), err instanceof Error ? err.message : t('failed_to_schedule_appointment'));
                } finally {
                  setAppointmentLoading(false);
                }
              }}
              onCancel={() => {
                setShowAppointmentModal(false);
                setSelectedPatientForBooking(null);
              }}
              isLoading={appointmentLoading}
              workingHours={workingHours}
            />
          </Modal>
        )}

        {/* File Preview Modal */}
        {previewModal.isOpen && previewModal.file && (
          <Modal
            isOpen={previewModal.isOpen}
            onClose={() => setPreviewModal({ isOpen: false, file: null, imageUrl: null })}
            title={t('file_preview')}
            size="lg"
          >
            <div className="flex items-center justify-center">
              {PatientFileService.isImageFile(previewModal.file) ? (
                <img
                  src={previewModal.imageUrl || ''}
                  alt={previewModal.file.filename}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <span className="material-icons-round text-6xl text-gray-300">
                    {PatientFileService.getFileIcon(previewModal.file)}
                  </span>
                  <p className="mt-4 text-gray-500">{t('preview_not_available')}</p>
                </div>
              )}
            </div>
          </Modal>
        )}
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
      showNotification('error', t('failed_to_load_history'), t('unable_to_load_patient_history'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {renderHeader()}

      {/* Patient List / Grid View */}
      <div className="fade-in-element">
        {viewMode === 'grid' && (
          <>
            {patients.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9 7 9-7M4 7h16" />
                </svg>
                <h4 className="text-lg font-medium text-gray-900 mb-2">{t('no_patients_found')}</h4>
                <p className="text-gray-500">{t('start_by_adding_patient')}</p>
              </div>
            )}

            {patients.length > 0 && renderGridView()}
          </>
        )}

        {viewMode === 'list' && renderListView()}
      </div>
    </DashboardLayout>
  );
};

