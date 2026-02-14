import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import ProjectCard from '../components/ProjectCard';
import Leaderboard from '../components/Leaderboard';
import { Briefcase, Settings } from 'lucide-react';

const FreelancerPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    projects, wallet, currentUserProfile, leaderboardData,
    freelancerTab, setFreelancerTab, isProcessing,
    handleProjectAction, setIsGigModalOpen,
  } = useAppStore();

  const myProjects = projects.filter((p) => p.freelancerAddress === wallet.address);

  const handleViewProfile = (address: string | any, name?: string) => {
    if (typeof address === 'string') {
      useAppStore.getState().viewProfileByAddress(address, name).then(() => navigate('/profile'));
    } else {
      useAppStore.getState().setSelectedProfile(address);
      navigate('/profile');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Freelancer Portal</h1>
          <div className="flex items-center gap-4 mt-2">
            {currentUserProfile && (
              <div className="flex items-center gap-2">
                <img src={currentUserProfile.avatar} className="w-6 h-6 rounded-full border border-slate-700" alt="" />
                <span className="text-slate-300 font-bold text-sm">{currentUserProfile.name}</span>
              </div>
            )}
            <div className="h-4 w-px bg-slate-700" />
            <button
              onClick={() => navigate('/edit-profile')}
              className="text-xs font-bold text-orange-500 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Settings className="w-3 h-3" /> Edit Profile
            </button>
          </div>
        </div>
        <button
          onClick={() => setIsGigModalOpen(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all hover:scale-105"
        >
          <Briefcase className="w-5 h-5" /> Post New Gig
        </button>
      </div>

      <div className="flex gap-6 border-b border-slate-800 mb-8">
        <button
          onClick={() => setFreelancerTab('active')}
          className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
            freelancerTab === 'active' ? 'text-white border-orange-500' : 'text-slate-500 border-transparent hover:text-slate-300'
          }`}
        >
          Active Jobs
        </button>
        <button
          onClick={() => setFreelancerTab('leaderboard')}
          className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
            freelancerTab === 'leaderboard' ? 'text-white border-orange-500' : 'text-slate-500 border-transparent hover:text-slate-300'
          }`}
        >
          Leaderboard
        </button>
      </div>

      {freelancerTab === 'active' ? (
        <div className="space-y-6">
          {myProjects.length > 0 ? (
            myProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                role="freelancer"
                onAction={handleProjectAction}
                isProcessing={isProcessing}
              />
            ))
          ) : (
            <div className="text-center py-20 bg-[#0b0f19] rounded-2xl border border-dashed border-slate-800">
              <Briefcase className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Active Jobs</h3>
              <p className="text-slate-400 max-w-md mx-auto mb-6">
                You haven't been hired for any projects yet. Improve your profile or post more gigs.
              </p>
              <button
                onClick={() => setIsGigModalOpen(true)}
                className="text-blue-500 font-bold hover:underline uppercase tracking-wide text-xs"
              >
                Post a Service Gig
              </button>
            </div>
          )}
        </div>
      ) : (
        <Leaderboard data={leaderboardData} currentAddress={wallet.address} onViewProfile={handleViewProfile} />
      )}
    </div>
  );
};

export default FreelancerPage;
