import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import GigDetails from '../components/GigDetails';

const GigDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedGig, openHireModal, setActiveChatContact, wallet } = useAppStore();

  if (!selectedGig) {
    navigate('/browse');
    return null;
  }

  const handleViewProfile = (address: string | any, name?: string) => {
    if (typeof address === 'string') {
      useAppStore.getState().viewProfileByAddress(address, name).then(() => navigate('/profile'));
    } else {
      useAppStore.getState().setSelectedProfile(address);
      navigate('/profile');
    }
  };

  const handleContact = (addr: string, name?: string) => {
    if (!wallet.isConnected) return;
    setActiveChatContact({
      id: addr,
      name: name || 'Freelancer',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${addr}`,
      lastMessage: 'Start a conversation...',
      unread: 0,
      online: true,
      role: 'Freelancer',
    });
  };

  return (
    <GigDetails
      gig={selectedGig}
      onBack={() => navigate('/browse')}
      onHire={openHireModal}
      onViewProfile={handleViewProfile}
      onContact={handleContact}
    />
  );
};

export default GigDetailsPage;
