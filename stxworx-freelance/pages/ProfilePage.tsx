import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import FreelancerProfile from '../components/FreelancerProfile';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedProfile, gigs, openHireModal, setActiveChatContact, wallet } = useAppStore();

  if (!selectedProfile) {
    navigate('/browse');
    return null;
  }

  const handleContact = (profileOrAddress: any) => {
    if (!wallet.isConnected) return;
    const contact = typeof profileOrAddress === 'string'
      ? {
          id: profileOrAddress,
          name: 'Freelancer',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileOrAddress}`,
          lastMessage: 'Start a conversation...',
          unread: 0,
          online: true,
          role: 'Freelancer',
        }
      : {
          id: profileOrAddress.address,
          name: profileOrAddress.name,
          avatar: profileOrAddress.avatar,
          lastMessage: 'Start a conversation...',
          unread: 0,
          online: true,
          role: 'Freelancer',
        };
    setActiveChatContact(contact);
  };

  return (
    <FreelancerProfile
      profile={selectedProfile}
      gigs={gigs}
      onBack={() => navigate(-1)}
      onHire={openHireModal}
      onContact={handleContact}
    />
  );
};

export default ProfilePage;
