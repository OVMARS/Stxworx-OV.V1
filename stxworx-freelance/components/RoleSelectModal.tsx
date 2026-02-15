import React from 'react';
import { Users, Zap, ArrowRight, X, Loader2 } from 'lucide-react';

interface RoleSelectModalProps {
  open: boolean;
  onSelect: (role: 'client' | 'freelancer') => void;
  onClose: () => void;
  isProcessing?: boolean;
}

const RoleSelectModal: React.FC<RoleSelectModalProps> = ({ open, onSelect, onClose, isProcessing }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative w-full max-w-lg mx-4 animate-[fadeUp_0.35s_ease-out]">
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-orange-500/30 to-transparent pointer-events-none" />

        <div className="relative bg-[#0b0f19] border border-white/10 rounded-2xl p-8 shadow-[0_0_80px_rgba(249,115,22,0.08)]">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-40"
            title="Cancel & disconnect"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Role</span>
            </h2>
            <p className="text-sm text-slate-500 mt-2 tracking-wide">
              Select how you want to use STXWorx
            </p>
          </div>

          {isProcessing && (
            <div className="absolute inset-0 z-10 bg-[#0b0f19]/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="text-sm font-bold text-white uppercase tracking-wider">Signing in...</p>
              <p className="text-xs text-slate-500">Approve the signature in your wallet</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Client Card */}
            <button
              onClick={() => onSelect('client')}
              disabled={isProcessing}
              className="group relative flex flex-col items-center gap-4 p-6 rounded-xl border border-white/10 bg-[#020617]/60 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-40 disabled:pointer-events-none"
            >
              <div className="relative w-14 h-14 flex items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] transition-all duration-300">
                <Users className="w-7 h-7 text-orange-500" />
              </div>
              <div className="text-center">
                <span className="block text-sm font-bold uppercase tracking-wider text-white group-hover:text-orange-400 transition-colors">
                  Client
                </span>
                <span className="block text-xs text-slate-500 mt-1">
                  Post projects & hire talent
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
            </button>

            {/* Freelancer Card */}
            <button
              onClick={() => onSelect('freelancer')}
              disabled={isProcessing}
              className="group relative flex flex-col items-center gap-4 p-6 rounded-xl border border-white/10 bg-[#020617]/60 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-40 disabled:pointer-events-none"
            >
              <div className="relative w-14 h-14 flex items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                <Zap className="w-7 h-7 text-blue-500" />
              </div>
              <div className="text-center">
                <span className="block text-sm font-bold uppercase tracking-wider text-white group-hover:text-blue-400 transition-colors">
                  Freelancer
                </span>
                <span className="block text-xs text-slate-500 mt-1">
                  Find work & earn crypto
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectModal;
