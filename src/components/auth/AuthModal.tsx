// src/components/auth/AuthModal.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  X,
  GraduationCap,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register" | "signin" | "signup" | "forgot_password";
}

type AuthMode = "signin" | "signup" | "forgot_password";

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = "login",
}) => {
  const getNormalizedMode = (mode: string): AuthMode => {
    if (mode === "register" || mode === "signup") return "signup";
    if (mode === "forgot_password") return "forgot_password";
    return "signin";
  };

  const [mode, setMode] = useState<AuthMode>(() =>
    getNormalizedMode(initialMode),
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync mode whenever initialMode prop updates
  useEffect(() => {
    if (initialMode) {
      setMode(getNormalizedMode(initialMode));
    }
  }, [initialMode]);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  const validateEduEmail = (emailStr: string): boolean => {
    const cleanEmail = emailStr.trim().toLowerCase();
    return cleanEmail.endsWith(".edu") || cleanEmail.includes(".edu.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    // 1. Campus .edu validation
    if (!validateEduEmail(cleanEmail)) {
      setErrorMessage(
        "A verified university student email (.edu or .edu.ph) is required.",
      );
      return;
    }

    // 2. Sign Up validations
    if (mode === "signup") {
      if (!fullName.trim()) {
        setErrorMessage("Please enter your full name.");
        return;
      }
      if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) throw error;

        if (data?.user?.identities?.length === 0) {
          setErrorMessage("An account with this student email already exists.");
        } else {
          setSuccessMessage(
            "Registration successful! Please check your university email for the confirmation link.",
          );
        }
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) throw error;

        onClose();
        resetForm();
      } else if (mode === "forgot_password") {
        const { error } = await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo: `${window.location.origin}/reset-password`,
          },
        );

        if (error) throw error;

        setSuccessMessage("Password reset link sent to your university email.");
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || "Authentication failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/80 flex items-start justify-between bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800/50 flex items-center justify-center text-blue-400">
              <GraduationCap size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                {mode === "signin" && "Welcome Back"}
                {mode === "signup" && "Create Student Account"}
                {mode === "forgot_password" && "Reset Password"}
              </h2>
              <p className="text-xs text-zinc-400">
                {mode === "signin" && "Access the campus barter exchange"}
                {mode === "signup" && "Connect with verified campus peers"}
                {mode === "forgot_password" &&
                  "Enter your .edu email to receive reset instructions"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 transition p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Alerts */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/50 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800/50 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Full Name (Sign Up only) */}
          {mode === "signup" && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase">
                Full Name
              </label>
              <div className="relative">
                <User
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Maria Santos"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 outline-none"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase">
                University Email
              </label>
              <span className="text-[10px] text-blue-400 flex items-center gap-1">
                <ShieldAlert size={10} /> .edu required
              </span>
            </div>
            <div className="relative">
              <Mail
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu.ph"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 outline-none"
              />
            </div>
          </div>

          {/* Password (Sign In & Sign Up only) */}
          {mode !== "forgot_password" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase">
                  Password
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => switchMode("forgot_password")}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 transition"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 outline-none"
                />
              </div>
            </div>
          )}

          {/* Confirm Password (Sign Up only) */}
          {mode === "signup" && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase">
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 outline-none"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                <span>
                  {mode === "signin" && "Sign In"}
                  {mode === "signup" && "Create Account"}
                  {mode === "forgot_password" && "Send Reset Link"}
                </span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </form>

        {/* Footer / Toggle Mode */}
        <div className="p-4 bg-zinc-950/80 border-t border-zinc-800/80 text-center text-xs text-zinc-400">
          {mode === "signin" && (
            <p>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="text-zinc-100 font-semibold hover:underline"
              >
                Sign up
              </button>
            </p>
          )}

          {mode === "signup" && (
            <p>
              Already verified?{" "}
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="text-zinc-100 font-semibold hover:underline"
              >
                Sign in
              </button>
            </p>
          )}

          {mode === "forgot_password" && (
            <p>
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="text-zinc-100 font-semibold hover:underline"
              >
                Back to Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
