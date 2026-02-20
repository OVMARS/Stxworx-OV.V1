import React from 'react';
import HomeFooter from '../components/HomeFooter';

const TermsPage: React.FC = () => {
  return (
    <>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="glass-panel rounded-2xl p-6 sm:p-8 md:p-10 border border-white/10">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">Terms of Service</h1>
        <p className="text-slate-400 text-sm sm:text-base mb-8">
          Last updated: February 2026
        </p>

        <div className="space-y-6 text-slate-300 leading-relaxed text-sm sm:text-base">
          <div>
            <h2 className="text-white font-bold mb-2">1. Platform Usage</h2>
            <p>
              By using STXWORX, you agree to use the platform lawfully and responsibly. You are responsible for
              your wallet security and all actions performed from your account.
            </p>
          </div>

          <div>
            <h2 className="text-white font-bold mb-2">2. Escrow and Payments</h2>
            <p>
              Escrow and settlement actions may involve blockchain transactions. Network fees, finality, and smart
              contract behavior are subject to the underlying chain.
            </p>
          </div>

          <div>
            <h2 className="text-white font-bold mb-2">3. Content and Conduct</h2>
            <p>
              Users must not post unlawful, abusive, or fraudulent content. We may restrict accounts that violate
              these terms or compromise platform integrity.
            </p>
          </div>

          <div>
            <h2 className="text-white font-bold mb-2">4. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the platform after updates constitutes
              acceptance of the revised terms.
            </p>
          </div>
        </div>
        </div>
      </section>
      <HomeFooter />
    </>
  );
};

export default TermsPage;
