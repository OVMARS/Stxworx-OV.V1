import type { UserRole, Project, Milestone, TokenType } from '../types';

const BASE = '/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export { ApiError };

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

// ── Types ──

export interface AuthUser {
  id: number;
  stxAddress: string;
  username: string | null;
  role: 'client' | 'freelancer';
  isActive?: boolean;
  createdAt?: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  subcategories: string[];
}

/** Raw project shape returned by the backend (flat milestones) */
export interface BackendProject {
  id: number;
  clientId: number;
  title: string;
  description: string;
  category: string;
  tokenType: 'STX' | 'sBTC';
  numMilestones: number;
  milestone1Title: string;
  milestone1Description?: string | null;
  milestone1Amount: string;
  milestone2Title?: string | null;
  milestone2Description?: string | null;
  milestone2Amount?: string | null;
  milestone3Title?: string | null;
  milestone3Description?: string | null;
  milestone3Amount?: string | null;
  milestone4Title?: string | null;
  milestone4Description?: string | null;
  milestone4Amount?: string | null;
  status: 'open' | 'active' | 'completed' | 'cancelled' | 'disputed' | 'refunded';
  freelancerId?: number | null;
  onChainId?: number | null;
  escrowTxId?: string | null;
  budget?: string;
  createdAt: string;
  updatedAt: string;
  // Joined fields the backend may attach
  clientAddress?: string;
  freelancerAddress?: string;
}

/** Convert a flat backend project to the frontend Project shape */
export function mapBackendProject(bp: BackendProject): Project {
  const milestones: Milestone[] = [];
  for (let i = 1; i <= bp.numMilestones; i++) {
    const title = (bp as any)[`milestone${i}Title`] as string | null;
    const amount = (bp as any)[`milestone${i}Amount`] as string | null;
    if (title) {
      milestones.push({
        id: i,
        title,
        amount: Number(amount) || 0,
        status: bp.status === 'active' ? 'pending' : 'locked',
      });
    }
  }

  const totalBudget = bp.budget
    ? Number(bp.budget)
    : milestones.reduce((sum, m) => sum + m.amount, 0);

  return {
    id: String(bp.id),
    title: bp.title,
    description: bp.description,
    category: bp.category,
    clientAddress: bp.clientAddress || `user:${bp.clientId}`,
    freelancerAddress: bp.freelancerAddress || (bp.freelancerId ? `user:${bp.freelancerId}` : ''),
    clientId: bp.clientId,
    freelancerId: bp.freelancerId ?? undefined,
    tokenType: bp.tokenType as TokenType,
    totalBudget,
    isFunded: bp.status === 'active' || !!bp.escrowTxId,
    createdAt: bp.createdAt,
    milestones,
    status: bp.status as Project['status'],
  };
}

interface VerifyWalletPayload {
  stxAddress: string;
  publicKey: string;
  signature: string;
  message: string;
  role: 'client' | 'freelancer';
}

/** Raw proposal shape returned by the backend */
export interface BackendProposal {
  id: number;
  projectId: number;
  freelancerId: number;
  coverLetter: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: string;
  updatedAt: string;
}

/** Raw dispute shape returned by the backend */
export interface BackendDispute {
  id: number;
  projectId: number;
  milestoneNum: number;
  filedBy: number;
  reason: string;
  evidenceUrl: string | null;
  status: 'open' | 'resolved' | 'reset';
  resolution: string | null;
  resolvedBy: number | null;
  disputeTxId: string | null;
  resolutionTxId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

/** Raw review shape returned by the backend */
export interface BackendReview {
  id: number;
  projectId: number;
  reviewerId: number;
  revieweeId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
}

/** Admin user returned after login */
export interface AdminAuthUser {
  id: number;
  username: string;
  createdAt?: string;
}

/** Dashboard stats from GET /api/admin/dashboard */
export interface AdminDashboardStats {
  totalUsers: number;
  totalProjects: number;
  activeProjects: number;
  openDisputes: number;
}

/** Backend user row returned from admin endpoints */
export interface BackendUser {
  id: number;
  stxAddress: string;
  username: string | null;
  role: 'client' | 'freelancer';
  isActive: boolean;
  createdAt: string;
}

/** Reputation NFT from the backend */
export interface BackendNFT {
  id: number;
  recipientId: number;
  issuedBy: number;
  nftType: string;
  name: string;
  description: string | null;
  metadataUrl: string | null;
  mintTxId: string | null;
  minted: boolean;
  createdAt: string;
}

/** Raw milestone submission shape returned by the backend */
export interface BackendMilestoneSubmission {
  id: number;
  projectId: number;
  milestoneNum: number;
  freelancerId: number;
  deliverableUrl: string;
  description: string | null;
  status: 'submitted' | 'approved' | 'rejected' | 'disputed';
  completionTxId: string | null;
  releaseTxId: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

interface CreateProjectPayload {
  title: string;
  description: string;
  category: string;
  tokenType: 'STX' | 'sBTC';
  numMilestones: number;
  milestone1Title: string;
  milestone1Description?: string;
  milestone1Amount: string;
  milestone2Title?: string;
  milestone2Amount?: string;
  milestone3Title?: string;
  milestone3Amount?: string;
  milestone4Title?: string;
  milestone4Amount?: string;
}

// ── API Client ──

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

