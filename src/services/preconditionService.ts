import { API_CONFIG } from '../config/api';
import { authService } from './authService';

export interface Precondition {
  id: string;
  patient_id: string;
  name: string;
  date: string;
  note?: string;
}

export interface PreconditionCreate {
  patient_id: string;
  name: string;
  date: string;
  note?: string;
}

export interface PreconditionUpdate {
  name?: string;
  date?: string;
  note?: string;
}

export interface PreconditionListResponse {
  data: Precondition[];
  total: number;
}

export class PreconditionService {
  static async getPatientPreconditions(patientId: string): Promise<PreconditionListResponse> {
    const r = await fetch(`${API_CONFIG.baseUrl}/api/v1/preconditions/${patientId}`, { headers: authService.getAuthHeaders() });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  static async createPrecondition(precondition: PreconditionCreate): Promise<Precondition> {
    const r = await fetch(`${API_CONFIG.baseUrl}/api/v1/preconditions/`, {
      method: 'POST', headers: authService.getAuthHeaders(), body: JSON.stringify(precondition),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  static async createBatch(preconditions: PreconditionCreate[]): Promise<Precondition[]> {
    const r = await fetch(`${API_CONFIG.baseUrl}/api/v1/preconditions/batch`, {
      method: 'POST', headers: authService.getAuthHeaders(), body: JSON.stringify(preconditions),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  static async updatePrecondition(preconditionId: string, update: PreconditionUpdate): Promise<Precondition> {
    const r = await fetch(`${API_CONFIG.baseUrl}/api/v1/preconditions/${preconditionId}`, {
      method: 'PUT', headers: authService.getAuthHeaders(), body: JSON.stringify(update),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  static async deletePrecondition(preconditionId: string): Promise<void> {
    const r = await fetch(`${API_CONFIG.baseUrl}/api/v1/preconditions/${preconditionId}`, {
      method: 'DELETE', headers: authService.getAuthHeaders(),
    });
    if (!r.ok) throw new Error(await r.text());
  }
}
