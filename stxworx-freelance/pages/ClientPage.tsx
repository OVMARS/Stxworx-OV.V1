import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import ProjectCard from '../components/ProjectCard';
import {
  PlusCircle, Layers, Users, FileText, Briefcase, ChevronRight,
  Settings, DollarSign, CheckCircle2, Activity, TrendingUp, User,
} from 'lucide-react';
import { formatUSD, tokenToUsd } from '../services/StacksService';

const ClientPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    myPostedProjects, isProcessing, handleProjectAction, setIsModalOpen,
    fetchMyProjects, fetchProjectProposals, projectProposals, wallet,
    currentUserProfile,
  } = useAppStore();

  useEffect(() => {
    if (wallet.address) fetchMyProjects();
  }, [wallet.address]);

  // Fetch proposals for each posted project
  useEffect(() => {
    myPostedProjects.forEach((p) => {
      fetchProjectProposals(Number(p.id));
    });
  }, [myPostedProjects]);

  const completedProjects = useMemo(() => myPostedProjects.filter(p => p.status === 'completed'), [myPostedProjects]);
  const activeProjects = useMemo(() => myPostedProjects.filter(p => p.status === 'active'), [myPostedProjects]);
  const openProjects = useMemo(() => myPostedProjects.filter(p => p.status === 'open'), [myPostedProjects]);
  const totalSpent = useMemo(
    () => completedProjects.reduce((sum, p) => sum + tokenToUsd(p.totalBudget, p.tokenType), 0),
    [completedProjects]
  );
  const totalPendingProposals = useMemo(
    () => Object.values(projectProposals).reduce((sum, arr) => sum + arr.filter(p => p.status === 'pending').length, 0),
    [projectProposals]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ─── Header with Profile ─── */}
      <div className="flex flex-col gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">Client Dashboard</h1>
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
            {wallet.address && (
              <>
                <div className="h-4 w-px bg-slate-700" />
                <button
                  onClick={() => navigate(`/user/${wallet.address}`)}
                  className="text-xs font-bold text-blue-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <User className="w-3 h-3" /> View Public Profile
                </button>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/browse')}
            className="flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all text-xs sm:text-sm"
          >
            <Briefcase className="w-4 h-4" /> Marketplace
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none px-3 sm:px-6 py-2.5 sm:py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 transition-all hover:scale-105 text-xs sm:text-sm"
          >
            <PlusCircle className="w-5 h-5" /> New Contract
          </button>
        </div>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
        <div className="bg-[#0b0f19] rounded-xl border border-blue-900/50 p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-black text-blue-400">{myPostedProjects.length}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Total Projects</div>
        </div>
        <div className="bg-[#0b0f19] rounded-xl border border-orange-900/50 p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-black text-orange-400">{activeProjects.length}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Active Contracts</div>
        </div>
        <div className="bg-[#0b0f19] rounded-xl border border-emerald-900/50 p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-black text-emerald-400">{completedProjects.length}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Completed</div>
        </div>
        <div className="bg-[#0b0f19] rounded-xl border border-amber-900/50 p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-black text-amber-400">{formatUSD(totalSpent)}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Total Spent</div>
        </div>
      </div>

      {/* ─── Pending Proposals Alert ─── */}
      {totalPendingProposals > 0 && (
        <div className="mb-6 p-3 sm:p-4 bg-orange-950/20 border border-orange-900/40 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-lg shrink-0">
            <Users className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">
              {totalPendingProposals} pending proposal{totalPendingProposals !== 1 ? 's' : ''} awaiting review
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Click on a project below to review and accept proposals.</p>
          </div>
        </div>
      )}

      {/* ─── Projects List ─── */}
      <div className="space-y-8">
        {myPostedProjects.length > 0 ? (
          myPostedProjects.map((project) => {
            const proposals = projectProposals[Number(project.id)] || [];
            const pendingCount = proposals.filter((p) => p.status === 'pending').length;
            return (
              <div
                key={project.id}
                className="space-y-3 cursor-pointer group"
                onClick={() => navigate(`/client/project/${project.id}`)}
              >
                <ProjectCard
                  project={project}
                  role="client"
                  onAction={handleProjectAction}
                  isProcessing={isProcessing}
                />
                {/* Proposals summary — click to view details */}
                {proposals.length > 0 ? (
                  <div className="ml-0 sm:ml-4 flex flex-wrap items-center gap-2 sm:gap-3 py-2 px-3 sm:px-4 bg-[#0b0f19] rounded-xl border border-slate-800 group-hover:border-orange-900/50 transition-colors">
                    <Users className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-bold text-white uppercase tracking-wider">
                      {proposals.length} Proposal{proposals.length !== 1 ? 's' : ''}
                    </span>
                    {pendingCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-600/20 text-orange-400 border border-orange-900/50">
                        {pendingCount} pending
                      </span>
                    )}
                    <span className="ml-auto text-xs text-slate-500 group-hover:text-orange-400 flex items-center gap-1 transition-colors">
                      View Details <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                ) : project.status === 'open' ? (
                  <div className="ml-0 sm:ml-4 text-xs text-slate-600 flex items-center gap-1.5 py-2">
                    <FileText className="w-3 h-3" /> No proposals yet — your project is visible on the marketplace.
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-[#0b0f19] rounded-2xl border border-dashed border-slate-800">
            <Layers className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Active Contracts</h3>
            <p className="text-slate-400 max-w-md mx-auto mb-6">
              Create a new milestone-based escrow contract to start working with freelancers securely.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-orange-500 font-bold hover:underline uppercase tracking-wide text-xs"
            >
              Create your first contract
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientPage;
