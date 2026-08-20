import React, { useState } from "react";
import type { Offer } from "../../types/marketplace";
import { Check, X, User as UserIcon } from "lucide-react";

interface OfferCardProps {
  offer: Offer;
  isIncoming: boolean;
  onAccept?: (offerId: string) => Promise<void>;
  onDecline?: (offerId: string) => Promise<void>;
  onCancel?: (offerId: string) => Promise<void>;
}

export const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  isIncoming,
  onAccept,
  onDecline,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);

  const itemsValue = (offer.offer_items || []).reduce(
    (sum, item) => sum + Number(item.listing?.estimated_value || 0),
    0,
  );

  const cashAmount = Number(offer.cash_amount || 0);
  const totalOfferValue =
    (offer.type === "cash" ? 0 : itemsValue) +
    (offer.type === "barter" ? 0 : cashAmount);
  const targetListingValue = Number(offer.target_listing?.estimated_value || 0);
  const valueDelta = totalOfferValue - targetListingValue;

  const handleAction = async (type: "accept" | "decline" | "cancel") => {
    setLoading(true);
    try {
      if (type === "accept" && onAccept) await onAccept(offer.id);
      if (type === "decline" && onDecline) await onDecline(offer.id);
      if (type === "cancel" && onCancel) await onCancel(offer.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-zinc-700 transition">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
              <UserIcon size={14} />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200">
                {isIncoming
                  ? offer.proposer?.full_name || "Student Proposer"
                  : `Sent to: ${offer.recipient?.full_name || "Seller"}`}
              </p>
              <p className="text-[10px] text-zinc-500">
                {new Date(offer.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              offer.status === "accepted"
                ? "bg-emerald-950 text-emerald-300 border border-emerald-800/50"
                : offer.status === "declined"
                  ? "bg-rose-950 text-rose-300 border border-rose-800/50"
                  : "bg-zinc-800 text-zinc-300"
            }`}
          >
            {offer.status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 p-2.5 bg-zinc-950 rounded-xl my-3 border border-zinc-800/80">
          <div>
            <span className="text-[10px] uppercase font-semibold text-zinc-500">
              Target
            </span>
            <p className="text-xs font-medium text-zinc-200 truncate mt-0.5">
              {offer.target_listing?.title}
            </p>
            <p className="text-[10px] text-zinc-400">
              Est. ₱
              {targetListingValue.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-zinc-500">
              Offered Value
            </span>
            <p className="text-xs font-bold text-zinc-100 mt-0.5">
              ₱
              {totalOfferValue.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </p>
            <span
              className={`text-[10px] font-medium ${valueDelta >= 0 ? "text-emerald-400" : "text-amber-400"}`}
            >
              {valueDelta >= 0
                ? `+₱${valueDelta.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                : `-₱${Math.abs(valueDelta).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
            </span>
          </div>
        </div>

        {offer.message && (
          <p className="text-[11px] text-zinc-400 italic bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/60 mb-3">
            "{offer.message}"
          </p>
        )}
      </div>

      {offer.status === "pending" && (
        <div className="pt-2 border-t border-zinc-800/80">
          {isIncoming ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAction("decline")}
                disabled={loading}
                className="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-rose-300 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1"
              >
                <X size={13} />
                <span>Decline</span>
              </button>

              <button
                onClick={() => handleAction("accept")}
                disabled={loading}
                className="py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1"
              >
                <Check size={13} />
                <span>Accept</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleAction("cancel")}
              disabled={loading}
              className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-semibold rounded-lg transition"
            >
              <span>Withdraw Proposal</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
