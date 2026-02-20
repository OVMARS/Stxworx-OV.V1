import React from 'react';
import HomeFooter from '../components/HomeFooter';

const PrivacyPage: React.FC = () => {
  return (
    <>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="glass-panel rounded-2xl p-6 sm:p-8 md:p-10 border border-white/10">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-slate-400 text-sm sm:text-base mb-8">
          Last updated: February 2026
        </p>

        <div className="space-y-6 text-slate-300 leading-relaxed text-sm sm:text-base">
          <div>
            <h2 className="text-white font-bold mb-2">1. Information We Collect</h2>
            <p>
              We collect the minimum account and platform usage information required to operate the STXWORX
              freelance marketplace, including wallet address, profile details, and project activity.
            </p>
          </div>

          <div>
            <h2 className="text-white font-bold mb-2">2. How We Use Information</h2>
            <p>
              Information is used to authenticate users, process platform actions, support escrow workflows, and
              improve reliability, security, and user experience.
            </p>
          </div>

          <div>
            <h2 className="text-white font-bold mb-2">3. Data Security</h2>
            <p>
              We apply reasonable administrative and technical safeguards to protect platform data. On-chain actions
              are publicly visible by design on blockchain networks.
            </p>
          </div>

          <div>
            <h2 className="text-white font-bold mb-2">4. Contact</h2>
            <p>
              For privacy questions, please contact us through the Contact page.
            </p>
          </div>
        </div>
        </div>
      </section>
      <HomeFooter />
    </>
  );
};

export default PrivacyPage;
