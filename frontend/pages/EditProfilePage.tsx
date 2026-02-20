import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import EditProfile from '../components/EditProfile';

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUserProfile, isProcessing, handleSaveProfile, handleConnectX, wallet, userRole } = useAppStore();

  const dashboardPath = userRole === 'client' ? '/client' : '/freelancer';

  if (!currentUserProfile) {
    navigate(dashboardPath);
    return null;
  }

  const onSave = async (updated: any) => {
    await handleSaveProfile(updated);
    navigate(dashboardPath);
  };

  return (
    <EditProfile
      profile={currentUserProfile}
      onSave={onSave}
      onCancel={() => navigate(dashboardPath)}
      isSaving={isProcessing}
      onConnectX={handleConnectX}
      isXConnected={wallet.isXConnected}
      xUsername={wallet.xUsername}
      role={userRole === 'client' ? 'client' : 'freelancer'}
    />
  );
};

export default EditProfilePage;
