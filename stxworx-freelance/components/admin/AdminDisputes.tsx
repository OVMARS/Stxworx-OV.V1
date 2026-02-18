import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, RotateCcw, RefreshCw, Eye, X, Shield, FileText, ExternalLink, Wallet, ArrowRight, Ban } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useWallet } from '../wallet/WalletProvider';
import { adminResolveDisputeContractCall, adminForceRefundContractCall } from '../../lib/contracts';
import type { BackendDispute, BackendProject } from '../../lib/api';

type ModalMode = 'resolve' | 'force-refund' | 'view' | null;

const AdminDisputes: React.FC = () => {
   const {
      adminDisputes, fetchAdminDisputes,
      adminResolveDispute, adminResetDispute,
      adminProjects, fetchAdminProjects,
      adminForceRefund,
   } = useAppStore();
   const { isSignedIn, userAddress } = useWallet();

   const [filter, setFilter] = useState<'all' | 'open' | 'resolved' | 'reset'>('all');
   const [selectedDispute, setSelectedDispute] = useState<BackendDispute | null>(null);
   const [modalMode, setModalMode] = useState<ModalMode>(null);
   const [resolution, setResolution] = useState('');
   const [favorFreelancer, setFavorFreelancer] = useState(true);
   const [processing, setProcessing] = useState(false);
   const [refreshing, setRefreshing] = useState(false);
   const [txStatus, setTxStatus] = useState<'idle' | 'signing' | 'submitted' | 'error'>('idle');
   const [txError, setTxError] = useState('');

   useEffect(() => {
      fetchAdminDisputes();
      fetchAdminProjects();
   }, []);

   // Lookup the project for a dispute to get tokenType and onChainId
   const getProjectForDispute = (dispute: BackendDispute): BackendProject | undefined => {
      return adminProjects.find(p => p.id === dispute.projectId);
   };

   const handleRefresh = async () => {
      setRefreshing(true);
      try {
         await Promise.all([fetchAdminDisputes(), fetchAdminProjects()]);
      } finally { setRefreshing(false); }
   };

   const openModal = (dispute: BackendDispute, mode: ModalMode) => {
      setSelectedDispute(dispute);
      setModalMode(mode);
      setResolution('');
      setFavorFreelancer(true);
      setTxStatus('idle');
      setTxError('');
   };

   const closeModal = () => {
      setSelectedDispute(null);
      setModalMode(null);
      setResolution('');
      setFavorFreelancer(true);
      setTxStatus('idle');
      setTxError('');
   };

   /* -- RESOLVE DISPUTE -- on-chain signing */
   const handleResolveDispute = async () => {
      if (!selectedDispute || !resolution.trim()) return;
      const project = getProjectForDispute(selectedDispute);
      if (!project?.onChainId) {
         setTxError('Project has no on-chain ID. Cannot sign contract.');
         return;
      }
      if (!isSignedIn || !userAddress) {
         setTxError('Admin wallet not connected. Connect your wallet first.');
         return;
      }

      setProcessing(true);
      setTxStatus('signing');
      setTxError('');

      try {
         await adminResolveDisputeContractCall(
            project.onChainId,
            selectedDispute.milestoneNum,
            favorFreelancer,
            project.tokenType,
            // onFinish -- wallet signed successfully
            async (txData: any) => {
               const txId = txData.txId || txData.txid || '';
               setTxStatus('submitted');
               try {
                  // Save to backend with the real tx ID
                  await adminResolveDispute(
                     selectedDispute.id,
                     resolution,
                     txId,
                     favorFreelancer
                  );
                  // Auto-close after brief success display
                  setTimeout(() => {
                     closeModal();
                     fetchAdminDisputes();
                  }, 1500);
               } catch (e) {
                  console.error('Backend save failed after signing:', e);
                  setTxError(`Contract signed (tx: ${txId.slice(0, 12)}...) but backend save failed. Save this TX ID and resolve manually.`);
                  setTxStatus('error');
               } finally {
                  setProcessing(false);
               }
            },
            // onCancel -- user rejected wallet popup
            () => {
               setTxStatus('idle');
               setTxError('Transaction cancelled by admin.');
               setProcessing(false);
            }
         );
      } catch (e: any) {
         setTxStatus('error');
         setTxError(e?.message || 'Failed to open wallet for signing.');
         setProcessing(false);
      }
   };

   /* -- FORCE REFUND -- on-chain signing */
   const handleForceRefund = async () => {
      if (!selectedDispute || !resolution.trim()) return;
      const project = getProjectForDispute(selectedDispute);
      if (!project?.onChainId) {
         setTxError('Project has no on-chain ID. Cannot sign contract.');
         return;
      }
      if (!isSignedIn || !userAddress) {
         setTxError('Admin wallet not connected. Connect your wallet first.');
         return;
      }

      setProcessing(true);
      setTxStatus('signing');
      setTxError('');

      try {
         await adminForceRefundContractCall(
            project.onChainId,
            project.tokenType,
            // onFinish
            async (txData: any) => {
               const txId = txData.txId || txData.txid || '';
               setTxStatus('submitted');
               try {
                  await adminForceRefund(project.id, txId);
                  setTimeout(() => {
                     closeModal();
                     fetchAdminDisputes();
                     fetchAdminProjects();
                  }, 1500);
               } catch (e) {
                  console.error('Backend save failed after force refund:', e);
                  setTxError(`Contract signed (tx: ${txId.slice(0, 12)}...) but backend save failed. Save this TX ID.`);
                  setTxStatus('error');
               } finally {
                  setProcessing(false);
               }
            },
            // onCancel
            () => {
               setTxStatus('idle');
               setTxError('Transaction cancelled by admin.');
               setProcessing(false);
            }
         );
      } catch (e: any) {
         setTxStatus('error');
         setTxError(e?.message || 'Failed to open wallet for signing.');
         setProcessing(false);
      }
   };

   /* -- RESET DISPUTE (off-chain only -- admin resets milestone back to open) */
   const handleResetDispute = async (dispute: BackendDispute) => {
      const reason = prompt('Reset reason (this milestone goes back to normal workflow):');
      if (!reason?.trim()) return;
      try {
         await adminResetDispute(dispute.id, reason, 'reset-no-tx');
         fetchAdminDisputes();
      } catch (e) {
         console.error('Failed to reset dispute:', e);
      }
   };

   const filtered = adminDisputes.filter((d) => filter === 'all' || d.status === filter);
   const openCount = adminDisputes.filter((d) => d.status === 'open').length;
   const resolvedCount = adminDisputes.filter((d) => d.status === 'resolved').length;
   const resetCount = adminDisputes.filter((d) => d.status === 'reset').length;

   const getStatusBadge = (status: string) => {
      switch (status) {
         case 'open':
            return <span className="text-red-500 bg-red-500/10 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Open</span>;
         case 'resolved':
            return <span className="text-green-500 bg-green-500/10 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Resolved</span>;
         case 'reset':
            return <span className="text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Reset</span>;
         default:
            return <span className="text-slate-400 bg-slate-800 px-2 py-1 rounded text-[10px] font-bold uppercase">{status}</span>;
      }
   };

   const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
   };

   const truncateAddress = (addr: string | null) => {
      if (!addr) return '\u2014';
      if (addr.length <= 16) return addr;
      return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
   };

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         {/* Header */}
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
               <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Disputes</h2>
               <p className="text-slate-400 text-xs sm:text-sm">Review and resolve on-chain project disputes. Actions require wallet signing.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
               {/* Wallet status indicator */}
               {isSignedIn && userAddress ? (
                  <div className="flex items-center gap-1.5 bg-green-950/30 border border-green-900/30 rounded-lg px-3 py-1.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                     <Wallet className="w-3 h-3 text-green-500" />
                     <span className="text-[10px] font-mono text-green-400">{userAddress.slice(0, 6)}...{userAddress.slice(-4)}</span>
                  </div>
               ) : (
                  <div className="flex items-center gap-1.5 bg-red-950/30 border border-red-900/30 rounded-lg px-3 py-1.5">
                     <Wallet className="w-3 h-3 text-red-500" />
                     <span className="text-[10px] font-bold text-red-400 uppercase">No Wallet</span>
                  </div>
               )}
               <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-50"
               >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
               </button>
            </div>
         </div>

         {/* Summary Stats */}
         <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800">
               <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Open</span>
               </div>
               <div className="text-2xl font-black text-red-500">{openCount}</div>
            </div>
            <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800">
               <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolved</span>
               </div>
               <div className="text-2xl font-black text-green-500">{resolvedCount}</div>
            </div>
            <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800">
               <div className="flex items-center gap-2 mb-1">
                  <RotateCcw className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reset</span>
               </div>
               <div className="text-2xl font-black text-yellow-500">{resetCount}</div>
            </div>
         </div>

         {/* Filter Tabs */}
         <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {(['all', 'open', 'resolved', 'reset'] as const).map((f) => (
               <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                     filter === f
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
               >
                  {f} {f === 'open' ? `(${openCount})` : f === 'resolved' ? `(${resolvedCount})` : f === 'reset' ? `(${resetCount})` : `(${adminDisputes.length})`}
               </button>
            ))}
         </div>

         {/* Disputes Table */}
         {filtered.length === 0 ? (
            <div className="bg-[#0b0f19] rounded-xl border border-slate-800 p-12 text-center">
               <Shield className="w-12 h-12 text-slate-700 mx-auto mb-4" />
               <h3 className="text-lg font-bold text-slate-400 mb-2">No Disputes</h3>
               <p className="text-sm text-slate-500">
                  {filter === 'all' ? 'No disputes have been filed yet.' : `No ${filter} disputes found.`}
               </p>
            </div>
         ) : (
            <div className="bg-[#0b0f19] rounded-xl border border-slate-800 overflow-x-auto">
               <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                     <tr className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800 bg-slate-900/50">
                        <th className="px-3 sm:px-6 py-3 sm:py-4">ID</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4">Project</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4">Milestone</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4">Token</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4">Reason</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4">Filed</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4">Status</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                     {filtered.map((dispute) => {
                        const project = getProjectForDispute(dispute);
                        return (
                           <tr key={dispute.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4 text-xs font-mono text-slate-500">#{dispute.id}</td>
                              <td className="px-6 py-4">
                                 <div>
                                    <span className="font-bold text-white">Project #{dispute.projectId}</span>
                                    {project?.onChainId && (
                                       <span className="text-[10px] text-slate-600 ml-1">(chain #{project.onChainId})</span>
                                    )}
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <span className="text-sm text-slate-300">MS #{dispute.milestoneNum}</span>
                              </td>
                              <td className="px-6 py-4">
                                 <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                                    project?.tokenType === 'sBTC'
                                       ? 'text-orange-400 bg-orange-500/10'
                                       : 'text-blue-400 bg-blue-500/10'
                                 }`}>
                                    {project?.tokenType || '\u2014'}
                                 </span>
                              </td>
                              <td className="px-6 py-4">
                                 <p className="text-sm text-slate-300 max-w-[180px] truncate" title={dispute.reason}>
                                    {dispute.reason}
                                 </p>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex flex-col gap-0.5">
                                    <span className="text-xs text-slate-400">{formatDate(dispute.createdAt)}</span>
                                    {dispute.disputeTxId && (
                                       <span className="text-[10px] font-mono text-slate-600" title={dispute.disputeTxId}>
                                          tx: {truncateAddress(dispute.disputeTxId)}
                                       </span>
                                    )}
                                 </div>
                              </td>
                              <td className="px-6 py-4">{getStatusBadge(dispute.status)}</td>
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-2 justify-end">
                                    {dispute.status === 'open' && (
                                       <>
                                          <button
                                             onClick={() => openModal(dispute, 'resolve')}
                                             title="Resolve dispute on-chain"
                                             className="px-3 py-1.5 bg-green-600/10 hover:bg-green-600/20 text-green-500 border border-green-600/20 rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-1"
                                          >
                                             <Wallet className="w-3 h-3" /> Resolve
                                          </button>
                                          <button
                                             onClick={() => openModal(dispute, 'force-refund')}
                                             title="Force refund entire project to client"
                                             className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/20 rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-1"
                                          >
                                             <Ban className="w-3 h-3" /> Force Refund
                                          </button>
                                          <button
                                             onClick={() => handleResetDispute(dispute)}
                                             title="Reset dispute (no fund movement)"
                                             className="px-3 py-1.5 bg-yellow-600/10 hover:bg-yellow-600/20 text-yellow-500 border border-yellow-600/20 rounded text-[10px] font-bold uppercase transition-colors"
                                          >
                                             Reset
                                          </button>
                                       </>
                                    )}
                                    {dispute.status !== 'open' && dispute.resolution && (
                                       <button
                                          onClick={() => openModal(dispute, 'view')}
                                          title="View resolution"
                                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors"
                                       >
                                          <Eye className="w-4 h-4" />
                                       </button>
                                    )}
                                 </div>
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         )}

         {/* ======= MODAL ======= */}
         {selectedDispute && modalMode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
               <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b border-slate-800">
                     <div className="flex items-center gap-3">
                        {modalMode === 'resolve' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {modalMode === 'force-refund' && <Ban className="w-5 h-5 text-red-500" />}
                        {modalMode === 'view' && <Eye className="w-5 h-5 text-slate-400" />}
                        <h3 className="text-lg font-bold text-white">
                           {modalMode === 'resolve' ? 'Resolve Dispute On-Chain' : modalMode === 'force-refund' ? 'Force Refund Project' : 'Dispute Details'}
                        </h3>
                     </div>
                     <button onClick={closeModal} className="text-slate-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                     </button>
                  </div>

                  {/* Dispute Info */}
                  <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                     {/* Project & Milestone Details */}
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Dispute ID</div>
                           <div className="text-sm text-white font-mono">#{selectedDispute.id}</div>
                        </div>
                        <div>
                           <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Project</div>
                           <div className="text-sm text-white font-mono">
                              #{selectedDispute.projectId}
                              {(() => {
                                 const p = getProjectForDispute(selectedDispute);
                                 return p?.onChainId ? <span className="text-slate-500 ml-1">(chain #{p.onChainId})</span> : null;
                              })()}
                           </div>
                        </div>
                        <div>
                           <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Milestone</div>
                           <div className="text-sm text-white">MS #{selectedDispute.milestoneNum}</div>
                        </div>
                        <div>
                           <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Token Type</div>
                           {(() => {
                              const p = getProjectForDispute(selectedDispute);
                              return (
                                 <span className={`text-sm font-bold ${p?.tokenType === 'sBTC' ? 'text-orange-400' : 'text-blue-400'}`}>
                                    {p?.tokenType || 'Unknown'}
                                 </span>
                              );
                           })()}
                        </div>
                     </div>

                     <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reason</div>
                        <p className="text-sm text-slate-300 bg-slate-900 rounded-lg p-3 border border-slate-800">{selectedDispute.reason}</p>
                     </div>

                     {selectedDispute.evidenceUrl && (
                        <div>
                           <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Evidence</div>
                           <a href={selectedDispute.evidenceUrl} target="_blank" rel="noopener noreferrer"
                              className="text-sm text-orange-500 hover:text-orange-400 flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" /> View Evidence
                           </a>
                        </div>
                     )}

                     {selectedDispute.disputeTxId && (
                        <div>
                           <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Dispute Tx</div>
                           <span className="text-xs font-mono text-slate-400 break-all">{selectedDispute.disputeTxId}</span>
                        </div>
                     )}

                     {/* -- VIEW MODE -- existing resolution */}
                     {modalMode === 'view' && selectedDispute.resolution && (
                        <>
                           <div>
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Resolution</div>
                              <p className="text-sm text-slate-300 bg-slate-900 rounded-lg p-3 border border-slate-800">{selectedDispute.resolution}</p>
                           </div>
                           {selectedDispute.resolutionTxId && (
                              <div>
                                 <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Resolution Tx</div>
                                 <span className="text-xs font-mono text-slate-400 break-all">{selectedDispute.resolutionTxId}</span>
                              </div>
                           )}
                        </>
                     )}

                     {/* -- RESOLVE MODE -- choose recipient + notes */}
                     {modalMode === 'resolve' && (
                        <>
                           {/* Smart contract info */}
                           <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
                              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Smart Contract Action</div>
                              <div className="text-xs text-slate-400">
                                 Calls <span className="font-mono text-orange-400">admin-resolve-dispute-{getProjectForDispute(selectedDispute)?.tokenType === 'sBTC' ? 'sbtc' : 'stx'}</span> {'\u2014 '}
                                 Sends milestone {selectedDispute.milestoneNum} funds to the chosen party. Your wallet will sign this transaction.
                              </div>
                           </div>

                           {/* Funds Decision */}
                           <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                 <Shield className="w-3 h-3 inline mr-1" />
                                 Release Funds To *
                              </label>
                              <div className="flex gap-3">
                                 <button type="button" onClick={() => setFavorFreelancer(true)}
                                    className={`flex-1 px-4 py-3 rounded-lg border text-sm font-bold transition-all ${
                                       favorFreelancer
                                          ? 'bg-green-600/20 border-green-500 text-green-400 shadow-lg shadow-green-900/10'
                                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                    }`}>
                                    <div className="text-center">
                                       <div className="flex items-center justify-center gap-1"><ArrowRight className="w-3 h-3" /> Freelancer</div>
                                       <div className="text-[10px] mt-1 opacity-70">release-to-freelancer: true</div>
                                    </div>
                                 </button>
                                 <button type="button" onClick={() => setFavorFreelancer(false)}
                                    className={`flex-1 px-4 py-3 rounded-lg border text-sm font-bold transition-all ${
                                       !favorFreelancer
                                          ? 'bg-orange-600/20 border-orange-500 text-orange-400 shadow-lg shadow-orange-900/10'
                                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                    }`}>
                                    <div className="text-center">
                                       <div className="flex items-center justify-center gap-1"><ArrowRight className="w-3 h-3 rotate-180" /> Client</div>
                                       <div className="text-[10px] mt-1 opacity-70">release-to-freelancer: false</div>
                                    </div>
                                 </button>
                              </div>
                           </div>

                           {/* Resolution Notes */}
                           <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                 <FileText className="w-3 h-3 inline mr-1" />
                                 Resolution Notes *
                              </label>
                              <textarea
                                 value={resolution}
                                 onChange={(e) => setResolution(e.target.value)}
                                 placeholder="Describe how the dispute was resolved and why funds go to the chosen party..."
                                 rows={3}
                                 className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-white placeholder-slate-600 focus:border-orange-500 focus:outline-none resize-none"
                              />
                           </div>
                        </>
                     )}

                     {/* -- FORCE REFUND MODE -- */}
                     {modalMode === 'force-refund' && (
                        <>
                           {/* Warning */}
                           <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                 <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                 <div>
                                    <div className="text-sm font-bold text-red-400 mb-1">Force Refund {'\u2014'} Entire Project</div>
                                    <p className="text-xs text-red-400/70 leading-relaxed">
                                       This will refund <strong>ALL remaining unreleased milestone funds</strong> for Project #{selectedDispute.projectId} back to the client.
                                       This action is irreversible on-chain. Only use for abandoned or fraudulent projects.
                                    </p>
                                 </div>
                              </div>
                           </div>

                           {/* Smart contract info */}
                           <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
                              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Smart Contract Action</div>
                              <div className="text-xs text-slate-400">
                                 Calls <span className="font-mono text-red-400">admin-force-refund-{getProjectForDispute(selectedDispute)?.tokenType === 'sBTC' ? 'sbtc' : 'stx'}</span> {'\u2014 '}
                                 Returns all unreleased funds to the client. Requires project to be abandoned (~7 day timeout).
                              </div>
                           </div>

                           {/* Reason */}
                           <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                 <FileText className="w-3 h-3 inline mr-1" />
                                 Refund Reason *
                              </label>
                              <textarea
                                 value={resolution}
                                 onChange={(e) => setResolution(e.target.value)}
                                 placeholder="Explain why this project is being force-refunded (e.g., abandoned, fraudulent, unresponsive freelancer)..."
                                 rows={3}
                                 className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-white placeholder-slate-600 focus:border-orange-500 focus:outline-none resize-none"
                              />
                           </div>
                        </>
                     )}

                     {/* Tx Status Feedback */}
                     {txStatus === 'signing' && (
                        <div className="bg-orange-950/20 border border-orange-900/30 rounded-lg p-4 flex items-center gap-3">
                           <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
                           <div className="text-sm text-orange-400">Waiting for wallet signature... Check your Leather/Xverse popup.</div>
                        </div>
                     )}
                     {txStatus === 'submitted' && (
                        <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4 flex items-center gap-3">
                           <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                           <div className="text-sm text-green-400">Transaction submitted! Saving to backend...</div>
                        </div>
                     )}
                     {txError && (
                        <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4">
                           <div className="text-sm text-red-400">{txError}</div>
                        </div>
                     )}
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800">
                     <button onClick={closeModal}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition-colors">
                        {modalMode === 'view' ? 'Close' : 'Cancel'}
                     </button>

                     {modalMode === 'resolve' && (
                        <button
                           onClick={handleResolveDispute}
                           disabled={processing || !resolution.trim() || txStatus === 'submitted'}
                           className="px-6 py-2 text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-500 text-white flex items-center gap-2"
                        >
                           <Wallet className="w-4 h-4" />
                           {processing ? 'Signing...' : `Sign & Resolve \u2192 ${favorFreelancer ? 'Freelancer' : 'Client'}`}
                        </button>
                     )}

                     {modalMode === 'force-refund' && (
                        <button
                           onClick={handleForceRefund}
                           disabled={processing || !resolution.trim() || txStatus === 'submitted'}
                           className="px-6 py-2 text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-500 text-white flex items-center gap-2"
                        >
                           <Wallet className="w-4 h-4" />
                           {processing ? 'Signing...' : 'Sign & Force Refund'}
                        </button>
                     )}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default AdminDisputes;
