/**
 * 🚀 API KEY MANAGER COMPONENT
 *
 * Beautiful API key management interface
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiKey,
  FiPlus,
  FiTrash2,
  FiRefreshCw,
  FiEye,
  FiEyeOff,
  FiCopy,
  FiCheck,
  FiAlertTriangle,
  FiClock,
} from "react-icons/fi";

interface APIKeyManagerProps {
  userId: string;
  className?: string;
}

export default function APIKeyManager({
  userId,
  className = "",
}: APIKeyManagerProps) {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKey, setNewKey] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    loadAPIKeys();
  }, [userId]);

  const loadAPIKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/api-keys", {
        headers: {
          "x-user-id": userId,
        },
      });
      const data = await response.json();
      if (data.success) {
        setApiKeys(data.data || []);
      }
    } catch (error) {
      console.error("Error loading API keys:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData: any) => {
    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          ...formData,
          userId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNewKey(data.data.key); // Store the key (only shown once)
        setShowCreateModal(false);
        await loadAPIKeys();
      }
    } catch (error) {
      console.error("Error creating API key:", error);
    }
  };

  const handleDelete = async (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    try {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadAPIKeys();
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
    }
  };

  const handleRotate = async (keyId: string) => {
    try {
      const response = await fetch(`/api/api-keys/${keyId}/rotate`, {
        method: "POST",
      });

      const data = await response.json();
      if (data.success) {
        setNewKey(data.data.key); // Store the new key
        await loadAPIKeys();
      }
    } catch (error) {
      console.error("Error rotating API key:", error);
    }
  };

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            API Keys
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage API keys for programmatic access
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Create API Key
        </button>
      </div>

      {/* New Key Display (only shown once) */}
      <AnimatePresence>
        {newKey && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-400 dark:border-yellow-600"
          >
            <div className="flex items-start gap-3 mb-4">
              <FiAlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                  Save Your API Key
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  This key will only be shown once. Copy it now and store it
                  securely.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded border border-yellow-300 dark:border-yellow-700">
              <code className="flex-1 font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
                {newKey}
              </code>
              <button
                onClick={() => copyToClipboard(newKey, "new")}
                className="p-2 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded"
              >
                {copiedKey === "new" ? (
                  <FiCheck className="w-5 h-5" />
                ) : (
                  <FiCopy className="w-5 h-5" />
                )}
              </button>
            </div>
            <button
              onClick={() => setNewKey(null)}
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
            >
              I've Saved It
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <FiKey className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No API Keys
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Create your first API key to get started
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create API Key
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <motion.div
              key={key.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FiKey className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {key.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        key.status === "ACTIVE"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : key.status === "REVOKED"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {key.status}
                    </span>
                  </div>
                  {key.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {key.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <FiKey className="w-4 h-4" />
                      <span className="font-mono">****{key.keyLast4}</span>
                    </div>
                    {key.lastUsedAt && (
                      <div className="flex items-center gap-1">
                        <FiClock className="w-4 h-4" />
                        <span>
                          Last used:{" "}
                          {new Date(key.lastUsedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <FiRefreshCw className="w-4 h-4" />
                      <span>{key.usageCount || 0} uses</span>
                    </div>
                    {key.expiresAt && (
                      <div className="flex items-center gap-1">
                        <FiClock className="w-4 h-4" />
                        <span>
                          Expires:{" "}
                          {new Date(key.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRotate(key.id)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="Rotate Key"
                  >
                    <FiRefreshCw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(key.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Delete Key"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateAPIKeyModal
            onSave={handleCreate}
            onCancel={() => setShowCreateModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateAPIKeyModal({
  onSave,
  onCancel,
}: {
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    expiresAt: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Create API Key
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Expires At (Optional)
            </label>
            <input
              type="date"
              value={formData.expiresAt}
              onChange={(e) =>
                setFormData({ ...formData, expiresAt: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
