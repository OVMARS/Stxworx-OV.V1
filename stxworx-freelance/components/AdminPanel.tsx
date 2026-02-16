
import React, { useState, useEffect } from 'react';
import { Hexagon, LayoutDashboard, Users, CheckSquare, Briefcase, MessageSquare, Database, LogOut, Search, Bell, MessageCircle } from 'lucide-react';
import AdminUsers from './admin/AdminUsers';
import AdminJobs from './admin/AdminJobs';
import AdminApprovals from './admin/AdminApprovals';
import AdminSupport from './admin/AdminSupport';
import AdminNFT from './admin/AdminNFT';
import AdminChats from './admin/AdminChats';
import { useAppStore } from '../stores/useAppStore';

interface AdminPanelProps {
  onLogout: () => void;
}

type AdminTab = 'overview' | 'users' | 'jobs' | 'chats' | 'approvals' | 'support' | 'nft';

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const { adminDashboardStats, fetchDashboardStats, adminUser } = useAppStore();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const NavItem = ({ tab, icon: Icon, label }: { tab: AdminTab; icon: any; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        activeTab === tab 
          ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className={`w-5 h-5 ${activeTab === tab ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
      <span className="font-bold text-sm tracking-wide">{label}</span>
      {activeTab === tab && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>}
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'users': return <AdminUsers />;
      case 'jobs': return <AdminJobs />;
      case 'chats': return <AdminChats />;
      case 'approvals': return <AdminApprovals />;
      case 'support': return <AdminSupport />;
      case 'nft': return <AdminNFT />;
      case 'overview':
      default:
        return (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4">
              {/* Stat Cards */}
              <div className="bg-[#0b0f19] p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-16 bg-orange-600/5 rounded-full blur-2xl"></div>
                 <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Total Users</div>
                 <div className="text-3xl font-black text-white">{adminDashboardStats?.totalUsers ?? '—'}</div>
                 <div className="text-slate-500 text-xs font-bold mt-2">Registered accounts</div>
              </div>
              <div className="bg-[#0b0f19] p-6 rounded-2xl border border-slate-800">
                 <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Total Projects</div>
                 <div className="text-3xl font-black text-white">{adminDashboardStats?.totalProjects ?? '—'}</div>
                 <div className="text-slate-500 text-xs font-bold mt-2">All time</div>
              </div>
              <div className="bg-[#0b0f19] p-6 rounded-2xl border border-slate-800">
                 <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Active Projects</div>
                 <div className="text-3xl font-black text-white text-blue-500">{adminDashboardStats?.activeProjects ?? '—'}</div>
                 <div className="text-blue-400/60 text-xs font-bold mt-2">Currently in progress</div>
              </div>
              <div className="bg-[#0b0f19] p-6 rounded-2xl border border-slate-800">
                 <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Open Disputes</div>
                 <div className="text-3xl font-black text-white text-red-500">{adminDashboardStats?.openDisputes ?? '—'}</div>
                 <div className="text-red-400/60 text-xs font-bold mt-2">Requires attention</div>
              </div>

              {/* Recent Activity Section could go here */}
              <div className="col-span-full bg-[#0b0f19] p-6 rounded-2xl border border-slate-800 mt-4">
                 <h3 className="text-lg font-bold text-white mb-4">System Status</h3>
                 <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                       Stacks Node: Synced
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-green-500"></div>
                       API Gateway: Operational
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-green-500"></div>
                       Escrow Contracts: Secure
                    </div>
                 </div>
              </div>
           </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex font-sans text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 bg-[#05080f] border-r border-slate-800 flex flex-col fixed h-full z-20">
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
           <div className="flex items-center gap-2">
              <Hexagon className="h-6 w-6 text-orange-600 fill-orange-600/20" />
              <span className="text-xl font-black text-white tracking-tighter">
                STX<span className="text-orange-600">ADMIN</span>
              </span>
           </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
           <div className="text-xs font-bold text-slate-600 uppercase tracking-wider px-4 mb-2 mt-2">Main</div>
           <NavItem tab="overview" icon={LayoutDashboard} label="Overview" />
           <NavItem tab="users" icon={Users} label="Users Control" />
           <NavItem tab="jobs" icon={Briefcase} label="Jobs Queue" />
           <NavItem tab="chats" icon={MessageCircle} label="Monitor Chats" />
           
           <div className="text-xs font-bold text-slate-600 uppercase tracking-wider px-4 mb-2 mt-6">Management</div>
           <NavItem tab="approvals" icon={CheckSquare} label="Approvals" />
           <NavItem tab="support" icon={MessageSquare} label="Customer Service" />
           <NavItem tab="nft" icon={Database} label="NFT Release" />
        </nav>

        <div className="p-4 border-t border-slate-800">
           <button 
             onClick={onLogout}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
           >
              <LogOut className="w-5 h-5" />
              <span className="font-bold text-sm">Logout</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
         {/* Top Header */}
         <header className="h-20 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10">
            <h1 className="text-xl font-bold text-white uppercase tracking-tight">
               {activeTab === 'nft' ? 'NFT Release' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            
            <div className="flex items-center gap-6">
               <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    placeholder="Global Search..." 
                    className="bg-[#0b0f19] border border-slate-800 rounded-full py-2 pl-9 pr-4 text-sm focus:border-orange-500 focus:outline-none w-64"
                  />
               </div>
               <button className="relative text-slate-400 hover:text-white transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
               </button>
               <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-slate-900">
                  {(adminUser?.username || 'AD').slice(0, 2).toUpperCase()}
               </div>
            </div>
         </header>

         {/* Dashboard Content */}
         <div className="p-8">
            {renderContent()}
         </div>
      </main>
    </div>
  );
};

export default AdminPanel;
