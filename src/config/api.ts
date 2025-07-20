// API Configuration
export const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_HOST || 'http://localhost:8000',
  endpoints: {
    patients: {
      list: '/api/v1/patients/',
      create: '/api/v1/patients/',
      get: (id: string) => `/api/v1/patients/${id}`,
      update: (id: string) => `/api/v1/patients/${id}`,
      delete: (id: string) => `/api/v1/patients/${id}`,
    },
    appointments: {
      list: '/api/v1/appointments/',
      create: '/api/v1/appointments/',
      get: (id: string) => `/api/v1/appointments/${id}`,
      update: (id: string) => `/api/v1/appointments/${id}`,
      delete: (id: string) => `/api/v1/appointments/${id}`,
      byPatient: (patientId: string) => `/api/v1/appointments/by_patient/${patientId}`,
    },
    appointmentTypes: {
      list: '/api/v1/appointment-types',
      get: (id: string) => `/api/v1/appointment-types/${id}`,
      create: '/api/v1/appointment-types',
      update: (id: string) => `/api/v1/appointment-types/${id}`,
      delete: (id: string) => `/api/v1/appointment-types/${id}`,
      availableSlots: (typeName: string, date: string) =>
        `/api/v1/appointment-types/${typeName}/available-slots/${date}`,
    },
    weather: {
      get: (countryCode: string, city: string) => `/api/v1/weather/${countryCode}/${city}`,
    },
  },
} as const;

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseURL}${endpoint}`;
};
