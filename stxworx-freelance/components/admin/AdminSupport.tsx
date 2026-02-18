
import React, { useEffect, useState } from 'react';
import { MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { fetchAdminTickets } from '../../services/StacksService';
import { SupportTicket } from '../../types';

const AdminSupport: React.FC = () => {
   const [tickets, setTickets] = useState<SupportTicket[]>([]);

   useEffect(() => {
      fetchAdminTickets().then(setTickets);
   }, []);

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
               <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Customer Service</h2>
               <p className="text-slate-400 text-xs sm:text-sm">Resolve disputes and user inquiries.</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
               <button className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-slate-800 text-white text-xs font-bold uppercase rounded-lg hover:bg-slate-700">All Tickets</button>
               <button className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-orange-600/10 text-orange-500 text-xs font-bold uppercase rounded-lg border border-orange-500/20">Active Disputes</button>
            </div>
         </div>

         <div className="space-y-4">
            {tickets.map((ticket) => (
               <div key={ticket.id} className="bg-[#0b0f19] rounded-xl border border-slate-800 p-4 sm:p-6 flex flex-col md:flex-row gap-4 sm:gap-6 hover:border-slate-700 transition-colors">
                  <div className="flex-1">
                     <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${ticket.priority === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                           ticket.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                              'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                           }`}>
                           {ticket.priority} Priority
                        </span>
                        <span className="text-xs text-slate-500 font-mono">#{ticket.id} • {ticket.date}</span>
                        {ticket.relatedJobId && (
                           <span className="text-xs text-orange-400 font-mono">Ref: Job #{ticket.relatedJobId}</span>
                        )}
                     </div>
                     <h3 className="text-lg font-bold text-white mb-1">{ticket.subject}</h3>
                     <p className="text-slate-400 text-sm">{ticket.message}</p>
                  </div>

                  <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 shrink-0">
                     <div className="flex flex-col gap-2 w-full md:w-auto">
                        <button className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase rounded flex items-center justify-center gap-2 transition-colors">
                           <MessageSquare className="w-4 h-4" /> Reply
                        </button>
                        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase rounded flex items-center justify-center gap-2 transition-colors">
                           <CheckCircle2 className="w-4 h-4" /> Resolve
                        </button>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
};

export default AdminSupport;
