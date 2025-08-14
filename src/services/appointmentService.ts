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

  // Helper function to format date to YYYY-MM-DD
  private static formatDate(date: string | null | undefined): string | null {
    if (!date) return null;

    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    // Handle datetime strings (extract date part)
    if (date.includes('T')) {
      return date.split('T')[0];
    }

    // Try to parse as Date and format
    try {
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (error) {
      console.error('Error parsing date:', error);
    }

    return date;
  }

  // Helper function to format time from HH:MM to HH:MM:SS
  private static formatTimeToSeconds(time: string | null | undefined): string | null {
    if (!time) return null;

    // Handle datetime strings (extract time part)
    if (time.includes('T')) {
      time = time.split('T')[1];
    }

    // Remove microseconds and extra colons if present (e.g., "06:15:00:00.000000" -> "06:15:00")
    if (time.includes('.')) {
      time = time.split('.')[0];
    }

    // Split by colon and take only first 3 parts (HH:MM:SS)
    const parts = time.split(':');
    if (parts.length >= 2) {
      const hours = parts[0].padStart(2, '0');
      const minutes = parts[1].padStart(2, '0');
      const seconds = parts.length >= 3 ? parts[2].padStart(2, '0') : '00';
      return `${hours}:${minutes}:${seconds}`;
    }

    return time;
  }

  // Helper function to remove null and undefined values from an object
  private static removeNullValues<T>(obj: T): Partial<T> {
    const result: Partial<T> = {};
    
    for (const key in obj) {
      if (obj[key] !== null && obj[key] !== undefined) {
        result[key] = obj[key];
      }
    }
    
    return result;
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
    // Format date and time fields as expected by the API
    const formattedData: AppointmentCreate = {
      ...appointmentData,
      date: this.formatDate(appointmentData.date) || appointmentData.date,
      start_time: this.formatTimeToSeconds(appointmentData.start_time) || appointmentData.start_time,
      end_time: this.formatTimeToSeconds(appointmentData.end_time) || appointmentData.end_time,
    };

    return this.request<Appointment>(API_CONFIG.endpoints.appointments.create, {
      method: 'POST',
      body: JSON.stringify(formattedData),
    });
  }

  static async updateAppointment(id: string, appointmentData: AppointmentUpdate): Promise<Appointment> {
    // Format date and time fields as expected by the API
    const formattedData: AppointmentUpdate = {
      ...appointmentData,
      date: this.formatDate(appointmentData.date),
      start_time: this.formatTimeToSeconds(appointmentData.start_time),
      end_time: this.formatTimeToSeconds(appointmentData.end_time),
    };

    // Remove null and undefined values from the request body
    const cleanedData = this.removeNullValues(formattedData);

    return this.request<Appointment>(API_CONFIG.endpoints.appointments.update(id), {
      method: 'PUT',
      body: JSON.stringify(cleanedData),
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
