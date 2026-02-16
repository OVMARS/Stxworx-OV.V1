import React, { useState } from 'react';
import { AlertTriangle, X, Shield } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

interface DisputeModalProps {
  projectId: number;
  projectTitle: string;
  milestoneCount: number;
  onClose: () => void;
}

const DisputeModal: React.FC<DisputeModalProps> = ({ projectId, projectTitle, milestoneCount, onClose }) => {
  const { createDispute, isProcessing } = useAppStore();
  const [milestoneNum, setMilestoneNum] = useState(1);
  const [reason, setReason] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!reason.trim()) {
      setError('Please provide a reason for the dispute.');
      return;
    }
    try {
      await createDispute({
        projectId,
        milestoneNum,
        reason: reason.trim(),
        evidenceUrl: evidenceUrl.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to file dispute. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-red-900/30 overflow-hidden animate-[fadeUp_0.3s_ease-out]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-red-950/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-black uppercase tracking-tight text-white">Open Dispute</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-red-950/20 border border-red-900/30 rounded-lg">
            <Shield className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-xs text-red-300/80">
              <p className="font-bold mb-1">This will flag the project for admin review.</p>
              <p>Project: <span className="text-white font-semibold">{projectTitle}</span></p>
            </div>
          </div>

          {/* Milestone selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Disputed Milestone
            </label>
            <div className="flex gap-2">
              {Array.from({ length: milestoneCount }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMilestoneNum(num)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold uppercase transition-all border ${
                    milestoneNum === num
                      ? 'bg-red-600/20 border-red-500/50 text-red-400'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  M{num}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Reason for Dispute *
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:ring-1 focus:ring-red-500 focus:outline-none resize-none placeholder-slate-600"
              placeholder="Explain why you're disputing this milestone..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Evidence URL */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Evidence URL <span className="text-slate-700">(optional)</span>
            </label>
            <input
              type="url"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:ring-1 focus:ring-red-500 focus:outline-none placeholder-slate-600 font-mono"
              placeholder="https://..."
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/30 rounded px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isProcessing || !reason.trim()}
              className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? 'Filing...' : <><AlertTriangle className="w-4 h-4" /> File Dispute</>}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-800 text-slate-400 font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisputeModal;
