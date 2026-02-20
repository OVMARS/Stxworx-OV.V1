import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Hexagon, Twitter } from 'lucide-react';

const socialLinks = [
  { Icon: Twitter, href: 'https://x.com/STXWORX', label: 'STXWORX on X' },
  { Icon: Globe, href: 'https://gowhite.xyz/', label: 'GoWhite Website' },
];

const HomeFooter: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-[#020617] border-t border-white/5 pt-10 sm:pt-14 md:pt-20 pb-8 sm:pb-10 relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-[300px] bg-orange-600/5 rounded-full blur-[100px] pointer-events-none" />
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
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-[#0b0f19] flex items-center justify-center text-slate-400 hover:text-white hover:bg-orange-600 transition-all border border-white/10"
                >
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
  );
};

export default HomeFooter;
