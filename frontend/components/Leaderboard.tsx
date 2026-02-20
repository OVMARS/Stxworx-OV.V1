
import React from 'react';
import { FreelancerProfile } from '../types';
import { Trophy, Medal, Award, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';
import { formatUSD } from '../services/StacksService';

interface LeaderboardProps {
  data: FreelancerProfile[];
  currentAddress: string | null;
  onViewProfile?: (profile: FreelancerProfile) => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ data, currentAddress, onViewProfile }) => {
  return (
    <div className="bg-[#0b0f19] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="p-6 border-b border-slate-800 bg-[#0b0f19] sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-yellow-600 to-amber-700 rounded-lg shadow-lg">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Top Performers</h2>
            <p className="text-slate-400 text-xs font-mono">Ranking by Total Verified Earnings</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800/50">
              <th className="px-6 py-4">Rank</th>
              <th className="px-6 py-4">Freelancer</th>
              <th className="px-6 py-4">Specialty</th>
              <th className="px-6 py-4 text-right">Completed Jobs</th>
              <th className="px-6 py-4 text-right">Reputation</th>
              <th className="px-6 py-4 text-right">Total Earned</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {data.map((profile) => {
              const isCurrentUser = currentAddress && profile.address.includes(currentAddress.slice(-3));
              const RankIcon = profile.rank === 1 ? Trophy : profile.rank === 2 ? Medal : profile.rank === 3 ? Medal : null;
              const rankColor = profile.rank === 1 ? 'text-yellow-400' : profile.rank === 2 ? 'text-slate-300' : profile.rank === 3 ? 'text-amber-600' : 'text-slate-500';

              return (
                <tr
                  key={profile.rank}
                  className={`group transition-colors cursor-pointer ${isCurrentUser ? 'bg-orange-500/10 hover:bg-orange-500/20' : 'hover:bg-slate-800/30'
                    }`}
                  onClick={() => onViewProfile && onViewProfile(profile)}
                >
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-2 font-black text-lg ${rankColor}`}>
                      {RankIcon && <RankIcon className="w-5 h-5" />}
                      <span>#{profile.rank}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-slate-700 overflow-hidden relative">
                        <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          {profile.name}
                          {isCurrentUser && <span className="px-1.5 py-0.5 rounded bg-orange-600 text-white text-[9px]">YOU</span>}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">{profile.address}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold">
                      {profile.specialty}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-white font-mono font-bold">{profile.jobsCompleted}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 text-green-400 font-bold">
                      <ShieldCheck className="w-3 h-3" /> {profile.rating.toFixed(1)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-orange-500 font-black font-mono text-lg">
                      {formatUSD(profile.totalEarnings)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 rounded-full hover:bg-slate-700 text-slate-500 hover:text-white transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
