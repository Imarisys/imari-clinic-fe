import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { AppointmentService } from '../services/appointmentService';
import { PatientService } from '../services/patientService';
import { Appointment, AppointmentCreate } from '../types/Appointment';
import { AppointmentMedicalData, VitalSign, PatientMedicalHistory } from '../types/Medical';
import { useNotification } from '../context/NotificationContext';
import { AppointmentBookingForm } from '../components/patients/AppointmentBookingForm';
import { Modal } from '../components/common/Modal';

// Predefined vital signs with their units and styling
const VITAL_SIGN_OPTIONS = [
  { name: 'Heart Rate', unit: 'bpm', icon: 'monitor_heart', color: 'red' },
  { name: 'Blood Pressure', unit: 'mmHg', icon: 'favorite', color: 'pink' },
  { name: 'Temperature', unit: '°C', icon: 'device_thermostat', color: 'orange' },
  { name: 'Weight', unit: 'kg', icon: 'monitor_weight', color: 'blue' },
  { name: 'Height', unit: 'cm', icon: 'height', color: 'green' },
  { name: 'Oxygen Saturation', unit: '%', icon: 'air', color: 'purple' },
  { name: 'Respiratory Rate', unit: 'breaths/min', icon: 'air', color: 'indigo' },
  { name: 'Blood Sugar', unit: 'mg/dL', icon: 'bloodtype', color: 'rose' },
  { name: 'Pulse', unit: 'bpm', icon: 'favorite', color: 'red' },
];

