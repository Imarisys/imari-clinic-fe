import { API_CONFIG } from '../config/api';

export interface AppointmentType {
  name: string;
  duration_minutes: number;
  cost: number;
  icon: string;
}

export interface AppointmentTypeCreate {
  name: string;
  duration_minutes: number;
  cost: number;
  icon: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
}

export class AppointmentTypeService {
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

  public static async listAppointmentTypes(): Promise<AppointmentType[]> {
    return this.request<AppointmentType[]>(API_CONFIG.endpoints.appointmentTypes.list);
  }

  // Get all appointment types - alias for listAppointmentTypes
  public static async getAll(): Promise<AppointmentType[]> {
    return this.listAppointmentTypes();
  }

  public static async getAppointmentType(id: string): Promise<AppointmentType> {
    return this.request<AppointmentType>(API_CONFIG.endpoints.appointmentTypes.get(id));
  }

  public static async getAvailableSlots(
    appointmentTypeName: string,
    date: string
  ): Promise<TimeSlot[]> {
    return this.request<TimeSlot[]>(
      API_CONFIG.endpoints.appointmentTypes.availableSlots(appointmentTypeName, date)
    );
  }

  public static async createAppointmentType(
    appointmentTypeData: AppointmentTypeCreate
  ): Promise<AppointmentType> {
    return this.request<AppointmentType>('/api/v1/appointment-types/', {
      method: 'POST',
      body: JSON.stringify(appointmentTypeData),
    });
  }

  public static async updateAppointmentType(
    appointmentName: string,
    data: Partial<AppointmentTypeCreate>
  ): Promise<AppointmentType> {
    return this.request<AppointmentType>(`/api/v1/appointment-types/${appointmentName}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public static async deleteAppointmentType(appointmentName: string): Promise<void> {
    return this.request<void>(`/api/v1/appointment-types/${appointmentName}`, {
      method: 'DELETE',
    });
  }
}
