/**
 * 🔐 MFA CHALLENGE COMPONENT
 * 
 * MFA verification during login with:
 * - TOTP code entry
 * - Backup code support
 * - Remember device option
 * 
 * BlueDXP Platform - Enterprise Grade
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface MFAChallengeProps {
  onVerify: (code: string, rememberDevice: boolean) => Promise<boolean>;
  onCancel: () => void;
  onUseBackupCode: () => void;
  email?: string;
}

const MFAChallenge: React.FC<MFAChallengeProps> = ({
  onVerify,
  onCancel,
  onUseBackupCode,
  email,
}) => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberDevice, setRememberDevice] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Handle digit input
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError(null);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (value && index === 5 && newCode.every((d) => d)) {
      handleSubmit(newCode.join(""));
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split("");
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleSubmit(pastedData);
    }
  };

  // Submit verification
  const handleSubmit = async (fullCode?: string) => {
    const codeToVerify = fullCode || code.join("");
    
    if (codeToVerify.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await onVerify(codeToVerify, rememberDevice);
      
      if (!success) {
        setError("Invalid code. Please try again.");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#0a0f1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4">
            <i className="ri-shield-keyhole-line text-3xl text-cyan-400"></i>
          </div>
          <h2 className="text-xl font-bold text-white">
            Two-Factor Authentication
          </h2>
          <p className="text-sm text-[#9ca3af] mt-1">
            Enter the 6-digit code from your authenticator app
          </p>
          {email && (
            <p className="text-xs text-[#6b7280] mt-1">
              Signing in as {email}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Code Input */}
          <div className="flex justify-center gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                maxLength={1}
                disabled={isLoading}
                className={`w-12 h-14 text-center text-2xl font-mono bg-white/5 border rounded-xl text-white focus:outline-none transition-colors ${
                  error
                    ? "border-red-500"
                    : digit
                    ? "border-cyan-500"
                    : "border-white/10 focus:border-cyan-500"
                } disabled:opacity-50`}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-red-400 text-sm">
                <i className="ri-error-warning-line"></i>
                {error}
              </div>
            </div>
          )}

          {/* Remember Device */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-sm text-[#9ca3af]">
              Remember this device for 30 days
            </span>
          </label>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => handleSubmit()}
              disabled={isLoading || code.some((d) => !d)}
              className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  Verifying...
                </>
              ) : (
                <>
                  <i className="ri-shield-check-line"></i>
                  Verify
                </>
              )}
            </button>

            <div className="flex items-center gap-4 text-sm">
              <button
                onClick={onUseBackupCode}
                className="flex-1 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Use backup code
              </button>
              <span className="text-[#6b7280]">•</span>
              <button
                onClick={onCancel}
                className="flex-1 text-[#9ca3af] hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/5">
          <div className="flex items-start gap-3 text-xs text-[#9ca3af]">
            <i className="ri-question-line text-lg mt-0.5"></i>
            <div>
              <p className="font-medium text-white mb-1">Need help?</p>
              <p>
                Open your authenticator app (Google Authenticator, Authy, etc.)
                and enter the 6-digit code shown for BlueDXP.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MFAChallenge;