  users: {
    getByAddress: (address: string) =>
      request<{ id: number; stxAddress: string; username: string | null; role: 'client' | 'freelancer'; isActive: boolean; createdAt: string }>(
        `/users/${address}`,
      ),

    updateMe: (data: { username?: string }) =>
      request<{ id: number; stxAddress: string; username: string | null; role: string; isActive: boolean }>(
        '/users/me',
        { method: 'PATCH', body: JSON.stringify(data) },
      ),

    getReviews: (address: string) =>
      request<BackendReview[]>(`/users/${address}/reviews`),
  },

  categories: {
    list: () =>
      request<Category[]>('/categories'),
  },

  projects: {
    /** Browse all open projects (public) */
    list: (filters?: { category?: string; tokenType?: string; search?: string }) => {
      const params = new URLSearchParams();
      if (filters?.category) params.set('category', filters.category);
      if (filters?.tokenType) params.set('tokenType', filters.tokenType);
      if (filters?.search) params.set('search', filters.search);
      const qs = params.toString();
      return request<BackendProject[]>(`/projects${qs ? `?${qs}` : ''}`);
    },

    /** Get a single project by ID */
    getById: (id: number | string) =>
      request<BackendProject>(`/projects/${id}`),

    /** Create a new project (client only) */
    create: (data: CreateProjectPayload) =>
      request<BackendProject>('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    /** Update an open project */
    update: (id: number | string, data: Partial<CreateProjectPayload>) =>
      request<BackendProject>(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    /** Cancel an open project */
    cancel: (id: number | string) =>
      request<BackendProject>(`/projects/${id}`, { method: 'DELETE' }),

    /** Get projects posted by the current client */
    myPosted: () =>
      request<BackendProject[]>('/projects/my/posted'),

    /** Get active projects where user is client or freelancer */
    myActive: () =>
      request<BackendProject[]>('/projects/my/active'),

    /** Activate after on-chain escrow */
    activate: (id: number | string, escrowTxId: string, onChainId: number) =>
      request<BackendProject>(`/projects/${id}/activate`, {
        method: 'PATCH',
        body: JSON.stringify({ escrowTxId, onChainId }),
      }),
  },

  proposals: {
    /** Submit a proposal to a project (freelancer only) */
    create: (projectId: number, coverLetter: string) =>
      request<BackendProposal>('/proposals', {
        method: 'POST',
        body: JSON.stringify({ projectId, coverLetter }),
      }),

    /** Get all proposals for a project (client who owns it) */
    getByProject: (projectId: number) =>
      request<BackendProposal[]>(`/proposals/project/${projectId}`),

    /** Get the current freelancer's proposals */
    my: () =>
      request<BackendProposal[]>('/proposals/my'),

    /** Accept a proposal (client only — auto-rejects others) */
    accept: (proposalId: number) =>
      request<BackendProposal>(`/proposals/${proposalId}/accept`, { method: 'PATCH' }),

    /** Reject a proposal (client only) */
    reject: (proposalId: number) =>
      request<BackendProposal>(`/proposals/${proposalId}/reject`, { method: 'PATCH' }),

    /** Withdraw own proposal (freelancer only) */
    withdraw: (proposalId: number) =>
      request<BackendProposal>(`/proposals/${proposalId}/withdraw`, { method: 'PATCH' }),
  },

  milestones: {
    /** Freelancer submits a milestone deliverable */
    submit: (data: {
      projectId: number;
      milestoneNum: number;
      deliverableUrl: string;
      description?: string;
      completionTxId?: string;
    }) =>
      request<BackendMilestoneSubmission>('/milestones/submit', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    /** Client approves a milestone and triggers escrow release */
    approve: (submissionId: number, releaseTxId: string) =>
      request<BackendMilestoneSubmission>(`/milestones/${submissionId}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ releaseTxId }),
      }),

    /** Client rejects a milestone submission */
    reject: (submissionId: number) =>
      request<BackendMilestoneSubmission>(`/milestones/${submissionId}/reject`, {
        method: 'PATCH',
      }),

    /** Get all submissions for a project */
    getByProject: (projectId: number) =>
      request<BackendMilestoneSubmission[]>(`/milestones/project/${projectId}`),
  },

  disputes: {
    /** File a dispute on an active project */
    create: (data: {
      projectId: number;
      milestoneNum: number;
      reason: string;
      evidenceUrl?: string;
      disputeTxId?: string;
    }) =>
      request<BackendDispute>('/disputes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    /** Get all disputes for a project */
    getByProject: (projectId: number) =>
      request<BackendDispute[]>(`/disputes/project/${projectId}`),
  },

  reviews: {
    /** Leave a review on a completed project */
    create: (data: {
      projectId: number;
      revieweeId: number;
      rating: number;
      comment?: string;
    }) =>
      request<BackendReview>('/reviews', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  admin: {
    login: (username: string, password: string) =>
      request<{ message: string; admin: AdminAuthUser }>('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),

    logout: () =>
      request<{ message: string }>('/admin/logout', { method: 'POST' }),

    me: () =>
      request<{ admin: AdminAuthUser }>('/admin/me'),

    dashboard: () =>
      request<AdminDashboardStats>('/admin/dashboard'),

    /** List all projects (admin view, optional status/search filters) */
    projects: (filters?: { status?: string; search?: string }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      const qs = params.toString();
      return request<BackendProject[]>(`/admin/projects${qs ? `?${qs}` : ''}`);
    },

    /** Get single project detail with submissions + disputes */
    projectDetail: (id: number) =>
      request<{ project: BackendProject; submissions: BackendMilestoneSubmission[]; disputes: BackendDispute[] }>(`/admin/projects/${id}`),

    /** List all open disputes */
    disputes: () =>
      request<BackendDispute[]>('/admin/disputes'),

    /** Resolve a dispute (admin sets resolution + marks resolved) */
    resolveDispute: (id: number, resolution: string, resolutionTxId: string) =>
      request<BackendDispute>(`/admin/disputes/${id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ resolution, resolutionTxId }),
      }),

    /** Reset a dispute (admin resets project back to active) */
    resetDispute: (id: number, resolution: string, resolutionTxId: string) =>
      request<BackendDispute>(`/admin/disputes/${id}/reset`, {
        method: 'PATCH',
        body: JSON.stringify({ resolution, resolutionTxId }),
      }),

    /** List all users */
    users: () =>
      request<BackendUser[]>('/admin/users'),

    /** Toggle user active status (ban/unban) */
    toggleUserStatus: (userId: number, isActive: boolean) =>
      request<BackendUser>(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }),

    /** Get abandoned projects (active >7 days stale) */
    abandonedProjects: () =>
      request<BackendProject[]>('/admin/recovery/abandoned'),

    /** Force release a milestone to freelancer */
    forceRelease: (projectId: number, milestoneNum: number, txId: string) =>
      request<BackendMilestoneSubmission>('/admin/recovery/force-release', {
        method: 'PATCH',
        body: JSON.stringify({ projectId, milestoneNum, txId }),
      }),

    /** Force refund entire project to client */
    forceRefund: (projectId: number, txId: string) =>
      request<BackendProject>('/admin/recovery/force-refund', {
        method: 'PATCH',
        body: JSON.stringify({ projectId, txId }),
      }),

    /** Create a reputation NFT for a user */
    createNFT: (data: { recipientId: number; nftType: string; name: string; description?: string; metadataUrl?: string }) =>
      request<BackendNFT>('/admin/nfts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    /** List reputation NFTs (optional filters) */
    listNFTs: (filters?: { nftType?: string; minted?: boolean }) => {
      const params = new URLSearchParams();
      if (filters?.nftType) params.set('nftType', filters.nftType);
      if (filters?.minted !== undefined) params.set('minted', String(filters.minted));
      const qs = params.toString();
      return request<BackendNFT[]>(`/admin/nfts${qs ? `?${qs}` : ''}`);
    },

    /** Confirm mint for an NFT (after on-chain tx) */
    confirmMint: (nftId: number, mintTxId: string) =>
      request<BackendNFT>(`/admin/nfts/${nftId}/confirm-mint`, {
        method: 'PATCH',
        body: JSON.stringify({ mintTxId }),
      }),

    /** Get NFTs for a specific user */
    userNFTs: (userId: number) =>
      request<BackendNFT[]>(`/admin/nfts/user/${userId}`),
  },
};
