import React, { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  listingService,
  type CreateListingInput,
} from "../../services/listingService";
import type { ItemCondition, ListingMode } from "../../types/marketplace";
import {
  X,
  Upload,
  Trash2,
  Loader2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: "brand_new", label: "Brand New" },
  { value: "like_new", label: "Like New" },
  { value: "used_good", label: "Used - Good" },
  { value: "used_fair", label: "Used - Fair" },
  { value: "for_parts", label: "For Parts / Repair" },
];

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<ItemCondition>("used_good");
  const [mode, setMode] = useState<ListingMode>("cash_or_barter");
  const [cashPrice, setCashPrice] = useState<string>("");
  const [estimatedValue, setEstimatedValue] = useState<string>("");
  const [lookingFor, setLookingFor] = useState("");
  const [isInventoryOnly, setIsInventoryOnly] = useState(false);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);

    if (imageFiles.length + selected.length > 5) {
      setErrorMsg("You can upload a maximum of 5 images");
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of selected) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg(`File ${file.name} exceeds 5MB limit`);
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setImageFiles((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    setErrorMsg(null);
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg("You must be signed in to list an item");
      return;
    }

    if (imageFiles.length === 0) {
      setErrorMsg("Please upload at least one photo");
      return;
    }

    if (!estimatedValue || Number(estimatedValue) <= 0) {
      setErrorMsg("Please specify a fair trade benchmark value");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload: CreateListingInput = {
        title: title.trim(),
        description: description.trim(),
        condition,
        mode,
        cash_price: mode === "barter_only" ? null : Number(cashPrice),
        estimated_value: Number(estimatedValue),
        looking_for: lookingFor.trim() || null,
        is_inventory_only: isInventoryOnly,
        imageFiles,
      };

      await listingService.createListing(user.id, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div>
            <h2 className="text-base font-bold text-zinc-100">
              Create New Listing
            </h2>
            <p className="text-xs text-zinc-400">
              List for sale, direct barter, or add to private closet
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 max-h-[75vh] overflow-y-auto"
        >
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Photos (Max 5)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {imagePreviews.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border border-zinc-700 group"
                >
                  <img
                    src={url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-rose-600 text-white rounded-md transition"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

              {imageFiles.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square flex flex-col items-center justify-center border border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl bg-zinc-950 text-zinc-400 hover:text-zinc-200 transition"
                >
                  <Upload size={18} className="mb-1 text-zinc-500" />
                  <span className="text-[10px] font-medium">Upload</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Item name & model"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ItemCondition)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Exchange Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "cash_or_barter", label: "Sale or Trade" },
                { id: "barter_only", label: "Barter Only" },
                { id: "cash_only", label: "Cash Only" },
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setMode(m.id as ListingMode)}
                  className={`py-2 px-2 rounded-xl border text-xs font-semibold transition ${
                    mode === m.id
                      ? "border-zinc-200 bg-zinc-100 text-zinc-950"
                      : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                <span>Fair Trade Value (₱)</span>
                <span
                  title="Benchmark used for value balancing in trades"
                  className="cursor-help text-zinc-500"
                >
                  <HelpCircle size={12} />
                </span>
              </label>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="2500"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
              />
            </div>

            {mode !== "barter_only" && (
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Direct Buy Price (₱)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={cashPrice}
                  onChange={(e) => setCashPrice(e.target.value)}
                  placeholder="2500"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>
            )}
          </div>

          {mode !== "cash_only" && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Wishlist / Trade Preferences
              </label>
              <input
                type="text"
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                placeholder="e.g. Casio fx-991CW, Scientific Calculator, or Engineering Graph Paper"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe condition, specifications, campus meetup preferences..."
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl p-3 text-xs text-white outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="closetOnly"
              checked={isInventoryOnly}
              onChange={(e) => setIsInventoryOnly(e.target.checked)}
              className="rounded bg-zinc-950 border-zinc-800 text-zinc-100"
            />
            <label
              htmlFor="closetOnly"
              className="text-xs text-zinc-400 cursor-pointer"
            >
              Keep as private closet item (hide from public feed, but make
              selectable in trades)
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            <span>
              {loading ? "Uploading & Creating..." : "Publish Listing"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
