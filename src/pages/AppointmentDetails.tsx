import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useTranslation } from '../context/TranslationContext';
import { useNotification } from '../context/NotificationContext';
import { AppointmentService } from '../services/appointmentService';
import { PatientService } from '../services/patientService';
import { Appointment } from '../types/Appointment';
import { AppointmentMedicalData, VitalSign, PatientMedicalHistory } from '../types/Medical';
import { Button } from '../components/common/Button';

// Predefined vital signs with their units and styling - similar to AppointmentStart
const getVitalSignOptions = (t: any) => [
  { name: t('heart_rate'), unit: t('bpm'), icon: 'monitor_heart', color: 'red' },
  { name: t('blood_pressure'), unit: t('mmhg'), icon: 'favorite', color: 'pink' },
  { name: t('temperature'), unit: '°C', icon: 'device_thermostat', color: 'orange' },
  { name: t('weight'), unit: t('kg'), icon: 'monitor_weight', color: 'blue' },
  { name: t('height'), unit: t('cm'), icon: 'height', color: 'green' },
  { name: t('oxygen_saturation'), unit: t('percent'), icon: 'air', color: 'purple' },
  { name: t('respiratory_rate'), unit: t('breaths_per_min'), icon: 'air', color: 'indigo' },
  { name: t('blood_sugar'), unit: t('mg_per_dl'), icon: 'bloodtype', color: 'rose' },
  { name: t('pulse'), unit: t('bpm'), icon: 'favorite', color: 'red' },
];

