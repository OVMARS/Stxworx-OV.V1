import React from 'react';
import { Mail, Globe, Twitter } from 'lucide-react';
import HomeFooter from '../components/HomeFooter';

const ContactPage: React.FC = () => {
  return (
    <>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="glass-panel rounded-2xl p-6 sm:p-8 md:p-10 border border-white/10">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">Contact</h1>
        <p className="text-slate-400 text-sm sm:text-base mb-8">
          Reach out for support, partnerships, or platform questions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <a
            href="mailto:hello@stxworx.com"
            className="bg-[#0b0f19] border border-white/10 rounded-xl p-5 hover:border-orange-500/50 transition-colors"
          >
            <Mail className="w-5 h-5 text-orange-500 mb-3" />
            <div className="text-white font-bold">Email</div>
            <div className="text-slate-400 text-sm break-all">hello@stxworx.com</div>
          </a>

          <a
            href="https://x.com/STXWORX"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0b0f19] border border-white/10 rounded-xl p-5 hover:border-orange-500/50 transition-colors"
          >
            <Twitter className="w-5 h-5 text-orange-500 mb-3" />
            <div className="text-white font-bold">X (Twitter)</div>
            <div className="text-slate-400 text-sm">@STXWORX</div>
          </a>

          <a
            href="https://gowhite.xyz/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0b0f19] border border-white/10 rounded-xl p-5 hover:border-orange-500/50 transition-colors"
          >
            <Globe className="w-5 h-5 text-orange-500 mb-3" />
            <div className="text-white font-bold">Website</div>
            <div className="text-slate-400 text-sm">gowhite.xyz</div>
          </a>
        </div>
        </div>
      </section>
      <HomeFooter />
    </>
  );
};

export default ContactPage;
