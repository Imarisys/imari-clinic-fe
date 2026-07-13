import { API_CONFIG } from '../config/api';
import { authService } from './authService';

const BASE = API_CONFIG.baseURL;
const h = () => authService.getAuthHeaders();

export interface Invoice {
  id: string; patient_id: string; patient_name: string;
  amount: number; insurance_coverage_pct: number; insurance_amount: number;
  patient_share: number; paid_amount: number; outstanding: number;
  status: string; notes: string | null; issued_date: string; due_date: string | null;
  appointment_id?: string | null; treatment_id?: string | null;
}

export interface PaymentRead {
  id: string; invoice_id: string; amount: number;
  payment_method: string; payment_date: string;
  received_by_name: string; notes: string | null;
}

export interface InvoiceDetail extends Invoice { payments: PaymentRead[]; }

export interface RevenueSummary {
  total_revenue: number; collected: number; outstanding: number;
  collection_rate: number; pending_invoices: number;
  partial_invoices: number; paid_invoices: number;
}

export interface Analytics {
  today: RevenueSummary; this_week: RevenueSummary; this_month: RevenueSummary;
  total_patients: number; total_appointments: number;
}

export const BillingService = {
  list: (params?: string): Promise<Invoice[]> =>
    fetch(`${BASE}/api/v1/billing/invoices${params ? '?' + params : ''}`, { headers: h() }).then(r => r.json()),

  get: (id: string): Promise<InvoiceDetail> =>
    fetch(`${BASE}/api/v1/billing/invoices/${id}`, { headers: h() }).then(r => r.json()),

  create: (data: any): Promise<Invoice> =>
    fetch(`${BASE}/api/v1/billing/invoices`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),

  recordPayment: (data: any): Promise<PaymentRead> =>
    fetch(`${BASE}/api/v1/billing/payments`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),

  getAnalytics: (): Promise<Analytics> =>
    fetch(`${BASE}/api/v1/billing/analytics`, { headers: h() }).then(r => r.json()),

  getPatientBalance: (patientId: string): Promise<{ patient_id: string; outstanding_balance: number }> =>
    fetch(`${BASE}/api/v1/billing/patients/${patientId}/balance`, { headers: h() }).then(r => r.json()),
};
