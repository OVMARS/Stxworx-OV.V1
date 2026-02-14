import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import EditProfile from '../components/EditProfile';

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUserProfile, isProcessing, handleSaveProfile, handleConnectX, wallet } = useAppStore();

  if (!currentUserProfile) {
    navigate('/freelancer');
    return null;
  }

  const onSave = async (updated: any) => {
    await handleSaveProfile(updated);
    navigate('/freelancer');
  };

  return (
    <EditProfile
      profile={currentUserProfile}
      onSave={onSave}
      onCancel={() => navigate('/freelancer')}
      isSaving={isProcessing}
      onConnectX={handleConnectX}
      isXConnected={wallet.isXConnected}
      xUsername={wallet.xUsername}
    />
  );
};

export default EditProfilePage;
