import { API_CONFIG, buildApiUrl } from '../config/api';
import { Patient, PatientCreate, PatientUpdate, PatientRead, PatientListResponse, PatientSummary, PatientWithAppointments } from '../types/Patient';
import { PatientMedicalHistory } from '../types/Medical';

// Helper function to extract error message from response
const extractErrorMessage = async (response: Response): Promise<string> => {
  try {
    const errorData = await response.json();

    // Handle different error response formats
    if (errorData.detail) {
      return errorData.detail;
    }

    if (errorData.message) {
      return errorData.message;
    }

    if (errorData.error) {
      return errorData.error;
    }

    // Handle validation errors (array format)
    if (Array.isArray(errorData) && errorData.length > 0) {
      return errorData.map(err => err.msg || err.message || err).join(', ');
    }

    // Handle field-specific errors
    if (typeof errorData === 'object') {
      const fieldErrors = Object.entries(errorData)
        .map(([field, error]) => `${field}: ${error}`)
        .join(', ');
      if (fieldErrors) return fieldErrors;
    }

    return `HTTP ${response.status}: ${response.statusText}`;
  } catch {
    // If response is not JSON, return status text
    return `HTTP ${response.status}: ${response.statusText}`;
  }
};

// API service for patient operations
export class PatientService {
  // List patients with pagination
  static async listPatients(offset = 0, limit = 20): Promise<PatientListResponse> {
    try {
      const url = buildApiUrl(`${API_CONFIG.endpoints.patients.list}?offset=${offset}&limit=${limit}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorMessage = await extractErrorMessage(response);
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred while loading patients');
    }
  }

  // Search patients by query (first name, last name, phone, email)
  static async searchPatients(query: string, offset = 0, limit = 100): Promise<PatientListResponse> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = buildApiUrl(`${API_CONFIG.endpoints.patients.search}?term=${encodedQuery}&offset=${offset}&limit=${limit}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorMessage = await extractErrorMessage(response);
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred while searching patients');
    }
  }

  // Get patient summary statistics
  static async getPatientSummary(): Promise<PatientSummary> {
    try {
      const url = buildApiUrl(API_CONFIG.endpoints.patients.summary);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorMessage = await extractErrorMessage(response);
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred while fetching patient summary');
    }
  }

  // Export patients as Excel file
  static async exportPatients(): Promise<void> {
    try {
      const url = buildApiUrl(API_CONFIG.endpoints.patients.export);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorMessage = await extractErrorMessage(response);
        throw new Error(errorMessage);
      }

      // Get the filename from the response headers or use a default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'patients_export.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Get the blob data
      const blob = await response.blob();

      // Create a download link and trigger the download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred while exporting patients');
    }
  }

  // Get a single patient by ID
  static async getPatient(patientId: string): Promise<PatientRead> {
    try {
      const url = buildApiUrl(API_CONFIG.endpoints.patients.get(patientId));
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorMessage = await extractErrorMessage(response);
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred while fetching patient');
    }
  }

  // Create a new patient
  static async createPatient(patientData: PatientCreate): Promise<PatientRead> {
    try {
      const url = buildApiUrl(API_CONFIG.endpoints.patients.create);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });

      if (!response.ok) {
        const errorMessage = await extractErrorMessage(response);
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred while creating patient');
    }
  }

  // Update an existing patient
  static async updatePatient(patientId: string, patientData: PatientUpdate): Promise<PatientRead> {
    try {
      const url = buildApiUrl(API_CONFIG.endpoints.patients.update(patientId));
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });

      if (!response.ok) {
        const errorMessage = await extractErrorMessage(response);
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred while updating patient');
    }
  }

  // Delete a patient
  static async deletePatient(patientId: string): Promise<string> {
    try {
      const url = buildApiUrl(API_CONFIG.endpoints.patients.delete(patientId));
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorMessage = await extractErrorMessage(response);
        throw new Error(errorMessage);
      }
      // Expecting a JSON response with a message
      const data = await response.json();
      return data.message || 'Patient deleted successfully';
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred while deleting patient');
    }
  }

  // Get a single patient by ID with appointments
  static async getPatientWithAppointments(patientId: string): Promise<PatientWithAppointments> {
    try {
      const url = buildApiUrl(API_CONFIG.endpoints.patients.get(patientId));
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorMessage = await extractErrorMessage(response);
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred while fetching patient with appointments');
    }
  }

  // Get patient medical history
  static async getPatientMedicalHistory(patientId: string): Promise<PatientMedicalHistory> {
    try {
      const url = buildApiUrl(API_CONFIG.endpoints.patients.medicalHistory(patientId));
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorMessage = await extractErrorMessage(response);
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred while fetching patient medical history');
    }
  }
}
