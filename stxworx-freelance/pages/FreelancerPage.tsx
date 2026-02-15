import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import ProjectCard from '../components/ProjectCard';
import Leaderboard from '../components/Leaderboard';
import {
  Briefcase, Settings, Send, CheckCircle2, Clock, Play, Trophy,
  DollarSign, Award, TrendingUp, FileText, Shield, ArrowRight,
} from 'lucide-react';
import { formatUSD, tokenToUsd } from '../services/StacksService';
import { Application, ApplicationStatus } from '../types';

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  applied:      { label: 'Applied',     color: 'text-blue-400',    icon: <Send className="w-3.5 h-3.5" />,         bg: 'bg-blue-950/30 border-blue-900/50' },
  accepted:     { label: 'Accepted',    color: 'text-amber-400',   icon: <CheckCircle2 className="w-3.5 h-3.5" />, bg: 'bg-amber-950/30 border-amber-900/50' },
  'in-progress': { label: 'In Progress', color: 'text-orange-400',  icon: <Play className="w-3.5 h-3.5" />,         bg: 'bg-orange-950/30 border-orange-900/50' },
  completed:    { label: 'Completed',   color: 'text-emerald-400', icon: <Trophy className="w-3.5 h-3.5" />,       bg: 'bg-emerald-950/30 border-emerald-900/50' },
};

const PIPELINE_STEPS: ApplicationStatus[] = ['applied', 'accepted', 'in-progress', 'completed'];

const FreelancerPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    projects, wallet, currentUserProfile, leaderboardData,
    freelancerDashboardTab, setFreelancerDashboardTab, isProcessing,
    handleProjectAction, setIsGigModalOpen, applications, updateApplicationStatus,
  } = useAppStore();

  const myApplications = useMemo(
    () => applications.filter((a) => a.freelancerAddress === wallet.address),
    [applications, wallet.address]
  );

  const appliedApps     = myApplications.filter((a) => a.status === 'applied');
  const activeApps      = myApplications.filter((a) => a.status === 'accepted' || a.status === 'in-progress');
  const completedApps   = myApplications.filter((a) => a.status === 'completed');
  const myProjects      = projects.filter((p) => p.freelancerAddress === wallet.address);

  const totalEarnings = useMemo(() => {
    return completedApps.reduce((sum, a) => sum + tokenToUsd(a.project.totalBudget, a.project.tokenType), 0);
  }, [completedApps]);

  const handleViewProfile = (address: string | any, name?: string) => {
    if (typeof address === 'string') {
      useAppStore.getState().viewProfileByAddress(address, name).then(() => navigate('/profile'));
    } else {
      useAppStore.getState().setSelectedProfile(address);
      navigate('/profile');
    }
  };

  const renderPipeline = (app: Application) => {
    const currentIdx = PIPELINE_STEPS.indexOf(app.status);
    return (
      <div className="flex items-center gap-1 mt-3">
        {PIPELINE_STEPS.map((step, i) => {
          const cfg = STATUS_CONFIG[step];
          const isActive = i <= currentIdx;
          return (
            <React.Fragment key={step}>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-all ${
                  isActive ? `${cfg.bg} ${cfg.color}` : 'bg-slate-900 border-slate-800 text-slate-600'
                }`}
              >
                {cfg.icon} {cfg.label}
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <ArrowRight className={`w-3 h-3 ${i < currentIdx ? 'text-slate-500' : 'text-slate-800'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const renderApplicationCard = (app: Application, showAdvance?: boolean) => {
    const { project } = app;
    const cfg = STATUS_CONFIG[app.status];
    const usdValue = tokenToUsd(project.totalBudget, project.tokenType);
    const nextStatus = PIPELINE_STEPS[PIPELINE_STEPS.indexOf(app.status) + 1];

    return (
      <div
        key={app.id}
        className="bg-[#0b0f19] rounded-xl border border-slate-800 hover:border-orange-500/30 transition-all duration-300 p-5 group"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                {project.category}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border flex items-center gap-1 ${cfg.bg} ${cfg.color}`}>
                {cfg.icon} {cfg.label}
              </span>
            </div>
            <h3 className="text-white font-bold text-base uppercase tracking-tight">{project.title}</h3>
            <p className="text-slate-500 text-xs mt-1 line-clamp-2">{project.description}</p>
          </div>
          <div className="text-right ml-4 shrink-0">
            <div className="text-lg font-black text-white">{formatUSD(usdValue)}</div>
            <div className="text-[10px] text-slate-600 font-mono">
              {project.totalBudget.toLocaleString()} {project.tokenType}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500 mb-1">
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" /> {project.milestones.length} milestones
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> Applied {new Date(app.appliedAt).toLocaleDateString()}
          </span>
          {project.isFunded && (
            <span className="flex items-center gap-1 text-emerald-500">
              <Shield className="w-3 h-3" /> Escrow Funded
            </span>
          )}
        </div>

        {renderPipeline(app)}

        {showAdvance && nextStatus && (
          <button
            onClick={() => updateApplicationStatus(app.id, nextStatus)}
            className="mt-4 w-full py-2.5 bg-slate-800 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2"
          >
            Move to {STATUS_CONFIG[nextStatus].label} <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  const EmptyState = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) => (
    <div className="text-center py-16 bg-[#0b0f19] rounded-2xl border border-dashed border-slate-800">
      <Icon className="w-14 h-14 mx-auto text-slate-700 mb-4" />
      <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
      <p className="text-slate-500 text-sm max-w-md mx-auto">{subtitle}</p>
    </div>
  );

  const tabs = [
    { key: 'applied' as const,   label: 'Applied',   icon: <Send className="w-4 h-4" />,         count: appliedApps.length },
    { key: 'active' as const,    label: 'Active',     icon: <Play className="w-4 h-4" />,         count: activeApps.length },
    { key: 'completed' as const, label: 'Completed',  icon: <CheckCircle2 className="w-4 h-4" />, count: completedApps.length },
    { key: 'earnings' as const,  label: 'Earnings',   icon: <DollarSign className="w-4 h-4" />,   count: null },
    { key: 'nft' as const,       label: 'NFT Badges', icon: <Award className="w-4 h-4" />,        count: null },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
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
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/browse')}
            className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all text-sm"
          >
            <Briefcase className="w-4 h-4" /> Browse Projects
          </button>
          <button
            onClick={() => setIsGigModalOpen(true)}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all hover:scale-105 text-sm"
          >
            <Briefcase className="w-4 h-4" /> Post New Gig
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Applied', value: appliedApps.length, color: 'text-blue-400', accent: 'border-blue-900/50' },
          { label: 'Active', value: activeApps.length, color: 'text-orange-400', accent: 'border-orange-900/50' },
          { label: 'Completed', value: completedApps.length, color: 'text-emerald-400', accent: 'border-emerald-900/50' },
          { label: 'Earnings', value: formatUSD(totalEarnings), color: 'text-white', accent: 'border-slate-700' },
        ].map((stat) => (
          <div key={stat.label} className={`bg-[#0b0f19] rounded-xl border ${stat.accent} p-4 text-center`}>
            <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-800 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFreelancerDashboardTab(tab.key)}
            className={`pb-3 px-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              freelancerDashboardTab === tab.key
                ? 'text-white border-orange-500'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            {tab.icon} {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {freelancerDashboardTab === 'applied' && (
        <div className="space-y-4">
          {appliedApps.length > 0 ? (
            appliedApps.map((app) => renderApplicationCard(app, true))
          ) : (
            <EmptyState
              icon={Send}
              title="No Applications Yet"
              subtitle="Browse open projects on the marketplace and apply to start earning."
            />
          )}
        </div>
      )}

      {freelancerDashboardTab === 'active' && (
        <div className="space-y-4">
          {activeApps.length > 0 ? (
            activeApps.map((app) => renderApplicationCard(app, true))
          ) : (
            <EmptyState
              icon={Play}
              title="No Active Contracts"
              subtitle="Once a client accepts your application, active contracts will appear here."
            />
          )}
        </div>
      )}

      {freelancerDashboardTab === 'completed' && (
        <div className="space-y-4">
          {completedApps.length > 0 ? (
            completedApps.map((app) => renderApplicationCard(app, false))
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="No Completed Work"
              subtitle="Completed contracts with released escrow payments will show here."
            />
          )}
        </div>
      )}

      {freelancerDashboardTab === 'earnings' && (
        <div className="space-y-6">
          <div className="bg-[#0b0f19] rounded-2xl border border-slate-800 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-orange-600/10 flex items-center justify-center border border-orange-900/50">
                <TrendingUp className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Earnings</h3>
                <div className="text-3xl font-black text-white">{formatUSD(totalEarnings)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Completed Jobs</div>
                <div className="text-xl font-black text-emerald-400">{completedApps.length}</div>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Active Jobs</div>
                <div className="text-xl font-black text-orange-400">{activeApps.length}</div>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Avg per Job</div>
                <div className="text-xl font-black text-white">
                  {completedApps.length > 0 ? formatUSD(totalEarnings / completedApps.length) : '$0.00'}
                </div>
              </div>
            </div>
          </div>

          {completedApps.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Payment History</h4>
              <div className="bg-[#0b0f19] rounded-xl border border-slate-800 divide-y divide-slate-800">
                {completedApps.map((app) => {
                  const usd = tokenToUsd(app.project.totalBudget, app.project.tokenType);
                  return (
                    <div key={app.id} className="flex items-center justify-between p-4">
                      <div>
                        <div className="text-sm font-bold text-white">{app.project.title}</div>
                        <div className="text-xs text-slate-500">{new Date(app.appliedAt).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-400">+{formatUSD(usd)}</div>
                        <div className="text-[10px] text-slate-600 font-mono">
                          {app.project.totalBudget.toLocaleString()} {app.project.tokenType}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {freelancerDashboardTab === 'nft' && (
        <div className="text-center py-20 bg-[#0b0f19] rounded-2xl border border-dashed border-slate-800">
          <Award className="w-16 h-16 mx-auto text-slate-700 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">NFT Badges</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-4">
            Earn on-chain achievement badges as you complete contracts and hit milestones.
          </p>
          <div className="flex justify-center gap-4 mt-6">
            {['First Job', '5 Contracts', '10K Earned', 'Top Rated'].map((badge) => (
              <div
                key={badge}
                className="w-20 h-20 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center"
              >
                <div className="text-center">
                  <Award className="w-6 h-6 text-slate-700 mx-auto mb-1" />
                  <span className="text-[9px] text-slate-600 font-bold uppercase">{badge}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-slate-600 text-xs mt-6 uppercase tracking-wider font-bold">Coming Soon</p>
        </div>
      )}
    </div>
  );
};

export default FreelancerPage;
