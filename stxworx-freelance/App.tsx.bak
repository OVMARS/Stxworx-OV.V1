import React, { useState, useEffect } from 'react';
import { useWallet } from './hooks/useWallet';
import Navbar from './components/Navbar';
import ProjectCard from './components/ProjectCard';
import GigCard from './components/GigCard';
import Leaderboard from './components/Leaderboard';
import FreelancerProfile from './components/FreelancerProfile';
import CreateProjectModal from './components/CreateProjectModal';
import CreateGigModal from './components/CreateGigModal';
import GigDetails from './components/GigDetails';
import EditProfile from './components/EditProfile';
import ChatWidget from './components/ChatWidget'; // Import Chat Widget
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import { Project, WalletState, TokenType, Gig, ViewType, FreelancerProfile as FreelancerProfileType, ChatContact } from './types';
import {
  createProjectService,
  createGigService,
  fetchProjects,
  fetchGigs,
  fetchLeaderboard,
  fetchFreelancerByAddress,
  fundProject,
  releasePayment,
  submitMilestone,
  generateId,
  connectX,
  formatUSD
} from './services/StacksService';
import { PlusCircle, ShieldCheck, Zap, Layers, ArrowRight, Lock, Check, TrendingUp, Users, Hexagon, Twitter, Github, Globe, Loader2, Code, Palette, Film, Cpu, Search, Filter, Activity, Trophy, Briefcase, Wallet, Settings, Star } from 'lucide-react';

// --- Custom Animations Style Block ---
const AnimationStyles = () => (
  <style>{`
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-15px); }
      100% { transform: translateY(0px); }
    }
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 20px rgba(249,115,22,0.2); border-color: rgba(249,115,22,0.5); }
      50% { box-shadow: 0 0 40px rgba(249,115,22,0.5); border-color: rgba(249,115,22,0.8); }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes grid-move {
      0% { background-position: 0 0; }
      100% { background-position: 50px 50px; }
    }
    .animate-float { animation: float 6s ease-in-out infinite; }
    .animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-pulse-glow { animation: pulse-glow 3s infinite; }
    .bg-grid-moving { animation: grid-move 10s linear infinite; }
    .glass-panel {
      background: rgba(2, 6, 23, 0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .text-glow { text-shadow: 0 0 20px rgba(249,115,22,0.5); }
    .delay-100 { animation-delay: 100ms; opacity: 0; }
    .delay-200 { animation-delay: 200ms; opacity: 0; }
    .delay-300 { animation-delay: 300ms; opacity: 0; }
    .delay-500 { animation-delay: 500ms; opacity: 0; }

    /* Custom Scrollbar Styling */
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(71, 85, 105, 0.5) transparent;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(71, 85, 105, 0.5);
      border-radius: 20px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: rgba(249, 115, 22, 0.6);
    }
  `}</style>
);

