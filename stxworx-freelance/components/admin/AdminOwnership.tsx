import React, { useEffect, useState } from 'react';
import { Shield, RefreshCw, Wallet, ArrowRight, CheckCircle, AlertTriangle, Crown, Copy, ExternalLink, X } from 'lucide-react';
import { useWallet } from '../wallet/WalletProvider';
import {
   getContractOwner,
   getProposedOwner,
   proposeOwnershipContractCall,
   acceptOwnershipContractCall,
} from '../../lib/contracts';
import { CONTRACT_ADDRESS, CONTRACT_NAME } from '../../lib/constants';

const AdminOwnership: React.FC = () => {
   const { isSignedIn, userAddress } = useWallet();

   const [currentOwner, setCurrentOwner] = useState<string | null>(null);
   const [proposedOwner, setProposedOwner] = useState<string | null>(null);
   const [loading, setLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);

   // Propose form
   const [newOwnerInput, setNewOwnerInput] = useState('');
   const [txStatus, setTxStatus] = useState<'idle' | 'signing' | 'submitted' | 'error'>('idle');
   const [txError, setTxError] = useState('');
   const [lastTxId, setLastTxId] = useState('');

   // Computed
   const isCurrentOwner = !!userAddress && !!currentOwner && userAddress === currentOwner;
   const isProposedOwner = !!userAddress && !!proposedOwner && userAddress === proposedOwner;
   const hasPendingProposal = !!proposedOwner;

   const fetchOwnership = async () => {
      try {
         const [owner, proposed] = await Promise.all([getContractOwner(), getProposedOwner()]);
         setCurrentOwner(owner);
         setProposedOwner(proposed);
      } catch (e) {
         console.error('Failed to fetch ownership data:', e);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchOwnership();
   }, []);

   const handleRefresh = async () => {
      setRefreshing(true);
      await fetchOwnership();
      setRefreshing(false);
   };

   const resetTxState = () => {
      setTxStatus('idle');
      setTxError('');
      setLastTxId('');
   };

   /* ── PROPOSE OWNERSHIP ── */
   const handlePropose = async () => {
      const addr = newOwnerInput.trim();
      if (!addr) return;
      if (!addr.startsWith('ST') && !addr.startsWith('SP')) {
         setTxError('Invalid Stacks address. Must start with ST (testnet) or SP (mainnet).');
         return;
      }
      if (addr === currentOwner) {
         setTxError('This address is already the owner.');
         return;
      }

      setTxStatus('signing');
      setTxError('');

      try {
         await proposeOwnershipContractCall(
            addr,
            async (txData: any) => {
               const txId = txData.txId || txData.txid || '';
               setLastTxId(txId);
               setTxStatus('submitted');
               // Refresh after a short delay to let chain index
               setTimeout(() => {
                  fetchOwnership();
               }, 3000);
            },
            () => {
               setTxStatus('idle');
               setTxError('Transaction cancelled.');
            }
         );
      } catch (e: any) {
         setTxStatus('error');
         setTxError(e?.message || 'Failed to open wallet.');
      }
   };

   /* ── ACCEPT OWNERSHIP ── */
   const handleAccept = async () => {
      setTxStatus('signing');
      setTxError('');

      try {
         await acceptOwnershipContractCall(
            async (txData: any) => {
               const txId = txData.txId || txData.txid || '';
               setLastTxId(txId);
               setTxStatus('submitted');
               setTimeout(() => {
                  fetchOwnership();
               }, 3000);
            },
            () => {
               setTxStatus('idle');
               setTxError('Transaction cancelled.');
            }
         );
      } catch (e: any) {
         setTxStatus('error');
         setTxError(e?.message || 'Failed to open wallet.');
      }
   };

   const truncAddr = (addr: string | null) => {
      if (!addr) return '—';
      if (addr.length <= 16) return addr;
      return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
   };

   const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
         </div>
      );
   }

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         {/* Header */}
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
               <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Contract Ownership</h2>
               <p className="text-slate-400 text-xs sm:text-sm">
                  Manage who controls admin functions on{' '}
                  <span className="font-mono text-orange-400 break-all">{CONTRACT_ADDRESS.slice(0, 8)}…{CONTRACT_ADDRESS.slice(-4)}.{CONTRACT_NAME}</span>
               </p>
            </div>
            <button
               onClick={handleRefresh}
               disabled={refreshing}
               className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
               <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
         </div>

         {/* Current State Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Owner */}
            <div className="bg-[#0b0f19] rounded-xl border border-slate-800 p-4 sm:p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/5 rounded-full blur-2xl"></div>
               <div className="flex items-center gap-2 mb-3">
                  <Crown className="w-5 h-5 text-orange-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Owner</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-white break-all">{currentOwner || '—'}</span>
                  {currentOwner && (
                     <button onClick={() => copyToClipboard(currentOwner)} className="text-slate-600 hover:text-white transition-colors shrink-0">
                        <Copy className="w-3.5 h-3.5" />
                     </button>
                  )}
               </div>
               {isCurrentOwner && (
                  <div className="mt-3 flex items-center gap-1.5 text-green-500 text-xs font-bold">
                     <CheckCircle className="w-3.5 h-3.5" />
                     This is your connected wallet
                  </div>
               )}
               {userAddress && !isCurrentOwner && (
                  <div className="mt-3 flex items-center gap-1.5 text-yellow-500 text-xs font-bold">
                     <AlertTriangle className="w-3.5 h-3.5" />
                     Your wallet is NOT the owner
                  </div>
               )}
            </div>

            {/* Pending Proposal */}
            <div className={`bg-[#0b0f19] rounded-xl border p-4 sm:p-6 relative overflow-hidden ${hasPendingProposal ? 'border-orange-600/30' : 'border-slate-800'}`}>
               {hasPendingProposal && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/10 rounded-full blur-2xl"></div>
               )}
               <div className="flex items-center gap-2 mb-3">
                  <ArrowRight className="w-5 h-5 text-blue-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Transfer</span>
               </div>
               {hasPendingProposal ? (
                  <>
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-orange-400 break-all">{proposedOwner}</span>
                        <button onClick={() => copyToClipboard(proposedOwner!)} className="text-slate-600 hover:text-white transition-colors shrink-0">
                           <Copy className="w-3.5 h-3.5" />
                        </button>
                     </div>
                     <div className="mt-3 text-xs text-slate-500">
                        Waiting for this address to call <span className="font-mono text-slate-400">accept-ownership</span>
                     </div>
                     {isProposedOwner && (
                        <div className="mt-2 flex items-center gap-1.5 text-green-500 text-xs font-bold">
                           <CheckCircle className="w-3.5 h-3.5" />
                           You are the proposed new owner — you can accept below
                        </div>
                     )}
                  </>
               ) : (
                  <div className="text-sm text-slate-600">No pending ownership transfer</div>
               )}
            </div>
         </div>

         {/* Your Wallet Indicator */}
         <div className="bg-[#0b0f19] rounded-xl border border-slate-800 p-4">
            <div className="flex items-center gap-3">
               <Wallet className="w-5 h-5 text-slate-500" />
               <div className="flex-1">
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Your Connected Wallet</div>
                  {isSignedIn && userAddress ? (
                     <span className="text-sm font-mono text-white">{userAddress}</span>
                  ) : (
                     <span className="text-sm text-red-400 font-bold">Not Connected</span>
                  )}
               </div>
               <div className="flex gap-2">
                  {isCurrentOwner && (
                     <span className="px-2 py-1 bg-green-600/10 text-green-500 border border-green-600/20 rounded text-[10px] font-bold uppercase">Owner</span>
                  )}
                  {isProposedOwner && (
                     <span className="px-2 py-1 bg-orange-600/10 text-orange-500 border border-orange-600/20 rounded text-[10px] font-bold uppercase">Proposed</span>
                  )}
                  {!isCurrentOwner && !isProposedOwner && userAddress && (
                     <span className="px-2 py-1 bg-slate-800 text-slate-500 rounded text-[10px] font-bold uppercase">No Privileges</span>
                  )}
               </div>
            </div>
         </div>

         {/* ══════ ACTION SECTIONS ══════ */}

         {/* Section 1: Propose Ownership (only if current owner) */}
         {isCurrentOwner && (
            <div className="bg-[#0b0f19] rounded-xl border border-slate-800 p-6">
               <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-bold text-white">Propose Ownership Transfer</h3>
               </div>
               <p className="text-sm text-slate-400 mb-4">
                  Enter the Stacks address of the new owner. They will need to call{' '}
                  <span className="font-mono text-orange-400">accept-ownership</span> from their wallet to complete the transfer.
               </p>

               {/* Smart contract info */}
               <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 mb-4">
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Contract Function</div>
                  <div className="text-xs text-slate-400">
                     <span className="font-mono text-orange-400">propose-ownership</span>(new-owner: principal) — Two-step transfer. Ownership doesn't change until the recipient accepts.
                  </div>
               </div>

               <div className="flex gap-3">
                  <input
                     type="text"
                     value={newOwnerInput}
                     onChange={(e) => { setNewOwnerInput(e.target.value); resetTxState(); }}
                     placeholder="ST... or SP... principal address"
                     className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm font-mono text-white placeholder-slate-600 focus:border-orange-500 focus:outline-none"
                  />
                  <button
                     onClick={handlePropose}
                     disabled={!newOwnerInput.trim() || txStatus === 'signing' || txStatus === 'submitted'}
                     className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                     <Wallet className="w-4 h-4" />
                     {txStatus === 'signing' ? 'Signing...' : 'Sign & Propose'}
                  </button>
               </div>

               {hasPendingProposal && (
                  <div className="mt-3 bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-3 flex items-start gap-2">
                     <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                     <div className="text-xs text-yellow-400">
                        There's already a pending proposal for <span className="font-mono">{truncAddr(proposedOwner)}</span>.
                        Proposing a new address will <strong>overwrite</strong> the current proposal.
                     </div>
                  </div>
               )}
            </div>
         )}

         {/* Section 2: Accept Ownership (only if proposed owner) */}
         {isProposedOwner && (
            <div className="bg-[#0b0f19] rounded-xl border border-orange-600/30 p-6">
               <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-bold text-white">Accept Ownership</h3>
               </div>
               <p className="text-sm text-slate-400 mb-4">
                  You have been proposed as the new contract owner by <span className="font-mono text-orange-400">{truncAddr(currentOwner)}</span>.
                  Accepting will immediately transfer all admin privileges to your wallet.
               </p>

               {/* Warning */}
               <div className="bg-orange-950/20 border border-orange-900/30 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                     <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                     <div>
                        <div className="text-sm font-bold text-orange-400 mb-1">Irreversible On-Chain</div>
                        <p className="text-xs text-orange-400/70 leading-relaxed">
                           Once accepted, the previous owner loses all admin privileges immediately.
                           All admin functions (dispute resolution, force refund/release, pause, fee changes) will require YOUR wallet signature.
                        </p>
                     </div>
                  </div>
               </div>

               {/* Smart contract info */}
               <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 mb-4">
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Contract Function</div>
                  <div className="text-xs text-slate-400">
                     <span className="font-mono text-green-400">accept-ownership</span>() — Completes the 2-step transfer. Sets contract-owner to tx-sender (your wallet).
                  </div>
               </div>

               <button
                  onClick={handleAccept}
                  disabled={txStatus === 'signing' || txStatus === 'submitted'}
                  className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold text-sm rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  <Wallet className="w-4 h-4" />
                  {txStatus === 'signing' ? 'Signing...' : 'Sign & Accept Ownership'}
               </button>
            </div>
         )}

         {/* Not the owner and not proposed — info message */}
         {!isCurrentOwner && !isProposedOwner && isSignedIn && (
            <div className="bg-[#0b0f19] rounded-xl border border-slate-800 p-6 text-center">
               <Shield className="w-12 h-12 text-slate-700 mx-auto mb-4" />
               <h3 className="text-lg font-bold text-slate-400 mb-2">No Actions Available</h3>
               <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Your connected wallet is neither the current contract owner nor a proposed new owner.
                  To manage ownership, connect with the deployer wallet (<span className="font-mono text-slate-400">{truncAddr(currentOwner)}</span>).
               </p>
            </div>
         )}

         {/* No wallet connected */}
         {!isSignedIn && (
            <div className="bg-[#0b0f19] rounded-xl border border-red-900/20 p-6 text-center">
               <Wallet className="w-12 h-12 text-slate-700 mx-auto mb-4" />
               <h3 className="text-lg font-bold text-red-400 mb-2">Wallet Required</h3>
               <p className="text-sm text-slate-500">Connect your wallet to view and manage ownership actions.</p>
            </div>
         )}

         {/* Transaction Status Feedback */}
         {txStatus === 'signing' && (
            <div className="bg-orange-950/20 border border-orange-900/30 rounded-lg p-4 flex items-center gap-3">
               <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
               <div className="text-sm text-orange-400">Waiting for wallet signature… Check your Leather/Xverse popup.</div>
            </div>
         )}
         {txStatus === 'submitted' && (
            <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4 flex items-center gap-3">
               <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
               <div className="flex-1">
                  <div className="text-sm text-green-400 font-bold">Transaction submitted!</div>
                  {lastTxId && (
                     <div className="text-xs font-mono text-green-400/60 mt-1 break-all">
                        TX: {lastTxId}
                     </div>
                  )}
                  <div className="text-xs text-green-400/50 mt-1">Ownership data will refresh in a few seconds…</div>
               </div>
            </div>
         )}
         {txError && txStatus === 'error' && (
            <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4 flex items-center justify-between">
               <div className="text-sm text-red-400">{txError}</div>
               <button onClick={resetTxState} className="text-red-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
               </button>
            </div>
         )}
         {txError && txStatus !== 'error' && (
            <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-3">
               <div className="text-sm text-yellow-400">{txError}</div>
            </div>
         )}

         {/* How It Works */}
         <div className="bg-[#0b0f19] rounded-xl border border-slate-800 p-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">How Ownership Transfer Works</h3>
            <div className="flex items-start gap-4">
               <div className="flex flex-col items-center gap-0">
                  <div className="w-8 h-8 rounded-full bg-orange-600/20 border border-orange-600/30 flex items-center justify-center text-orange-500 text-xs font-bold">1</div>
                  <div className="w-px h-6 bg-slate-800"></div>
               </div>
               <div className="pb-4">
                  <div className="text-sm font-bold text-white">Current owner proposes</div>
                  <div className="text-xs text-slate-500 mt-1">
                     Calls <span className="font-mono text-slate-400">propose-ownership(new-address)</span>. No privileges change yet.
                  </div>
               </div>
            </div>
            <div className="flex items-start gap-4">
               <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-green-600/20 border border-green-600/30 flex items-center justify-center text-green-500 text-xs font-bold">2</div>
               </div>
               <div>
                  <div className="text-sm font-bold text-white">New owner accepts</div>
                  <div className="text-xs text-slate-500 mt-1">
                     Proposed address calls <span className="font-mono text-slate-400">accept-ownership()</span>. Ownership transfers immediately.
                     The old owner loses all admin access.
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default AdminOwnership;
