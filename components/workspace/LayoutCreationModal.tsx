/**
 * Layout Creation Modal
 *
 * Allows users to create a new workspace layout with name and description
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAllTemplates,
  templateToLayoutInput,
  type LayoutTemplate,
} from "@/lib/services/workspace/layoutTemplates";
import type { CreateWorkspaceLayoutInput } from "@/types/workspace";

interface LayoutCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: CreateWorkspaceLayoutInput) => Promise<void>;
}

export function LayoutCreationModal({
  isOpen,
  onClose,
  onCreate,
}: LayoutCreationModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] =
    useState<LayoutTemplate | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const templates = getAllTemplates();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Layout name is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use template if selected, otherwise create blank layout
      const input: CreateWorkspaceLayoutInput = selectedTemplate
        ? templateToLayoutInput(
            selectedTemplate,
            name.trim() || selectedTemplate.name,
            isDefault,
          )
        : {
            name: name.trim(),
            description: description.trim() || undefined,
            isDefault,
            category: category || undefined,
            widgets: [],
          };

      // Override category if template has one
      if (selectedTemplate) {
        input.category = selectedTemplate.category;
        if (!name.trim()) {
          input.name = selectedTemplate.name;
        }
        if (!description.trim()) {
          input.description = selectedTemplate.description;
        }
      }

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Request timed out. Please try again.")),
          10000,
        );
      });

      (await Promise.race([onCreate(input), timeoutPromise])) as Promise<void>;

      // Reset form
      setName("");
      setDescription("");
      setIsDefault(false);
      setCategory("");
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create layout";
      setError(errorMessage);
      console.error("Layout creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName("");
      setDescription("");
      setIsDefault(false);
      setCategory("");
      setError(null);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1f2937] border border-white/10 rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Create New Layout
                </h2>
                <p className="text-sm text-[#9ca3af] mt-1">
                  Create a custom workspace layout
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <i className="ri-close-line text-xl text-white"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Layout Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Layout Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., My Dashboard, Operations View"
                  disabled={loading}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this layout is for..."
                  disabled={loading}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 resize-none"
                />
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Start from Template (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors text-left flex items-center justify-between"
                  disabled={loading}
                >
                  <span>
                    {selectedTemplate ? (
                      <span className="flex items-center gap-2">
                        <i className={selectedTemplate.icon}></i>
                        {selectedTemplate.name}
                      </span>
                    ) : (
                      "Choose a template or start blank"
                    )}
                  </span>
                  <i
                    className={`ri-arrow-${showTemplates ? "up" : "down"}-s-line`}
                  ></i>
                </button>

                {showTemplates && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplate(null);
                        setShowTemplates(false);
                      }}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        !selectedTemplate
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <i className="ri-file-blank-line text-cyan-400"></i>
                        <span className="text-sm font-medium text-white">
                          Blank
                        </span>
                      </div>
                      <p className="text-xs text-[#9ca3af]">
                        Start from scratch
                      </p>
                    </button>

                    {templates
                      .filter((t) => t.id !== "blank-layout")
                      .map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setShowTemplates(false);
                            if (!name.trim()) setName(template.name);
                            if (!description.trim())
                              setDescription(template.description);
                            setCategory(template.category);
                          }}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            selectedTemplate?.id === template.id
                              ? "border-cyan-500 bg-cyan-500/10"
                              : "border-white/10 bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <i className={`${template.icon} text-cyan-400`}></i>
                            <span className="text-sm font-medium text-white">
                              {template.name}
                            </span>
                          </div>
                          <p className="text-xs text-[#9ca3af] line-clamp-2">
                            {template.description}
                          </p>
                        </button>
                      ))}
                  </motion.div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Category (Optional)
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., executive, operations, analytics"
                  disabled={loading || !!selectedTemplate}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
                />
              </div>

              {/* Set as Default */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 text-cyan-600 bg-white/5 border-white/10 rounded focus:ring-cyan-500 focus:ring-2 disabled:opacity-50"
                />
                <label
                  htmlFor="isDefault"
                  className="text-sm text-white cursor-pointer"
                >
                  Set as default layout
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="ri-add-line"></i>
                      Create Layout
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
