
import React from 'react';
import { FreelancerProfile as FreelancerProfileType, Gig } from '../types';
import { ShieldCheck, Trophy, MapPin, Star, Calendar, ArrowLeft, Mail, ExternalLink, Briefcase, Coins, CheckCircle, Award, CheckCircle2, MessageSquare } from 'lucide-react';
import { formatUSD } from '../services/StacksService';
import { useAppStore } from '../stores/useAppStore';
import type { BackendReview } from '../lib/api';

interface FreelancerProfileProps {
  profile: FreelancerProfileType;
  gigs: Gig[]; // Pass gigs to show active listings
  onBack: () => void;
  onHire: (gig: Gig) => void;
  onContact: (profile: FreelancerProfileType) => void;
}

const FreelancerProfile: React.FC<FreelancerProfileProps> = ({ profile, gigs, onBack, onHire, onContact }) => {
  const { profileReviews, fetchProfileReviews } = useAppStore();

  // Fetch real reviews for this profile
  React.useEffect(() => {
    if (profile.address) {
      fetchProfileReviews(profile.address);
    }
  }, [profile.address]);

  const reviews = profileReviews[profile.address] || [];

  // Filter gigs for this freelancer
  const freelancerGigs = gigs.filter(g =>
    g.freelancerAddress === profile.address ||
    (profile.name === g.freelancerName)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors text-sm font-bold uppercase tracking-wider group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back
      </button>

      {/* Header Card */}
      <div className="bg-[#0b0f19] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative mb-8">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="absolute top-0 right-0 p-32 bg-orange-600/10 rounded-full blur-[80px]"></div>
        </div>

        <div className="px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row justify-between items-start">
            {/* Avatar & Info */}
            <div className="flex flex-col md:flex-row gap-6 -mt-16 relative z-10">
              <div className="w-32 h-32 rounded-full border-4 border-[#0b0f19] bg-slate-800 overflow-hidden shadow-xl relative">
                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                {profile.isIdVerified && (
                  <div className="absolute bottom-1 right-1 bg-blue-500 p-1.5 rounded-full border-2 border-[#0b0f19]" title="ID Verified">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div className="pt-2 md:pt-16">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-black text-white">{profile.name}</h1>
                  {profile.isIdVerified && (
                    <span className="flex items-center gap-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-3 h-3" /> ID Verified
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 font-mono mb-4">
                  <span className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    <MapPin className="w-3 h-3" /> {profile.address.slice(0, 6)}...{profile.address.slice(-4)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Joined 2024
                  </span>
                </div>

                {/* Verification Badges Row */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {profile.badges.map((badge, i) => (
                    <span key={i} className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${badge === 'Top Rated' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        badge === 'Verified' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                      {badge}
                    </span>
                  ))}
                </div>

                {/* Trust Indicators */}
                <div className="flex gap-3 mt-1">
                  {profile.isSkillVerified && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold px-2 py-1 bg-amber-500/5 rounded border border-amber-500/10" title="Passed Technical Assessment">
                      <Award className="w-3 h-3" /> Skills Verified
                    </div>
                  )}
                  {profile.isPortfolioVerified && (
                    <div className="flex items-center gap-1.5 text-xs text-green-500 font-bold px-2 py-1 bg-green-500/5 rounded border border-green-500/10" title="Proof of Work Verified">
                      <CheckCircle2 className="w-3 h-3" /> Portfolio Verified
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 md:mt-6 flex gap-3 w-full md:w-auto">
              <button
                onClick={() => onContact(profile)}
                className="flex-1 md:flex-none px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold uppercase tracking-wider rounded border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" /> Contact
              </button>
              <button className="flex-1 md:flex-none px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold uppercase tracking-wider rounded border border-slate-700 transition-colors flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" /> Explorer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & About */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#0b0f19] p-5 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="p-3 bg-orange-500/10 rounded-full mb-3">
                <Coins className="w-6 h-6 text-orange-500" />
              </div>
              <div className="text-2xl font-black text-white">{formatUSD(profile.totalEarnings)}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Earned</div>
            </div>
            <div className="bg-[#0b0f19] p-5 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="p-3 bg-blue-500/10 rounded-full mb-3">
                <CheckCircle className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-white">{profile.jobsCompleted}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Jobs Completed</div>
            </div>
            <div className="bg-[#0b0f19] p-5 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="p-3 bg-green-500/10 rounded-full mb-3">
                <Star className="w-6 h-6 text-green-500 fill-green-500/20" />
              </div>
              <div className="text-2xl font-black text-white">{profile.rating.toFixed(1)}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Rating</div>
            </div>
          </div>

          {/* About */}
          <div className="bg-[#0b0f19] p-8 rounded-xl border border-slate-800">
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-slate-500" /> About Me
            </h3>
            <p className="text-slate-400 leading-relaxed">
              {profile.about || "This freelancer has not added a bio yet. They specialize in " + profile.specialty + "."}
            </p>
          </div>

          {/* Portfolio (Mock) */}
          {profile.portfolio && profile.portfolio.length > 0 && (
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                Recent Deliverables
                {profile.isPortfolioVerified && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {profile.portfolio.map((img, i) => (
                  <div key={i} className="aspect-video rounded-lg overflow-hidden border border-slate-800 group relative">
                    <img src={img} alt="Portfolio" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ExternalLink className="w-6 h-6 text-white" />
                    </div>
                    {profile.isPortfolioVerified && (
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur rounded px-1.5 py-0.5 text-[9px] font-bold uppercase text-green-400 border border-green-500/30 flex items-center gap-1">
                        <span title="Verified On-Chain"><CheckCircle2 className="w-3 h-3" /></span> Verified
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <div className="bg-[#0b0f19] p-8 rounded-xl border border-slate-800">
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-slate-500" /> Reviews ({reviews.length})
            </h3>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review: BackendReview) => (
                  <div key={review.id} className="p-4 bg-[#05080f] border border-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`}
                          />
                        ))}
                        <span className="ml-2 text-xs font-bold text-slate-400">{review.rating}/5</span>
                      </div>
                      <span className="text-[10px] text-slate-600 font-mono">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-slate-400 leading-relaxed">{review.comment}</p>
                    )}
                    <div className="text-[10px] text-slate-600 mt-2">Project #{review.projectId}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No reviews yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: Active Gigs */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4">Active Gigs</h3>
            <div className="space-y-4">
              {freelancerGigs.length > 0 ? (
                freelancerGigs.map(gig => (
                  <div key={gig.id} className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800 hover:border-orange-500/30 transition-all group">
                    <h4 className="font-bold text-white mb-2 line-clamp-2">{gig.title}</h4>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">{gig.category}</span>
                      <span className="font-bold text-orange-500">{formatUSD(gig.price)}</span>
                    </div>
                    <button
                      onClick={() => onHire(gig)}
                      className="w-full py-2 bg-slate-800 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors"
                    >
                      Hire Now
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-6 bg-[#0b0f19] rounded-xl border border-dashed border-slate-800 text-center">
                  <p className="text-slate-500 text-sm">No active gigs listed.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancerProfile;
