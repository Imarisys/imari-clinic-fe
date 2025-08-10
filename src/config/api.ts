// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.REACT_APP_API_BASE_URL || 'localhost:8000',
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
  endpoints: {
    auth: {
      login: '/api/v1/auth/login',
    },
    patients: {
      list: '/api/v1/patients',
      search: '/api/v1/patients/search',
      summary: '/api/v1/patients/summary',
      export: '/api/v1/patients/export',
      get: (id: string) => `/api/v1/patients/${id}`,
      create: '/api/v1/patients',
      update: (id: string) => `/api/v1/patients/${id}`,
      delete: (id: string) => `/api/v1/patients/${id}`,
      medicalHistory: (patientId: string) => `/api/v1/patients/${patientId}/medical-history`,
    },
    appointments: {
      list: '/api/v1/appointments',
      byPatient: (patientId: string) => `/api/v1/appointments/patient/${patientId}`,
      get: (id: string) => `/api/v1/appointments/${id}`,
      create: '/api/v1/appointments',
      update: (id: string) => `/api/v1/appointments/${id}`,
      delete: (id: string) => `/api/v1/appointments/${id}`,
      progress: (id: string) => `/api/v1/appointments/${id}/progress`,
      medical: {
        get: (appointmentId: string) => `/api/v1/appointments/${appointmentId}/medical`,
        update: (appointmentId: string) => `/api/v1/appointments/${appointmentId}/medical`,
        byDate: (date: string) => `/api/v1/appointments/medical/by_date/${date}`,
      },
    },
    appointmentTypes: {
      list: '/api/v1/appointment-types',
      get: (id: string) => `/api/v1/appointment-types/${id}`,
      create: '/api/v1/appointment-types',
      update: (id: string) => `/api/v1/appointment-types/${id}`,
      delete: (id: string) => `/api/v1/appointment-types/${id}`,
      availableSlots: (appointmentTypeName: string, date: string) =>
        `/api/v1/appointment-types/${appointmentTypeName}/available-slots?date=${date}`,
    },
    weather: {
      get: (countryCode: string, city: string) =>
        `/api/v1/weather/${countryCode}/${encodeURIComponent(city)}`,
    },
  },
};

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseUrl}${endpoint}`;
};

// Simple API instance for reports
export const api = {
  get: async (url: string): Promise<{ data: any }> => {
    // Mock implementation for development - return appropriate data based on endpoint
    if (url.includes('/reports/performance')) {
      return {
        data: {
          totalAppointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0,
          noShowRate: 0,
          averageWaitTime: 0,
          patientSatisfaction: 0,
          revenue: 0,
          newPatients: 0
        }
      };
    }
    if (url.includes('/preconditions/')) {
      // Mock preconditions data for development
      return {
        data: {
          data: [], // Empty preconditions list
          total: 0
        }
      };
    }
    // For other endpoints, return empty array
    return { data: [] };
  },
  post: async (url: string, data: any, config?: any): Promise<{ data: any }> => {
    // Mock implementation for development
    if (url.includes('/preconditions/')) {
      // Return mock created precondition
      return {
        data: {
          id: Date.now().toString(),
          patient_id: data.patient_id,
          name: data.name,
          date: data.date,
          note: data.note
        }
      };
    }
    return { data: null };
  },
  put: async (url: string, data: any, config?: any): Promise<{ data: any }> => {
    // Mock implementation for development
    if (url.includes('/preconditions/')) {
      // Return mock updated precondition
      const id = url.split('/').pop();
      return {
        data: {
          id,
          patient_id: 'mock_patient_id',
          name: data.name || 'Updated Condition',
          date: data.date || new Date().toISOString().split('T')[0],
          note: data.note
        }
      };
    }
    return { data: null };
  },
  delete: async (url: string): Promise<{ data: any }> => {
    // Mock implementation for development
    return { data: null };
  }
};
