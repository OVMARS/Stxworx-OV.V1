import { create } from 'zustand';
import { Project, Gig, FreelancerProfile, WalletState, ChatContact } from '../types';
import {
  fetchProjects,
  fetchGigs,
  fetchLeaderboard,
  fetchFreelancerByAddress,
  createProjectService,
  createGigService,
  fundProject,
  releasePayment,
  submitMilestone,
  connectX,
  generateId,
} from '../services/StacksService';

interface AppState {
  projects: Project[];
  gigs: Gig[];
  filteredGigs: Gig[];
  leaderboardData: FreelancerProfile[];
  currentUserProfile: FreelancerProfile | null;
  selectedProfile: FreelancerProfile | null;
  selectedGig: Gig | null;
  wallet: WalletState;
  searchTerm: string;
  selectedCategory: string;
  currentBlock: number;
  freelancerTab: 'active' | 'leaderboard';
  isLoading: boolean;
  isProcessing: boolean;
  isModalOpen: boolean;
  isGigModalOpen: boolean;
  modalInitialData: any;
  activeChatContact: ChatContact | null;

  // Actions
  init: () => Promise<void>;
  syncWallet: (isSignedIn: boolean, userAddress: string | null) => void;
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (cat: string) => void;
  setFreelancerTab: (tab: 'active' | 'leaderboard') => void;
  setSelectedProfile: (profile: FreelancerProfile | null) => void;
  setSelectedGig: (gig: Gig | null) => void;
  setIsModalOpen: (open: boolean) => void;
  setIsGigModalOpen: (open: boolean) => void;
  setModalInitialData: (data: any) => void;
  setActiveChatContact: (contact: ChatContact | null) => void;
  setIsProcessing: (val: boolean) => void;

  handleCreateProject: (data: any) => Promise<void>;
  handleCreateGig: (data: any) => Promise<void>;
  handleProjectAction: (projectId: string, actionType: string, payload?: any) => Promise<void>;
  handleConnectX: () => Promise<void>;
  handleSaveProfile: (updatedProfile: FreelancerProfile) => Promise<void>;
  viewProfileByAddress: (address: string, name?: string) => Promise<FreelancerProfile>;
  openHireModal: (gig: Gig) => void;
  incrementBlock: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  projects: [],
  gigs: [],
  filteredGigs: [],
  leaderboardData: [],
  currentUserProfile: null,
  selectedProfile: null,
  selectedGig: null,
  wallet: {
    isConnected: false,
    address: null,
    isXConnected: false,
    xUsername: undefined,
    balanceSTX: 0,
    balanceSBTC: 0,
  },
  searchTerm: '',
  selectedCategory: 'All',
  currentBlock: 89212,
  freelancerTab: 'active',
  isLoading: true,
  isProcessing: false,
  isModalOpen: false,
  isGigModalOpen: false,
  modalInitialData: null,
  activeChatContact: null,

  init: async () => {
    const [storedProjects, fetchedGigs, fetchedLeaderboard] = await Promise.all([
      fetchProjects(),
      fetchGigs(),
      fetchLeaderboard(),
    ]);
    set({
      projects: storedProjects,
      gigs: fetchedGigs,
      filteredGigs: fetchedGigs,
      leaderboardData: fetchedLeaderboard,
      isLoading: false,
    });
  },

