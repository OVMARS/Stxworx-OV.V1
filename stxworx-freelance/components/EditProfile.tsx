
import React, { useState } from 'react';
import { FreelancerProfile } from '../types';
import { Save, User, MapPin, Briefcase, Code, Link as LinkIcon, Image as ImageIcon, Twitter, Shield, CheckCircle2 } from 'lucide-react';

interface EditProfileProps {
  profile: FreelancerProfile;
  onSave: (updatedProfile: FreelancerProfile) => void;
  onCancel: () => void;
  isSaving: boolean;
  onConnectX: () => void;
  isXConnected?: boolean;
  xUsername?: string;
}

const EditProfile: React.FC<EditProfileProps> = ({ profile, onSave, onCancel, isSaving, onConnectX, isXConnected, xUsername }) => {
  const [formData, setFormData] = useState<FreelancerProfile>(profile);
  const [newSkill, setNewSkill] = useState('');
  const [newPortfolioItem, setNewPortfolioItem] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill && (!formData.skills || !formData.skills.includes(newSkill))) {
      setFormData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills?.filter(s => s !== skillToRemove) || []
    }));
  };

  const handleAddPortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPortfolioItem) {
      setFormData(prev => ({
        ...prev,
        portfolio: [...(prev.portfolio || []), newPortfolioItem]
      }));
      setNewPortfolioItem('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <div>
           <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">Edit Profile</h1>
           <p className="text-slate-400 text-xs sm:text-sm mt-1">Update your professional information seen by clients.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Social Verification Section */}
        <div className="bg-[#0b0f19] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-800 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 sm:w-auto sm:p-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
           <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wide mb-4 sm:mb-6 flex items-center gap-2 relative z-10">
             <Shield className="w-5 h-5 text-purple-500" /> Identity Verification
           </h3>
           
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800 relative z-10">
              <div className="flex items-center gap-3 sm:gap-4">
                 <div className="p-2 sm:p-3 bg-[#1DA1F2]/10 rounded-full border border-[#1DA1F2]/20 shrink-0">
                    <Twitter className="w-5 h-5 sm:w-6 sm:h-6 text-[#1DA1F2]" />
                 </div>
                 <div>
                    <div className="font-bold text-white text-sm">X (formerly Twitter)</div>
                    <div className="text-xs text-slate-500 font-mono">
                       {isXConnected ? `Connected as ${xUsername}` : 'Link your account for reputation'}
                    </div>
                 </div>
              </div>
              
              {isXConnected ? (
                 <span className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                 </span>
              ) : (
                 <button
                    type="button"
                    onClick={onConnectX}
                    className="px-4 py-2 bg-[#1DA1F2] hover:bg-[#1a91da] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-blue-900/20"
                 >
                    Connect
                 </button>
              )}
           </div>
        </div>

        {/* Basic Info Section */}
        <div className="bg-[#0b0f19] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-800">
           <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wide mb-4 sm:mb-6 flex items-center gap-2">
             <User className="w-5 h-5 text-orange-500" /> Basic Information
           </h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-4">
                 <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center relative group cursor-pointer shrink-0">
                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                       <ImageIcon className="w-6 h-6 text-white" />
                    </div>
                 </div>
                 <div className="flex-1">
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Display Name</label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none transition-colors"
                    />
                 </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Professional Specialty</label>
                <input 
                  type="text" 
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleInputChange}
                  placeholder="e.g. Smart Contract Developer"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Hourly Rate (STX)</label>
                <input 
                  type="number" 
                  name="hourlyRate"
                  value={formData.hourlyRate || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. 50"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Bio / About</label>
                <textarea 
                  name="about"
                  rows={4}
                  value={formData.about || ''}
                  onChange={handleInputChange}
                  placeholder="Tell clients about your experience..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none transition-colors resize-none"
                />
              </div>
           </div>
        </div>

        {/* Skills Section */}
        <div className="bg-[#0b0f19] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-800">
           <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wide mb-4 sm:mb-6 flex items-center gap-2">
             <Code className="w-5 h-5 text-blue-500" /> Skills & Technologies
           </h3>

           <div className="mb-4 flex gap-2">
              <input 
                type="text" 
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill (e.g. Clarity, React, Rust)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(e)}
              />
              <button 
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-slate-800 text-white font-bold uppercase rounded-lg hover:bg-slate-700 transition-colors"
              >
                Add
              </button>
           </div>

           <div className="flex flex-wrap gap-2">
              {formData.skills?.map((skill, i) => (
                <span key={i} className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-sm flex items-center gap-2">
                   {skill}
                   <button 
                     type="button" 
                     onClick={() => removeSkill(skill)}
                     className="text-slate-500 hover:text-red-500"
                   >
                     &times;
                   </button>
                </span>
              ))}
              {(!formData.skills || formData.skills.length === 0) && (
                <p className="text-slate-500 text-sm italic">No skills added yet.</p>
              )}
           </div>
        </div>

        {/* Portfolio Section */}
        <div className="bg-[#0b0f19] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-800">
           <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wide mb-4 sm:mb-6 flex items-center gap-2">
             <Briefcase className="w-5 h-5 text-green-500" /> Portfolio Images
           </h3>

           <div className="mb-4 flex gap-2">
              <input 
                type="text" 
                value={newPortfolioItem}
                onChange={(e) => setNewPortfolioItem(e.target.value)}
                placeholder="Paste image URL..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-orange-500 focus:outline-none transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleAddPortfolio(e)}
              />
              <button 
                type="button"
                onClick={handleAddPortfolio}
                className="px-4 py-2 bg-slate-800 text-white font-bold uppercase rounded-lg hover:bg-slate-700 transition-colors"
              >
                Add
              </button>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.portfolio?.map((img, i) => (
                 <div key={i} className="aspect-video rounded-lg overflow-hidden border border-slate-800 relative group">
                    <img src={img} alt={`Portfolio ${i}`} className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                           ...prev,
                           portfolio: prev.portfolio?.filter((_, idx) => idx !== i)
                        }));
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      &times;
                    </button>
                 </div>
              ))}
           </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-4">
           <button
             type="submit"
             disabled={isSaving}
             className="w-full sm:flex-1 px-6 py-3 sm:py-4 bg-orange-600 text-white font-black uppercase tracking-wider rounded-xl hover:bg-orange-500 shadow-[0_0_20px_rgba(234,88,12,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
           >
             {isSaving ? 'Saving...' : <><Save className="w-5 h-5" /> Save Profile</>}
           </button>
           <button
             type="button"
             onClick={onCancel}
             className="w-full sm:w-auto px-6 py-3 sm:py-4 bg-slate-900 text-slate-400 font-bold uppercase tracking-wider rounded-xl hover:bg-slate-800 border border-slate-800 transition-all"
           >
             Cancel
           </button>
        </div>

      </form>
    </div>
  );
};

export default EditProfile;
