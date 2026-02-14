import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel';

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  return <AdminPanel onLogout={() => navigate('/')} />;
};

export default AdminDashboardPage;
