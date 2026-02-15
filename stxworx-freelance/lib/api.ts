import type { UserRole } from '../types';

const BASE = '/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body.message || res.statusText);
  }

  return res.json();
}

export interface AuthUser {
  id: number;
  stxAddress: string;
  username: string | null;
  role: 'client' | 'freelancer';
  isActive?: boolean;
  createdAt?: string;
}

interface VerifyWalletPayload {
  stxAddress: string;
  publicKey: string;
  signature: string;
  message: string;
  role: 'client' | 'freelancer';
}

export const api = {
  auth: {
    me: () =>
      request<{ user: AuthUser }>('/auth/me'),

    verifyWallet: (data: VerifyWalletPayload) =>
      request<{ message: string; user: AuthUser }>('/auth/verify-wallet', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    logout: () =>
      request<{ message: string }>('/auth/logout', { method: 'POST' }),
  },
};
