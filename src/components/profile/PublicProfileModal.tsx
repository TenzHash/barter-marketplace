// src/components/profile/PublicProfileModal.tsx
import React, { useState, useEffect } from "react";
import { reviewService } from "../../services/reviewService";
import { supabase } from "../../lib/supabaseClient";
import type { Profile, TradeReview, Listing } from "../../types/marketplace";
import { ListingCard } from "../listings/ListingCard";
import {
  X,
  Star,
  GraduationCap,
  Sparkles,
  Package,
  Layers,
  Calendar,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface PublicProfileModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectListing: (listing: Listing) => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({
  userId,
  isOpen,
  onClose,
  onSelectListing,
}) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<TradeReview[]>([]);
  const [activeListings, setActiveListings] = useState<Listing[]>([]);
  const [activeTab, setActiveTab] = useState<"closet" | "reviews">("closet");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !userId) return;

    async function loadTraderData() {
      setLoading(true);
      try {
        const [profileRes, reviewsData, listingsRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId).single(),
          reviewService.getUserReviews(userId!),
          supabase
            .from("listings")
            .select("*, profiles:user_id(*)")
            .eq("user_id", userId)
            .eq("is_inventory_only", false)
            .eq("status", "active")
            .order("created_at", { ascending: false }),
        ]);

        if (profileRes.data) setProfile(profileRes.data as unknown as Profile);
        setReviews(reviewsData);
        if (listingsRes.data)
          setActiveListings(listingsRes.data as unknown as Listing[]);
      } catch (err) {
        console.error("Failed to load public profile:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTraderData();
  }, [isOpen, userId]);

  if (!isOpen || !userId) return null;

  // Compute tag breakdown from all reviews
  const allTags = reviews.flatMap((r) => r.tags || []);
  const tagCounts: { [tag: string]: number } = {};
  allTags.forEach((tag) => {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[88vh]">
        {/* Top Header / Profile Hero */}
        <div className="p-6 bg-zinc-950 border-b border-zinc-800 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-zinc-400 hover:text-white transition"
          >
            <X size={18} />
          </button>

          {loading ? (
            <div className="flex items-center gap-4 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-zinc-800" />
              <div className="space-y-2">
                <div className="w-32 h-4 bg-zinc-800 rounded" />
                <div className="w-48 h-3 bg-zinc-800 rounded" />
              </div>
            </div>
          ) : profile ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={
                    profile.avatar_url ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${profile.full_name}`
                  }
                  alt={profile.full_name}
                  className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 object-cover shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-zinc-100">
                      {profile.full_name}
                    </h2>
                    {profile.student_id_verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60">
                        <GraduationCap size={11} /> Verified Student
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                    <span>{profile.university || "Campus Member"}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-zinc-500">
                      <Calendar size={11} /> Joined{" "}
                      {new Date(profile.created_at).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </p>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-400 font-bold text-sm">
                    <Star size={13} className="fill-amber-400" />
                    <span>{Number(profile.rating_avg || 5.0).toFixed(1)}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    {reviews.length}{" "}
                    {reviews.length === 1 ? "review" : "reviews"}
                  </span>
                </div>

                <div className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
                  <div className="flex items-center justify-center gap-1 text-emerald-400 font-bold text-sm">
                    <Sparkles size={13} />
                    <span>{profile.trades_completed ?? 0}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    completed trades
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Tab Headers */}
        <div className="flex px-6 pt-3 border-b border-zinc-800 bg-zinc-950/40 gap-4 shrink-0">
          <button
            onClick={() => setActiveTab("closet")}
            className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition ${
              activeTab === "closet"
                ? "border-zinc-100 text-zinc-100"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layers size={14} />
            <span>Public Closet ({activeListings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition ${
              activeTab === "reviews"
                ? "border-zinc-100 text-zinc-100"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Star size={14} />
            <span>Trader Reviews ({reviews.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <Loader2 size={24} className="animate-spin text-zinc-400 mb-2" />
              <p className="text-xs">Loading profile information...</p>
            </div>
          ) : activeTab === "closet" ? (
            activeListings.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
                <Package size={28} className="mx-auto text-zinc-600 mb-2" />
                <p className="text-sm font-semibold text-zinc-300">
                  No active public listings
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  This student has no items listed on the public explore feed
                  right now.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {activeListings.map((item) => (
                  <ListingCard
                    key={item.id}
                    listing={item}
                    onSelect={(selected) => {
                      onClose();
                      onSelectListing(selected);
                    }}
                  />
                ))}
              </div>
            )
          ) : (
            /* Reviews Tab */
            <div className="space-y-5">
              {/* Aggregated Tags Summary */}
              {Object.keys(tagCounts).length > 0 && (
                <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
                    Peer Endorsements
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(tagCounts).map(([tag, count]) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-zinc-900 border border-zinc-700/60 text-zinc-200"
                      >
                        <CheckCircle2 size={11} className="text-emerald-400" />
                        <span>{tag}</span>
                        <span className="text-[10px] text-zinc-500 font-semibold">
                          ×{count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
                  <Star size={28} className="mx-auto text-zinc-600 mb-2" />
                  <p className="text-sm font-semibold text-zinc-300">
                    No reviews yet
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Complete an exchange with this student to leave the first
                    review!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              rev.reviewer?.avatar_url ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${rev.reviewer_id}`
                            }
                            alt="Reviewer"
                            className="w-6 h-6 rounded-full bg-zinc-800"
                          />
                          <span className="text-xs font-semibold text-zinc-200">
                            {rev.reviewer?.full_name || "Campus Trader"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={11}
                              className={
                                s <= rev.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-zinc-700"
                              }
                            />
                          ))}
                        </div>
                      </div>

                      {rev.comment && (
                        <p className="text-xs text-zinc-300 leading-relaxed italic">
                          "{rev.comment}"
                        </p>
                      )}

                      {rev.tags && rev.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {rev.tags.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      <span className="block text-[9px] text-zinc-500 pt-1">
                        {new Date(rev.created_at).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
