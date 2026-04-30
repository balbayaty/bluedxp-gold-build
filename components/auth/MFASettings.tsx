/**
 * 🔐 MFA SETTINGS COMPONENT
 * 
 * Manage MFA settings in user profile:
 * - Enable/disable MFA
 * - Regenerate backup codes
 * - View status
 * 
 * BlueDXP Platform - Enterprise Grade
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import MFAEnrollment from "./MFAEnrollment";
import { MFAStatus } from "@/lib/services/auth/mfaService";

interface MFASettingsProps {
  userId: string;
}

const MFASettings: React.FC<MFASettingsProps> = ({ userId }) => {
  const [status, setStatus] = useState<MFAStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [newBackupCodes, setNewBackupCodes] = useState<string[] | null>(null);
  const [disableCode, setDisableCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch MFA status
  useEffect(() => {
    fetchStatus();
  }, [userId]);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/mfa/setup");
      const result = await response.json();
      
      if (result.success) {
        setStatus(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch MFA status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Disable MFA
  const handleDisable = async () => {
    try {
      setError(null);
      const response = await fetch("/api/auth/mfa/verify", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: disableCode }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      setShowDisableConfirm(false);
      setDisableCode("");
      fetchStatus();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Regenerate backup codes
  const handleRegenerate = async () => {
    try {
      const response = await fetch("/api/auth/mfa/backup-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (result.success) {
        setNewBackupCodes(result.backupCodes);
        setShowRegenerateConfirm(false);
      }
    } catch (err) {
      console.error("Failed to regenerate backup codes:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-white/10"></div>
          <div className="flex-1">
            <div className="h-4 w-48 bg-white/10 rounded mb-2"></div>
            <div className="h-3 w-32 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* MFA Status Card */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                status?.enabled
                  ? "bg-green-500/20"
                  : "bg-yellow-500/20"
              }`}
            >
              <i
                className={`text-2xl ${
                  status?.enabled
                    ? "ri-shield-check-line text-green-400"
                    : "ri-shield-line text-yellow-400"
                }`}
              ></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-[#9ca3af] mt-1">
                {status?.enabled
                  ? "Your account is protected with 2FA"
                  : "Add an extra layer of security to your account"}
              </p>
              
              {status?.enabled && (
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
                    <i className="ri-smartphone-line"></i>
                    <span>Authenticator App</span>
                  </div>
                  {status.enrolledAt && (
                    <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
                      <i className="ri-calendar-line"></i>
                      <span>
                        Enabled {new Date(status.enrolledAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
                    <i className="ri-key-2-line"></i>
                    <span>{status.backupCodesRemaining} backup codes remaining</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            {status?.enabled ? (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-medium">
                Enabled
              </span>
            ) : (
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-medium">
                Not Enabled
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/10">
          {status?.enabled ? (
            <>
              <button
                onClick={() => setShowRegenerateConfirm(true)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
              >
                <i className="ri-refresh-line mr-2"></i>
                Regenerate Backup Codes
              </button>
              <button
                onClick={() => setShowDisableConfirm(true)}
                className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <i className="ri-shield-cross-line mr-2"></i>
                Disable 2FA
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowEnrollment(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-600 transition-colors"
            >
              <i className="ri-shield-check-line mr-2"></i>
              Enable Two-Factor Authentication
            </button>
          )}
        </div>
      </div>

      {/* Security Recommendations */}
      {!status?.enabled && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <i className="ri-lightbulb-line text-yellow-400 text-xl mt-0.5"></i>
            <div>
              <p className="text-sm text-yellow-300 font-medium">
                We strongly recommend enabling 2FA
              </p>
              <p className="text-xs text-yellow-400 mt-1">
                Two-factor authentication adds an extra layer of security to your account.
                Even if someone gets your password, they won't be able to access your account
                without the code from your phone.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Low Backup Codes Warning */}
      {status?.enabled && status.backupCodesRemaining < 3 && (
        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <i className="ri-alert-line text-orange-400 text-xl mt-0.5"></i>
            <div>
              <p className="text-sm text-orange-300 font-medium">
                Low backup codes remaining
              </p>
              <p className="text-xs text-orange-400 mt-1">
                You only have {status.backupCodesRemaining} backup code(s) left.
                Consider regenerating new codes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enrollment Modal */}
      {showEnrollment && (
        <MFAEnrollment
          onComplete={() => {
            setShowEnrollment(false);
            fetchStatus();
          }}
          onCancel={() => setShowEnrollment(false)}
        />
      )}

      {/* Disable Confirmation */}
      <Modal
        isOpen={showDisableConfirm}
        onClose={() => {
          setShowDisableConfirm(false);
          setDisableCode("");
          setError(null);
        }}
        title="Disable Two-Factor Authentication"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start gap-2 text-red-400 text-sm">
              <i className="ri-error-warning-line mt-0.5"></i>
              <span>
                Disabling 2FA will make your account less secure. 
                You'll need to enter your current 2FA code to confirm.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Enter your current 2FA code
            </label>
            <input
              type="text"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full text-center text-2xl font-mono tracking-widest bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-[#6b7280] focus:outline-none focus:border-red-500"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowDisableConfirm(false);
                setDisableCode("");
                setError(null);
              }}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDisable}
              disabled={disableCode.length !== 6}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              Disable 2FA
            </button>
          </div>
        </div>
      </Modal>

      {/* Regenerate Confirmation */}
      <ConfirmDialog
        isOpen={showRegenerateConfirm}
        onClose={() => setShowRegenerateConfirm(false)}
        onConfirm={handleRegenerate}
        title="Regenerate Backup Codes"
        message="This will invalidate all your existing backup codes and generate new ones. Make sure to save the new codes in a safe place."
        confirmText="Regenerate"
        confirmVariant="warning"
      />

      {/* New Backup Codes Modal */}
      <Modal
        isOpen={!!newBackupCodes}
        onClose={() => setNewBackupCodes(null)}
        title="New Backup Codes"
        size="sm"
      >
        {newBackupCodes && (
          <div className="space-y-4">
            <p className="text-sm text-[#9ca3af]">
              Here are your new backup codes. Store them safely - they won't be shown again.
            </p>

            <div className="grid grid-cols-2 gap-2 p-4 bg-white/5 border border-white/10 rounded-xl">
              {newBackupCodes.map((code, i) => (
                <div
                  key={i}
                  className="font-mono text-sm text-white bg-black/20 px-3 py-2 rounded text-center"
                >
                  {code}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                const codesText = newBackupCodes.join("\n");
                navigator.clipboard.writeText(codesText);
              }}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
            >
              <i className="ri-file-copy-line mr-2"></i>
              Copy All Codes
            </button>

            <button
              onClick={() => setNewBackupCodes(null)}
              className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MFASettings;
