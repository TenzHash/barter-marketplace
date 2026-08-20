// src/components/trades/ReviewTradeModal.tsx
import React, { useState } from "react";
import { reviewService } from "../../services/reviewService";
import type { Profile } from "../../types/marketplace";
import { X, Star, Check, Loader2, AlertCircle, Sparkles } from "lucide-react";

interface ReviewTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeId: string;
  currentUserId: string;
  reviewee: Profile | undefined;
  onSuccess?: () => void;
}

const PEER_TAGS = [
  "Item as described",
  "Punctual on campus",
  "Polite & friendly",
  "Quick responder",
  "Smooth barter deal",
  "Trustworthy trader",
];

export const ReviewTradeModal: React.FC<ReviewTradeModalProps> = ({
  isOpen,
  onClose,
  tradeId,
  currentUserId,
  reviewee,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !reviewee) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      await reviewService.submitReview({
        tradeId,
        reviewerId: currentUserId,
        revieweeId: reviewee.id,
        rating,
        tags: selectedTags,
        comment: comment.trim() || undefined,
      });

      if (onSuccess) onSuccess();
      onClose();
      alert("🌟 Feedback submitted! Trader rating updated.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-zinc-100 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white transition"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-zinc-800 mx-auto mb-3 flex items-center justify-center border border-zinc-700">
            <Sparkles size={20} className="text-amber-400" />
          </div>
          <h2 className="text-base font-bold text-zinc-100">
            Rate Your Exchange
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            How was your exchange experience with{" "}
            <strong className="text-zinc-200">{reviewee.full_name}</strong>?
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Selector */}
          <div className="flex justify-center items-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const active =
                (hoverRating !== null ? hoverRating : rating) >= star;
              return (
                <button
                  type="button"
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => setRating(star)}
                  className="p-1 text-zinc-600 hover:scale-110 transition duration-150"
                >
                  <Star
                    size={28}
                    className={
                      active ? "fill-amber-400 text-amber-400" : "text-zinc-700"
                    }
                  />
                </button>
              );
            })}
          </div>

          {/* Feedback Tag Chips */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Select Feedback Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PEER_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition flex items-center gap-1 ${
                      isSelected
                        ? "border-amber-500/80 bg-amber-950/30 text-amber-300"
                        : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    {isSelected && <Check size={11} />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Additional Feedback (Optional)
            </label>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Great communication, met up on time at the library!"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl p-3 text-xs text-white outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            <span>{loading ? "Submitting..." : "Submit Rating"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
