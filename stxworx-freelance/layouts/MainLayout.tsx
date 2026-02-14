import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useAppStore } from '../stores/useAppStore';
import Navbar from '../components/Navbar';
import CreateProjectModal from '../components/CreateProjectModal';
import CreateGigModal from '../components/CreateGigModal';
import ChatWidget from '../components/ChatWidget';

const MainLayout: React.FC = () => {
  const { isSignedIn, userAddress, connect, disconnect } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    wallet, searchTerm, isModalOpen, isGigModalOpen,
    modalInitialData, activeChatContact, isProcessing,
    init, syncWallet, setSearchTerm, setIsModalOpen,
    setIsGigModalOpen, setActiveChatContact, setIsProcessing,
    handleCreateProject, handleCreateGig, incrementBlock,
  } = useAppStore();

  useEffect(() => {
    init();
    const interval = setInterval(incrementBlock, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    syncWallet(isSignedIn, userAddress);
  }, [isSignedIn, userAddress]);

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
    disconnect();
    navigate('/');
  };

  const pathToView = (): string => {
    const p = location.pathname;
    if (p === '/') return 'home';
    if (p === '/browse') return 'browse';
    if (p === '/client') return 'client';
    if (p === '/freelancer') return 'freelancer';
    if (p === '/profile') return 'profile';
    if (p === '/gig') return 'gig-details';
    if (p === '/edit-profile') return 'edit-profile';
    if (p === '/admin') return 'admin-login';
    if (p === '/admin/dashboard') return 'admin-dashboard';
    return 'home';
  };

  const handleNavigate = (v: string) => {
    const map: Record<string, string> = {
      home: '/',
      browse: '/browse',
      client: '/client',
      freelancer: '/freelancer',
      profile: '/profile',
      'gig-details': '/gig',
      'edit-profile': '/edit-profile',
      'admin-login': '/admin',
      'admin-dashboard': '/admin/dashboard',
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

  const isAdminRoute = location.pathname.startsWith('/admin');
  if (isAdminRoute) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-orange-500/30">
      <Navbar
        wallet={wallet}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        currentView={pathToView() as any}
        onNavigate={handleNavigate}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />

      <main className="min-h-[calc(100vh-300px)]">
        <Outlet />
      </main>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
        initialData={modalInitialData}
      />

      <CreateGigModal
        isOpen={isGigModalOpen}
        onClose={() => setIsGigModalOpen(false)}
        onSubmit={handleCreateGig}
      />

      <ChatWidget
        externalContact={activeChatContact}
        onCloseExternal={() => setActiveChatContact(null)}
      />
    </div>
  );
};

export default MainLayout;
