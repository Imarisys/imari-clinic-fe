import { API_CONFIG } from '../config/api';

export class HealthCheckService {
  /**
   * Check if the backend server is ready by making a single request to the root endpoint
   * @returns Promise<boolean> - true if backend is ready, false otherwise
   */
  static async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Set a timeout for the health check
        signal: AbortSignal.timeout(100000), // 100 seconds as this is experimental
      });

      // Consider the backend healthy if we get any response (including redirects, etc.)
      return response.status === 200 || response.status < 500;
    } catch (error) {
      console.warn('Backend health check failed:', error);
      return false;
    }
  }
}
