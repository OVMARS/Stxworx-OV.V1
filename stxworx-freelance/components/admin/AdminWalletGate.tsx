import React from 'react';
import { Wallet, ShieldCheck, Hexagon, ArrowRight, Lock } from 'lucide-react';
import { useWallet } from '../wallet/WalletProvider';

interface AdminWalletGateProps {
  children: React.ReactNode;
}

/**
 * Full-screen wallet connection gate for admin panel.
 * After admin auth (JWT), the admin must also connect their Stacks wallet
 * to sign on-chain transactions (dispute resolution, fund releases, NFT minting).
 * Blocks all admin functionality until wallet is connected.
 */
const AdminWalletGate: React.FC<AdminWalletGateProps> = ({ children }) => {
  const { isSignedIn, userAddress, connect } = useWallet();

  // Wallet connected — render admin panel
  if (isSignedIn && userAddress) {
    return <>{children}</>;
  }

  // Wallet not connected — show full-screen gate
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      
      {/* Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[100px]"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-8 text-center border-b border-slate-800 bg-gradient-to-b from-slate-900/50 to-transparent">
            <div className="w-16 h-16 bg-orange-600/10 border border-orange-600/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Hexagon className="w-8 h-8 text-orange-600 fill-orange-600/20" />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
              Connect <span className="text-orange-500">Admin Wallet</span>
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your identity is verified. Connect your Stacks wallet to unlock admin controls.
            </p>
          </div>

          {/* Auth Status */}
          <div className="px-8 pt-6">
            <div className="flex items-center gap-3 bg-green-950/20 border border-green-900/30 rounded-xl p-4">
              <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-green-500 uppercase tracking-wider">Step 1 — Authenticated</div>
                <div className="text-[11px] text-green-400/60 mt-0.5">Admin credentials verified</div>
              </div>
            </div>
          </div>

          {/* Wallet Step */}
          <div className="px-8 pt-4">
            <div className="flex items-center gap-3 bg-orange-950/20 border border-orange-900/30 rounded-xl p-4">
              <div className="w-8 h-8 bg-orange-600/20 rounded-lg flex items-center justify-center shrink-0 animate-pulse">
                <Wallet className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-orange-500 uppercase tracking-wider">Step 2 — Connect Wallet</div>
                <div className="text-[11px] text-orange-400/60 mt-0.5">Required to sign on-chain transactions</div>
              </div>
            </div>
          </div>

          {/* Why */}
          <div className="px-8 pt-5">
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-3">Required For</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Dispute Resolution',
                'Fund Releases',
                'Force Refunds',
                'NFT Minting',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-slate-400">
                  <Lock className="w-3 h-3 text-slate-600" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Connect Button */}
          <div className="p-8">
            <button
              onClick={connect}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-orange-900/30 transition-all hover:scale-[1.02] hover:shadow-orange-900/50 active:scale-[0.98]"
            >
              <Wallet className="w-5 h-5" />
              Connect Stacks Wallet
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-center text-[10px] text-slate-600 mt-3">
              Leather or Xverse wallet supported
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-700 mt-4">
          Two-factor authorization: Credentials + Wallet Signing
        </p>
      </div>
    </div>
  );
};

export default AdminWalletGate;
