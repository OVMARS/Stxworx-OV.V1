
import React, { useEffect, useState } from 'react';
import { Hexagon, Plus, CheckCircle, RefreshCw, Award } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

const AdminNFT: React.FC = () => {
   const { adminNFTs, fetchAdminNFTs, adminCreateNFT, adminConfirmMint } = useAppStore();

   // Quick mint form state
   const [recipientId, setRecipientId] = useState('');
   const [nftType, setNftType] = useState('badge');
   const [name, setName] = useState('');
   const [description, setDescription] = useState('');
   const [metadataUrl, setMetadataUrl] = useState('');
   const [creating, setCreating] = useState(false);
   const [confirmingId, setConfirmingId] = useState<number | null>(null);
   const [mintTxId, setMintTxId] = useState('');

   useEffect(() => {
      fetchAdminNFTs();
   }, []);

   const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      setCreating(true);
      try {
         await adminCreateNFT({
            recipientId: Number(recipientId),
            nftType,
            name,
            description: description || undefined,
            metadataUrl: metadataUrl || undefined,
         });
         // Reset form
         setRecipientId('');
         setName('');
         setDescription('');
         setMetadataUrl('');
      } catch (e) {
         console.error('Failed to create NFT:', e);
      } finally {
         setCreating(false);
      }
   };

   const handleConfirmMint = async (nftId: number) => {
      if (!mintTxId.trim()) return;
      setConfirmingId(nftId);
      try {
         await adminConfirmMint(nftId, mintTxId.trim());
         setMintTxId('');
         setConfirmingId(null);
      } catch (e) {
         console.error('Failed to confirm mint:', e);
         setConfirmingId(null);
      }
   };

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="flex justify-between items-center">
            <div>
               <h2 className="text-2xl font-black text-white uppercase tracking-tight">NFT Release Control</h2>
               <p className="text-slate-400 text-sm">Mint reputation badges and manage NFT records.</p>
            </div>
            <button onClick={() => fetchAdminNFTs()} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
               <RefreshCw className="w-4 h-4" />
            </button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create NFT Form */}
            <div className="lg:col-span-1 bg-[#0b0f19] rounded-xl border border-slate-800 p-6">
               <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Hexagon className="w-5 h-5 text-orange-500" /> Issue Reputation NFT
               </h3>
               <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Recipient User ID</label>
                     <input
                        type="number"
                        value={recipientId}
                        onChange={(e) => setRecipientId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-orange-500 focus:outline-none"
                        placeholder="e.g. 1"
                        required
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold uppercase text-slate-500 mb-2">NFT Type</label>
                     <select
                        value={nftType}
                        onChange={(e) => setNftType(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-orange-500 focus:outline-none"
                     >
                        <option value="badge">Badge</option>
                        <option value="achievement">Achievement</option>
                        <option value="certification">Certification</option>
                        <option value="reward">Reward</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Name</label>
                     <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-orange-500 focus:outline-none"
                        placeholder="e.g. Verified Pro Badge"
                        required
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Description</label>
                     <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-orange-500 focus:outline-none resize-none h-16"
                        placeholder="Optional description"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Metadata URL</label>
                     <input
                        type="url"
                        value={metadataUrl}
                        onChange={(e) => setMetadataUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-orange-500 focus:outline-none"
                        placeholder="https://..."
                     />
                  </div>
                  <button
                     type="submit"
                     disabled={creating}
                     className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                     <Plus className="w-4 h-4" /> {creating ? 'Creating...' : 'Issue NFT'}
                  </button>
               </form>
            </div>

            {/* NFT List */}
            <div className="lg:col-span-2 space-y-4">
               <h3 className="text-lg font-bold text-white mb-2">Issued NFTs ({adminNFTs.length})</h3>
               {adminNFTs.length === 0 && (
                  <div className="bg-[#0b0f19] rounded-xl border border-slate-800 p-8 text-center text-slate-500">
                     No NFTs issued yet.
                  </div>
               )}
               {adminNFTs.map((nft) => (
                  <div key={nft.id} className="bg-[#0b0f19] rounded-xl border border-slate-800 p-4 flex items-start gap-4 hover:border-orange-500/30 transition-all group">
                     <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800 group-hover:border-orange-500 transition-colors shrink-0">
                        <Award className="w-6 h-6 text-orange-500" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white">{nft.name}</h4>
                        <div className="flex items-center gap-2 text-xs mt-1 flex-wrap">
                           <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${nft.minted ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                              {nft.minted ? 'Minted' : 'Pending Mint'}
                           </span>
                           <span className="text-slate-500">{nft.nftType}</span>
                           <span className="text-slate-600">• User #{nft.recipientId}</span>
                        </div>
                        {nft.description && <p className="text-xs text-slate-500 mt-1 truncate">{nft.description}</p>}
                        {nft.mintTxId && <p className="text-[10px] text-slate-600 font-mono mt-1 truncate">TX: {nft.mintTxId}</p>}
                     </div>
                     <div className="text-right shrink-0">
                        {!nft.minted && (
                           <div className="flex items-center gap-2">
                              <input
                                 type="text"
                                 placeholder="Mint TX ID"
                                 value={confirmingId === nft.id ? mintTxId : ''}
                                 onFocus={() => setConfirmingId(nft.id)}
                                 onChange={(e) => setMintTxId(e.target.value)}
                                 className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-white w-32 focus:border-orange-500 focus:outline-none"
                              />
                              <button
                                 onClick={() => handleConfirmMint(nft.id)}
                                 disabled={confirmingId !== nft.id || !mintTxId.trim()}
                                 className="px-2 py-1 bg-green-600/10 hover:bg-green-600/20 text-green-500 border border-green-600/20 rounded text-[10px] font-bold uppercase transition-colors disabled:opacity-30"
                              >
                                 <CheckCircle className="w-3 h-3" />
                              </button>
                           </div>
                        )}
                        {nft.minted && (
                           <span className="text-green-500 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Confirmed</span>
                        )}
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
};

export default AdminNFT;
