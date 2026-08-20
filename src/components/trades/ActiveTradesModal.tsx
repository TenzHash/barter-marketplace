import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { tradeService } from "../../services/tradeService";
import type { DetailedTrade } from "../../types/marketplace";
import { X, MessageSquare, Loader2, Package } from "lucide-react";

interface ActiveTradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTradeRoom: (tradeId: string) => void;
}

export const ActiveTradesModal: React.FC<ActiveTradesModalProps> = ({
  isOpen,
  onClose,
  onOpenTradeRoom,
}) => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<DetailedTrade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await tradeService.getUserTrades(user.id);
      setTrades(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchTrades();
    }
  }, [isOpen, fetchTrades]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-zinc-400" />
            <h2 className="text-base font-bold text-zinc-100">
              Active Trades & Exchanges
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
              <Loader2 size={24} className="animate-spin text-zinc-400 mb-2" />
              <p className="text-xs">Loading active trades...</p>
            </div>
          ) : trades.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl text-zinc-400 text-xs">
              No active trades found. Accept an offer to start coordinating
              fulfillment.
            </div>
          ) : (
            trades.map((t) => {
              const isBuyer = user?.id === t.buyer_id;
              const partner = isBuyer ? t.seller : t.buyer;
              const isCompleted = t.status === "completed";

              return (
                <div
                  key={t.id}
                  className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={
                        partner?.avatar_url ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${partner?.full_name}`
                      }
                      alt="Avatar"
                      className="w-9 h-9 rounded-full bg-zinc-800 shrink-0"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200 line-clamp-1">
                        {t.offer?.target_listing?.title}
                      </h4>
                      <p className="text-[10px] text-zinc-400">
                        Trading with {partner?.full_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        isCompleted
                          ? "bg-emerald-950 text-emerald-300"
                          : "bg-amber-950 text-amber-300"
                      }`}
                    >
                      {isCompleted ? "Completed" : "In Progress"}
                    </span>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenTradeRoom(t.id);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold rounded-lg transition"
                    >
                      <MessageSquare size={13} />
                      <span>Chat</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
