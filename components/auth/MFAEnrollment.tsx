/**
 * 🔐 MFA ENROLLMENT COMPONENT
 * 
 * Complete MFA setup experience with:
 * - QR code display
 * - Manual secret entry
 * - Code verification
 * - Backup codes display
 * 
 * BlueDXP Platform - Enterprise Grade
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

interface MFAEnrollmentProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface SetupData {
  qrCodeUrl: string;
  secretBase32: string;
  backupCodes: string[];
  issuer: string;
  accountName: string;
}

type Step = "intro" | "scan" | "verify" | "backup" | "complete";

const MFAEnrollment: React.FC<MFAEnrollmentProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<Step>("intro");
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  // Start MFA setup
  const initializeSetup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/mfa/setup", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to initialize MFA");
      }

      setSetupData(result.data);
      setStep("scan");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify code and enable MFA
  const verifyAndEnable = async () => {
    if (!setupData || verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: verificationCode,
          secretBase32: setupData.secretBase32,
          action: "enable",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Verification failed");
      }

      setStep("backup");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy backup codes to clipboard
  const copyBackupCodes = () => {
    if (setupData) {
      const codesText = setupData.backupCodes.join("\n");
      navigator.clipboard.writeText(codesText);
      setCopiedBackupCodes(true);
      setTimeout(() => setCopiedBackupCodes(false), 2000);
    }
  };

  // Handle code input
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setVerificationCode(value);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-[#0a0f1a] border border-white/10 rounded-2xl shadow-2xl my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <i className="ri-shield-keyhole-line text-xl text-white"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Setup Two-Factor Authentication
              </h2>
              <p className="text-xs text-[#9ca3af]">
                Add an extra layer of security
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#9ca3af] hover:text-white hover:bg-white/10 transition-colors"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-3 border-b border-white/10 flex items-center gap-2">
          {["intro", "scan", "verify", "backup", "complete"].map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s
                    ? "bg-green-500 text-white"
                    : ["intro", "scan", "verify", "backup", "complete"].indexOf(step) > i
                    ? "bg-green-500/20 text-green-400"
                    : "bg-white/5 text-[#6b7280]"
                }`}
              >
                {["intro", "scan", "verify", "backup", "complete"].indexOf(step) > i ? (
                  <i className="ri-check-line"></i>
                ) : (
                  i + 1
                )}
              </div>
              {i < 4 && (
                <div
                  className={`flex-1 h-0.5 ${
                    ["intro", "scan", "verify", "backup", "complete"].indexOf(step) > i
                      ? "bg-green-500"
                      : "bg-white/10"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Introduction */}
            {step === "intro" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center space-y-6"
              >
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <i className="ri-smartphone-line text-4xl text-green-400"></i>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Protect Your Account
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    Two-factor authentication adds an extra layer of security by requiring
                    a verification code from your phone in addition to your password.
                  </p>
                </div>
                <div className="space-y-2 text-left bg-white/5 p-4 rounded-xl">
                  <div className="flex items-center gap-3 text-sm">
                    <i className="ri-check-line text-green-400"></i>
                    <span className="text-[#9ca3af]">Use Google Authenticator, Authy, or similar app</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <i className="ri-check-line text-green-400"></i>
                    <span className="text-[#9ca3af]">Get 10 backup codes for emergencies</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <i className="ri-check-line text-green-400"></i>
                    <span className="text-[#9ca3af]">Protect against unauthorized access</span>
                  </div>
                </div>
                <button
                  onClick={initializeSetup}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      Setting up...
                    </>
                  ) : (
                    <>
                      <i className="ri-shield-check-line"></i>
                      Get Started
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* Step 2: Scan QR Code */}
            {step === "scan" && setupData && (
              <motion.div
                key="scan"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Scan QR Code
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    Open your authenticator app and scan this QR code
                  </p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-xl">
                    <QRCodeSVG
                      value={setupData.qrCodeUrl}
                      size={200}
                      level="M"
                    />
                  </div>
                </div>

                {/* Manual Entry */}
                <div className="space-y-2">
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                  >
                    <i className={`ri-${showSecret ? "eye-off" : "eye"}-line`}></i>
                    {showSecret ? "Hide" : "Show"} manual entry key
                  </button>
                  
                  {showSecret && (
                    <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                      <div className="text-xs text-[#9ca3af] mb-1">Secret Key:</div>
                      <div className="font-mono text-sm text-white break-all">
                        {setupData.secretBase32}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setStep("verify")}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-colors"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* Step 3: Verify Code */}
            {step === "verify" && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Verify Setup
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>

                {/* Code Input */}
                <div className="flex justify-center">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={handleCodeChange}
                    placeholder="000000"
                    maxLength={6}
                    className="w-48 text-center text-3xl font-mono tracking-widest bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#6b7280] focus:outline-none focus:border-green-500"
                    autoFocus
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

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("scan")}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={verifyAndEnable}
                    disabled={isLoading || verificationCode.length !== 6}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <i className="ri-loader-4-line animate-spin"></i>
                        Verifying...
                      </>
                    ) : (
                      "Verify & Enable"
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Backup Codes */}
            {step === "backup" && setupData && (
              <motion.div
                key="backup"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-yellow-500/20 flex items-center justify-center mb-4">
                    <i className="ri-key-2-line text-3xl text-yellow-400"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Save Your Backup Codes
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    If you lose access to your authenticator app, you can use these codes to sign in.
                    Each code can only be used once.
                  </p>
                </div>

                {/* Backup Codes Grid */}
                <div className="grid grid-cols-2 gap-2 p-4 bg-white/5 border border-white/10 rounded-xl">
                  {setupData.backupCodes.map((code, i) => (
                    <div
                      key={i}
                      className="font-mono text-sm text-white bg-black/20 px-3 py-2 rounded text-center"
                    >
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyBackupCodes}
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <i className={copiedBackupCodes ? "ri-check-line" : "ri-file-copy-line"}></i>
                    {copiedBackupCodes ? "Copied!" : "Copy Codes"}
                  </button>
                  <button
                    onClick={() => {
                      const codesText = setupData.backupCodes.join("\n");
                      const blob = new Blob([codesText], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "bluedxp-backup-codes.txt";
                      a.click();
                    }}
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="ri-download-line"></i>
                    Download
                  </button>
                </div>

                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-start gap-2 text-yellow-400 text-sm">
                    <i className="ri-alert-line mt-0.5"></i>
                    <span>
                      Store these codes in a safe place. They will not be shown again!
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setStep("complete")}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-colors"
                >
                  I've Saved My Codes
                </button>
              </motion.div>
            )}

            {/* Step 5: Complete */}
            {step === "complete" && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center space-y-6"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                  <i className="ri-check-line text-4xl text-green-400"></i>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Two-Factor Authentication Enabled!
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    Your account is now protected with an additional layer of security.
                    You'll need to enter a code from your authenticator app when signing in.
                  </p>
                </div>
                <button
                  onClick={onComplete}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-colors"
                >
                  Done
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default MFAEnrollment;
