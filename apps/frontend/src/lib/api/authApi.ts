import { apiClient } from './apiClient';
import type { User, AuthTokens } from '@memechat/shared';

interface LoginResponse extends AuthTokens { user: User }

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    return data;
  },

  register: async (payload: {
    username: string;
    displayName: string;
    email: string;
    password: string;
  }): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/register', payload);
    return data;
  },

  googleLogin: async (token: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/google', { token });
    return data;
  },

  microsoftLogin: async (token: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/microsoft', { token });
    return data;
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string; user: User }> => {
    const { data } = await apiClient.post('/auth/refresh', { refreshToken });
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  sendOtp: async (email: string): Promise<void> => {
    await apiClient.post('/auth/otp/send', { email });
  },

  verifyOtp: async (email: string, otp: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/otp/verify', { email, otp });
    return data;
  },

  sendMagicLink: async (email: string): Promise<void> => {
    await apiClient.post('/auth/magic-link', { email });
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, password });
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },

  setup2FA: async (): Promise<{ qrCode: string; secret: string }> => {
    const { data } = await apiClient.post('/auth/2fa/setup');
    return data;
  },

  verify2FA: async (token: string): Promise<{ backupCodes: string[] }> => {
    const { data } = await apiClient.post('/auth/2fa/verify', { token });
    return data;
  },
};
