import { authService } from '../authService';
import { LoginRequest, LoginResponse } from '../../types/Auth';

const mockLoginResponse: LoginResponse = {
  id: 'doc-123',
  first_name: 'Test',
  last_name: 'Doctor',
  clinic_name: 'Test Clinic',
};

describe('AuthService', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('login', () => {
    it('should login successfully and store data in localStorage', async () => {
      (global as any).fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      });

      const credentials: LoginRequest = {
        email: 'doctor@clinic.com',
        password: 'password123',
      };

      const result = await authService.login(credentials);
      expect(result).toEqual(mockLoginResponse);
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockLoginResponse));
      expect(localStorage.getItem('isAuthenticated')).toBe('true');
    });

    it('should throw on invalid credentials', async () => {
      (global as any).fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Invalid email or password' }),
      });

      await expect(
        authService.login({ email: 'wrong@clinic.com', password: 'wrong' })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw on server error', async () => {
      (global as any).fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Server error' }),
      });

      await expect(
        authService.login({ email: 'doc@clinic.com', password: 'pass' })
      ).rejects.toThrow('Server error');
    });

    it('should throw on network error', async () => {
      (global as any).fetch.mockRejectedValueOnce(new Error('Network failure'));

      await expect(
        authService.login({ email: 'doc@clinic.com', password: 'pass' })
      ).rejects.toThrow('Network failure');
    });
  });

  describe('logout', () => {
    it('should clear localStorage', () => {
      localStorage.setItem('user', JSON.stringify(mockLoginResponse));
      localStorage.setItem('isAuthenticated', 'true');

      authService.logout();

      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('isAuthenticated')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return the stored user', () => {
      localStorage.setItem('user', JSON.stringify(mockLoginResponse));
      const user = authService.getCurrentUser();
      expect(user).toEqual(mockLoginResponse);
    });

    it('should return null when no user is stored', () => {
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when authenticated', () => {
      localStorage.setItem('isAuthenticated', 'true');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when not authenticated', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getDoctorId', () => {
    it('should return the doctor id from stored user', () => {
      localStorage.setItem('user', JSON.stringify(mockLoginResponse));
      expect(authService.getDoctorId()).toBe('doc-123');
    });

    it('should return null when no user stored', () => {
      expect(authService.getDoctorId()).toBeNull();
    });
  });
});
