/**
 * ✉️ EMAIL VERIFICATION PAGE
 * 
 * Email verification flow:
 * - Token validation
 * - Success animation
 * - Resend functionality
 * 
 * BlueDXP Platform - Enterprise Intelligence Operating System
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

function VerifyEmailContent() {
  const [status, setStatus] = useState<"verifying" | "success" | "error" | "expired">("verifying");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setEmail(data.email || "");
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/login?success=Email verified successfully. You can now sign in.");
          }, 3000);
        } else {
          setStatus(data.expired ? "expired" : "error");
          setEmail(data.email || "");
        }
      } catch (err) {
        setStatus("error");
      }
    };

    verifyEmail();
  }, [token, router]);

  const handleResend = async () => {
    if (!email || resending) return;
    
    setResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResent(true);
      }
    } catch (err) {
      console.error("Failed to resend:", err);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f1419] to-[#0a0e14] flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-gradient-to-r from-[#05a4ff]/15 to-[#00d4a8]/15 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
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

          {/* Verifying State */}
          {status === "verifying" && (
            <div className="text-center py-12">
              <motion.div
                className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-[#05a4ff]/20 border-t-[#05a4ff]"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <h2 className="text-xl font-bold text-white mb-2">Verifying Email</h2>
              <p className="text-[#9ca3af] text-sm">Please wait while we verify your email address...</p>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <i className="ri-checkbox-circle-line text-5xl text-green-400"></i>
                </motion.div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Email Verified!</h2>
              <p className="text-[#9ca3af] text-sm mb-6">
                Your email has been successfully verified. You can now access all features.
              </p>
              <div className="flex items-center justify-center gap-2 text-[#6b7280] text-sm">
                <div className="w-4 h-4 border-2 border-[#6b7280] border-t-transparent rounded-full animate-spin"></div>
                Redirecting to login...
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {status === "error" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <i className="ri-close-circle-line text-4xl text-red-400"></i>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Verification Failed</h2>
              <p className="text-[#9ca3af] text-sm mb-6">
                The verification link is invalid or has already been used.
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] text-white rounded-xl hover:opacity-90 transition-all font-medium"
              >
                Go to Login
              </Link>
            </motion.div>
          )}

          {/* Expired State */}
          {status === "expired" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-500/20 rounded-full flex items-center justify-center">
                <i className="ri-time-line text-4xl text-orange-400"></i>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Link Expired</h2>
              <p className="text-[#9ca3af] text-sm mb-6">
                This verification link has expired. Request a new one below.
              </p>

              {resent ? (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <i className="ri-check-line text-green-400 mr-2"></i>
                  <span className="text-green-400 text-sm">New verification email sent!</span>
                </div>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending || !email}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] text-white rounded-xl hover:opacity-90 transition-all font-medium disabled:opacity-50"
                >
                  {resending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="ri-mail-send-line"></i>
                      Resend Verification Email
                    </>
                  )}
                </button>
              )}
            </motion.div>
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-white/20 border-t-[#05a4ff] rounded-full animate-spin"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
