import { create } from 'zustand';
import { Project, FreelancerProfile, WalletState, ChatContact, UserRole, Application, ApplicationStatus, Proposal, ProposalStatus, Milestone } from '../types';
import {
  connectX,
  generateId,
} from '../services/StacksService';
import {
  api,
  mapBackendProject,
  mapBackendUserToProfile,
  type BackendProject,
  type BackendUser,
  type BackendMilestoneSubmission,
  type BackendDispute,
  type BackendReview,
  type BackendNFT,
  type BackendProposal,
  type BackendNotification,
  type Category,
  type AuthUser,
  type AdminAuthUser,
  type AdminDashboardStats,
  type LeaderboardEntry,
} from '../lib/api';
import { requestSignMessage } from '../lib/stacks';

const ROLE_KEY_PREFIX = 'stxworx_role_';
const roleKeyFor = (address: string) => `${ROLE_KEY_PREFIX}${address}`;
const APPLICATIONS_STORAGE_KEY = 'stxworx_applications';

// mapBackendProject is now exported from lib/api.ts

interface AppState {
  categories: Category[];
  projects: Project[];
  myPostedProjects: Project[];
  myActiveProjects: Project[];
  myCompletedProjects: Project[];
  leaderboardData: FreelancerProfile[];
  currentUserProfile: FreelancerProfile | null;
  selectedProfile: FreelancerProfile | null;
  wallet: WalletState;
  userRole: UserRole;
  showRoleModal: boolean;
  searchTerm: string;
  selectedCategory: string;
  currentBlock: number;
  freelancerTab: 'active' | 'leaderboard';
  isLoading: boolean;
  isProcessing: boolean;
  isModalOpen: boolean;
  modalInitialData: any;
  activeChatContact: ChatContact | null;
  /** @deprecated kept for backward compat — use myProposals instead */
  applications: Application[];
  myProposals: Proposal[];
  projectProposals: Record<number, Proposal[]>;
  milestoneSubmissions: Record<number, BackendMilestoneSubmission[]>;
  projectDisputes: Record<number, BackendDispute[]>;
  profileReviews: Record<string, BackendReview[]>;
  publicUserProjects: Record<string, Project[]>;
  freelancerDashboardTab: 'applied' | 'active' | 'work' | 'completed' | 'earnings' | 'nft';
  authUser: AuthUser | null;
  isAuthChecking: boolean;

  // Notification state
  notifications: BackendNotification[];
  unreadNotificationCount: number;

  // Admin state
  adminUser: AdminAuthUser | null;
  isAdminAuthenticated: boolean;
  adminDashboardStats: AdminDashboardStats | null;
  adminUsers: BackendUser[];
  adminProjects: BackendProject[];
  adminDisputes: BackendDispute[];
  adminNFTs: BackendNFT[];

  // Actions
  init: () => Promise<void>;
  syncWallet: (isSignedIn: boolean, userAddress: string | null) => Promise<void>;
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (cat: string) => void;
  setFreelancerTab: (tab: 'active' | 'leaderboard') => void;
  setSelectedProfile: (profile: FreelancerProfile | null) => void;
  setIsModalOpen: (open: boolean) => void;
  setModalInitialData: (data: any) => void;
  setActiveChatContact: (contact: ChatContact | null) => void;
  setIsProcessing: (val: boolean) => void;
  setUserRole: (role: UserRole) => Promise<void>;
  setShowRoleModal: (show: boolean) => void;
  clearRole: () => void;

  verifyAndLogin: (role: 'client' | 'freelancer') => Promise<AuthUser>;
  logoutUser: () => Promise<void>;
  applyToProject: (project: Project, coverLetter: string) => Promise<void>;
  withdrawProposal: (proposalId: number) => Promise<void>;
  acceptProposal: (proposalId: number) => Promise<void>;
  rejectProposal: (proposalId: number) => Promise<void>;

