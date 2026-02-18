
import React from 'react';
import { Wallet, LogOut, Hexagon, Zap, Search, Twitter, Trophy, Home, Store, Briefcase, Code2, Bell, CheckCircle, AlertTriangle, XCircle, FileText, Award } from 'lucide-react';
import { WalletState, ViewType, UserRole } from '../types';
import { useAppStore } from '../stores/useAppStore';

interface NavbarProps {
  wallet: WalletState;
  userRole: UserRole;
  onConnect: () => void;
  onDisconnect: () => void;
  currentView: string;
  onNavigate: (view: ViewType) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ wallet, userRole, onConnect, onDisconnect, currentView, onNavigate, searchTerm, onSearchChange }) => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false);
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadNotificationCount,
    fetchNotifications,
    fetchUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  } = useAppStore();

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Poll unread count every 30s while wallet is connected
  React.useEffect(() => {
    if (!wallet.isConnected) return;
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [wallet.isConnected]);

  const handleBellClick = () => {
    if (!isNotifOpen) {
      fetchNotifications();
    }
    setIsNotifOpen(!isNotifOpen);
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'milestone_submitted': return <FileText className="w-4 h-4 text-blue-400" />;
      case 'milestone_approved': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'milestone_rejected': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'dispute_filed': case 'dispute_resolved': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'proposal_received': case 'proposal_accepted': return <Briefcase className="w-4 h-4 text-orange-400" />;
      case 'project_completed': return <Award className="w-4 h-4 text-green-400" />;
      default: return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const NotificationDropdown = () => (
    <div className="absolute right-0 sm:right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 md:w-96 max-w-[24rem] bg-[#0b0f19] border border-slate-800 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 -right-2 sm:right-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Notifications</h3>
        <div className="flex items-center gap-3">
          {unreadNotificationCount > 0 && (
            <button
              onClick={() => markAllNotificationsRead()}
              className="text-[10px] font-bold text-orange-500 hover:text-orange-400 uppercase tracking-wider transition-colors"
            >
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => { clearNotifications(); setIsNotifOpen(false); }}
              className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-wider transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, 20).map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.isRead) markNotificationRead(notif.id);
              }}
              className={`flex items-start gap-3 px-4 py-3 border-b border-slate-800/50 cursor-pointer transition-colors hover:bg-slate-800/30 ${
                !notif.isRead ? 'bg-orange-500/5' : ''
              }`}
            >
              <div className="shrink-0 mt-0.5">{getNotifIcon(notif.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${!notif.isRead ? 'text-white' : 'text-slate-400'}`}>
                    {notif.title}
                  </span>
                  {!notif.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                <p className="text-[10px] text-slate-600 mt-1">
                  {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const NavLink = ({ view, label }: { view: ViewType; label: string }) => (
    <button
      onClick={() => onNavigate(view)}
      className={`relative px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all duration-300 group overflow-hidden ${
        currentView === view ? 'text-white' : 'text-slate-400 hover:text-white'
      }`}
    >
      <span className="relative z-10">{label}</span>
      {/* Futuristic underline effect */}
      <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 transform transition-transform duration-300 ${currentView === view ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50'}`}></span>
      {/* Background glow for active */}
      {currentView === view && <span className="absolute inset-0 bg-orange-500/10 blur-md rounded-lg"></span>}
    </button>
  );

  // Mobile bottom nav item
  const BottomNavItem = ({ icon: Icon, label, active, onClick }: { icon: React.ElementType; label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all duration-200 active:scale-90 relative group ${
        active ? 'text-orange-500' : 'text-slate-500'
      }`}
    >
      <div className="relative">
        <Icon className={`w-[22px] h-[22px] transition-all duration-200 ${active ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'group-active:text-slate-300'}`} strokeWidth={active ? 2.5 : 2} />
        {active && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-500 shadow-[0_0_4px_rgba(249,115,22,0.8)]"></span>}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">{label}</span>
    </button>
  );

  return (
    <>
    <nav className="sticky top-0 z-50 bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      {/* Glowing bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 md:h-24 items-center gap-4">
          <div className="flex items-center cursor-pointer group shrink-0" onClick={() => onNavigate('home')}>
            <div className="flex flex-col justify-center relative">
               <div className="flex items-center gap-2 md:gap-3">
                 <div className="relative w-7 h-7 md:w-10 md:h-10 flex items-center justify-center">
                    <div className="absolute inset-0 bg-orange-600 blur-lg opacity-20 group-hover:opacity-40 transition-opacity animate-pulse"></div>
                    <Hexagon className="h-full w-full text-orange-600 fill-orange-950/50 relative z-10 group-hover:rotate-180 transition-transform duration-700 ease-in-out" strokeWidth={1.5} />
                    <Zap className="absolute h-3 w-3 md:h-4 md:w-4 text-white z-20 animate-bounce" style={{ animationDuration: '3s' }} />
                 </div>
                 <div className="flex flex-col">
                   <span className="text-xl md:text-3xl font-black text-white tracking-tighter leading-none select-none" style={{ fontFamily: 'Inter, sans-serif' }}>
                      STX<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">WORX</span>
                   </span>
                   <span className="hidden md:block text-[9px] font-bold text-slate-500 tracking-[0.2em] mt-1 group-hover:text-orange-500 transition-colors uppercase pl-0.5 whitespace-nowrap">
                     Power by $STX & $BTC
                   </span>
                 </div>
               </div>
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
             <div className="relative w-full group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 bg-[#0a0f1e]/50 border border-white/10 rounded-xl text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all shadow-inner"
                  placeholder="Search projects, skills, or tags..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
             </div>
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-[#0a0f1e]/50 rounded-full px-2 py-1 border border-white/5 mr-4 backdrop-blur-sm">
               <NavLink view="home" label="Home" />
               <NavLink view="browse" label="Marketplace" />
               <NavLink view="leaderboard" label="Leaderboard" />
               {wallet.isConnected && userRole === 'client' && (
                 <NavLink view="client" label="Client" />
               )}
               {wallet.isConnected && userRole === 'freelancer' && (
                 <NavLink view="freelancer" label="Freelancer" />
               )}
            </div>

            {/* Notification Bell */}
            {wallet.isConnected && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={handleBellClick}
                  className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-orange-500 text-white text-[10px] font-black rounded-full border-2 border-[#020617] shadow-[0_0_8px_rgba(249,115,22,0.5)]">
                      {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                    </span>
                  )}
                </button>
                {isNotifOpen && <NotificationDropdown />}
              </div>
            )}

            {wallet.isConnected ? (
              <div className="flex items-center gap-4 bg-[#0b0f19] px-4 py-2 rounded-xl border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                <div className="flex flex-col items-end text-xs font-mono mr-2">
                   <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      {wallet.isXConnected && wallet.xUsername ? (
                         <div className="flex items-center gap-1 text-white">
                           <Twitter className="w-3 h-3 text-blue-400" />
                           <span>{wallet.xUsername}</span>
                         </div>
                      ) : (
                         <span className="text-slate-400">{wallet.address?.slice(0,6)}...{wallet.address?.slice(-4)}</span>
                      )}
                   </div>
                   <span className="font-bold text-orange-500">{wallet.balanceSTX.toLocaleString()} STX</span>
                </div>
                <button
                  onClick={onDisconnect}
                  className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Disconnect"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onConnect}
                className="relative inline-flex items-center px-6 py-2.5 overflow-hidden text-sm font-bold text-white uppercase tracking-wider rounded-lg group focus:outline-none"
              >
                <span className="absolute inset-0 w-full h-full transition-all duration-300 bg-gradient-to-r from-orange-600 to-orange-500 opacity-100 group-hover:opacity-90"></span>
                <span className="absolute inset-0 w-full h-full border border-white/20 rounded-lg"></span>
                <span className="relative flex items-center gap-2">
                  <Wallet className="h-4 w-4" /> Connect
                </span>
                <span className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></span>
              </button>
            )}
          </div>

          {/* Mobile: Notification bell + Search toggle */}
          <div className="flex items-center gap-1 md:hidden">
            {wallet.isConnected && (
              <div className="relative" ref={!isNotifOpen ? undefined : notifRef}>
                <button
                  onClick={handleBellClick}
                  className={`relative p-2 rounded-lg transition-all duration-200 active:scale-90 ${
                    isNotifOpen ? 'text-orange-500 bg-orange-500/10' : 'text-slate-400'
                  }`}
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center px-0.5 bg-orange-500 text-white text-[9px] font-black rounded-full border-2 border-[#020617]">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  )}
                </button>
                {isNotifOpen && <NotificationDropdown />}
              </div>
            )}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className={`p-2 rounded-lg transition-all duration-200 active:scale-90 ${
                isMobileSearchOpen ? 'text-orange-500 bg-orange-500/10' : 'text-slate-400'
              }`}
              aria-label="Toggle search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Dropdown */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${isMobileSearchOpen ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-3">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 bg-[#0a0f1e] border border-slate-700/50 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </nav>

    {/* ═══════════════════════════════════════════════════════ */}
    {/* Mobile Bottom Navigation — App-style dock               */}
    {/* ═══════════════════════════════════════════════════════ */}
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent"></div>

      <div className="bg-[#020617]/95 backdrop-blur-2xl border-t border-white/[0.06]">
        <div className="flex items-end justify-around px-1 pt-1 pb-2" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>

          {/* ── Left nav items ── */}
          <BottomNavItem icon={Home} label="Home" active={currentView === 'home'} onClick={() => onNavigate('home')} />
          <BottomNavItem icon={Store} label="Market" active={currentView === 'browse'} onClick={() => onNavigate('browse')} />

          {/* ── Center: Wallet Button (raised) ── */}
          <div className="flex flex-col items-center -mt-6 relative">
            {/* Ambient glow behind button */}
            {!wallet.isConnected && (
              <div className="absolute top-1 w-14 h-14 rounded-full bg-orange-500/20 blur-xl animate-pulse pointer-events-none"></div>
            )}

            {wallet.isConnected ? (
              <button
                onClick={onDisconnect}
                className="relative w-14 h-14 rounded-full bg-[#0b0f19] border-2 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.15),0_-4px_12px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center transition-all duration-200 active:scale-90"
                aria-label="Wallet connected — tap to disconnect"
              >
                {/* Live indicator dot */}
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#020617] shadow-[0_0_6px_rgba(34,197,94,0.8)] animate-pulse"></div>
                <Wallet className="w-5 h-5 text-green-400" />
                <span className="text-[8px] font-bold text-orange-500 mt-0.5 leading-none">
                  {wallet.balanceSTX < 10000 ? wallet.balanceSTX.toFixed(0) : `${(wallet.balanceSTX / 1000).toFixed(0)}k`}
                </span>
              </button>
            ) : (
              <button
                onClick={onConnect}
                className="relative w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-[0_0_25px_rgba(249,115,22,0.3),0_-4px_12px_rgba(0,0,0,0.3)] flex items-center justify-center transition-all duration-200 active:scale-90 group"
                aria-label="Connect wallet"
              >
                <Wallet className="w-6 h-6 text-white group-active:rotate-12 transition-transform" />
                {/* Shimmer sweep */}
                <span className="absolute inset-0 rounded-full overflow-hidden">
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></span>
                </span>
              </button>
            )}

            <span className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${wallet.isConnected ? 'text-green-400' : 'text-orange-500'}`}>
              {wallet.isConnected ? `${wallet.address?.slice(0,3)}...${wallet.address?.slice(-2)}` : 'Connect'}
            </span>
          </div>

          {/* ── Right nav items ── */}
          <BottomNavItem icon={Trophy} label="Ranks" active={currentView === 'leaderboard'} onClick={() => onNavigate('leaderboard')} />
          {wallet.isConnected && userRole === 'client' ? (
            <BottomNavItem icon={Briefcase} label="Client" active={currentView === 'client'} onClick={() => onNavigate('client')} />
          ) : wallet.isConnected && userRole === 'freelancer' ? (
            <BottomNavItem icon={Code2} label="Work" active={currentView === 'freelancer'} onClick={() => onNavigate('freelancer')} />
          ) : (
            <BottomNavItem icon={Search} label="Search" active={isMobileSearchOpen} onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)} />
          )}

        </div>
      </div>
    </div>
    </>
  );
};

export default Navbar;
