import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { tradeService } from "../../services/tradeService";
import { reviewService } from "../../services/reviewService";
import { ReviewTradeModal } from "./ReviewTradeModal";
import { MeetupSchedulerModal } from "./MeetupSchedulerModal";
import type { DetailedTrade, TradeMessage } from "../../types/marketplace";
import { supabase } from "../../lib/supabaseClient";
import {
  X,
  Send,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Package,
  Star,
  MapPin,
  Calendar,
  Check,
  CheckCheck,
} from "lucide-react";

interface ExtendedTradeMessage extends TradeMessage {
  isOptimistic?: boolean;
}

interface TradeRoomModalProps {
  tradeId: string;
  isOpen: boolean;
  onClose: () => void;
  onTradeCompleted?: () => void;
}

export const TradeRoomModal: React.FC<TradeRoomModalProps> = ({
  tradeId,
  isOpen,
  onClose,
  onTradeCompleted,
}) => {
  const { user, profile } = useAuth();
  const [trade, setTrade] = useState<DetailedTrade | null>(null);
  const [messages, setMessages] = useState<ExtendedTradeMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [meetupActionLoading, setMeetupActionLoading] = useState(false);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [schedulerOpen, setSchedulerOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadTradeData = useCallback(async () => {
    try {
      const [tradeData, messageList] = await Promise.all([
        tradeService.getTradeDetails(tradeId),
        tradeService.getMessages(tradeId),
      ]);
      setTrade(tradeData);
      setMessages(messageList);

      if (user && tradeData.status === "completed") {
        const reviewed = await reviewService.hasReviewed(tradeId, user.id);
        setHasReviewed(reviewed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tradeId, user]);

  useEffect(() => {
    if (!isOpen || !tradeId) return;

    loadTradeData();

    // Realtime channel for trade messages
    const messageChannel = supabase
      .channel(`trade_messages:${tradeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trade_messages",
          filter: `trade_id=eq.${tradeId}`,
        },
        // Change: (payload) => { ... }
        // To:
        (payload: { new: TradeMessage }) => {
          const incomingMsg = payload.new;
          setMessages((prev) => {
            const hasMatch = prev.some(
              (m) =>
                m.id === incomingMsg.id ||
                (m.isOptimistic &&
                  m.content === incomingMsg.content &&
                  m.sender_id === incomingMsg.sender_id),
            );

            if (hasMatch) {
              return prev.map((m) =>
                m.isOptimistic &&
                m.content === incomingMsg.content &&
                m.sender_id === incomingMsg.sender_id
                  ? { ...incomingMsg, sender: m.sender }
                  : m,
              );
            }

            return [...prev, incomingMsg];
          });
        },
      )
      .subscribe();

    // Realtime channel for trade metadata (meetup agreements & completion updates)
    const tradeChannel = supabase
      .channel(`trade_updates:${tradeId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trades",
          filter: `id=eq.${tradeId}`,
        },
        () => {
          loadTradeData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(tradeChannel);
    };
  }, [isOpen, tradeId, loadTradeData]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    const content = inputText.trim();
    setInputText("");

    // Instant optimistic render in feed
    const tempId = `optimistic-${Date.now()}`;
    const optimisticMessage: ExtendedTradeMessage = {
      id: tempId,
      trade_id: tradeId,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
      sender: profile || undefined,
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      await tradeService.sendMessage(tradeId, user.id, content);
    } catch (err: any) {
      alert(`Message failed: ${err.message}`);
      // Remove optimistic message if submission fails
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const handleAgreeMeetup = async () => {
    setMeetupActionLoading(true);
    try {
      await tradeService.agreeToMeetup(tradeId);
      await loadTradeData();
    } catch (err: any) {
      alert(`Failed to confirm meetup: ${err.message}`);
    } finally {
      setMeetupActionLoading(false);
    }
  };

  const handleConfirmTrade = async () => {
    if (!user || !trade) return;
    setConfirming(true);
    try {
      const result = await tradeService.confirmReceipt(trade.id, user.id);
      await loadTradeData();
      if (result.status === "completed") {
        alert("🎉 Trade successfully completed!");
        setReviewModalOpen(true);
        if (onTradeCompleted) onTradeCompleted();
      } else {
        alert("Confirmed! Waiting for your trade partner to mark as received.");
      }
    } catch (err: any) {
      alert(`Confirmation failed: ${err.message}`);
    } finally {
      setConfirming(false);
    }
  };

  if (!isOpen) return null;

  const isBuyer = user?.id === trade?.buyer_id;
  const otherParty = isBuyer ? trade?.seller : trade?.buyer;
  const hasUserConfirmed = isBuyer
    ? !!trade?.buyer_confirmed_at
    : !!trade?.seller_confirmed_at;
  const hasOtherConfirmed = isBuyer
    ? !!trade?.seller_confirmed_at
    : !!trade?.buyer_confirmed_at;
  const isCompleted = trade?.status === "completed";

  const isMeetupProposed = trade?.meetup_status === "proposed";
  const isMeetupAgreed = trade?.meetup_status === "agreed";
  const wasProposedByMe = trade?.meetup_proposed_by === user?.id;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden">
        <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-800 bg-zinc-950 shrink-0">
            <div className="flex items-center gap-2.5">
              <img
                src={
                  otherParty?.avatar_url ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${otherParty?.full_name}`
                }
                alt="Avatar"
                className="w-8 h-8 rounded-full bg-zinc-800 object-cover"
              />
              <div>
                <h2 className="text-xs font-bold text-white flex items-center gap-1">
                  <span>{otherParty?.full_name || "Trade Partner"}</span>
                  <ShieldCheck size={13} className="text-emerald-400" />
                </h2>
                <p className="text-[10px] text-zinc-400">
                  {isCompleted ? "Deal Finalized" : "Active Campus Exchange"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Trade Info & Confirmation Actions */}
          <div className="p-3.5 bg-zinc-950/60 border-b border-zinc-800 shrink-0 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <Package size={14} className="text-zinc-400" />
              <span className="font-medium text-white">
                {trade?.offer?.target_listing?.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md ${
                  hasUserConfirmed
                    ? "bg-emerald-950 text-emerald-300"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                You: {hasUserConfirmed ? "Confirmed" : "Pending"}
              </span>

              <span
                className={`text-[10px] px-2 py-0.5 rounded-md ${
                  hasOtherConfirmed
                    ? "bg-emerald-950 text-emerald-300"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                Partner: {hasOtherConfirmed ? "Confirmed" : "Pending"}
              </span>

              {!isCompleted && !hasUserConfirmed && (
                <button
                  onClick={handleConfirmTrade}
                  disabled={confirming}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded-lg transition flex items-center gap-1"
                >
                  {confirming ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={12} />
                  )}
                  <span>Mark Received</span>
                </button>
              )}

              {isCompleted && !hasReviewed && (
                <button
                  onClick={() => setReviewModalOpen(true)}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[11px] font-semibold rounded-lg transition flex items-center gap-1 shadow-sm"
                >
                  <Star size={12} className="fill-zinc-950" />
                  <span>Rate Trader</span>
                </button>
              )}
            </div>
          </div>

          {/* Campus Meetup Checkpoint Status Banner */}
          {!isCompleted && (
            <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-3 text-xs shrink-0">
              {isMeetupAgreed ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShieldCheck size={14} className="shrink-0" />
                  <span>
                    <strong>Confirmed Meetup:</strong> {trade?.meetup_location}{" "}
                    on{" "}
                    {new Date(trade?.meetup_time!).toLocaleDateString(
                      undefined,
                      {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </span>
                </div>
              ) : isMeetupProposed ? (
                <div className="flex items-center justify-between w-full gap-2">
                  <div className="flex items-center gap-2 text-zinc-300 truncate">
                    <MapPin size={14} className="text-amber-400 shrink-0" />
                    <span className="truncate">
                      <strong>
                        {wasProposedByMe
                          ? "You proposed:"
                          : "Partner proposed:"}
                      </strong>{" "}
                      {trade?.meetup_location} (
                      {new Date(trade?.meetup_time!).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                      )
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!wasProposedByMe && (
                      <button
                        onClick={handleAgreeMeetup}
                        disabled={meetupActionLoading}
                        className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded-lg transition"
                      >
                        <Check size={12} />
                        <span>Agree</span>
                      </button>
                    )}
                    <button
                      onClick={() => setSchedulerOpen(true)}
                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium rounded-lg transition"
                    >
                      {wasProposedByMe ? "Reschedule" : "Propose Alternate"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-zinc-400 flex items-center gap-1.5 text-[11px]">
                    <MapPin size={13} className="text-zinc-500" />
                    No campus meetup spot scheduled yet
                  </span>
                  <button
                    onClick={() => setSchedulerOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-950/80 hover:bg-blue-900 border border-blue-800/60 text-blue-300 text-[11px] font-semibold rounded-lg transition"
                  >
                    <Calendar size={12} />
                    <span>Set Safe Meetup Spot</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Real-time Message Feed */}
          <div className="flex-1 p-5 overflow-y-auto space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                <Loader2 size={20} className="animate-spin mb-2" />
                <p className="text-xs">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-zinc-500 text-xs py-20">
                No messages yet. Coordinate campus meetup or handover details
                here.
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-xl px-3 py-2 text-xs flex flex-col ${
                        isMine
                          ? "bg-zinc-100 text-zinc-950"
                          : "bg-zinc-800 text-zinc-100"
                      }`}
                    >
                      <p>{msg.content}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-zinc-500 mt-0.5 px-1">
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isMine &&
                        (msg.isOptimistic ? (
                          <span title="Sending...">
                            <Check size={10} className="text-zinc-500" />
                          </span>
                        ) : (
                          <span title="Delivered">
                            <CheckCheck size={11} className="text-blue-400" />
                          </span>
                        ))}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-zinc-950 border-t border-zinc-800 flex gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 text-xs font-semibold rounded-xl transition flex items-center gap-1"
            >
              <Send size={12} />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>

      {/* Meetup Scheduler Modal */}
      {user && (
        <MeetupSchedulerModal
          isOpen={schedulerOpen}
          onClose={() => setSchedulerOpen(false)}
          tradeId={tradeId}
          currentUserId={user.id}
          onSuccess={loadTradeData}
        />
      )}

      {/* Review Modal */}
      {user && (
        <ReviewTradeModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          tradeId={tradeId}
          currentUserId={user.id}
          reviewee={otherParty}
          onSuccess={() => setHasReviewed(true)}
        />
      )}
    </>
  );
};
