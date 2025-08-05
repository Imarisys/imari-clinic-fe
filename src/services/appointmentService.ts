import { Appointment, AppointmentCreate, AppointmentUpdate } from '../types/Appointment';
import { AppointmentMedicalData, AppointmentMedicalDataUpdate } from '../types/Medical';
import { API_CONFIG } from '../config/api';

export interface TimeSlot {
  start_time: string;
  end_time: string;
}

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

  // Fetch appointments for today (use start_date and days=1, remove duplicate mock/export)
  static async getTodaysAppointments(): Promise<Appointment[]> {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    // Use start_date and days=1 as required by API spec
    return this.request<Appointment[]>(`${API_CONFIG.endpoints.appointments.list}?start_date=${dateStr}&days=1`);
  }

  static async updateAppointmentStatus(id: string, status: 'Booked' | 'Cancelled' | 'Completed' | 'No Show'): Promise<Appointment> {
    return this.request<Appointment>(API_CONFIG.endpoints.appointments.update(id), {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  static async startAppointment(id: string): Promise<Appointment> {
    return this.request<Appointment>(`${API_CONFIG.endpoints.appointments.progress(id)}?action=start`, {
      method: 'PUT',
    });
  }

  static async endAppointment(id: string): Promise<Appointment> {
    return this.request<Appointment>(`${API_CONFIG.endpoints.appointments.progress(id)}?action=end`, {
      method: 'PUT',
    });
  }

  static async getAvailableSlots(
    appointmentTypeName: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<TimeSlot[]> {
    const params = new URLSearchParams({
      start_time: startTime,
      end_time: endTime
    });
    return this.request<TimeSlot[]>(`/api/v1/appointment-types/${appointmentTypeName}/available-slots/${date}?${params.toString()}`);
  }

  static async getMedicalData(appointmentId: string): Promise<AppointmentMedicalData> {
    return this.request<AppointmentMedicalData>(API_CONFIG.endpoints.appointments.medical.get(appointmentId));
  }

  static async updateMedicalData(appointmentId: string, medicalData: AppointmentMedicalDataUpdate): Promise<AppointmentMedicalData> {
    return this.request<AppointmentMedicalData>(API_CONFIG.endpoints.appointments.medical.update(appointmentId), {
      method: 'PUT',
      body: JSON.stringify(medicalData),
    });
  }

  static async getMedicalDataByDate(date: string): Promise<AppointmentMedicalData[]> {
    return this.request<AppointmentMedicalData[]>(API_CONFIG.endpoints.appointments.medical.byDate(date));
  }
}
