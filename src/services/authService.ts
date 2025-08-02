import { API_CONFIG, buildApiUrl } from '../config/api';
import { LoginRequest, LoginResponse } from '../types/Auth';

class AuthService {
  private static instance: AuthService;

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(buildApiUrl('/api/v1/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        // Try to parse error message from response
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.detail || 'Invalid credentials';
        } catch {
          // Fallback to status-based messages if JSON parsing fails
          switch (response.status) {
            case 401:
              errorMessage = 'Invalid email or password';
              break;
            case 403:
              errorMessage = 'Access denied. Please contact administrator';
              break;
            case 429:
              errorMessage = 'Too many login attempts. Please try again later';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later';
              break;
            default:
              errorMessage = 'Login failed. Please try again';
          }
        }
        throw new Error(errorMessage);
      }

      const data: LoginResponse = await response.json();

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(data));
      localStorage.setItem('isAuthenticated', 'true');

      return data;
    } catch (error) {
      // If it's already our custom error, re-throw it
      if (error instanceof Error) {
        throw error;
      }
      // Handle network errors or other unexpected errors
      throw new Error('Network error. Please check your connection and try again');
    }
  }

  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
  }

  getCurrentUser(): LoginResponse | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('isAuthenticated') === 'true';
  }

  getDoctorId(): string | null {
    const user = this.getCurrentUser();
    console.log('Current user data:', user); // Debug log
    console.log('User data type:', typeof user); // Debug log
    console.log('User keys:', user ? Object.keys(user) : 'null'); // Debug log

    // Use 'id' field as the doctor ID since that's what the login API returns
    const doctorId = user?.id || null;
    console.log('Doctor ID extracted:', doctorId); // Debug log
    return doctorId;
  }
}

export const authService = AuthService.getInstance();
