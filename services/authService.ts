
import { User } from '../types';

/**
 * Contratos:
 * POST /auth/register body {email,password}
 * POST /auth/login body {email,password} -> {access_token, user}
 */
// services/authService.ts
import { http } from './http';

type AuthResponse = {
  access_token: string;
  refresh_token?: string;
  user: { id: string; email: string; role?: string };
};

export const authService = {
  register: (email: string, password: string) =>
    http.post<AuthResponse>('/auth/register', { email, password }),

  login: (email: string, password: string) =>
    http.post<AuthResponse>('/auth/login', { email, password }),
};





