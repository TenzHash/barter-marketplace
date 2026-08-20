// src/components/trades/MeetupSchedulerModal.tsx
import React, { useState } from "react";
import { tradeService } from "../../services/tradeService";
import {
  X,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface MeetupSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeId: string;
  currentUserId: string;
  onSuccess: () => void;
}

const CAMPUS_SAFE_ZONES = [
  {
    name: "University Main Library Lobby",
    note: "High foot-traffic & well-lit",
  },
  { name: "Student Union Building / Food Hall", note: "Central open area" },
  { name: "Main Campus Gate 1 Guard Post", note: "Monitored with security" },
  {
    name: "University Science & Tech Building Lobby",
    note: "Indoor monitored lobby",
  },
  { name: "Campus Gymnasium Entrance", note: "Open public outdoor area" },
];

export const MeetupSchedulerModal: React.FC<MeetupSchedulerModalProps> = ({
  isOpen,
  onClose,
  tradeId,
  currentUserId,
  onSuccess,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string>(
    CAMPUS_SAFE_ZONES[0].name,
  );
  const [customLocation, setCustomLocation] = useState<string>("");
  const [meetupDate, setMeetupDate] = useState<string>("");
  const [meetupTime, setMeetupTime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const locationToUse = customLocation.trim() || selectedLocation;
    if (!locationToUse) {
      setErrorMsg("Please choose or enter a campus meetup location.");
      return;
    }

    if (!meetupDate || !meetupTime) {
      setErrorMsg("Please specify both the date and time for the meetup.");
      return;
    }

    const scheduledIso = new Date(`${meetupDate}T${meetupTime}`).toISOString();

    setLoading(true);
    try {
      await tradeService.proposeMeetup(
        tradeId,
        currentUserId,
        locationToUse,
        scheduledIso,
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to schedule meetup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-zinc-100 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400">
            <MapPin size={16} />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100">
              Schedule Campus Meetup
            </h2>
            <p className="text-[11px] text-zinc-400">
              Coordinate a safe, public exchange location
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Recommended Campus Safe Zones
            </label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {CAMPUS_SAFE_ZONES.map((zone) => {
                const isSelected =
                  selectedLocation === zone.name && !customLocation;
                return (
                  <div
                    key={zone.name}
                    onClick={() => {
                      setSelectedLocation(zone.name);
                      setCustomLocation("");
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-950/30"
                        : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-zinc-200">
                        {zone.name}
                      </p>
                      <ShieldCheck
                        size={13}
                        className="text-emerald-400 shrink-0"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {zone.note}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Or Custom Campus Building / Room
            </label>
            <input
              type="text"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              placeholder="e.g. College of Science Computer Lab 3"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                <Calendar size={12} />
                <span>Meetup Date</span>
              </label>
              <input
                type="date"
                required
                value={meetupDate}
                onChange={(e) => setMeetupDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                <Clock size={12} />
                <span>Meetup Time</span>
              </label>
              <input
                type="time"
                required
                value={meetupTime}
                onChange={(e) => setMeetupTime(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            <span>{loading ? "Proposing..." : "Propose Meetup Point"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
