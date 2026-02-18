import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import ProjectCard from '../components/ProjectCard';
import { PlusCircle, Layers, Users, FileText, Briefcase, ChevronRight } from 'lucide-react';

const ClientPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    myPostedProjects, isProcessing, handleProjectAction, setIsModalOpen,
    fetchMyProjects, fetchProjectProposals, projectProposals, wallet,
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">Client Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your contracts, proposals, and escrow.</p>
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
