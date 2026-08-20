// src/components/profile/EditProfileModal.tsx
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { profileService } from "../../services/profileService";
import {
  X,
  Camera,
  User,
  MapPin,
  FileText,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, profile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [defaultMeetup, setDefaultMeetup] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile && isOpen) {
      setFullName(profile.full_name || "");
      setBio(profile.bio || "");
      setLocationCity(profile.location_city || "");
      setDefaultMeetup(profile.default_campus_meetup || "");
      setAvatarPreview(
        profile.avatar_url ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${profile.full_name || user?.email}`,
      );
      setAvatarFile(null);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [profile, isOpen, user]);

  if (!isOpen || !user) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg("Avatar image must be under 3MB");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg("Full name cannot be blank");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await profileService.updateProfile(
        user.id,
        {
          full_name: fullName,
          bio,
          location_city: locationCity,
          default_campus_meetup: defaultMeetup,
          avatarFile,
        },
        profile?.avatar_url,
      );

      await refreshProfile();
      setSuccessMsg("Profile updated successfully!");
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div>
            <h2 className="text-base font-bold text-zinc-100">Edit Profile</h2>
            <p className="text-xs text-zinc-400">
              Customize your student identity and trading preferences
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-800/50 rounded-xl">
              <Check size={15} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Avatar Selector */}
          <div className="flex items-center gap-4 py-1">
            <div className="relative group">
              <img
                src={avatarPreview}
                alt="Profile Preview"
                className="w-16 h-16 rounded-full object-cover bg-zinc-800 border-2 border-zinc-700 group-hover:opacity-80 transition"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition text-zinc-200"
                title="Upload new photo"
              >
                <Camera size={18} />
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-lg transition"
              >
                Change Photo
              </button>
              <p className="text-[10px] text-zinc-500 mt-1">
                PNG, JPG, or WebP up to 3MB
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Display Name
            </label>
            <div className="relative">
              <User
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Terrenze Josh"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          {/* Bio / Major */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Bio / Degree Program
            </label>
            <div className="relative">
              <FileText
                size={15}
                className="absolute left-3.5 top-3 text-zinc-500"
              />
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. 4th Year BSIT • Looking for mechanical keyboards & electronics"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          {/* Location & Preferred Campus Hub */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                City / Campus Area
              </label>
              <div className="relative">
                <MapPin
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="text"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  placeholder="e.g. Legazpi / Camalig"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Default Meetup Spot
              </label>
              <div className="relative">
                <ShieldCheck
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="text"
                  value={defaultMeetup}
                  onChange={(e) => setDefaultMeetup(e.target.value)}
                  placeholder="e.g. Main Library Lobby"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <span>{loading ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
