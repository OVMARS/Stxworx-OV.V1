import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, RotateCcw, RefreshCw, Eye, X, Shield, Clock, FileText, ExternalLink } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import type { BackendDispute } from '../../lib/api';

type ModalMode = 'resolve' | 'reset' | null;

const AdminDisputes: React.FC = () => {
   const { adminDisputes, fetchAdminDisputes, adminResolveDispute, adminResetDispute } = useAppStore();
   const [filter, setFilter] = useState<'all' | 'open' | 'resolved' | 'reset'>('all');
   const [selectedDispute, setSelectedDispute] = useState<BackendDispute | null>(null);
   const [modalMode, setModalMode] = useState<ModalMode>(null);
   const [resolution, setResolution] = useState('');
   const [resolutionTxId, setResolutionTxId] = useState('');
   const [favorFreelancer, setFavorFreelancer] = useState(true);
   const [processing, setProcessing] = useState(false);
   const [refreshing, setRefreshing] = useState(false);

   useEffect(() => {
      fetchAdminDisputes();
   }, []);

   const handleRefresh = async () => {
      setRefreshing(true);
      try { await fetchAdminDisputes(); } finally { setRefreshing(false); }
   };

   const openModal = (dispute: BackendDispute, mode: ModalMode) => {
      setSelectedDispute(dispute);
      setModalMode(mode);
      setResolution('');
      setResolutionTxId('');
      setFavorFreelancer(true);
   };

   const closeModal = () => {
      setSelectedDispute(null);
      setModalMode(null);
      setResolution('');
      setResolutionTxId('');
      setFavorFreelancer(true);
   };

   const handleSubmit = async () => {
      if (!selectedDispute || !modalMode || !resolution.trim() || !resolutionTxId.trim()) return;
      setProcessing(true);
      try {
         if (modalMode === 'resolve') {
            await adminResolveDispute(selectedDispute.id, resolution, resolutionTxId, favorFreelancer);
         } else {
            await adminResetDispute(selectedDispute.id, resolution, resolutionTxId);
         }
         closeModal();
      } catch (e) {
         console.error(`Failed to ${modalMode} dispute:`, e);
      } finally {
         setProcessing(false);
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
      if (!addr) return '—';
      if (addr.length <= 16) return addr;
      return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
   };

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         {/* Header */}
         <div className="flex justify-between items-center">
            <div>
               <h2 className="text-2xl font-black text-white uppercase tracking-tight">Disputes</h2>
               <p className="text-slate-400 text-sm">Review and resolve on-chain project disputes.</p>
            </div>
            <button
               onClick={handleRefresh}
               disabled={refreshing}
               className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
               <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
         </div>

         {/* Summary Stats */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
         <div className="flex gap-2">
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
            <div className="bg-[#0b0f19] rounded-xl border border-slate-800 overflow-hidden">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800 bg-slate-900/50">
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Project</th>
                        <th className="px-6 py-4">Milestone</th>
                        <th className="px-6 py-4">Reason</th>
                        <th className="px-6 py-4">Filed</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                     {filtered.map((dispute) => (
                        <tr key={dispute.id} className="hover:bg-slate-800/30 transition-colors">
                           <td className="px-6 py-4 text-xs font-mono text-slate-500">#{dispute.id}</td>
                           <td className="px-6 py-4">
                              <span className="font-bold text-white">Project #{dispute.projectId}</span>
                           </td>
                           <td className="px-6 py-4">
                              <span className="text-sm text-slate-300">MS #{dispute.milestoneNum}</span>
                           </td>
                           <td className="px-6 py-4">
                              <p className="text-sm text-slate-300 max-w-[200px] truncate" title={dispute.reason}>
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
                                          title="Resolve dispute"
                                          className="px-3 py-1.5 bg-green-600/10 hover:bg-green-600/20 text-green-500 border border-green-600/20 rounded text-[10px] font-bold uppercase transition-colors"
                                       >
                                          Resolve
                                       </button>
                                       <button
                                          onClick={() => openModal(dispute, 'reset')}
                                          title="Reset dispute"
                                          className="px-3 py-1.5 bg-yellow-600/10 hover:bg-yellow-600/20 text-yellow-500 border border-yellow-600/20 rounded text-[10px] font-bold uppercase transition-colors"
                                       >
                                          Reset
                                       </button>
                                    </>
                                 )}
                                 {dispute.status !== 'open' && dispute.resolution && (
                                    <button
                                       onClick={() => { setSelectedDispute(dispute); setModalMode(null); }}
                                       title="View resolution"
                                       className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors"
                                    >
                                       <Eye className="w-4 h-4" />
                                    </button>
                                 )}
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}

         {/* Modal — Resolve / Reset / View */}
         {selectedDispute && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
               <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b border-slate-800">
                     <div className="flex items-center gap-3">
                        {modalMode === 'resolve' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {modalMode === 'reset' && <RotateCcw className="w-5 h-5 text-yellow-500" />}
                        {modalMode === null && <Eye className="w-5 h-5 text-slate-400" />}
                        <h3 className="text-lg font-bold text-white">
                           {modalMode === 'resolve' ? 'Resolve Dispute' : modalMode === 'reset' ? 'Reset Dispute' : 'Dispute Details'}
                        </h3>
                     </div>
                     <button onClick={closeModal} className="text-slate-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                     </button>
                  </div>

                  {/* Dispute Info */}
                  <div className="p-6 space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Dispute ID</div>
                           <div className="text-sm text-white font-mono">#{selectedDispute.id}</div>
                        </div>
                        <div>
                           <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Project</div>
                           <div className="text-sm text-white font-mono">#{selectedDispute.projectId}</div>
                        </div>
                        <div>
                           <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Milestone</div>
                           <div className="text-sm text-white">MS #{selectedDispute.milestoneNum}</div>
                        </div>
                        <div>
                           <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</div>
                           {getStatusBadge(selectedDispute.status)}
                        </div>
                     </div>

                     <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reason</div>
                        <p className="text-sm text-slate-300 bg-slate-900 rounded-lg p-3 border border-slate-800">{selectedDispute.reason}</p>
                     </div>

                     {selectedDispute.evidenceUrl && (
                        <div>
                           <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Evidence</div>
                           <a
                              href={selectedDispute.evidenceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-orange-500 hover:text-orange-400 flex items-center gap-1"
                           >
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

                     {/* View mode — show existing resolution */}
                     {modalMode === null && selectedDispute.resolution && (
                        <div>
                           <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Resolution</div>
                           <p className="text-sm text-slate-300 bg-slate-900 rounded-lg p-3 border border-slate-800">{selectedDispute.resolution}</p>
                           {selectedDispute.resolutionTxId && (
                              <div className="mt-2">
                                 <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Resolution Tx</div>
                                 <span className="text-xs font-mono text-slate-400 break-all">{selectedDispute.resolutionTxId}</span>
                              </div>
                           )}
                        </div>
                     )}

                     {/* Action mode — resolution form */}
                     {modalMode && (
                        <>
                           {/* Favor Freelancer toggle — only for resolve */}
                           {modalMode === 'resolve' && (
                              <div>
                                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    <Shield className="w-3 h-3 inline mr-1" />
                                    Funds Decision *
                                 </label>
                                 <div className="flex gap-3">
                                    <button
                                       type="button"
                                       onClick={() => setFavorFreelancer(true)}
                                       className={`flex-1 px-4 py-3 rounded-lg border text-sm font-bold transition-all ${
                                          favorFreelancer
                                             ? 'bg-green-600/20 border-green-500 text-green-400'
                                             : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                       }`}
                                    >
                                       <div className="text-center">
                                          <div>Release to Freelancer</div>
                                          <div className="text-[10px] mt-1 opacity-70">Milestone funds sent to freelancer</div>
                                       </div>
                                    </button>
                                    <button
                                       type="button"
                                       onClick={() => setFavorFreelancer(false)}
                                       className={`flex-1 px-4 py-3 rounded-lg border text-sm font-bold transition-all ${
                                          !favorFreelancer
                                             ? 'bg-orange-600/20 border-orange-500 text-orange-400'
                                             : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                       }`}
                                    >
                                       <div className="text-center">
                                          <div>Refund to Client</div>
                                          <div className="text-[10px] mt-1 opacity-70">Milestone funds returned to client</div>
                                       </div>
                                    </button>
                                 </div>
                              </div>
                           )}
                           <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                 <FileText className="w-3 h-3 inline mr-1" />
                                 Resolution Notes *
                              </label>
                              <textarea
                                 value={resolution}
                                 onChange={(e) => setResolution(e.target.value)}
                                 placeholder={modalMode === 'resolve'
                                    ? 'Describe how the dispute was resolved (e.g., funds released to freelancer after review)...'
                                    : 'Describe why the dispute is being reset (e.g., milestone needs rework)...'}
                                 rows={3}
                                 className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-white placeholder-slate-600 focus:border-orange-500 focus:outline-none resize-none"
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                 <Shield className="w-3 h-3 inline mr-1" />
                                 Resolution Transaction ID *
                              </label>
                              <input
                                 type="text"
                                 value={resolutionTxId}
                                 onChange={(e) => setResolutionTxId(e.target.value)}
                                 placeholder="On-chain tx ID (e.g., 0x1234...abcd)"
                                 className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-white placeholder-slate-600 focus:border-orange-500 focus:outline-none font-mono"
                              />
                           </div>
                        </>
                     )}
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800">
                     <button
                        onClick={closeModal}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition-colors"
                     >
                        {modalMode ? 'Cancel' : 'Close'}
                     </button>
                     {modalMode && (
                        <button
                           onClick={handleSubmit}
                           disabled={processing || !resolution.trim() || !resolutionTxId.trim()}
                           className={`px-6 py-2 text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              modalMode === 'resolve'
                                 ? 'bg-green-600 hover:bg-green-500 text-white'
                                 : 'bg-yellow-600 hover:bg-yellow-500 text-white'
                           }`}
                        >
                           {processing
                              ? 'Processing...'
                              : modalMode === 'resolve'
                                 ? 'Confirm Resolve'
                                 : 'Confirm Reset'}
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
