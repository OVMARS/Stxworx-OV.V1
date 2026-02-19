import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, Mail, ExternalLink, ShieldCheck, Award, CheckCircle2,
  MapPin, Calendar, Star, Coins, CheckCircle, Briefcase, MessageSquare,
  Code, FileText, Shield, TrendingUp, BarChart3, Clock, Lock, AlertTriangle,
  User, DollarSign, Activity, Layers, ChevronRight,
} from 'lucide-react';
import { formatUSD, tokenToUsd } from '../services/StacksService';
import type { BackendUser, BackendReview } from '../lib/api';
import type { Project } from '../types';

/* ═══════════════════════════════════════════════════════ */

type ProfileTab = 'overview' | 'portfolio' | 'escrow' | 'reviews' | 'contracts' | 'financials';

interface UserProfileViewProps {
  user: BackendUser;
  projects: Project[];
  reviews: BackendReview[];
  leaderboardStats?: {
    jobsCompleted: number;
    avgRating: number;
    reviewCount: number;
    rank: number;
  };
  onBack: () => void;
  onContact?: (address: string) => void;
  isOwnProfile?: boolean;
}

/* ═══════════════════════════════════════════════════════ */

const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  projects,
  reviews,
  leaderboardStats,
  onBack,
  onContact,
  isOwnProfile = false,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

  const isFreelancer = user.role === 'freelancer';
  const isClient = user.role === 'client';
  const displayName = user.username || user.stxAddress.slice(0, 8);
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.stxAddress}`;
  const totalEarned = parseFloat(user.totalEarned || '0');
  const skills = user.skills || [];
  const portfolio = user.portfolio || [];
  const hourlyRate = user.hourlyRate ? parseFloat(user.hourlyRate) : null;

  // Derived stats
  const jobsCompleted = leaderboardStats?.jobsCompleted ?? 0;
  const avgRating = leaderboardStats?.avgRating ?? 0;
  const reviewCount = leaderboardStats?.reviewCount ?? reviews.length;
  const rank = leaderboardStats?.rank ?? 0;

  // Project breakdowns
  const completedProjects = useMemo(() => projects.filter(p => p.status === 'completed'), [projects]);
  const activeProjects = useMemo(() => projects.filter(p => p.status === 'active'), [projects]);
  const openProjects = useMemo(() => projects.filter(p => p.status === 'open'), [projects]);
  const disputedProjects = useMemo(() => projects.filter(p => p.status === 'disputed'), [projects]);
  const refundedProjects = useMemo(() => projects.filter(p => p.status === 'refunded'), [projects]);
  const cancelledProjects = useMemo(() => projects.filter(p => p.status === 'cancelled'), [projects]);

  const totalProjectValue = useMemo(
    () => projects.reduce((sum, p) => sum + tokenToUsd(p.totalBudget, p.tokenType), 0),
    [projects]
  );

  // Financials
  const stxProjects = useMemo(() => projects.filter(p => p.tokenType === 'STX'), [projects]);
  const sbtcProjects = useMemo(() => projects.filter(p => p.tokenType === 'sBTC'), [projects]);
  const completedValue = useMemo(
    () => completedProjects.reduce((sum, p) => sum + tokenToUsd(p.totalBudget, p.tokenType), 0),
    [completedProjects]
  );
  const activeValue = useMemo(
    () => activeProjects.reduce((sum, p) => sum + tokenToUsd(p.totalBudget, p.tokenType), 0),
    [activeProjects]
  );

  const TABS: { key: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <User className="w-3.5 h-3.5" /> },
    { key: 'portfolio', label: isFreelancer ? 'Portfolio & Skills' : 'Projects', icon: isFreelancer ? <Code className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" /> },
    { key: 'escrow', label: 'Escrow History', icon: <Shield className="w-3.5 h-3.5" /> },
    { key: 'reviews', label: 'Reviews', icon: <Star className="w-3.5 h-3.5" /> },
    { key: 'contracts', label: 'Active Contracts', icon: <Activity className="w-3.5 h-3.5" /> },
    { key: 'financials', label: isFreelancer ? 'Earnings' : 'Spending', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  ];

  /* ─── Status color helper ─── */
  const statusColor = (status?: string) => {
    switch (status) {
      case 'open': return 'bg-blue-950/30 text-blue-400 border-blue-900/50';
      case 'active': return 'bg-orange-950/30 text-orange-400 border-orange-900/50';
      case 'completed': return 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50';
      case 'disputed': return 'bg-red-950/30 text-red-400 border-red-900/50';
      case 'refunded': return 'bg-amber-950/30 text-amber-400 border-amber-900/50';
      case 'cancelled': return 'bg-slate-800 text-slate-400 border-slate-700';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  /* ─── Render milestone progress bar ─── */
  const MilestoneBar: React.FC<{ project: Project }> = ({ project: p }) => {
    const approved = p.milestones.filter(m => m.status === 'approved').length;
    const pct = p.milestones.length > 0 ? (approved / p.milestones.length) * 100 : 0;
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[10px] font-mono text-slate-500 shrink-0">{approved}/{p.milestones.length}</span>
      </div>
    );
  };

  /* ─── Project row component ─── */
  const ProjectRow: React.FC<{ project: Project }> = ({ project: p }) => {
    const usd = tokenToUsd(p.totalBudget, p.tokenType);
    return (
      <div className="bg-[#05080f] border border-slate-800/50 rounded-lg p-4 hover:border-slate-700 transition-colors group">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate group-hover:text-orange-400 transition-colors">{p.title}</h4>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{p.description}</p>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border shrink-0 ${statusColor(p.status)}`}>
            {p.status}
          </span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-orange-500" />
              <span className="font-bold text-white">{formatUSD(usd)}</span>
            </span>
            <span className="flex items-center gap-1 font-mono">
              {p.totalBudget.toFixed(2)} {p.tokenType}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(p.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        {p.status === 'active' && (
          <div className="mt-3"><MilestoneBar project={p} /></div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ─── Back Button ─── */}
      <button
        onClick={onBack}
        className="flex items-center text-slate-400 hover:text-white mb-4 sm:mb-6 transition-colors text-xs sm:text-sm font-bold uppercase tracking-wider group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back
      </button>

      {/* ═══════════════════════ HEADER CARD ═══════════════════════ */}
      <div className="bg-[#0b0f19] rounded-xl sm:rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative mb-6 sm:mb-8">
        {/* Cover */}
        <div className="h-28 sm:h-36 md:h-48 relative overflow-hidden">
          <div className={`absolute inset-0 ${isFreelancer
            ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900'
            : 'bg-gradient-to-r from-slate-900 via-[#0d1a2d] to-slate-900'
          }`} />
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          <div className={`absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 rounded-full blur-[80px] ${
            isFreelancer ? 'bg-orange-600/10' : 'bg-blue-600/10'
          }`} />
          <div className={`absolute bottom-0 left-0 w-24 h-24 sm:w-36 sm:h-36 rounded-full blur-[60px] ${
            isFreelancer ? 'bg-amber-600/5' : 'bg-cyan-600/5'
          }`} />

          {/* Role badge on cover */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
            <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border backdrop-blur-sm ${
              isFreelancer
                ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
            }`}>
              {isFreelancer ? 'Freelancer' : 'Client'}
            </span>
          </div>
        </div>

        <div className="px-4 sm:px-6 md:px-8 pb-5 sm:pb-6 md:pb-8 relative">
          <div className="flex flex-col md:flex-row justify-between items-start">
            {/* Avatar & Info */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 -mt-10 sm:-mt-12 md:-mt-16 relative z-10 w-full md:w-auto">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-4 border-[#0b0f19] bg-slate-800 overflow-hidden shadow-xl relative shrink-0">
                <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
                <div className={`absolute bottom-1 right-1 p-1.5 rounded-full border-2 border-[#0b0f19] ${
                  isFreelancer ? 'bg-orange-500' : 'bg-blue-500'
                }`}>
                  {isFreelancer ? <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-white" /> : <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
                </div>
              </div>

              <div className="pt-2 sm:pt-4 md:pt-16">
                <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white">{displayName}</h1>
                  {rank > 0 && rank <= 10 && (
                    <span className="flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      #{rank} <Award className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 font-mono mb-3">
                  <span className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-xs">
                    <MapPin className="w-3 h-3" /> {user.stxAddress.slice(0, 6)}...{user.stxAddress.slice(-4)}
                  </span>
                  {user.createdAt && (
                    <span className="flex items-center gap-1 text-xs">
                      <Calendar className="w-3 h-3" /> Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                  {isFreelancer && user.specialty && (
                    <span className="flex items-center gap-1 text-xs">
                      <Code className="w-3 h-3" /> {user.specialty}
                    </span>
                  )}
                </div>

                {/* Quick stats row */}
                <div className="flex flex-wrap gap-3">
                  {isFreelancer && (
                    <>
                      <div className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 bg-orange-500/5 rounded border border-orange-500/10 text-orange-400">
                        <Coins className="w-3 h-3" /> {formatUSD(totalEarned)} earned
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 bg-blue-500/5 rounded border border-blue-500/10 text-blue-400">
                        <CheckCircle className="w-3 h-3" /> {jobsCompleted} jobs
                      </div>
                      {avgRating > 0 && (
                        <div className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 bg-green-500/5 rounded border border-green-500/10 text-green-400">
                          <Star className="w-3 h-3 fill-green-400/20" /> {avgRating.toFixed(1)}
                        </div>
                      )}
                    </>
                  )}
                  {isClient && (
                    <>
                      <div className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 bg-blue-500/5 rounded border border-blue-500/10 text-blue-400">
                        <Layers className="w-3 h-3" /> {projects.length} project{projects.length !== 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 bg-orange-500/5 rounded border border-orange-500/10 text-orange-400">
                        <Coins className="w-3 h-3" /> {formatUSD(totalProjectValue)} total
                      </div>
                      {completedProjects.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 bg-green-500/5 rounded border border-green-500/10 text-green-400">
                          <CheckCircle className="w-3 h-3" /> {completedProjects.length} completed
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            {!isOwnProfile && (
              <div className="mt-4 md:mt-6 flex gap-2 sm:gap-3 w-full md:w-auto">
                {onContact && (
                  <button
                    onClick={() => onContact(user.stxAddress)}
                    className="flex-1 md:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded border border-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" /> Message
                  </button>
                )}
                <a
                  href={`https://explorer.hiro.so/address/${user.stxAddress}?chain=testnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded border border-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" /> Explorer
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════ TAB NAVIGATION ═══════════════════════ */}
      <div className="mb-6 sm:mb-8 overflow-hidden">
        <div className="flex bg-[#0b0f19] p-1 rounded-lg border border-slate-800 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? isFreelancer
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/30'
                    : 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════ TAB CONTENT ═══════════════════════ */}
      <div className="animate-in fade-in duration-300">

        {/* ────────── OVERVIEW TAB ────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {isFreelancer ? (
                <>
                  <StatCard
                    icon={<Coins className="w-6 h-6 text-orange-500" />}
                    bg="bg-orange-500/10"
                    value={formatUSD(totalEarned)}
                    label="Total Earned"
                  />
                  <StatCard
                    icon={<CheckCircle className="w-6 h-6 text-blue-500" />}
                    bg="bg-blue-500/10"
                    value={String(jobsCompleted)}
                    label="Jobs Completed"
                  />
                  <StatCard
                    icon={<Star className="w-6 h-6 text-green-500 fill-green-500/20" />}
                    bg="bg-green-500/10"
                    value={avgRating > 0 ? avgRating.toFixed(1) : '—'}
                    label={`Rating (${reviewCount})`}
                  />
                  <StatCard
                    icon={<Activity className="w-6 h-6 text-purple-500" />}
                    bg="bg-purple-500/10"
                    value={String(activeProjects.length)}
                    label="Active Contracts"
                  />
                </>
              ) : (
                <>
                  <StatCard
                    icon={<Layers className="w-6 h-6 text-blue-500" />}
                    bg="bg-blue-500/10"
                    value={String(projects.length)}
                    label="Projects Posted"
                  />
                  <StatCard
                    icon={<Coins className="w-6 h-6 text-orange-500" />}
                    bg="bg-orange-500/10"
                    value={formatUSD(totalProjectValue)}
                    label="Total Budget"
                  />
                  <StatCard
                    icon={<CheckCircle className="w-6 h-6 text-green-500" />}
                    bg="bg-green-500/10"
                    value={String(completedProjects.length)}
                    label="Completed"
                  />
                  <StatCard
                    icon={<Activity className="w-6 h-6 text-purple-500" />}
                    bg="bg-purple-500/10"
                    value={String(activeProjects.length)}
                    label="Active Contracts"
                  />
                </>
              )}
            </div>

            {/* About */}
            <div className="bg-[#0b0f19] p-5 sm:p-6 md:p-8 rounded-xl border border-slate-800">
              <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-slate-500" />
                {isFreelancer ? 'About Me' : 'About'}
              </h3>
              <p className="text-slate-400 leading-relaxed">
                {user.about || (isFreelancer
                  ? `This freelancer specializes in ${user.specialty || 'various services'} and is available for hire on STXworx.`
                  : 'This client has not added a bio yet. They are actively posting projects on STXworx.'
                )}
              </p>
            </div>

            {/* Skills / Categories quick preview */}
            {isFreelancer && skills.length > 0 && (
              <div className="bg-[#0b0f19] p-5 sm:p-6 rounded-xl border border-slate-800">
                <h3 className="text-sm font-black text-white uppercase tracking-tight mb-3 flex items-center gap-2">
                  <Code className="w-4 h-4 text-slate-500" /> Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {skill}
                    </span>
                  ))}
                </div>
                {hourlyRate && (
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-orange-500" />
                    <span className="font-bold text-white">{formatUSD(hourlyRate)}</span>
                    <span className="text-slate-500">/ hour</span>
                  </div>
                )}
              </div>
            )}

            {/* Recent activity summary */}
            {projects.length > 0 && (
              <div className="bg-[#0b0f19] p-5 sm:p-6 rounded-xl border border-slate-800">
                <h3 className="text-sm font-black text-white uppercase tracking-tight mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-500" /> Contract Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  <MiniStat label="Open" count={openProjects.length} color="text-blue-400" />
                  <MiniStat label="Active" count={activeProjects.length} color="text-orange-400" />
                  <MiniStat label="Completed" count={completedProjects.length} color="text-emerald-400" />
                  <MiniStat label="Disputed" count={disputedProjects.length} color="text-red-400" />
                  <MiniStat label="Refunded" count={refundedProjects.length} color="text-amber-400" />
                  <MiniStat label="Cancelled" count={cancelledProjects.length} color="text-slate-400" />
                </div>
              </div>
            )}

            {/* Recent reviews preview */}
            {reviews.length > 0 && (
              <div className="bg-[#0b0f19] p-5 sm:p-6 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-500" /> Recent Reviews
                  </h3>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors"
                  >
                    View all <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-3">
                  {reviews.slice(0, 2).map(review => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ────────── PORTFOLIO & SKILLS / PROJECTS TAB ────────── */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6 sm:space-y-8">
            {isFreelancer ? (
              <>
                {/* Skills Section */}
                {skills.length > 0 && (
                  <div className="bg-[#0b0f19] p-5 sm:p-6 md:p-8 rounded-xl border border-slate-800">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                      <Code className="w-5 h-5 text-slate-500" /> Technical Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, i) => (
                        <span key={i} className="px-4 py-2 rounded-lg text-sm font-bold bg-slate-800/80 text-slate-200 border border-slate-700 hover:border-orange-500/50 transition-colors">
                          {skill}
                        </span>
                      ))}
                    </div>
                    {hourlyRate && (
                      <div className="mt-6 p-4 bg-[#05080f] rounded-lg border border-slate-800/50 flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-full">
                          <DollarSign className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <div className="text-lg font-black text-white">{formatUSD(hourlyRate)}<span className="text-sm text-slate-500 font-normal"> / hour</span></div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Hourly Rate</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Portfolio Grid */}
                {portfolio.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                      Recent Deliverables
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {portfolio.map((img, i) => (
                        <div key={i} className="aspect-video rounded-lg overflow-hidden border border-slate-800 group relative">
                          <img src={img} alt="Portfolio" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ExternalLink className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={<FileText className="w-12 h-12" />} text="No portfolio items yet" />
                )}

                {/* Completed work history */}
                {completedProjects.length > 0 && (
                  <div className="bg-[#0b0f19] p-5 sm:p-6 rounded-xl border border-slate-800">
                    <h3 className="text-sm font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" /> Work History ({completedProjects.length})
                    </h3>
                    <div className="space-y-3">
                      {completedProjects.map(p => <ProjectRow key={p.id} project={p} />)}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Client: Projects Posted */
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <MiniStatCard label="Open" count={openProjects.length} color="text-blue-400" bg="bg-blue-500/10" />
                  <MiniStatCard label="Active" count={activeProjects.length} color="text-orange-400" bg="bg-orange-500/10" />
                  <MiniStatCard label="Completed" count={completedProjects.length} color="text-emerald-400" bg="bg-emerald-500/10" />
                </div>

                {projects.length > 0 ? (
                  <div className="space-y-3">
                    {projects.map(p => <ProjectRow key={p.id} project={p} />)}
                  </div>
                ) : (
                  <EmptyState icon={<Layers className="w-12 h-12" />} text="No projects posted yet" />
                )}
              </div>
            )}
          </div>
        )}

        {/* ────────── ESCROW HISTORY TAB ────────── */}
        {activeTab === 'escrow' && (
          <div className="space-y-6">
            <div className="bg-[#0b0f19] p-5 sm:p-6 md:p-8 rounded-xl border border-slate-800">
              <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-slate-500" /> Escrow History
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                {isFreelancer ? 'All escrow-backed contracts this freelancer has participated in.' : 'All escrow-backed contracts posted by this client.'}
              </p>

              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="p-3 bg-[#05080f] rounded-lg border border-slate-800/50 text-center">
                  <div className="text-lg font-black text-emerald-400">{completedProjects.length}</div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Completed</div>
                </div>
                <div className="p-3 bg-[#05080f] rounded-lg border border-slate-800/50 text-center">
                  <div className="text-lg font-black text-orange-400">{activeProjects.length}</div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">In Escrow</div>
                </div>
                <div className="p-3 bg-[#05080f] rounded-lg border border-slate-800/50 text-center">
                  <div className="text-lg font-black text-red-400">{disputedProjects.length}</div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Disputed</div>
                </div>
                <div className="p-3 bg-[#05080f] rounded-lg border border-slate-800/50 text-center">
                  <div className="text-lg font-black text-amber-400">{refundedProjects.length}</div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Refunded</div>
                </div>
              </div>

              {/* Project list */}
              {[...completedProjects, ...refundedProjects, ...cancelledProjects].length > 0 ? (
                <div className="space-y-3">
                  {[...completedProjects, ...refundedProjects, ...cancelledProjects].map(p => (
                    <div key={p.id} className="bg-[#05080f] border border-slate-800/50 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-white truncate">{p.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{p.category}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border shrink-0 ${statusColor(p.status)}`}>
                          {p.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-orange-500" />
                          <span className="font-bold text-white">{formatUSD(tokenToUsd(p.totalBudget, p.tokenType))}</span>
                        </span>
                        <span className="font-mono">{p.totalBudget.toFixed(2)} {p.tokenType}</span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3" /> {p.milestones.length} milestones
                        </span>
                        {p.onChainId && (
                          <a
                            href={`https://explorer.hiro.so/txid/${p.onChainId}?chain=testnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-orange-500 hover:text-orange-400 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" /> On-chain
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<Shield className="w-12 h-12" />} text="No escrow history yet" />
              )}
            </div>
          </div>
        )}

        {/* ────────── REVIEWS TAB ────────── */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Rating summary */}
            <div className="bg-[#0b0f19] p-5 sm:p-6 md:p-8 rounded-xl border border-slate-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-black text-white">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</div>
                  <div className="flex items-center gap-1 justify-center mt-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                    ))}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-bold">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</div>
                </div>
                <div className="flex-1 space-y-1.5 w-full">
                  {[5, 4, 3, 2, 1].map(rating => {
                    const count = reviews.filter(r => Math.round(r.rating) === rating).length;
                    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 w-4 text-right">{rating}</span>
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 w-5">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <h3 className="text-sm font-black text-white uppercase tracking-tight mb-4">
                All Reviews ({reviews.length})
              </h3>
              {reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map(review => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <EmptyState icon={<MessageSquare className="w-12 h-12" />} text="No reviews yet" />
              )}
            </div>
          </div>
        )}

        {/* ────────── ACTIVE CONTRACTS TAB ────────── */}
        {activeTab === 'contracts' && (
          <div className="space-y-6">
            <div className="bg-[#0b0f19] p-5 sm:p-6 md:p-8 rounded-xl border border-slate-800">
              <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 flex items-center gap-2">
                <Activity className="w-5 h-5 text-slate-500" /> Active Contracts
              </h3>
              <p className="text-xs text-slate-500 mb-6">Currently in-progress escrow contracts with milestone tracking.</p>

              {activeProjects.length > 0 ? (
                <div className="space-y-4">
                  {activeProjects.map(p => {
                    const approved = p.milestones.filter(m => m.status === 'approved').length;
                    const usd = tokenToUsd(p.totalBudget, p.tokenType);
                    return (
                      <div key={p.id} className="bg-[#05080f] border border-slate-800/50 rounded-xl p-5 hover:border-orange-500/30 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-base font-bold text-white">{p.title}</h4>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-black text-white">{formatUSD(usd)}</div>
                            <div className="text-[10px] font-mono text-slate-500">{p.totalBudget.toFixed(2)} {p.tokenType}</div>
                          </div>
                        </div>

                        {/* Milestone progress */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Milestone Progress</span>
                            <span className="text-xs font-bold text-orange-400">{approved}/{p.milestones.length} complete</span>
                          </div>
                          <div className="flex gap-1.5">
                            {p.milestones.map((m, i) => (
                              <div
                                key={i}
                                className={`flex-1 h-2 rounded-full transition-colors ${
                                  m.status === 'approved' ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                                  m.status === 'submitted' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                                  m.status === 'refunded' ? 'bg-red-500/50' :
                                  'bg-slate-800'
                                }`}
                                title={`${m.title}: ${m.status}`}
                              />
                            ))}
                          </div>
                          <div className="flex gap-1.5 mt-1">
                            {p.milestones.map((m, i) => (
                              <div key={i} className="flex-1 text-center">
                                <span className="text-[9px] font-mono text-slate-600">M{i + 1}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={<Activity className="w-12 h-12" />} text="No active contracts" />
              )}

              {/* Also show disputed projects */}
              {disputedProjects.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-sm font-black text-white uppercase tracking-tight mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Under Dispute ({disputedProjects.length})
                  </h4>
                  <div className="space-y-3">
                    {disputedProjects.map(p => <ProjectRow key={p.id} project={p} />)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ────────── FINANCIALS TAB ────────── */}
        {activeTab === 'financials' && (
          <div className="space-y-6">
            <div className="bg-[#0b0f19] p-5 sm:p-6 md:p-8 rounded-xl border border-slate-800">
              <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-slate-500" />
                {isFreelancer ? 'Earnings Summary' : 'Spending Summary'}
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                {isFreelancer ? 'Overview of earnings from completed escrow contracts.' : 'Overview of spending on escrow-backed projects.'}
              </p>

              {/* Main financial cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="p-5 bg-gradient-to-br from-orange-500/5 to-transparent rounded-xl border border-orange-500/10 text-center">
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {formatUSD(isFreelancer ? totalEarned : totalProjectValue)}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-orange-500 mt-1">
                    {isFreelancer ? 'Total Earned' : 'Total Budget'}
                  </div>
                </div>
                <div className="p-5 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-xl border border-emerald-500/10 text-center">
                  <div className="text-2xl sm:text-3xl font-black text-white">{formatUSD(completedValue)}</div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-emerald-500 mt-1">
                    {isFreelancer ? 'From Completed' : 'Completed Value'}
                  </div>
                </div>
                <div className="p-5 bg-gradient-to-br from-blue-500/5 to-transparent rounded-xl border border-blue-500/10 text-center">
                  <div className="text-2xl sm:text-3xl font-black text-white">{formatUSD(activeValue)}</div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-blue-500 mt-1">In Active Escrow</div>
                </div>
              </div>

              {/* Token breakdown */}
              <h4 className="text-sm font-black text-white uppercase tracking-tight mb-3">Token Breakdown</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-[#05080f] rounded-lg border border-slate-800/50 flex items-center gap-4">
                  <div className="p-3 bg-orange-500/10 rounded-full">
                    <Coins className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-white">{stxProjects.length} contract{stxProjects.length !== 1 ? 's' : ''}</div>
                    <div className="text-xs text-slate-500 font-bold">STX Contracts</div>
                    <div className="text-xs text-orange-400 font-mono mt-0.5">
                      {stxProjects.reduce((s, p) => s + p.totalBudget, 0).toFixed(2)} STX total
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-[#05080f] rounded-lg border border-slate-800/50 flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-full">
                    <Coins className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-white">{sbtcProjects.length} contract{sbtcProjects.length !== 1 ? 's' : ''}</div>
                    <div className="text-xs text-slate-500 font-bold">sBTC Contracts</div>
                    <div className="text-xs text-amber-400 font-mono mt-0.5">
                      {sbtcProjects.reduce((s, p) => s + p.totalBudget, 0).toFixed(6)} sBTC total
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction history by project */}
              {completedProjects.length > 0 && (
                <>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight mb-3">Completed Transactions</h4>
                  <div className="space-y-2">
                    {completedProjects.map(p => {
                      const usd = tokenToUsd(p.totalBudget, p.tokenType);
                      return (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-[#05080f] rounded-lg border border-slate-800/50">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white truncate">{p.title}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{new Date(p.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <div className="text-sm font-black text-emerald-400">{isFreelancer ? '+' : ''}{formatUSD(usd)}</div>
                            <div className="text-[10px] font-mono text-slate-500">{p.totalBudget.toFixed(2)} {p.tokenType}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {projects.length === 0 && (
                <EmptyState icon={<TrendingUp className="w-12 h-12" />} text="No financial activity yet" />
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════ */

const StatCard: React.FC<{ icon: React.ReactNode; bg: string; value: string; label: string }> = ({ icon, bg, value, label }) => (
  <div className="bg-[#0b0f19] p-4 sm:p-5 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
    <div className={`p-2.5 sm:p-3 ${bg} rounded-full mb-2 sm:mb-3`}>{icon}</div>
    <div className="text-lg sm:text-2xl font-black text-white">{value}</div>
    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</div>
  </div>
);

const MiniStat: React.FC<{ label: string; count: number; color: string }> = ({ label, count, color }) => (
  <div className="p-2 bg-[#05080f] rounded border border-slate-800/50 text-center">
    <div className={`text-lg font-black ${color}`}>{count}</div>
    <div className="text-[9px] uppercase tracking-wider font-bold text-slate-600">{label}</div>
  </div>
);

const MiniStatCard: React.FC<{ label: string; count: number; color: string; bg: string }> = ({ label, count, color, bg }) => (
  <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800 text-center">
    <div className={`text-2xl font-black ${color}`}>{count}</div>
    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">{label}</div>
  </div>
);

const ReviewCard: React.FC<{ review: BackendReview }> = ({ review }) => (
  <div className="p-4 bg-[#05080f] border border-slate-800/50 rounded-lg">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(s => (
          <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
        ))}
        <span className="ml-2 text-xs font-bold text-slate-400">{review.rating}/5</span>
      </div>
      <span className="text-[10px] text-slate-600 font-mono">
        {new Date(review.createdAt).toLocaleDateString()}
      </span>
    </div>
    {review.comment && (
      <p className="text-sm text-slate-400 leading-relaxed">{review.comment}</p>
    )}
    <div className="text-[10px] text-slate-600 mt-2">Project #{review.projectId}</div>
  </div>
);

const EmptyState: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="flex flex-col items-center justify-center py-12 text-slate-600">
    <div className="opacity-20 mb-3">{icon}</div>
    <p className="text-sm font-bold">{text}</p>
  </div>
);

export default UserProfileView;
