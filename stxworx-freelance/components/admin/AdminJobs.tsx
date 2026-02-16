
import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, AlertTriangle, Play, Shield, ChevronDown, ChevronUp, RefreshCw, AlertOctagon } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { mapBackendProject } from '../../lib/api';

const AdminJobs: React.FC = () => {
   const { adminProjects, fetchAdminProjects, adminForceRelease, adminForceRefund } = useAppStore();
   const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);
   const [processingId, setProcessingId] = useState<string | null>(null);
   const [statusFilter, setStatusFilter] = useState('');
   const [search, setSearch] = useState('');

   useEffect(() => {
      fetchAdminProjects();
   }, []);

   const handleRefresh = () => {
      fetchAdminProjects(statusFilter || search ? { status: statusFilter || undefined, search: search || undefined } : undefined);
   };

   const handleFilter = () => {
      fetchAdminProjects({ status: statusFilter || undefined, search: search || undefined });
   };

   const handleForceRelease = async (projectId: number, milestoneNum: number) => {
      const key = `${projectId}-${milestoneNum}`;
      setProcessingId(key);
      try {
         // In production, txId would come from an on-chain transaction
         const txId = `admin-release-${projectId}-ms${milestoneNum}-${Date.now()}`;
         await adminForceRelease(projectId, milestoneNum, txId);
      } catch (e) {
         console.error(e);
      } finally {
         setProcessingId(null);
      }
   };

   const handleForceRefund = async (projectId: number) => {
      setProcessingId(`refund-${projectId}`);
      try {
         const txId = `admin-refund-${projectId}-${Date.now()}`;
         await adminForceRefund(projectId, txId);
      } catch (e) {
         console.error(e);
      } finally {
         setProcessingId(null);
      }
   };

   const projects = adminProjects.map(mapBackendProject);

   const getStatusBadge = (status: string) => {
      if (status === 'disputed') return <span className="text-red-500 bg-red-500/10 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Disputed</span>;
      if (status === 'completed') return <span className="text-green-500 bg-green-500/10 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>;
      if (status === 'active' || status === 'funded') return <span className="text-blue-500 bg-blue-500/10 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Play className="w-3 h-3" /> Active</span>;
      return <span className="text-slate-500 bg-slate-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> {status}</span>;
   };

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="flex justify-between items-center">
            <div>
               <h2 className="text-2xl font-black text-white uppercase tracking-tight">Jobs Queue</h2>
               <p className="text-slate-400 text-sm">Monitor active escrow contracts and disputes.</p>
            </div>
            <div className="flex gap-2 items-center">
               <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-[#0b0f19] border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none w-40"
               />
               <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#0b0f19] border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
               >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="active">Active</option>
                  <option value="disputed">Disputed</option>
                  <option value="completed">Completed</option>
               </select>
               <button onClick={handleFilter} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold uppercase rounded-lg transition-colors">Go</button>
               <button onClick={handleRefresh} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                  <RefreshCw className="w-4 h-4" />
               </button>
            </div>
         </div>

         <div className="bg-[#0b0f19] rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800 bg-slate-900/50">
                     <th className="px-6 py-4">ID</th>
                     <th className="px-6 py-4">Title</th>
                     <th className="px-6 py-4">Parties</th>
                     <th className="px-6 py-4">Budget</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-800">
                  {projects.map((project) => {
                     const numId = Number(project.id);
                     return (
                     <React.Fragment key={project.id}>
                        <tr className={`hover:bg-slate-800/30 transition-colors ${expandedProjectId === numId ? 'bg-slate-800/20' : ''}`}>
                           <td className="px-6 py-4 text-xs font-mono text-slate-500">#{project.id}</td>
                           <td className="px-6 py-4">
                              <span className="font-bold text-white block">{project.title}</span>
                              <span className="text-xs text-slate-500">{project.category}</span>
                           </td>
                           <td className="px-6 py-4 text-xs text-slate-400">
                              <div className="flex flex-col gap-1">
                                 <span title={project.clientAddress}>C: {project.clientAddress?.slice(0, 10)}...</span>
                                 <span title={project.freelancerAddress}>F: {project.freelancerAddress?.slice(0, 10) || 'Unassigned'}...</span>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-2 font-mono text-white">
                                 <Shield className="w-3 h-3 text-orange-500" />
                                 {project.totalBudget} {project.tokenType}
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              {getStatusBadge(project.status)}
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button
                                 onClick={() => setExpandedProjectId(expandedProjectId === numId ? null : numId)}
                                 className="text-slate-400 hover:text-white flex items-center gap-1 ml-auto text-xs font-bold uppercase tracking-wider"
                              >
                                 {expandedProjectId === numId ? 'Hide Details' : 'Manage'}
                                 {expandedProjectId === numId ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                           </td>
                        </tr>

                        {expandedProjectId === numId && (
                           <tr>
                              <td colSpan={6} className="bg-slate-900/50 p-6 border-b border-slate-800 shadow-inner">
                                 <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    <AlertOctagon className="w-4 h-4 text-red-500" /> Admin Intervention Zone
                                 </div>

                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {project.milestones.map((milestone, idx) => (
                                       <div key={milestone.id} className="bg-[#0b0f19] border border-slate-800 rounded-lg p-4 relative">
                                          <div className="flex justify-between items-start mb-2">
                                             <span className="text-xs font-bold text-white">Milestone {idx + 1}</span>
                                             <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${milestone.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                                                   milestone.status === 'refunded' ? 'bg-red-500/10 text-red-500' :
                                                      'bg-slate-800 text-slate-400'
                                                }`}>
                                                {milestone.status}
                                             </span>
                                          </div>
                                          <p className="text-xs text-slate-500 mb-1">{milestone.title}</p>
                                          <p className="text-xs font-mono text-slate-400 mb-4">{milestone.amount} {project.tokenType}</p>

                                          {(milestone.status === 'pending' || milestone.status === 'submitted' || milestone.status === 'locked') && (
                                             <div className="grid grid-cols-2 gap-2 mt-auto">
                                                <button
                                                   onClick={() => handleForceRelease(numId, idx + 1)}
                                                   disabled={!!processingId}
                                                   className="px-2 py-1.5 bg-green-600/10 hover:bg-green-600/20 text-green-500 border border-green-600/20 rounded text-[10px] font-bold uppercase transition-colors disabled:opacity-50"
                                                >
                                                   {processingId === `${numId}-${idx + 1}` ? '...' : 'Force Release'}
                                                </button>
                                                <button
                                                   onClick={() => handleForceRefund(numId)}
                                                   disabled={!!processingId}
                                                   className="px-2 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/20 rounded text-[10px] font-bold uppercase transition-colors disabled:opacity-50"
                                                >
                                                   {processingId === `refund-${numId}` ? '...' : 'Refund'}
                                                </button>
                                             </div>
                                          )}
                                          {milestone.status === 'approved' && (
                                             <div className="text-center py-2 text-[10px] text-green-600 italic">Released</div>
                                          )}
                                       </div>
                                    ))}
                                 </div>
                              </td>
                           </tr>
                        )}
                     </React.Fragment>
                     );
                  })}

                  {projects.length === 0 && (
                     <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No active jobs in queue.</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
   );
};

export default AdminJobs;
