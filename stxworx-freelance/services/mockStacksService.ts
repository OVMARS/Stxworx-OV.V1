
import { Project, TokenType, Gig, FreelancerProfile, ChatContact, Message, AdminUser, SupportTicket, ApprovalItem, NFTDrop, AdminConversation } from '../types';


// Constants for storage keys
const STORAGE_KEYS = {
  PROJECTS: 'stxworx_mainnet_projects',
  WALLET: 'stxworx_mainnet_wallet_session',
  X_SESSION: 'stxworx_x_session'
};

// --- Currency & Rates ---

export let EXCHANGE_RATES = {
  STX: 1.85,   // Updated to approx market rate
  sBTC: 65000.00
};

// Fetch live rates on load
(async () => {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=blockstack,bitcoin&vs_currencies=usd');
    const data = await res.json();
    if (data.blockstack?.usd) EXCHANGE_RATES.STX = data.blockstack.usd;
    if (data.bitcoin?.usd) EXCHANGE_RATES.sBTC = data.bitcoin.usd;
  } catch (e) {
    console.warn('Using default exchange rates');
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
  return usdAmount / EXCHANGE_RATES[token];
};

export const tokenToUsd = (tokenAmount: number, token: TokenType): number => {
  return tokenAmount * EXCHANGE_RATES[token];
};

// Simulates network latency for realistic blockchain feel
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

export const mockConnectWallet = async (): Promise<string> => {
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

export const mockDisconnectWallet = () => {
  localStorage.removeItem(STORAGE_KEYS.WALLET);
  localStorage.removeItem(STORAGE_KEYS.X_SESSION);
};

export const mockConnectX = async (): Promise<string> => {
  await delay(1200);
  const username = '@crypto_freelancer';
  // We do NOT set wallet address here, just the X session
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
      isFunded: p.status !== 'pending', // strict check
      status: p.status,
      createdAt: p.created_at,
      milestones: [], // The list endpoint doesn't return milestones yet, default to empty to avoid crashes
      attachments: []
    }));
  } catch (err) {
    console.warn('Backend unavailable, falling back to local storage', err);
    await delay(500);
    return getStoredProjects();
  }
};

export const createProjectService = async (project: Project): Promise<boolean> => {
  await delay(1500); // Simulate contract deployment
  const projects = getStoredProjects();
  saveProjects([project, ...projects]);
  return true;
};

