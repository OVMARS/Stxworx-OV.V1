import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import * as LucideIcons from 'lucide-react';
import {
  ShieldCheck, Zap, Layers, ArrowRight, Lock, Check, TrendingUp,
  Users, Hexagon, Twitter, Github, Globe, Code, Palette, Film,
} from 'lucide-react';

/** Map a Lucide icon name string (e.g. 'Code') to its component */
const getIcon = (name: string): React.ReactNode => {
  const Icon = (LucideIcons as any)[name] as React.FC<{ className?: string }>;
  return Icon ? <Icon /> : <Code />;
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentBlock, categories } = useAppStore();

  const fallbackCategories = [
    { icon: 'Palette', name: 'Creative & Design', subcategories: ['NFTs', 'UI/UX'] },
    { icon: 'Code', name: 'Development', subcategories: ['Clarity', 'React', 'Rust'] },
    { icon: 'Film', name: 'Media & Content', subcategories: ['Video', 'Technical Writing'] },
    { icon: 'Users', name: 'Community', subcategories: ['Moderation', 'Growth'] },
  ];
  const displayCategories = categories.length > 0 ? categories : fallbackCategories;

  return (
    <div className="relative font-sans text-slate-200">
      <div className="fixed inset-0 z-0 bg-[#020617]">
        <div className="absolute inset-0 bg-grid-moving opacity-10" style={{
          backgroundImage: 'linear-gradient(rgba(249, 115, 22, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(249, 115, 22, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 lg:pt-24 pb-12 sm:pb-16 lg:pb-20 relative z-10">

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center mb-16 sm:mb-24 lg:mb-40">
          <div className="space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-950/20 text-orange-400 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(249,115,22,0.3)] backdrop-blur-md">
              <ShieldCheck className="w-3 h-3" /> Blockchain-Secured Protocol
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl">
              SECURE<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-300 to-white text-glow">FREELANCE</span><br />
              LAYER
            </h1>
            <p className="text-base sm:text-lg text-slate-400 max-w-lg leading-relaxed border-l-2 border-orange-500/30 pl-4 sm:pl-6">
              Trustless escrow powered by Stacks smart contracts. Lock funds, complete work, get paid. <span className="text-white font-bold">100% On-Chain.</span>
            </p>
            <div className="flex gap-6 sm:gap-10 pt-4">
              <div className="group">
                <span className="block text-3xl sm:text-4xl font-black text-white group-hover:text-orange-500 transition-colors">100%</span>
                <span className="text-xs text-slate-500 uppercase tracking-[0.2em] font-bold">Secure</span>
              </div>
            </div>
            <div className="pt-4">
              <button
                onClick={() => navigate('/browse')}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-black font-black uppercase tracking-widest text-sm rounded hover:bg-orange-500 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transform hover:scale-105"
              >
                Marketplace
              </button>
            </div>
          </div>

          <div className="relative perspective-1000 animate-slide-up delay-200 hidden sm:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/20 to-blue-600/20 rounded-3xl blur-2xl transform rotate-3 scale-105 animate-pulse" />
            <div className="relative glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-8 animate-float shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t border-l border-white/10">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/20">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Smart Contract Escrow</h3>
                    <p className="text-orange-400/80 text-xs font-mono flex items-center gap-2">
                      Status: <span className="text-green-400 animate-pulse">ACTIVE</span> • Block #{currentBlock}
                    </p>
                  </div>
                </div>
                <Hexagon className="w-8 h-8 text-slate-700 opacity-50 animate-spin-slow" />
              </div>
              <div className="space-y-4 relative">
                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-800 z-0" />
                <div className="relative z-10 flex items-center gap-4 p-4 bg-slate-900/40 rounded-xl border border-white/5">
                  <div className="w-12 h-12 rounded-full bg-[#0b0f19] flex items-center justify-center border-2 border-slate-700 shadow-lg">
                    <Check className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm tracking-wide">Client Locks Funds</div>
                    <div className="text-slate-500 text-xs font-mono">500 STX Secured in Vault</div>
                  </div>
                </div>
                <div className="relative z-10 flex items-center gap-4 p-4 bg-gradient-to-r from-orange-900/20 to-transparent rounded-xl border border-orange-500/30">
                  <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center border-2 border-white/20 animate-pulse">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm tracking-wide">Automatic Release</div>
                    <div className="text-orange-300 text-xs font-mono">Funds transferred to wallet</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-16 sm:mb-24 lg:mb-40 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="text-center mb-16 animate-slide-up delay-300">
            <div className="inline-block px-4 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
              Decentralized Talent
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">Explore the <span className="text-orange-500">Ecosystem</span></h2>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto">Find elite developers and creators verified on the Stacks blockchain</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 animate-slide-up delay-500">
            {displayCategories.map((cat, idx) => (
              <div key={idx} onClick={() => navigate('/browse')} className="cursor-pointer group relative bg-[#0b0f19] p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(249,115,22,0.3)]">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-600/0 via-orange-600/0 to-orange-600/0 group-hover:from-orange-600/10 group-hover:to-purple-600/10 transition-all duration-500" />
                <div className="absolute bottom-0 left-0 h-1 w-full bg-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-slate-900 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-400 mb-3 sm:mb-4 md:mb-6 border border-slate-800 group-hover:border-orange-500/50 group-hover:text-orange-500 transition-colors relative z-10">
                  {getIcon(cat.icon)}
                </div>
                <h3 className="text-sm sm:text-base md:text-xl font-bold text-white mb-1 sm:mb-2 relative z-10">{cat.name}</h3>
                <p className="text-slate-500 text-[10px] sm:text-xs mb-4 sm:mb-6 md:mb-8 uppercase tracking-wide relative z-10 line-clamp-1 sm:line-clamp-none">{cat.subcategories.join(', ')}</p>
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/5 relative z-10">
                  <span className="text-xs text-slate-600 font-mono group-hover:text-slate-400 transition-colors">Marketplace &rarr;</span>
                  <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16 sm:mb-24 lg:mb-40">
          <div className="flex flex-col items-center mb-8 sm:mb-12 md:mb-16 animate-slide-up">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center text-white mb-4 tracking-tighter">Protocol Mechanics</h2>
            <div className="h-1 w-20 bg-orange-500 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-orange-500/0 via-orange-500/30 to-orange-500/0" />
            {[
              { step: '01', title: 'Connect', desc: 'Link your Xverse or Leather wallet to the Stacks Mainnet.' },
              { step: '02', title: 'Lock', desc: 'Client deposits STX into the audited smart contract escrow.' },
              { step: '03', title: 'Settlement', desc: 'Smart contract validates deliverables and releases payment.' },
            ].map((item, idx) => (
              <div key={idx} className="relative bg-[#05080f] p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-white/5 text-center hover:bg-[#0b0f19] transition-all duration-500 group hover:border-orange-500/30">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto bg-[#020617] rounded-full flex items-center justify-center border-4 border-[#0b0f19] relative z-10 mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:border-orange-500/30">
                  <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500 group-hover:from-orange-500 group-hover:to-amber-500">{item.step}</span>
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-4 uppercase tracking-tight">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Get Started */}
        <div className="mb-16 sm:mb-24 lg:mb-32">
          <div className="glass-panel p-1 rounded-2xl sm:rounded-3xl animate-slide-up">
            <div className="bg-[#020617]/80 rounded-[18px] sm:rounded-[22px] py-8 sm:py-12 md:py-16 px-4 sm:px-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center text-white mb-6 sm:mb-8 md:mb-12 relative z-10">Initialize Session</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto relative z-10">
                <button
                  onClick={() => { navigate('/client'); window.scrollTo(0, 0); }}
                  className="group relative overflow-hidden bg-[#0b0f19] p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-white/10 hover:border-orange-500 transition-all duration-300 text-left"
                >
                  <div className="absolute right-0 top-0 p-32 bg-orange-600/5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:bg-orange-600/10 transition-colors" />
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-white mb-6 group-hover:bg-orange-600 transition-colors">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">Client Access</h3>
                  <p className="text-slate-400 text-sm mb-6">Deploy contracts & manage talent</p>
                  <div className="flex items-center text-orange-500 text-sm font-bold uppercase tracking-wider">
                    Launch Dashboard <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                  </div>
                </button>

                <div className="group relative overflow-hidden bg-[#0b0f19] p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-white/10 hover:border-blue-500 transition-all duration-300 text-left flex flex-col justify-between">
                  <div className="absolute right-0 top-0 p-32 bg-blue-600/5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:bg-blue-600/10 transition-colors" />
                  <div>
                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-white mb-6 group-hover:bg-blue-600 transition-colors">
                      <Zap className="w-6 h-6" />
                    </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-blue-500 transition-colors">Freelancer Access</h3>
                    <p className="text-slate-400 text-sm mb-6">Accept contracts & withdraw sBTC</p>
                  </div>
                  <div className="flex flex-col gap-3 mt-auto relative z-10">
                    <button
                      onClick={() => { navigate('/freelancer'); window.scrollTo(0, 0); }}
                      className="flex items-center justify-center w-full py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-blue-500 transition-colors"
                    >
                      Launch Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#020617] border-t border-white/5 pt-10 sm:pt-14 md:pt-20 pb-8 sm:pb-10 relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-600/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12 mb-10 sm:mb-14 md:mb-20">
            <div className="col-span-2 sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <Hexagon className="h-8 w-8 text-orange-600 fill-orange-600/20" />
                <span className="text-2xl font-black text-white tracking-tighter">
                  STX<span className="text-orange-600">WORX</span>
                </span>
              </div>
              <div className="text-[10px] font-bold text-slate-500 mb-4 tracking-widest uppercase">Power by $STX & $BTC</div>
              <p className="text-slate-500 text-sm leading-relaxed">The decentralized labor layer for the Bitcoin economy.</p>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-6 border-b border-orange-500/30 inline-block pb-1">Platform</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><button onClick={() => navigate('/')} className="hover:text-orange-500 transition-colors">Home</button></li>
                <li><button onClick={() => navigate('/browse')} className="hover:text-orange-500 transition-colors">Marketplace</button></li>
                <li><button onClick={() => { navigate('/client'); window.scrollTo(0, 0); }} className="hover:text-orange-500 transition-colors">Client Dashboard</button></li>
                <li><button onClick={() => { navigate('/freelancer'); window.scrollTo(0, 0); }} className="hover:text-orange-500 transition-colors">Freelancer Dashboard</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-6 border-b border-orange-500/30 inline-block pb-1">Resources</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-orange-500 transition-colors">Stacks Docs</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Get Wallet</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-6 border-b border-orange-500/30 inline-block pb-1">Connect</h4>
              <div className="flex gap-4">
                {[Twitter, Github, Globe].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-lg bg-[#0b0f19] flex items-center justify-center text-slate-400 hover:text-white hover:bg-orange-600 transition-all border border-white/10">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-slate-600 text-xs font-mono">© 2026 STX Freelance Hub. All rights reserved.</span>
            <div className="flex gap-8 text-slate-600 text-xs font-bold uppercase tracking-wider">
              <a href="#" className="hover:text-orange-500 transition-colors">Privacy</a>
              <a href="#" className="hover:text-orange-500 transition-colors">Terms</a>
              <a href="#" className="hover:text-orange-500 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
