/* Thin HTTP wrapper for backend API calls */

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};
  // Only set Content-Type for requests with a body
  if (init?.body) headers['Content-Type'] = 'application/json';
  Object.assign(headers, init?.headers as any);

  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',          // send httpOnly cookie
    ...init,
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.message || res.statusText), { status: res.status });
  }
  return res.json();
}

/* ── Auth types returned by backend ── */

/** Fields always returned by backend auth endpoints */
export interface BackendUser {
  id: number;
  stxAddress: string;
  username: string | null;
  role: 'client' | 'freelancer';
  /** Only returned by GET /auth/me */
  isActive?: boolean;
  /** Only returned by GET /auth/me */
  createdAt?: string;
}

/* ── Auth endpoints ── */

export const api = {
  auth: {
    /** Sign-in / register: verify a Stacks wallet signature and get session cookie */
    verifyWallet: (data: {
      stxAddress: string;
      publicKey: string;
      signature: string;
      message: string;
      role: 'client' | 'freelancer';
    }) =>
      request<{ message: string; user: BackendUser }>('/auth/verify-wallet', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    /** Check current session cookie — returns user + role if still valid */
    me: () => request<{ user: BackendUser }>('/auth/me'),

    /** Destroy session cookie */
    logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  },
};
