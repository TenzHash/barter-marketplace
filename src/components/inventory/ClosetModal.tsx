import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { listingService } from "../../services/listingService";
import type { Listing } from "../../types/marketplace";
import {
  X,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Trash2,
  Plus,
  Loader2,
  Package,
} from "lucide-react";

interface ClosetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateItem: () => void;
}

type ClosetTab = "all" | "private" | "public" | "locked";

export const ClosetModal: React.FC<ClosetModalProps> = ({
  isOpen,
  onClose,
  onOpenCreateItem,
}) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ClosetTab>("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchCloset = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await listingService.getUserCloset(user.id);
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchCloset();
    }
  }, [isOpen, fetchCloset]);

  const handleToggleVisibility = async (item: Listing) => {
    setActionLoadingId(item.id);
    try {
      await listingService.toggleItemVisibility(
        item.id,
        !item.is_inventory_only,
      );
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, is_inventory_only: !i.is_inventory_only }
            : i,
        ),
      );
    } catch (err: any) {
      alert(`Visibility update failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleArchive = async (itemId: string) => {
    if (!confirm("Are you sure you want to remove this item from your closet?"))
      return;
    setActionLoadingId(itemId);
    try {
      await listingService.archiveItem(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err: any) {
      alert(`Could not delete: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    if (activeTab === "private")
      return item.is_inventory_only && item.status === "active";
    if (activeTab === "public")
      return !item.is_inventory_only && item.status === "active";
    if (activeTab === "locked") return item.status === "pending_trade";
    return true;
  });

  const totalEstimatedValue = items.reduce(
    (sum, i) => sum + Number(i.estimated_value || 0),
    0,
  );
  const privateCount = items.filter(
    (i) => i.is_inventory_only && i.status === "active",
  ).length;
  const publicCount = items.filter(
    (i) => !i.is_inventory_only && i.status === "active",
  ).length;
  const lockedCount = items.filter((i) => i.status === "pending_trade").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950 shrink-0">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-zinc-300" />
            <h2 className="text-base font-bold text-zinc-100">
              My Closet & Trade Inventory
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-zinc-950/60 border-b border-zinc-800/80 text-xs shrink-0">
          <div className="p-3 bg-zinc-900/60 border border-zinc-800/60 rounded-xl">
            <span className="text-zinc-500">Closet Fair Value</span>
            <p className="text-sm font-bold text-zinc-100 mt-0.5">
              ₱
              {totalEstimatedValue.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="p-3 bg-zinc-900/60 border border-zinc-800/60 rounded-xl">
            <span className="text-zinc-500">Public Listings</span>
            <p className="text-sm font-bold text-zinc-100 mt-0.5">
              {publicCount}
            </p>
          </div>
          <div className="p-3 bg-zinc-900/60 border border-zinc-800/60 rounded-xl">
            <span className="text-zinc-500">Private Trade Items</span>
            <p className="text-sm font-bold text-zinc-100 mt-0.5">
              {privateCount}
            </p>
          </div>
          <div className="p-3 bg-zinc-900/60 border border-zinc-800/60 rounded-xl">
            <span className="text-zinc-500">In Active Trade</span>
            <p className="text-sm font-bold text-amber-400 mt-0.5">
              {lockedCount}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 pt-3 border-b border-zinc-800 bg-zinc-950/40 shrink-0 gap-4">
          <div className="flex gap-4">
            {[
              { id: "all", label: "All Items", count: items.length },
              { id: "public", label: "Public Feed", count: publicCount },
              { id: "private", label: "Private Closet", count: privateCount },
              { id: "locked", label: "In Trade", count: lockedCount },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as ClosetTab)}
                className={`flex items-center gap-1.5 pb-3 text-xs font-semibold border-b-2 transition ${
                  activeTab === t.id
                    ? "border-zinc-100 text-zinc-100"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span>{t.label}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300 font-normal">
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenCreateItem();
            }}
            className="flex items-center gap-1 px-3 py-1 mb-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold rounded-lg transition shrink-0"
          >
            <Plus size={13} />
            <span>Add Item</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <Loader2 size={24} className="animate-spin text-zinc-400 mb-2" />
              <p className="text-xs">Loading items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
              <Package size={28} className="mx-auto text-zinc-600 mb-2" />
              <p className="text-sm font-semibold text-zinc-300">
                No items found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const isLocked = item.status === "pending_trade";
                const isActionLoading = actionLoadingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="bg-zinc-950/70 border border-zinc-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-zinc-700 transition"
                  >
                    <div className="relative aspect-[16/10] bg-zinc-900 overflow-hidden">
                      <img
                        src={
                          item.images[0] ||
                          "https://placehold.co/400x250/18181b/71717a?text=No+Photo"
                        }
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />

                      <div className="absolute top-2 left-2 flex gap-1">
                        {isLocked ? (
                          <span className="flex items-center gap-1 text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded-md">
                            <Lock size={10} /> Locked
                          </span>
                        ) : item.is_inventory_only ? (
                          <span className="flex items-center gap-1 text-[10px] font-semibold bg-zinc-900 text-zinc-300 border border-zinc-700 px-2 py-0.5 rounded-md">
                            <EyeOff size={10} /> Private
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-md">
                            <Eye size={10} /> Public
                          </span>
                        )}
                      </div>

                      <span className="absolute bottom-2 right-2 text-[10px] bg-black/70 text-zinc-300 px-1.5 py-0.5 rounded backdrop-blur-sm">
                        ₱
                        {Number(item.estimated_value).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-semibold text-xs text-zinc-100 line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-zinc-400 capitalize mt-0.5">
                          {item.condition.replace("_", " ")}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800/80 gap-2">
                        {!isLocked ? (
                          <button
                            onClick={() => handleToggleVisibility(item)}
                            disabled={isActionLoading}
                            className="text-[11px] text-zinc-400 hover:text-zinc-100 transition py-1 px-2 rounded-md hover:bg-zinc-800/80"
                          >
                            {item.is_inventory_only
                              ? "Make Public"
                              : "Make Private"}
                          </button>
                        ) : (
                          <span className="text-[10px] text-amber-400">
                            Locked in trade
                          </span>
                        )}

                        {!isLocked && (
                          <button
                            onClick={() => handleArchive(item.id)}
                            disabled={isActionLoading}
                            className="p-1 text-zinc-500 hover:text-rose-400 rounded-md transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
