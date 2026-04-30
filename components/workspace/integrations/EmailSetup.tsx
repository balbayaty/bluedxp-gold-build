/**
 * Email Setup Component
 *
 * Email account connection and management
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { EmailAccount, EmailProvider } from "@/types/workspace";

interface EmailSetupProps {
  userId: string;
  onConnected?: () => void;
}

export function EmailSetup({ userId, onConnected }: EmailSetupProps) {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    provider: "GMAIL" as EmailProvider,
    email: "",
    password: "",
    server: "",
    port: 993,
    useSSL: true,
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await fetch("/api/v1/workspace/integrations/email");
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error("Error loading email accounts:", error);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/workspace/integrations/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadAccounts();
        setShowAddForm(false);
        setFormData({
          provider: "GMAIL",
          email: "",
          password: "",
          server: "",
          port: 993,
          useSSL: true,
        });
        if (onConnected) onConnected();
      }
    } catch (error) {
      console.error("Error connecting email:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/workspace/integrations/email?accountId=${accountId}`,
        { method: "DELETE" },
      );

      if (response.ok) {
        await loadAccounts();
      }
    } catch (error) {
      console.error("Error disconnecting email:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Accounts */}
      {accounts.map((account) => (
        <div
          key={account.id}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-white">{account.email}</h4>
              <p className="text-sm text-[#9ca3af]">{account.provider}</p>
            </div>
            <div className="flex items-center gap-3">
              {account.unreadCount > 0 && (
                <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">
                  {account.unreadCount} unread
                </span>
              )}
              <button
                onClick={() => handleDisconnect(account.id)}
                className="text-red-400 hover:text-red-300"
              >
                <i className="ri-delete-bin-line"></i>
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Add Account Form */}
      {showAddForm ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Provider
            </label>
            <select
              value={formData.provider}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  provider: e.target.value as EmailProvider,
                })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              <option value="GMAIL">Gmail</option>
              <option value="IMAP">IMAP</option>
              <option value="POP3">POP3</option>
              <option value="OUTLOOK">Outlook</option>
              <option value="CUSTOM_SMTP">Custom SMTP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="your@email.com"
            />
          </div>

          {(formData.provider === "IMAP" ||
            formData.provider === "POP3" ||
            formData.provider === "CUSTOM_SMTP") && (
            <>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="Password"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Server
                  </label>
                  <input
                    type="text"
                    value={formData.server}
                    onChange={(e) =>
                      setFormData({ ...formData, server: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    placeholder="imap.example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Port
                  </label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        port: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-[#9ca3af]">
                <input
                  type="checkbox"
                  checked={formData.useSSL}
                  onChange={(e) =>
                    setFormData({ ...formData, useSSL: e.target.checked })
                  }
                  className="rounded"
                />
                Use SSL
              </label>
            </>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleConnect}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Connecting..." : "Connect"}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full bg-white/5 border border-white/10 border-dashed rounded-xl p-6 text-center hover:border-cyan-500/50 transition-colors"
        >
          <i className="ri-add-line text-2xl text-cyan-400 mb-2"></i>
          <p className="text-sm text-white">Add Email Account</p>
        </button>
      )}
    </div>
  );
}
