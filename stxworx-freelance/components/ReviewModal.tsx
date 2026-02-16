import React, { useState } from 'react';
import { Star, X, Award } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

interface ReviewModalProps {
  projectId: number;
  projectTitle: string;
  revieweeId: number;
  revieweeName: string;
  onClose: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ projectId, projectTitle, revieweeId, revieweeName, onClose }) => {
  const { createReview, isProcessing } = useAppStore();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5 stars.');
      return;
    }
    try {
      await createReview({
        projectId,
        revieweeId,
        rating,
        comment: comment.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit review. You may have already reviewed this project.');
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-orange-900/30 overflow-hidden animate-[fadeUp_0.3s_ease-out]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-black uppercase tracking-tight text-white">Leave Review</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="text-xs text-slate-500">
            Reviewing <span className="text-white font-bold">{revieweeName}</span> for project{' '}
            <span className="text-orange-400 font-bold">{projectTitle}</span>
          </div>

          {/* Star Rating */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Rating *
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-125"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= displayRating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-700'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-3 text-sm font-bold text-slate-400">
                {displayRating > 0
                  ? ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][displayRating]
                  : 'Select'}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Comment <span className="text-slate-700">(optional)</span>
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:ring-1 focus:ring-orange-500 focus:outline-none resize-none placeholder-slate-600"
              placeholder="Share your experience working on this project..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/30 rounded px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isProcessing || rating < 1}
              className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold uppercase tracking-wider text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(234,88,12,0.2)]"
            >
              {isProcessing ? 'Submitting...' : <><Star className="w-4 h-4" /> Submit Review</>}
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

export default ReviewModal;
