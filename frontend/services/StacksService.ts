
import { Project, TokenType, FreelancerProfile, ChatContact, Message, AdminUser, SupportTicket, ApprovalItem, NFTDrop, AdminConversation } from '../types';

/**
 * Service layer for interacting with Stacks blockchain, Backend API, and Off-chain data.
 */

// Constants for storage keys
const STORAGE_KEYS = {
    PROJECTS: 'stxworx_mainnet_projects',
    WALLET: 'stxworx_mainnet_wallet_session',
    X_SESSION: 'stxworx_x_session'
};

// --- Currency & Rates ---

// Initial rates (will be updated by live fetch)
export let EXCHANGE_RATES = {
    STX: 0.00,
    sBTC: 0.00
};

// Fetch live rates on load from CoinGecko
(async () => {
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=blockstack,bitcoin&vs_currencies=usd');
        if (!res.ok) throw new Error('Rate limit or network error');

        const data = await res.json();

        if (data.blockstack?.usd) {
            EXCHANGE_RATES.STX = data.blockstack.usd;
        } else {
            EXCHANGE_RATES.STX = 1.85; // Fallback if API missing key
        }

        if (data.bitcoin?.usd) {
            EXCHANGE_RATES.sBTC = data.bitcoin.usd;
        } else {
            EXCHANGE_RATES.sBTC = 65000.00; // Fallback
        }
    } catch (e) {
        console.warn('Unable to fetch live exchange rates. Using estimated market averages.');
        EXCHANGE_RATES.STX = 1.85;
        EXCHANGE_RATES.sBTC = 65000.00;
    }
})();

export const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export const usdToToken = (usdAmount: number, token: TokenType): number => {
    const rate = EXCHANGE_RATES[token] || 1; // Prevent division by zero
    return usdAmount / rate;
};

export const tokenToUsd = (tokenAmount: number, token: TokenType): number => {
    const rate = EXCHANGE_RATES[token] || 0;
    return tokenAmount * rate;
};

// Simulates network latency 
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- Persistence Helpers ---

const getStoredProjects = (): Project[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.PROJECTS);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to parse projects", e);
        return [];
    }
};

const saveProjects = (projects: Project[]) => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
};

// --- Wallet Services ---

export const connectWallet = async (): Promise<string> => {
    await delay(800);
    // Simulating a real Stacks Mainnet address format
    const address = 'SP3DX394KY8X23M1F3K8K3J29X47R910Q';
    localStorage.setItem(STORAGE_KEYS.WALLET, address);
    return address;
};

export const checkWalletSession = (): { address: string | null, xUsername?: string | null } => {
    const address = localStorage.getItem(STORAGE_KEYS.WALLET);
    const xUsername = localStorage.getItem(STORAGE_KEYS.X_SESSION);
    return { address, xUsername };
};

export const disconnectWallet = () => {
    localStorage.removeItem(STORAGE_KEYS.WALLET);
    localStorage.removeItem(STORAGE_KEYS.X_SESSION);
};

export const connectX = async (): Promise<string> => {
    await delay(1200);
    const username = '@crypto_freelancer';
    localStorage.setItem(STORAGE_KEYS.X_SESSION, username);
    return username;
};

// --- Project Services ---

export const fetchProjects = async (): Promise<Project[]> => {
    try {
        const response = await fetch('http://localhost:3001/api/projects');
        if (!response.ok) throw new Error('Backend unavailable');

        const { data } = await response.json();

        // Map backend snake_case to frontend camelCase
        return data.map((p: any) => ({
            id: String(p.id),
            title: p.title,
            description: p.description,
            category: p.category,
            clientAddress: p.client_address,
            freelancerAddress: p.freelancer_address,
            tokenType: p.token_type,
            totalBudget: p.total_budget,
            isFunded: p.status === 'active',
            status: p.status,
            createdAt: p.created_at,
            milestones: [],
            attachments: []
        }));
    } catch (err) {
        console.warn('Backend unavailable, falling back to local storage', err);
        await delay(500);
        return getStoredProjects();
    }
};

export const createProjectService = async (project: Project): Promise<boolean> => {
    await delay(1500);
    const projects = getStoredProjects();
    saveProjects([project, ...projects]);
    return true;
};

