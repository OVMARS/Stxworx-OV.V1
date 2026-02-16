
import React, { useState } from 'react';
import { X, Zap, Image as ImageIcon, DollarSign, Clock, Tag } from 'lucide-react';
import { Gig } from '../types';
import { useAppStore } from '../stores/useAppStore';

interface CreateGigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const CreateGigModal: React.FC<CreateGigModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const categories = useAppStore((s) => s.categories);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Web Development',
    price: '',
    deliveryTime: '7',
    tags: '',
    imageUrl: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      price: Number(formData.price),
      deliveryTime: Number(formData.deliveryTime),
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
      imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=2670' // Default fallback
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative bg-slate-900 rounded-2xl shadow-2xl shadow-black w-full max-w-2xl overflow-hidden transform transition-all border border-slate-800 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-black uppercase tracking-tight text-white">Create New Gig</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Gig Title</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors placeholder-slate-700"
                  placeholder="I will build a Stacks smart contract..."
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  maxLength={80}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Category</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500 focus:outline-none appearance-none"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.length > 0
                      ? categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)
                      : ['Web Development', 'Smart Contracts', 'Design', 'Auditing', 'Writing', 'Marketing'].map((n) => <option key={n}>{n}</option>)
                    }
                  </select>
                </div>

                <div>
                   <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Delivery Time (Days)</label>
                   <div className="relative">
                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
                      <input
                        required
                        type="number"
                        min="1"
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                        value={formData.deliveryTime}
                        onChange={(e) => setFormData({...formData, deliveryTime: e.target.value})}
                      />
                   </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Price (USD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-bold">$</span>
                  </div>
                  <input
                    required
                    type="number"
                    min="5"
                    step="5"
                    className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500 focus:outline-none font-mono text-lg"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Description</label>
                <textarea
                  required
                  rows={5}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500 focus:outline-none resize-none placeholder-slate-700 text-sm"
                  placeholder="Describe your service in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div>
                 <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Cover Image URL</label>
                 <div className="flex gap-2">
                    <div className="relative flex-1">
                      <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
                      <input
                        type="text"
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500 focus:outline-none text-xs"
                        placeholder="https://..."
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      />
                    </div>
                 </div>
                 <p className="text-[10px] text-slate-600 mt-1">Leave empty for a random default image.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Tags (Comma separated)</label>
                <div className="relative">
                   <Tag className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
                   <input
                    type="text"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500 focus:outline-none text-sm"
                    placeholder="clarity, stacks, react, nft..."
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center items-center px-4 py-4 bg-orange-600 text-white font-black uppercase tracking-wider text-sm rounded-xl hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900 shadow-[0_0_20px_rgba(234,88,12,0.3)] transition-all hover:scale-[1.01] gap-2"
              >
                <Zap className="w-5 h-5" /> Publish Gig
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateGigModal;
