/**
 * 🔐 WORLD-CLASS LOGIN PAGE
 * 
 * Inspired by OpenAI, Claude, and top platforms:
 * - OAuth (Google, Microsoft, LinkedIn, GitHub)
 * - Magic Link (Email-based passwordless)
 * - Authenticator Apps (TOTP)
 * - Traditional email/password
 * - Beautiful glassmorphic UI
 * 
 * BlueDXP Platform - Enterprise Intelligence Operating System
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type LoginMethod = "credentials" | "magic-link" | "authenticator";
type OAuthProvider = "google" | "microsoft" | "linkedin" | "github";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("credentials");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [authenticatorCode, setAuthenticatorCode] = useState("");
  const [showAuthenticatorInput, setShowAuthenticatorInput] = useState(false);
  
  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (user) {
      const returnUrl = searchParams.get("returnUrl") || "/dashboard";
      router.replace(returnUrl);
    }
  }, [user, router, searchParams]);

  // Check for error/success messages from URL
  useEffect(() => {
    const urlError = searchParams.get("error");
    const urlSuccess = searchParams.get("success");
    if (urlError) setError(decodeURIComponent(urlError));
    if (urlSuccess) setSuccess(decodeURIComponent(urlSuccess));
  }, [searchParams]);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
      setIsLoading(false);
    }
  };

  const handleMagicLinkRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMagicLinkSent(true);
        setSuccess("Check your email for a magic link to sign in!");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to send magic link");
      }
    } catch (err) {
      setError("Failed to send magic link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider: OAuthProvider) => {
    const returnUrl = searchParams.get("returnUrl") || "/dashboard";
    window.location.href = `/api/auth/oauth/${provider}?returnUrl=${encodeURIComponent(returnUrl)}`;
  };

  const handleAuthenticatorVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: authenticatorCode }),
      });

      if (response.ok) {
        router.replace("/dashboard");
      } else {
        const data = await response.json();
        setError(data.error || "Invalid code");
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const translations = {
    en: {
      title: "Welcome Back",
      subtitle: "Sign in to BlueDXP Platform",
      continueWith: "Continue with",
      orContinueWith: "or continue with",
      email: "Email Address",
      password: "Password",
      signIn: "Sign In",
      forgotPassword: "Forgot password?",
      noAccount: "Don't have an account?",
      contactSales: "Contact Sales",
      loading: "Signing in...",
      rememberMe: "Remember me for 30 days",
      magicLink: "Email me a login link",
      authenticator: "Use authenticator app",
      credentials: "Use password",
      sendMagicLink: "Send Magic Link",
      checkEmail: "Check your email",
      magicLinkSent: "We sent a login link to",
      enterCode: "Enter the 6-digit code from your authenticator app",
      verify: "Verify",
      backToLogin: "Back to login options",
      secureLogin: "Secure enterprise login",
      trustedBy: "Trusted by leading enterprises worldwide",
    },
    ar: {
      title: "مرحباً بعودتك",
      subtitle: "تسجيل الدخول إلى منصة BlueDXP",
      continueWith: "المتابعة مع",
      orContinueWith: "أو المتابعة مع",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      signIn: "تسجيل الدخول",
      forgotPassword: "نسيت كلمة المرور؟",
      noAccount: "ليس لديك حساب؟",
      contactSales: "تواصل مع المبيعات",
      loading: "جاري تسجيل الدخول...",
      rememberMe: "تذكرني لمدة 30 يوم",
      magicLink: "أرسل لي رابط تسجيل الدخول",
      authenticator: "استخدم تطبيق المصادقة",
      credentials: "استخدم كلمة المرور",
      sendMagicLink: "إرسال الرابط السحري",
      checkEmail: "تحقق من بريدك الإلكتروني",
      magicLinkSent: "أرسلنا رابط تسجيل الدخول إلى",
      enterCode: "أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة",
      verify: "تحقق",
      backToLogin: "العودة لخيارات تسجيل الدخول",
      secureLogin: "تسجيل دخول آمن للمؤسسات",
      trustedBy: "موثوق به من قبل المؤسسات الرائدة حول العالم",
    },
  };

  const t = translations[language];

  const oauthProviders: { id: OAuthProvider; name: string; icon: string; color: string; bgColor: string }[] = [
    { id: "google", name: "Google", icon: "ri-google-fill", color: "text-white", bgColor: "bg-[#4285F4] hover:bg-[#3367D6]" },
    { id: "microsoft", name: "Microsoft", icon: "ri-microsoft-fill", color: "text-white", bgColor: "bg-[#00A4EF] hover:bg-[#0078D4]" },
    { id: "linkedin", name: "LinkedIn", icon: "ri-linkedin-fill", color: "text-white", bgColor: "bg-[#0A66C2] hover:bg-[#004182]" },
    { id: "github", name: "GitHub", icon: "ri-github-fill", color: "text-white", bgColor: "bg-[#333] hover:bg-[#24292e]" },
  ];

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f1419] to-[#0a0e14] flex"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-[#05a4ff]/20 to-[#00d4a8]/20 rounded-full blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-r from-[#8b5cf6]/20 to-[#ec4899]/20 rounded-full blur-3xl"
            animate={{
              x: [0, -50, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Logo */}
            <div className="mb-12">
              <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#05a4ff] to-[#00d4a8] rounded-xl flex items-center justify-center">
                  <i className="ri-dashboard-3-line text-2xl text-white"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">BlueDXP</h2>
                  <p className="text-xs text-[#9ca3af]">Enterprise Platform</p>
                </div>
              </div>
            </div>

            {/* Hero Text */}
            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
              Enterprise Intelligence
              <span className="block bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] bg-clip-text text-transparent">
                Operating System
              </span>
            </h1>
            <p className="text-lg text-[#9ca3af] mb-8 max-w-md">
              Unified platform for WMS, TMS, Finance, CRM, QHSE, and more. 
              Powered by AI. Built for the future.
            </p>

            {/* Trust Indicators */}
            <div className="space-y-4">
              <p className="text-sm text-[#6b7280]">{t.trustedBy}</p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-[#9ca3af]">
                  <i className="ri-shield-check-line text-green-400"></i>
                  <span className="text-sm">SOC 2 Certified</span>
                </div>
                <div className="flex items-center gap-2 text-[#9ca3af]">
                  <i className="ri-lock-line text-blue-400"></i>
                  <span className="text-sm">256-bit Encryption</span>
                </div>
                <div className="flex items-center gap-2 text-[#9ca3af]">
                  <i className="ri-global-line text-purple-400"></i>
                  <span className="text-sm">GDPR Compliant</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        {/* Language Toggle - Mobile */}
        <div className="fixed top-4 right-4 flex gap-2 z-50 lg:hidden">
          <button
            onClick={() => setLanguage("en")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              language === "en"
                ? "bg-[#05a4ff] text-white"
                : "bg-white/5 text-[#9ca3af] border border-white/10"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("ar")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              language === "ar"
                ? "bg-[#05a4ff] text-white"
                : "bg-white/5 text-[#9ca3af] border border-white/10"
            }`}
          >
            العربية
          </button>
        </div>

        {/* Language Toggle - Desktop */}
        <div className="hidden lg:flex fixed top-6 right-6 gap-2 z-50">
          <button
            onClick={() => setLanguage("en")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              language === "en"
                ? "bg-[#05a4ff] text-white"
                : "bg-white/5 text-[#9ca3af] hover:bg-white/10 border border-white/10"
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage("ar")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              language === "ar"
                ? "bg-[#05a4ff] text-white"
                : "bg-white/5 text-[#9ca3af] hover:bg-white/10 border border-white/10"
            }`}
          >
            العربية
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#05a4ff] to-[#00d4a8] rounded-lg flex items-center justify-center">
                <i className="ri-dashboard-3-line text-xl text-white"></i>
              </div>
              <span className="text-lg font-bold text-white">BlueDXP</span>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">{t.title}</h1>
              <p className="text-[#9ca3af] text-sm">{t.subtitle}</p>
            </div>

            {/* Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3"
                >
                  <i className="ri-error-warning-line text-red-400 text-lg mt-0.5"></i>
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3"
                >
                  <i className="ri-checkbox-circle-line text-green-400 text-lg mt-0.5"></i>
                  <p className="text-sm text-green-400">{success}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Magic Link Sent State */}
            {magicLinkSent ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#05a4ff]/20 to-[#00d4a8]/20 rounded-full flex items-center justify-center">
                  <i className="ri-mail-send-line text-3xl text-[#05a4ff]"></i>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{t.checkEmail}</h3>
                <p className="text-[#9ca3af] text-sm mb-6">
                  {t.magicLinkSent} <span className="text-white font-medium">{email}</span>
                </p>
                <button
                  onClick={() => {
                    setMagicLinkSent(false);
                    setLoginMethod("credentials");
                  }}
                  className="text-[#05a4ff] text-sm hover:underline"
                >
                  {t.backToLogin}
                </button>
              </motion.div>
            ) : showAuthenticatorInput ? (
              /* Authenticator Input */
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <form onSubmit={handleAuthenticatorVerify} className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                      <i className="ri-smartphone-line text-3xl text-purple-400"></i>
                    </div>
                    <p className="text-[#9ca3af] text-sm">{t.enterCode}</p>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={authenticatorCode}
                      onChange={(e) => setAuthenticatorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-center text-2xl tracking-[0.5em] font-mono placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#05a4ff]/50 focus:border-transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || authenticatorCode.length !== 6}
                    className="w-full py-3.5 bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? t.loading : t.verify}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAuthenticatorInput(false)}
                    className="w-full text-[#9ca3af] text-sm hover:text-white transition-colors"
                  >
                    {t.backToLogin}
                  </button>
                </form>
              </motion.div>
            ) : (
              /* Main Login Options */
              <>
                {/* OAuth Providers - Hidden until configured */}
                {process.env.NEXT_PUBLIC_OAUTH_ENABLED === "true" && (
                  <>
                    <div className="space-y-3 mb-6">
                      <p className="text-xs text-[#6b7280] text-center mb-4">{t.continueWith}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {oauthProviders.map((provider) => (
                          <button
                            key={provider.id}
                            onClick={() => handleOAuthLogin(provider.id)}
                            className={`flex items-center justify-center gap-2 px-4 py-3 ${provider.bgColor} rounded-xl text-sm font-medium transition-all transform hover:scale-[1.02]`}
                          >
                            <i className={`${provider.icon} text-lg ${provider.color}`}></i>
                            <span className={provider.color}>{provider.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-4 bg-[#0f1419] text-[#6b7280]">{t.orContinueWith}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Login Method Tabs */}
                {process.env.NEXT_PUBLIC_ADVANCED_AUTH_ENABLED === "true" ? (
                  <div className="flex bg-white/5 rounded-lg p-1 mb-6">
                    <button
                      onClick={() => setLoginMethod("credentials")}
                      className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                        loginMethod === "credentials"
                          ? "bg-white/10 text-white"
                          : "text-[#9ca3af] hover:text-white"
                      }`}
                    >
                      <i className="ri-lock-password-line mr-1.5"></i>
                      {t.credentials}
                    </button>
                    <button
                      onClick={() => setLoginMethod("magic-link")}
                      className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                        loginMethod === "magic-link"
                          ? "bg-white/10 text-white"
                          : "text-[#9ca3af] hover:text-white"
                      }`}
                    >
                      <i className="ri-mail-line mr-1.5"></i>
                      {t.magicLink}
                    </button>
                    <button
                      onClick={() => setLoginMethod("authenticator")}
                      className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                        loginMethod === "authenticator"
                          ? "bg-white/10 text-white"
                          : "text-[#9ca3af] hover:text-white"
                      }`}
                    >
                      <i className="ri-smartphone-line mr-1.5"></i>
                      {t.authenticator}
                    </button>
                  </div>
                ) : null}

                {/* Forms */}
                <AnimatePresence mode="wait">
                  {loginMethod === "credentials" && (
                    <motion.form
                      key="credentials"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onSubmit={handleCredentialsLogin}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                          {t.email}
                        </label>
                        <div className="relative">
                          <i className="ri-mail-line absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7280]"></i>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#05a4ff]/50 focus:border-transparent transition-all"
                            placeholder="you@company.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                          {t.password}
                        </label>
                        <div className="relative">
                          <i className="ri-lock-line absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7280]"></i>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#05a4ff]/50 focus:border-transparent transition-all"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white transition-colors"
                          >
                            <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#05a4ff] focus:ring-[#05a4ff]/50"
                          />
                          <span className="text-[#9ca3af]">{t.rememberMe}</span>
                        </label>
                        <Link
                          href="/forgot-password"
                          className="text-[#05a4ff] hover:text-[#00d4a8] transition-colors"
                        >
                          {t.forgotPassword}
                        </Link>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] text-white font-semibold rounded-xl hover:opacity-90 transform hover:scale-[1.01] transition-all shadow-lg shadow-[#05a4ff]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            {t.loading}
                          </span>
                        ) : (
                          t.signIn
                        )}
                      </button>
                    </motion.form>
                  )}

                  {loginMethod === "magic-link" && (
                    <motion.form
                      key="magic-link"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onSubmit={handleMagicLinkRequest}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                          {t.email}
                        </label>
                        <div className="relative">
                          <i className="ri-mail-line absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7280]"></i>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#05a4ff]/50 focus:border-transparent transition-all"
                            placeholder="you@company.com"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 transform hover:scale-[1.01] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Sending...
                          </span>
                        ) : (
                          <>
                            <i className="ri-magic-line mr-2"></i>
                            {t.sendMagicLink}
                          </>
                        )}
                      </button>
                    </motion.form>
                  )}

                  {loginMethod === "authenticator" && (
                    <motion.form
                      key="authenticator"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (email) setShowAuthenticatorInput(true);
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                          {t.email}
                        </label>
                        <div className="relative">
                          <i className="ri-mail-line absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7280]"></i>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#05a4ff]/50 focus:border-transparent transition-all"
                            placeholder="you@company.com"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!email}
                        className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:opacity-90 transform hover:scale-[1.01] transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className="ri-smartphone-line mr-2"></i>
                        Continue with Authenticator
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-[#6b7280]">
              {t.noAccount}{" "}
              <Link href="/contact" className="text-[#05a4ff] hover:text-[#00d4a8] transition-colors font-medium">
                {t.contactSales}
              </Link>
            </p>
            <Link
              href="/landing"
              className="text-sm text-[#6b7280] hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <i className="ri-arrow-left-line"></i>
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