export const fundProject = async (projectId: string, amount: number, token: TokenType): Promise<boolean> => {
    console.log(`Processing funding status for project ${projectId} with ${amount} ${token}`);
    try {
        // Call backend to update status
        const response = await fetch(`http://localhost:3001/api/projects/${projectId}/fund`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to update project status');
        return true;
    } catch (error) {
        console.error("Funding update failed", error);
        return false;
    }
};

export const submitMilestone = async (projectId: string, milestoneId: number, link: string): Promise<boolean> => {
    console.log(`Submitting milestone ${milestoneId} for project ${projectId}`);
    await delay(1200);

    const projects = getStoredProjects();
    const project = projects.find(p => p.id === projectId);

    if (project) {
        const milestone = project.milestones.find(m => m.id === milestoneId);
        if (milestone) {
            milestone.status = 'submitted';
            milestone.submissionLink = link;
            saveProjects(projects);
            return true;
        }
    }
    return false;
};

export const releasePayment = async (projectId: string, milestoneId: number): Promise<boolean> => {
    console.log(`Releasing payment for milestone ${milestoneId} in project ${projectId}`);
    await delay(2500);

    const projects = getStoredProjects();
    const project = projects.find(p => p.id === projectId);

    if (project) {
        const mIndex = project.milestones.findIndex(m => m.id === milestoneId);
        if (mIndex !== -1) {
            project.milestones[mIndex].status = 'approved';
            if (project.milestones[mIndex + 1]) {
                project.milestones[mIndex + 1].status = 'pending';
            }
            saveProjects(projects);
            return true;
        }
    }
    return false;
};

// --- Admin Payment Services ---

export const adminRefundMilestone = async (projectId: string, milestoneId: number): Promise<boolean> => {
    console.log(`ADMIN ACTION: Refunding milestone ${milestoneId} in project ${projectId}`);
    await delay(2000);

    const projects = getStoredProjects();
    const project = projects.find(p => p.id === projectId);

    if (project) {
        const mIndex = project.milestones.findIndex(m => m.id === milestoneId);
        if (mIndex !== -1) {
            project.milestones[mIndex].status = 'refunded';
            saveProjects(projects);
            return true;
        }
    }
    return false;
};

export const adminForceReleaseMilestone = async (projectId: string, milestoneId: number): Promise<boolean> => {
    console.log(`ADMIN ACTION: Force releasing milestone ${milestoneId} in project ${projectId}`);
    await delay(2000);

    return releasePayment(projectId, milestoneId);
};

export const generateId = () => Math.random().toString(36).substring(2, 11);

// --- Leaderboard & Profile Services ---

export const fetchLeaderboard = async (): Promise<FreelancerProfile[]> => {
    try {
        const res = await fetch('http://localhost:3001/api/freelancers');
        if (!res.ok) throw new Error('Failed to fetch leaderboard');
        const { data } = await res.json();
        return data;
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const fetchFreelancerByAddress = async (address: string, name?: string): Promise<FreelancerProfile> => {
    // Simplification: In real app, fetch single profile /api/freelancers/:address
    const all = await fetchLeaderboard();
    const found = all.find(f => f.address === address || (address.length > 5 && f.address.includes(address.slice(0, 5))));
    if (found) return found;

    return {
        rank: 99,
        name: name || 'Freelancer',
        address: address,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`,
        totalEarnings: 0,
        jobsCompleted: 0,
        rating: 4.5,
        specialty: 'Generalist',
        badges: [],
        about: 'Blockchain freelancer available for hire.',
        portfolio: [],
        isIdVerified: false,
        isSkillVerified: false,
        isPortfolioVerified: false
    };
};

// --- Chat Data ---

export const fetchContacts = async (): Promise<ChatContact[]> => {
    try {
        const res = await fetch('http://localhost:3001/api/contacts');
        const { data } = await res.json();
        return data;
    } catch (e) { return []; }
};

export const fetchMessages = async (): Promise<Message[]> => {
    try {
        const res = await fetch('http://localhost:3001/api/messages');
        const { data } = await res.json();
        return data;
    } catch (e) { return []; }
};

export const fetchAllConversations = async (): Promise<AdminConversation[]> => {
    try {
        const res = await fetch('http://localhost:3001/api/admin/chats');
        const { data } = await res.json();
        return data;
    } catch (e) { return []; }
};

// --- Admin Data ---

export const fetchAdminUsers = async (): Promise<AdminUser[]> => {
    try {
        const res = await fetch('http://localhost:3001/api/admin/users');
        const { data } = await res.json();
        return data;
    } catch (e) { return []; }
};

export const fetchAdminTickets = async (): Promise<SupportTicket[]> => {
    try {
        const res = await fetch('http://localhost:3001/api/admin/tickets');
        const { data } = await res.json();
        return data;
    } catch (e) { return []; }
};

export const fetchAdminApprovals = async (): Promise<ApprovalItem[]> => {
    try {
        const res = await fetch('http://localhost:3001/api/admin/approvals');
        const { data } = await res.json();
        return data;
    } catch (e) { return []; }
};

export const fetchNFTDrops = async (): Promise<NFTDrop[]> => {
    try {
        const res = await fetch('http://localhost:3001/api/nft/drops');
        const { data } = await res.json();
        return data;
    } catch (e) { return []; }
};
