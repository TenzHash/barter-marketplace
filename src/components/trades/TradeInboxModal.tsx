import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { offerService } from "../../services/offerService";
import type { Offer } from "../../types/marketplace";
import { OfferCard } from "./OfferCard";
import { X, Inbox, Send, Loader2, RefreshCw } from "lucide-react";

interface TradeInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTradeAccepted: () => void;
}

export const TradeInboxModal: React.FC<TradeInboxModalProps> = ({
  isOpen,
  onClose,
  onTradeAccepted,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [receivedOffers, setReceivedOffers] = useState<Offer[]>([]);
  const [sentOffers, setSentOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { received, sent } = await offerService.getUserOffers(user.id);
      setReceivedOffers(received);
      setSentOffers(sent);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchOffers();
    }
  }, [isOpen, fetchOffers]);

  const handleAcceptOffer = async (offerId: string) => {
    if (!user) return;
    try {
      await offerService.acceptOffer(offerId, user.id);
      await fetchOffers();
      onTradeAccepted();
      alert("Trade accepted! Check active trades to fulfill.");
    } catch (err: any) {
      alert(`Acceptance failed: ${err.message}`);
    }
  };

  const handleDeclineOffer = async (offerId: string) => {
    try {
      await offerService.updateOfferStatus(offerId, "declined");
      await fetchOffers();
    } catch (err: any) {
      alert(`Failed to decline: ${err.message}`);
    }
  };

  const handleCancelOffer = async (offerId: string) => {
    try {
      await offerService.updateOfferStatus(offerId, "cancelled");
      await fetchOffers();
    } catch (err: any) {
      alert(`Failed to cancel: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  const currentList = activeTab === "received" ? receivedOffers : sentOffers;
  const pendingReceivedCount = receivedOffers.filter(
    (o) => o.status === "pending",
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-zinc-100">Trade Inbox</h2>
            <button
              onClick={fetchOffers}
              disabled={loading}
              className="p-1 text-zinc-400 hover:text-white rounded-lg transition"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex px-6 pt-3 border-b border-zinc-800 bg-zinc-950/40 gap-4 shrink-0">
          <button
            onClick={() => setActiveTab("received")}
            className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition ${
              activeTab === "received"
                ? "border-zinc-100 text-zinc-100"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Inbox size={14} />
            <span>Incoming Offers</span>
            {pendingReceivedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-100 text-zinc-950 font-bold">
                {pendingReceivedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("sent")}
            className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition ${
              activeTab === "sent"
                ? "border-zinc-100 text-zinc-100"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Send size={14} />
            <span>Sent ({sentOffers.length})</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <Loader2 size={24} className="animate-spin text-zinc-400 mb-2" />
              <p className="text-xs">Loading offers...</p>
            </div>
          ) : currentList.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
              <Inbox size={28} className="mx-auto text-zinc-600 mb-2" />
              <p className="text-sm font-semibold text-zinc-300">
                No proposals found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentList.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  isIncoming={activeTab === "received"}
                  onAccept={handleAcceptOffer}
                  onDecline={handleDeclineOffer}
                  onCancel={handleCancelOffer}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
