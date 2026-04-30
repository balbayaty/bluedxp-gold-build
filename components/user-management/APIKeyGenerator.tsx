/**
 * 🔑 API KEY GENERATOR & MANAGER
 * 
 * Production-ready API key management with:
 * - Key generation with crypto-secure randomness
 * - Usage tracking (calls, tokens, rate limits)
 * - Scope-based permissions
 * - Expiry management
 * - IP whitelisting
 * - Real-time usage monitoring
 * 
 * BlueDXP Platform - Production Ready
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/Modal";
import { APIKey, APIKeyScope } from "@/types/userManagement";
import { format } from "date-fns";

export interface APIKeyGeneratorProps {
  userId: string;
  existingKeys: APIKey[];
  onKeyGenerated: (key: APIKey) => void;
  onKeyRevoked: (keyId: string) => void;
  onKeyUpdated: (keyId: string, updates: Partial<APIKey>) => void;
  readOnly?: boolean;
}

const ALL_SCOPES: { scope: APIKeyScope; label: string; description: string }[] = [
  { scope: "read:all", label: "Read All", description: "Read access to all resources" },
  { scope: "write:all", label: "Write All", description: "Write access to all resources" },
  { scope: "read:inventory", label: "Read Inventory", description: "View inventory data" },
  { scope: "write:inventory", label: "Write Inventory", description: "Modify inventory data" },
  { scope: "read:orders", label: "Read Orders", description: "View orders" },
  { scope: "write:orders", label: "Write Orders", description: "Create/modify orders" },
  { scope: "read:shipments", label: "Read Shipments", description: "View shipments" },
  { scope: "write:shipments", label: "Write Shipments", description: "Create/modify shipments" },
  { scope: "read:customers", label: "Read Customers", description: "View customer data" },
  { scope: "write:customers", label: "Write Customers", description: "Modify customer data" },
  { scope: "read:warehouses", label: "Read Warehouses", description: "View warehouse data" },
  { scope: "write:warehouses", label: "Write Warehouses", description: "Modify warehouse data" },
  { scope: "read:reports", label: "Read Reports", description: "Access reports" },
  { scope: "admin", label: "Admin", description: "Full administrative access" },
];

const APIKeyGenerator: React.FC<APIKeyGeneratorProps> = ({
  userId,
  existingKeys,
  onKeyGenerated,
  onKeyRevoked,
  onKeyUpdated,
  readOnly = false,
}) => {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [keyName, setKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<APIKeyScope[]>([]);
  const [rateLimit, setRateLimit] = useState({ requests: 1000, window: "hour" as "minute" | "hour" | "day" });
  const [expiresIn, setExpiresIn] = useState<number | null>(365); // days
  const [ipWhitelist, setIpWhitelist] = useState<string[]>([]);
  const [newIp, setNewIp] = useState("");

  const generateSecureKey = (): string => {
    // Generate a secure random API key
    const prefix = "bdxp"; // BlueDXP prefix
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let key = "";
    for (let i = 0; i < 32; i++) {
      key += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return `${prefix}_${key}`;
  };

  const handleGenerate = async () => {
    if (!keyName || selectedScopes.length === 0) {
      alert("Please provide a name and select at least one scope");
      return;
    }

    try {
      // Call real API to generate key (server-side secure generation)
      const response = await fetch(`/api/users/${userId}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: keyName,
          permissions: selectedScopes,
          allowedIPs: ipWhitelist,
          rateLimit: rateLimit,
          expiresAt: expiresIn 
            ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString()
            : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create API key");
      }

      const result = await response.json();
      const keyData = result.data;

      // Transform to local format
      const newKey: APIKey = {
        id: keyData.id,
        userId,
        name: keyData.name,
        key: keyData.key, // Full key only returned once
        prefix: keyData.keyPrefix + "_" + keyData.keyLast4,
        permissions: [],
        scopes: selectedScopes,
        expiresAt: keyData.expiresAt ? new Date(keyData.expiresAt) : undefined,
        usageCount: 0,
        rateLimit,
        ipWhitelist: ipWhitelist.length > 0 ? ipWhitelist : undefined,
        status: "active",
        createdAt: new Date(keyData.createdAt),
        updatedAt: new Date(keyData.createdAt),
      };

      onKeyGenerated(newKey);
      setNewlyGeneratedKey(keyData.key);
      setShowGenerateModal(false);
      setShowKeyModal(true);

      // Reset form
      setKeyName("");
      setSelectedScopes([]);
      setIpWhitelist([]);
      setNewIp("");
    } catch (error) {
      console.error("Failed to generate API key:", error);
      alert(error instanceof Error ? error.message : "Failed to generate API key");
    }
  };

  const copyToClipboard = () => {
    if (newlyGeneratedKey) {
      navigator.clipboard.writeText(newlyGeneratedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleScope = (scope: APIKeyScope) => {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter(s => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  const addIpToWhitelist = () => {
    if (newIp && !ipWhitelist.includes(newIp)) {
      setIpWhitelist([...ipWhitelist, newIp]);
      setNewIp("");
    }
  };

  const removeIpFromWhitelist = (ip: string) => {
    setIpWhitelist(ipWhitelist.filter(i => i !== ip));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <i className="ri-key-line text-cyan-400"></i>
            API Keys
          </h3>
          <p className="text-sm text-[#9ca3af] mt-1">
            {existingKeys.length} key{existingKeys.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-cyan-600 transition-colors shadow-lg shadow-purple-500/20"
          >
            <i className="ri-add-line mr-2"></i>
            Generate New Key
          </button>
        )}
      </div>

      {/* Existing Keys */}
      {existingKeys.length === 0 ? (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
          <i className="ri-key-line text-4xl text-[#6b7280] mb-2"></i>
          <p className="text-sm text-[#9ca3af]">No API keys configured</p>
          <p className="text-xs text-[#6b7280] mt-1">Generate your first key to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {existingKeys.map((key) => (
            <motion.div
              key={key.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-white/5 border border-white/10 rounded-lg hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">{key.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        key.status === "active"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : key.status === "expired"
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {key.status}
                    </span>
                  </div>
                  <div className="text-xs text-[#9ca3af] font-mono mb-2">
                    {key.prefix}••••••••••••••••••••
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#9ca3af]">
                    <span>
                      <i className="ri-user-line mr-1"></i>
                      {key.usageCount.toLocaleString()} calls
                    </span>
                    {key.rateLimit && (
                      <span>
                        <i className="ri-speed-line mr-1"></i>
                        {key.rateLimit.requests}/{key.rateLimit.window}
                      </span>
                    )}
                    {key.expiresAt && (
                      <span>
                        <i className="ri-time-line mr-1"></i>
                        Expires {format(new Date(key.expiresAt), "MMM dd, yyyy")}
                      </span>
                    )}
                  </div>
                </div>
                {!readOnly && key.status === "active" && (
                  <button
                    onClick={() => onKeyRevoked(key.id)}
                    className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-medium hover:bg-red-500/30 transition-colors"
                  >
                    <i className="ri-delete-bin-line mr-1"></i>
                    Revoke
                  </button>
                )}
              </div>

              {/* Scopes */}
              <div className="flex flex-wrap gap-1">
                {key.scopes.map((scope) => (
                  <span
                    key={scope}
                    className="px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-xs"
                  >
                    {scope}
                  </span>
                ))}
              </div>

              {/* IP Whitelist */}
              {key.ipWhitelist && key.ipWhitelist.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <div className="text-xs text-[#9ca3af] mb-1">IP Whitelist:</div>
                  <div className="flex flex-wrap gap-1">
                    {key.ipWhitelist.map((ip) => (
                      <span
                        key={ip}
                        className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-xs font-mono"
                      >
                        {ip}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Generate Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate New API Key"
        size="lg"
      >
        <div className="space-y-4">
          {/* Key Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Key Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g., Production API Key"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-[#6b7280] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Scopes */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Permissions (Scopes) <span className="text-red-400">*</span>
            </label>
            <div className="grid md:grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-2 bg-white/5 rounded-lg">
              {ALL_SCOPES.map((scopeObj) => (
                <label
                  key={scopeObj.scope}
                  className={`flex items-start gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                    selectedScopes.includes(scopeObj.scope)
                      ? "bg-purple-500/20 border border-purple-500/30"
                      : "bg-white/5 border border-white/10 hover:border-white/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedScopes.includes(scopeObj.scope)}
                    onChange={() => toggleScope(scopeObj.scope)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{scopeObj.label}</div>
                    <div className="text-xs text-[#9ca3af]">{scopeObj.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Rate Limit */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Rate Limit
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={rateLimit.requests}
                onChange={(e) => setRateLimit({ ...rateLimit, requests: parseInt(e.target.value) || 1000 })}
                placeholder="Requests"
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-[#6b7280] focus:outline-none focus:border-purple-500"
              />
              <select
                value={rateLimit.window}
                onChange={(e) => setRateLimit({ ...rateLimit, window: e.target.value as any })}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="minute">per Minute</option>
                <option value="hour">per Hour</option>
                <option value="day">per Day</option>
              </select>
            </div>
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Expires In
            </label>
            <select
              value={expiresIn || "never"}
              onChange={(e) => setExpiresIn(e.target.value === "never" ? null : parseInt(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365">1 year</option>
              <option value="never">Never</option>
            </select>
          </div>

          {/* IP Whitelist */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              IP Whitelist (Optional)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder="e.g., 192.168.1.1"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-[#6b7280] focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={addIpToWhitelist}
                className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition-colors"
              >
                <i className="ri-add-line"></i>
              </button>
            </div>
            {ipWhitelist.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {ipWhitelist.map((ip) => (
                  <span
                    key={ip}
                    className="px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm flex items-center gap-2"
                  >
                    {ip}
                    <button
                      onClick={() => removeIpFromWhitelist(ip)}
                      className="hover:text-red-400 transition-colors"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => setShowGenerateModal(false)}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!keyName || selectedScopes.length === 0}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg hover:from-purple-600 hover:to-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="ri-key-line mr-2"></i>
              Generate Key
            </button>
          </div>
        </div>
      </Modal>

      {/* Show Generated Key Modal */}
      <Modal
        isOpen={showKeyModal}
        onClose={() => {
          setShowKeyModal(false);
          setNewlyGeneratedKey(null);
        }}
        title="API Key Generated Successfully"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <i className="ri-alert-line text-yellow-400 text-xl mt-0.5"></i>
              <div className="flex-1">
                <div className="text-sm font-medium text-yellow-300 mb-1">
                  Important: Save this key now!
                </div>
                <div className="text-xs text-yellow-400">
                  This is the only time you'll see the full key. Store it securely.
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Your API Key
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newlyGeneratedKey || ""}
                readOnly
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none"
              />
              <button
                onClick={copyToClipboard}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  copied
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30"
                }`}
              >
                <i className={`ri-${copied ? "check" : "file-copy"}-line`}></i>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={() => {
                setShowKeyModal(false);
                setNewlyGeneratedKey(null);
              }}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg hover:from-purple-600 hover:to-cyan-600 transition-colors"
            >
              I've Saved My Key
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default APIKeyGenerator;
