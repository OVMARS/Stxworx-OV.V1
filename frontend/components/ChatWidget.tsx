
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Mic, Paperclip, Minimize2, Maximize2, FileText, Play, Download, Check, CheckCheck, Search, Briefcase, Clock, ArrowLeft } from 'lucide-react';
import { ChatContact, Message } from '../types';
import { fetchContacts, fetchMessages } from '../services/StacksService';

interface ChatWidgetProps {
  externalContact?: ChatContact | null;
  onCloseExternal?: () => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ externalContact, onCloseExternal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeContact, setActiveContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [contactSearch, setContactSearch] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch initial data
  useEffect(() => {
    fetchContacts().then(setContacts);
  }, []);

  // Sync external contact prop with internal state
  useEffect(() => {
    if (externalContact) {
      setActiveContact(externalContact);
      setIsOpen(true);
      setIsMinimized(false);
    }
  }, [externalContact]);

  useEffect(() => {
    if (activeContact) {
      // Load messages when contact selected
      fetchMessages().then(data => {
        // In a real app we would filter by contact ID here
        setMessages(data);
      });
    }
  }, [activeContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isMinimized]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSendMessage = (type: 'text' | 'audio' | 'file' | 'offer' = 'text', content: string = inputText, extraData?: any) => {
    if (!content.trim() && type === 'text') return;

    // BACKEND INTEGRATION NOTE: Emit 'send_message' event here
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'me',
      content: content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
      type: type,
      duration: type === 'audio' ? formatTime(recordingTime) : undefined,
      status: 'sent',
      offerDetails: type === 'offer' ? extraData : undefined
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setIsRecording(false);

    // Mock network delay for status updates (Remove this when connecting to real backend)
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m));
    }, 1500);
  };

  const handleFileUpload = () => {
    // BACKEND INTEGRATION NOTE: Implement actual file upload logic
    const files = ['Contract_Draft.pdf', 'Design_Specs.fig', 'Codebase.zip'];
    const randomFile = files[Math.floor(Math.random() * files.length)];
    handleSendMessage('file', randomFile);
  };

  const handleCreateOffer = () => {
    handleSendMessage('offer', 'Project Proposal', { price: 1500, deliveryDays: 14 });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    setIsOpen(false);
    setActiveContact(null);
    setIsMinimized(false);
    if (onCloseExternal) onCloseExternal();
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const StatusIcon = ({ status }: { status?: string }) => {
    if (status === 'read') return <CheckCheck className="w-3 h-3 text-blue-500" />;
    if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-slate-500" />;
    if (status === 'sent') return <Check className="w-3 h-3 text-slate-500" />;
    return null;
  };

  // Group messages by date
  const groupedMessages: { [date: string]: Message[] } = {};
  messages.forEach(msg => {
    const date = msg.date || 'Today';
    if (!groupedMessages[date]) groupedMessages[date] = [];
    groupedMessages[date].push(msg);
  });

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 w-14 h-14 bg-orange-600 rounded-full shadow-[0_0_20px_rgba(234,88,12,0.4)] flex items-center justify-center text-white hover:bg-orange-500 hover:scale-110 transition-all z-50 group"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">2</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-4 sm:right-6 bg-[#0b0f19] border border-slate-700 rounded-2xl shadow-2xl transition-all duration-300 z-50 overflow-hidden flex flex-col font-sans ${isMinimized ? 'w-72 sm:w-80 h-16' : 'w-[calc(100vw-2rem)] sm:w-[400px] h-[650px] max-h-[85vh] max-w-[90vw]'
        }`}
    >
      {/* Header */}
      <div
        className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 cursor-pointer select-none"
        onClick={() => !activeContact && setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
          {activeContact ? (
            <div className="flex items-center gap-3 group min-w-0" onClick={(e) => { e.stopPropagation(); setActiveContact(null); if (onCloseExternal) onCloseExternal(); }}>
              <button className="text-slate-400 group-hover:text-white transition-colors bg-slate-800 rounded-full p-1 shrink-0"><ArrowLeft className="w-4 h-4" /></button>
              <div className="relative shrink-0">
                <img src={activeContact.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-slate-700" />
                {activeContact.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 shadow-[0_0_5px_rgba(34,197,94,0.6)]"></div>}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-white text-sm leading-tight truncate">{activeContact.name}</h4>
                <span className="text-[10px] text-green-400 font-medium flex items-center gap-1">
                  {activeContact.online ? 'Online' : 'Away'}
                </span>
              </div>
            </div>
          ) : (
            <h3 className="font-bold text-white flex items-center gap-2 text-lg tracking-tight whitespace-nowrap">
              <MessageCircle className="w-6 h-6 text-orange-500" /> Messages
            </h3>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
            className="text-slate-400 hover:text-red-500 p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {activeContact ? (
            // Chat View
            <div className="flex-1 flex flex-col bg-[#020617] relative min-h-0">
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar scroll-smooth">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800 font-mono">
                    End-to-End Encrypted
                  </span>
                </div>

                {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                  <div key={date} className="space-y-4">
                    <div className="flex justify-center">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{date}</span>
                    </div>
                    {dateMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'other' && (
                          <img src={activeContact.avatar} className="w-6 h-6 rounded-full mr-2 self-end mb-1 border border-slate-700" alt="" />
                        )}
                        <div className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                          <div
                            className={`px-4 py-3 text-sm shadow-md transition-all duration-300 ${msg.type === 'offer'
                              ? 'p-0 bg-transparent shadow-none w-full max-w-[280px]'
                              : msg.sender === 'me'
                                ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white rounded-2xl rounded-tr-sm'
                                : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-2xl rounded-tl-sm'
                              }`}
                          >
                            {/* Content based on type */}
                            {msg.type === 'text' && <p className="leading-relaxed">{msg.content}</p>}

                            {msg.type === 'audio' && (
                              <div className="flex items-center gap-3 min-w-[140px]">
                                <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors shrink-0">
                                  <Play className="w-3 h-3 fill-current" />
                                </button>
                                <div className="flex flex-col flex-1">
                                  <div className="h-1 bg-black/20 rounded-full w-full mb-1 overflow-hidden">
                                    <div className="h-full w-1/3 bg-white rounded-full"></div>
                                  </div>
                                  <span className="text-[10px] font-mono opacity-80">{msg.duration}</span>
                                </div>
                              </div>
                            )}

                            {msg.type === 'file' && (
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-black/20 rounded-lg">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                  <span className="font-bold truncate text-xs">{msg.content}</span>
                                  <span className="text-[10px] opacity-70">PDF • 2.4 MB</span>
                                </div>
                                <button className="p-1.5 hover:bg-black/20 rounded-full transition-colors ml-2">
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            {msg.type === 'offer' && msg.offerDetails && (
                              <div className="bg-slate-900/50 rounded-lg p-3 border border-orange-500/30 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 bg-orange-500/10 rounded-full blur-xl"></div>

                                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                                  <div className="flex items-center gap-2 text-orange-500">
                                    <Briefcase className="w-4 h-4" />
                                    <span className="font-bold text-[10px] uppercase tracking-wider">Custom Offer</span>
                                  </div>
                                  <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                                </div>

                                <h4 className="font-bold text-sm mb-3 text-white leading-tight">{msg.content}</h4>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                  <div className="bg-black/20 p-2 rounded">
                                    <div className="text-[9px] uppercase text-slate-500 font-bold mb-0.5">Total Price</div>
                                    <div className="font-mono font-black text-white text-sm">${msg.offerDetails.price.toLocaleString()}</div>
                                  </div>
                                  <div className="bg-black/20 p-2 rounded">
                                    <div className="text-[9px] uppercase text-slate-500 font-bold mb-0.5">Delivery</div>
                                    <div className="font-mono font-bold text-white text-sm flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      {msg.offerDetails.deliveryDays} Days
                                    </div>
                                  </div>
                                </div>

                                {msg.sender === 'other' ? (
                                  <div className="flex gap-2">
                                    <button className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-orange-900/20">
                                      Accept
                                    </button>
                                    <button className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 transition-colors">
                                      Decline
                                    </button>
                                  </div>
                                ) : (
                                  <div className="w-full py-2 bg-slate-800/50 text-slate-400 rounded-lg text-xs font-bold uppercase tracking-wider text-center border border-dashed border-slate-700">
                                    Offer Sent
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1 px-1">
                            <span className="text-[9px] text-slate-500 font-mono">{msg.timestamp}</span>
                            {msg.sender === 'me' && <StatusIcon status={msg.status} />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>

              {/* Smart Actions Area (Optional context) */}
              <div className="px-4 pb-2 bg-slate-900 border-t border-slate-800">
                <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
                  <button
                    onClick={handleCreateOffer}
                    className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 text-[10px] font-bold uppercase border border-orange-600/20 transition-colors flex items-center gap-1"
                  >
                    <Briefcase className="w-3 h-3" /> Create Offer
                  </button>
                  <button className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase border border-slate-700 transition-colors">
                    Share Portfolio
                  </button>
                  <button className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase border border-slate-700 transition-colors">
                    Schedule Call
                  </button>
                </div>

                {/* Input Area */}
                <div className="flex items-end gap-2 pb-3">
                  <button
                    className="p-2.5 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-xl"
                    onClick={handleFileUpload}
                    title="Attach File"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <div className="flex-1 relative bg-[#0b0f19] border border-slate-700 rounded-xl focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/50 transition-all">
                    <textarea
                      className="w-full bg-transparent px-3 py-2.5 text-sm text-white focus:outline-none placeholder-slate-600 resize-none max-h-24 custom-scrollbar"
                      placeholder="Type a message..."
                      rows={1}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      style={{ minHeight: '42px' }}
                    />
                  </div>

                  {inputText ? (
                    <button
                      onClick={() => handleSendMessage()}
                      className="p-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-500 transition-all shadow-lg hover:scale-105 active:scale-95"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      className={`p-2.5 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                      onClick={() => {
                        if (isRecording) {
                          handleSendMessage('audio', 'Voice Note');
                        } else {
                          setIsRecording(true);
                        }
                      }}
                      title="Hold to Record"
                    >
                      {isRecording ? <span className="font-mono text-xs font-bold px-1">{formatTime(recordingTime)}</span> : <Mic className="w-5 h-5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Contact List
            <div className="flex-1 bg-[#020617] flex flex-col min-h-0">
              {/* Search */}
              <div className="p-4 border-b border-slate-800">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map(contact => (
                    <div
                      key={contact.id}
                      className="flex items-center gap-3 p-4 hover:bg-slate-800/40 cursor-pointer transition-colors border-b border-slate-800/30 group"
                      onClick={() => setActiveContact(contact)}
                    >
                      <div className="relative">
                        <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full object-cover border border-slate-700 group-hover:border-slate-500 transition-colors" />
                        {contact.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#020617]"></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <h4 className="font-bold text-white text-sm truncate">{contact.name}</h4>
                          <span className="text-[10px] text-slate-500 font-mono">10:40 AM</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className={`text-xs truncate ${contact.unread > 0 ? 'text-white font-medium' : 'text-slate-500'}`}>
                            {contact.unread > 0 ? 'New message' : contact.lastMessage}
                          </p>
                          {contact.unread > 0 && (
                            <div className="min-w-[18px] h-[18px] bg-orange-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
                              {contact.unread}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No contacts found.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChatWidget;
