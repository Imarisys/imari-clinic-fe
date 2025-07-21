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

  // Fetch appointments for today (fix: use start_date param)
  static async getTodaysAppointments(): Promise<Appointment[]> {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    // Use start_date as required by API spec
    return this.request<Appointment[]>(`${API_CONFIG.endpoints.appointments.list}?start_date=${dateStr}`);
  }

  static async updateAppointmentStatus(id: string, status: 'Booked' | 'Cancelled' | 'Completed' | 'No Show'): Promise<Appointment> {
    // Mock: just return the updated appointment
    return {
      id,
      patient_id: '1',
      patient_first_name: 'John',
      patient_last_name: 'Doe',
      date: '2025-07-21',
      start_time: '09:00:00',
      end_time: '09:30:00',
      type: 'Consultation',
      status,
      title: 'Consultation with John Doe',
      notes: null
    };
  }
}

export const getTodaysAppointments = () => {
  const today = new Date().toISOString().slice(0, 10);
  // Mocked data: filter appointments for today
  return [
    {
      id: 1,
      patient_id: 1,
      patient_first_name: 'John',
      patient_last_name: 'Doe',
      start_time: '09:00:00',
      end_time: '09:30:00',
      type: 'Consultation',
      status: 'Booked',
      notes: '',
      created_at: today + 'T08:00:00Z',
      updated_at: today + 'T08:00:00Z'
    },
    {
      id: 2,
      patient_id: 2,
      patient_first_name: 'Sarah',
      patient_last_name: 'Wilson',
      start_time: '10:30:00',
      end_time: '11:00:00',
      type: 'Follow-up',
      status: 'Completed',
      notes: '',
      created_at: today + 'T09:00:00Z',
      updated_at: today + 'T09:00:00Z'
    },
    {
      id: 3,
      patient_id: 3,
      patient_first_name: 'Mike',
      patient_last_name: 'Johnson',
      start_time: '11:15:00',
      end_time: '11:45:00',
      type: 'Check-up',
      status: 'Booked',
      notes: '',
      created_at: today + 'T10:00:00Z',
      updated_at: today + 'T10:00:00Z'
    }
  ];
};

export const startAppointment = (appointmentId: number) => {
  // Mock: update status to 'In Progress'
  // In a real app, this would update backend data
  return {
    success: true,
    appointmentId,
    status: 'In Progress',
    started_at: new Date().toISOString()
  };
};
