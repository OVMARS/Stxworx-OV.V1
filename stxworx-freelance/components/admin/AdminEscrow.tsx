
import React, { useEffect, useState, useMemo } from 'react';
import {
  Shield, RefreshCw, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle, Clock, Lock, ArrowDownRight, ArrowUpRight,
  DollarSign, FileText, ExternalLink, Zap, XCircle, Play,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { mapBackendProject, type BackendMilestoneSubmission, type BackendDispute } from '../../lib/api';
import { formatUSD, tokenToUsd } from '../../services/StacksService';

type EscrowFilter = 'all' | 'active' | 'disputed' | 'completed' | 'refunded';

const AdminEscrow: React.FC = () => {
  const {
    adminProjects, fetchAdminProjects,
    adminForceRelease, adminForceRefund,
    adminDisputes, fetchAdminDisputes,
  } = useAppStore();

  const [filter, setFilter] = useState<EscrowFilter>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Detail state for expanded project
  const [detailData, setDetailData] = useState<{
    submissions: BackendMilestoneSubmission[];
    disputes: BackendDispute[];
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Refund / release modals
  const [confirmAction, setConfirmAction] = useState<{
    type: 'release' | 'refund';
    projectId: number;
    milestoneNum?: number;
    title: string;
  } | null>(null);
  const [txIdInput, setTxIdInput] = useState('');

  useEffect(() => {
    fetchAdminProjects();
    fetchAdminDisputes();
  }, []);

  const projects = useMemo(() => adminProjects.map(mapBackendProject), [adminProjects]);

  // Filtered projects — only show funded escrows
  const escrowProjects = useMemo(() => {
    let list = projects.filter(p => p.isFunded || p.status === 'completed' || p.status === 'refunded');
    if (filter !== 'all') {
      if (filter === 'disputed') {
        const disputedProjectIds = new Set(adminDisputes.filter(d => d.status === 'open').map(d => d.projectId));
        list = list.filter(p => disputedProjectIds.has(Number(p.id)));
      } else {
        list = list.filter(p => p.status === filter);
      }
    }
    return list;
  }, [projects, filter, adminDisputes]);

  // Stats
  const stats = useMemo(() => {
    const funded = projects.filter(p => p.isFunded);
    const disputedIds = new Set(adminDisputes.filter(d => d.status === 'open').map(d => d.projectId));
    return {
      totalEscrows: funded.length,
      activeEscrows: funded.filter(p => p.status === 'active').length,
      disputed: funded.filter(p => disputedIds.has(Number(p.id))).length,
      completed: projects.filter(p => p.status === 'completed').length,
      refunded: projects.filter(p => p.status === 'refunded').length,
    };
  }, [projects, adminDisputes]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchAdminProjects(), fetchAdminDisputes()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleExpand = async (projectId: number) => {
    if (expandedId === projectId) {
      setExpandedId(null);
      setDetailData(null);
      return;
    }
    setExpandedId(projectId);
    setLoadingDetail(true);
    try {
      const { api } = await import('../../lib/api');
      const data = await api.admin.projectDetail(projectId);
      setDetailData({ submissions: data.submissions, disputes: data.disputes });
    } catch (e) {
      console.error('Failed to load project detail:', e);
      setDetailData({ submissions: [], disputes: [] });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || !txIdInput.trim()) return;
    const key = `${confirmAction.type}-${confirmAction.projectId}-${confirmAction.milestoneNum || 0}`;
    setProcessingAction(key);
    try {
      if (confirmAction.type === 'release' && confirmAction.milestoneNum) {
        await adminForceRelease(confirmAction.projectId, confirmAction.milestoneNum, txIdInput.trim());
      } else if (confirmAction.type === 'refund') {
        await adminForceRefund(confirmAction.projectId, txIdInput.trim());
      }
      // Refresh detail
      if (expandedId) handleExpand(expandedId);
      setConfirmAction(null);
      setTxIdInput('');
    } catch (e) {
      console.error(`Admin ${confirmAction.type} failed:`, e);
    } finally {
      setProcessingAction(null);
    }
  };

  const getMilestoneStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
      case 'submitted': return <ArrowUpRight className="w-3.5 h-3.5 text-blue-500" />;
      case 'rejected': return <XCircle className="w-3.5 h-3.5 text-red-500" />;
      case 'pending': return <Clock className="w-3.5 h-3.5 text-orange-500" />;
      default: return <Lock className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, string> = {
      active: 'text-blue-400 bg-blue-500/10 border-blue-900/30',
      completed: 'text-green-400 bg-green-500/10 border-green-900/30',
      refunded: 'text-red-400 bg-red-500/10 border-red-900/30',
      open: 'text-yellow-400 bg-yellow-500/10 border-yellow-900/30',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${configs[status] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-orange-500" /> Escrow Management
          </h2>
          <p className="text-slate-400 text-sm mt-1">Monitor, release, and refund on-chain escrow contracts.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Escrows', value: stats.totalEscrows, color: 'text-white', icon: <Shield className="w-4 h-4 text-orange-500" /> },
          { label: 'Active', value: stats.activeEscrows, color: 'text-blue-400', icon: <Play className="w-4 h-4 text-blue-500" /> },
          { label: 'Disputed', value: stats.disputed, color: 'text-red-400', icon: <AlertTriangle className="w-4 h-4 text-red-500" /> },
          { label: 'Completed', value: stats.completed, color: 'text-green-400', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
          { label: 'Refunded', value: stats.refunded, color: 'text-yellow-400', icon: <ArrowDownRight className="w-4 h-4 text-yellow-500" /> },
        ].map((s) => (
          <div key={s.label} className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              {s.icon}
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</span>
            </div>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'active', 'disputed', 'completed', 'refunded'] as EscrowFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
              filter === f
                ? 'bg-orange-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Escrow Projects Table */}
      {escrowProjects.length === 0 ? (
        <div className="bg-[#0b0f19] rounded-xl border border-slate-800 p-12 text-center">
          <Shield className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-400 mb-2">No Escrow Contracts</h3>
          <p className="text-sm text-slate-500">
            {filter === 'all' ? 'No funded escrows exist yet.' : `No ${filter} escrows found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {escrowProjects.map((project) => {
            const numId = Number(project.id);
            const isExpanded = expandedId === numId;
            const projectDisputes = adminDisputes.filter(d => d.projectId === numId && d.status === 'open');
            const usd = formatUSD(tokenToUsd(project.totalBudget, project.tokenType));

            return (
              <div key={project.id} className="bg-[#0b0f19] rounded-xl border border-slate-800 overflow-hidden">
                {/* Project Row */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => handleExpand(numId)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-orange-600/10 border border-orange-900/50 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-white text-sm truncate">{project.title}</span>
                        {getStatusBadge(project.status)}
                        {projectDisputes.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-900/30 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> {projectDisputes.length} dispute{projectDisputes.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                        <span>ID: #{project.id}</span>
                        {project.onChainId && <span>Chain: #{project.onChainId}</span>}
                        <span>C: {project.clientAddress?.slice(0, 10)}...</span>
                        <span>F: {project.freelancerAddress?.slice(0, 10) || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-black text-white">{usd}</div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {project.totalBudget.toLocaleString()} {project.tokenType}
                      </div>
                    </div>

                    {/* Mini milestone progress */}
                    <div className="flex gap-0.5">
                      {project.milestones.map((m, i) => (
                        <div
                          key={i}
                          className={`w-2 h-6 rounded-sm ${
                            m.status === 'approved' ? 'bg-green-500' :
                            m.status === 'submitted' ? 'bg-blue-500' :
                            m.status === 'refunded' ? 'bg-red-500' :
                            m.status === 'pending' ? 'bg-orange-500/40' :
                            'bg-slate-800'
                          }`}
                          title={`M${i+1}: ${m.status}`}
                        />
                      ))}
                    </div>

                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-900/30 p-6">
                    {loadingDetail ? (
                      <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading escrow details...
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Escrow Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Escrow TX</div>
                            <span className="text-xs font-mono text-slate-400 break-all">
                              {(project as any).escrowTxId || '—'}
                            </span>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">On-Chain ID</div>
                            <span className="text-sm font-mono text-white">{project.onChainId ?? '—'}</span>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Token</div>
                            <span className="text-sm font-bold text-orange-400">{project.tokenType}</span>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Created</div>
                            <span className="text-xs text-slate-400">{new Date(project.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Milestone Cards with Admin Actions */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Zap className="w-4 h-4 text-orange-500" />
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Milestone Escrow Breakdown</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {project.milestones.map((milestone, idx) => {
                              const msNum = idx + 1;
                              const msSubs = (detailData?.submissions || []).filter(s => s.milestoneNum === msNum);
                              const latestSub = msSubs.length > 0
                                ? msSubs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0]
                                : null;
                              const msDispute = (detailData?.disputes || []).find(
                                d => d.milestoneNum === msNum && d.status === 'open'
                              );

                              return (
                                <div key={msNum} className="bg-[#0b0f19] border border-slate-800 rounded-xl p-4">
                                  {/* Header */}
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      {getMilestoneStatusIcon(milestone.status)}
                                      <span className="text-xs font-bold text-white">M{msNum}</span>
                                    </div>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                      milestone.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                                      milestone.status === 'submitted' ? 'bg-blue-500/10 text-blue-400' :
                                      milestone.status === 'refunded' ? 'bg-red-500/10 text-red-500' :
                                      milestone.status === 'pending' ? 'bg-orange-500/10 text-orange-400' :
                                      'bg-slate-800 text-slate-500'
                                    }`}>
                                      {milestone.status}
                                    </span>
                                  </div>

                                  <p className="text-xs text-slate-400 mb-1 truncate" title={milestone.title}>{milestone.title}</p>
                                  <p className="text-sm font-mono font-bold text-white mb-3">
                                    {milestone.amount.toFixed(4)} <span className="text-orange-400">{project.tokenType}</span>
                                  </p>

                                  {/* Dispute Warning */}
                                  {msDispute && (
                                    <div className="mb-3 p-2 rounded bg-red-950/30 border border-red-900/30">
                                      <div className="flex items-center gap-1 text-[10px] font-bold text-red-400 mb-1">
                                        <AlertTriangle className="w-3 h-3" /> DISPUTE ACTIVE
                                      </div>
                                      <p className="text-[10px] text-red-300/70 line-clamp-2">{msDispute.reason}</p>
                                    </div>
                                  )}

                                  {/* Latest Submission */}
                                  {latestSub && (
                                    <div className="mb-3 p-2 rounded bg-slate-800/50 border border-slate-700/50">
                                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mb-1">
                                        <FileText className="w-3 h-3" /> Submission ({latestSub.status})
                                      </div>
                                      <a
                                        href={latestSub.deliverableUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-1 truncate"
                                      >
                                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                        {latestSub.deliverableUrl}
                                      </a>
                                      {latestSub.completionTxId && (
                                        <p className="text-[9px] font-mono text-slate-600 mt-1 truncate" title={latestSub.completionTxId}>
                                          TX: {latestSub.completionTxId}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* Admin Actions */}
                                  {milestone.status !== 'approved' && milestone.status !== 'refunded' && (
                                    <div className="flex gap-2 mt-auto">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setConfirmAction({
                                            type: 'release',
                                            projectId: numId,
                                            milestoneNum: msNum,
                                            title: `Force Release M${msNum} — ${project.title}`,
                                          });
                                          setTxIdInput('');
                                        }}
                                        disabled={!!processingAction}
                                        className="flex-1 px-2 py-1.5 bg-green-600/10 hover:bg-green-600/20 text-green-500 border border-green-600/20 rounded text-[10px] font-bold uppercase transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                      >
                                        <DollarSign className="w-3 h-3" /> Release
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setConfirmAction({
                                            type: 'refund',
                                            projectId: numId,
                                            title: `Force Refund — ${project.title}`,
                                          });
                                          setTxIdInput('');
                                        }}
                                        disabled={!!processingAction}
                                        className="flex-1 px-2 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/20 rounded text-[10px] font-bold uppercase transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                      >
                                        <ArrowDownRight className="w-3 h-3" /> Refund
                                      </button>
                                    </div>
                                  )}

                                  {milestone.status === 'approved' && (
                                    <div className="text-center py-2 text-[10px] text-green-500 font-bold flex items-center justify-center gap-1">
                                      <CheckCircle className="w-3 h-3" /> Released
                                    </div>
                                  )}

                                  {milestone.status === 'refunded' && (
                                    <div className="text-center py-2 text-[10px] text-red-500 font-bold flex items-center justify-center gap-1">
                                      <ArrowDownRight className="w-3 h-3" /> Refunded
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* All Submissions for this project */}
                        {detailData && detailData.submissions.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-slate-500" /> Submission History ({detailData.submissions.length})
                            </h4>
                            <div className="bg-[#0b0f19] rounded-lg border border-slate-800 overflow-hidden">
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-800">
                                    <th className="px-4 py-2">MS</th>
                                    <th className="px-4 py-2">Deliverable</th>
                                    <th className="px-4 py-2">Status</th>
                                    <th className="px-4 py-2">Submitted</th>
                                    <th className="px-4 py-2">TX</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                  {detailData.submissions
                                    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                                    .map((sub) => (
                                    <tr key={sub.id} className="text-xs">
                                      <td className="px-4 py-2 font-mono text-slate-400">M{sub.milestoneNum}</td>
                                      <td className="px-4 py-2">
                                        <a href={sub.deliverableUrl} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline truncate block max-w-[200px]">
                                          {sub.deliverableUrl}
                                        </a>
                                      </td>
                                      <td className="px-4 py-2">
                                        <span className={`text-[10px] font-bold uppercase ${
                                          sub.status === 'approved' ? 'text-green-500' :
                                          sub.status === 'submitted' ? 'text-blue-400' :
                                          sub.status === 'rejected' ? 'text-red-500' :
                                          'text-slate-500'
                                        }`}>
                                          {sub.status}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 text-slate-500">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                                      <td className="px-4 py-2 text-[10px] font-mono text-slate-600 truncate max-w-[100px]" title={sub.completionTxId || ''}>
                                        {sub.completionTxId ? sub.completionTxId.slice(0, 12) + '...' : '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmAction(null)}>
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center gap-3 mb-2">
                {confirmAction.type === 'release'
                  ? <DollarSign className="w-5 h-5 text-green-500" />
                  : <ArrowDownRight className="w-5 h-5 text-red-500" />}
                <h3 className="text-lg font-bold text-white">
                  {confirmAction.type === 'release' ? 'Force Release' : 'Force Refund'}
                </h3>
              </div>
              <p className="text-sm text-slate-400">{confirmAction.title}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-3">
                <p className="text-xs text-yellow-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Admin Override
                </p>
                <p className="text-[10px] text-yellow-400/70 mt-1">
                  {confirmAction.type === 'release'
                    ? 'This will mark the milestone as approved and release funds to the freelancer. Ensure you have executed the on-chain transaction first.'
                    : 'This will mark the entire project as refunded. Ensure you have executed the on-chain refund transaction first.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  On-Chain Transaction ID *
                </label>
                <input
                  type="text"
                  value={txIdInput}
                  onChange={(e) => setTxIdInput(e.target.value)}
                  placeholder="0x... or paste the on-chain TX hash"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-white placeholder-slate-600 focus:border-orange-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800">
              <button
                onClick={() => { setConfirmAction(null); setTxIdInput(''); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={!!processingAction || !txIdInput.trim()}
                className={`px-6 py-2 text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  confirmAction.type === 'release'
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                {processingAction ? 'Processing...' : `Confirm ${confirmAction.type === 'release' ? 'Release' : 'Refund'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEscrow;
