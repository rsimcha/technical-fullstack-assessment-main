import api, { handleApiResponse, handleApiError } from './api';
import { AuthResponse, LoginFormData, RegisterFormData, User } from '../types';

export const authService = {
  async login(credentials: LoginFormData): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', credentials);
      return handleApiResponse<AuthResponse>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async register(userData: RegisterFormData): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/register', userData);
      return handleApiResponse<AuthResponse>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async getProfile(): Promise<{ user: User }> {
    try {
      const response = await api.get('/auth/profile');
      return handleApiResponse<{ user: User }>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async refreshToken(): Promise<{ user: User }> {
    try {
      const response = await api.post('/auth/refresh');
      return handleApiResponse<{ user: User }>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Local storage helpers
  setToken(token: string): void {
    localStorage.setItem('token', token);
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  removeToken(): void {
    localStorage.removeItem('token');
  },

  setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  removeUser(): void {
    localStorage.removeItem('user');
  },

  logout(): void {
    this.removeToken();
    this.removeUser();
  },
};
