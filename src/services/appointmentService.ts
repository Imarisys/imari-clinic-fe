import { Appointment, AppointmentCreate, AppointmentUpdate } from '../types/Appointment';
import { API_CONFIG } from '../config/api';

export class AppointmentService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_CONFIG.baseURL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  }

  static async listAppointments(): Promise<Appointment[]> {
    return this.request<Appointment[]>(API_CONFIG.endpoints.appointments.list);
  }

  static async getAppointment(id: string): Promise<Appointment> {
    return this.request<Appointment>(API_CONFIG.endpoints.appointments.get(id));
  }

  static async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    return this.request<Appointment[]>(API_CONFIG.endpoints.appointments.byPatient(patientId));
  }

  static async createAppointment(appointmentData: AppointmentCreate): Promise<Appointment> {
    return this.request<Appointment>(API_CONFIG.endpoints.appointments.create, {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  static async updateAppointment(id: string, appointmentData: AppointmentUpdate): Promise<Appointment> {
    return this.request<Appointment>(API_CONFIG.endpoints.appointments.update(id), {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    });
  }

  static async deleteAppointment(id: string): Promise<void> {
    return this.request<void>(API_CONFIG.endpoints.appointments.delete(id), {
      method: 'DELETE',
    });
  }

  static async listAppointmentsByRange(startDate: string, days: number): Promise<Appointment[]> {
    const params = new URLSearchParams({ start_date: startDate, days: days.toString() });
    return this.request<Appointment[]>(`${API_CONFIG.endpoints.appointments.list}?${params.toString()}`);
  }

  static async getTodayAppointments(): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    // Use the API's query parameters for filtering by date
    return this.listAppointmentsByRange(today, 1);
  }
}
