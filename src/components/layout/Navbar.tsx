// Inside src/components/layout/Navbar.tsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "../auth/AuthModal";
import { NotificationBell } from "../notifications/NotificationBell";
import { EditProfileModal } from "../profile/EditProfileModal";
import {
  LogOut,
  Plus,
  Repeat,
  Inbox,
  Package,
  Layers,
  GraduationCap,
  Settings,
} from "lucide-react";

interface NavbarProps {
  onOpenCreateListing?: () => void;
  onOpenInbox?: () => void;
  onOpenTrades?: () => void;
  onOpenCloset?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreateListing,
  onOpenInbox,
  onOpenTrades,
  onOpenCloset,
}) => {
  const { user, profile, signOut, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 tracking-tight cursor-pointer">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold">
              <Repeat size={15} />
            </div>
            <span className="font-semibold text-sm tracking-tight text-zinc-100">
              barter<span className="text-zinc-500">.campus</span>
            </span>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="w-20 h-7 bg-zinc-800/40 rounded-lg animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenCloset}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg transition"
                >
                  <Layers size={14} />
                  <span>Closet</span>
                </button>

                <button
                  onClick={onOpenTrades}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg transition"
                >
                  <Package size={14} />
                  <span>Trades</span>
                </button>

                <button
                  onClick={onOpenInbox}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg transition"
                >
                  <Inbox size={14} />
                  <span>Inbox</span>
                </button>
                <NotificationBell
                  onOpenInbox={onOpenInbox!}
                  onOpenTrades={onOpenTrades!}
                />
                <button
                  onClick={onOpenCreateListing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-100 text-zinc-950 hover:bg-zinc-200 rounded-lg transition ml-1"
                >
                  <Plus size={14} />
                  <span>List Item</span>
                </button>

                <div className="h-4 w-[1px] bg-zinc-800 mx-2" />

                {/* Profile Badge & Edit Trigger */}
                <button
                  onClick={() => setEditProfileOpen(true)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 hover:bg-zinc-900 rounded-lg transition group"
                  title="Customize profile"
                >
                  <img
                    src={
                      profile?.avatar_url ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.full_name || user.email}`
                    }
                    alt="Avatar"
                    className="w-6 h-6 rounded-full bg-zinc-800 object-cover"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-zinc-300 font-medium group-hover:text-zinc-100 hidden sm:inline">
                      {profile?.full_name || user.email?.split("@")[0]}
                    </span>
                    <GraduationCap size={13} className="text-blue-400" />
                  </div>
                  <Settings
                    size={12}
                    className="text-zinc-500 group-hover:text-zinc-300 hidden sm:inline"
                  />
                </button>

                <button
                  onClick={() => signOut()}
                  title="Sign out"
                  className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded-lg transition"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuth("login")}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition"
                >
                  Sign in
                </button>
                <button
                  onClick={() => openAuth("register")}
                  className="px-3.5 py-1.5 text-xs font-medium bg-zinc-100 text-zinc-950 hover:bg-zinc-200 rounded-lg transition shadow-sm"
                >
                  Join with .edu
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />

      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
      />
    </>
  );
};
