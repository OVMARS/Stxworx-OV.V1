import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useAppStore } from '../stores/useAppStore';
import { api } from '../lib/api';
import Navbar from '../components/Navbar';
import RoleSelectModal from '../components/RoleSelectModal';
import CreateProjectModal from '../components/CreateProjectModal';
import ChatWidget from '../components/ChatWidget';

const MainLayout: React.FC = () => {
  const { isSignedIn, userAddress, connect, disconnect } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    wallet, searchTerm, isModalOpen,
    modalInitialData, activeChatContact, isProcessing,
    userRole, showRoleModal, isAuthChecking,
    init, syncWallet, setSearchTerm, setIsModalOpen,
    setActiveChatContact, setIsProcessing,
    setUserRole, verifyAndLogin, logoutUser,
    handleCreateProject, incrementBlock,
  } = useAppStore();

  useEffect(() => {
    init();
    const interval = setInterval(incrementBlock, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    syncWallet(isSignedIn, userAddress);
  }, [isSignedIn, userAddress]);

  // Auto-navigate to saved role dashboard on reconnect
  useEffect(() => {
    if (wallet.isConnected && userRole && !showRoleModal) {
      const target = userRole === 'client' ? '/client' : '/freelancer';
      if (location.pathname === '/') {
        navigate(target);
      }
    }
  }, [wallet.isConnected, userRole, showRoleModal]);

  const handleConnect = async () => {
    try {
      setIsProcessing(true);
      await connect();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisconnect = () => {
    // Clear backend session cookie
    api.auth.logout().catch(() => {});
    disconnect();
    navigate('/');
  };

  const pathToView = (): string => {
    const p = location.pathname;
    if (p === '/') return 'home';
    if (p === '/browse') return 'browse';
    if (p === '/leaderboard') return 'leaderboard';
    if (p === '/client') return 'client';
    if (p === '/freelancer') return 'freelancer';
    if (p === '/profile') return 'profile';
    if (p === '/edit-profile') return 'edit-profile';
    if (p === '/stx-ops-9x7k') return 'admin-login';
    if (p === '/stx-ops-9x7k/dashboard') return 'admin-dashboard';
    return 'home';
  };

  const handleNavigate = (v: string) => {
    const map: Record<string, string> = {
      home: '/',
      browse: '/browse',
      leaderboard: '/leaderboard',
      client: '/client',
      freelancer: '/freelancer',
      profile: '/profile',
      'edit-profile': '/edit-profile',
      'admin-login': '/stx-ops-9x7k',
      'admin-dashboard': '/stx-ops-9x7k/dashboard',
    };
    navigate(map[v] || '/');
    window.scrollTo(0, 0);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    if (term && location.pathname !== '/browse') {
      navigate('/browse');
    }
  };

  const handleRoleSelect = async (role: 'client' | 'freelancer') => {
    try {
      await setUserRole(role);
      // After backend auth, use the actual role from the store (may differ for existing users)
      const actualRole = useAppStore.getState().userRole;
      navigate(actualRole === 'client' ? '/client' : '/freelancer');
    } catch (err: any) {
      if (err?.message === 'SIGN_CANCELLED') {
        // User closed the wallet popup — modal stays open, do nothing
        return;
      }
      console.error('Role selection failed:', err);
    }
  };

  const isAdminRoute = location.pathname.startsWith('/stx-ops-9x7k');
  if (isAdminRoute) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-orange-500/30 overflow-x-hidden w-full">
      <Navbar
        wallet={wallet}
        userRole={userRole}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        currentView={pathToView() as any}
        onNavigate={handleNavigate}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />

      <main className="min-h-[calc(100vh-300px)] pb-20 md:pb-0">
        <Outlet />
      </main>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
        initialData={modalInitialData}
      />

      <ChatWidget
        externalContact={activeChatContact}
        onCloseExternal={() => setActiveChatContact(null)}
      />

      <RoleSelectModal open={showRoleModal} onSelect={handleRoleSelect} onClose={handleDisconnect} isProcessing={isProcessing} />
    </div>
  );
};

export default MainLayout;