  syncWallet: (isSignedIn, userAddress) => {
    if (isSignedIn && userAddress) {
      set((s) => ({
        wallet: { ...s.wallet, isConnected: true, address: userAddress },
      }));

      fetchFreelancerByAddress(userAddress, 'You').then((profile) => {
        set({ currentUserProfile: profile });
      });

      const networkUrl = 'https://api.testnet.hiro.so';
      fetch(`${networkUrl}/extended/v1/address/${userAddress}/balances`)
        .then((res) => res.json())
        .then((data) => {
          const stx = parseInt(data.stx.balance) / 1_000_000;
          set((s) => ({ wallet: { ...s.wallet, balanceSTX: stx } }));
        })
        .catch(() => {});
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
      });
    }
  },

  setSearchTerm: (term) => {
    set({ searchTerm: term });
    const { gigs, selectedCategory } = get();
    let result = gigs;
    if (selectedCategory !== 'All') {
      result = result.filter((g) => g.category === selectedCategory);
    }
    if (term) {
      const lower = term.toLowerCase();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(lower) ||
          g.description.toLowerCase().includes(lower) ||
          g.tags.some((t) => t.toLowerCase().includes(lower))
      );
    }
    set({ filteredGigs: result });
  },

  setSelectedCategory: (cat) => {
    set({ selectedCategory: cat });
    const { gigs, searchTerm } = get();
    let result = gigs;
    if (cat !== 'All') {
      result = result.filter((g) => g.category === cat);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(lower) ||
          g.description.toLowerCase().includes(lower) ||
          g.tags.some((t) => t.toLowerCase().includes(lower))
      );
    }
    set({ filteredGigs: result });
  },

  setFreelancerTab: (tab) => set({ freelancerTab: tab }),
  setSelectedProfile: (profile) => set({ selectedProfile: profile }),
  setSelectedGig: (gig) => set({ selectedGig: gig }),
  setIsModalOpen: (open) => set({ isModalOpen: open }),
  setIsGigModalOpen: (open) => set({ isGigModalOpen: open }),
  setModalInitialData: (data) => set({ modalInitialData: data }),
  setActiveChatContact: (contact) => set({ activeChatContact: contact }),
  setIsProcessing: (val) => set({ isProcessing: val }),

  incrementBlock: () => set((s) => ({ currentBlock: s.currentBlock + 1 })),

  handleCreateProject: async (data) => {
    const { wallet } = get();
    if (!wallet.address) return;
    set({ isProcessing: true });

    const milestoneAmount = data.totalBudget / 4;
    const defaultMilestones = [
      { id: 1, title: 'Milestone 1', amount: milestoneAmount, status: 'locked' as const },
      { id: 2, title: 'Milestone 2', amount: milestoneAmount, status: 'locked' as const },
      { id: 3, title: 'Milestone 3', amount: milestoneAmount, status: 'locked' as const },
      { id: 4, title: 'Milestone 4', amount: milestoneAmount, status: 'locked' as const },
    ];

    const newProject: Project = {
      id: generateId(),
      title: data.title,
      description: data.description,
      category: data.category,
      clientAddress: wallet.address,
      freelancerAddress: data.freelancerAddress,
      tokenType: data.tokenType,
      totalBudget: data.totalBudget,
      isFunded: false,
      createdAt: new Date().toISOString(),
      milestones: data.milestones || defaultMilestones,
      attachments: data.attachments || [],
    };

    await createProjectService(newProject);
    const updatedProjects = await fetchProjects();
    set({ projects: updatedProjects, isProcessing: false, isModalOpen: false, modalInitialData: null });
  },

  handleCreateGig: async (data) => {
    const { wallet, currentUserProfile } = get();
    if (!wallet.address) return;
    set({ isProcessing: true });

    const newGig: Gig = {
      id: generateId(),
      freelancerName: currentUserProfile?.name || 'You',
      freelancerAddress: wallet.address,
      title: data.title,
      description: data.description,
      category: data.category,
      price: data.price,
      deliveryTime: data.deliveryTime,
      rating: 0,
      reviews: 0,
      imageUrl: data.imageUrl,
      tags: data.tags,
      isVerified: currentUserProfile?.isIdVerified,
    };

    await createGigService(newGig);
    const updatedGigs = await fetchGigs();
    set({ gigs: updatedGigs, isProcessing: false, isGigModalOpen: false });
  },

  handleProjectAction: async (projectId, actionType, payload) => {
    set({ isProcessing: true });
    try {
      const { projects } = get();
      if (actionType === 'fund') {
        const project = projects.find((p) => p.id === projectId);
        if (project) await fundProject(projectId, project.totalBudget, project.tokenType);
      } else if (actionType === 'submit_milestone') {
        await submitMilestone(projectId, payload.milestoneId, payload.link);
      } else if (actionType === 'approve_milestone') {
        await releasePayment(projectId, payload.milestoneId);
      }
      const updatedProjects = await fetchProjects();
      set({ projects: updatedProjects });
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
    await new Promise((resolve) => setTimeout(resolve, 1000));
    set((s) => ({
      currentUserProfile: updatedProfile,
      leaderboardData: s.leaderboardData.map((p) =>
        p.address === updatedProfile.address ? updatedProfile : p
      ),
      isProcessing: false,
    }));
  },

  viewProfileByAddress: async (address, name) => {
    const profile = await fetchFreelancerByAddress(address, name);
    set({ selectedProfile: profile });
    return profile;
  },

  openHireModal: (gig) => {
    set({
      modalInitialData: {
        title: `Contract: ${gig.title}`,
        description: `Scope based on gig: ${gig.title}. \n\n${gig.description}`,
        category: gig.category,
        totalBudget: gig.price,
        tokenType: 'STX',
        freelancerAddress: gig.freelancerAddress,
      },
      isModalOpen: true,
    });
  },
}));
