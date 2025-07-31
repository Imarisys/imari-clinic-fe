// API Configuration
export const API_CONFIG = {
  baseUrl: 'http://localhost:8000',
  baseURL: 'http://localhost:8000', // Legacy compatibility
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
    },
    appointments: {
      list: '/api/v1/appointments',
      byPatient: (patientId: string) => `/api/v1/appointments/patient/${patientId}`,
      get: (id: string) => `/api/v1/appointments/${id}`,
      create: '/api/v1/appointments',
      update: (id: string) => `/api/v1/appointments/${id}`,
      delete: (id: string) => `/api/v1/appointments/${id}`,
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
