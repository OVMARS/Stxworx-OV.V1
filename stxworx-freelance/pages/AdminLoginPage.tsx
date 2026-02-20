import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLogin from '../components/AdminLogin';

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AdminLogin
      onLogin={() => navigate('/stx-ops-9x7k/dashboard')}
      onBack={() => navigate('/')}
    />
  );
};

export default AdminLoginPage;
