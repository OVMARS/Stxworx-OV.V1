import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import {
  ArrowLeft, DollarSign, Clock, Send, CheckCircle2, X, Briefcase, Shield, User,
} from 'lucide-react';
import { formatUSD, tokenToUsd } from '../services/StacksService';
import { Project } from '../types';
import { api, mapBackendProject } from '../lib/api';

const BrowseProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { wallet, userRole, applyToProject, hasAppliedToProject } = useAppStore();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Apply modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.projects.getById(id)
      .then((bp) => {
        setProject(mapBackendProject(bp));
      })
      .catch(() => setError('Project not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmitProposal = async () => {
    if (!project || !coverLetter.trim()) return;
    setApplyLoading(true);
    await applyToProject(project, coverLetter.trim());
    setApplyLoading(false);
    setShowApplyModal(false);
    setCoverLetter('');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 mt-4 text-sm">Loading project...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-400">{error || 'Project not found.'}</p>
        <button onClick={() => navigate('/browse')} className="text-orange-500 hover:underline mt-4 text-sm font-bold">
          Back to Marketplace
        </button>
      </div>
    );
  }

  const usdValue = tokenToUsd(project.totalBudget, project.tokenType);
  const applied = hasAppliedToProject(project.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back */}
      <button
        onClick={() => navigate('/browse')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-5 sm:mb-8 text-xs sm:text-sm font-bold uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </button>

      {/* Project Header */}
      <div className="bg-[#0b0f19] rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
              {project.category}
            </span>
            <span className="px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider bg-orange-950/30 text-orange-500 border border-orange-900/50">
              {project.milestones.length} Milestones
            </span>
            {project.isFunded && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider bg-emerald-950/30 text-emerald-400 border border-emerald-900/50">
                <Shield className="w-3 h-3" /> Escrow Funded
              </span>
            )}
            <span className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider border ${
              project.status === 'open'
                ? 'bg-blue-950/30 text-blue-400 border-blue-900/50'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {project.status}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-3">
            {project.title}
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed mb-6 border-l-2 border-slate-800 pl-4">
            {project.description}
          </p>

          <div className="flex flex-wrap gap-3 sm:gap-6 text-sm text-slate-500 mb-6 sm:mb-8">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-orange-500" />
              <span className="text-lg sm:text-xl font-black text-white">{formatUSD(usdValue)}</span>
              <span className="text-xs font-mono text-slate-600">
                ({project.totalBudget.toLocaleString()} {project.tokenType})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <span className="text-xs">{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            {project.clientAddress && (
              <button
                onClick={() => navigate(`/user/${project.clientAddress}`)}
                className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 hover:text-blue-300 hover:border-blue-500/40 transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">View Client Profile</span>
              </button>
            )}
          </div>

          {/* Milestone Breakdown */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Milestone Breakdown</h3>
            <div className="space-y-2">
              {project.milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#05080f] rounded-lg p-3 border border-slate-800/50">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center border-2 border-orange-500/50 bg-[#0b0f19] shrink-0">
                    <span className="text-[10px] font-bold font-mono text-orange-500">M{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-200 truncate">{m.title}</p>
                  </div>
                  <span className="text-xs font-mono text-slate-400 shrink-0">
                    {m.amount.toFixed(4)} <span className="text-orange-500">{project.tokenType}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-[#05080f] border-t border-slate-800 px-4 sm:px-6 md:px-8 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {userRole === 'freelancer' && wallet.isConnected && (
            <button
              onClick={() => !applied && setShowApplyModal(true)}
              disabled={applied}
              className={`w-full sm:w-auto px-5 sm:px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                applied
                  ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/50 cursor-default'
                  : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20 hover:scale-[1.02]'
              }`}
            >
              {applied ? (
                <><CheckCircle2 className="w-4 h-4" /> Applied</>
              ) : (
                <><Send className="w-4 h-4" /> Apply to This Project</>
              )}
            </button>
          )}

          {userRole === 'client' && wallet.isConnected && (
            <span className="text-xs text-slate-600 font-bold uppercase tracking-wider flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> You are viewing as a client
            </span>
          )}

          {!wallet.isConnected && (
            <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">
              Connect wallet to apply
            </p>
          )}
        </div>
      </div>

      {/* Cover Letter Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0d1117] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Submit Proposal</h3>
                <p className="text-xs text-slate-500 mt-1">{project.title}</p>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Cover Letter <span className="text-orange-500">*</span>
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={5}
                placeholder="Describe your relevant experience, approach, and why you're a great fit..."
                className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 resize-none"
              />
              <p className="text-[10px] text-slate-600 mt-1">{coverLetter.length} characters</p>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setShowApplyModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wider bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitProposal}
                disabled={!coverLetter.trim() || applyLoading}
                className="flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wider bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {applyLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Send className="w-4 h-4" /> Submit Proposal</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseProjectDetailPage;
