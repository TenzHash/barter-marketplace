// src/App.tsx
import { useEffect, useState, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/layout/Navbar";
import { CreateListingModal } from "./components/listings/CreateListingModal";
import { ListingCard } from "./components/listings/ListingCard";
import { MakeOfferModal } from "./components/trades/MakeOfferModal";
import { TradeInboxModal } from "./components/trades/TradeInboxModal";
import { TradeRoomModal } from "./components/trades/TradeRoomModal";
import { ActiveTradesModal } from "./components/trades/ActiveTradesModal";
import { ClosetModal } from "./components/inventory/ClosetModal";
import { PublicProfileModal } from "./components/profile/PublicProfileModal";
import { SearchBar, type FilterState } from "./components/filters/SearchBar";
import { useFilteredListings } from "./hooks/useFilteredListings";
import { listingService } from "./services/listingService";
import type { Listing } from "./types/marketplace";
import { Loader2, Inbox, GraduationCap } from "lucide-react";

const STUDENT_CAMPUS_CATEGORIES = [
  "All",
  "Textbooks & Reviewers",
  "Tech & Peripherals",
  "Calculators & Tools",
  "Uniforms & Lab Gear",
  "Dorm Essentials",
  "Skill / Service Swaps",
];

function MarketplaceApp() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    mode: "all",
    condition: "all",
    selectedCategory: "All",
    sortBy: "newest",
  });

  const filteredListings = useFilteredListings(listings, filters);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [inboxModalOpen, setInboxModalOpen] = useState(false);
  const [tradesModalOpen, setTradesModalOpen] = useState(false);
  const [closetModalOpen, setClosetModalOpen] = useState(false);
  const [activeTradeRoomId, setActiveTradeRoomId] = useState<string | null>(
    null,
  );
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [profileModalUserId, setProfileModalUserId] = useState<string | null>(
    null,
  );

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listingService.getPublicListings();
      setListings(data);
    } catch (err) {
      console.error("Failed to load listings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleCardClick = (listing: Listing) => {
    if (!user) {
      alert(
        "Please sign in with your student account to make trade offers or buy items.",
      );
      return;
    }
    if (listing.user_id === user.id) {
      alert("This is your own listing.");
      return;
    }
    setSelectedListing(listing);
    setOfferModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Navbar
        onOpenCreateListing={() => setCreateModalOpen(true)}
        onOpenInbox={() => setInboxModalOpen(true)}
        onOpenTrades={() => setTradesModalOpen(true)}
        onOpenCloset={() => setClosetModalOpen(true)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-950/60 border border-blue-800/50 text-blue-300 mb-2">
            <GraduationCap size={13} />
            <span>Verified Student Campus Network</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
            Campus Barter & Exchange
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-lg leading-relaxed">
            Trade textbooks, calculators, dorm gear, and skill services directly
            with verified students.
          </p>
        </div>

        <SearchBar
          filters={filters}
          onFilterChange={setFilters}
          categories={STUDENT_CAMPUS_CATEGORIES}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Loader2 size={24} className="animate-spin text-zinc-400 mb-2" />
            <p className="text-xs">Loading campus listings...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-800/80 rounded-2xl">
            <Inbox size={28} className="mx-auto text-zinc-600 mb-2" />
            <p className="text-sm font-semibold text-zinc-300">
              No matching items in your campus
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Try adjusting your filters or list an item to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredListings.map((item) => (
              <ListingCard
                key={item.id}
                listing={item}
                onSelect={handleCardClick}
                onOpenProfile={(uid) => setProfileModalUserId(uid)}
              />
            ))}
          </div>
        )}
      </main>

      <CreateListingModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchFeed}
      />

      {selectedListing && user && (
        <MakeOfferModal
          isOpen={offerModalOpen}
          onClose={() => {
            setOfferModalOpen(false);
            setSelectedListing(null);
          }}
          targetListing={selectedListing}
          currentUserId={user.id}
          onSuccess={() => {
            alert("Offer proposal sent to student seller!");
            fetchFeed();
          }}
        />
      )}

      <TradeInboxModal
        isOpen={inboxModalOpen}
        onClose={() => setInboxModalOpen(false)}
        onTradeAccepted={fetchFeed}
      />

      <ActiveTradesModal
        isOpen={tradesModalOpen}
        onClose={() => setTradesModalOpen(false)}
        onOpenTradeRoom={(tradeId) => setActiveTradeRoomId(tradeId)}
      />

      <ClosetModal
        isOpen={closetModalOpen}
        onClose={() => setClosetModalOpen(false)}
        onOpenCreateItem={() => setCreateModalOpen(true)}
      />

      {activeTradeRoomId && (
        <TradeRoomModal
          tradeId={activeTradeRoomId}
          isOpen={!!activeTradeRoomId}
          onClose={() => setActiveTradeRoomId(null)}
          onTradeCompleted={fetchFeed}
        />
      )}

      {/* Public Trader Profile Modal */}
      {profileModalUserId && (
        <PublicProfileModal
          userId={profileModalUserId}
          isOpen={!!profileModalUserId}
          onClose={() => setProfileModalUserId(null)}
          onSelectListing={(listing) => {
            setSelectedListing(listing);
            setOfferModalOpen(true);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MarketplaceApp />
    </AuthProvider>
  );
}
