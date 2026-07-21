// API Configuration
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
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
      byPatient: (patientId: string) => `/api/v1/appointments/by_patient/${patientId}`,
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
