import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/common/Button';
import { useTranslation } from '../context/TranslationContext';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { AppointmentService } from '../services/appointmentService';
import { PatientService } from '../services/patientService';
import { generateBS1PDF } from '../services/bs1Service';
import { Appointment } from '../types/Appointment';
import { Patient } from '../types/Patient';

interface ActRow {
  code: string;
  description: string;
  quantity: number;
  unitCost: number;
}

const DEFAULT_ACTS: ActRow[] = [
  { code: 'CG', description: 'Consultation Générale', quantity: 1, unitCost: 60.000 },
  { code: 'CS', description: 'Consultation de Suivi', quantity: 0, unitCost: 40.000 },
  { code: 'URG', description: 'Urgence', quantity: 0, unitCost: 75.000 },
  { code: 'INJ', description: 'Injection', quantity: 0, unitCost: 15.000 },
  { code: 'PST', description: 'Petite chirurgie', quantity: 0, unitCost: 80.000 },
  { code: 'RAD', description: 'Radiographie standard', quantity: 0, unitCost: 45.000 },
];

export const BS1Generator: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { user } = useAuth();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  const [providerNumber, setProviderNumber] = useState('12-34567-8');
  const [specialization, setSpecialization] = useState('Médecine Générale');
  const [acts, setActs] = useState<ActRow[]>(DEFAULT_ACTS);
  const [insurancePct, setInsurancePct] = useState(70);

  useEffect(() => {
    if (!appointmentId) return;
    (async () => {
      setLoading(true);
      try {
        const appt = await AppointmentService.getAppointment(appointmentId);
        setAppointment(appt);
        const pat = await PatientService.getPatient(appt.patient_id);
        setPatient(pat);
      } catch {
        showNotification('error', t('error'), t('failed_to_load_bs1_data'));
      } finally {
        setLoading(false);
      }
    })();
  }, [appointmentId, showNotification, t]);

  const updateAct = (idx: number, field: keyof ActRow, value: string | number) => {
    setActs(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };

  const addAct = () => setActs(prev => [...prev, { code: '', description: '', quantity: 1, unitCost: 0 }]);
  const removeAct = (idx: number) => setActs(prev => prev.filter((_, i) => i !== idx));

  const activeActs = acts.filter(a => a.quantity > 0 && a.description);
  const totalCost = activeActs.reduce((sum, a) => sum + a.quantity * a.unitCost, 0);
  const insuranceAmount = totalCost * (insurancePct / 100);
  const patientShare = totalCost - insuranceAmount;

  const handleDownload = async () => {
    if (!appointment || !patient) return;
    try {
      const blob = await generateBS1PDF({
        patientFirstName: patient.first_name,
        patientLastName: patient.last_name,
        patientCnamId: patient.cnam_identifier || '',
        patientDob: patient.date_of_birth || '',
        patientStreet: patient.street || '',
        patientCity: patient.city || '',
        patientZipCode: patient.zip_code || '',
        patientInsuranceNumber: patient.insurance_number || '',
        doctorFirstName: user?.first_name || '',
        doctorLastName: user?.last_name || '',
        doctorProviderNumber: providerNumber,
        doctorSpecialization: specialization,
        appointmentId: appointment.id,
        appointmentDate: appointment.date,
        appointmentType: appointment.appointment_type_name || 'Consultation',
        diagnosis: activeActs.map(a => `${a.code}: ${a.description}`).join('; '),
        cost: totalCost,
        insurancePct,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BS1_${patient.last_name}_${appointment.date}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification('success', t('bs1_generated'), t('bs1_downloaded'));
    } catch {
      showNotification('error', t('error'), t('bs1_generation_failed'));
    }
  };

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center min-h-96"><div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" /></div></DashboardLayout>;
  }
  if (!appointment || !patient) {
    return <DashboardLayout><div className="text-center py-16"><span className="material-icons-round text-5xl text-neutral-300 mb-3">error_outline</span><p className="text-neutral-600">{t('failed_to_load_bs1_data')}</p><Button variant="secondary" className="mt-4" onClick={() => navigate(-1)}>{t('back')}</Button></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800 flex items-center gap-2">
              <span className="material-icons-round text-primary-500">receipt_long</span> BS1 CNAM
            </h1>
            <p className="text-neutral-600 text-sm mt-1">{patient.first_name} {patient.last_name} • {new Date(appointment.date).toLocaleDateString('fr-TN')}</p>
          </div>
          <Button variant="secondary" icon="arrow_back" onClick={() => navigate(-1)}>{t('back')}</Button>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wide mb-3 flex items-center gap-2"><span className="material-icons-round text-base">person</span> Patient</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-neutral-400 text-xs">Nom</p><p className="font-semibold">{patient.last_name.toUpperCase()}</p></div>
            <div><p className="text-neutral-400 text-xs">Prénom</p><p className="font-semibold">{patient.first_name}</p></div>
            <div><p className="text-neutral-400 text-xs">N° CNAM</p><p className="font-semibold font-mono">{patient.cnam_identifier || '—'}</p></div>
            <div><p className="text-neutral-400 text-xs">Date naissance</p><p className="font-semibold">{patient.date_of_birth || '—'}</p></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wide mb-3 flex items-center gap-2"><span className="material-icons-round text-base">stethoscope</span> Médecin</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><p className="text-neutral-400 text-xs">Médecin</p><p className="font-semibold">Dr {user?.first_name} {user?.last_name}</p></div>
            <div><p className="text-neutral-400 text-xs">N° Convention</p><input type="text" value={providerNumber} onChange={e => setProviderNumber(e.target.value)} className="w-full px-2 py-1 border border-neutral-300 rounded text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-transparent" /></div>
            <div><p className="text-neutral-400 text-xs">Spécialité</p><input type="text" value={specialization} onChange={e => setSpecialization(e.target.value)} className="w-full px-2 py-1 border border-neutral-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" /></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center gap-4 text-sm">
            <span className="material-icons-round text-base">shield</span>
            <p className="text-neutral-400">Taux CNAM</p>
            <select value={insurancePct} onChange={e => setInsurancePct(Number(e.target.value))} className="border border-neutral-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500">
              <option value={100}>100%</option><option value={70}>70%</option><option value={50}>50%</option><option value={0}>0%</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wide flex items-center gap-2"><span className="material-icons-round text-base">medical_services</span> Actes</h2>
            <Button variant="secondary" icon="add" size="sm" onClick={addAct}>Ajouter</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-neutral-200 text-neutral-400 text-xs uppercase"><th className="text-left py-2 px-2 w-16">Code</th><th className="text-left py-2 px-2">Désignation</th><th className="text-center py-2 px-2 w-16">Qté</th><th className="text-right py-2 px-2 w-24">Coût unit.</th><th className="text-right py-2 px-2 w-24">Total</th><th className="w-8" /></tr></thead>
              <tbody>
                {acts.map((act, idx) => (
                  <tr key={idx} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-2 px-2"><input type="text" value={act.code} onChange={e => updateAct(idx, 'code', e.target.value)} className="w-full px-1.5 py-1 border border-neutral-200 rounded text-center font-mono text-xs focus:ring-1 focus:ring-primary-500 focus:border-transparent" placeholder="CG" /></td>
                    <td className="py-2 px-2"><input type="text" value={act.description} onChange={e => updateAct(idx, 'description', e.target.value)} className="w-full px-2 py-1 border border-neutral-200 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-transparent" /></td>
                    <td className="py-2 px-2"><input type="number" min={0} value={act.quantity} onChange={e => updateAct(idx, 'quantity', parseInt(e.target.value) || 0)} className="w-full px-1.5 py-1 border border-neutral-200 rounded text-center text-xs focus:ring-1 focus:ring-primary-500 focus:border-transparent" /></td>
                    <td className="py-2 px-2"><input type="number" min={0} step="0.001" value={act.unitCost} onChange={e => updateAct(idx, 'unitCost', parseFloat(e.target.value) || 0)} className="w-full px-1.5 py-1 border border-neutral-200 rounded text-right text-xs focus:ring-1 focus:ring-primary-500 focus:border-transparent" /></td>
                    <td className="py-2 px-2 text-right font-mono font-semibold">{(act.quantity * act.unitCost).toFixed(3)}</td>
                    <td className="py-2 px-2"><button onClick={() => removeAct(idx)} className="text-neutral-400 hover:text-red-500"><span className="material-icons-round text-sm">close</span></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-neutral-50 rounded-lg"><p className="text-xs text-neutral-400 uppercase">Total</p><p className="text-2xl font-bold text-neutral-800">{totalCost.toFixed(3)} TND</p></div>
            <div className="text-center p-3 bg-blue-50 rounded-lg"><p className="text-xs text-blue-500 uppercase">Part CNAM ({insurancePct}%)</p><p className="text-2xl font-bold text-blue-700">{insuranceAmount.toFixed(3)} TND</p></div>
            <div className="text-center p-3 bg-amber-50 rounded-lg"><p className="text-xs text-amber-500 uppercase">Part Assuré</p><p className="text-2xl font-bold text-amber-700">{patientShare.toFixed(3)} TND</p></div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>{t('cancel')}</Button>
          <Button variant="primary" icon="download" onClick={handleDownload}>Télécharger BS1 PDF</Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BS1Generator;
