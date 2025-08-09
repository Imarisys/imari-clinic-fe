import { API_CONFIG } from '../config/api';

export interface Precondition {
  id: string;
  patient_id: string;
  name: string;
  date: string;
  note?: string;
}

export interface PreconditionCreate {
  patient_id: string;
  name: string;
  date: string;
  note?: string;
}

export interface PreconditionUpdate {
  name?: string;
  date?: string;
  note?: string;
}

export interface PreconditionListResponse {
  data: Precondition[];
  total: number;
}

// Helper function to handle HTTP errors
const handleHttpError = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  return response;
};

export class PreconditionService {
  /**
   * Get all preconditions for a specific patient
   */
  static async getPatientPreconditions(patientId: string): Promise<PreconditionListResponse> {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/api/v1/preconditions/${patientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      await handleHttpError(response);
      return await response.json();
    } catch (error) {
      console.error('Error fetching patient preconditions:', error);
      throw error;
    }
  }

  /**
   * Create a new precondition
   */
  static async createPrecondition(precondition: PreconditionCreate): Promise<Precondition> {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/api/v1/preconditions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(precondition),
      });
      
      await handleHttpError(response);
      return await response.json();
    } catch (error) {
      console.error('Error creating precondition:', error);
      throw error;
    }
  }

  /**
   * Update an existing precondition
   */
  static async updatePrecondition(preconditionId: string, update: PreconditionUpdate): Promise<Precondition> {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/api/v1/preconditions/${preconditionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(update),
      });
      
      await handleHttpError(response);
      return await response.json();
    } catch (error) {
      console.error('Error updating precondition:', error);
      throw error;
    }
  }

  /**
   * Delete a precondition
   */
  static async deletePrecondition(preconditionId: string): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/api/v1/preconditions/${preconditionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      await handleHttpError(response);
      // Delete endpoint returns empty response, so no need to parse JSON
    } catch (error) {
      console.error('Error deleting precondition:', error);
      throw error;
    }
  }
}
