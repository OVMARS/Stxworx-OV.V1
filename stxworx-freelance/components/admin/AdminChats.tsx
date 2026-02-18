
import React, { useState, useEffect } from 'react';
import { AdminConversation, Message } from '../../types';
import { Search, MessageCircle, Clock, CheckCheck, User, ShieldCheck } from 'lucide-react';
import { fetchAllConversations } from '../../services/StacksService';

const AdminChats: React.FC = () => {
   const [conversations, setConversations] = useState<AdminConversation[]>([]);
   const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
   const [searchTerm, setSearchTerm] = useState('');

   useEffect(() => {
      fetchAllConversations().then(setConversations);
   }, []);

   const selectedConversation = conversations.find(c => c.id === selectedChatId);

   const filteredConversations = conversations.filter(c =>
      c.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
   );

   return (
      <div className="flex flex-col md:flex-row h-[calc(100vh-140px)] gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         {/* Sidebar List */}
         <div className="w-full md:w-1/3 bg-[#0b0f19] rounded-xl border border-slate-800 flex flex-col overflow-hidden h-64 md:h-auto shrink-0 md:shrink">
            <div className="p-4 border-b border-slate-800">
               <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-orange-500" /> Active Conversations
               </h3>
               <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                     type="text"
                     placeholder="Search users..."
                     className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-orange-500/50"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
               {filteredConversations.length > 0 ? (
                  filteredConversations.map(chat => (
                     <div
                        key={chat.id}
                        onClick={() => setSelectedChatId(chat.id)}
                        className={`p-4 border-b border-slate-800/50 cursor-pointer transition-colors hover:bg-slate-800/40 ${selectedChatId === chat.id ? 'bg-slate-800/60 border-l-2 border-l-orange-500' : ''}`}
                     >
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex -space-x-2">
                              {chat.participants.map((p, i) => (
                                 <img key={i} src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full border-2 border-[#0b0f19] z-10" title={`${p.name} (${p.role})`} />
                              ))}
                           </div>
                           <span className="text-[10px] text-slate-500 font-mono">{chat.lastMessageTime}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-white font-bold mb-1">
                           {chat.participants[0]?.name || 'Unknown'} <span className="text-slate-500 font-normal">&</span> {chat.participants[1]?.name || 'Unknown'}
                        </div>
                        <p className="text-xs text-slate-400 truncate">{chat.lastMessage}</p>
                     </div>
                  ))
               ) : (
                  <div className="p-4 text-center text-slate-500 text-sm">
                     No conversations found.
                  </div>
               )}
            </div>
         </div>

         {/* Chat View */}
         <div className="flex-1 bg-[#0b0f19] rounded-xl border border-slate-800 flex flex-col overflow-hidden relative">
            {selectedConversation ? (
               <>
                  {/* Header */}
                  <div className="h-14 md:h-16 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 bg-slate-900/50">
                     <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <div className="flex -space-x-3 shrink-0">
                           {selectedConversation.participants.map((p, i) => (
                              <img key={i} src={p.avatar} alt={p.name} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-[#0b0f19]" />
                           ))}
                        </div>
                        <div className="min-w-0">
                           <h3 className="text-white font-bold text-xs md:text-sm">Conversation Monitoring</h3>
                           <p className="text-xs text-slate-500 flex items-center gap-2 truncate">
                              Session ID: <span className="font-mono text-orange-500 truncate">{selectedConversation.id}</span>
                           </p>
                        </div>
                     </div>
                     <div className="px-2 md:px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase rounded border border-red-500/20 shrink-0">
                        <span className="hidden sm:inline">Admin View Only</span>
                        <span className="sm:hidden">Admin</span>
                     </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar bg-[#020617]">
                     {selectedConversation.messages.map((msg) => {
                        // Check if sender matches the first participant
                        const isParticipant1 = selectedConversation.participants[0] && msg.senderName === selectedConversation.participants[0].name;

                        return (
                           <div key={msg.id} className={`flex flex-col ${isParticipant1 ? 'items-start' : 'items-end'}`}>
                              <div className="flex items-center gap-2 mb-1">
                                 <span className="text-[10px] font-bold text-slate-400">{msg.senderName || 'Unknown'}</span>
                                 <span className="text-[10px] text-slate-600 font-mono">{msg.timestamp}</span>
                              </div>
                              <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm ${isParticipant1
                                    ? 'bg-slate-800 text-slate-200 rounded-tl-none'
                                    : 'bg-slate-700 text-white rounded-tr-none'
                                 }`}>
                                 {msg.content}
                              </div>
                           </div>
                        );
                     })}
                  </div>

                  {/* Footer Warning */}
                  <div className="p-4 bg-slate-900 border-t border-slate-800 text-center">
                     <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> You are viewing this chat in read-only admin mode.
                     </p>
                  </div>
               </>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                  <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
                  <p>Select a conversation to monitor</p>
               </div>
            )}
         </div>
      </div>
   );
};

export default AdminChats;
