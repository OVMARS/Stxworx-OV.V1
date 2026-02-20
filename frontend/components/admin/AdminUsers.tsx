
import React, { useEffect, useState } from 'react';
import { Ban, CheckCircle, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

const AdminUsers: React.FC = () => {
   const { adminUsers, fetchAdminUsers, toggleUserStatus } = useAppStore();
   const [search, setSearch] = useState('');
   const [toggling, setToggling] = useState<number | null>(null);

   useEffect(() => {
      fetchAdminUsers();
   }, []);

   const handleToggle = async (userId: number, currentlyActive: boolean) => {
      setToggling(userId);
      try {
         await toggleUserStatus(userId, !currentlyActive);
      } catch (e) {
         console.error(e);
      } finally {
         setToggling(null);
      }
   };

   const filtered = adminUsers.filter((u) => {
      const term = search.toLowerCase();
      return (
         !term ||
         u.username?.toLowerCase().includes(term) ||
         u.stxAddress?.toLowerCase().includes(term) ||
         u.role?.toLowerCase().includes(term)
      );
   });

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
               <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">User Control</h2>
               <p className="text-slate-400 text-xs sm:text-sm">Manage client and freelancer accounts.</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
               <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-[#0b0f19] border border-slate-800 rounded-lg px-3 sm:px-4 py-2 text-sm text-white focus:border-orange-500 focus:outline-none flex-1 sm:flex-none"
               />
               <button onClick={() => fetchAdminUsers()} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors shrink-0">
                  <RefreshCw className="w-4 h-4" />
               </button>
            </div>
         </div>

         <div className="bg-[#0b0f19] rounded-xl border border-slate-800 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
               <thead>
                  <tr className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800 bg-slate-900/50">
                     <th className="px-3 sm:px-6 py-3 sm:py-4">ID</th>
                     <th className="px-3 sm:px-6 py-3 sm:py-4">User</th>
                     <th className="px-3 sm:px-6 py-3 sm:py-4">Role</th>
                     <th className="px-3 sm:px-6 py-3 sm:py-4">Status</th>
                     <th className="px-3 sm:px-6 py-3 sm:py-4">Joined</th>
                     <th className="px-3 sm:px-6 py-3 sm:py-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-800">
                  {filtered.map((user) => (
                     <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-mono text-slate-500">#{user.id}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                           <div className="flex flex-col">
                              <span className="font-bold text-white text-sm">{user.username || 'N/A'}</span>
                              <span className="text-xs text-slate-500 font-mono">{user.stxAddress?.slice(0, 12)}...</span>
                           </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                           <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${user.role === 'freelancer' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                              {user.role}
                           </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                           <span className={`flex items-center gap-1.5 text-xs font-bold ${user.isActive ? 'text-green-500' : 'text-red-500'}`}>
                              {user.isActive ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                              {user.isActive ? 'Active' : 'Banned'}
                           </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs text-slate-500">
                           {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                           <button
                              onClick={() => handleToggle(user.id, user.isActive)}
                              disabled={toggling === user.id}
                              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                 user.isActive
                                    ? 'bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/20'
                                    : 'bg-green-600/10 hover:bg-green-600/20 text-green-500 border border-green-600/20'
                              } disabled:opacity-50`}
                           >
                              {toggling === user.id ? '...' : user.isActive ? 'Ban' : 'Unban'}
                           </button>
                        </td>
                     </tr>
                  ))}
                  {filtered.length === 0 && (
                     <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No users found.</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
   );
};

export default AdminUsers;