const App = () => {
  const { isSignedIn, userAddress, connect, disconnect } = useWallet();

  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    isXConnected: false,
    xUsername: undefined,
    balanceSTX: 0,
    balanceSBTC: 0
  });

  const [view, setView] = useState<ViewType>('home');
  const [projects, setProjects] = useState<Project[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<FreelancerProfileType[]>([]);
  const [filteredGigs, setFilteredGigs] = useState<Gig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentBlock, setCurrentBlock] = useState(89212);
  const [freelancerTab, setFreelancerTab] = useState<'active' | 'leaderboard'>('active');
  const [selectedProfile, setSelectedProfile] = useState<FreelancerProfileType | null>(null);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<FreelancerProfileType | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGigModalOpen, setIsGigModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Chat State
  const [activeChatContact, setActiveChatContact] = useState<ChatContact | null>(null);

  // --- Initialization ---

  // Sync Wallet Provider state with App local state
  // Sync Wallet Provider state with App local state
  useEffect(() => {
    if (isSignedIn && userAddress) {
      setWallet(prev => ({
        ...prev,
        isConnected: true,
        address: userAddress,
        // TODO: Fetch real balance
        balanceSTX: 0,
        balanceSBTC: 0
      }));

      // Fetch profile
      fetchFreelancerByAddress(userAddress, 'You').then(profile => {
        setCurrentUserProfile(profile);
      });

      // Fetch real balance
      const networkUrl = 'https://api.testnet.hiro.so';
      fetch(`${networkUrl}/extended/v1/address/${userAddress}/balances`)
        .then(res => res.json())
        .then(data => {
          const stx = parseInt(data.stx.balance) / 1000000;
          setWallet(prev => ({ ...prev, balanceSTX: stx }));
        })
        .catch(e => console.error('Error fetching balance:', e));

    } else {
      setWallet(prev => ({
        ...prev,
        isConnected: false,
        address: null,
        balanceSTX: 0,
        balanceSBTC: 0
      }));
      setCurrentUserProfile(null);
    }
  }, [isSignedIn, userAddress]);

  useEffect(() => {
    const init = async () => {
      // Wallet session checked by provider now

      const [storedProjects, fetchedGigs, fetchedLeaderboard] = await Promise.all([
        fetchProjects(),
        fetchGigs(),
        fetchLeaderboard()
      ]);
      setProjects(storedProjects);
      setGigs(fetchedGigs);
      setFilteredGigs(fetchedGigs);
      setLeaderboardData(fetchedLeaderboard);
      setIsLoading(false);
    };
    init();

    // Simulate block height updates
    const interval = setInterval(() => {
      setCurrentBlock(prev => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- Filter Logic ---

  useEffect(() => {
    let result = gigs;
    if (selectedCategory !== 'All') {
      result = result.filter(g => g.category === selectedCategory);
    }
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(g =>
        g.title.toLowerCase().includes(lowerTerm) ||
        g.description.toLowerCase().includes(lowerTerm) ||
        g.tags.some(t => t.toLowerCase().includes(lowerTerm))
      );
    }
    setFilteredGigs(result);
  }, [searchTerm, selectedCategory, gigs]);

  // --- Actions ---

  const handleConnect = async () => {
    try {
      setIsProcessing(true);
      await connect(); // This triggers the wallet popup
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConnectX = async () => {
    try {
      setIsProcessing(true);
      const username = await connectX();
      setWallet(prev => ({
        ...prev,
        isXConnected: true,
        xUsername: username
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setView('home');
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    if (term && view !== 'browse') {
      setView('browse');
    }
  };

  const handleHireGig = (gig: Gig) => {
    // If not connected, connect first then open modal
    const openModal = () => openHireModal(gig);

    if (!wallet.isConnected) {
      handleConnect().then(() => {
        // We need to check if connection was successful, but for mock we assume yes
        openModal();
      });
    } else {
      openModal();
    }
  };

  const openHireModal = (gig: Gig) => {
    setModalInitialData({
      title: `Contract: ${gig.title}`,
      description: `Scope based on gig: ${gig.title}. \n\n${gig.description}`,
      category: gig.category,
      totalBudget: gig.price,
      tokenType: 'STX',
      freelancerAddress: gig.freelancerAddress
    });
    setIsModalOpen(true);
  };

  const handleViewProfile = async (addressOrProfile: string | FreelancerProfileType, name?: string) => {
    setIsProcessing(true);
    let profile: FreelancerProfileType;

    if (typeof addressOrProfile === 'string') {
      profile = await fetchFreelancerByAddress(addressOrProfile, name);
    } else {
      profile = addressOrProfile;
    }

    setSelectedProfile(profile);
    setIsProcessing(false);
    setView('profile');
  };

  const handleViewGigDetails = (gig: Gig) => {
    setSelectedGig(gig);
    setView('gig-details');
  };

  const handleSaveProfile = async (updatedProfile: FreelancerProfileType) => {
    setIsProcessing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCurrentUserProfile(updatedProfile);
    // Also update leaderboard data if it exists there
    setLeaderboardData(prev => prev.map(p => p.address === updatedProfile.address ? updatedProfile : p));
    setIsProcessing(false);
    setView('freelancer');
  };

  const handleCreateGig = async (data: any) => {
    if (!wallet.address) return;
    setIsProcessing(true);

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
      isVerified: currentUserProfile?.isIdVerified
    };

    await createGigService(newGig);
    const updatedGigs = await fetchGigs();
    setGigs(updatedGigs);

    setIsProcessing(false);
    setIsGigModalOpen(false);
  };

  const handleCreateProject = async (data: any) => {
    if (!wallet.address) return;
    setIsProcessing(true);

    // Fallback milestones if not provided (though modal should provide them)
    const milestoneAmount = data.totalBudget / 4;
    const defaultMilestones = [
      { id: 1, title: 'Milestone 1', amount: milestoneAmount, status: 'locked' },
      { id: 2, title: 'Milestone 2', amount: milestoneAmount, status: 'locked' },
      { id: 3, title: 'Milestone 3', amount: milestoneAmount, status: 'locked' },
      { id: 4, title: 'Milestone 4', amount: milestoneAmount, status: 'locked' },
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
      attachments: data.attachments || [] // Pass attachments
    };

    await createProjectService(newProject);
    const updatedProjects = await fetchProjects();
    setProjects(updatedProjects);
    setIsProcessing(false);
    setIsModalOpen(false);
    setModalInitialData(null); // Reset
    if (view === 'browse') setView('client'); // Redirect to client dashboard to see new project
  };

  const handleProjectAction = async (projectId: string, actionType: string, payload?: any) => {
    setIsProcessing(true);
    try {
      if (actionType === 'fund') {
        const project = projects.find(p => p.id === projectId);
        if (project) {
          await fundProject(projectId, project.totalBudget, project.tokenType);
        }
      }
      else if (actionType === 'submit_milestone') {
        const { milestoneId, link } = payload;
        await submitMilestone(projectId, milestoneId, link);
      }
      else if (actionType === 'approve_milestone') {
        const { milestoneId } = payload;
        await releasePayment(projectId, milestoneId);
      }
      const updatedProjects = await fetchProjects();
      setProjects(updatedProjects);
    } catch (error) {
      console.error("Action failed", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Chat Trigger from components
  const handleContactFreelancer = (profileOrAddress: FreelancerProfileType | string, name?: string) => {
    if (!wallet.isConnected) {
      handleConnect();
      return;
    }

    let contact: ChatContact;
    if (typeof profileOrAddress === 'string') {
      contact = {
        id: profileOrAddress,
        name: name || 'Freelancer',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileOrAddress}`,
        lastMessage: 'Start a conversation...',
        unread: 0,
        online: true,
        role: 'Freelancer'
      };
    } else {
      contact = {
        id: profileOrAddress.address,
        name: profileOrAddress.name,
        avatar: profileOrAddress.avatar,
        lastMessage: 'Start a conversation...',
        unread: 0,
        online: true,
        role: 'Freelancer'
      };
    }
    setActiveChatContact(contact);
  };

  // --- Views ---

  // Admin Views Handling
  if (view === 'admin-login') {
    return <AdminLogin onLogin={() => setView('admin-dashboard')} onBack={() => setView('home')} />;
  }

  if (view === 'admin-dashboard') {
    return <AdminPanel onLogout={() => setView('home')} />;
  }

  const renderHome = () => (
    <div className="relative font-sans text-slate-200">
      {/* Background with Moving Grid */}
      <div className="fixed inset-0 z-0 bg-[#020617]">
        <div className="absolute inset-0 bg-grid-moving opacity-10" style={{
          backgroundImage: 'linear-gradient(rgba(249, 115, 22, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(249, 115, 22, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 relative z-10">

        {/* --- HERO SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-40">
          <div className="space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-950/20 text-orange-400 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(249,115,22,0.3)] backdrop-blur-md">
              <ShieldCheck className="w-3 h-3" /> Blockchain-Secured Protocol
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl">
              SECURE<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-300 to-white text-glow">FREELANCE</span><br />
              LAYER
            </h1>

            <p className="text-lg text-slate-400 max-w-lg leading-relaxed border-l-2 border-orange-500/30 pl-6">
              Trustless escrow powered by Stacks smart contracts. Lock funds, complete work, get paid. <span className="text-white font-bold">100% On-Chain.</span>
            </p>

            <div className="flex gap-10 pt-4">
              <div className="group">
                <span className="block text-4xl font-black text-white group-hover:text-orange-500 transition-colors">100%</span>
                <span className="text-xs text-slate-500 uppercase tracking-[0.2em] font-bold">Secure</span>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setView('browse')}
                className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-sm rounded hover:bg-orange-500 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transform hover:scale-105"
              >
                Browse Gigs
              </button>
            </div>
          </div>

          <div className="relative perspective-1000 animate-slide-up delay-200">
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/20 to-blue-600/20 rounded-3xl blur-2xl transform rotate-3 scale-105 animate-pulse"></div>
            <div className="relative glass-panel rounded-3xl p-8 animate-float shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t border-l border-white/10">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/20">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Smart Contract Escrow</h3>
                    <p className="text-orange-400/80 text-xs font-mono flex items-center gap-2">
                      Status: <span className="text-green-400 animate-pulse">ACTIVE</span> • Block #{currentBlock}
                    </p>
                  </div>
                </div>
                <Hexagon className="w-8 h-8 text-slate-700 opacity-50 animate-spin-slow" />
              </div>

              <div className="space-y-4 relative">
                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-800 z-0"></div>
                <div className="relative z-10 flex items-center gap-4 p-4 bg-slate-900/40 rounded-xl border border-white/5">
                  <div className="w-12 h-12 rounded-full bg-[#0b0f19] flex items-center justify-center border-2 border-slate-700 shadow-lg">
                    <Check className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm tracking-wide">Client Locks Funds</div>
                    <div className="text-slate-500 text-xs font-mono">500 STX Secured in Vault</div>
                  </div>
                </div>
                <div className="relative z-10 flex items-center gap-4 p-4 bg-gradient-to-r from-orange-900/20 to-transparent rounded-xl border border-orange-500/30">
                  <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center border-2 border-white/20 animate-pulse">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm tracking-wide">Automatic Release</div>
                    <div className="text-orange-300 text-xs font-mono">Funds transferred to wallet</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- MARKETPLACE CATEGORIES --- */}
        <div className="mb-40 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="text-center mb-16 animate-slide-up delay-300">
            <div className="inline-block px-4 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
              Decentralized Talent
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Explore the <span className="text-orange-500">Ecosystem</span></h2>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto">Find elite developers and creators verified on the Stacks blockchain</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up delay-500">
            {[
              { icon: <Palette />, title: "Creative & Design", specialties: "NFTs, UI/UX" },
              { icon: <Code />, title: "Development", specialties: "Clarity, React, Rust" },
              { icon: <Film />, title: "Media & Content", specialties: "Video, Technical Writing" },
              { icon: <Users />, title: "Community", specialties: "Moderation, Growth" }
            ].map((cat, idx) => (
              <div key={idx} className="group relative bg-[#0b0f19] p-6 rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(249,115,22,0.3)]">
                {/* Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-600/0 via-orange-600/0 to-orange-600/0 group-hover:from-orange-600/10 group-hover:to-purple-600/10 transition-all duration-500"></div>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>

                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 mb-6 border border-slate-800 group-hover:border-orange-500/50 group-hover:text-orange-500 transition-colors relative z-10">
                  {cat.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2 relative z-10">{cat.title}</h3>
                <p className="text-slate-500 text-xs mb-8 uppercase tracking-wide relative z-10">{cat.specialties}</p>

                <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/5 relative z-10">
                  <span className="text-xs text-slate-600 font-mono group-hover:text-slate-400 transition-colors">0 active gigs</span>
                  <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- HOW IT WORKS --- */}
        <div className="mb-40">
          <div className="flex flex-col items-center mb-16 animate-slide-up">
            <h2 className="text-4xl font-black text-center text-white mb-4 tracking-tighter">Protocol Mechanics</h2>
            <div className="h-1 w-20 bg-orange-500 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-orange-500/0 via-orange-500/30 to-orange-500/0"></div>

            {[
              { step: "01", title: "Connect", desc: "Link your Xverse or Leather wallet to the Stacks Mainnet." },
              { step: "02", title: "Lock", desc: "Client deposits STX into the audited smart contract escrow." },
              { step: "03", title: "Settlement", desc: "Smart contract validates deliverables and releases payment." }
            ].map((item, idx) => (
              <div key={idx} className="relative bg-[#05080f] p-8 rounded-2xl border border-white/5 text-center hover:bg-[#0b0f19] transition-all duration-500 group hover:border-orange-500/30">
                <div className="w-24 h-24 mx-auto bg-[#020617] rounded-full flex items-center justify-center border-4 border-[#0b0f19] relative z-10 mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:border-orange-500/30">
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500 group-hover:from-orange-500 group-hover:to-amber-500">{item.step}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 uppercase tracking-tight">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* --- GET STARTED --- */}
        <div className="mb-32">
          <div className="glass-panel p-1 rounded-3xl animate-slide-up">
            <div className="bg-[#020617]/80 rounded-[22px] py-16 px-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50"></div>

              <h2 className="text-4xl font-black text-center text-white mb-12 relative z-10">Initialize Session</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto relative z-10">
                <button
                  onClick={() => { setView('client'); window.scrollTo(0, 0); }}
                  className="group relative overflow-hidden bg-[#0b0f19] p-8 rounded-2xl border border-white/10 hover:border-orange-500 transition-all duration-300 text-left"
                >
                  <div className="absolute right-0 top-0 p-32 bg-orange-600/5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:bg-orange-600/10 transition-colors"></div>
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-white mb-6 group-hover:bg-orange-600 transition-colors">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">Client Access</h3>
                  <p className="text-slate-400 text-sm mb-6">Deploy contracts & manage talent</p>
                  <div className="flex items-center text-orange-500 text-sm font-bold uppercase tracking-wider">
                    Launch Dashboard <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                  </div>
                </button>

                <div
                  className="group relative overflow-hidden bg-[#0b0f19] p-8 rounded-2xl border border-white/10 hover:border-blue-500 transition-all duration-300 text-left flex flex-col justify-between"
                >
                  <div className="absolute right-0 top-0 p-32 bg-blue-600/5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:bg-blue-600/10 transition-colors"></div>
                  <div>
                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-white mb-6 group-hover:bg-blue-600 transition-colors">
                      <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-500 transition-colors">Freelancer Access</h3>
                    <p className="text-slate-400 text-sm mb-6">Accept gigs & withdraw sBTC</p>
                  </div>

                  <div className="flex flex-col gap-3 mt-auto relative z-10">
                    <button
                      onClick={() => { setView('freelancer'); window.scrollTo(0, 0); }}
                      className="flex items-center justify-center w-full py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-blue-500 transition-colors"
                    >
                      Launch Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="bg-[#020617] border-t border-white/5 pt-20 pb-10 relative overflow-hidden">
        {/* Footer Glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-600/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <Hexagon className="h-8 w-8 text-orange-600 fill-orange-600/20" />
                <span className="text-2xl font-black text-white tracking-tighter">
                  STX<span className="text-orange-600">WORX</span>
                </span>
              </div>
              <div className="text-[10px] font-bold text-slate-500 mb-4 tracking-widest uppercase">Power by $STX & $BTC</div>
              <p className="text-slate-500 text-sm leading-relaxed">
                The decentralized labor layer for the Bitcoin economy.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-6 border-b border-orange-500/30 inline-block pb-1">Platform</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><button onClick={() => setView('home')} className="hover:text-orange-500 transition-colors">Home</button></li>
                <li><button onClick={() => setView('browse')} className="hover:text-orange-500 transition-colors">Browse Projects</button></li>
                <li><button onClick={() => { setView('client'); window.scrollTo(0, 0); }} className="hover:text-orange-500 transition-colors">Client Dashboard</button></li>
                <li><button onClick={() => { setView('freelancer'); window.scrollTo(0, 0); }} className="hover:text-orange-500 transition-colors">Freelancer Dashboard</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-6 border-b border-orange-500/30 inline-block pb-1">Resources</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-orange-500 transition-colors">Stacks Docs</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Get Wallet</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Security</a></li>
                <li><button onClick={() => setView('admin-login')} className="hover:text-orange-500 transition-colors">Admin Login</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-6 border-b border-orange-500/30 inline-block pb-1">Connect</h4>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-lg bg-[#0b0f19] flex items-center justify-center text-slate-400 hover:text-white hover:bg-orange-600 transition-all border border-white/10">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-[#0b0f19] flex items-center justify-center text-slate-400 hover:text-white hover:bg-orange-600 transition-all border border-white/10">
                  <Github className="w-4 h-4" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-[#0b0f19] flex items-center justify-center text-slate-400 hover:text-white hover:bg-orange-600 transition-all border border-white/10">
                  <Globe className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-slate-600 text-xs font-mono">© 2026 STX Freelance Hub. All rights reserved.</span>
            <div className="flex gap-8 text-slate-600 text-xs font-bold uppercase tracking-wider">
              <a href="#" className="hover:text-orange-500 transition-colors">Privacy</a>
              <a href="#" className="hover:text-orange-500 transition-colors">Terms</a>
              <a href="#" className="hover:text-orange-500 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-orange-500/30">
      <AnimationStyles />

      <Navbar
        wallet={wallet}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        currentView={view}
        onNavigate={(v) => { setView(v); window.scrollTo(0, 0); }}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />

      <main className="min-h-[calc(100vh-300px)]">
        {view === 'home' && renderHome()}

        {view === 'browse' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight">Browse Gigs</h2>
                <p className="text-slate-400 text-sm mt-1">Found {filteredGigs.length} results</p>
              </div>
              <div className="flex items-center gap-4 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                <div className="flex bg-[#0b0f19] p-1 rounded-lg border border-slate-800">
                  {['All', 'Smart Contracts', 'Web Development', 'Design', 'Auditing', 'Writing'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredGigs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredGigs.map(gig => (
                  <GigCard
                    key={gig.id}
                    gig={gig}
                    onHire={handleHireGig}
                    onViewProfile={handleViewProfile}
                    onViewDetails={handleViewGigDetails}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Search className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-bold">No gigs found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}

        {view === 'client' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Client Dashboard</h1>
                <p className="text-slate-400 text-sm mt-1">Manage your active contracts and escrow.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-orange-900/20 flex items-center gap-2 transition-all hover:scale-105"
              >
                <PlusCircle className="w-5 h-5" /> New Contract
              </button>
            </div>

            <div className="space-y-6">
              {projects.length > 0 ? (
                projects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    role="client"
                    onAction={handleProjectAction}
                    isProcessing={isProcessing}
                  />
                ))
              ) : (
                <div className="text-center py-20 bg-[#0b0f19] rounded-2xl border border-dashed border-slate-800">
                  <Layers className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Active Contracts</h3>
                  <p className="text-slate-400 max-w-md mx-auto mb-6">Create a new milestone-based escrow contract to start working with freelancers securely.</p>
                  <button onClick={() => setIsModalOpen(true)} className="text-orange-500 font-bold hover:underline uppercase tracking-wide text-xs">Create your first contract</button>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'freelancer' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Freelancer Portal</h1>
                <div className="flex items-center gap-4 mt-2">
                  {currentUserProfile && (
                    <div className="flex items-center gap-2">
                      <img src={currentUserProfile.avatar} className="w-6 h-6 rounded-full border border-slate-700" />
                      <span className="text-slate-300 font-bold text-sm">{currentUserProfile.name}</span>
                    </div>
                  )}
                  <div className="h-4 w-px bg-slate-700"></div>
                  <button onClick={() => { setView('edit-profile'); }} className="text-xs font-bold text-orange-500 hover:text-white flex items-center gap-1 transition-colors">
                    <Settings className="w-3 h-3" /> Edit Profile
                  </button>
                </div>
              </div>
              <button
                onClick={() => setIsGigModalOpen(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all hover:scale-105"
              >
                <Briefcase className="w-5 h-5" /> Post New Gig
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-slate-800 mb-8">
              <button
                onClick={() => setFreelancerTab('active')}
                className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${freelancerTab === 'active' ? 'text-white border-orange-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
              >
                Active Jobs
              </button>
              <button
                onClick={() => setFreelancerTab('leaderboard')}
                className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${freelancerTab === 'leaderboard' ? 'text-white border-orange-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
              >
                Leaderboard
              </button>
            </div>

            {freelancerTab === 'active' ? (
              <div className="space-y-6">
                {projects.filter(p => p.freelancerAddress === wallet.address).length > 0 ? (
                  projects.filter(p => p.freelancerAddress === wallet.address).map(project => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      role="freelancer"
                      onAction={handleProjectAction}
                      isProcessing={isProcessing}
                    />
                  ))
                ) : (
                  <div className="text-center py-20 bg-[#0b0f19] rounded-2xl border border-dashed border-slate-800">
                    <Briefcase className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Active Jobs</h3>
                    <p className="text-slate-400 max-w-md mx-auto mb-6">You haven't been hired for any projects yet. Improve your profile or post more gigs.</p>
                    <button onClick={() => setIsGigModalOpen(true)} className="text-blue-500 font-bold hover:underline uppercase tracking-wide text-xs">Post a Service Gig</button>
                  </div>
                )}
              </div>
            ) : (
              <Leaderboard data={leaderboardData} currentAddress={wallet.address} onViewProfile={handleViewProfile} />
            )}
          </div>
        )}

        {view === 'profile' && selectedProfile && (
          <FreelancerProfile
            profile={selectedProfile}
            gigs={gigs}
            onBack={() => setView('browse')}
            onHire={handleHireGig}
            onContact={(p) => handleContactFreelancer(p)}
          />
        )}

        {view === 'gig-details' && selectedGig && (
          <GigDetails
            gig={selectedGig}
            onBack={() => setView('browse')}
            onHire={handleHireGig}
            onViewProfile={handleViewProfile}
            onContact={(addr, name) => handleContactFreelancer(addr, name)}
          />
        )}

        {view === 'edit-profile' && currentUserProfile && (
          <EditProfile
            profile={currentUserProfile}
            onSave={handleSaveProfile}
            onCancel={() => setView('freelancer')}
            isSaving={isProcessing}
            onConnectX={handleConnectX}
            isXConnected={wallet.isXConnected}
            xUsername={wallet.xUsername}
          />
        )}
      </main>

      {/* Global Modals */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
        initialData={modalInitialData}
      />

      <CreateGigModal
        isOpen={isGigModalOpen}
        onClose={() => setIsGigModalOpen(false)}
        onSubmit={handleCreateGig}
      />

      <ChatWidget
        externalContact={activeChatContact}
        onCloseExternal={() => setActiveChatContact(null)}
      />
    </div>
  );
};

export default App;