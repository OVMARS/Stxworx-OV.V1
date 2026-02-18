import React, { useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { Trophy, Medal, ShieldCheck, ArrowRight, RefreshCw, Crown, Star, Users } from 'lucide-react';
import { FreelancerProfile } from '../types';

const LeaderboardPage: React.FC = () => {
  const { leaderboardData, wallet, fetchLeaderboard, setSelectedProfile } = useAppStore();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    handleRefresh();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchLeaderboard();
    setLoading(false);
  };

  const handleViewProfile = (profile: FreelancerProfile) => {
    setSelectedProfile(profile);
  };

  const podium = leaderboardData.slice(0, 3);
  const rest = leaderboardData.slice(3);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 md:mb-10 gap-4">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg sm:rounded-xl shadow-lg shadow-amber-900/20">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Leaderboard
            </h1>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm ml-11 sm:ml-14">
            Top freelancers ranked by completed contracts and client ratings
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all text-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Podium – Top 3 */}
      {podium.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 md:mb-10">
          {podium.map((profile, idx) => {
            const isCurrentUser = wallet.address && profile.address === wallet.address;
            const colors = [
              { border: 'border-yellow-500/50', glow: 'shadow-yellow-500/10', badge: 'bg-yellow-500', icon: Crown },
              { border: 'border-slate-400/50', glow: 'shadow-slate-400/10', badge: 'bg-slate-400', icon: Medal },
              { border: 'border-amber-600/50', glow: 'shadow-amber-600/10', badge: 'bg-amber-600', icon: Medal },
            ][idx];
            const Icon = colors.icon;
            return (
              <div
                key={profile.address}
                className={`relative bg-[#0b0f19] rounded-xl sm:rounded-2xl border ${colors.border} p-4 sm:p-6 text-center shadow-xl ${colors.glow} hover:scale-[1.02] transition-all duration-300 ${
                  idx === 0 ? 'sm:-mt-4 sm:mb-4' : ''
                }`}
              >
                {isCurrentUser && (
                  <span className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-0.5 rounded bg-orange-600 text-white text-[9px] font-bold uppercase">You</span>
                )}
                <div className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${colors.badge} text-white font-black text-sm mb-3 sm:mb-4 shadow-lg`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full border-2 border-slate-700 overflow-hidden mb-2 sm:mb-3">
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-white font-bold text-base sm:text-lg">{profile.name}</h3>
                <p className="text-slate-500 text-[10px] sm:text-xs font-mono mb-3 sm:mb-4 truncate">{profile.address.slice(0, 8)}...{profile.address.slice(-4)}</p>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="bg-slate-900/50 rounded-lg p-2 sm:p-3 border border-slate-800">
                    <div className="text-lg sm:text-xl font-black text-white">{profile.jobsCompleted}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Completed</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-2 sm:p-3 border border-slate-800">
                    <div className="text-lg sm:text-xl font-black text-white flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      {profile.rating.toFixed(1)}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Rating</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Table */}
      {leaderboardData.length > 0 ? (
        <div className="bg-[#0b0f19] rounded-xl sm:rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto -mx-0">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800/50">
                  <th className="px-3 sm:px-6 py-3 sm:py-4">Rank</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4">Freelancer</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-right">Completed</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-right">Avg Rating</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-right">Reviews</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {leaderboardData.map((profile) => {
                  const isCurrentUser = wallet.address && profile.address === wallet.address;
                  const RankIcon = profile.rank === 1 ? Trophy : profile.rank === 2 ? Medal : profile.rank === 3 ? Medal : null;
                  const rankColor = profile.rank === 1 ? 'text-yellow-400' : profile.rank === 2 ? 'text-slate-300' : profile.rank === 3 ? 'text-amber-600' : 'text-slate-500';
                  return (
                    <tr
                      key={profile.address}
                      className={`group transition-colors ${isCurrentUser ? 'bg-orange-500/10 hover:bg-orange-500/20' : 'hover:bg-slate-800/30'}`}
                    >
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className={`flex items-center gap-1.5 sm:gap-2 font-black text-base sm:text-lg ${rankColor}`}>
                          {RankIcon && <RankIcon className="w-5 h-5" />}
                          <span>#{profile.rank}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-slate-700 overflow-hidden shrink-0">
                            <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              {profile.name}
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.5 rounded bg-orange-600 text-white text-[9px] font-bold">YOU</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              {profile.address.slice(0, 8)}...{profile.address.slice(-4)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                        <span className="text-white font-mono font-bold text-base sm:text-lg">{profile.jobsCompleted}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                        <div className="flex items-center justify-end gap-1 text-green-400 font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {profile.rating > 0 ? profile.rating.toFixed(1) : '—'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-slate-400 font-mono">
                        {/* reviewCount not on FreelancerProfile — show rating star count proxy */}
                        {profile.rating > 0 ? (
                          <div className="flex items-center justify-end gap-0.5">
                            {Array.from({ length: Math.round(profile.rating) }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-600">No reviews</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-[#0b0f19] rounded-2xl border border-dashed border-slate-800">
          <Users className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Rankings Yet</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            Once freelancers complete contracts and receive ratings, they'll appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
