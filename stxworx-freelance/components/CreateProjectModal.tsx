import React, { useState, useEffect, useRef } from 'react';
import {
  X, Coins, ChevronRight, ChevronLeft, Check, Lock,
  Clock, DollarSign, ListOrdered, ShieldCheck,
  Paperclip, FileText, Trash2,
} from 'lucide-react';
import { TokenType, Project } from '../types';
import { usdToToken, EXCHANGE_RATES } from '../services/StacksService';
import { useWallet } from './wallet/WalletProvider';
import { useAppStore } from '../stores/useAppStore';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: Partial<Project> & { freelancerAddress?: string; totalBudget?: number; category?: string; title?: string; description?: string } | null;
}

interface MilestoneData {
  title: string;
  description: string;
  price: string;
  deliveryDays: string;
}

const emptyMilestone = (): MilestoneData => ({
  title: '',
  description: '',
  price: '',
  deliveryDays: '7',
});

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { userAddress } = useWallet();
  const storeCategories = useAppStore((s) => s.categories);

  const [step, setStep] = useState(0);
  const [projectTitle, setProjectTitle] = useState('');
  const [milestoneCount, setMilestoneCount] = useState<number | null>(null);
  const [tokenType, setTokenType] = useState<TokenType>('STX');
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [category, setCategory] = useState('Web Development');
  const [description, setDescription] = useState('');
  const [freelancerAddress, setFreelancerAddress] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exchangeRates, setExchangeRates] = useState(EXCHANGE_RATES);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=blockstack,bitcoin&vs_currencies=usd');
        const data = await response.json();
        if (data.blockstack?.usd && data.bitcoin?.usd) {
          setExchangeRates({ STX: data.blockstack.usd, sBTC: data.bitcoin.usd });
        }
      } catch (error) {
        console.error('Failed to fetch real-time prices, using defaults', error);
      }
    };
    fetchPrices();
  }, []);

  useEffect(() => {
    if (isOpen && initialData) {
      setProjectTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setCategory(initialData.category || 'Web Development');
      setTokenType(initialData.tokenType || 'STX');
      setFreelancerAddress(initialData.freelancerAddress || '');
      setStep(0);
      setMilestoneCount(null);
      setMilestones([]);
      setAttachments([]);
    } else if (isOpen && !initialData) {
      resetForm();
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const totalSteps = milestoneCount ? milestoneCount + 2 : 2;
  const isSetupStep = step === 0;
  const isMilestoneStep = step >= 1 && milestoneCount !== null && step <= milestoneCount;
  const isReviewStep = milestoneCount !== null && step === milestoneCount + 1;
  const currentMsIndex = step - 1;

  const totalBudgetUSD = milestones.reduce((s, m) => s + Number(m.price), 0);
  const tokenAmount = totalBudgetUSD ? totalBudgetUSD / exchangeRates[tokenType] : 0;

  function resetForm() {
    setStep(0);
    setProjectTitle('');
    setMilestoneCount(null);
    setTokenType('STX');
    setMilestones([]);
    setCategory('Web Development');
    setDescription('');
    setFreelancerAddress('');
    setAttachments([]);
    setIsLoading(false);
  }

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCountSelect = (count: number) => {
    setMilestoneCount(count);
    setMilestones(Array.from({ length: count }, emptyMilestone));
  };

  const updateMilestone = (index: number, field: keyof MilestoneData, value: string) => {
    setMilestones((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  const removeAttachment = (index: number) => setAttachments((prev) => prev.filter((_, i) => i !== index));

  const setupValid = projectTitle.trim().length > 0 && milestoneCount !== null;

  const currentMsValid = isMilestoneStep && milestones[currentMsIndex]
    ? milestones[currentMsIndex].title.trim().length > 0
      && milestones[currentMsIndex].description.trim().length > 0
      && Number(milestones[currentMsIndex].price) > 0
      && Number(milestones[currentMsIndex].deliveryDays) > 0
    : false;

  const reviewValid = freelancerAddress.trim().length > 0;

  const handleNext = () => { if (step < totalSteps - 1) setStep(step + 1); };
  const handleBack = () => { if (step > 0) setStep(step - 1); };

  const handleDeploy = async () => {
    setIsLoading(true);

    const milestoneObjs = milestones.map((m, i) => ({
      id: i + 1,
      title: m.title,
      description: m.description,
      amount: Number((Number(m.price) / exchangeRates[tokenType]).toFixed(6)),
      deliveryDays: Number(m.deliveryDays),
      status: 'locked' as const,
    }));

    const projectData = {
      freelancerAddress,
      totalBudget: tokenAmount,
      tokenType,
      milestones: milestoneObjs,
    };

    try {
      const { createProjectContractCall, saveProjectToBackend } = await import('../lib/contracts');

      await createProjectContractCall(
        projectData,
        async (txData) => {
          console.log('Transaction sent:', txData);
          try {
            const backendData = {
              title: projectTitle,
              description,
              category,
              clientAddress: userAddress,
              freelancerAddress,
              totalBudget: tokenAmount,
              tokenType,
              milestones: milestoneObjs,
            };
            await saveProjectToBackend(txData.txId, backendData);
            setIsLoading(false);
            onSubmit({ ...backendData, txId: txData.txId });
            handleClose();
          } catch (backendError) {
            console.error('Error saving to backend:', backendError);
            setIsLoading(false);
            alert('Project created on-chain but failed to save to database. Please contact support with TxID: ' + txData.txId);
            handleClose();
          }
        },
        () => {
          console.log('Transaction canceled');
          setIsLoading(false);
        }
      );
    } catch (error: any) {
      console.error('Error initiating contract call:', error);
      setIsLoading(false);
      if (error.message && (error.message.includes('Buffer') || error.message.includes('global'))) {
        alert('System Error: Missing blockchain dependencies (Buffer/global). Please contact support.');
      } else {
        alert('Failed to initiate contract call: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const progressPercent = milestoneCount ? (step / totalSteps) * 100 : 0;

  const inputClass =
    'w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors placeholder-slate-600 text-sm';

  const labelClass = 'block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-slate-900 rounded-2xl shadow-2xl shadow-black w-full max-w-2xl overflow-hidden border border-slate-800 animate-[fadeUp_0.3s_ease-out] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-black uppercase tracking-tight text-white">
                {isSetupStep ? 'New Escrow Contract' : projectTitle}
              </h3>
            </div>
            <button onClick={handleClose} className="text-slate-500 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          {milestoneCount && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                {isReviewStep ? 'Review' : isMilestoneStep ? `${step} / ${milestoneCount}` : 'Setup'}
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 custom-scrollbar flex-1">

          {/* ─── Step 0: Setup ─── */}
          {isSetupStep && (
            <div className="space-y-6 animate-[fadeUp_0.25s_ease-out]">
              <div>
                <label className={labelClass}>Project Title</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. DeFi Dashboard Frontend"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  maxLength={80}
                  autoFocus
                />
              </div>

              <div>
                <label className={labelClass}>Payment Token</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  {(['STX', 'sBTC'] as TokenType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTokenType(t)}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none text-sm font-bold uppercase tracking-wider ${
                        tokenType === t
                          ? 'border-orange-500/50 bg-orange-500/10 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]'
                          : 'border-slate-800 bg-slate-950/60 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <Coins className="w-4 h-4" />
                      {t}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-600 mt-2 text-right">
                  1 {tokenType} ≈ ${exchangeRates[tokenType].toLocaleString()}
                </p>
              </div>

              <div>
                <label className={labelClass}>Number of Milestones</label>
                <div className="grid grid-cols-3 gap-3 mt-1">
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleCountSelect(n)}
                      className={`relative flex flex-col items-center gap-2 p-5 rounded-xl border transition-all duration-300 focus:outline-none group ${
                        milestoneCount === n
                          ? 'border-orange-500/50 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.1)]'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <ListOrdered className={`w-6 h-6 transition-colors ${milestoneCount === n ? 'text-orange-500' : 'text-slate-600 group-hover:text-slate-400'}`} />
                      <span className={`text-2xl font-black transition-colors ${milestoneCount === n ? 'text-orange-400' : 'text-white'}`}>{n}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Milestones</span>
                      {milestoneCount === n && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Steps 1–N: Milestone Forms ─── */}
          {isMilestoneStep && milestones[currentMsIndex] && (
            <div className="space-y-5 animate-[fadeUp_0.25s_ease-out]" key={`ms-${currentMsIndex}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <span className="text-sm font-black text-orange-500">{step}</span>
                </div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Milestone {step} of {milestoneCount}
                </h4>
              </div>

              <div>
                <label className={labelClass}>Milestone Title</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder={`e.g. ${step === 1 ? 'Project setup & wireframes' : step === 2 ? 'Core development' : 'Testing & delivery'}`}
                  value={milestones[currentMsIndex].title}
                  onChange={(e) => updateMilestone(currentMsIndex, 'title', e.target.value)}
                  maxLength={60}
                  autoFocus
                />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  rows={4}
                  className={`${inputClass} resize-none`}
                  placeholder="What will be delivered in this milestone..."
                  value={milestones[currentMsIndex].description}
                  onChange={(e) => updateMilestone(currentMsIndex, 'description', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Budget (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
                    <input
                      type="number"
                      min="1"
                      step="5"
                      className={`${inputClass} pl-9 font-mono`}
                      placeholder="0.00"
                      value={milestones[currentMsIndex].price}
                      onChange={(e) => updateMilestone(currentMsIndex, 'price', e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1 text-right">
                    ≈ {(Number(milestones[currentMsIndex].price || 0) / exchangeRates[tokenType]).toFixed(4)} {tokenType}
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Delivery (Days)</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
                    <input
                      type="number"
                      min="1"
                      className={`${inputClass} pl-9`}
                      value={milestones[currentMsIndex].deliveryDays}
                      onChange={(e) => updateMilestone(currentMsIndex, 'deliveryDays', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Review Step ─── */}
          {isReviewStep && (
            <div className="space-y-6 animate-[fadeUp_0.25s_ease-out]">
              {/* Escrow distribution */}
              <div className="bg-[#020617] rounded-xl border border-slate-800 p-4 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-3 h-3 text-orange-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Escrow Distribution</h4>
                </div>
                <div className="space-y-2">
                  {milestones.map((m, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setStep(i + 1)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:border-orange-500/30 transition-colors text-left group"
                    >
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-950 border border-slate-800 text-[9px] font-bold text-slate-500 shrink-0">M{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{m.title}</p>
                        <p className="text-xs text-slate-500 truncate">{m.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-mono font-bold text-orange-400">${Number(m.price).toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500">{(Number(m.price) / exchangeRates[tokenType]).toFixed(4)} {tokenType} · {m.deliveryDays}d</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Lock</span>
                  <div className="text-right">
                    <span className="text-sm font-mono font-black text-white">{tokenAmount.toFixed(4)} {tokenType}</span>
                    <span className="text-xs text-slate-500 ml-2">(${totalBudgetUSD.toLocaleString()})</span>
                  </div>
                </div>
              </div>

              {/* Freelancer address */}
              <div>
                <label className={labelClass}>Freelancer Address (STX)</label>
                <input
                  type="text"
                  className={`${inputClass} font-mono text-xs`}
                  placeholder="SP3..."
                  value={freelancerAddress}
                  onChange={(e) => setFreelancerAddress(e.target.value)}
                />
              </div>

              {/* Category */}
              <div>
                <label className={labelClass}>Category</label>
                <select
                  className={`${inputClass} appearance-none`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {storeCategories.length > 0
                    ? storeCategories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)
                    : ['Web Development', 'Smart Contracts', 'Design', 'Auditing', 'Writing', 'Marketing'].map((n) => <option key={n}>{n}</option>)
                  }
                </select>
              </div>

              {/* Scope of work */}
              <div>
                <label className={labelClass}>Scope of Work</label>
                <textarea
                  rows={3}
                  className={`${inputClass} resize-none`}
                  placeholder="Describe deliverables, timeline, and requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Attachments */}
              <div>
                <label className={labelClass}>Attachments</label>
                <div className="space-y-2">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="truncate text-slate-300">{file.name}</span>
                        <span className="text-slate-600">({(file.size / 1024).toFixed(0)}KB)</span>
                      </div>
                      <button type="button" onClick={() => removeAttachment(idx)} className="text-slate-500 hover:text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-slate-700 hover:border-orange-500/50 hover:bg-slate-950/50 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-all group"
                  >
                    <Paperclip className="w-5 h-5 text-slate-500 group-hover:text-orange-500 mb-1" />
                    <span className="text-xs text-slate-500 group-hover:text-slate-400">Click to attach files</span>
                    <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-slate-800 text-slate-400 text-sm font-bold uppercase tracking-wider hover:text-white hover:border-slate-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}

            <div className="flex-1" />

            {isSetupStep && (
              <button
                type="button"
                disabled={!setupValid}
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 text-white text-sm font-black uppercase tracking-wider hover:bg-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(234,88,12,0.2)]"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {isMilestoneStep && (
              <button
                type="button"
                disabled={!currentMsValid}
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 text-white text-sm font-black uppercase tracking-wider hover:bg-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(234,88,12,0.2)]"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {isReviewStep && (
              <button
                type="button"
                disabled={!reviewValid || isLoading}
                onClick={handleDeploy}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 text-white text-sm font-black uppercase tracking-wider hover:bg-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:scale-[1.01]"
              >
                {isLoading ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" /> Deploy Contract (${totalBudgetUSD.toLocaleString()})
                  </>
                )}
              </button>
            )}
          </div>

          {isReviewStep && (
            <p className="text-center text-[10px] text-slate-500 mt-3 font-mono">
              By deploying, you agree to lock {tokenAmount.toFixed(4)} {tokenType} into the smart contract.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;
