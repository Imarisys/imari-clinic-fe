import { buildApiUrl } from '../config/api';
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.detail || 'Invalid credentials';
        } catch {
          switch (response.status) {
            case 401: errorMessage = 'Invalid email or password'; break;
            case 500: errorMessage = 'Server error. Please try again later'; break;
            default: errorMessage = 'Login failed. Please try again';
          }
        }
        throw new Error(errorMessage);
      }

      const data: LoginResponse = await response.json();

      localStorage.setItem('user', JSON.stringify(data));
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('isAuthenticated', 'true');

      return data;
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('Network error. Please check your connection and try again');
    }
  }

  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
  }

  getCurrentUser(): LoginResponse | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('isAuthenticated') === 'true' && !!localStorage.getItem('token');
  }

  getDoctorId(): string | null {
    const user = this.getCurrentUser();
    return user?.id || null;
  }

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  }
}

export const authService = AuthService.getInstance();
