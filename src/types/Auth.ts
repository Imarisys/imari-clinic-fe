export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  first_name: string;
  last_name: string;
  clinic_name: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: LoginResponse | null;
  token: string | null;
}