export const AppointmentStart: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [medicalData, setMedicalData] = useState<AppointmentMedicalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingMedicalData, setSavingMedicalData] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [isCreatingFollowUp, setIsCreatingFollowUp] = useState(false);
  const [activeTab, setActiveTab] = useState<'vitals' | 'consultation' | 'files'>('consultation');

  // Medical data fields
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [prescription, setPrescription] = useState('');

  // Vital signs - only show 3 by default
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([
    { id: '1', name: 'Heart Rate', value: '', unit: 'bpm', icon: 'monitor_heart', color: 'red' },
    { id: '2', name: 'Blood Pressure', value: '', unit: 'mmHg', icon: 'favorite', color: 'pink' },
    { id: '3', name: 'Temperature', value: '', unit: '°C', icon: 'device_thermostat', color: 'orange' }
  ]);

  // Show vital signs history modal
  const [showVitalHistory, setShowVitalHistory] = useState(false);
  const [showDiagnosisHistory, setShowDiagnosisHistory] = useState(false);
  const [showTreatmentHistory, setShowTreatmentHistory] = useState(false);
  const [showPrescriptionHistory, setShowPrescriptionHistory] = useState(false);
  const [patientHistory, setPatientHistory] = useState<PatientMedicalHistory | null>(null);
  const [expandedHistoryItems, setExpandedHistoryItems] = useState<Set<string>>(new Set());

  // Mock uploaded files data
  const [uploadedFiles] = useState([
    { id: '1', name: 'X-Ray_Chest.jpg', type: 'image', size: '2.3 MB', uploadDate: '2024-08-01', url: '/api/files/xray1.jpg' },
    { id: '2', name: 'Blood_Test_Results.pdf', type: 'pdf', size: '156 KB', uploadDate: '2024-08-01', url: '/api/files/blood_test.pdf' },
    { id: '3', name: 'MRI_Scan.dcm', type: 'dicom', size: '45.2 MB', uploadDate: '2024-07-28', url: '/api/files/mri_scan.dcm' },
    { id: '4', name: 'ECG_Reading.pdf', type: 'pdf', size: '234 KB', uploadDate: '2024-07-25', url: '/api/files/ecg.pdf' },
    { id: '5', name: 'Ultrasound.mp4', type: 'video', size: '12.8 MB', uploadDate: '2024-07-20', url: '/api/files/ultrasound.mp4' }
  ]);
  const [fileViewMode, setFileViewMode] = useState<'grid' | 'list'>('grid');

  // Timer for appointment duration
  useEffect(() => {
    if (isStarted) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isStarted]);

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!appointmentId) return;

      try {
        setLoading(true);
        const appointmentData = await AppointmentService.getAppointment(appointmentId);
        setAppointment(appointmentData);
      } catch (error) {
        console.error('Failed to fetch appointment:', error);
        showNotification('error', 'Error', 'Failed to load appointment details');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId, navigate, showNotification]);

  // Medical data functions
  const fetchMedicalData = async () => {
    if (!appointmentId) return;

    try {
      const data = await AppointmentService.getMedicalData(appointmentId);
      setMedicalData(data);

      // Populate form fields
      setDiagnosis(data.diagnosis || '');
      setTreatmentPlan(data.treatment_plan || '');
      setPrescription(data.prescription || '');

      // Populate vital signs from the API data
      if (data.vital_signs) {
        const vitalsFromApi = Object.entries(data.vital_signs).map(([key, value], index) => {
          const vitalOption = VITAL_SIGN_OPTIONS.find(option =>
            option.name.toLowerCase().replace(/\s+/g, '_') === key.toLowerCase()
          );

          return {
            id: (index + 1).toString(),
            name: vitalOption?.name || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: String(value),
            unit: vitalOption?.unit || '',
            icon: vitalOption?.icon || 'health_and_safety',
            color: vitalOption?.color || 'gray'
          };
        });

        if (vitalsFromApi.length > 0) {
          setVitalSigns(vitalsFromApi);
        }
      }
    } catch (error) {
      console.error('Failed to fetch medical data:', error);
      // Don't show error notification as medical data might not exist yet
    }
  };

  const saveMedicalData = async () => {
    if (!appointmentId) return;

    setSavingMedicalData(true);
    try {
      // Convert vital signs to the format expected by the API
      const vitalSignsObject: Record<string, string> = {};
      vitalSigns.forEach(vital => {
        if (vital.name && vital.value) {
          const key = vital.name.toLowerCase().replace(/\s+/g, '_');
          vitalSignsObject[key] = vital.value;
        }
      });

      const medicalDataUpdate = {
        diagnosis: diagnosis || null,
        treatment_plan: treatmentPlan || null,
        prescription: prescription || null,
        vital_signs: Object.keys(vitalSignsObject).length > 0 ? vitalSignsObject : null
      };

      const updatedData = await AppointmentService.updateMedicalData(appointmentId, medicalDataUpdate);
      setMedicalData(updatedData);
      // Remove the success notification for auto-saves - they should be silent
    } catch (error) {
      console.error('Failed to save medical data:', error);
      showNotification('error', 'Error', 'Failed to save medical data');
    } finally {
      setSavingMedicalData(false);
    }
  };

  // Auto-save medical data when fields change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isStarted && (diagnosis || treatmentPlan || prescription || vitalSigns.some(v => v.value))) {
        saveMedicalData();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [diagnosis, treatmentPlan, prescription, vitalSigns, isStarted]);

  // Fetch medical data when appointment is loaded
  useEffect(() => {
    if (appointment) {
      fetchMedicalData();
      fetchPatientHistory();
    }
  }, [appointment]);

  // Fetch patient medical history
  const fetchPatientHistory = async () => {
    if (!appointment?.patient_id) return;

    try {
      const history = await PatientService.getPatientMedicalHistory(appointment.patient_id);
      setPatientHistory(history);
    } catch (error) {
      console.error('Failed to fetch patient medical history:', error);
      // Don't show error notification as history might not exist
    }
  };

  const handleStartAppointment = () => {
    setIsStarted(true);
    setStartTime(new Date());
    showNotification('success', 'Appointment Started', 'You can now begin the consultation');
  };

  const handleEndAppointment = async () => {
    try {
      // Update appointment status to completed
      if (appointment) {
        await AppointmentService.updateAppointmentStatus(appointment.id, 'Completed');
        setIsCompleted(true);
        showNotification('success', 'Appointment Completed', 'The consultation has been marked as completed');
        // Don't navigate away - stay on the page
      }
    } catch (error) {
      console.error('Failed to end appointment:', error);
      showNotification('error', 'Error', 'Failed to complete appointment');
    }
  };

  // Add ESC key handler to navigate back to dashboard
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Only navigate to dashboard if no modals are open
        if (!showVitalHistory && !showDiagnosisHistory && !showTreatmentHistory && !showPrescriptionHistory && !showFollowUpModal) {
          navigate('/dashboard');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, showVitalHistory, showDiagnosisHistory, showTreatmentHistory, showPrescriptionHistory, showFollowUpModal]);

  const addVitalSign = () => {
    const newVital: VitalSign = {
      id: Date.now().toString(),
      name: '',
      value: '',
      unit: '',
      icon: 'health_and_safety',
      color: 'gray'
    };
    setVitalSigns(prev => [newVital, ...prev]); // Add to top instead of bottom

    // Scroll to the vital signs section after a brief delay to ensure the new item is rendered
    setTimeout(() => {
      const vitalSignsSection = document.querySelector('[data-vital-signs-section]');
      if (vitalSignsSection) {
        vitalSignsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const updateVitalSign = (id: string, field: keyof VitalSign, value: string) => {
    if (field === 'name') {
      // Auto-map unit, icon, and color when name is selected
      const selectedOption = VITAL_SIGN_OPTIONS.find(option => option.name === value);
      if (selectedOption) {
        setVitalSigns(prev => prev.map(vital =>
          vital.id === id ? {
            ...vital,
            name: value,
            unit: selectedOption.unit,
            icon: selectedOption.icon,
            color: selectedOption.color
          } : vital
        ));
        return;
      }
    }
    
    setVitalSigns(prev => prev.map(vital =>
      vital.id === id ? { ...vital, [field]: value } : vital
    ));
  };

  const removeVitalSign = (id: string) => {
    setVitalSigns(prev => prev.filter(vital => vital.id !== id));
  };

  const handleUploadFile = () => {
    // TODO: Implement file upload functionality
    showNotification('info', 'File Upload', 'File upload functionality coming soon');
  };

  const handleGeneratePrescription = () => {
    // TODO: Implement prescription generation
    showNotification('info', 'Generate Prescription', 'Prescription generation functionality coming soon');
  };

  const getElapsedTime = () => {
    if (!startTime) return '00:00:00';
    const diff = currentTime.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Follow-up appointment handlers
  const handleFollowUpClick = () => {
    setShowFollowUpModal(true);
  };

  const handleFollowUpSubmit = async (appointmentData: AppointmentCreate) => {
    try {
      setIsCreatingFollowUp(true);
      await AppointmentService.createAppointment(appointmentData);
      showNotification('success', 'Follow-up Appointment Created', 'The follow-up appointment has been scheduled successfully');
      setShowFollowUpModal(false);
    } catch (error) {
      console.error('Failed to create follow-up appointment:', error);
      showNotification('error', 'Error', 'Failed to create follow-up appointment');
    } finally {
      setIsCreatingFollowUp(false);
    }
  };

  const handleFollowUpCancel = () => {
    setShowFollowUpModal(false);
  };

  const handleVitalHistoryClick = () => {
    setShowVitalHistory(true);
  };

  const handleDiagnosisHistoryClick = () => {
    setShowDiagnosisHistory(true);
  };

  const handleTreatmentHistoryClick = () => {
    setShowTreatmentHistory(true);
  };

  const handlePrescriptionHistoryClick = () => {
    setShowPrescriptionHistory(true);
  };

  const toggleExpandHistoryItem = (id: string) => {
    setExpandedHistoryItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Helper to format time as HH:MM
  const formatTimeHHMM = (timeStr: string) => {
    if (!timeStr) return '';
    const [hh, mm] = timeStr.split(':');
    return `${hh}:${mm}`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading appointment details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!appointment) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <span className="material-icons-round text-6xl text-neutral-300 mb-4">error_outline</span>
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">Appointment Not Found</h2>
          <p className="text-neutral-600 mb-6">The requested appointment could not be found.</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Patient Info and Timer */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <span className="material-icons-round text-3xl">person</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {appointment.patient_first_name} {appointment.patient_last_name}
                </h1>
                <p className="text-primary-200 text-sm">
                  Scheduled: {new Date(appointment.date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="text-right">
              {isStarted ? (
                <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-primary-100 text-sm mb-1">Session Duration</p>
                  <p className="text-3xl font-mono font-bold">{getElapsedTime()}</p>
                </div>
              ) : (
                <button
                  onClick={handleStartAppointment}
                  className="bg-white text-primary-600 px-8 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <span className="material-icons-round mr-2 align-middle">play_arrow</span>
                  Start Appointment
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Top Bar with Appointment Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="material-icons-round text-blue-600">schedule</span>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Appointment Time</p>
                  <p className="font-semibold text-neutral-800">
                    {formatTimeHHMM(appointment.start_time)} - {formatTimeHHMM(appointment.end_time)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="material-icons-round text-green-600">medical_services</span>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Appointment Type</p>
                  <p className="font-semibold text-neutral-800">{appointment.appointment_type_name}</p>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleUploadFile}
                className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span className="material-icons-round text-sm">upload_file</span>
                <span className="text-sm font-medium">Upload File</span>
              </button>

              <button
                onClick={handleFollowUpClick}
                className="flex items-center space-x-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <span className="material-icons-round text-sm">event</span>
                <span className="text-sm font-medium">Follow Up</span>
              </button>

              <button
                onClick={handleGeneratePrescription}
                className="flex items-center space-x-2 bg-green-50 text-green-600 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors"
              >
                <span className="material-icons-round text-sm">prescription</span>
                <span className="text-sm font-medium">Generate Prescription</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-neutral-200 mb-6">
            <button
              onClick={() => setActiveTab('consultation')}
              className={`flex items-center space-x-2 px-6 py-3 font-medium transition-all duration-300 border-b-2 ${
                activeTab === 'consultation'
                  ? 'text-primary-600 border-primary-500'
                  : 'text-neutral-600 border-transparent hover:text-neutral-800'
              }`}
            >
              <span className="material-icons-round">medical_services</span>
              <span>Consultation</span>
            </button>

            <button
              onClick={() => setActiveTab('vitals')}
              className={`flex items-center space-x-2 px-6 py-3 font-medium transition-all duration-300 border-b-2 ${
                activeTab === 'vitals'
                  ? 'text-primary-600 border-primary-500'
                  : 'text-neutral-600 border-transparent hover:text-neutral-800'
              }`}
            >
              <span className="material-icons-round">favorite</span>
              <span>Vital Signs</span>
            </button>

            <button
              onClick={() => setActiveTab('files')}
              className={`flex items-center space-x-2 px-6 py-3 font-medium transition-all duration-300 border-b-2 ${
                activeTab === 'files'
                  ? 'text-primary-600 border-primary-500'
                  : 'text-neutral-600 border-transparent hover:text-neutral-800'
              }`}
            >
              <span className="material-icons-round">folder</span>
              <span>Patient Files</span>
            </button>

            {/* Save Indicator */}
            {savingMedicalData && (
              <div className="ml-auto flex items-center space-x-2 px-4 py-3">
                <div className="animate-spin w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                <span className="text-sm text-primary-600 font-medium">Saving...</span>
              </div>
            )}
          </div>

          {/* Scrollable Content Area */}
          <div className="max-h-96 overflow-y-auto pr-2">
            {/* Vital Signs Tab */}
            {activeTab === 'vitals' && (
              <div className="space-y-4">
                <div className="bg-neutral-50 rounded-xl p-4" data-vital-signs-section>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-neutral-800">Patient Vitals</h4>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleVitalHistoryClick}
                        className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <span className="material-icons-round text-sm">history</span>
                        <span className="text-sm font-medium">History</span>
                      </button>
                      <button
                        onClick={addVitalSign}
                        className="flex items-center space-x-2 bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        <span className="material-icons-round text-sm">add</span>
                        <span className="text-sm font-medium">Add</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {vitalSigns.map((vital) => (
                      <div key={vital.id} className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-neutral-200 hover:border-neutral-300 transition-colors">
                        <div className="flex items-center space-x-3 flex-1">
                          <span className={`material-icons-round text-${vital.color}-600`}>{vital.icon}</span>

                          {vital.name ? (
                            <span className="font-medium text-neutral-800 min-w-0 w-36">{vital.name}</span>
                          ) : (
                            <div className="relative w-36">
                              <select
                                value={vital.name}
                                onChange={(e) => updateVitalSign(vital.id, 'name', e.target.value)}
                                className="appearance-none w-full px-2 py-1 text-sm border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-8"
                              >
                                <option value="">Select vital sign</option>
                                {VITAL_SIGN_OPTIONS.map((option, index) => (
                                  <option key={index} value={option.name}>
                                    {option.name}
                                  </option>
                                ))}
                              </select>
                              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <span className="material-icons-round text-neutral-400 text-sm">arrow_drop_down</span>
                              </span>
                            </div>
                          )}

                          <input
                            type="text"
                            value={vital.value}
                            onChange={(e) => updateVitalSign(vital.id, 'value', e.target.value)}
                            placeholder="Value"
                            className="w-20 px-2 py-1 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-sm"
                          />

                          {vital.unit ? (
                            <span className="text-sm text-neutral-600 font-medium w-12">{vital.unit}</span>
                          ) : (
                            <input
                              type="text"
                              placeholder="Unit"
                              value={vital.unit}
                              onChange={(e) => updateVitalSign(vital.id, 'unit', e.target.value)}
                              className="w-12 px-2 py-1 text-sm border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center"
                            />
                          )}
                        </div>

                        <button
                          onClick={() => removeVitalSign(vital.id)}
                          className="w-7 h-7 bg-red-50 text-red-600 rounded flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0"
                          title="Remove vital sign"
                        >
                          <span className="material-icons-round text-sm">remove</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Consultation Tab */}
            {activeTab === 'consultation' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="material-icons-round text-blue-600 mr-2">local_hospital</span>
                      <h4 className="font-semibold text-blue-800">Diagnosis</h4>
                    </div>
                    <button
                      onClick={handleDiagnosisHistoryClick}
                      className="flex items-center space-x-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <span className="material-icons-round text-sm">history</span>
                      <span className="text-sm font-medium">History</span>
                    </button>
                  </div>
                  <textarea
                    placeholder="Enter diagnosis and findings..."
                    rows={3}
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="material-icons-round text-green-600 mr-2">healing</span>
                      <h4 className="font-semibold text-green-800">Treatment Plan</h4>
                    </div>
                    <button
                      onClick={handleTreatmentHistoryClick}
                      className="flex items-center space-x-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <span className="material-icons-round text-sm">history</span>
                      <span className="text-sm font-medium">History</span>
                    </button>
                  </div>
                  <textarea
                    placeholder="Enter detailed treatment plan and recommendations..."
                    rows={4}
                    value={treatmentPlan}
                    onChange={(e) => setTreatmentPlan(e.target.value)}
                    className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="material-icons-round text-purple-600 mr-2">medication</span>
                      <h4 className="font-semibold text-purple-800">Prescription</h4>
                    </div>
                    <button
                      onClick={handlePrescriptionHistoryClick}
                      className="flex items-center space-x-2 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                      <span className="material-icons-round text-sm">history</span>
                      <span className="text-sm font-medium">History</span>
                    </button>
                  </div>
                  <textarea
                    placeholder="Enter prescription details and medications..."
                    rows={3}
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                    className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            )}

            {/* Patient Files Tab */}
            {activeTab === 'files' && (
              <div className="space-y-4">
                <div className="bg-neutral-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-neutral-800">Uploaded Documents</h4>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setFileViewMode(fileViewMode === 'grid' ? 'list' : 'grid')}
                        className="flex items-center space-x-2 bg-white text-neutral-600 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors border border-neutral-200"
                      >
                        <span className="material-icons-round text-sm">
                          {fileViewMode === 'grid' ? 'view_list' : 'grid_view'}
                        </span>
                        <span className="text-sm font-medium">{fileViewMode === 'grid' ? 'List' : 'Grid'}</span>
                      </button>
                    </div>
                  </div>

                  {fileViewMode === 'grid' ? (
                    /* Grid View */
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {uploadedFiles.map((file) => (
                        <div key={file.id} className="bg-white rounded-lg p-4 border border-neutral-200 hover:border-neutral-300 transition-all hover:shadow-md group">
                          <div className="flex flex-col items-center space-y-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200 transition-colors">
                              <span className="material-icons-round text-blue-600 text-xl">
                                {file.type === 'image' ? 'image' :
                                 file.type === 'pdf' ? 'picture_as_pdf' :
                                 file.type === 'video' ? 'play_circle' : 'description'}
                              </span>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-neutral-800 truncate w-full" title={file.name}>
                                {file.name}
                              </p>
                              <p className="text-xs text-neutral-500 mt-1">{file.size}</p>
                              <p className="text-xs text-neutral-400">{new Date(file.uploadDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* List View */
                    <div className="space-y-2">
                      {uploadedFiles.map((file) => (
                        <div key={file.id} className="bg-white rounded-lg p-4 border border-neutral-200 hover:border-neutral-300 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                              <span className="material-icons-round text-blue-600">
                                {file.type === 'image' ? 'image' :
                                 file.type === 'pdf' ? 'picture_as_pdf' :
                                 file.type === 'video' ? 'play_circle' : 'description'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-neutral-800">{file.name}</p>
                              <p className="text-sm text-neutral-500">{file.type.toUpperCase()} • {file.size}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-neutral-600">{new Date(file.uploadDate).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-100 transition-colors">
                                <span className="material-icons-round text-sm">visibility</span>
                              </button>
                              <button className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center hover:bg-green-100 transition-colors">
                                <span className="material-icons-round text-sm">download</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadedFiles.length === 0 && (
                    <div className="text-center py-8 text-neutral-500">
                      <span className="material-icons-round text-4xl text-neutral-300 mb-2 block">folder_open</span>
                      <p>No files uploaded yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-secondary px-8 py-3"
          >
            <span className="material-icons-round mr-2">arrow_back</span>
            Back to Dashboard
          </button>

          {isStarted && !isCompleted && (
            <button
              onClick={handleEndAppointment}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300"
            >
              <span className="material-icons-round mr-2">check_circle</span>
              Complete Appointment
            </button>
          )}

          {isStarted && isCompleted && (
            <button
              disabled
              className="bg-gray-400 text-white px-8 py-3 rounded-xl font-semibold cursor-not-allowed"
            >
              <span className="material-icons-round mr-2">check_circle</span>
              Appointment Completed
            </button>
          )}
        </div>

        {/* Follow-up Appointment Modal */}
        {showFollowUpModal && appointment && (
          <Modal
            isOpen={showFollowUpModal}
            onClose={handleFollowUpCancel}
            title="Schedule Follow-up Appointment"
            size="xl"
          >
            <AppointmentBookingForm
              patient={{
                id: appointment.patient_id,
                first_name: appointment.patient_first_name,
                last_name: appointment.patient_last_name,
                email: '',
                phone: '',
                date_of_birth: '',
                gender: 'male',
                street: '',
                city: '',
                state: '',
                zip_code: ''
              }}
              onSubmit={handleFollowUpSubmit}
              onCancel={handleFollowUpCancel}
              isLoading={isCreatingFollowUp}
            />
          </Modal>
        )}

        {/* Vital Signs History Modal */}
        {showVitalHistory && (
          <Modal
            isOpen={showVitalHistory}
            onClose={() => setShowVitalHistory(false)}
            title="Vital Signs History"
            size="lg"
          >
            <div className="space-y-4">
              <p className="text-neutral-600 mb-4">Patient vital signs history across appointments</p>

              {patientHistory && patientHistory.medical_history.length > 0 ? (
                <div className="space-y-4">
                  {patientHistory.medical_history
                    .filter(record => record.vital_signs && Object.keys(record.vital_signs).length > 0)
                    .map((record, index) => (
                    <div key={index} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-neutral-800">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h5>
                        <span className="text-sm text-neutral-500">{record.appointment_type_name}</span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {record.vital_signs && Object.entries(record.vital_signs).map(([key, value]) => {
                          const vitalOption = VITAL_SIGN_OPTIONS.find(option => 
                            option.name.toLowerCase().replace(/\s+/g, '_') === key.toLowerCase()
                          );
                          
                          return (
                            <div key={key} className="flex items-center space-x-2">
                              <span className={`material-icons-round text-${vitalOption?.color || 'gray'}-600 text-sm`}>
                                {vitalOption?.icon || 'health_and_safety'}
                              </span>
                              <div>
                                <p className="text-xs text-neutral-500">
                                  {vitalOption?.name || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </p>
                                <p className="font-medium">{value} {vitalOption?.unit || ''}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <span className="material-icons-round text-4xl text-neutral-300 mb-2 block">timeline</span>
                  <p>No vital signs history available</p>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Diagnosis History Modal */}
        {showDiagnosisHistory && (
          <Modal
            isOpen={showDiagnosisHistory}
            onClose={() => setShowDiagnosisHistory(false)}
            title="Diagnosis History"
            size="lg"
          >
            <div className="space-y-4">
              <p className="text-neutral-600 mb-4">Patient diagnosis history across appointments</p>

              {patientHistory && patientHistory.medical_history.length > 0 ? (
                <div className="space-y-4">
                  {patientHistory.medical_history
                    .filter(record => record.diagnosis && record.diagnosis.trim() !== '')
                    .map((record, index) => {
                      const itemId = `diagnosis-${index}`;
                      const isExpanded = expandedHistoryItems.has(itemId);
                      const text = record.diagnosis || '';
                      const shouldTruncate = text.length > 150;
                      const displayText = shouldTruncate && !isExpanded ? text.substring(0, 150) + '...' : text;

                      return (
                        <div key={index} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-neutral-800">
                              {new Date(record.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </h5>
                            <span className="text-sm text-neutral-500">{record.appointment_type_name}</span>
                          </div>

                          <div className="text-neutral-800">
                            <p className="text-sm whitespace-pre-wrap">{displayText}</p>
                            {shouldTruncate && (
                              <button
                                onClick={() => toggleExpandHistoryItem(itemId)}
                                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                              >
                                {isExpanded ? 'Show Less' : 'Show More'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <span className="material-icons-round text-4xl text-neutral-300 mb-2 block">timeline</span>
                  <p>No diagnosis history available</p>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Treatment Plan History Modal */}
        {showTreatmentHistory && (
          <Modal
            isOpen={showTreatmentHistory}
            onClose={() => setShowTreatmentHistory(false)}
            title="Treatment Plan History"
            size="lg"
          >
            <div className="space-y-4">
              <p className="text-neutral-600 mb-4">Patient treatment plan history across appointments</p>

              {patientHistory && patientHistory.medical_history.length > 0 ? (
                <div className="space-y-4">
                  {patientHistory.medical_history
                    .filter(record => record.treatment_plan && record.treatment_plan.trim() !== '')
                    .map((record, index) => {
                      const itemId = `treatment-${index}`;
                      const isExpanded = expandedHistoryItems.has(itemId);
                      const text = record.treatment_plan || '';
                      const shouldTruncate = text.length > 150;
                      const displayText = shouldTruncate && !isExpanded ? text.substring(0, 150) + '...' : text;

                      return (
                        <div key={index} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-neutral-800">
                              {new Date(record.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </h5>
                            <span className="text-sm text-neutral-500">{record.appointment_type_name}</span>
                          </div>

                          <div className="text-neutral-800">
                            <p className="text-sm whitespace-pre-wrap">{displayText}</p>
                            {shouldTruncate && (
                              <button
                                onClick={() => toggleExpandHistoryItem(itemId)}
                                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                              >
                                {isExpanded ? 'Show Less' : 'Show More'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <span className="material-icons-round text-4xl text-neutral-300 mb-2 block">timeline</span>
                  <p>No treatment plan history available</p>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Prescription History Modal */}
        {showPrescriptionHistory && (
          <Modal
            isOpen={showPrescriptionHistory}
            onClose={() => setShowPrescriptionHistory(false)}
            title="Prescription History"
            size="lg"
          >
            <div className="space-y-4">
              <p className="text-neutral-600 mb-4">Patient prescription history across appointments</p>

              {patientHistory && patientHistory.medical_history.length > 0 ? (
                <div className="space-y-4">
                  {patientHistory.medical_history
                    .filter(record => record.prescription && record.prescription.trim() !== '')
                    .map((record, index) => {
                      const itemId = `prescription-${index}`;
                      const isExpanded = expandedHistoryItems.has(itemId);
                      const text = record.prescription || '';
                      const shouldTruncate = text.length > 150;
                      const displayText = shouldTruncate && !isExpanded ? text.substring(0, 150) + '...' : text;

                      return (
                        <div key={index} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-neutral-800">
                              {new Date(record.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </h5>
                            <span className="text-sm text-neutral-500">{record.appointment_type_name}</span>
                          </div>

                          <div className="text-neutral-800">
                            <p className="text-sm whitespace-pre-wrap">{displayText}</p>
                            {shouldTruncate && (
                              <button
                                onClick={() => toggleExpandHistoryItem(itemId)}
                                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                              >
                                {isExpanded ? 'Show Less' : 'Show More'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <span className="material-icons-round text-4xl text-neutral-300 mb-2 block">timeline</span>
                  <p>No prescription history available</p>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};
