/**
 * 🔐 PASSWORD RESET FORM COMPONENT
 * 
 * Self-service password reset with:
 * - Request form
 * - Token validation
 * - New password form
 * - Strength validation
 * 
 * BlueDXP Platform - Enterprise Grade
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PasswordStrengthMeter from "./PasswordStrengthMeter";

interface PasswordResetFormProps {
  token?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type Step = "request" | "sent" | "reset" | "success";

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  token,
  onSuccess,
  onCancel,
}) => {
  const [step, setStep] = useState<Step>(token ? "reset" : "request");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Request password reset
  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setStep("sent");
      } else {
        setError(result.message || "Failed to send reset email");
      }
    } catch (err) {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password with token
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/password-reset/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: newPassword }),
      });

      const result = await response.json();

      if (result.success) {
        setStep("success");
        onSuccess?.();
      } else {
        setError(result.message || "Failed to reset password");
      }
    } catch (err) {
      setError("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {/* Request Step */}
        {step === "request" && (
          <motion.div
            key="request"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-4">
                <i className="ri-lock-password-line text-3xl text-cyan-400"></i>
              </div>
              <h2 className="text-2xl font-bold text-white">Forgot Password?</h2>
              <p className="text-sm text-[#9ca3af] mt-2">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <i className="ri-error-warning-line"></i>
                    {error}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="ri-mail-send-line"></i>
                    Send Reset Link
                  </>
                )}
              </button>

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors"
                >
                  Back to Login
                </button>
              )}
            </form>
          </motion.div>
        )}

        {/* Email Sent Step */}
        {step === "sent" && (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-6">
              <i className="ri-mail-check-line text-4xl text-green-400"></i>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-[#9ca3af] mb-6">
              We've sent a password reset link to<br />
              <span className="text-white font-medium">{email}</span>
            </p>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-left text-sm text-[#9ca3af] space-y-2">
              <p className="flex items-center gap-2">
                <i className="ri-time-line text-cyan-400"></i>
                Link expires in 1 hour
              </p>
              <p className="flex items-center gap-2">
                <i className="ri-spam-line text-cyan-400"></i>
                Check your spam folder if you don't see it
              </p>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="mt-6 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Back to Login
              </button>
            )}
          </motion.div>
        )}

        {/* Reset Password Step */}
        {step === "reset" && (
          <motion.div
            key="reset"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/20 flex items-center justify-center mb-4">
                <i className="ri-lock-unlock-line text-3xl text-green-400"></i>
              </div>
              <h2 className="text-2xl font-bold text-white">Create New Password</h2>
              <p className="text-sm text-[#9ca3af] mt-2">
                Enter your new password below
              </p>
            </div>

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#6b7280] focus:outline-none focus:border-green-500 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white"
                  >
                    <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
                  </button>
                </div>
              </div>

              <PasswordStrengthMeter password={newPassword} />

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-[#6b7280] focus:outline-none ${
                    confirmPassword && confirmPassword !== newPassword
                      ? "border-red-500"
                      : confirmPassword && confirmPassword === newPassword
                      ? "border-green-500"
                      : "border-white/10 focus:border-green-500"
                  }`}
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <i className="ri-error-warning-line"></i>
                    {error}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || newPassword !== confirmPassword}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Resetting...
                  </>
                ) : (
                  <>
                    <i className="ri-check-line"></i>
                    Reset Password
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* Success Step */}
        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-6">
              <i className="ri-check-double-line text-4xl text-green-400"></i>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Password Reset!</h2>
            <p className="text-[#9ca3af] mb-6">
              Your password has been successfully reset.<br />
              You can now sign in with your new password.
            </p>
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-colors"
            >
              Sign In
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PasswordResetForm;
