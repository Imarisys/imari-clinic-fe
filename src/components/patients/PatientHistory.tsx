import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { PatientWithAppointments } from '../../types/Patient';
import { Appointment, AppointmentStatus } from '../../types/Appointment';
import { AppointmentMedicalData, VitalSign } from '../../types/Medical';
import { PatientService } from '../../services/patientService';
import { AppointmentService } from '../../services/appointmentService';
import { Button } from '../common/Button';
import { PatientPreconditions } from './PatientPreconditions';

interface PatientHistoryProps {
  patient: PatientWithAppointments;
  onBack: () => void;
  onScheduleNew?: () => void;
}

const getStatusColor = (status: AppointmentStatus): string => {
  switch (status) {
    case 'Completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Booked':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'No Show':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'In Progress':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getTypeColor = (type: string): string => {
  switch (type) {
    case 'Consultation':
      return 'bg-indigo-50 text-indigo-700';
    case 'Follow Up':
      return 'bg-emerald-50 text-emerald-700';
    case 'Emergency':
      return 'bg-red-50 text-red-700';
    case 'Routine Check':
      return 'bg-amber-50 text-amber-700';
    default:
      return 'bg-gray-50 text-gray-700';
  }
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (timeString: string): string => {
  // Handle time format with microseconds
  const time = timeString.split('.')[0]; // Remove microseconds
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const PatientHistory: React.FC<PatientHistoryProps> = ({
  patient,
  onBack,
  onScheduleNew,
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [patientData, setPatientData] = useState<PatientWithAppointments>(patient);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [medicalData, setMedicalData] = useState<AppointmentMedicalData | null>(null);
  const [loadingMedical, setLoadingMedical] = useState(false);
  const [showMedicalDetails, setShowMedicalDetails] = useState(false);

  // Add ESC key functionality for the appointment detail modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showMedicalDetails) {
          setShowMedicalDetails(false);
          setMedicalData(null);
        } else if (selectedAppointment) {
          setSelectedAppointment(null);
        }
      }
    };

    if (selectedAppointment || showMedicalDetails) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [selectedAppointment, showMedicalDetails]);

  useEffect(() => {
    const loadPatientHistory = async () => {
      setIsLoading(true);
      try {
        const data = await PatientService.getPatientWithAppointments(patient.id);
        setPatientData(data);
      } catch (error) {
        console.error('Error loading patient history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPatientHistory();
  }, [patient.id]);

  const appointments = patientData.appointments || [];
  const sortedAppointments = [...appointments].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const completedAppointments = appointments.filter(apt => apt.status === 'Completed');

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const handlePreconditionsUpdate = async (updatedPreconditions: any) => {
    try {
      setIsLoading(true);
      const updatedPatient = await PatientService.updatePatient(patientData.id, {
        preconditions: updatedPreconditions
      });
      setPatientData({ ...patientData, preconditions: updatedPatient.preconditions });
    } catch (error) {
      console.error('Error updating preconditions:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowMedicalDetails = async (appointmentId: string) => {
    console.log('Details button clicked for appointment:', appointmentId);
    setLoadingMedical(true);
    try {
      console.log('Fetching medical data from API...');
      const medical = await AppointmentService.getMedicalData(appointmentId);
      console.log('Medical data received:', medical);
      setMedicalData(medical);
      setShowMedicalDetails(true);
    } catch (error) {
      console.error('Error loading medical data:', error);
      // If no medical data found, still show the modal but with empty data
      setMedicalData(null);
      setShowMedicalDetails(true);
    } finally {
      setLoadingMedical(false);
    }
  };

  const renderVitalSigns = (vitalSigns: Record<string, any> | null) => {
    if (!vitalSigns) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(vitalSigns).map(([key, value]) => (
          <div key={key} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 capitalize">
                {key.replace(/_/g, ' ')}
              </span>
              <span className="text-lg font-semibold text-gray-900">
                {value}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={onBack}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>{t('back')}</span>
                </Button>
                <div className="h-6 w-px bg-gray-300"></div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('patient_history')}
                </h1>
              </div>
              {onScheduleNew && (
                <Button
                  onClick={onScheduleNew}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t('book_appointment')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Information Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {patientData.first_name.charAt(0)}{patientData.last_name.charAt(0)}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {patientData.first_name} {patientData.last_name}
                </h2>
                <p className="text-gray-500">
                  {calculateAge(patientData.date_of_birth)} {t('years_old')}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-700">{patientData.phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-700">{patientData.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-700">
                    {patientData.street}, {patientData.city}, {patientData.state} {patientData.zip_code}
                  </span>
                </div>
              </div>

              {/* Statistics */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{appointments.length}</div>
                    <div className="text-sm text-gray-500">Total {t('appointments')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{completedAppointments.length}</div>
                    <div className="text-sm text-gray-500">{t('completed')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Preconditions Card */}
            <div className="mt-6">
              <PatientPreconditions
                patientId={patientData.id}
                isEditable={true}
              />
            </div>
          </div>

          {/* Appointment History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{t('appointment_history')}</h3>
                <p className="text-gray-500 mt-1">{t('view_all_patient_appointments')}</p>
                {/* Debug: Show modal directly */}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    console.log('Test button clicked - showing modal directly');
                    setShowMedicalDetails(true);
                    setMedicalData({
                      appointment_id: 'test',
                      patient_id: 'test',
                      date: new Date().toISOString(),
                      diagnosis: 'Test diagnosis',
                      treatment_plan: 'Test treatment plan',
                      prescription: 'Test prescription',
                      vital_signs: { heart_rate: '72', blood_pressure: '120/80' }
                    });
                  }}
                  className="mb-4"
                >
                  Test Medical Modal
                </Button>
              </div>

              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4">{t('loading_history')}</p>
                </div>
              ) : sortedAppointments.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-8 0a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V8a1 1 0 00-1-1m-8 0h8m-4 4v4" />
                  </svg>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">{t('no_appointments')}</h4>
                  <p className="text-gray-500">{t('no_appointment_history_found')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {sortedAppointments.map((appointment, index) => (
                    <div
                      key={appointment.id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 cursor-pointer" onClick={() => setSelectedAppointment(appointment)}>
                          <div className="flex items-center space-x-3">
                            <h4 className="text-lg font-medium text-gray-900">
                              {appointment.title}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                              {appointment.status}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(appointment.type)}`}>
                              {appointment.type}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{formatDate(appointment.date)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
                            </div>
                          </div>
                          {appointment.notes && (
                            <p className="mt-2 text-sm text-gray-600">{appointment.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {appointment.status === 'Completed' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Button clicked!', appointment.id); // Add this debug line
                                handleShowMedicalDetails(appointment.id);
                              }}
                              disabled={loadingMedical}
                              className="text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              {loadingMedical ? (
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  {t('details')}
                                </>
                              )}
                            </Button>
                          )}
                          <svg className="w-5 h-5 text-gray-400 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24" onClick={() => setSelectedAppointment(appointment)}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {t('appointment_details')}
                </h3>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedAppointment.title}</h4>
                  <div className="mt-2 flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedAppointment.status)}`}>
                      {selectedAppointment.status}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(selectedAppointment.type)}`}>
                      {selectedAppointment.type}
                    </span>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700">{t('date_time')}</h5>
                  <p className="text-gray-600">
                    {formatDate(selectedAppointment.date)} {t('at')} {formatTime(selectedAppointment.start_time)} - {formatTime(selectedAppointment.end_time)}
                  </p>
                </div>
                {selectedAppointment.notes && (
                  <div>
                    <h5 className="font-medium text-gray-700">{t('notes')}</h5>
                    <p className="text-gray-600">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medical Details Modal */}
      {showMedicalDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {t('medical_details')}
                </h3>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowMedicalDetails(false);
                    setMedicalData(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </div>

            <div className="p-6">
              {medicalData ? (
                <div className="space-y-6">
                  {/* Vital Signs */}
                  {medicalData.vital_signs && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        {t('vital_signs')}
                      </h4>
                      {renderVitalSigns(medicalData.vital_signs)}
                    </div>
                  )}

                  {/* Diagnosis */}
                  {medicalData.diagnosis && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {t('diagnosis')}
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">{medicalData.diagnosis}</p>
                      </div>
                    </div>
                  )}

                  {/* Treatment Plan */}
                  {medicalData.treatment_plan && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {t('treatment_plan')}
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">{medicalData.treatment_plan}</p>
                      </div>
                    </div>
                  )}

                  {/* Prescription */}
                  {medicalData.prescription && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {t('prescription')}
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">{medicalData.prescription}</p>
                      </div>
                    </div>
                  )}

                  {/* No data message */}
                  {!medicalData.vital_signs && !medicalData.diagnosis && !medicalData.treatment_plan && !medicalData.prescription && (
                    <div className="text-center py-8">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500">{t('no_medical_data_available')}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">{t('no_medical_data_available')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
