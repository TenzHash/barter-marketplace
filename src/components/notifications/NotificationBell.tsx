// src/components/notifications/NotificationBell.tsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  notificationService,
  type AppNotification,
} from "../../services/notificationService";
import { supabase } from "../../lib/supabaseClient";
import { Bell, Repeat, MapPin, Sparkles } from "lucide-react";

interface NotificationBellProps {
  onOpenInbox: () => void;
  onOpenTrades: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onOpenInbox,
  onOpenTrades,
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await notificationService.getNotifications(user.id);
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const channel = supabase
      .channel(`user_notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as AppNotification, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.is_read) {
      await notificationService.markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)),
      );
    }

    setIsOpen(false);
    if (notif.type === "offer_received") {
      onOpenInbox();
    } else {
      onOpenTrades();
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg transition"
        title="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-zinc-950" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-100">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800/60 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] text-zinc-400 hover:text-zinc-200 transition"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/50">
            {notifications.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-xs">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 text-xs cursor-pointer transition flex items-start gap-3 hover:bg-zinc-800/50 ${
                    notif.is_read
                      ? "opacity-60 bg-transparent"
                      : "bg-zinc-950/40"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {notif.type === "offer_received" && (
                      <Repeat size={14} className="text-emerald-400" />
                    )}
                    {notif.type.includes("meetup") && (
                      <MapPin size={14} className="text-amber-400" />
                    )}
                    {notif.type === "trade_completed" && (
                      <Sparkles size={14} className="text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-zinc-200 text-[11px]">
                      {notif.title}
                    </p>
                    <p className="text-zinc-400 text-[11px] mt-0.5 leading-snug">
                      {notif.message}
                    </p>
                    <span className="text-[9px] text-zinc-500 block mt-1">
                      {new Date(notif.created_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
