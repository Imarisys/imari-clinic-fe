import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { BillingService, Invoice, InvoiceDetail } from '../services/billingService';
import { PatientService } from '../services/patientService';
import { Patient } from '../types/Patient';

interface DailyCollection { date: string; total: number; count: number; by_method: Record<string, number>; details: any[] }
interface OutstandingPatient { patient_id: string; patient_name: string; total: number; paid: number; outstanding: number; invoice_count: number }

export const Billing: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'caisse' | 'invoices' | 'suivi') || (user?.role === 'secretary' ? 'caisse' : 'suivi');
  const urlPatientId = searchParams.get('patient_id') || '';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selected, setSelected] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [patientBalance, setPatientBalance] = useState<number | null>(null);

  const [daily, setDaily] = useState<DailyCollection | null>(null);
  const [outstanding, setOutstanding] = useState<OutstandingPatient[]>([]);
  const [outstandingLoaded, setOutstandingLoaded] = useState(false);

  const [statusFilter, setStatusFilter] = useState('');
  const [patientFilter, setPatientFilter] = useState(urlPatientId);
  useEffect(() => { setPatientFilter(urlPatientId); }, [urlPatientId]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payTarget, setPayTarget] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');

  const [newInv, setNewInv] = useState({ patient_id: '', amount: '', insurance_coverage_pct: '70', notes: '', due_date: '' });
  const [quickCheckout, setQuickCheckout] = useState(false);
  const [quickPayAmount, setQuickPayAmount] = useState('');

  const fmt = (n: number) => `${(n || 0).toFixed(3)} TND`;
  const statusCls = (s: string) => s === 'paid' ? 'bg-green-100 text-green-700' : s === 'partial' ? 'bg-yellow-100 text-yellow-700' : s === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700';
  const statusLabel = (s: string) => s === 'paid' ? 'Payée' : s === 'partial' ? 'Partielle' : s === 'cancelled' ? 'Annulée' : 'En attente';
  const methodLabel = (m: string) => m === 'cash' ? 'Espèces' : m === 'card' ? 'Carte' : m === 'transfer' ? 'Virement' : m === 'insurance' ? 'CNAM' : 'Autre';

  const loadInvoices = async () => {
    setLoading(true);
    try { const params = new URLSearchParams(); if (statusFilter) params.set('status', statusFilter); if (patientFilter) params.set('patient_id', patientFilter); setInvoices(await BillingService.list(params.toString())); } catch { setInvoices([]); }
    setLoading(false);
  };
  const loadDaily = async () => { try { setDaily(await BillingService.getDailyCollections()); } catch {} };
  const loadOutstanding = async () => { try { setOutstanding(await BillingService.getOutstandingPatients()); } catch {} setOutstandingLoaded(true); };

  useEffect(() => { loadInvoices(); }, [statusFilter, patientFilter]);
  useEffect(() => { PatientService.listPatients(0, 100).then(r => setPatients(r.data)).catch(() => {}); }, []);
  useEffect(() => { if (activeTab === 'caisse') loadDaily(); if (activeTab === 'suivi') loadOutstanding(); }, [activeTab]);
  useEffect(() => { if (patientFilter) BillingService.getPatientBalance(patientFilter).then(r => setPatientBalance(r.outstanding_balance)).catch(() => setPatientBalance(null)); else setPatientBalance(null); }, [patientFilter]);

  const openDetail = async (inv: Invoice) => { try { setSelected(await BillingService.get(inv.id)); } catch {} };
  const createInvoice = async () => {
    const newInvoice = await BillingService.create({ ...newInv, amount: parseFloat(newInv.amount) || 0, insurance_coverage_pct: parseFloat(newInv.insurance_coverage_pct) || 70 });
    if (quickCheckout && quickPayAmount) await BillingService.recordPayment({ invoice_id: newInvoice.id, amount: parseFloat(quickPayAmount), payment_method: 'cash' });
    setShowCreateModal(false); setNewInv({ patient_id: '', amount: '', insurance_coverage_pct: '70', notes: '', due_date: '' }); setQuickCheckout(false); setQuickPayAmount('');
    loadInvoices(); loadDaily();
  };
  const recordPayment = async () => {
    if (!payTarget) return;
    await BillingService.recordPayment({ invoice_id: payTarget.id, amount: parseFloat(payAmount), payment_method: payMethod });
    setShowPaymentModal(false); setPayAmount(''); loadInvoices(); loadDaily(); if (selected) openDetail(payTarget);
  };

  const PatientSelect = ({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) => (
    <select value={value} onChange={e => onChange(e.target.value)} className={className || 'w-full border rounded-xl px-3 py-2.5 text-sm'}>
      <option value="">Sélectionner un patient</option>
      {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
    </select>
  );

  const tabs = [
    ...(user?.role === 'secretary' ? [{ key: 'caisse' as const, label: 'Caisse du jour', icon: 'point_of_sale' }] : []),
    { key: 'invoices' as const, label: 'Factures', icon: 'receipt_long' },
    ...(user?.role === 'doctor' ? [{ key: 'suivi' as const, label: 'Suivi impayés', icon: 'trending_up' }] : []),
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-4">
            <div><h1 className="text-3xl font-bold text-primary-600 mb-1">Facturation</h1><p className="text-neutral-500 text-sm">{activeTab === 'caisse' ? 'Encaissements et caisse du jour' : activeTab === 'suivi' ? 'Patients avec soldes impayés' : 'Gestion des factures et paiements'}</p></div>
            <button onClick={() => setShowCreateModal(true)} className="bg-primary-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary-600 flex items-center gap-2"><span className="material-icons-round">add</span> Nouvelle facture</button>
          </div>
          <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 w-fit">
            {tabs.map(tb => (<button key={tb.key} onClick={() => setSearchParams({ tab: tb.key })} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tb.key ? 'bg-white shadow text-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}><span className="material-icons-round text-lg">{tb.icon}</span>{tb.label}</button>))}
          </div>
        </div>

        {activeTab === 'caisse' && (
          <div>
            {!daily ? (<div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>) : (<>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[{ label: 'Total encaissé', value: fmt(daily.total), color: 'text-green-600', sub: `${daily.count} transaction${daily.count > 1 ? 's' : ''} aujourd'hui` },{ label: 'Espèces', value: fmt(daily.by_method?.cash || 0), color: 'text-neutral-800' },{ label: 'Carte bancaire', value: fmt(daily.by_method?.card || 0), color: 'text-blue-600' },{ label: 'CNAM / Virement', value: fmt((daily.by_method?.transfer || 0) + (daily.by_method?.insurance || 0)), color: 'text-purple-600' }].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-soft p-5 border border-neutral-100"><p className="text-sm text-neutral-400 mb-1">{s.label}</p><p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>{s.sub && <p className="text-xs text-neutral-400 mt-1">{s.sub}</p>}</div>
              ))}
            </div>
            <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b"><h3 className="font-semibold text-neutral-800">Transactions du {daily.date}</h3></div>
              <div className="divide-y">
                {daily.details.map((d: any) => (<div key={d.id} className="flex items-center justify-between px-6 py-3 hover:bg-neutral-50"><div><p className="font-medium text-sm">{d.patient_name}</p><p className="text-xs text-neutral-400">{new Date(d.payment_date).toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })}</p></div><div className="text-right"><p className="font-bold text-green-600">{fmt(d.amount)}</p><p className="text-xs text-neutral-400">{methodLabel(d.payment_method)}</p></div></div>))}
                {daily.details.length === 0 && (<div className="px-6 py-12 text-center text-neutral-400"><span className="material-icons-round text-4xl mb-2 block">receipt_long</span><p>Aucun encaissement aujourd'hui</p></div>)}
              </div>
            </div>
            </>)}
          </div>
        )}

        {activeTab === 'suivi' && (
          <div>
            {!outstandingLoaded ? (<div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>) : (<>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl shadow-soft p-5 border border-neutral-100"><p className="text-sm text-neutral-400 mb-1">Patients avec impayés</p><p className="text-3xl font-bold text-red-600">{outstanding.length}</p></div>
              <div className="bg-white rounded-2xl shadow-soft p-5 border border-neutral-100"><p className="text-sm text-neutral-400 mb-1">Total impayé</p><p className="text-3xl font-bold text-red-600">{fmt(outstanding.reduce((s, o) => s + o.outstanding, 0))}</p></div>
              <div className="bg-white rounded-2xl shadow-soft p-5 border border-neutral-100"><p className="text-sm text-neutral-400 mb-1">Taux de recouvrement</p><p className="text-3xl font-bold text-green-600">{outstanding.length > 0 ? Math.round((outstanding.reduce((s, o) => s + o.paid, 0) / (outstanding.reduce((s, o) => s + o.total, 0) || 1)) * 100) : 100}%</p></div>
            </div>
            <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b"><h3 className="font-semibold text-neutral-800">Soldes patients</h3></div>
              <div className="divide-y">
                {outstanding.map(o => (<div key={o.patient_id} className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50"><div><p className="font-semibold text-sm">{o.patient_name}</p><p className="text-xs text-neutral-400">{o.invoice_count} facture{o.invoice_count > 1 ? 's' : ''} · Payé: {fmt(o.paid)}</p></div><button onClick={() => { setPatientFilter(o.patient_id); setSearchParams({ tab: 'invoices', patient_id: o.patient_id }); }} className="text-right"><p className="font-bold text-red-600 text-lg">{fmt(o.outstanding)}</p><p className="text-xs text-primary-500 hover:underline mt-0.5">Voir factures</p></button></div>))}
                {outstanding.length === 0 && (<div className="px-6 py-12 text-center text-neutral-400"><span className="material-icons-round text-4xl mb-2 block">check_circle</span><p className="text-green-600 font-medium">Tous les patients sont à jour</p></div>)}
              </div>
            </div>
            </>)}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-xl px-3 py-2 text-sm"><option value="">Tous les statuts</option><option value="pending">En attente</option><option value="partial">Partielle</option><option value="paid">Payée</option><option value="cancelled">Annulée</option></select>
                <PatientSelect value={patientFilter} onChange={v => { setPatientFilter(v); if (!v) setSearchParams({ tab: 'invoices' }); }} className="border rounded-xl px-3 py-2 text-sm flex-1 min-w-[180px]" />
                {patientFilter && (<button onClick={() => { setPatientFilter(''); setSearchParams({ tab: 'invoices' }); }} className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"><span className="material-icons-round text-sm">close</span>Effacer</button>)}
                {patientBalance !== null && (<span className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-xl text-sm font-medium">Restant dû: {fmt(patientBalance)}</span>)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {loading && (<div className="col-span-full flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>)}
                {!loading && invoices.map(inv => (
                  <div key={inv.id} onClick={() => openDetail(inv)} className={`card card-hover cursor-pointer ${selected?.id === inv.id ? 'ring-2 ring-primary-500' : ''}`}>
                    <div className="flex items-start gap-3"><div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shrink-0"><span className="material-icons-round text-white text-lg">receipt_long</span></div>
                    <div className="flex-1 min-w-0"><div className="flex justify-between"><h4 className="font-semibold text-sm truncate">{inv.patient_name}</h4><span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ml-2 ${statusCls(inv.status)}`}>{statusLabel(inv.status)}</span></div>
                    <p className="text-xs text-neutral-400 truncate">{inv.notes || 'Sans description'} · {inv.issued_date}</p>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                      <div className="bg-neutral-50 rounded-lg p-1.5 text-center"><p className="text-neutral-400">Total</p><p className="font-bold">{fmt(inv.amount)}</p></div>
                      <div className="bg-blue-50 rounded-lg p-1.5 text-center"><p className="text-blue-400">CNAM</p><p className="font-bold text-blue-600">{fmt(inv.insurance_amount || 0)}</p></div>
                      <div className={inv.outstanding > 0 ? 'bg-red-50 rounded-lg p-1.5 text-center' : 'bg-green-50 rounded-lg p-1.5 text-center'}><p className={inv.outstanding > 0 ? 'text-red-400' : 'text-green-400'}>{inv.outstanding > 0 ? 'Reste' : 'Payé'}</p><p className={`font-bold ${inv.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>{inv.outstanding > 0 ? fmt(inv.outstanding) : '✓'}</p></div>
                    </div></div></div>
                  </div>
                ))}
                {!loading && invoices.length === 0 && (<div className="col-span-full text-center py-12 text-neutral-400"><span className="material-icons-round text-5xl mb-3 block">receipt_long</span><p>Aucune facture trouvée</p></div>)}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-soft p-6 h-fit sticky top-8">
              {selected ? (<div className="space-y-4">
                <div className="flex items-center justify-between"><h3 className="font-bold">{selected.patient_name}</h3><span className={`px-2 py-1 rounded-full text-xs ${statusCls(selected.status)}`}>{statusLabel(selected.status)}</span></div>
                <p className="text-sm text-neutral-500">{selected.notes || 'Sans description'}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-neutral-50 rounded-xl p-3"><p className="text-xs text-neutral-400">Total</p><p className="font-bold">{fmt(selected.amount)}</p></div>
                  <div className="bg-blue-50 rounded-xl p-3"><p className="text-xs text-blue-400">CNAM</p><p className="font-bold text-blue-600">{fmt(selected.insurance_amount)}</p></div>
                  <div className="bg-orange-50 rounded-xl p-3"><p className="text-xs text-orange-400">Ticket mod.</p><p className="font-bold text-orange-600">{fmt(selected.patient_share)}</p></div>
                  <div className="bg-green-50 rounded-xl p-3"><p className="text-xs text-green-400">Payé</p><p className="font-bold text-green-600">{fmt(selected.paid_amount)}</p></div>
                </div>
                {selected.status !== 'paid' && selected.status !== 'cancelled' && (<button onClick={() => { setPayTarget(selected); setPayAmount(String(selected.outstanding)); setShowPaymentModal(true); }} className="w-full bg-primary-500 text-white py-3 rounded-xl font-medium hover:bg-primary-600 flex items-center justify-center gap-2"><span className="material-icons-round">payments</span>Enregistrer un paiement</button>)}
                <h4 className="font-semibold text-sm text-neutral-500">Historique</h4>
                {selected.payments?.length > 0 ? (<div className="space-y-2 max-h-48 overflow-y-auto">{selected.payments.map(p => (<div key={p.id} className="flex justify-between text-sm p-3 bg-neutral-50 rounded-xl"><div><p className="font-semibold">{fmt(p.amount)}</p><p className="text-xs text-neutral-400">{methodLabel(p.payment_method)}</p></div><div className="text-right text-xs text-neutral-400"><p>{new Date(p.payment_date).toLocaleDateString('fr-TN')}</p><p>{p.received_by_name}</p></div></div>))}</div>) : <p className="text-xs text-neutral-400 py-4 text-center">Aucun paiement</p>}
              </div>) : (<div className="text-center py-12 text-neutral-400"><span className="material-icons-round text-5xl mb-3 block">touch_app</span><p>Sélectionnez une facture</p></div>)}
            </div>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold">Nouvelle facture</h3><button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center"><span className="material-icons-round text-neutral-400">close</span></button></div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Patient</label><PatientSelect value={newInv.patient_id} onChange={v => setNewInv({ ...newInv, patient_id: v })} />
              <label className="block text-sm font-medium text-neutral-700 mt-4 mb-1">Montant total (TND)</label><input type="number" value={newInv.amount} onChange={e => setNewInv({ ...newInv, amount: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm" placeholder="Ex: 300.000" />
              <label className="block text-sm font-medium text-neutral-700 mt-4 mb-1">Couverture CNAM (%)</label><select value={newInv.insurance_coverage_pct} onChange={e => setNewInv({ ...newInv, insurance_coverage_pct: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm"><option value="70">70% — CNAM</option><option value="80">80% — Mutuelle</option><option value="100">100% — Prise en charge</option><option value="0">0% — Non conventionné</option></select>
              {newInv.amount && (<div className="bg-blue-50 rounded-xl p-3 mt-3 text-xs"><div className="flex justify-between"><span>Ticket modérateur</span><span className="font-bold text-orange-600">{fmt(parseFloat(newInv.amount) * (100 - parseInt(newInv.insurance_coverage_pct)) / 100)}</span></div></div>)}
              <label className="block text-sm font-medium text-neutral-700 mt-4 mb-1">Description</label><input value={newInv.notes} onChange={e => setNewInv({ ...newInv, notes: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm" placeholder="Acte / traitement" />
              <div className="mt-4 p-3 bg-green-50 rounded-xl"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={quickCheckout} onChange={e => setQuickCheckout(e.target.checked)} className="rounded" /><span className="text-sm font-medium text-green-700">Encaisser immédiatement</span></label>{quickCheckout && newInv.amount && (<input type="number" value={quickPayAmount} onChange={e => setQuickPayAmount(e.target.value)} placeholder={fmt(parseFloat(newInv.amount) * (100 - parseInt(newInv.insurance_coverage_pct)) / 100)} className="w-full border rounded-xl px-3 py-2.5 text-sm mt-2" />)}</div>
              <div className="flex gap-3 mt-6"><button onClick={createInvoice} disabled={!newInv.patient_id || !newInv.amount} className="flex-1 bg-primary-500 text-white py-2.5 rounded-xl font-medium disabled:opacity-40 hover:bg-primary-600">Créer</button><button onClick={() => setShowCreateModal(false)} className="flex-1 border py-2.5 rounded-xl text-sm">Annuler</button></div>
            </div>
          </div>
        )}

        {showPaymentModal && payTarget && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">Enregistrer un paiement</h3><p className="text-sm text-neutral-500 mb-4"><span className="font-medium">{payTarget.patient_name}</span> — Ticket modérateur restant : <span className="font-bold text-red-600">{fmt(payTarget.outstanding)}</span></p>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Montant (TND)</label><input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} max={payTarget.outstanding} className="w-full border rounded-xl px-3 py-2.5 text-sm mb-4" />
              <label className="block text-sm font-medium text-neutral-700 mb-1">Mode de paiement</label><select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="w-full border rounded-xl px-3 py-2.5 text-sm mb-6"><option value="cash">Espèces</option><option value="card">Carte bancaire</option><option value="transfer">Virement</option><option value="insurance">CNAM</option><option value="other">Autre</option></select>
              <div className="flex gap-3"><button onClick={recordPayment} disabled={!payAmount || parseFloat(payAmount) <= 0 || parseFloat(payAmount) > payTarget.outstanding} className="flex-1 bg-primary-500 text-white py-2.5 rounded-xl font-medium disabled:opacity-40">Enregistrer</button><button onClick={() => setShowPaymentModal(false)} className="flex-1 border py-2.5 rounded-xl text-sm">Annuler</button></div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
