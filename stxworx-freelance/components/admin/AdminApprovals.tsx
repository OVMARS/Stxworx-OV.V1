
import React, { useEffect, useState } from 'react';
import { Check, X, Eye } from 'lucide-react';
import { fetchAdminApprovals } from '../../services/StacksService';
import { ApprovalItem } from '../../types';

const AdminApprovals: React.FC = () => {
   const [approvals, setApprovals] = useState<ApprovalItem[]>([]);

   useEffect(() => {
      fetchAdminApprovals().then(setApprovals);
   }, []);

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
               <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Approvals</h2>
               <p className="text-slate-400 text-xs sm:text-sm">Review pending profiles and KYC.</p>
            </div>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {approvals.filter(i => i.status === 'Pending').map((item) => (
               <div key={item.id} className="bg-[#0b0f19] rounded-xl border border-slate-800 p-4 sm:p-6 shadow-lg hover:border-orange-500/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                     <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${item.type === 'Profile' ? 'bg-blue-500/10 text-blue-500' :
                           'bg-green-500/10 text-green-500'
                        }`}>
                        {item.type}
                     </span>
                     <span className="text-xs text-slate-500 font-mono">{item.date}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white mb-2">{item.requesterName}</h3>
                  <p className="text-slate-400 text-xs sm:text-sm mb-4 sm:mb-6">{item.details}</p>

                  <div className="flex gap-2">
                     <button className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold uppercase rounded flex items-center justify-center gap-1 transition-colors">
                        <Check className="w-4 h-4" /> Approve
                     </button>
                     <button className="flex-1 py-2 bg-slate-800 hover:bg-red-600 text-white text-xs font-bold uppercase rounded flex items-center justify-center gap-1 transition-colors group">
                        <X className="w-4 h-4 group-hover:text-white" /> Reject
                     </button>
                     <button className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors">
                        <Eye className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
};

export default AdminApprovals;
