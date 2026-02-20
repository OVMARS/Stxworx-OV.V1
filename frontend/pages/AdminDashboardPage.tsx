import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel';
import AdminWalletGate from '../components/admin/AdminWalletGate';
import { useAppStore } from '../stores/useAppStore';

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdminAuthenticated, checkAdminSession, adminLogout } = useAppStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAdminSession().then((ok) => {
      if (!ok) navigate('/stx-ops-9x7k', { replace: true });
      setChecking(false);
    });
  }, []);

  const handleLogout = async () => {
    await adminLogout();
    navigate('/stx-ops-9x7k', { replace: true });
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-slate-400 text-sm">
        Verifying session...
      </div>
    );
  }

  if (!isAdminAuthenticated) return null;

  // Two-factor: auth verified → now require wallet connection
  return (
    <AdminWalletGate>
      <AdminPanel onLogout={handleLogout} />
    </AdminWalletGate>
  );
};

export default AdminDashboardPage;
