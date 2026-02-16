import React, { useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import ProjectCard from '../components/ProjectCard';
import { PlusCircle, Layers, Users, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';
import { Proposal } from '../types';

const ClientPage: React.FC = () => {
  const {
    myPostedProjects, isProcessing, handleProjectAction, setIsModalOpen,
    fetchMyProjects, fetchProjectProposals, projectProposals,
    acceptProposal, rejectProposal, wallet,
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

  const renderProposalRow = (proposal: Proposal) => {
    const statusColors: Record<string, string> = {
      pending: 'text-blue-400 bg-blue-950/30 border-blue-900/50',
      accepted: 'text-emerald-400 bg-emerald-950/30 border-emerald-900/50',
      rejected: 'text-red-400 bg-red-950/30 border-red-900/50',
      withdrawn: 'text-slate-400 bg-slate-900/30 border-slate-700/50',
    };
    return (
      <div key={proposal.id} className="flex items-start gap-4 p-4 bg-[#080c14] rounded-lg border border-slate-800/50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-300">Freelancer #{proposal.freelancerId}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${statusColors[proposal.status] || ''}`}>
              {proposal.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 line-clamp-2 italic">"{proposal.coverLetter}"</p>
          <span className="text-[10px] text-slate-600 mt-1 block">
            <Clock className="w-3 h-3 inline mr-1" />
            {new Date(proposal.createdAt).toLocaleDateString()}
          </span>
        </div>
        {proposal.status === 'pending' && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => acceptProposal(proposal.id)}
              disabled={isProcessing}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 disabled:opacity-40"
            >
              <CheckCircle2 className="w-3 h-3" /> Accept
            </button>
            <button
              onClick={() => rejectProposal(proposal.id)}
              disabled={isProcessing}
              className="px-3 py-2 bg-slate-800 hover:bg-red-600/80 text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 disabled:opacity-40"
            >
              <XCircle className="w-3 h-3" /> Reject
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Client Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your contracts, proposals, and escrow.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-orange-900/20 flex items-center gap-2 transition-all hover:scale-105"
        >
          <PlusCircle className="w-5 h-5" /> New Contract
        </button>
      </div>

      <div className="space-y-8">
        {myPostedProjects.length > 0 ? (
          myPostedProjects.map((project) => {
            const proposals = projectProposals[Number(project.id)] || [];
            const pendingCount = proposals.filter((p) => p.status === 'pending').length;
            return (
              <div key={project.id} className="space-y-3">
                <ProjectCard
                  project={project}
                  role="client"
                  onAction={handleProjectAction}
                  isProcessing={isProcessing}
                />
                {/* Proposals section */}
                {proposals.length > 0 && (
                  <div className="ml-4 bg-[#0b0f19] rounded-xl border border-slate-800 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-orange-500" />
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        Proposals ({proposals.length})
                      </h4>
                      {pendingCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-600/20 text-orange-400 border border-orange-900/50">
                          {pendingCount} pending
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {proposals.map(renderProposalRow)}
                    </div>
                  </div>
                )}
                {proposals.length === 0 && project.status === 'open' && (
                  <div className="ml-4 text-xs text-slate-600 flex items-center gap-1.5 py-2">
                    <FileText className="w-3 h-3" /> No proposals yet — your project is visible on the marketplace.
                  </div>
                )}
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
