import { API_CONFIG } from '../config/api';
import { authService } from './authService';

const BASE = API_CONFIG.baseURL;
const h = () => authService.getAuthHeaders();

export interface Prescription {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string | null;
  notes: string | null;
  start_date: string;
  end_date: string | null;
  prescribed_by_name: string;
  created_at: string;
}

export const PrescriptionService = {
  listForPatient: (patientId: string): Promise<Prescription[]> =>
    fetch(`${BASE}/api/v1/prescriptions/patient/${patientId}`, { headers: h() }).then(r => r.json()),

  create: (data: any): Promise<Prescription> =>
    fetch(`${BASE}/api/v1/prescriptions/`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),

  update: (id: string, data: any): Promise<Prescription> =>
    fetch(`${BASE}/api/v1/prescriptions/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),

  delete: (id: string): Promise<void> =>
    fetch(`${BASE}/api/v1/prescriptions/${id}`, { method: 'DELETE', headers: h() }).then(() => {}),
};