export const mockFundProject = async (projectId: string, amount: number, token: TokenType): Promise<boolean> => {
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

export const mockSubmitMilestone = async (projectId: string, milestoneId: number, link: string): Promise<boolean> => {
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

export const mockReleasePayment = async (projectId: string, milestoneId: number): Promise<boolean> => {
  console.log(`Releasing payment for milestone ${milestoneId} in project ${projectId}`);
  await delay(2500); // Simulate transaction

  const projects = getStoredProjects();
  const project = projects.find(p => p.id === projectId);

  if (project) {
    const mIndex = project.milestones.findIndex(m => m.id === milestoneId);
    if (mIndex !== -1) {
      project.milestones[mIndex].status = 'approved';
      // Unlock next milestone if it exists
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

  // Reuse existing release logic as the outcome is the same (money goes to freelancer)
  return mockReleasePayment(projectId, milestoneId);
};

export const generateId = () => Math.random().toString(36).substring(2, 11);

// --- Gig Services (Browse) ---

export const MOCK_GIGS: Gig[] = [
  {
    id: 'g1',
    freelancerName: 'SatoshiDesign',
    freelancerAddress: 'SP3DX394KY8X23M1F3K8K3J29X47R910Q',
    title: 'Professional DeFi Dashboard Design',
    description: 'I will design a modern, responsive DeFi dashboard for your Stacks project.',
    category: 'Design',
    price: 1500,
    rating: 5.0,
    reviews: 12,
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500',
    tags: ['UI/UX', 'Figma', 'DeFi']
  },
  {
    id: 'g2',
    freelancerName: 'ClarityKing',
    freelancerAddress: 'SP1...B22',
    title: 'Smart Contract Audit & Optimization',
    description: 'Expert Clarity smart contract auditing and gas optimization services.',
    category: 'Smart Contracts',
    price: 2500,
    rating: 4.9,
    reviews: 8,
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=500',
    tags: ['Clarity', 'Security', 'Audit']
  }
];

export const fetchGigs = async (): Promise<Gig[]> => {
  await delay(600);
  return MOCK_GIGS;
};

export const createGigService = async (gig: Gig): Promise<boolean> => {
  await delay(1500);
  MOCK_GIGS.unshift(gig);
  return true;
};

// --- Leaderboard & Profile Services ---

const MOCK_LEADERBOARD: FreelancerProfile[] = [
  {
    rank: 1,
    name: 'SatoshiDesign',
    address: 'SP3DX394KY8X23M1F3K8K3J29X47R910Q',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    totalEarnings: 45000, // USD
    jobsCompleted: 89,
    rating: 5.0,
    specialty: 'UI/UX',
    badges: ['Top Rated', 'Verified'],
    about: 'Senior UI/UX designer specializing in blockchain interfaces. I create intuitive, futuristic, and accessible designs for DeFi and NFT platforms.',
    portfolio: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=500'],
    isIdVerified: true,
    isSkillVerified: true,
    isPortfolioVerified: true
  },
  {
    rank: 2,
    name: 'ClarityKing',
    address: 'SP1...B22',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
    totalEarnings: 38200, // USD
    jobsCompleted: 64,
    rating: 4.9,
    specialty: 'Smart Contracts',
    badges: ['Auditor'],
    about: 'Clarity smart contract engineer with 4 years of experience on Stacks. Security is my priority.',
    portfolio: ['https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=500'],
    isIdVerified: true,
    isSkillVerified: true,
    isPortfolioVerified: false
  },
  {
    rank: 3,
    name: 'RustAce',
    address: 'SP9...X99',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    totalEarnings: 29800, // USD
    jobsCompleted: 52,
    rating: 4.9,
    specialty: 'Development',
    badges: [],
    isIdVerified: true,
    isSkillVerified: false,
    isPortfolioVerified: true
  },
  {
    rank: 4,
    name: 'StacksMaster',
    address: 'SP2...777',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Preston',
    totalEarnings: 21600, // USD
    jobsCompleted: 45,
    rating: 4.8,
    specialty: 'Full Stack',
    badges: [],
    isIdVerified: false,
    isSkillVerified: true,
    isPortfolioVerified: false
  },
  {
    rank: 5,
    name: 'BitWriter',
    address: 'SP5...555',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Molly',
    totalEarnings: 15400, // USD
    jobsCompleted: 38,
    rating: 4.7,
    specialty: 'Writing',
    badges: []
  },
  {
    rank: 6,
    name: 'NeonPixel',
    address: 'SP8...333',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Spooky',
    totalEarnings: 12200, // USD
    jobsCompleted: 29,
    rating: 4.8,
    specialty: 'NFT Art',
    badges: []
  },
  {
    rank: 7,
    name: 'You',
    address: 'SP3...10Q',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
    totalEarnings: 3250, // USD
    jobsCompleted: 4,
    rating: 5.0,
    specialty: 'Frontend',
    badges: ['New Rising'],
    isIdVerified: true,
    isSkillVerified: true
  },
];

export const fetchLeaderboard = async (): Promise<FreelancerProfile[]> => {
  await delay(500);
  return MOCK_LEADERBOARD;
};

export const fetchFreelancerByAddress = async (address: string, name?: string): Promise<FreelancerProfile> => {
  await delay(400);

  // Try to find in leaderboard first
  const found = MOCK_LEADERBOARD.find(f => f.address === address || (address.length > 5 && f.address.includes(address.slice(0, 5))));
  if (found) return found;

  // Try to find in gigs for fallback data
  const gigInfo = MOCK_GIGS.find(g => g.freelancerAddress === address);

  // Return a generated profile
  return {
    rank: 99,
    name: name || gigInfo?.freelancerName || 'Freelancer',
    address: address,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`,
    totalEarnings: gigInfo ? gigInfo.price * gigInfo.reviews : 0,
    jobsCompleted: gigInfo ? gigInfo.reviews : 0,
    rating: gigInfo ? gigInfo.rating : 4.5,
    specialty: gigInfo ? gigInfo.category : 'Generalist',
    badges: gigInfo && gigInfo.rating >= 4.9 ? ['Top Rated'] : [],
    about: gigInfo ? `Professional freelancer specializing in ${gigInfo.category}. Committed to delivering high-quality results on the Stacks blockchain.` : 'Blockchain freelancer available for hire.',
    portfolio: gigInfo ? [gigInfo.imageUrl] : [],
    isIdVerified: gigInfo?.isVerified || false,
    isSkillVerified: gigInfo?.isVerified || false,
    isPortfolioVerified: false
  };
};

// --- Chat Mock Data ---

export const MOCK_CONTACTS: ChatContact[] = [
  {
    id: 'c1',
    name: 'SatoshiDesign',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    lastMessage: 'Contract.pdf',
    unread: 2,
    online: true,
    role: 'Freelancer'
  },
  {
    id: 'c2',
    name: 'ClarityKing',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
    lastMessage: 'Sounds good, starting now.',
    unread: 0,
    online: false,
    role: 'Freelancer'
  },
  {
    id: 'c3',
    name: 'StacksFoundation',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Stacks',
    lastMessage: 'Grant Approved.',
    unread: 1,
    online: true,
    role: 'Client'
  }
];

export const MOCK_MESSAGES: Message[] = [
  { id: 'm1', sender: 'other', senderName: 'Client', content: 'Hi there! I saw your project for the DeFi Dashboard.', timestamp: '10:30 AM', date: '2025-05-15', type: 'text', status: 'read' },
  { id: 'm2', sender: 'me', senderName: 'Me', content: 'Hey! Yes, I need someone to handle the frontend integration with Stacks.', timestamp: '10:32 AM', date: '2025-05-15', type: 'text', status: 'read' },
  { id: 'm3', sender: 'other', senderName: 'Client', content: 'I have extensive experience with Stacks.js and React.', timestamp: '10:33 AM', date: '2025-05-15', type: 'text', status: 'read' },
  { id: 'm4', sender: 'other', senderName: 'Client', content: 'Here is my portfolio and previous smart contract interactions.', timestamp: '10:33 AM', date: '2025-05-15', type: 'audio', duration: '0:15', status: 'read' },
  { id: 'm5', sender: 'me', senderName: 'Me', content: 'Great, can you send over a proposal?', timestamp: '10:35 AM', date: '2025-05-15', type: 'text', status: 'read' },
  { id: 'm6', sender: 'other', senderName: 'Client', content: 'Proposal_v1.pdf', timestamp: '10:40 AM', date: '2025-05-15', type: 'file', fileUrl: '#', status: 'delivered' },
  { id: 'm7', sender: 'other', senderName: 'Client', content: 'Here is a custom offer for the frontend work.', timestamp: '10:45 AM', date: '2025-05-15', type: 'offer', offerDetails: { price: 2400, deliveryDays: 14 }, status: 'read' }
];

export const MOCK_ADMIN_CHATS: AdminConversation[] = [
  {
    id: 'conv1',
    participants: [
      { name: 'SatoshiDesign', role: 'Freelancer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
      { name: 'StacksFoundation', role: 'Client', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Stacks' }
    ],
    lastMessage: 'Grant Approved.',
    lastMessageTime: '10:45 AM',
    messages: [
      { id: 'cm1', sender: 'other', senderName: 'StacksFoundation', content: 'We have reviewed your grant application.', timestamp: '09:00 AM', date: '2024-05-20', type: 'text' },
      { id: 'cm2', sender: 'me', senderName: 'SatoshiDesign', content: 'Thank you! Is there any other info you need?', timestamp: '09:05 AM', date: '2024-05-20', type: 'text' },
      { id: 'cm3', sender: 'other', senderName: 'StacksFoundation', content: 'No, everything looks good. We will proceed with funding.', timestamp: '09:10 AM', date: '2024-05-20', type: 'text' },
    ]
  },
  {
    id: 'conv2',
    participants: [
      { name: 'ClarityKing', role: 'Freelancer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack' },
      { name: 'DeFi_Startups', role: 'Client', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DeFi' }
    ],
    lastMessage: 'Where are the audit reports?',
    lastMessageTime: 'Yesterday',
    messages: [
      { id: 'cm4', sender: 'me', senderName: 'DeFi_Startups', content: 'Hey, checking in on the audit progress.', timestamp: '02:00 PM', date: '2024-05-19', type: 'text' },
      { id: 'cm5', sender: 'other', senderName: 'ClarityKing', content: 'Found a re-entrancy vulnerability. Fixing it now.', timestamp: '03:15 PM', date: '2024-05-19', type: 'text' },
      { id: 'cm6', sender: 'me', senderName: 'DeFi_Startups', content: 'Okay, please update me EOD.', timestamp: '03:20 PM', date: '2024-05-19', type: 'text' },
    ]
  }
];

export const fetchAllConversations = async (): Promise<AdminConversation[]> => {
  await delay(600);
  return MOCK_ADMIN_CHATS;
};

// --- Admin Mock Data ---

export const MOCK_ADMIN_USERS: AdminUser[] = [
  { id: 'u1', name: 'SatoshiDesign', address: 'SP3...99A', role: 'Freelancer', status: 'Active', joinDate: '2024-01-15', earnings: 45000, reports: 0 },
  { id: 'u2', name: 'ClarityKing', address: 'SP1...B22', role: 'Freelancer', status: 'Active', joinDate: '2024-02-10', earnings: 38200, reports: 1 },
  { id: 'u3', name: 'BadActor', address: 'SP6...666', role: 'Client', status: 'Banned', joinDate: '2024-03-01', earnings: 0, reports: 12 },
  { id: 'u4', name: 'NewUser123', address: 'SP7...777', role: 'Freelancer', status: 'Pending', joinDate: '2024-05-20', earnings: 0, reports: 0 },
  { id: 'u5', name: 'EnterpriseCorp', address: 'SP9...000', role: 'Client', status: 'Active', joinDate: '2023-11-20', earnings: 0, reports: 0 },
];

export const MOCK_ADMIN_TICKETS: SupportTicket[] = [
  { id: 't1', userId: 'u2', subject: 'Dispute over Milestone 2', message: 'Client refuses to release funds despite delivery.', status: 'Open', priority: 'High', date: '2024-05-21', relatedJobId: 'p102' },
  { id: 't2', userId: 'u5', subject: 'Question about fees', message: 'How are the platform fees calculated on sBTC?', status: 'Resolved', priority: 'Low', date: '2024-05-19' },
  { id: 't3', userId: 'u4', subject: 'Verification Pending', message: 'I submitted my documents 3 days ago.', status: 'Open', priority: 'Medium', date: '2024-05-20' },
];

export const MOCK_ADMIN_APPROVALS: ApprovalItem[] = [
  { id: 'a1', type: 'Gig', requesterName: 'SatoshiDesign', details: 'New Gig: Advanced UI Kit', date: '2024-05-21', status: 'Pending' },
  { id: 'a2', type: 'Profile', requesterName: 'NewUser123', details: 'ID Verification Documents', date: '2024-05-20', status: 'Pending' },
  { id: 'a3', type: 'KYC', requesterName: 'EnterpriseCorp', details: 'Corporate Verification', date: '2024-05-18', status: 'Approved' },
];

export const MOCK_NFT_DROPS: NFTDrop[] = [
  { id: 'n1', name: 'Early Adopter Badge', image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=100', supply: 1000, minted: 850, status: 'Active', type: 'Badge' },
  { id: 'n2', name: 'Top Rated Freelancer', image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=100', supply: 100, minted: 24, status: 'Active', type: 'Badge' },
  { id: 'n3', name: 'STXWorx Genesis Pass', image: 'https://images.unsplash.com/photo-1622630998477-20aa696fa4f5?auto=format&fit=crop&w=100', supply: 500, minted: 500, status: 'Ended', type: 'Membership' },
];
