import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import ProjectCard from '../components/ProjectCard';
import Leaderboard from '../components/Leaderboard';
import {
  Briefcase, Settings, Send, CheckCircle2, Clock, Play, Trophy,
  DollarSign, Award, TrendingUp, FileText, Shield, ArrowRight, XCircle, Ban,
} from 'lucide-react';
import { formatUSD, tokenToUsd } from '../services/StacksService';
import { Proposal, ProposalStatus } from '../types';

const PROPOSAL_STATUS_CONFIG: Record<ProposalStatus, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  pending:   { label: 'Pending',   color: 'text-blue-400',    icon: <Clock className="w-3.5 h-3.5" />,        bg: 'bg-blue-950/30 border-blue-900/50' },
  accepted:  { label: 'Accepted',  color: 'text-emerald-400', icon: <CheckCircle2 className="w-3.5 h-3.5" />, bg: 'bg-emerald-950/30 border-emerald-900/50' },
  rejected:  { label: 'Rejected',  color: 'text-red-400',     icon: <XCircle className="w-3.5 h-3.5" />,      bg: 'bg-red-950/30 border-red-900/50' },
  withdrawn: { label: 'Withdrawn', color: 'text-slate-400',   icon: <Ban className="w-3.5 h-3.5" />,          bg: 'bg-slate-900/30 border-slate-700/50' },
};

const FreelancerPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    myActiveProjects, wallet, currentUserProfile, leaderboardData, projects,
    freelancerDashboardTab, setFreelancerDashboardTab, isProcessing,
    handleProjectAction, applications, updateApplicationStatus,
    fetchMyProjects, fetchMyProposals, myProposals, withdrawProposal,
  } = useAppStore();

  useEffect(() => {
    if (wallet.address) {
      fetchMyProjects();
      fetchMyProposals();
    }
  }, [wallet.address]);

  // Build a map of projectId→Project for enriching proposals
  const projectMap = useMemo(() => {
    const m = new Map<string, typeof projects[0]>();
    projects.forEach((p) => m.set(p.id, p));
    return m;
  }, [projects]);

  const pendingProposals  = myProposals.filter((p) => p.status === 'pending');
  const acceptedProposals = myProposals.filter((p) => p.status === 'accepted');
  const rejectedProposals = myProposals.filter((p) => p.status === 'rejected' || p.status === 'withdrawn');

  const handleViewProfile = (address: string | any, name?: string) => {
    if (typeof address === 'string') {
      useAppStore.getState().viewProfileByAddress(address, name).then(() => navigate('/profile'));
    } else {
      useAppStore.getState().setSelectedProfile(address);
      navigate('/profile');
    }
  };

  const renderProposalCard = (proposal: Proposal, showWithdraw?: boolean) => {
    const project = projectMap.get(String(proposal.projectId));
    const cfg = PROPOSAL_STATUS_CONFIG[proposal.status];

    return (
      <div
        key={proposal.id}
        className="bg-[#0b0f19] rounded-xl border border-slate-800 hover:border-orange-500/30 transition-all duration-300 p-5 group"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {project && (
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                  {project.category}
                </span>
              )}
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border flex items-center gap-1 ${cfg.bg} ${cfg.color}`}>
                {cfg.icon} {cfg.label}
              </span>
            </div>
            <h3 className="text-white font-bold text-base uppercase tracking-tight">
              {project?.title || `Project #${proposal.projectId}`}
            </h3>
            {project && (
              <p className="text-slate-500 text-xs mt-1 line-clamp-2">{project.description}</p>
            )}
          </div>
          {project && (
            <div className="text-right ml-4 shrink-0">
              <div className="text-lg font-black text-white">
                {formatUSD(tokenToUsd(project.totalBudget, project.tokenType))}
              </div>
              <div className="text-[10px] text-slate-600 font-mono">
                {project.totalBudget.toLocaleString()} {project.tokenType}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
          {project && (
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" /> {project.milestones.length} milestones
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> Submitted {new Date(proposal.createdAt).toLocaleDateString()}
          </span>
          {project?.isFunded && (
            <span className="flex items-center gap-1 text-emerald-500">
              <Shield className="w-3 h-3" /> Escrow Funded
            </span>
          )}
        </div>

        {proposal.coverLetter && (
          <div className="bg-slate-900/50 rounded-lg p-3 mb-3 border border-slate-800">
            <p className="text-xs text-slate-400 italic line-clamp-3">"{proposal.coverLetter}"</p>
          </div>
        )}

        {showWithdraw && proposal.status === 'pending' && (
          <button
            onClick={() => withdrawProposal(proposal.id)}
            disabled={isProcessing}
            className="mt-2 w-full py-2.5 bg-slate-800 hover:bg-red-600/80 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Ban className="w-3 h-3" /> Withdraw Proposal
          </button>
        )}
      </div>
    );
  };

  const EmptyState = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) => (
    <div className="text-center py-16 bg-[#0b0f19] rounded-2xl border border-dashed border-slate-800">
      <Icon className="w-14 h-14 mx-auto text-slate-700 mb-4" />
      <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
      <p className="text-slate-500 text-sm max-w-md mx-auto">{subtitle}</p>
    </div>
  );

  const tabs = [
    { key: 'applied' as const,   label: 'Pending',    icon: <Send className="w-4 h-4" />,         count: pendingProposals.length },
    { key: 'active' as const,    label: 'Accepted',   icon: <CheckCircle2 className="w-4 h-4" />, count: acceptedProposals.length },
    { key: 'completed' as const, label: 'Rejected',   icon: <XCircle className="w-4 h-4" />,      count: rejectedProposals.length },
    { key: 'earnings' as const,  label: 'Earnings',   icon: <DollarSign className="w-4 h-4" />,   count: null },
    { key: 'nft' as const,       label: 'NFT Badges', icon: <Award className="w-4 h-4" />,        count: null },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">Freelancer Portal</h1>
          <div className="flex items-center gap-4 mt-2">
            {currentUserProfile && (
              <div className="flex items-center gap-2">
                <img src={currentUserProfile.avatar} className="w-6 h-6 rounded-full border border-slate-700" alt="" />
                <span className="text-slate-300 font-bold text-sm">{currentUserProfile.name}</span>
              </div>
            )}
            <div className="h-4 w-px bg-slate-700" />
            <button
              onClick={() => navigate('/edit-profile')}
              className="text-xs font-bold text-orange-500 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Settings className="w-3 h-3" /> Edit Profile
            </button>
          </div>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/browse')}
            className="flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all text-xs sm:text-sm"
          >
            <Briefcase className="w-4 h-4" /> Marketplace
          </button>

        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
        {[
          { label: 'Pending', value: pendingProposals.length, color: 'text-blue-400', accent: 'border-blue-900/50' },
          { label: 'Accepted', value: acceptedProposals.length, color: 'text-emerald-400', accent: 'border-emerald-900/50' },
          { label: 'Active Projects', value: myActiveProjects.length, color: 'text-orange-400', accent: 'border-orange-900/50' },
          { label: 'Rejected', value: rejectedProposals.length, color: 'text-red-400', accent: 'border-red-900/50' },
        ].map((stat) => (
          <div key={stat.label} className={`bg-[#0b0f19] rounded-xl border ${stat.accent} p-3 sm:p-4 text-center`}>
            <div className={`text-xl sm:text-2xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="overflow-hidden w-full">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-800 mb-6 sm:mb-8 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFreelancerDashboardTab(tab.key)}
            className={`pb-2.5 sm:pb-3 px-2.5 sm:px-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              freelancerDashboardTab === tab.key
                ? 'text-white border-orange-500'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            {tab.icon} {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400">{tab.count}</span>
            )}
          </button>
        ))}
        </div>
      </div>

      {/* Tab content */}
      {freelancerDashboardTab === 'applied' && (
        <div className="space-y-4">
          {pendingProposals.length > 0 ? (
            pendingProposals.map((p) => renderProposalCard(p, true))
          ) : (
            <EmptyState
              icon={Send}
              title="No Pending Proposals"
              subtitle="Browse open projects on the marketplace and submit proposals to start earning."
            />
          )}
        </div>
      )}

      {freelancerDashboardTab === 'active' && (
        <div className="space-y-4">
          {acceptedProposals.length > 0 ? (
            acceptedProposals.map((p) => renderProposalCard(p, false))
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="No Accepted Proposals"
              subtitle="Once a client accepts your proposal, it will appear here."
            />
          )}
        </div>
      )}

      {freelancerDashboardTab === 'completed' && (
        <div className="space-y-4">
          {rejectedProposals.length > 0 ? (
            rejectedProposals.map((p) => renderProposalCard(p, false))
          ) : (
            <EmptyState
              icon={XCircle}
              title="No Rejected or Withdrawn Proposals"
              subtitle="Rejected and withdrawn proposals will appear here for your records."
            />
          )}
        </div>
      )}

      {freelancerDashboardTab === 'earnings' && (
        <div className="space-y-6">
          <div className="bg-[#0b0f19] rounded-2xl border border-slate-800 p-4 sm:p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-orange-600/10 flex items-center justify-center border border-orange-900/50">
                <TrendingUp className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Projects</h3>
                <div className="text-2xl sm:text-3xl font-black text-white">{myActiveProjects.length}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Active Projects</div>
                <div className="text-xl font-black text-orange-400">{myActiveProjects.length}</div>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Proposals Sent</div>
                <div className="text-xl font-black text-blue-400">{myProposals.length}</div>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Acceptance Rate</div>
                <div className="text-xl font-black text-emerald-400">
                  {myProposals.length > 0 ? Math.round((acceptedProposals.length / myProposals.length) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {freelancerDashboardTab === 'nft' && (
        <div className="text-center py-20 bg-[#0b0f19] rounded-2xl border border-dashed border-slate-800">
          <Award className="w-16 h-16 mx-auto text-slate-700 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">NFT Badges</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-4">
            Earn on-chain achievement badges as you complete contracts and hit milestones.
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-6">
            {['First Job', '5 Contracts', '10K Earned', 'Top Rated'].map((badge) => (
              <div
                key={badge}
                className="w-20 h-20 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center"
              >
                <div className="text-center">
                  <Award className="w-6 h-6 text-slate-700 mx-auto mb-1" />
                  <span className="text-[9px] text-slate-600 font-bold uppercase">{badge}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-slate-600 text-xs mt-6 uppercase tracking-wider font-bold">Coming Soon</p>
        </div>
      )}
    </div>
  );
};

export default FreelancerPage;
