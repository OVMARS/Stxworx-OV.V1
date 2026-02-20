import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock,
  Shield,
  Users,
  XCircle,
} from 'lucide-react';

import ProjectCard from '../components/ProjectCard';
import { formatUSD, tokenToUsd } from '../services/StacksService';
import { useAppStore } from '../stores/useAppStore';
import { Proposal } from '../types';

type ProposalStatusClassMap = Record<string, string>;

const PROPOSAL_STATUS_CLASSES: ProposalStatusClassMap = {
  pending: 'text-blue-400 bg-blue-950/30 border-blue-900/50',
  accepted: 'text-emerald-400 bg-emerald-950/30 border-emerald-900/50',
  rejected: 'text-red-400 bg-red-950/30 border-red-900/50',
  withdrawn: 'text-slate-400 bg-slate-900/30 border-slate-700/50',
};

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    myPostedProjects,
    fetchMyProjects,
    fetchProjectProposals,
    projectProposals,
    acceptProposal,
    rejectProposal,
    handleProjectAction,
    isProcessing,
    wallet,
  } = useAppStore();

  const [deployingEscrow, setDeployingEscrow] = useState(false);

  const projectId = Number(id);
  const project = myPostedProjects.find((item) => Number(item.id) === projectId);

  const proposals: Proposal[] = useMemo(
    () => projectProposals[projectId] || [],
    [projectId, projectProposals],
  );

  const acceptedProposal = useMemo(
    () => proposals.find((proposal) => proposal.status === 'accepted'),
    [proposals],
  );

  const pendingProposals = useMemo(
    () => proposals.filter((proposal) => proposal.status === 'pending'),
    [proposals],
  );

  const otherProposals = useMemo(
    () => proposals.filter((proposal) => proposal.status !== 'pending' && proposal.status !== 'accepted'),
    [proposals],
  );

  const isOpen = project?.status === 'open';
  const needsEscrow = Boolean(acceptedProposal && project && !project.isFunded && project.status === 'open');

  useEffect(() => {
    if (wallet.address) {
      fetchMyProjects();
    }
  }, [wallet.address, fetchMyProjects]);

  useEffect(() => {
    if (projectId) {
      fetchProjectProposals(projectId);
    }
  }, [projectId, fetchProjectProposals]);

  const refreshProjectData = useCallback(async () => {
    await Promise.all([fetchMyProjects(), fetchProjectProposals(projectId)]);
  }, [fetchMyProjects, fetchProjectProposals, projectId]);

  const handleAccept = useCallback(
    async (proposalId: number) => {
      await acceptProposal(proposalId);
      await fetchProjectProposals(projectId);
    },
    [acceptProposal, fetchProjectProposals, projectId],
  );

  const handleReject = useCallback(
    async (proposalId: number) => {
      await rejectProposal(proposalId);
      await fetchProjectProposals(projectId);
    },
    [rejectProposal, fetchProjectProposals, projectId],
  );

  const handleDeployEscrow = useCallback(async () => {
    if (!project || !acceptedProposal?.freelancerAddress) return;

    setDeployingEscrow(true);
    try {
      const { createProjectContractCall, getOnChainProjectCount, isUserCancellation } = await import('../lib/contracts');

      const currentCount = await getOnChainProjectCount();
      const expectedOnChainId = currentCount + 1;
      const milestones = project.milestones.map((milestone) => ({ amount: milestone.amount }));

      try {
        const { txId } = await createProjectContractCall({
          freelancerAddress: acceptedProposal.freelancerAddress,
          totalBudget: project.totalBudget,
          tokenType: project.tokenType as 'STX' | 'sBTC',
          milestones,
        });

        await handleProjectAction(project.id, 'activate', {
          escrowTxId: txId,
          onChainId: expectedOnChainId,
        });

        await refreshProjectData();
      } catch (walletError) {
        if (!isUserCancellation(walletError)) {
          throw walletError;
        }
      }
    } catch (error: any) {
      console.error('Escrow deploy failed:', error);
      alert(`Failed to deploy escrow: ${error?.message || 'Unknown error'}`);
    } finally {
      setDeployingEscrow(false);
    }
  }, [acceptedProposal?.freelancerAddress, handleProjectAction, project, refreshProjectData]);

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-400">Project not found or still loading...</p>
        <button
          onClick={() => navigate('/client')}
          className="text-orange-500 hover:underline mt-4 text-sm font-bold"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const usdValue = tokenToUsd(project.totalBudget, project.tokenType);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={() => navigate('/client')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-5 sm:mb-8 text-xs sm:text-sm font-bold uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <ProjectCard
        project={project}
        role="client"
        onAction={handleProjectAction}
        isProcessing={isProcessing}
      />

      {needsEscrow && acceptedProposal && (
        <EscrowDeployBanner
          freelancerLabel={
            acceptedProposal.freelancerUsername || `${acceptedProposal.freelancerAddress?.slice(0, 12)}...`
          }
          amountUsd={usdValue}
          deploying={deployingEscrow}
          disabled={isProcessing}
          onDeploy={handleDeployEscrow}
        />
      )}

      {project.isFunded && <EscrowAttachedSection onChainId={project.onChainId} escrowTxId={project.escrowTxId} />}

      <div className="mt-6 sm:mt-8">
        <ApplicantsHeader total={proposals.length} pending={pendingProposals.length} />

        {proposals.length === 0 && <EmptyApplicants />}

        {acceptedProposal && (
          <ProposalGroup title="Accepted Freelancer" titleClassName="text-emerald-500" icon={<CheckCircle2 className="w-3 h-3" />}>
            <ProposalCard
              proposal={acceptedProposal}
              navigate={navigate}
              showActions={false}
              isProcessing={isProcessing}
              statusClasses={PROPOSAL_STATUS_CLASSES}
            />
          </ProposalGroup>
        )}

        {pendingProposals.length > 0 && (
          <ProposalGroup
            title="Awaiting Review"
            titleClassName="text-blue-400"
            icon={!acceptedProposal ? <Clock className="w-3 h-3" /> : undefined}
          >
            <div className="space-y-3 mb-4">
              {pendingProposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  navigate={navigate}
                  showActions={Boolean(isOpen && !acceptedProposal)}
                  isProcessing={isProcessing}
                  statusClasses={PROPOSAL_STATUS_CLASSES}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))}
            </div>
          </ProposalGroup>
        )}

        {otherProposals.length > 0 && (
          <div className="space-y-3 mt-6">
            <div className="text-[10px] uppercase font-bold text-slate-600 tracking-wider mb-2">
              Previous Applicants
            </div>
            {otherProposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                navigate={navigate}
                showActions={false}
                isProcessing={isProcessing}
                statusClasses={PROPOSAL_STATUS_CLASSES}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ApplicantsHeader: React.FC<{ total: number; pending: number }> = ({ total, pending }) => (
  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
    <Users className="w-4 sm:w-5 h-4 sm:h-5 text-orange-500" />
    <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
      Applicants ({total})
    </h2>
    {pending > 0 && (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-600/20 text-orange-400 border border-orange-900/50">
        {pending} pending
      </span>
    )}
  </div>
);

const EmptyApplicants: React.FC = () => (
  <div className="bg-[#0b0f19] rounded-xl border border-dashed border-slate-800 p-12 text-center">
    <Users className="w-12 h-12 mx-auto text-slate-600 mb-3" />
    <p className="text-slate-400 font-bold">No applicants yet</p>
    <p className="text-xs text-slate-600 mt-1">
      Your project is live on the marketplace. Freelancers can apply anytime.
    </p>
  </div>
);

const ProposalGroup: React.FC<{
  title: string;
  titleClassName: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, titleClassName, icon, children }) => (
  <div className="mb-4">
    <div className={`text-[10px] uppercase font-bold tracking-wider mb-2 flex items-center gap-1 ${titleClassName}`}>
      {icon}
      {title}
    </div>
    {children}
  </div>
);

const EscrowDeployBanner: React.FC<{
  freelancerLabel: string;
  amountUsd: number;
  deploying: boolean;
  disabled: boolean;
  onDeploy: () => void;
}> = ({ freelancerLabel, amountUsd, deploying, disabled, onDeploy }) => (
  <div className="mt-4 sm:mt-6 bg-orange-950/20 border border-orange-900/50 rounded-xl p-4 sm:p-6 flex flex-col gap-4">
    <div className="flex items-start gap-3">
      <Shield className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
      <div>
        <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
          Freelancer Accepted — Deploy Escrow
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          You accepted <span className="text-orange-400 font-mono">{freelancerLabel}</span>.
          Fund the on-chain escrow to activate this project.
        </p>
      </div>
    </div>

    <button
      onClick={onDeploy}
      disabled={deploying || disabled}
      className="w-full sm:w-auto px-5 sm:px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-wider rounded-xl shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 transition-all hover:scale-105 text-xs sm:text-sm whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {deploying ? (
        <span className="animate-pulse">Deploying...</span>
      ) : (
        <>
          <Lock className="w-4 h-4" /> Fund Escrow ({formatUSD(amountUsd)})
        </>
      )}
    </button>
  </div>
);