  // Data-fetching actions
  fetchCategories: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
  fetchMyProjects: () => Promise<void>;
  fetchMyProposals: () => Promise<void>;
  fetchProjectProposals: (projectId: number) => Promise<void>;
  fetchMilestoneSubmissions: (projectId: number) => Promise<void>;
  fetchProjectDisputes: (projectId: number) => Promise<void>;
  fetchProfileReviews: (address: string) => Promise<void>;
  fetchPublicUserProjects: (address: string) => Promise<void>;
  createDispute: (data: { projectId: number; milestoneNum: number; reason: string; evidenceUrl?: string; disputeTxId?: string }) => Promise<void>;
  createReview: (data: { projectId: number; revieweeId: number; rating: number; comment?: string }) => Promise<void>;

  /** @deprecated — use applyToProject (API-backed) instead */
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus) => void;
  hasAppliedToProject: (projectId: string) => boolean;
  setFreelancerDashboardTab: (tab: 'applied' | 'active' | 'work' | 'completed' | 'earnings' | 'nft') => void;
  handleCreateProject: (data: any) => Promise<void>;
  handleProjectAction: (projectId: string, actionType: string, payload?: any) => Promise<void>;
  handleConnectX: () => Promise<void>;
  handleSaveProfile: (updatedProfile: FreelancerProfile) => Promise<void>;
  viewProfileByAddress: (address: string, name?: string) => Promise<FreelancerProfile>;
  _refreshProfile: (address: string) => Promise<void>;
  incrementBlock: () => void;

  // Notification actions
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markNotificationRead: (id: number) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;

  // Admin actions
  adminLogin: (username: string, password: string) => Promise<void>;
  adminLogout: () => Promise<void>;
  checkAdminSession: () => Promise<boolean>;
  fetchDashboardStats: () => Promise<void>;
  fetchAdminUsers: () => Promise<void>;
  toggleUserStatus: (userId: number, isActive: boolean) => Promise<void>;
  fetchAdminProjects: (filters?: { status?: string; search?: string }) => Promise<void>;
  fetchAdminDisputes: () => Promise<void>;
  adminResolveDispute: (id: number, resolution: string, resolutionTxId: string, favorFreelancer: boolean) => Promise<void>;
  adminResetDispute: (id: number, resolution: string, resolutionTxId: string) => Promise<void>;
  adminForceRelease: (projectId: number, milestoneNum: number, txId: string) => Promise<void>;
  adminForceRefund: (projectId: number, txId: string) => Promise<void>;
  adminCreateNFT: (data: { recipientId: number; nftType: string; name: string; description?: string; metadataUrl?: string }) => Promise<void>;
  fetchAdminNFTs: (filters?: { nftType?: string; minted?: boolean }) => Promise<void>;
  adminConfirmMint: (nftId: number, mintTxId: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  projects: [],
  myPostedProjects: [],
  myActiveProjects: [],
  myCompletedProjects: [],
  leaderboardData: [],
  currentUserProfile: null,
  selectedProfile: null,
  wallet: {
    isConnected: false,
    address: null,
    isXConnected: false,
    xUsername: undefined,
    balanceSTX: 0,
    balanceSBTC: 0,
  },
  userRole: null,
  showRoleModal: false,
  searchTerm: '',
  selectedCategory: 'All',
  currentBlock: 89212,
  freelancerTab: 'active',
  isLoading: true,
  isProcessing: false,
  isModalOpen: false,
  modalInitialData: null,
  activeChatContact: null,
  applications: [],
  myProposals: [],
  projectProposals: {},
  milestoneSubmissions: {},
  projectDisputes: {},
  profileReviews: {},
  publicUserProjects: {},
  freelancerDashboardTab: 'applied',
  authUser: null,
  isAuthChecking: false,
  categories: [],

  // Admin defaults
  adminUser: null,
  isAdminAuthenticated: false,
  adminDashboardStats: null,
  adminUsers: [],
  adminProjects: [],
  adminDisputes: [],
  adminNFTs: [],

  // Notification defaults
  notifications: [],
  unreadNotificationCount: 0,

  fetchCategories: async () => {
    try {
      const cats = await api.categories.list();
      set({ categories: cats });
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    }
  },

  fetchProjects: async () => {
    try {
      const raw = await api.projects.list();
      const mapped = raw.map(mapBackendProject);
      set({ projects: mapped });
    } catch (e) {
      console.error('Failed to fetch projects:', e);
    }
  },

  fetchMyProjects: async () => {
    try {
      const [posted, active, completed] = await Promise.all([
        api.projects.myPosted().catch(() => []),
        api.projects.myActive().catch(() => []),
        api.projects.myCompleted().catch(() => []),
      ]);
      set({
        myPostedProjects: posted.map(mapBackendProject),
        myActiveProjects: active.map(mapBackendProject),
        myCompletedProjects: completed.map(mapBackendProject),
      });
    } catch (e) {
      console.error('Failed to fetch my projects:', e);
    }
  },

  fetchMyProposals: async () => {
    try {
      const raw = await api.proposals.my();
      set({ myProposals: raw });
    } catch (e) {
      // Not authed or no proposals — fine
      set({ myProposals: [] });
    }
  },

  fetchProjectProposals: async (projectId: number) => {
    try {
      const raw = await api.proposals.getByProject(projectId);
      set((s) => ({
        projectProposals: { ...s.projectProposals, [projectId]: raw },
      }));
    } catch (e) {
      console.error('Failed to fetch project proposals:', e);
    }
  },

  fetchMilestoneSubmissions: async (projectId: number) => {
    try {
      const subs = await api.milestones.getByProject(projectId);
      set((s) => ({
        milestoneSubmissions: { ...s.milestoneSubmissions, [projectId]: subs },
      }));
    } catch (e) {
      // Not authed or no submissions
    }
  },

  fetchProjectDisputes: async (projectId: number) => {
    try {
      const disputes = await api.disputes.getByProject(projectId);
      set((s) => ({
        projectDisputes: { ...s.projectDisputes, [projectId]: disputes },
      }));
    } catch (e) {
      // Not authed or no disputes
    }
  },

  createDispute: async (data) => {
    set({ isProcessing: true });
    try {
      await api.disputes.create(data);
      await get().fetchProjectDisputes(data.projectId);
      await get().fetchProjects();
      await get().fetchMyProjects();
    } catch (error) {
      console.error('Failed to create dispute:', error);
      throw error;
    } finally {
      set({ isProcessing: false });
    }
  },

  fetchProfileReviews: async (address: string) => {
    try {
      const reviews = await api.users.getReviews(address);
      set((s) => ({
        profileReviews: { ...s.profileReviews, [address]: reviews },
      }));
    } catch (e) {
      // Not found or no reviews
    }
  },

  fetchPublicUserProjects: async (address: string) => {
    try {
      const bps = await api.users.getProjects(address);
      const mapped = bps.map(mapBackendProject);
      set((s) => ({
        publicUserProjects: { ...s.publicUserProjects, [address]: mapped },
      }));
    } catch (e) {
      // User may not have projects
    }
  },

  createReview: async (data) => {
    set({ isProcessing: true });
    try {
      await api.reviews.create(data);
      // Refresh projects to reflect completion
      await get().fetchProjects();
      await get().fetchMyProjects();
    } catch (error) {
      console.error('Failed to create review:', error);
      throw error;
    } finally {
      set({ isProcessing: false });
    }
  },

  fetchLeaderboard: async () => {
    try {
      const entries = await api.users.leaderboard();
      const profiles: FreelancerProfile[] = entries.map((e) => ({
        rank: e.rank,
        name: e.username || e.stxAddress.slice(0, 8),
        address: e.stxAddress,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${e.stxAddress}`,
        totalEarnings: 0,
        jobsCompleted: e.jobsCompleted,
        rating: e.avgRating,
        specialty: 'Generalist',
        badges: [],
        about: '',
        portfolio: [],
        isIdVerified: false,
        isSkillVerified: false,
        isPortfolioVerified: false,
      }));
      set({ leaderboardData: profiles });
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e);
    }
  },

  init: async () => {
    await Promise.all([
      get().fetchProjects(),
      get().fetchLeaderboard(),
      get().fetchCategories(),
      get().fetchMyProposals(),
    ]);
    set({ isLoading: false });
  },

  syncWallet: async (isSignedIn, userAddress) => {
    if (isSignedIn && userAddress) {
      set((s) => ({
        wallet: { ...s.wallet, isConnected: true, address: userAddress },
      }));

      let authenticated = false;

      // 1. Try existing backend session (httpOnly cookie)
      try {
        const { user } = await api.auth.me();
        if (user.stxAddress === userAddress) {
          // Valid session for THIS wallet — use role from backend
          localStorage.setItem(roleKeyFor(userAddress), user.role);
          set({ authUser: user, userRole: user.role as UserRole, showRoleModal: false });
          authenticated = true;
        } else {
          // Cookie belongs to a DIFFERENT wallet — clear stale session
          await api.auth.logout().catch(() => {});
          throw new Error('address mismatch');
        }
      } catch {
        // 2. No valid session — check if this wallet exists in DB
        try {
          const backendUser = await api.users.getByAddress(userAddress);
          // Wallet exists in DB — re-authenticate with their STORED role
          try {
            await get().verifyAndLogin(backendUser.role as 'client' | 'freelancer');
            authenticated = true;
          } catch {
            // User cancelled signing — show role modal as fallback
            set({ userRole: null, showRoleModal: true });
          }
        } catch {
          // 3. Wallet NOT in DB — completely new user, show role picker
          localStorage.removeItem(roleKeyFor(userAddress));
          set({ userRole: null, showRoleModal: true });
        }
      }

      // Fetch user profile AFTER auth completes so the user exists in DB
      await get()._refreshProfile(userAddress);

      const networkUrl = 'https://api.testnet.hiro.so';
      fetch(`${networkUrl}/extended/v1/address/${userAddress}/balances`)
        .then((res) => res.json())
        .then((data) => {
          const stx = parseInt(data.stx.balance) / 1_000_000;
          set((s) => ({ wallet: { ...s.wallet, balanceSTX: stx } }));
        })
        .catch(() => {});

      // Fetch notifications only if authenticated
      if (authenticated) {
        get().fetchNotifications();
        get().fetchUnreadCount();
      }
    } else {
      set({
        wallet: {
          isConnected: false,
          address: null,
          isXConnected: false,
          xUsername: undefined,
          balanceSTX: 0,
          balanceSBTC: 0,
        },
        currentUserProfile: null,
        showRoleModal: false,
        notifications: [],
        unreadNotificationCount: 0,
      });
    }
  },

  setSearchTerm: (term) => {
    set({ searchTerm: term });
  },

  setSelectedCategory: (cat) => {
    set({ selectedCategory: cat });
  },

  setFreelancerTab: (tab) => set({ freelancerTab: tab }),
  setSelectedProfile: (profile) => set({ selectedProfile: profile }),
  setIsModalOpen: (open) => set({ isModalOpen: open }),
  setModalInitialData: (data) => set({ modalInitialData: data }),
  setActiveChatContact: (contact) => set({ activeChatContact: contact }),
  setIsProcessing: (val) => set({ isProcessing: val }),

  setUserRole: async (role) => {
    const addr = get().wallet.address;
    if (!role || !addr) {
      if (addr) localStorage.removeItem(roleKeyFor(addr));
      set({ userRole: null, showRoleModal: false });
      return;
    }

    // Sign a message with the wallet to prove ownership
    const message = `STXWorx authentication: ${addr} at ${Date.now()}`;
    const signed = await requestSignMessage(message);
    if (!signed) {
      // User cancelled signing — keep modal open so they can retry or close
      throw new Error('SIGN_CANCELLED');
    }

    // Call backend — creates user if new, returns stored role if existing
    try {
      const { user } = await api.auth.verifyWallet({
        stxAddress: addr,
        publicKey: signed.publicKey,
        signature: signed.signature,
        message,
        role: role as 'client' | 'freelancer',
      });
      // Use the role from the backend response (may differ from `role` for existing users)
      const backendRole = (user.role as UserRole) ?? role;
      localStorage.setItem(roleKeyFor(addr), backendRole as string);
      set({ authUser: user, userRole: backendRole, showRoleModal: false });
      // Refresh profile now that user exists in DB
      await get()._refreshProfile(addr);
      // Also hydrate notifications
      get().fetchNotifications();
      get().fetchUnreadCount();
    } catch (err: any) {
      // Re-throw cancellation so callers can handle it
      if (err?.message === 'SIGN_CANCELLED') throw err;
      console.error('Backend auth failed:', err);
      // Don't set role without a valid session — re-throw so UI shows the error
      throw new Error('Backend authentication failed. Please try again.');
    }
  },
  setShowRoleModal: (show) => set({ showRoleModal: show }),
  clearRole: () => {
    const addr = get().wallet.address;
    if (addr) localStorage.removeItem(roleKeyFor(addr));
    set({ userRole: null });
  },

  incrementBlock: () => set((s) => ({ currentBlock: s.currentBlock + 1 })),

  verifyAndLogin: async (role) => {
    const address = get().wallet.address;
    if (!address) throw new Error('Wallet not connected');

    const message = `Sign in to STXWorx\nAddress: ${address}\nTimestamp: ${Date.now()}`;

    const signResult = await requestSignMessage(message);
    if (!signResult) throw new Error('SIGN_CANCELLED');
    const { signature, publicKey } = signResult;

    const { user } = await api.auth.verifyWallet({
      stxAddress: address,
      publicKey,
      signature,
      message,
      role,
    });

    localStorage.setItem(roleKeyFor(address), user.role);
    set({ authUser: user, userRole: user.role as UserRole, showRoleModal: false });
    // Refresh profile now that auth is confirmed
    await get()._refreshProfile(address);
    return user;
  },

  logoutUser: async () => {
    try { await api.auth.logout(); } catch {}
    const addr = get().wallet.address;
    if (addr) localStorage.removeItem(roleKeyFor(addr));
    set({
      authUser: null,
      userRole: null,
      showRoleModal: false,
    });
  },

  setFreelancerDashboardTab: (tab) => set({ freelancerDashboardTab: tab }),

  applyToProject: async (project, coverLetter) => {
    const { wallet } = get();
    if (!wallet.address) return;
    try {
      set({ isProcessing: true });
      await api.proposals.create(Number(project.id), coverLetter);
      await get().fetchMyProposals();
    } catch (error: any) {
      console.error('Apply failed:', error.message);
      // Surface 409 duplicates gracefully
    } finally {
      set({ isProcessing: false });
    }
  },

  withdrawProposal: async (proposalId) => {
    try {
      set({ isProcessing: true });
      await api.proposals.withdraw(proposalId);
      await get().fetchMyProposals();
    } catch (error: any) {
      console.error('Withdraw failed:', error.message);
    } finally {
      set({ isProcessing: false });
    }
  },

  acceptProposal: async (proposalId) => {
    try {
      set({ isProcessing: true });
      await api.proposals.accept(proposalId);
      // Refresh both proposals and projects (accept assigns freelancer)
      await Promise.all([
        get().fetchMyProjects(),
        get().fetchProjects(),
      ]);
    } catch (error: any) {
      console.error('Accept proposal failed:', error.message);
    } finally {
      set({ isProcessing: false });
    }
  },

  rejectProposal: async (proposalId) => {
    try {
      set({ isProcessing: true });
      await api.proposals.reject(proposalId);
    } catch (error: any) {
      console.error('Reject proposal failed:', error.message);
    } finally {
      set({ isProcessing: false });
    }
  },

  hasAppliedToProject: (projectId) => {
    const { myProposals } = get();
    return myProposals.some((p) => String(p.projectId) === projectId && p.status !== 'withdrawn');
  },

  updateApplicationStatus: (_applicationId, _status) => {
    // deprecated — no-op
  },

  handleCreateProject: async (data) => {
    const { wallet } = get();
    if (!wallet.address) return;
    set({ isProcessing: true });

    try {
      // Build the flat milestone payload the backend expects
      const payload: any = {
        title: data.title,
        description: data.description,
        category: data.category,
        tokenType: data.tokenType,
        numMilestones: data.milestones?.length || 1,
      };

      // Map milestones array to flat fields
      const milestones = data.milestones || [];
      milestones.forEach((m: any, i: number) => {
        const idx = i + 1;
        payload[`milestone${idx}Title`] = m.title;
        payload[`milestone${idx}Description`] = m.description || '';
        payload[`milestone${idx}Amount`] = String(m.amount);
      });

      await api.projects.create(payload);
      await get().fetchProjects();
      await get().fetchMyProjects();
      set({ isProcessing: false, isModalOpen: false, modalInitialData: null });
    } catch (error: any) {
      console.error('Create project failed:', error.message);
      set({ isProcessing: false });
    }
  },

  handleProjectAction: async (projectId, actionType, payload) => {
    set({ isProcessing: true });
    try {
      if (actionType === 'fund' || actionType === 'activate') {
        // After on-chain escrow tx, activate the project in the backend
        await api.projects.activate(
          projectId,
          payload?.escrowTxId || 'pending',
          payload?.onChainId || 0,
        );
      } else if (actionType === 'cancel') {
        await api.projects.cancel(projectId);
      } else if (actionType === 'submit_milestone') {
        // Freelancer submits deliverable for a milestone
        const numProjectId = Number(projectId);

        // Optimistic update: immediately show milestone as 'submitted' in the UI
        const currentSubs = get().milestoneSubmissions[numProjectId] || [];
        const optimisticSub = {
          id: -Date.now(), // temp negative ID
          projectId: numProjectId,
          milestoneNum: payload.milestoneId,
          freelancerId: 0,
          deliverableUrl: payload.link,
          description: payload.description || null,
          status: 'submitted' as const,
          completionTxId: payload.completionTxId || null,
          releaseTxId: null,
          submittedAt: new Date().toISOString(),
          reviewedAt: null,
        };
        set((s) => ({
          milestoneSubmissions: {
            ...s.milestoneSubmissions,
            [numProjectId]: [...currentSubs, optimisticSub],
          },
        }));

        await api.milestones.submit({
          projectId: numProjectId,
          milestoneNum: payload.milestoneId,
          deliverableUrl: payload.link,
          description: payload.description,
          completionTxId: payload.completionTxId,
        });
        // Replace optimistic data with real server data
        await get().fetchMilestoneSubmissions(numProjectId);
      } else if (actionType === 'approve_milestone') {
        // Client approves a milestone submission
        const numProjectId = Number(projectId);

        // Optimistic update: immediately show milestone as 'approved'
        set((s) => ({
          milestoneSubmissions: {
            ...s.milestoneSubmissions,
            [numProjectId]: (s.milestoneSubmissions[numProjectId] || []).map((sub) =>
              sub.id === payload.submissionId
                ? { ...sub, status: 'approved' as const, releaseTxId: payload.releaseTxId || 'pending' }
                : sub
            ),
          },
        }));

        await api.milestones.approve(
          payload.submissionId,
          payload.releaseTxId || 'pending',
        );
        await get().fetchMilestoneSubmissions(numProjectId);
      } else if (actionType === 'reject_milestone') {
        const numProjectId = Number(projectId);

        // Optimistic update: immediately show milestone as 'rejected' → resets to 'pending' in enrichedMilestones
        set((s) => ({
          milestoneSubmissions: {
            ...s.milestoneSubmissions,
            [numProjectId]: (s.milestoneSubmissions[numProjectId] || []).map((sub) =>
              sub.id === payload.submissionId
                ? { ...sub, status: 'rejected' as const }
                : sub
            ),
          },
        }));

        await api.milestones.reject(payload.submissionId);
        await get().fetchMilestoneSubmissions(numProjectId);
      }
      await get().fetchProjects();
      await get().fetchMyProjects();
    } catch (error) {
      console.error('Action failed', error);
    } finally {
      set({ isProcessing: false });
    }
  },

  handleConnectX: async () => {
    set({ isProcessing: true });
    try {
      const username = await connectX();
      set((s) => ({
        wallet: { ...s.wallet, isXConnected: true, xUsername: username },
      }));
    } catch (e) {
      console.error(e);
    } finally {
      set({ isProcessing: false });
    }
  },

  handleSaveProfile: async (updatedProfile) => {
    set({ isProcessing: true });
    try {
      const updated = await api.users.updateMe({
        username: updatedProfile.name || undefined,
        specialty: updatedProfile.specialty || undefined,
        hourlyRate: updatedProfile.hourlyRate !== undefined ? String(updatedProfile.hourlyRate) : undefined,
        about: updatedProfile.about || undefined,
        skills: updatedProfile.skills || undefined,
        portfolio: updatedProfile.portfolio || undefined,
        company: updatedProfile.company || undefined,
        projectInterests: updatedProfile.projectInterests || undefined,
      });
      const merged: FreelancerProfile = {
        ...updatedProfile,
        name: updated.username || updatedProfile.name,
        specialty: updated.specialty || updatedProfile.specialty,
        hourlyRate: updated.hourlyRate ? parseFloat(updated.hourlyRate) : updatedProfile.hourlyRate,
        about: updated.about || updatedProfile.about,
        skills: updated.skills || updatedProfile.skills,
        portfolio: updated.portfolio || updatedProfile.portfolio,
        company: updated.company || updatedProfile.company,
        projectInterests: updated.projectInterests || updatedProfile.projectInterests,
      };
      set((s) => ({
        currentUserProfile: merged,
        leaderboardData: s.leaderboardData.map((p) =>
          p.address === updatedProfile.address ? merged : p
        ),
        isProcessing: false,
      }));
    } catch (error) {
      console.error('Save profile failed:', error);
      set({ isProcessing: false });
    }
  },

  /** Re-fetch the logged-in user's profile from the backend, enriching with leaderboard stats */
  _refreshProfile: async (address: string) => {
    try {
      const backendUser = await api.users.getByAddress(address);
      const profile = mapBackendUserToProfile(backendUser);
      // Enrich with leaderboard stats if available
      const lb = get().leaderboardData.find((e) => e.address === address);
      if (lb) {
        profile.jobsCompleted = lb.jobsCompleted;
        profile.rating = lb.rating;
        profile.rank = lb.rank;
      }
      set({ currentUserProfile: profile });
    } catch {
      // User not in DB yet — build a temporary shell profile
      if (!get().currentUserProfile || get().currentUserProfile?.address !== address) {
        set({
          currentUserProfile: {
            rank: 0,
            name: address.slice(0, 8),
            address,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`,
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
          },
        });
      }
    }
  },

  viewProfileByAddress: async (address, name) => {
    try {
      const backendUser = await api.users.getByAddress(address);
      const profile = mapBackendUserToProfile(backendUser);
      set({ selectedProfile: profile });
      return profile;
    } catch {
      // User not in DB — build a minimal profile from address
      const fallback: FreelancerProfile = {
        rank: 0,
        name: name || address.slice(0, 8),
        address,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`,
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
      set({ selectedProfile: fallback });
      return fallback;
    }
  },

  // ─── Notification Actions ─────────────────────────────────

  fetchNotifications: async () => {
    try {
      const notifs = await api.notifications.list();
      set({ notifications: notifs });
    } catch (e) {
      // User not authenticated — silently ignore
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { count } = await api.notifications.unreadCount();
      set({ unreadNotificationCount: count });
    } catch (e) {
      // silently ignore
    }
  },

  markNotificationRead: async (id: number) => {
    // Optimistic update
    set((s) => ({
      notifications: s.notifications.map((n) => n.id === id ? { ...n, isRead: true } : n),
      unreadNotificationCount: Math.max(0, s.unreadNotificationCount - 1),
    }));
    try {
      await api.notifications.markRead(id);
    } catch (e) {
      console.error('Failed to mark notification read:', e);
    }
  },

  markAllNotificationsRead: async () => {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadNotificationCount: 0,
    }));
    try {
      await api.notifications.markAllRead();
    } catch (e) {
      console.error('Failed to mark all read:', e);
    }
  },

  clearNotifications: async () => {
    set({ notifications: [], unreadNotificationCount: 0 });
    try {
      await api.notifications.clearAll();
    } catch (e) {
      console.error('Failed to clear notifications:', e);
    }
  },

  // ─── Admin Actions ──────────────────────────────────────────

  adminLogin: async (username, password) => {
    const res = await api.admin.login(username, password);
    set({ adminUser: res.admin, isAdminAuthenticated: true });
  },

  adminLogout: async () => {
    await api.admin.logout();
    set({ adminUser: null, isAdminAuthenticated: false, adminDashboardStats: null, adminUsers: [], adminProjects: [], adminDisputes: [], adminNFTs: [] });
  },

  checkAdminSession: async () => {
    try {
      const res = await api.admin.me();
      set({ adminUser: res.admin, isAdminAuthenticated: true });
      return true;
    } catch {
      set({ adminUser: null, isAdminAuthenticated: false });
      return false;
    }
  },

  fetchDashboardStats: async () => {
    try {
      const stats = await api.admin.dashboard();
      set({ adminDashboardStats: stats });
    } catch (e) {
      console.error('Failed to fetch dashboard stats:', e);
    }
  },

  fetchAdminUsers: async () => {
    try {
      const users = await api.admin.users();
      set({ adminUsers: users });
    } catch (e) {
      console.error('Failed to fetch admin users:', e);
    }
  },

  toggleUserStatus: async (userId, isActive) => {
    try {
      const updated = await api.admin.toggleUserStatus(userId, isActive);
      set((s) => ({ adminUsers: s.adminUsers.map((u) => (u.id === updated.id ? updated : u)) }));
    } catch (e) {
      console.error('Failed to toggle user status:', e);
    }
  },

  fetchAdminProjects: async (filters) => {
    try {
      const projects = await api.admin.projects(filters);
      set({ adminProjects: projects });
    } catch (e) {
      console.error('Failed to fetch admin projects:', e);
    }
  },

  fetchAdminDisputes: async () => {
    try {
      const disputes = await api.admin.disputes();
      set({ adminDisputes: disputes });
    } catch (e) {
      console.error('Failed to fetch admin disputes:', e);
    }
  },

  adminResolveDispute: async (id, resolution, resolutionTxId, favorFreelancer) => {
    const updated = await api.admin.resolveDispute(id, resolution, resolutionTxId, favorFreelancer);
    set((s) => ({ adminDisputes: s.adminDisputes.map((d) => (d.id === updated.id ? updated : d)) }));
  },

  adminResetDispute: async (id, resolution, resolutionTxId) => {
    const updated = await api.admin.resetDispute(id, resolution, resolutionTxId);
    set((s) => ({ adminDisputes: s.adminDisputes.map((d) => (d.id === updated.id ? updated : d)) }));
  },

  adminForceRelease: async (projectId, milestoneNum, txId) => {
    await api.admin.forceRelease(projectId, milestoneNum, txId);
    // Refresh admin projects list
    get().fetchAdminProjects();
  },

  adminForceRefund: async (projectId, txId) => {
    await api.admin.forceRefund(projectId, txId);
    get().fetchAdminProjects();
  },

  adminCreateNFT: async (data) => {
    const nft = await api.admin.createNFT(data);
    set((s) => ({ adminNFTs: [nft, ...s.adminNFTs] }));
  },

  fetchAdminNFTs: async (filters) => {
    try {
      const nfts = await api.admin.listNFTs(filters);
      set({ adminNFTs: nfts });
    } catch (e) {
      console.error('Failed to fetch admin NFTs:', e);
    }
  },

  adminConfirmMint: async (nftId, mintTxId) => {
    const updated = await api.admin.confirmMint(nftId, mintTxId);
    set((s) => ({ adminNFTs: s.adminNFTs.map((n) => (n.id === updated.id ? updated : n)) }));
  },
}));
