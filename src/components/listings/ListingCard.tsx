import React from "react";
import type { Listing } from "../../types/marketplace";
import { ArrowLeftRight, Layers, Star } from "lucide-react";

interface ListingCardProps {
  listing: Listing;
  onSelect: (listing: Listing) => void;
  onOpenProfile?: (userId: string) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onSelect,
  onOpenProfile,
}) => {
  const formattedCondition = listing.condition.replace("_", " ").toUpperCase();
  const ratingAvg = listing.profiles?.rating_avg ?? 5.0;

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenProfile) {
      onOpenProfile(listing.user_id);
    }
  };

  return (
    <div
      onClick={() => onSelect(listing)}
      className="group bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl overflow-hidden cursor-pointer transition flex flex-col shadow-sm hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] bg-zinc-950 overflow-hidden">
        <img
          src={
            listing.images[0] ||
            "https://placehold.co/600x400/18181b/71717a?text=No+Photo"
          }
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />

        <div className="absolute top-2.5 left-2.5">
          {listing.mode === "barter_only" && (
            <span className="flex items-center gap-1 text-[10px] font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-full backdrop-blur-md">
              <ArrowLeftRight size={10} /> Barter Only
            </span>
          )}
          {listing.mode === "cash_only" && (
            <span className="flex items-center gap-1 text-[10px] font-semibold bg-blue-950/90 text-blue-300 border border-blue-800/60 px-2 py-0.5 rounded-full backdrop-blur-md">
              ₱ For Sale
            </span>
          )}
          {listing.mode === "cash_or_barter" && (
            <span className="flex items-center gap-1 text-[10px] font-semibold bg-zinc-900/90 text-zinc-200 border border-zinc-700/60 px-2 py-0.5 rounded-full backdrop-blur-md">
              <Layers size={10} /> Sale / Trade
            </span>
          )}
        </div>

        <span className="absolute bottom-2.5 right-2.5 text-[10px] font-medium bg-black/70 text-zinc-300 px-2 py-0.5 rounded-md backdrop-blur-md">
          {formattedCondition}
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-xs text-zinc-100 line-clamp-1 group-hover:text-zinc-300 transition">
            {listing.title}
          </h3>

          <div className="flex items-baseline gap-2 mt-1.5">
            {listing.cash_price ? (
              <span className="text-sm font-bold text-zinc-100">
                ₱
                {Number(listing.cash_price).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                })}
              </span>
            ) : null}
            <span className="text-[11px] text-zinc-400">
              Est. ₱
              {Number(listing.estimated_value).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          {listing.looking_for && (
            <p className="text-[11px] text-zinc-400 mt-2 line-clamp-1">
              <span className="text-zinc-500">Looking for: </span>
              {listing.looking_for}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800/60">
          <div
            onClick={handleProfileClick}
            className="flex items-center gap-2 truncate hover:opacity-80 transition"
            title="View student trader profile"
          >
            <img
              src={
                listing.profiles?.avatar_url ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${listing.user_id}`
              }
              alt="Seller"
              className="w-5 h-5 rounded-full bg-zinc-800"
            />
            <span className="text-[11px] text-zinc-400 hover:underline truncate">
              {listing.profiles?.full_name || "Student Trader"}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-amber-400 shrink-0 font-medium">
            <Star size={11} className="fill-amber-400" />
            <span>{Number(ratingAvg).toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