// Page dedicated to viewing (and optionally editing) medical data of a completed appointment
// Shows ONLY two tabs: Vital Signs & Consultation (Diagnosis / Treatment / Prescription)
export const AppointmentDetails: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [medicalData, setMedicalData] = useState<AppointmentMedicalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'consultation' | 'vitals'>('consultation');

  // Form fields
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [prescription, setPrescription] = useState('');
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [patientHistory, setPatientHistory] = useState<PatientMedicalHistory | null>(null);

  // Fetch appointment
  useEffect(() => {
    const load = async () => {
      if (!appointmentId) return;
      try {
        setLoading(true);
        const appt = await AppointmentService.getAppointment(appointmentId);
        setAppointment(appt);
      } catch (e) {
        console.error(e);
        showNotification('error', t('error'), t('failed_to_load_appointment_details'));
        navigate('/patients');
      } finally {
        setLoading(false);
      }
    }; load();
  }, [appointmentId, navigate, showNotification, t]);

  // Fetch medical data & patient history after appointment loads
  useEffect(() => {
    const loadMedical = async () => {
      if (!appointmentId) return;
      try {
        const data = await AppointmentService.getMedicalData(appointmentId);
        setMedicalData(data);
        setDiagnosis(data.diagnosis || '');
        setTreatmentPlan(data.treatment_plan || '');
        setPrescription(data.prescription || '');
        if (data.vital_signs) {
          const vitals = Object.entries(data.vital_signs).map(([k,v], idx) => ({
            id: String(idx+1),
            name: k.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase()),
            value: String(v),
            unit: '',
            icon: 'health_and_safety',
            color: 'blue'
          }));
          setVitalSigns(vitals);
        } else {
          // Initialize minimal vitals rows
          setVitalSigns([
            { id:'1', name:t('heart_rate'), value:'', unit:t('bpm'), icon:'monitor_heart', color:'red'},
            { id:'2', name:t('blood_pressure'), value:'', unit:t('mmhg'), icon:'favorite', color:'pink'},
            { id:'3', name:t('temperature'), value:'', unit:'°C', icon:'device_thermostat', color:'orange'},
          ]);
        }
      } catch(e){
        // silent if none exists
      }
    };
    const loadHistory = async () => {
      if (appointment?.patient_id) {
        try {
          const hist = await PatientService.getPatientMedicalHistory(appointment.patient_id);
          setPatientHistory(hist);
        } catch(e){/* ignore */}
      }
    };
    if (appointment) {
      loadMedical();
      loadHistory();
    }
  }, [appointment, appointmentId, t]);

  // Save medical data (same format as AppointmentStart)
  const saveMedical = async () => {
    if (!appointmentId) return;
    setSaving(true);
    try {
      const vitalObj: Record<string,string> = {};
      vitalSigns.forEach(v => { if (v.name && v.value){ vitalObj[v.name.toLowerCase().replace(/\s+/g,'_')] = v.value; } });
      const updated = await AppointmentService.updateMedicalData(appointmentId, {
        diagnosis: diagnosis || null,
        treatment_plan: treatmentPlan || null,
        prescription: prescription || null,
        vital_signs: Object.keys(vitalObj).length? vitalObj : null
      });
      setMedicalData(updated);
      showNotification('success', t('success'), t('appointment_updated_successfully'));
    } catch(e){
      console.error(e);
      showNotification('error', t('error'), t('failed_to_save_medical_data'));
    } finally { setSaving(false); }
  };

  const updateVital = (id: string, field: keyof VitalSign, value: string) => {
    setVitalSigns(vs => {
      return vs.map(vital => {
        if (vital.id === id) {
          const updated = { ...vital, [field]: value };

          // Auto-fill unit and icon when name is selected
          if (field === 'name') {
            const vitalSignOptions = getVitalSignOptions(t);
            const option = vitalSignOptions.find(opt => opt.name === value);
            if (option) {
              updated.unit = option.unit;
              updated.icon = option.icon;
              updated.color = option.color;
            }
          }

          return updated;
        }
        return vital;
      });
    });
  };

  const addVital = () => {
    const newVital: VitalSign = {
      id: Date.now().toString(),
      name: '',
      value: '',
      unit: '',
      icon: 'health_and_safety',
      color: 'gray'
    };
    setVitalSigns(prev => [newVital, ...prev]);
  };

  const removeVital = (id: string) => {
    setVitalSigns(prev => prev.filter(vital => vital.id !== id));
  };

  const isCompleted = appointment?.status === 'Completed';

  // Format time helper function
  const formatTimeHHMM = (timeString?: string) => {
    if (!timeString) return '';
    return timeString.split('.')[0];
  };

  // ESC key: return to previous view
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate(-1);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-neutral-600">{t('loading_appointment_details')}</p>
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
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">{t('appointment_not_found')}</h2>
          <p className="text-neutral-600 mb-6">{t('appointment_not_found_message')}</p>
          <Button variant="primary" icon="arrow_back" onClick={() => navigate('/dashboard')}>
            {t('back_to_dashboard')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Modern Gradient Header with Patient Info */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="material-icons-round text-xl">person</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  {appointment.patient_first_name} {appointment.patient_last_name}
                </h1>
                <p className="text-primary-200 text-xs">
                  {t('appointment_details')} • {new Date(appointment.date).toLocaleDateString()} {t('at')} {formatTimeHHMM(appointment.start_time)}
                </p>
              </div>
            </div>

            {/* Status and Actions */}
            <div className="flex items-center space-x-3">
              {/* Completed Status Badge */}
              <div className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-1">
                <span className="material-icons-round text-sm">check_circle</span>
                <span className="text-sm">{t('completed')}</span>
              </div>

              {/* Back Button */}
              <button
                onClick={() => navigate(-1)}
                className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-1 backdrop-blur-sm"
              >
                <span className="material-icons-round text-sm">arrow_back</span>
                <span className="text-sm">{t('back')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Appointment Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between p-4">
            {/* Left side: Appointment details */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <span className="material-icons-round text-blue-600 text-sm">schedule</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-neutral-500 font-medium">{t('time')}</p>
                  <p className="text-sm font-semibold text-neutral-800 truncate">
                    {formatTimeHHMM(appointment.start_time)} - {formatTimeHHMM(appointment.end_time)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <span className="material-icons-round text-green-600 text-sm">medical_services</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-neutral-500 font-medium">{t('type')}</p>
                  <p className="text-sm font-semibold text-neutral-800 break-words" title={appointment.appointment_type_name}>
                    {appointment.appointment_type_name}
                  </p>
                </div>
              </div>

              {appointment.title && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                    <span className="material-icons-round text-purple-600 text-sm">description</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-neutral-500 font-medium">{t('title')}</p>
                    <p className="text-sm font-semibold text-neutral-800 break-words" title={appointment.title}>
                      {appointment.title}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Save button */}
            <div className="flex items-center space-x-2">
              <Button
                variant="primary"
                icon="save"
                onClick={saveMedical}
                disabled={saving}
                loading={saving}
              >
                {saving ? t('saving') : t('save')}
              </Button>
            </div>
          </div>
        </div>

        {/* Modern Tab Navigation - Consultation first */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-1">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('consultation')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'consultation'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <span className="material-icons-round text-sm">medical_services</span>
              <span>{t('consultation')}</span>
            </button>
            <button
              onClick={() => setActiveTab('vitals')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'vitals'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <span className="material-icons-round text-sm">monitor_heart</span>
              <span>{t('vital_signs')}</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'consultation' && (
            <div className="space-y-6">
              {/* Diagnosis Section */}
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <span className="material-icons-round text-blue-600 text-sm">psychology</span>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-800">{t('diagnosis')}</h3>
                </div>
                <textarea
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                  placeholder={t('enter_diagnosis')}
                />
              </div>

              {/* Treatment Plan Section */}
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <span className="material-icons-round text-green-600 text-sm">medical_services</span>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-800">{t('treatment_plan')}</h3>
                </div>
                <textarea
                  value={treatmentPlan}
                  onChange={e => setTreatmentPlan(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                  placeholder={t('enter_treatment_plan')}
                />
              </div>

              {/* Prescription Section */}
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                    <span className="material-icons-round text-purple-600 text-sm">medication</span>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-800">{t('prescription')}</h3>
                </div>
                <textarea
                  value={prescription}
                  onChange={e => setPrescription(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                  placeholder={t('enter_prescription')}
                />
              </div>
            </div>
          )}

          {activeTab === 'vitals' && (
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                    <span className="material-icons-round text-red-600 text-sm">monitor_heart</span>
                  </div>
                  <h2 className="text-lg font-semibold text-neutral-800">{t('vital_signs')}</h2>
                </div>
                <button
                  onClick={addVital}
                  className="flex items-center space-x-2 bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <span className="material-icons-round text-sm">add</span>
                  <span className="text-sm font-medium">{t('add')}</span>
                </button>
              </div>

              <div className="space-y-2">
                {vitalSigns.map((vital) => (
                  <div key={vital.id} className="flex items-center space-x-3 bg-neutral-50 rounded-lg p-3 border border-neutral-200 hover:border-neutral-300 transition-colors">
                    <div className="flex items-center space-x-3 flex-1">
                      <span className={`material-icons-round text-${vital.color}-600`}>{vital.icon}</span>

                      {vital.name ? (
                        <span className="font-medium text-neutral-800 min-w-0 w-36">{vital.name}</span>
                      ) : (
                        <div className="relative w-36">
                          <select
                            value={vital.name}
                            onChange={(e) => updateVital(vital.id, 'name', e.target.value)}
                            className="appearance-none w-full px-2 py-1 text-sm border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-8"
                          >
                            <option value="">{t('select_vital_sign')}</option>
                            {getVitalSignOptions(t).map((option, index) => (
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
                        onChange={(e) => updateVital(vital.id, 'value', e.target.value)}
                        placeholder={t('value')}
                        className="w-20 px-2 py-1 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-sm"
                      />

                      {vital.unit ? (
                        <span className="text-sm text-neutral-600 font-medium w-12">{vital.unit}</span>
                      ) : (
                        <input
                          type="text"
                          placeholder={t('unit')}
                          value={vital.unit}
                          onChange={(e) => updateVital(vital.id, 'unit', e.target.value)}
                          className="w-12 px-2 py-1 text-sm border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center"
                        />
                      )}
                    </div>

                    <button
                      onClick={() => removeVital(vital.id)}
                      className="w-7 h-7 bg-red-50 text-red-600 rounded flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0"
                      title={t('remove_vital_sign')}
                    >
                      <span className="material-icons-round text-sm">remove</span>
                    </button>
                  </div>
                ))}

                {vitalSigns.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-icons-round text-neutral-400 text-2xl">monitor_heart</span>
                    </div>
                    <p className="text-neutral-500 mb-4">{t('no_vital_signs_recorded')}</p>
                    <button
                      onClick={addVital}
                      className="flex items-center space-x-2 bg-primary-50 text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-100 transition-colors"
                    >
                      <span className="material-icons-round text-sm">add</span>
                      <span>{t('add_first_vital')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AppointmentDetails;
