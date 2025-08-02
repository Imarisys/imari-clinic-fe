import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { AppointmentService } from '../services/appointmentService';
import { Appointment, AppointmentCreate } from '../types/Appointment';
import { useNotification } from '../context/NotificationContext';
import { AppointmentBookingForm } from '../components/patients/AppointmentBookingForm';
import { Modal } from '../components/common/Modal';

interface AppointmentNote {
  id: string;
  content: string;
  timestamp: Date;
  type: 'vital' | 'symptom' | 'treatment' | 'general';
}

interface VitalSigns {
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  weight: string;
  height: string;
  oxygenSaturation: string;
}

export const AppointmentStart: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'notes' | 'treatment'>('overview');

  // Follow-up appointment modal state
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [isCreatingFollowUp, setIsCreatingFollowUp] = useState(false);

  // Notes and documentation
  const [notes, setNotes] = useState<AppointmentNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'vital' | 'symptom' | 'treatment' | 'general'>('general');

  // Vital signs
  const [vitals, setVitals] = useState<VitalSigns>({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    weight: '',
    height: '',
    oxygenSaturation: ''
  });

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
        showNotification('success', 'Appointment Completed', 'The consultation has been marked as completed');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Failed to end appointment:', error);
      showNotification('error', 'Error', 'Failed to complete appointment');
    }
  };

  const addNote = () => {
    if (!newNote.trim()) return;

    const note: AppointmentNote = {
      id: Date.now().toString(),
      content: newNote,
      timestamp: new Date(),
      type: noteType
    };

    setNotes(prev => [...prev, note]);
    setNewNote('');
    showNotification('success', 'Note Added', 'Your note has been saved');
  };

  const updateVitals = (field: keyof VitalSigns, value: string) => {
    setVitals(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getElapsedTime = () => {
    if (!startTime) return '00:00:00';
    const diff = currentTime.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'vital': return 'bg-red-100 text-red-700 border-red-200';
      case 'symptom': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'treatment': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
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

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex border-b border-neutral-200">
            {[
              { id: 'overview', label: 'Overview', icon: 'dashboard' },
              { id: 'vitals', label: 'Vital Signs', icon: 'favorite' },
              { id: 'notes', label: 'Notes', icon: 'note_alt' },
              { id: 'treatment', label: 'Treatment', icon: 'medical_services' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center px-6 py-4 font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-500'
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <span className="material-icons-round mr-2 text-xl">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="material-icons-round text-blue-600">schedule</span>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-200 px-2 py-1 rounded-full">
                        TIME
                      </span>
                    </div>
                    <h3 className="font-semibold text-neutral-800">Appointment Time</h3>
                    <p className="text-sm text-neutral-600">
                      {appointment.start_time} - {appointment.end_time}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="material-icons-round text-green-600">medical_services</span>
                      <span className="text-xs font-semibold text-green-600 bg-green-200 px-2 py-1 rounded-full">
                        TYPE
                      </span>
                    </div>
                    <h3 className="font-semibold text-neutral-800">Appointment Type</h3>
                    <p className="text-sm text-neutral-600">{appointment.appointment_type_name}</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="material-icons-round text-purple-600">info</span>
                      <span className="text-xs font-semibold text-purple-600 bg-purple-200 px-2 py-1 rounded-full">
                        STATUS
                      </span>
                    </div>
                    <h3 className="font-semibold text-neutral-800">Status</h3>
                    <p className="text-sm text-neutral-600">{appointment.status}</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-neutral-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-neutral-800 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button className="bg-white border border-neutral-200 rounded-lg p-4 hover:bg-neutral-100 transition-colors">
                      <span className="material-icons-round text-primary-600 text-2xl mb-2 block">camera_alt</span>
                      <span className="text-sm font-medium">Take Photo</span>
                    </button>
                    <button className="bg-white border border-neutral-200 rounded-lg p-4 hover:bg-neutral-100 transition-colors">
                      <span className="material-icons-round text-green-600 text-2xl mb-2 block">mic</span>
                      <span className="text-sm font-medium">Voice Note</span>
                    </button>
                    <button className="bg-white border border-neutral-200 rounded-lg p-4 hover:bg-neutral-100 transition-colors">
                      <span className="material-icons-round text-blue-600 text-2xl mb-2 block">description</span>
                      <span className="text-sm font-medium">Prescription</span>
                    </button>
                    <button
                      onClick={handleFollowUpClick}
                      className="bg-white border border-neutral-200 rounded-lg p-4 hover:bg-neutral-100 transition-colors"
                    >
                      <span className="material-icons-round text-orange-600 text-2xl mb-2 block">event</span>
                      <span className="text-sm font-medium">Follow-up</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Vital Signs Tab */}
            {activeTab === 'vitals' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-neutral-800">Vital Signs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'bloodPressure', label: 'Blood Pressure', unit: 'mmHg', icon: 'favorite', color: 'red' },
                    { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', icon: 'monitor_heart', color: 'pink' },
                    { key: 'temperature', label: 'Temperature', unit: '°C', icon: 'device_thermostat', color: 'orange' },
                    { key: 'weight', label: 'Weight', unit: 'kg', icon: 'monitor_weight', color: 'blue' },
                    { key: 'height', label: 'Height', unit: 'cm', icon: 'height', color: 'green' },
                    { key: 'oxygenSaturation', label: 'Oxygen Saturation', unit: '%', icon: 'air', color: 'purple' }
                  ].map((vital) => (
                    <div key={vital.key} className={`bg-${vital.color}-50 border border-${vital.color}-200 rounded-xl p-4`}>
                      <div className="flex items-center mb-3">
                        <span className={`material-icons-round text-${vital.color}-600 mr-2`}>{vital.icon}</span>
                        <span className="font-medium text-neutral-800">{vital.label}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={vitals[vital.key as keyof VitalSigns]}
                          onChange={(e) => updateVitals(vital.key as keyof VitalSigns, e.target.value)}
                          placeholder="Enter value"
                          className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <span className="text-sm text-neutral-600 font-medium">{vital.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-neutral-800">Appointment Notes</h3>
                  <div className="flex items-center space-x-2">
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value as any)}
                      className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="general">General</option>
                      <option value="vital">Vital Signs</option>
                      <option value="symptom">Symptoms</option>
                      <option value="treatment">Treatment</option>
                    </select>
                  </div>
                </div>

                {/* Add Note */}
                <div className="bg-neutral-50 rounded-xl p-4">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note about the appointment..."
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                  <div className="flex justify-end mt-3">
                    <button onClick={addNote} className="btn-primary">
                      <span className="material-icons-round mr-2">add</span>
                      Add Note
                    </button>
                  </div>
                </div>

                {/* Notes List */}
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="bg-white border border-neutral-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getNoteTypeColor(note.type)}`}>
                          {note.type.toUpperCase()}
                        </span>
                        <span className="text-sm text-neutral-500">
                          {note.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-neutral-800">{note.content}</p>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <div className="text-center py-8 text-neutral-500">
                      <span className="material-icons-round text-4xl text-neutral-300 mb-2 block">note_alt</span>
                      No notes added yet
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Treatment Tab */}
            {activeTab === 'treatment' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-neutral-800">Treatment Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-800 mb-3">Diagnosis</h4>
                    <textarea
                      placeholder="Enter diagnosis..."
                      rows={4}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h4 className="font-semibold text-green-800 mb-3">Treatment</h4>
                    <textarea
                      placeholder="Enter treatment plan..."
                      rows={4}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {isStarted && (
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary px-8 py-3"
            >
              <span className="material-icons-round mr-2">arrow_back</span>
              Back to Dashboard
            </button>
            <button
              onClick={handleEndAppointment}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300"
            >
              <span className="material-icons-round mr-2">check_circle</span>
              Complete Appointment
            </button>
          </div>
        )}

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
      </div>
    </DashboardLayout>
  );
};
