import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import BrowsePage from './pages/BrowsePage';
import ClientPage from './pages/ClientPage';
import FreelancerPage from './pages/FreelancerPage';
import ProfilePage from './pages/ProfilePage';
import GigDetailsPage from './pages/GigDetailsPage';
import EditProfilePage from './pages/EditProfilePage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

const AnimationStyles = () => (
  <style>{`
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-15px); }
      100% { transform: translateY(0px); }
    }
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 20px rgba(249,115,22,0.2); border-color: rgba(249,115,22,0.5); }
      50% { box-shadow: 0 0 40px rgba(249,115,22,0.5); border-color: rgba(249,115,22,0.8); }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes grid-move {
      0% { background-position: 0 0; }
      100% { background-position: 50px 50px; }
    }
    .animate-float { animation: float 6s ease-in-out infinite; }
    .animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-pulse-glow { animation: pulse-glow 3s infinite; }
    .bg-grid-moving { animation: grid-move 10s linear infinite; }
    .glass-panel {
      background: rgba(2, 6, 23, 0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .text-glow { text-shadow: 0 0 20px rgba(249,115,22,0.5); }
    .delay-100 { animation-delay: 100ms; opacity: 0; }
    .delay-200 { animation-delay: 200ms; opacity: 0; }
    .delay-300 { animation-delay: 300ms; opacity: 0; }
    .delay-500 { animation-delay: 500ms; opacity: 0; }

    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(71, 85, 105, 0.5) transparent;
    }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(71, 85, 105, 0.5);
      border-radius: 20px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: rgba(249, 115, 22, 0.6);
    }
  `}</style>
);

const App: React.FC = () => (
  <>
    <AnimationStyles />
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/client" element={<ClientPage />} />
          <Route path="/freelancer" element={<FreelancerPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/gig" element={<GigDetailsPage />} />
          <Route path="/edit-profile" element={<EditProfilePage />} />
        </Route>
        <Route element={<MainLayout />}>
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </>
);

export default App;
