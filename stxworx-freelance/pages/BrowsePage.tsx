import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import GigCard from '../components/GigCard';
import { Search } from 'lucide-react';

const CATEGORIES = ['All', 'Smart Contracts', 'Web Development', 'Design', 'Auditing', 'Writing'];

const BrowsePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    filteredGigs, selectedCategory, setSelectedCategory,
    openHireModal, setSelectedGig, wallet,
  } = useAppStore();

  const handleViewProfile = (address: string, name?: string) => {
    useAppStore.getState().viewProfileByAddress(address, name).then(() => {
      navigate('/profile');
    });
  };

  const handleHireGig = (gig: any) => {
    if (!wallet.isConnected) return;
    openHireModal(gig);
  };

  const handleViewDetails = (gig: any) => {
    useAppStore.getState().setSelectedGig(gig);
    navigate('/gig');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Browse Gigs</h2>
          <p className="text-slate-400 text-sm mt-1">Found {filteredGigs.length} results</p>
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

      {filteredGigs.length > 0 ? (
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
      )}
    </div>
  );
};

export default BrowsePage;
