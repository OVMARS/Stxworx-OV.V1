import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import UserProfileView from '../components/UserProfileView';
import {
  api,
  mapBackendProject,
  type BackendUser,
  type BackendReview,
  type LeaderboardEntry,
} from '../lib/api';
import type { Project } from '../types';

const PublicProfilePage: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const { wallet, setActiveChatContact, leaderboardData } = useAppStore();

  const [user, setUser] = useState<BackendUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reviews, setReviews] = useState<BackendReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!address) return;

    setLoading(true);
    setError('');

    Promise.all([
      api.users.getByAddress(address).catch(() => null),
      api.users.getProjects(address).then(bps => bps.map(mapBackendProject)).catch(() => [] as Project[]),
      api.users.getReviews(address).catch(() => [] as BackendReview[]),
    ])
      .then(([userData, userProjects, userReviews]) => {
        if (!userData) {
          setError('User not found.');
          return;
        }
        setUser(userData);
        setProjects(userProjects);
        setReviews(userReviews);
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, [address]);

  // Try to find stats from leaderboard data
  const leaderboardStats = React.useMemo(() => {
    if (!address) return undefined;
    const entry = leaderboardData.find(e => e.address === address);
    if (!entry) return undefined;
    return {
      jobsCompleted: entry.jobsCompleted,
      avgRating: entry.rating,
      reviewCount: reviews.length,
      rank: entry.rank,
    };
  }, [address, leaderboardData, reviews.length]);

  const isOwnProfile = wallet.address === address;

  const handleContact = (profileAddress: string) => {
    if (!wallet.isConnected) return;
    setActiveChatContact({
      id: profileAddress,
      name: user?.username || profileAddress.slice(0, 8),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileAddress}`,
      lastMessage: 'Start a conversation...',
      unread: 0,
      online: true,
      role: user?.role === 'freelancer' ? 'Freelancer' : 'Client',
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 mt-4 text-sm">Loading profile...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-400">{error || 'User not found.'}</p>
        <button onClick={() => navigate('/browse')} className="text-orange-500 hover:underline mt-4 text-sm font-bold">
          Back to Marketplace
        </button>
      </div>
    );
  }

  return (
    <UserProfileView
      user={user}
      projects={projects}
      reviews={reviews}
      leaderboardStats={leaderboardStats}
      onBack={() => navigate(-1)}
      onContact={wallet.isConnected ? handleContact : undefined}
      isOwnProfile={isOwnProfile}
    />
  );
};

export default PublicProfilePage;
