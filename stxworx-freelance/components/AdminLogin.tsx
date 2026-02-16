
import React, { useState } from 'react';
import { Hexagon, Lock, User, ArrowRight, ShieldAlert } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const adminLogin = useAppStore((s) => s.adminLogin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await adminLogin(username, password);
      onLogin();
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center relative overflow-hidden font-sans text-slate-200">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-md w-full p-8 bg-[#0b0f19] border border-slate-800 rounded-2xl shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <button onClick={onBack} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
            <ArrowRight className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 mb-4 shadow-lg shadow-orange-900/20">
               <Hexagon className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Admin Access</h1>
            <p className="text-slate-500 text-sm mt-2">Secure Gateway for STXWorx Protocol</p>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-top-2">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
               <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Admin ID</label>
               <div className="relative">
                  <User className="absolute left-3 top-2.5 w-5 h-5 text-slate-600" />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
                    placeholder="admin"
                    required
                  />
               </div>
            </div>

            <div>
               <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Passkey</label>
               <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-5 h-5 text-slate-600" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
                    placeholder="••••••••"
                    required
                  />
               </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-orange-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
               {loading ? 'Authenticating...' : 'Initialize Session'}
            </button>
        </form>

        <div className="mt-8 text-center">
           <p className="text-[10px] text-slate-600 font-mono">
             Authorized Personnel Only • IP Logged
           </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
