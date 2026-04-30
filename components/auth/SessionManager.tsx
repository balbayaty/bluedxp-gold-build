/**
 * 🔒 SESSION MANAGER COMPONENT
 * 
 * View and manage active sessions:
 * - List all sessions
 * - Device/location info
 * - Revoke individual sessions
 * - Revoke all other sessions
 * 
 * BlueDXP Platform - Enterprise Grade
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserSession } from "@/lib/services/auth/sessionService";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { formatDistanceToNow } from "date-fns";

interface SessionManagerProps {
  userId: string;
}

const getDeviceIcon = (deviceType: string): string => {
  switch (deviceType) {
    case "mobile":
      return "ri-smartphone-line";
    case "tablet":
      return "ri-tablet-line";
    default:
      return "ri-computer-line";
  }
};

const getBrowserIcon = (browser: string): string => {
  switch (browser.toLowerCase()) {
    case "chrome":
      return "ri-chrome-line";
    case "firefox":
      return "ri-firefox-line";
    case "safari":
      return "ri-safari-line";
    case "edge":
      return "ri-edge-line";
    default:
      return "ri-global-line";
  }
};

const SessionManager: React.FC<SessionManagerProps> = ({ userId }) => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState<string | null>(null);
  const [showRevokeAllConfirm, setShowRevokeAllConfirm] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  // Fetch sessions
  useEffect(() => {
    fetchSessions();
  }, [userId]);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/sessions");
      const result = await response.json();

      if (result.success) {
        setSessions(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Revoke single session
  const revokeSession = async (sessionId: string) => {
    try {
      setIsRevoking(true);
      const response = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } catch (error) {
      console.error("Failed to revoke session:", error);
    } finally {
      setIsRevoking(false);
      setShowRevokeConfirm(null);
    }
  };

  // Revoke all other sessions
  const revokeAllOther = async () => {
    try {
      setIsRevoking(true);
      const response = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revokeAll: true }),
      });

      if (response.ok) {
        setSessions((prev) => prev.filter((s) => s.isCurrentSession));
      }
    } catch (error) {
      console.error("Failed to revoke sessions:", error);
    } finally {
      setIsRevoking(false);
      setShowRevokeAllConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10"></div>
              <div className="flex-1">
                <div className="h-4 w-48 bg-white/10 rounded mb-2"></div>
                <div className="h-3 w-32 bg-white/10 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Active Sessions</h3>
          <p className="text-sm text-[#9ca3af]">
            {sessions.length} active session{sessions.length !== 1 ? "s" : ""}
          </p>
        </div>
        
        {sessions.length > 1 && (
          <button
            onClick={() => setShowRevokeAllConfirm(true)}
            className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <i className="ri-logout-box-line mr-2"></i>
            Sign Out All Other Devices
          </button>
        )}
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        <AnimatePresence>
          {sessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-xl border transition-colors ${
                session.isCurrentSession
                  ? "bg-green-500/10 border-green-500/20"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Device Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      session.isCurrentSession
                        ? "bg-green-500/20"
                        : "bg-white/10"
                    }`}
                  >
                    <i
                      className={`text-2xl ${getDeviceIcon(session.deviceInfo.deviceType)} ${
                        session.isCurrentSession ? "text-green-400" : "text-[#9ca3af]"
                      }`}
                    ></i>
                  </div>

                  {/* Session Info */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">
                        {session.deviceInfo.os} {session.deviceInfo.osVersion}
                      </span>
                      {session.isCurrentSession && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                          Current
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-[#9ca3af]">
                      <span className="flex items-center gap-1">
                        <i className={getBrowserIcon(session.deviceInfo.browser)}></i>
                        {session.deviceInfo.browser} {session.deviceInfo.browserVersion}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <i className="ri-map-pin-line"></i>
                        {session.location.city || session.location.country || "Unknown"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-[#6b7280]">
                      <span className="flex items-center gap-1">
                        <i className="ri-wifi-line"></i>
                        {session.location.ip}
                      </span>
                      <span>•</span>
                      <span>
                        Last active{" "}
                        {formatDistanceToNow(new Date(session.lastActiveAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {!session.isCurrentSession && (
                  <button
                    onClick={() => setShowRevokeConfirm(session.id)}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white hover:bg-white/10 transition-colors"
                  >
                    <i className="ri-logout-box-line mr-1"></i>
                    Sign Out
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
          <i className="ri-computer-line text-4xl text-[#6b7280] mb-2"></i>
          <p className="text-sm text-[#9ca3af]">No active sessions</p>
        </div>
      )}

      {/* Security Tips */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <i className="ri-shield-line text-blue-400 text-xl mt-0.5"></i>
          <div>
            <p className="text-sm text-blue-300 font-medium">Security Tips</p>
            <ul className="text-xs text-blue-400 mt-1 space-y-1">
              <li>• Sign out of sessions you don't recognize</li>
              <li>• Enable two-factor authentication for extra security</li>
              <li>• Use unique passwords for each service</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Revoke Single Confirmation */}
      <ConfirmDialog
        isOpen={!!showRevokeConfirm}
        onClose={() => setShowRevokeConfirm(null)}
        onConfirm={() => showRevokeConfirm && revokeSession(showRevokeConfirm)}
        title="Sign Out Device"
        message="This will sign out this device immediately. You'll need to sign in again on that device."
        confirmText="Sign Out"
        confirmVariant="danger"
      />

      {/* Revoke All Confirmation */}
      <ConfirmDialog
        isOpen={showRevokeAllConfirm}
        onClose={() => setShowRevokeAllConfirm(false)}
        onConfirm={revokeAllOther}
        title="Sign Out All Other Devices"
        message="This will sign out all devices except your current one. You'll need to sign in again on those devices."
        confirmText="Sign Out All"
        confirmVariant="danger"
      />
    </div>
  );
};

export default SessionManager;
