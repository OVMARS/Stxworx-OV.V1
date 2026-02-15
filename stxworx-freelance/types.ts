
export type UserRole = 'client' | 'freelancer' | 'admin' | null;

export type ViewType = 'home' | 'client' | 'freelancer' | 'browse' | 'profile' | 'gig-details' | 'edit-profile' | 'admin-login' | 'admin-dashboard';

export type TokenType = 'STX' | 'sBTC';

export type MilestoneStatus = 'locked' | 'pending' | 'submitted' | 'approved' | 'refunded';

export type ApplicationStatus = 'applied' | 'accepted' | 'in-progress' | 'completed';

export interface Application {
  id: string;
  projectId: string;
  freelancerAddress: string;
  status: ApplicationStatus;
  appliedAt: string;
  coverLetter?: string;
  project: Project;
}

export type MessageType = 'text' | 'audio' | 'file' | 'offer';

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  sender: 'me' | 'other';
  senderName?: string; // Added for admin view context
  content: string; 
  timestamp: string;
  date?: string; 
  type: MessageType;
  status?: MessageStatus;
  fileUrl?: string; 
  duration?: string; 
  offerDetails?: {
    price: number;
    deliveryDays: number;
  };
}

export interface ChatContact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  unread: number;
  online: boolean;
  role?: string; 
}

export interface Milestone {
  id: number;
  title: string;
  amount: number;
  status: MilestoneStatus;
  submissionLink?: string;
  submissionNote?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  clientAddress: string;
  freelancerAddress: string;
  tokenType: TokenType;
  totalBudget: number;
  isFunded: boolean;
  createdAt: string;
  milestones: Milestone[];
  attachments?: string[]; // Added attachments field
  status?: 'active' | 'completed' | 'disputed' | 'cancelled';
}

export interface Gig {
  id: string;
  freelancerName: string;
  freelancerAddress: string;
  title: string;
  description: string;
  fullDescription?: string; 
  deliveryTime?: number; 
  category: string;
  price: number;
  rating: number;
  reviews: number;
  imageUrl: string;
  tags: string[];
  isVerified?: boolean; 
}

export interface FreelancerProfile {
  rank: number;
  name: string;
  address: string;
  avatar: string;
  totalEarnings: number;
  jobsCompleted: number;
  rating: number;
  specialty: string;
  badges: string[];
  about?: string;
  portfolio?: string[];
  skills?: string[];
  hourlyRate?: number;
  
  // Verification System
  isIdVerified?: boolean; 
  isSkillVerified?: boolean; 
  isPortfolioVerified?: boolean; 
}

export interface WalletState {
  isConnected: boolean;
  isXConnected?: boolean;
  xUsername?: string;
  address: string | null;
  balanceSTX: number;
  balanceSBTC: number;
}

// --- Admin Types ---

export interface AdminUser {
  id: string;
  name: string;
  address: string;
  role: 'Freelancer' | 'Client';
  status: 'Active' | 'Banned' | 'Pending';
  joinDate: string;
  earnings: number;
  reports: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'Open' | 'Resolved' | 'Escalated';
  priority: 'Low' | 'Medium' | 'High';
  date: string;
  relatedJobId?: string;
}

export interface ApprovalItem {
  id: string;
  type: 'Gig' | 'Profile' | 'KYC';
  requesterName: string;
  details: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface NFTDrop {
  id: string;
  name: string;
  image: string;
  supply: number;
  minted: number;
  status: 'Active' | 'Paused' | 'Ended';
  type: 'Badge' | 'Membership';
}

export interface AdminConversation {
  id: string;
  participants: { name: string; role: 'Client' | 'Freelancer'; avatar: string }[];
  lastMessage: string;
  lastMessageTime: string;
  messages: Message[];
}
