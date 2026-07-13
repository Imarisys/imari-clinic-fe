import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import {
  ChartBarIcon,
  CalendarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { BillingService, RevenueSummary } from '../services/billingService';
import { PatientService } from '../services/patientService';
import { useTranslation } from '../context/TranslationContext';

type ReportType = 'revenue' | 'patients' | 'appointments';

export const Reports: React.FC = () => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<ReportType>('revenue');
  const [analytics, setAnalytics] = useState<any>(null);
  const [patientSummary, setPatientSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fmt = (n: number) => `${(n || 0).toFixed(3)} TND`;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (selected === 'revenue') {
          setAnalytics(await BillingService.getAnalytics());
        }
        if (selected === 'patients') {
          setPatientSummary(await PatientService.getPatientSummary());
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [selected]);

  const reports = [
    { id: 'revenue' as ReportType, title: 'Analyse des revenus', desc: 'Facturation, encaissements, restant dû et taux de recouvrement', icon: CurrencyDollarIcon, color: 'bg-purple-500' },
    { id: 'patients' as ReportType, title: 'Patients', desc: 'Démographie, nouveaux patients, visites', icon: UserGroupIcon, color: 'bg-green-500' },
    { id: 'appointments' as ReportType, title: 'Rendez-vous', desc: 'Tendances, statuts, taux d\'occupation', icon: CalendarIcon, color: 'bg-blue-500' },
  ];

  const RevenueCard = ({ label, data }: { label: string; data: RevenueSummary }) => (
    <div className="bg-white rounded-2xl shadow-soft p-5 border border-neutral-100">
      <p className="text-sm font-medium text-neutral-500 mb-3">{label}</p>
      <div className="space-y-2">
        <div className="flex justify-between"><span className="text-sm text-neutral-400">Total facturé</span><span className="font-bold">{fmt(data.total_revenue)}</span></div>
        <div className="flex justify-between"><span className="text-sm text-neutral-400">Encaissé</span><span className="font-bold text-green-600">{fmt(data.collected)}</span></div>
        <div className="flex justify-between"><span className="text-sm text-neutral-400">Restant dû</span><span className="font-bold text-red-600">{fmt(data.outstanding)}</span></div>
        <div className="flex justify-between"><span className="text-sm text-neutral-400">Taux recouvrement</span><span className="font-bold text-primary-600">{data.collection_rate}%</span></div>
      </div>
      <div className="mt-4 pt-3 border-t border-neutral-100 grid grid-cols-3 gap-2 text-xs">
        <div className="text-center"><p className="font-bold text-green-600">{data.paid_invoices}</p><p className="text-neutral-400">Payées</p></div>
        <div className="text-center"><p className="font-bold text-yellow-600">{data.partial_invoices}</p><p className="text-neutral-400">Partielles</p></div>
        <div className="text-center"><p className="font-bold text-blue-600">{data.pending_invoices}</p><p className="text-neutral-400">En attente</p></div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-600 mb-2">{t('reports_analytics')}</h1>
            <p className="text-neutral-600">Indicateurs de performance et analyse de l'activité</p>
          </div>
          <Button variant="secondary" onClick={() => window.print()} className="flex items-center gap-2">
            <PrinterIcon className="h-4 w-4" />Imprimer
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reports.map(r => (
            <div key={r.id} onClick={() => setSelected(r.id)}
              className={`cursor-pointer rounded-2xl border-2 p-5 transition-all duration-200 ${
                selected === r.id ? 'border-primary-500 bg-primary-50 shadow-md' : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`${r.color} p-3 rounded-xl text-white`}><r.icon className="h-6 w-6" /></div>
                <div>
                  <h3 className="font-semibold text-neutral-800">{r.title}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">{r.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        )}

        {!loading && selected === 'revenue' && analytics && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <RevenueCard label="Aujourd'hui" data={analytics.today} />
              <RevenueCard label="Cette semaine" data={analytics.this_week} />
              <RevenueCard label="Ce mois" data={analytics.this_month} />
            </div>
            <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
              <h3 className="font-semibold text-neutral-800 mb-4">Distribution des factures du mois</h3>
              <div className="flex items-end gap-2 h-32">
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-green-400 rounded-t-lg" style={{ height: `${Math.max(8, (analytics.this_month.paid_invoices / (analytics.this_month.paid_invoices + analytics.this_month.partial_invoices + analytics.this_month.pending_invoices || 1)) * 100)}%` }} />
                  <p className="text-xs text-neutral-400 mt-2">Payées</p>
                  <p className="font-bold text-green-600">{analytics.this_month.paid_invoices}</p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-yellow-400 rounded-t-lg" style={{ height: `${Math.max(8, (analytics.this_month.partial_invoices / (analytics.this_month.paid_invoices + analytics.this_month.partial_invoices + analytics.this_month.pending_invoices || 1)) * 100)}%` }} />
                  <p className="text-xs text-neutral-400 mt-2">Partielles</p>
                  <p className="font-bold text-yellow-600">{analytics.this_month.partial_invoices}</p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-blue-400 rounded-t-lg" style={{ height: `${Math.max(8, (analytics.this_month.pending_invoices / (analytics.this_month.paid_invoices + analytics.this_month.partial_invoices + analytics.this_month.pending_invoices || 1)) * 100)}%` }} />
                  <p className="text-xs text-neutral-400 mt-2">En attente</p>
                  <p className="font-bold text-blue-600">{analytics.this_month.pending_invoices}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && selected === 'patients' && patientSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total patients', value: patientSummary.total_patients, icon: 'groups', color: 'bg-primary-500' },
              { label: 'Nouveaux patients', value: patientSummary.new_patients, icon: 'person_add', color: 'bg-green-500' },
              { label: 'Avec suivi', value: patientSummary.patients_with_follow_up, icon: 'calendar_today', color: 'bg-purple-500' },
              { label: 'Avec email', value: patientSummary.patients_with_email, icon: 'email', color: 'bg-blue-500' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-soft p-5 border border-neutral-100">
                <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}>
                  <span className="material-icons-round text-white">{s.icon}</span>
                </div>
                <p className="text-2xl font-bold text-neutral-800">{s.value}</p>
                <p className="text-sm text-neutral-500">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && selected === 'appointments' && (
          <div className="bg-white rounded-2xl shadow-soft p-8 text-center border border-neutral-100">
            <span className="material-icons-round text-5xl text-neutral-300 mb-3 block">schedule</span>
            <p className="text-lg font-medium text-neutral-500">Statistiques des rendez-vous</p>
            <p className="text-sm text-neutral-400 mt-1">Les graphiques de rendez-vous seront disponibles dans la prochaine mise à jour.</p>
            <p className="text-xs text-neutral-300 mt-3">En attendant, consultez le Calendrier pour voir les rendez-vous du jour.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
