/**
 * 🔑 RESET PASSWORD PAGE
 * 
 * Password reset confirmation:
 * - Token validation
 * - Strong password requirements
 * - Visual feedback
 * 
 * BlueDXP Platform - Enterprise Intelligence Operating System
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    // Validate token on mount
    if (!token) {
      setError("Invalid or missing reset token");
      setTokenValid(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/validate-reset-token?token=${token}`);
        if (response.ok) {
          setTokenValid(true);
        } else {
          setError("This reset link has expired or is invalid");
          setTokenValid(false);
        }
      } catch (err) {
        setError("Failed to validate reset link");
        setTokenValid(false);
      }
    };

    validateToken();
  }, [token]);

  // Password strength calculation
  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++;

    if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
    if (score <= 2) return { score, label: "Fair", color: "bg-orange-500" };
    if (score <= 3) return { score, label: "Good", color: "bg-yellow-500" };
    if (score <= 4) return { score, label: "Strong", color: "bg-green-500" };
    return { score, label: "Very Strong", color: "bg-emerald-500" };
  };

  const passwordStrength = getPasswordStrength(password);

  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Lowercase letter", met: /[a-z]/.test(password) },
    { label: "Number", met: /\d/.test(password) },
    { label: "Special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/login?success=Password reset successful. Please sign in.");
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to reset password");
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
          className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-gradient-to-r from-green-500/15 to-emerald-500/15 rounded-full blur-3xl"
          animate={{
            x: [0, 40, 0],
            y: [0, -25, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
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

          {/* Loading State */}
          {tokenValid === null && (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto border-3 border-white/20 border-t-[#05a4ff] rounded-full animate-spin mb-4"></div>
              <p className="text-[#9ca3af]">Validating reset link...</p>
            </div>
          )}

          {/* Invalid Token */}
          {tokenValid === false && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <i className="ri-close-circle-line text-4xl text-red-400"></i>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Link Expired</h2>
              <p className="text-[#9ca3af] text-sm mb-6">{error}</p>
              <Link
                href="/forgot-password"
                className="inline-block px-6 py-3 bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] text-white rounded-xl hover:opacity-90 transition-all font-medium"
              >
                Request New Link
              </Link>
            </motion.div>
          )}

          {/* Success State */}
          {isSuccess && (
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
                  <i className="ri-check-double-line text-4xl text-green-400"></i>
                </motion.div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Password Reset!</h2>
              <p className="text-[#9ca3af] text-sm mb-4">
                Your password has been successfully changed.
              </p>
              <p className="text-[#6b7280] text-sm">
                Redirecting to login...
              </p>
            </motion.div>
          )}

          {/* Reset Form */}
          {tokenValid && !isSuccess && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center">
                  <i className="ri-key-line text-3xl text-green-400"></i>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Create New Password</h1>
                <p className="text-[#9ca3af] text-sm">
                  Your new password must be different from previously used passwords.
                </p>
              </div>

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

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <i className="ri-lock-line absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7280]"></i>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-11 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#05a4ff]/50 focus:border-transparent transition-all"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white transition-colors"
                    >
                      <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
                    </button>
                  </div>

                  {/* Password Strength */}
                  {password && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                            className={`h-full ${passwordStrength.color} rounded-full`}
                          />
                        </div>
                        <span className={`text-xs font-medium ${passwordStrength.color.replace("bg-", "text-")}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {passwordRequirements.map((req, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs">
                            <i className={`${req.met ? "ri-check-line text-green-400" : "ri-close-line text-[#6b7280]"}`}></i>
                            <span className={req.met ? "text-green-400" : "text-[#6b7280]"}>{req.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <i className="ri-lock-line absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7280]"></i>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={`w-full pl-11 pr-12 py-3.5 bg-white/5 border rounded-xl text-white placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#05a4ff]/50 transition-all ${
                        confirmPassword && password !== confirmPassword
                          ? "border-red-500/50"
                          : confirmPassword && password === confirmPassword
                          ? "border-green-500/50"
                          : "border-white/10"
                      }`}
                      placeholder="Confirm new password"
                    />
                    {confirmPassword && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {password === confirmPassword ? (
                          <i className="ri-check-line text-green-400"></i>
                        ) : (
                          <i className="ri-close-line text-red-400"></i>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || password.length < 8 || password !== confirmPassword}
                  className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:opacity-90 transform hover:scale-[1.01] transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Resetting...
                    </span>
                  ) : (
                    <>
                      <i className="ri-key-line mr-2"></i>
                      Reset Password
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-white/20 border-t-[#05a4ff] rounded-full animate-spin"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
