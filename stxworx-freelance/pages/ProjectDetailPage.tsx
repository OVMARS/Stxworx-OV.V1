import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import {
  ArrowLeft, Users, CheckCircle2, XCircle, Clock, DollarSign,
  Shield, Lock, User, ExternalLink, AlertTriangle,
} from 'lucide-react';
import { formatUSD, tokenToUsd } from '../services/StacksService';
import { Proposal, Project } from '../types';
import ProjectCard from '../components/ProjectCard';

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    myPostedProjects, fetchMyProjects, fetchProjectProposals, projectProposals,
    acceptProposal, rejectProposal, handleProjectAction, isProcessing, wallet,
  } = useAppStore();

  const [deployingEscrow, setDeployingEscrow] = useState(false);

  const projectId = Number(id);
  const project = myPostedProjects.find((p) => Number(p.id) === projectId);
  const proposals: Proposal[] = projectProposals[projectId] || [];
  const acceptedProposal = proposals.find((p) => p.status === 'accepted');

  useEffect(() => {
    if (wallet.address) {
      fetchMyProjects();
    }
  }, [wallet.address]);

  useEffect(() => {
    if (projectId) {
      fetchProjectProposals(projectId);
    }
  }, [projectId, myPostedProjects]);

  const handleAccept = useCallback(async (proposalId: number) => {
    await acceptProposal(proposalId);
    fetchProjectProposals(projectId);
  }, [projectId]);

  const handleReject = useCallback(async (proposalId: number) => {
    await rejectProposal(proposalId);
    fetchProjectProposals(projectId);
  }, [projectId]);

  const handleDeployEscrow = useCallback(async () => {
    if (!project || !acceptedProposal?.freelancerAddress) return;
    setDeployingEscrow(true);

    try {
      const { createProjectContractCall, getOnChainProjectCount } = await import('../lib/contracts');

      // Read the current on-chain project counter BEFORE submitting
      // so we can derive the new ID (counter + 1) after TX is sent
      const currentCount = await getOnChainProjectCount();
      const expectedOnChainId = currentCount + 1;

      const milestoneData = project.milestones.map((m) => ({ amount: m.amount }));

      await createProjectContractCall(
        {
          freelancerAddress: acceptedProposal.freelancerAddress,
          totalBudget: project.totalBudget,
          tokenType: project.tokenType as 'STX' | 'sBTC',
          milestones: milestoneData,
        },
        async (txData) => {
          console.log('Escrow transaction sent:', txData);
          await handleProjectAction(project.id, 'activate', {
            escrowTxId: txData.txId,
            onChainId: expectedOnChainId,
          });
          setDeployingEscrow(false);
          fetchMyProjects();
        },
        () => {
          console.log('Escrow transaction canceled');
          setDeployingEscrow(false);
        }
      );
    } catch (error: any) {
      console.error('Escrow deploy failed:', error);
      setDeployingEscrow(false);
      alert('Failed to deploy escrow: ' + (error.message || 'Unknown error'));
    }
  }, [project, acceptedProposal]);

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-400">Project not found or still loading...</p>
        <button onClick={() => navigate('/client')} className="text-orange-500 hover:underline mt-4 text-sm font-bold">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const usdValue = tokenToUsd(project.totalBudget, project.tokenType);
  const pendingProposals = proposals.filter((p) => p.status === 'pending');
  const otherProposals = proposals.filter((p) => p.status !== 'pending' && p.status !== 'accepted');
  const isOpen = project.status === 'open';
  const needsEscrow = acceptedProposal && !project.isFunded && project.status === 'open';

  const statusColors: Record<string, string> = {
    pending: 'text-blue-400 bg-blue-950/30 border-blue-900/50',
    accepted: 'text-emerald-400 bg-emerald-950/30 border-emerald-900/50',
    rejected: 'text-red-400 bg-red-950/30 border-red-900/50',
    withdrawn: 'text-slate-400 bg-slate-900/30 border-slate-700/50',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back button */}
      <button
        onClick={() => navigate('/client')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-5 sm:mb-8 text-xs sm:text-sm font-bold uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Project Summary Card */}
      <ProjectCard
        project={project}
        role="client"
        onAction={handleProjectAction}
        isProcessing={isProcessing}
      />

      {/* Escrow Deploy Banner */}
      {needsEscrow && (
        <div className="mt-4 sm:mt-6 bg-orange-950/20 border border-orange-900/50 rounded-xl p-4 sm:p-6 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                Freelancer Accepted — Deploy Escrow
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                You accepted <span className="text-orange-400 font-mono">{acceptedProposal.freelancerUsername || acceptedProposal.freelancerAddress?.slice(0, 12) + '...'}</span>.
                Fund the on-chain escrow to activate this project.
              </p>
            </div>
          </div>
          <button
            onClick={handleDeployEscrow}
            disabled={deployingEscrow || isProcessing}
            className="w-full sm:w-auto px-5 sm:px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-wider rounded-xl shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 transition-all hover:scale-105 text-xs sm:text-sm whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deployingEscrow ? (
              <span className="animate-pulse">Deploying...</span>
            ) : (
              <><Lock className="w-4 h-4" /> Fund Escrow ({formatUSD(usdValue)})</>
            )}
          </button>
        </div>
      )}

      {/* Applicants Section */}
      <div className="mt-6 sm:mt-8">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Users className="w-4 sm:w-5 h-4 sm:h-5 text-orange-500" />
          <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
            Applicants ({proposals.length})
          </h2>
          {pendingProposals.length > 0 && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-600/20 text-orange-400 border border-orange-900/50">
              {pendingProposals.length} pending
            </span>
          )}
        </div>

        {proposals.length === 0 && (
          <div className="bg-[#0b0f19] rounded-xl border border-dashed border-slate-800 p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400 font-bold">No applicants yet</p>
            <p className="text-xs text-slate-600 mt-1">Your project is live on the marketplace. Freelancers can apply anytime.</p>
          </div>
        )}

        {/* Accepted Proposal (pinned at top) */}
        {acceptedProposal && (
          <div className="mb-4">
            <div className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider mb-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Accepted Freelancer
            </div>
            {renderProposalCard(acceptedProposal, statusColors, navigate, false)}
          </div>
        )}

        {/* Pending Proposals */}
        {pendingProposals.length > 0 && (
          <div className="space-y-3 mb-4">
            {!acceptedProposal && (
              <div className="text-[10px] uppercase font-bold text-blue-400 tracking-wider mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Awaiting Review
              </div>
            )}
            {pendingProposals.map((proposal) => (
              <div key={proposal.id}>
                {renderProposalCard(proposal, statusColors, navigate, isOpen && !acceptedProposal, handleAccept, handleReject, isProcessing)}
              </div>
            ))}
          </div>
        )}

        {/* Other Proposals (rejected / withdrawn) */}
        {otherProposals.length > 0 && (
          <div className="space-y-3 mt-6">
            <div className="text-[10px] uppercase font-bold text-slate-600 tracking-wider mb-2">
              Previous Applicants
            </div>
            {otherProposals.map((proposal) => (
              <div key={proposal.id}>
                {renderProposalCard(proposal, statusColors, navigate, false)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function renderProposalCard(
  proposal: Proposal,
  statusColors: Record<string, string>,
  navigate: (path: string) => void,
  showActions: boolean,
  onAccept?: (id: number) => void,
  onReject?: (id: number) => void,
  isProcessing?: boolean,
) {
  const displayName = proposal.freelancerUsername || proposal.freelancerAddress?.slice(0, 12) + '...' || `Freelancer #${proposal.freelancerId}`;
  const address = proposal.freelancerAddress || '';

  return (
    <div className="bg-[#0b0f19] rounded-xl border border-slate-800 p-4 sm:p-5 hover:border-slate-700 transition-all">
      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="shrink-0 hidden sm:block">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${address || proposal.freelancerId}`}
            alt="avatar"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-800 border border-slate-700"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <button
              onClick={() => address && navigate(`/profile?address=${address}`)}
              className="text-sm font-bold text-white hover:text-orange-400 transition-colors flex items-center gap-1"
            >
              {displayName}
              <ExternalLink className="w-3 h-3 opacity-50" />
            </button>
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${statusColors[proposal.status] || ''}`}>
              {proposal.status}
            </span>
          </div>

          {address && (
            <p className="text-[10px] font-mono text-slate-600 mb-2 truncate">{address}</p>
          )}

          <p className="text-sm text-slate-400 leading-relaxed italic">
            "{proposal.coverLetter}"
          </p>

          <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-600">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Applied {new Date(proposal.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => onAccept?.(proposal.id)}
              disabled={isProcessing}
              className="flex-1 sm:flex-none px-4 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-lg shadow-emerald-900/20"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Accept
            </button>
            <button
              onClick={() => onReject?.(proposal.id)}
              disabled={isProcessing}
              className="flex-1 sm:flex-none px-4 py-2 sm:py-2.5 bg-slate-800 hover:bg-red-600/80 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectDetailPage;
