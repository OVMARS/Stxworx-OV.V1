import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import GigCard from '../components/GigCard';
import { Search, Briefcase, Layers, Clock, DollarSign, Send, CheckCircle2, X } from 'lucide-react';
import { formatUSD, tokenToUsd } from '../services/StacksService';
import { Project } from '../types';

type BrowseTab = 'gigs' | 'projects';

const BrowsePage: React.FC = () => {
  const navigate = useNavigate();
  const [browseTab, setBrowseTab] = useState<BrowseTab>('gigs');
  const [applyTarget, setApplyTarget] = useState<Project | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const {
    filteredGigs, projects, selectedCategory, setSelectedCategory,
    openHireModal, wallet, userRole, applyToProject, hasAppliedToProject,
    categories, isProcessing,
  } = useAppStore();

  const CATEGORIES = ['All', ...categories.map((c) => c.name)];

  const openProjects = useMemo(() => {
    let result = projects.filter((p) => !p.freelancerAddress || p.freelancerAddress === '');
    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory);
    }
    return result;
  }, [projects, selectedCategory]);

  const handleViewProfile = (address: string, name?: string) => {
    useAppStore.getState().viewProfileByAddress(address, name).then(() => navigate('/profile'));
  };

  const handleHireGig = (gig: any) => {
    if (!wallet.isConnected) return;
    openHireModal(gig);
  };

  const handleViewDetails = (gig: any) => {
    useAppStore.getState().setSelectedGig(gig);
    navigate('/gig');
  };

  const handleApplyClick = (project: Project) => {
    if (!wallet.isConnected || hasAppliedToProject(project.id)) return;
    setApplyTarget(project);
    setCoverLetter('');
  };

  const handleSubmitProposal = async () => {
    if (!applyTarget || !coverLetter.trim()) return;
    setApplyLoading(true);
    await applyToProject(applyTarget, coverLetter.trim());
    setApplyLoading(false);
    setApplyTarget(null);
    setCoverLetter('');
  };

  const itemCount = browseTab === 'gigs' ? filteredGigs.length : openProjects.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Browse Marketplace</h2>
          <p className="text-slate-400 text-sm mt-1">Found {itemCount} results</p>
        </div>
        <div className="flex items-center gap-4 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          <div className="flex bg-[#0b0f19] p-1 rounded-lg border border-slate-800">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-4 border-b border-slate-800 mb-8">
        <button
          onClick={() => setBrowseTab('gigs')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
            browseTab === 'gigs' ? 'text-white border-orange-500' : 'text-slate-500 border-transparent hover:text-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" /> Freelancer Gigs
        </button>
        <button
          onClick={() => setBrowseTab('projects')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
            browseTab === 'projects' ? 'text-white border-orange-500' : 'text-slate-500 border-transparent hover:text-slate-300'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Client Projects
        </button>
      </div>

      {browseTab === 'gigs' ? (
        filteredGigs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGigs.map((gig) => (
              <GigCard
                key={gig.id}
                gig={gig}
                onHire={handleHireGig}
                onViewProfile={handleViewProfile}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Search className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-bold">No gigs found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )
      ) : openProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {openProjects.map((project) => {
            const applied = hasAppliedToProject(project.id);
            const usdValue = tokenToUsd(project.totalBudget, project.tokenType);
            return (
              <div
                key={project.id}
                className="bg-[#0b0f19] rounded-xl border border-slate-800 hover:border-orange-500/50 transition-all duration-300 p-6 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-full blur-[50px] -mr-16 -mt-16 group-hover:bg-orange-600/10 transition-all" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                      {project.category}
                    </span>
                    <span className="px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider bg-orange-950/30 text-orange-500 border border-orange-900/50">
                      {project.milestones.length} Milestones
                    </span>
                    {project.isFunded && (
                      <span className="px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider bg-emerald-950/30 text-emerald-400 border border-emerald-900/50">
                        Funded
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 group-hover:text-orange-500 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>

                  <div className="flex items-center gap-6 text-xs text-slate-500 mb-5">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-orange-500" />
                      <span className="font-bold text-white">{formatUSD(usdValue)}</span>
                      <span className="text-slate-600 font-mono">({project.totalBudget.toLocaleString()} {project.tokenType})</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Milestone preview */}
                  <div className="flex gap-1 mb-5">
                    {project.milestones.map((m, i) => (
                      <div key={i} className="flex-1 h-1.5 rounded-full bg-slate-800" title={m.title} />
                    ))}
                  </div>

                  {userRole === 'freelancer' && wallet.isConnected && (
                    <button
                      onClick={() => handleApplyClick(project)}
                      disabled={applied}
                      className={`w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        applied
                          ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/50 cursor-default'
                          : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20 hover:scale-[1.02]'
                      }`}
                    >
                      {applied ? (
                        <><CheckCircle2 className="w-4 h-4" /> Applied</>
                      ) : (
                        <><Send className="w-4 h-4" /> Apply to Project</>
                      )}
                    </button>
                  )}

                  {userRole === 'client' && (
                    <div className="text-xs text-slate-600 font-bold uppercase tracking-wider text-center mt-2">
                      Your posted project
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Briefcase className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-bold">No open projects</p>
          <p className="text-sm">Check back later for new client contracts</p>
        </div>
      )}

      {/* Cover Letter Modal */}
      {applyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0d1117] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Submit Proposal</h3>
                <p className="text-xs text-slate-500 mt-1">{applyTarget.title}</p>
              </div>
              <button
                onClick={() => setApplyTarget(null)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Cover Letter <span className="text-orange-500">*</span>
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={5}
                placeholder="Describe your relevant experience, approach, and why you're a great fit for this project..."
                className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 resize-none"
              />
              <p className="text-[10px] text-slate-600 mt-1">{coverLetter.length} characters</p>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setApplyTarget(null)}
                className="flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wider bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitProposal}
                disabled={!coverLetter.trim() || applyLoading}
                className="flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wider bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {applyLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Send className="w-4 h-4" /> Submit Proposal</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowsePage;
