
import React from 'react';
import { Wallet, LogOut, Menu, X, Hexagon, Zap, Search, Twitter, ChevronRight } from 'lucide-react';
import { WalletState, ViewType, UserRole } from '../types';

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
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const NavLink = ({ view, label }: { view: ViewType; label: string }) => (
    <button
      onClick={() => {
        onNavigate(view);
        setIsMenuOpen(false);
      }}
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

  // Mobile Menu Item Component with enhanced accessibility and animation
  const MobileMenuItem = ({ view, label, active, index }: { view: ViewType, label: string, active: boolean, index: number }) => (
    <button
      onClick={() => {
        onNavigate(view);
        setIsMenuOpen(false);
      }}
      style={{ transitionDelay: `${isMenuOpen ? index * 75 : 0}ms` }}
      className={`w-full flex items-center justify-between px-5 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-500 transform group ${
        isMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
      } ${
        active 
          ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent hover:pl-7'
      }`}
    >
      <span className="flex items-center gap-3">
         <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${active ? 'bg-orange-500 scale-125 shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-slate-700 group-hover:bg-slate-400'}`}></span>
         {label}
      </span>
      {active ? (
         <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)] animate-pulse"></div>
      ) : (
         <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
      )}
    </button>
  );

  return (
    <nav className="sticky top-0 z-50 bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      {/* Glowing bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-24 items-center gap-4">
          <div className="flex items-center cursor-pointer group shrink-0" onClick={() => onNavigate('home')}>
            <div className="flex flex-col justify-center relative">
               <div className="flex items-center gap-3">
                 <div className="relative w-10 h-10 flex items-center justify-center">
                    <div className="absolute inset-0 bg-orange-600 blur-lg opacity-20 group-hover:opacity-40 transition-opacity animate-pulse"></div>
                    <Hexagon className="h-full w-full text-orange-600 fill-orange-950/50 relative z-10 group-hover:rotate-180 transition-transform duration-700 ease-in-out" strokeWidth={1.5} />
                    <Zap className="absolute h-4 w-4 text-white z-20 animate-bounce" style={{ animationDuration: '3s' }} />
                 </div>
                 <div className="flex flex-col">
                   <span className="text-3xl font-black text-white tracking-tighter leading-none select-none" style={{ fontFamily: 'Inter, sans-serif' }}>
                      STX<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">WORX</span>
                   </span>
                   <span className="text-[9px] font-bold text-slate-500 tracking-[0.2em] mt-1 group-hover:text-orange-500 transition-colors uppercase pl-0.5 whitespace-nowrap">
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
                  placeholder="Search gigs, skills, or tags..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
             </div>
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-[#0a0f1e]/50 rounded-full px-2 py-1 border border-white/5 mr-4 backdrop-blur-sm">
               <NavLink view="home" label="Home" />
               <NavLink view="browse" label="Browse Gigs" />
               {wallet.isConnected && userRole === 'client' && (
                 <NavLink view="client" label="Client" />
               )}
               {wallet.isConnected && userRole === 'freelancer' && (
                 <NavLink view="freelancer" label="Freelancer" />
               )}
            </div>

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

          {/* Animated Hamburger Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`relative p-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50 overflow-hidden group w-10 h-10 flex items-center justify-center ${
                isMenuOpen ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen}
            >
              <div className="relative w-6 h-6">
                 {/* Icon transformation wrapper */}
                 <div className={`absolute inset-0 transition-all duration-300 transform origin-center ${isMenuOpen ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'}`}>
                    <Menu className="w-6 h-6" />
                 </div>
                 <div className={`absolute inset-0 transition-all duration-300 transform origin-center ${isMenuOpen ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'}`}>
                    <X className="w-6 h-6" />
                 </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu with smooth transitions */}
      <div 
         className={`md:hidden absolute top-full left-0 w-full bg-[#020617]/95 backdrop-blur-2xl border-b border-slate-800 overflow-hidden transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
           isMenuOpen 
             ? 'max-h-[85vh] opacity-100 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-b border-orange-500/10' 
             : 'max-h-0 opacity-0 border-transparent'
         }`}
      >
        <div className="p-6 space-y-6">
           {/* Mobile Search */}
           <div 
             className={`relative w-full group transition-all duration-700 transform ${
                isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-[-10px] opacity-0'
             }`}
           >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 bg-[#0a0f1e] border border-slate-700 rounded-xl text-slate-200 text-base focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="Search gigs..."
                value={searchTerm}
                onChange={(e) => {
                   onSearchChange(e.target.value);
                }}
              />
           </div>

           {/* Mobile Navigation Links */}
           <div className="space-y-2">
             <MobileMenuItem view="home" label="Home" active={currentView === 'home'} index={1} />
             <MobileMenuItem view="browse" label="Browse Gigs" active={currentView === 'browse'} index={2} />
             {wallet.isConnected && userRole && (
                <>
                  <div className={`h-px bg-slate-800/50 my-2 transition-all duration-500 delay-150 ${isMenuOpen ? 'opacity-100 width-full' : 'opacity-0 width-0'}`}></div>
                  {userRole === 'client' && (
                    <MobileMenuItem view="client" label="Client Dashboard" active={currentView === 'client'} index={3} />
                  )}
                  {userRole === 'freelancer' && (
                    <MobileMenuItem view="freelancer" label="Freelancer Dashboard" active={currentView === 'freelancer'} index={4} />
                  )}
                </>
             )}
           </div>

           {/* Mobile Auth Buttons */}
           <div 
             className={`pt-4 border-t border-slate-800 transition-all duration-700 delay-300 transform ${
                isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
             }`}
           >
             {wallet.isConnected ? (
                <button 
                   onClick={onDisconnect} 
                   className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-red-500/10 text-red-500 font-bold uppercase tracking-wider hover:bg-red-500/20 border border-red-500/20 transition-all"
                >
                  <LogOut className="h-4 w-4" /> Disconnect Wallet
                </button>
             ) : (
                <button 
                   onClick={() => { onConnect(); setIsMenuOpen(false); }} 
                   className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-orange-600 text-white font-bold uppercase tracking-wider hover:bg-orange-500 shadow-lg shadow-orange-900/20 transition-all"
                >
                  <Wallet className="h-4 w-4" /> Connect Wallet
                </button>
             )}
           </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
