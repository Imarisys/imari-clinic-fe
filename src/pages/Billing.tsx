import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { BillingService, Invoice, InvoiceDetail } from '../services/billingService';
import { PatientService } from '../services/patientService';
import { Patient } from '../types/Patient';

export const Billing: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'list' | 'create') || 'list';
  const urlPatientId = searchParams.get('patient_id') || '';

  const [statusFilter, setStatusFilter] = useState('');
  const [patientFilter, setPatientFilter] = useState(urlPatientId);

  useEffect(() => { setPatientFilter(urlPatientId); }, [urlPatientId]);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selected, setSelected] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [patientBalance, setPatientBalance] = useState<number | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payTarget, setPayTarget] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');

  const [newInv, setNewInv] = useState({ patient_id: '', amount: '', insurance_coverage_pct: '70', notes: '', due_date: '' });

  const fmt = (n: number) => `${(n || 0).toFixed(3)} TND`;
  const statusCls = (s: string) => s === 'payée' || s === 'paid' ? 'bg-green-100 text-green-700'
    : s === 'partielle' || s === 'partial' ? 'bg-yellow-100 text-yellow-700'
    : s === 'annulée' || s === 'cancelled' ? 'bg-red-100 text-red-700'
    : 'bg-blue-100 text-blue-700';
  const statusLabel = (s: string) =>
    s === 'paid' || s === 'payée' ? 'Payée' : s === 'partial' || s === 'partielle' ? 'Partielle'
    : s === 'cancelled' || s === 'annulée' ? 'Annulée' : 'En attente';

  const totals = {
    invoiced: invoices.reduce((s, i) => s + i.amount, 0),
    collected: invoices.reduce((s, i) => s + i.paid_amount, 0),
    outstanding: invoices.reduce((s, i) => s + i.outstanding, 0),
    insurance: invoices.reduce((s, i) => s + (i.insurance_amount || 0), 0),
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (patientFilter) params.set('patient_id', patientFilter);
      setInvoices(await BillingService.list(params.toString()));
    } catch { setInvoices([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter, patientFilter]);
  useEffect(() => { PatientService.listPatients(0, 100).then(r => setPatients(r.data)).catch(() => {}); }, []);
  useEffect(() => {
    if (patientFilter) {
      BillingService.getPatientBalance(patientFilter).then(r => setPatientBalance(r.outstanding_balance)).catch(() => setPatientBalance(null));
    } else {
      setPatientBalance(null);
    }
  }, [patientFilter]);

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const openDetail = async (inv: Invoice) => {
    try { setSelected(await BillingService.get(inv.id)); } catch {}
  };

  const createInvoice = async () => {
    await BillingService.create({
      ...newInv,
      amount: parseFloat(newInv.amount) || 0,
      insurance_coverage_pct: parseFloat(newInv.insurance_coverage_pct) || 70,
    });
    setShowCreateModal(false); setNewInv({ patient_id: '', amount: '', insurance_coverage_pct: '70', notes: '', due_date: '' });
    load();
  };

  const recordPayment = async () => {
    if (!payTarget) return;
    await BillingService.recordPayment({ invoice_id: payTarget.id, amount: parseFloat(payAmount), payment_method: payMethod });
    setShowPaymentModal(false); setPayAmount('');
    load(); if (selected) openDetail(payTarget);
  };

  const renderHeader = () => (
    <div className="card mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-600 mb-2">Facturation</h1>
          <p className="text-neutral-600">Gestion des factures, paiements et prise en charge CNAM</p>
        </div>
        <div className="flex items-center gap-1 bg-neutral-100 rounded-xl p-1">
          <button onClick={() => setSearchParams({ tab: 'list' })} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'list' ? 'bg-primary-500 text-white shadow' : 'text-neutral-600 hover:text-primary-600'}`}>
            Liste
          </button>
          <button onClick={() => setShowCreateModal(true)} className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${showCreateModal ? 'bg-primary-500 text-white shadow' : 'text-neutral-600 hover:text-primary-600'}`}>
            <span className="material-icons-round text-lg">add</span>Nouvelle
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-neutral-200 rounded-xl px-4 py-2.5 text-sm bg-white flex-1">
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="partial">Partielle</option>
            <option value="paid">Payée</option>
            <option value="cancelled">Annulée</option>
          </select>
          <select value={patientFilter} onChange={e => { setPatientFilter(e.target.value); if (!e.target.value) setSearchParams({ tab: 'list' }); }} className="border border-neutral-200 rounded-xl px-4 py-2.5 text-sm bg-white flex-1">
            <option value="">Tous les patients</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
          </select>
          {patientFilter && (
            <button onClick={() => { setPatientFilter(''); setSearchParams({ tab: 'list' }); }} className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1 shrink-0">
              <span className="material-icons-round text-sm">close</span>Effacer
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {patientBalance !== null && (
            <div className="bg-orange-50 rounded-xl px-4 py-2 text-sm">
              <span className="text-orange-500">Restant dû : </span>
              <span className="font-bold text-orange-700">{fmt(patientBalance)}</span>
            </div>
          )}
          <button onClick={refresh} className="btn-secondary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm">
            <span className={`material-icons-round text-lg ${refreshing ? 'animate-spin' : ''}`}>{refreshing ? 'sync' : 'refresh'}</span>
            Actualiser
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total facturé', value: fmt(totals.invoiced), color: 'text-primary-600' },
          { label: 'Part CNAM', value: fmt(totals.insurance), color: 'text-blue-600' },
          { label: 'Encaissé', value: fmt(totals.collected), color: 'text-green-600' },
          { label: 'Restant dû', value: fmt(totals.outstanding), color: 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className="bg-neutral-50 rounded-2xl p-4">
            <p className="text-xs text-neutral-400 mb-1">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {renderHeader()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {invoices.map(inv => (
              <div
                key={inv.id}
                onClick={() => openDetail(inv)}
                className={`card card-hover slide-up-element cursor-pointer ${selected?.id === inv.id ? 'ring-2 ring-primary-500' : ''}`}
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-500 rounded-2xl shadow-medium text-white flex items-center justify-center shrink-0">
                    <span className="material-icons-round text-xl">receipt_long</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-neutral-800 truncate">{inv.patient_name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ml-2 ${statusCls(inv.status)}`}>{statusLabel(inv.status)}</span>
                    </div>
                    <p className="text-sm text-neutral-500 mt-0.5 truncate">{inv.notes || 'Sans description'}</p>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                      <div className="bg-neutral-50 rounded-lg px-2 py-1.5">
                        <p className="text-neutral-400">Total</p>
                        <p className="font-bold text-neutral-800">{fmt(inv.amount)}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg px-2 py-1.5">
                        <p className="text-blue-400">CNAM {inv.insurance_coverage_pct}%</p>
                        <p className="font-bold text-blue-600">{fmt(inv.insurance_amount || 0)}</p>
                      </div>
                      <div className={inv.outstanding > 0 ? 'bg-red-50 rounded-lg px-2 py-1.5' : 'bg-green-50 rounded-lg px-2 py-1.5'}>
                        <p className={inv.outstanding > 0 ? 'text-red-400' : 'text-green-400'}>{inv.outstanding > 0 ? 'Reste' : 'Payé'}</p>
                        <p className={`font-bold ${inv.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>{inv.outstanding > 0 ? fmt(inv.outstanding) : '✓'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {invoices.length === 0 && !loading && (
              <div className="col-span-full text-center py-12 text-neutral-400">
                <span className="material-icons-round text-5xl mb-3 block">receipt_long</span>
                <p className="text-lg font-medium">Aucune facture</p>
                <p className="text-sm mt-1">Créez une nouvelle facture pour commencer</p>
              </div>
            )}
            {loading && (
              <div className="col-span-full flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-soft p-6 h-fit sticky top-8">
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-neutral-800">{selected.patient_name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusCls(selected.status)}`}>{statusLabel(selected.status)}</span>
                </div>
                <p className="text-sm text-neutral-500">{selected.notes || 'Sans description'}</p>
                <p className="text-xs text-neutral-400">{selected.issued_date}{selected.due_date ? ` · Échéance : ${selected.due_date}` : ''}</p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <p className="text-neutral-400 text-xs mb-1">Montant total</p>
                    <p className="font-bold text-lg">{fmt(selected.amount)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-blue-400 text-xs mb-1">Part CNAM ({selected.insurance_coverage_pct}%)</p>
                    <p className="font-bold text-lg text-blue-600">{fmt(selected.insurance_amount)}</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4">
                    <p className="text-orange-400 text-xs mb-1">Ticket modérateur</p>
                    <p className="font-bold text-lg text-orange-600">{fmt(selected.patient_share)}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-green-400 text-xs mb-1">Déjà payé</p>
                    <p className="font-bold text-lg text-green-600">{fmt(selected.paid_amount)}</p>
                  </div>
                </div>

                {selected.status !== 'paid' && selected.status !== 'cancelled' && selected.status !== 'annulée' && (
                  <button
                    onClick={() => { setPayTarget(selected); setPayAmount(String(selected.outstanding)); setShowPaymentModal(true); }}
                    className="w-full bg-primary-500 text-white py-3 rounded-xl font-medium hover:bg-primary-600 transition flex items-center justify-center gap-2"
                  >
                    <span className="material-icons-round">payments</span>Enregistrer un paiement
                  </button>
                )}

                <div>
                  <h4 className="font-semibold text-sm text-neutral-500 mb-2">Historique des paiements</h4>
                  {selected.payments?.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selected.payments.map(p => (
                        <div key={p.id} className="flex items-center justify-between text-sm p-3 bg-neutral-50 rounded-xl">
                          <div>
                            <p className="font-semibold">{fmt(p.amount)}</p>
                            <p className="text-xs text-neutral-400 capitalize">{p.payment_method === 'cash' ? 'Espèces' : p.payment_method === 'card' ? 'Carte' : p.payment_method === 'transfer' ? 'Virement' : p.payment_method === 'insurance' ? 'CNAM' : 'Autre'}</p>
                          </div>
                          <div className="text-right text-xs text-neutral-400">
                            <p>{new Date(p.payment_date).toLocaleDateString('fr-TN')}</p>
                            <p>{p.received_by_name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400 py-6 text-center">Aucun paiement enregistré</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-neutral-400">
                <span className="material-icons-round text-5xl mb-3 block">touch_app</span>
                <p className="font-medium">Sélectionnez une facture</p>
                <p className="text-sm mt-1">pour voir les détails et enregistrer un paiement</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Nouvelle facture</h3>
                <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center">
                  <span className="material-icons-round text-neutral-400">close</span>
                </button>
              </div>

              <label className="block text-sm font-medium text-neutral-700 mb-1">Patient</label>
              <select value={newInv.patient_id} onChange={e => setNewInv({ ...newInv, patient_id: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 mb-4 text-sm">
                <option value="">Sélectionner un patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </select>

              <label className="block text-sm font-medium text-neutral-700 mb-1">Montant total (TND)</label>
              <input type="number" value={newInv.amount} onChange={e => setNewInv({ ...newInv, amount: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 mb-4 text-sm" placeholder="Ex: 300.000" />

              <label className="block text-sm font-medium text-neutral-700 mb-1">Couverture CNAM (%)</label>
              <select value={newInv.insurance_coverage_pct} onChange={e => setNewInv({ ...newInv, insurance_coverage_pct: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 mb-4 text-sm">
                <option value="70">70% — CNAM standard</option>
                <option value="80">80% — Mutuelle</option>
                <option value="100">100% — Prise en charge totale</option>
                <option value="0">0% — Non conventionné</option>
              </select>
              {newInv.amount && (
                <div className="bg-blue-50 rounded-xl p-3 mb-4 text-sm">
                  <div className="flex justify-between"><span className="text-blue-600">Total</span><span className="font-bold">{fmt(parseFloat(newInv.amount))}</span></div>
                  <div className="flex justify-between mt-1"><span className="text-blue-500">Part CNAM</span><span className="font-bold">{fmt(parseFloat(newInv.amount) * parseInt(newInv.insurance_coverage_pct) / 100)}</span></div>
                  <div className="flex justify-between mt-1"><span className="text-orange-500">Ticket modérateur</span><span className="font-bold text-orange-600">{fmt(parseFloat(newInv.amount) * (100 - parseInt(newInv.insurance_coverage_pct)) / 100)}</span></div>
                </div>
              )}

              <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
              <input value={newInv.notes} onChange={e => setNewInv({ ...newInv, notes: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 mb-4 text-sm" placeholder="Ex: Consultation + Détartrage" />

              <label className="block text-sm font-medium text-neutral-700 mb-1">Date d'échéance</label>
              <input type="date" value={newInv.due_date} onChange={e => setNewInv({ ...newInv, due_date: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 mb-6 text-sm" />

              <div className="flex gap-3">
                <button onClick={createInvoice} disabled={!newInv.patient_id || !newInv.amount} className="flex-1 bg-primary-500 text-white py-2.5 rounded-xl font-medium disabled:opacity-40 hover:bg-primary-600">
                  Créer la facture
                </button>
                <button onClick={() => setShowCreateModal(false)} className="flex-1 border py-2.5 rounded-xl text-sm">Annuler</button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && payTarget && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Enregistrer un paiement</h3>
                <button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center">
                  <span className="material-icons-round text-neutral-400">close</span>
                </button>
              </div>

              <p className="text-sm text-neutral-500 mb-4"><span className="font-medium">{payTarget.patient_name}</span> — Ticket modérateur restant : <span className="font-bold text-red-600">{fmt(payTarget.outstanding)}</span></p>

              <label className="block text-sm font-medium text-neutral-700 mb-1">Montant reçu (TND)</label>
              <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} max={payTarget.outstanding} className="w-full border rounded-xl px-3 py-2.5 mb-4 text-sm" />

              <label className="block text-sm font-medium text-neutral-700 mb-1">Mode de paiement</label>
              <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="w-full border rounded-xl px-3 py-2.5 mb-6 text-sm">
                <option value="cash">Espèces</option>
                <option value="card">Carte bancaire</option>
                <option value="transfer">Virement</option>
                <option value="insurance">CNAM / Mutuelle</option>
                <option value="other">Autre</option>
              </select>

              <div className="flex gap-3">
                <button onClick={recordPayment} disabled={!payAmount || parseFloat(payAmount) <= 0 || parseFloat(payAmount) > payTarget.outstanding} className="flex-1 bg-primary-500 text-white py-2.5 rounded-xl font-medium disabled:opacity-40 hover:bg-primary-600">
                  Enregistrer
                </button>
                <button onClick={() => setShowPaymentModal(false)} className="flex-1 border py-2.5 rounded-xl text-sm">Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
