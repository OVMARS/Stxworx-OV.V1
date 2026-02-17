/* ─── Thin HTTP wrapper for backend API calls ─── */

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};
  if (init?.body) headers['Content-Type'] = 'application/json';
  Object.assign(headers, init?.headers as any);

  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.message || res.statusText), {
      status: res.status,
      errors: body.errors,
    });
  }
  return res.json();
}

import type { Project, Milestone, MilestoneStatus, FreelancerProfile } from '../types';

/* ═══════════════════════════════════════════════════════
   BACKEND TYPES — mirrors shared/schema.ts row shapes
   ═══════════════════════════════════════════════════════ */

export interface BackendUser {
  id: number;
  stxAddress: string;
  username: string | null;
  role: 'client' | 'freelancer';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type AuthUser = BackendUser;

export interface AdminAuthUser {
  id: number;
  username: string;
  createdAt?: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  subcategories: string[];
}

export interface BackendProject {
  id: number;
  clientId: number;
  title: string;
  description: string;
  category: string;
  subcategory: string | null;
  tokenType: 'STX' | 'sBTC';
  numMilestones: number;
  milestone1Title: string;
  milestone1Description: string | null;
  milestone1Amount: string;
  milestone2Title: string | null;
  milestone2Description: string | null;
  milestone2Amount: string | null;
  milestone3Title: string | null;
  milestone3Description: string | null;
  milestone3Amount: string | null;
  milestone4Title: string | null;
  milestone4Description: string | null;
  milestone4Amount: string | null;
  status: 'open' | 'active' | 'completed' | 'cancelled' | 'disputed' | 'refunded';
  freelancerId: number | null;
  onChainId: number | null;
  escrowTxId: string | null;
  createdAt: string;
  updatedAt: string;
  /** Computed by GET list/detail — sum of milestone amounts as string */
  budget?: string;
}

export interface BackendProposal {
  id: number;
  projectId: number;
  freelancerId: number;
  coverLetter: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: string;
  updatedAt: string;
}

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

export interface BackendReview {
  id: number;
  projectId: number;
  reviewerId: number;
  revieweeId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface BackendNFT {
  id: number;
  recipientId: number;
  nftType: 'milestone_streak' | 'top_freelancer' | 'top_client' | 'loyalty' | 'custom';
  name: string;
  description: string | null;
  metadataUrl: string | null;
  mintTxId: string | null;
  minted: boolean;
  issuedBy: number;
  createdAt: string;
}

export interface BackendNotification {
  id: number;
  userId: number;
  type: 'milestone_submitted' | 'milestone_approved' | 'milestone_rejected' | 'dispute_filed' | 'dispute_resolved' | 'proposal_received' | 'proposal_accepted' | 'project_completed';
  title: string;
  message: string;
  projectId: number | null;
  isRead: boolean;
  createdAt: string;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  refundedProjects: number;
  fundedProjects: number;
  openDisputes: number;
  resolvedDisputes: number;
  totalSubmissions: number;
  approvedSubmissions: number;
  pendingSubmissions: number;
  rejectedSubmissions: number;
  freelancerCount: number;
  clientCount: number;
}

export interface LeaderboardEntry {
  id: number;
  stxAddress: string;
  username: string | null;
  jobsCompleted: number;
  avgRating: number;
  reviewCount: number;
  rank: number;
  createdAt: string;
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

/** Convert flat backend project row → frontend Project shape */
export function mapBackendProject(bp: BackendProject): Project {
  const milestones: Milestone[] = [];
  const isFunded = bp.status !== 'open' && bp.status !== 'cancelled';
  for (let i = 1; i <= bp.numMilestones; i++) {
    const title = (bp as any)[`milestone${i}Title`] as string | null;
    const amount = parseFloat((bp as any)[`milestone${i}Amount`] || '0');
    // Milestones are 'locked' until escrow is funded, then become 'pending'
    // (actual submitted/approved status is enriched later from submissions)
    const baseStatus: MilestoneStatus = bp.status === 'refunded' ? 'refunded' : isFunded ? 'pending' : 'locked';
    milestones.push({
      id: i,
      title: title || `Milestone ${i}`,
      amount,
      status: baseStatus,
    });
  }
  const totalBudget = milestones.reduce((sum, m) => sum + m.amount, 0);

  return {
    id: String(bp.id),
    title: bp.title,
    description: bp.description,
    category: bp.category,
    clientAddress: '',
    freelancerAddress: '',
    clientId: bp.clientId,
    freelancerId: bp.freelancerId ?? undefined,
    tokenType: bp.tokenType,
    totalBudget: bp.budget ? parseFloat(bp.budget) : totalBudget,
    isFunded,
    createdAt: bp.createdAt,
    milestones,
    status: bp.status,
    onChainId: bp.onChainId ?? null,
  };
}

/** Convert a BackendUser row → frontend FreelancerProfile shape */
export function mapBackendUserToProfile(u: BackendUser): FreelancerProfile {
  return {
    rank: 0,
    name: u.username || u.stxAddress.slice(0, 8),
    address: u.stxAddress,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.stxAddress}`,
    totalEarnings: 0,
    jobsCompleted: 0,
    rating: 0,
    specialty: 'Generalist',
    badges: [],
    about: '',
    portfolio: [],
    isIdVerified: false,
    isSkillVerified: false,
    isPortfolioVerified: false,
  };
}

/* ═══════════════════════════════════════════════════════
   API ENDPOINTS
   ═══════════════════════════════════════════════════════ */

export const api = {
  /* ── Auth ── */
  auth: {
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

    me: () => request<{ user: BackendUser }>('/auth/me'),

    logout: () =>
      request<{ message: string }>('/auth/logout', { method: 'POST' }),
  },

  /* ── Categories ── */
  categories: {
    list: () => request<Category[]>('/categories'),
  },

  /* ── Users ── */
  users: {
    getByAddress: (address: string) =>
      request<BackendUser>(`/users/${address}`),

    updateMe: (data: { username?: string }) =>
      request<BackendUser>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    getReviews: (address: string) =>
      request<BackendReview[]>(`/users/${address}/reviews`),

    leaderboard: () =>
      request<LeaderboardEntry[]>('/users/leaderboard'),
  },

  /* ── Projects ── */
  projects: {
    list: (filters?: { category?: string; tokenType?: string; search?: string }) => {
      const params = new URLSearchParams();
      if (filters?.category) params.set('category', filters.category);
      if (filters?.tokenType) params.set('tokenType', filters.tokenType);
      if (filters?.search) params.set('search', filters.search);
      const qs = params.toString();
      return request<BackendProject[]>(`/projects${qs ? `?${qs}` : ''}`);
    },

    getById: (id: number | string) =>
      request<BackendProject>(`/projects/${id}`),

    create: (data: Record<string, any>) =>
      request<BackendProject>('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: number | string, data: Record<string, any>) =>
      request<BackendProject>(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    cancel: (id: number | string) =>
      request<BackendProject>(`/projects/${id}`, { method: 'DELETE' }),

    myPosted: () => request<BackendProject[]>('/projects/my/posted'),

    myActive: () => request<BackendProject[]>('/projects/my/active'),

    activate: (id: number | string, escrowTxId: string, onChainId: number) =>
      request<BackendProject>(`/projects/${id}/activate`, {
        method: 'PATCH',
        body: JSON.stringify({ escrowTxId, onChainId }),
      }),
  },

  /* ── Proposals ── */
  proposals: {
    create: (projectId: number, coverLetter: string) =>
      request<BackendProposal>('/proposals', {
        method: 'POST',
        body: JSON.stringify({ projectId, coverLetter }),
      }),

    getByProject: (projectId: number) =>
      request<BackendProposal[]>(`/proposals/project/${projectId}`),

    my: () => request<BackendProposal[]>('/proposals/my'),

    accept: (id: number) =>
      request<BackendProposal>(`/proposals/${id}/accept`, { method: 'PATCH' }),

    reject: (id: number) =>
      request<BackendProposal>(`/proposals/${id}/reject`, { method: 'PATCH' }),

    withdraw: (id: number) =>
      request<BackendProposal>(`/proposals/${id}/withdraw`, { method: 'PATCH' }),
  },

  /* ── Milestones ── */
  milestones: {
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

    approve: (id: number, releaseTxId: string) =>
      request<BackendMilestoneSubmission>(`/milestones/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ releaseTxId }),
      }),

    reject: (id: number) =>
      request<BackendMilestoneSubmission>(`/milestones/${id}/reject`, {
        method: 'PATCH',
      }),

    getByProject: (projectId: number) =>
      request<BackendMilestoneSubmission[]>(`/milestones/project/${projectId}`),
  },

  /* ── Disputes ── */
  disputes: {
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

    getByProject: (projectId: number) =>
      request<BackendDispute[]>(`/disputes/project/${projectId}`),
  },

  /* ── Reviews ── */
  reviews: {
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

  /* ── Notifications ── */
  notifications: {
    list: () => request<BackendNotification[]>('/notifications'),

    unreadCount: () => request<{ count: number }>('/notifications/unread-count'),

    markRead: (id: number) =>
      request<{ message: string }>(`/notifications/${id}/read`, { method: 'PATCH' }),

    markAllRead: () =>
      request<{ message: string }>('/notifications/read-all', { method: 'PATCH' }),
  },

  /* ── Admin ── */
  admin: {
    login: (username: string, password: string) =>
      request<{ message: string; admin: AdminAuthUser }>('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),

    logout: () =>
      request<{ message: string }>('/admin/logout', { method: 'POST' }),

    me: () => request<{ admin: AdminAuthUser }>('/admin/me'),

    dashboard: () => request<AdminDashboardStats>('/admin/dashboard'),

    projects: (filters?: { status?: string; search?: string }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      const qs = params.toString();
      return request<BackendProject[]>(`/admin/projects${qs ? `?${qs}` : ''}`);
    },

    projectDetail: (id: number) =>
      request<{ project: BackendProject; submissions: BackendMilestoneSubmission[]; disputes: BackendDispute[] }>(
        `/admin/projects/${id}`,
      ),

    disputes: () => request<BackendDispute[]>('/admin/disputes'),

    resolveDispute: (id: number, resolution: string, resolutionTxId: string, favorFreelancer: boolean) =>
      request<BackendDispute>(`/admin/disputes/${id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ resolution, resolutionTxId, favorFreelancer }),
      }),

    resetDispute: (id: number, resolution: string, resolutionTxId: string) =>
      request<BackendDispute>(`/admin/disputes/${id}/reset`, {
        method: 'PATCH',
        body: JSON.stringify({ resolution, resolutionTxId, favorFreelancer: false }),
      }),

    abandonedProjects: () => request<BackendProject[]>('/admin/recovery/abandoned'),

    forceRelease: (projectId: number, milestoneNum: number, txId: string) =>
      request<BackendMilestoneSubmission>('/admin/recovery/force-release', {
        method: 'PATCH',
        body: JSON.stringify({ projectId, milestoneNum, txId }),
      }),

    forceRefund: (projectId: number, txId: string) =>
      request<BackendProject>('/admin/recovery/force-refund', {
        method: 'PATCH',
        body: JSON.stringify({ projectId, txId }),
      }),

    users: () => request<BackendUser[]>('/admin/users'),

    toggleUserStatus: (userId: number, isActive: boolean) =>
      request<BackendUser>(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }),

    createNFT: (data: {
      recipientId: number;
      nftType: string;
      name: string;
      description?: string;
      metadataUrl?: string;
    }) =>
      request<BackendNFT>('/admin/nfts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    listNFTs: (filters?: { nftType?: string; minted?: boolean }) => {
      const params = new URLSearchParams();
      if (filters?.nftType) params.set('nftType', filters.nftType);
      if (filters?.minted !== undefined) params.set('minted', String(filters.minted));
      const qs = params.toString();
      return request<BackendNFT[]>(`/admin/nfts${qs ? `?${qs}` : ''}`);
    },

    confirmMint: (nftId: number, mintTxId: string) =>
      request<BackendNFT>(`/admin/nfts/${nftId}/confirm-mint`, {
        method: 'PATCH',
        body: JSON.stringify({ mintTxId }),
      }),

    nftsByUser: (userId: number) =>
      request<BackendNFT[]>(`/admin/nfts/user/${userId}`),
  },
};
