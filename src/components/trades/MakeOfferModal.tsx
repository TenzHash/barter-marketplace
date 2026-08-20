import React, { useState, useMemo } from "react";
import type {
  Listing,
  OfferType,
  OfferProposalPayload,
} from "../../types/marketplace";
import { useUserInventory } from "../../hooks/useUserInventory";
import { offerService } from "../../services/offerService";
import {
  X,
  Check,
  ArrowLeftRight,
  Layers,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface MakeOfferModalProps {
  targetListing: Listing;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MakeOfferModal: React.FC<MakeOfferModalProps> = ({
  targetListing,
  currentUserId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { inventory, loading } = useUserInventory(currentUserId);
  const [offerType, setOfferType] = useState<OfferType>(
    targetListing.mode === "barter_only" ? "barter" : "hybrid",
  );
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalItemsValue = useMemo(() => {
    return inventory
      .filter((item) => selectedItemIds.includes(item.id))
      .reduce((sum, item) => sum + Number(item.estimated_value || 0), 0);
  }, [inventory, selectedItemIds]);

  const totalOfferValue =
    (offerType === "cash" ? 0 : totalItemsValue) +
    (offerType === "barter" ? 0 : Number(cashAmount) || 0);

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (offerType === "cash" && cashAmount <= 0) {
      setErrorMsg("Please enter a valid cash amount in Pesos (₱).");
      return;
    }
    if (offerType === "barter" && selectedItemIds.length === 0) {
      setErrorMsg(
        "Please select at least one item from your inventory to trade.",
      );
      return;
    }
    if (
      offerType === "hybrid" &&
      selectedItemIds.length === 0 &&
      cashAmount <= 0
    ) {
      setErrorMsg(
        "Please select an item or add cash to balance the hybrid trade.",
      );
      return;
    }

    setSubmitting(true);

    const payload: OfferProposalPayload = {
      listing_id: targetListing.id,
      proposer_id: currentUserId,
      recipient_id: targetListing.user_id,
      type: offerType,
      cash_amount: offerType === "barter" ? 0 : Number(cashAmount),
      offered_item_ids: offerType === "cash" ? [] : selectedItemIds,
      message: message.trim() || undefined,
    };

    try {
      await offerService.submitOffer(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Offer submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-zinc-100 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white transition"
        >
          <X size={18} />
        </button>

        <div className="mb-5">
          <h2 className="text-lg font-bold">Propose an Exchange</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Target Item:{" "}
            <span className="text-zinc-200 font-medium">
              {targetListing.title}
            </span>{" "}
            (Est. ₱
            {Number(targetListing.estimated_value).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}
            )
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-950 border border-zinc-800 rounded-xl mb-4">
          {targetListing.mode !== "barter_only" && (
            <button
              type="button"
              onClick={() => setOfferType("cash")}
              className={`flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                offerType === "cash"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span className="font-bold">₱</span>
              <span>Cash</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setOfferType("barter")}
            className={`flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              offerType === "barter"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <ArrowLeftRight size={13} />
            <span>Item Swap</span>
          </button>

          <button
            type="button"
            onClick={() => setOfferType("hybrid")}
            className={`flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              offerType === "hybrid"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Layers size={13} />
            <span>Item + ₱</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {offerType !== "cash" && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Select from Your Closet
                </label>
                <span className="text-[11px] text-zinc-400">
                  {selectedItemIds.length} item(s) selected
                </span>
              </div>

              {loading ? (
                <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-950 rounded-xl">
                  Loading trade inventory...
                </div>
              ) : inventory.length === 0 ? (
                <div className="p-4 text-center text-xs text-amber-300 bg-amber-950/30 border border-amber-800/40 rounded-xl">
                  You have no active items in your closet. Add an item first to
                  propose swaps.
                </div>
              ) : (
                <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                  {inventory.map((item) => {
                    const isSelected = selectedItemIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleSelectItem(item.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? "border-zinc-400 bg-zinc-800"
                            : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              item.images[0] ||
                              "https://placehold.co/80x80/18181b/71717a?text=Item"
                            }
                            alt={item.title}
                            className="w-9 h-9 rounded-lg object-cover bg-zinc-900 shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-xs text-white line-clamp-1">
                              {item.title}
                            </p>
                            <p className="text-[10px] text-zinc-400">
                              Est. ₱
                              {Number(item.estimated_value).toLocaleString(
                                "en-PH",
                                { minimumFractionDigits: 2 },
                              )}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                            isSelected
                              ? "bg-zinc-100 border-zinc-100 text-zinc-950"
                              : "border-zinc-700 bg-zinc-900"
                          }`}
                        >
                          {isSelected && <Check size={11} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {offerType !== "barter" && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                {offerType === "cash" ? "Cash Offer (₱)" : "Cash Top-Up (₱)"}
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={cashAmount || ""}
                onChange={(e) => setCashAmount(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                placeholder="0"
              />
            </div>
          )}

          <div className="p-3 bg-zinc-950 rounded-xl flex justify-between items-center text-xs border border-zinc-800">
            <span className="text-zinc-400">
              Target Value: ₱
              {Number(targetListing.estimated_value).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </span>
            <span
              className={`font-semibold ${totalOfferValue >= Number(targetListing.estimated_value) ? "text-emerald-400" : "text-amber-400"}`}
            >
              Total Offer Value: ₱
              {totalOfferValue.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Note to Student Seller
            </label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl p-3 text-xs text-white outline-none"
              placeholder="e.g. Can meet at Main Campus Library on Friday..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            <span>{submitting ? "Submitting..." : "Send Trade Proposal"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