const EscrowAttachedSection: React.FC<{
  onChainId?: number | null;
  escrowTxId?: string | null;
}> = ({ onChainId, escrowTxId }) => (
  <div className="mt-4 sm:mt-6 bg-[#0b0f19] border border-orange-900/40 rounded-xl p-4 sm:p-6">
    <div className="flex items-center gap-2 mb-3">
      <Shield className="w-4 h-4 text-orange-500" />
      <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Escrow Attached</h4>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
        <p className="text-slate-400 uppercase tracking-wider text-[10px]">On-chain escrow id</p>
        <p className="text-white font-mono mt-1">{onChainId ?? '—'}</p>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
        <p className="text-slate-400 uppercase tracking-wider text-[10px]">Escrow tx</p>
        {escrowTxId ? (
          <a
            href={`https://explorer.hiro.so/txid/${escrowTxId}?chain=testnet`}
            target="_blank"
            rel="noreferrer"
            className="text-orange-400 hover:text-orange-300 font-mono mt-1 inline-flex items-center gap-1"
          >
            {escrowTxId.slice(0, 14)}...
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <p className="text-white font-mono mt-1">—</p>
        )}
      </div>
    </div>
  </div>
);

const ProposalCard: React.FC<{
  proposal: Proposal;
  statusClasses: ProposalStatusClassMap;
  navigate: (path: string) => void;
  showActions: boolean;
  onAccept?: (id: number) => void;
  onReject?: (id: number) => void;
  isProcessing?: boolean;
}> = ({ proposal, statusClasses, navigate, showActions, onAccept, onReject, isProcessing }) => {
  const displayName =
    proposal.freelancerUsername ||
    (proposal.freelancerAddress ? `${proposal.freelancerAddress.slice(0, 12)}...` : `Freelancer #${proposal.freelancerId}`);
  const address = proposal.freelancerAddress || '';

  return (
    <div className="bg-[#0b0f19] rounded-xl border border-slate-800 p-4 sm:p-5 hover:border-slate-700 transition-all">
      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
        <div className="shrink-0 hidden sm:block">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${address || proposal.freelancerId}`}
            alt="avatar"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-800 border border-slate-700"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <button
              onClick={() => address && navigate(`/user/${address}`)}
              className="text-sm font-bold text-white hover:text-orange-400 transition-colors flex items-center gap-1"
            >
              {displayName}
              <ExternalLink className="w-3 h-3 opacity-50" />
            </button>

            <span
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${statusClasses[proposal.status] || ''}`}
            >
              {proposal.status}
            </span>
          </div>

          {address && <p className="text-[10px] font-mono text-slate-600 mb-2 truncate">{address}</p>}

          <p className="text-sm text-slate-400 leading-relaxed italic">"{proposal.coverLetter}"</p>

          <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-600">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Applied {new Date(proposal.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

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
};

export default ProjectDetailPage;
