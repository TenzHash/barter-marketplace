import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { isStudentEmail } from "../../lib/studentValidation";
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  Loader2,
  GraduationCap,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = "login",
}) => {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const switchMode = (newMode: "login" | "register") => {
    resetForm();
    setMode(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
        onClose();
      } else {
        if (!fullName.trim()) {
          throw new Error("Please enter your full name");
        }

        if (!isStudentEmail(email)) {
          throw new Error(
            "Must use a valid institutional student email (.edu, .edu.ph, .ac.*)",
          );
        }

        const { error } = await signUpWithEmail(
          email,
          password,
          fullName.trim(),
        );
        if (error) throw error;
        setSuccessMsg(
          "Account registered! Please check your student inbox to verify.",
        );
        setTimeout(() => onClose(), 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 text-zinc-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white transition"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold tracking-tight">
            {mode === "login" ? "Student Sign In" : "Join Campus Barter"}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {mode === "login"
              ? "Access your inventory and campus trade proposals"
              : "Verified peer-to-peer exchange for university students"}
          </p>
        </div>

        <div className="flex bg-zinc-950 p-1 rounded-xl mb-4 border border-zinc-800">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              mode === "login"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              mode === "register"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Register
          </button>
        </div>

        {mode === "register" && (
          <div className="mb-4 flex items-center gap-2 p-2.5 bg-blue-950/40 border border-blue-800/40 rounded-xl text-[11px] text-blue-300">
            <GraduationCap size={15} className="shrink-0 text-blue-400" />
            <span>
              Registration is restricted to verified student emails (e.g.{" "}
              <strong>.edu</strong> or <strong>.edu.ph</strong>).
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Terrenze Josh"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              University Email Address
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@bicol-u.edu.ph"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            <span>
              {mode === "login" ? "Sign In" : "Create Student Account"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
