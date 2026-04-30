/**
 * 🔓 FORGOT PASSWORD PAGE
 * 
 * Beautiful password recovery flow:
 * - Email-based reset link
 * - Clear instructions
 * - Accessible design
 * 
 * BlueDXP Platform - Enterprise Intelligence Operating System
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to send reset link");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f1419] to-[#0a0e14] flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-gradient-to-r from-[#05a4ff]/15 to-[#00d4a8]/15 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 20, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/login" className="inline-block">
              <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#05a4ff] to-[#00d4a8] rounded-lg flex items-center justify-center">
                  <i className="ri-dashboard-3-line text-xl text-white"></i>
                </div>
                <span className="text-lg font-bold text-white">BlueDXP</span>
              </div>
            </Link>
          </div>

          {isSubmitted ? (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <i className="ri-mail-check-line text-4xl text-green-400"></i>
                </motion.div>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3">Check your email</h2>
              <p className="text-[#9ca3af] text-sm mb-2">
                We've sent a password reset link to:
              </p>
              <p className="text-white font-medium mb-6">{email}</p>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <i className="ri-information-line text-blue-400 text-lg mt-0.5"></i>
                  <div className="text-left">
                    <p className="text-sm text-blue-300 font-medium mb-1">Didn't receive the email?</p>
                    <ul className="text-xs text-blue-400/80 space-y-1">
                      <li>• Check your spam or junk folder</li>
                      <li>• Verify you entered the correct email</li>
                      <li>• Wait a few minutes and try again</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail("");
                  }}
                  className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-medium"
                >
                  Try a different email
                </button>
                <Link
                  href="/login"
                  className="block w-full py-3 bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] text-white rounded-xl hover:opacity-90 transition-all font-medium text-center"
                >
                  Back to Sign In
                </Link>
              </div>
            </motion.div>
          ) : (
            /* Form State */
            <>
              {/* Icon */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#05a4ff]/20 to-[#00d4a8]/20 rounded-full flex items-center justify-center">
                  <i className="ri-lock-unlock-line text-3xl text-[#05a4ff]"></i>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Forgot Password?</h1>
                <p className="text-[#9ca3af] text-sm">
                  No worries! Enter your email and we'll send you a reset link.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3"
                >
                  <i className="ri-error-warning-line text-red-400 text-lg mt-0.5"></i>
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <i className="ri-mail-line absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7280]"></i>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#05a4ff]/50 focus:border-transparent transition-all"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] text-white font-semibold rounded-xl hover:opacity-90 transform hover:scale-[1.01] transition-all shadow-lg shadow-[#05a4ff]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending...
                    </span>
                  ) : (
                    <>
                      <i className="ri-mail-send-line mr-2"></i>
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-[#9ca3af] hover:text-white transition-colors inline-flex items-center gap-2"
          >
            <i className="ri-arrow-left-line"></i>
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
