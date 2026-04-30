/**
 * Document Upload Modal Component
 * For ISO Document Center
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface DocumentUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
  isDark?: boolean;
}

export default function DocumentUploadModal({
  onClose,
  onSuccess,
  isDark = true,
}: DocumentUploadModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "policy" as
      | "policy"
      | "procedure"
      | "sds"
      | "permit"
      | "certificate"
      | "report",
    category: "",
    iso_standard: "",
    version: "1.0",
    description: "",
    file: null as File | null,
  });

  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) {
      alert("Please select a file to upload");
      return;
    }

    setUploading(true);
    try {
      // Upload to Firebase Storage or ERPNext
      const formDataToSend = new FormData();
      formDataToSend.append("file", formData.file);
      formDataToSend.append("name", formData.name);
      formDataToSend.append("type", formData.type);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("iso_standard", formData.iso_standard);
      formDataToSend.append("version", formData.version);
      formDataToSend.append("description", formData.description);

      const response = await fetch("/api/erpnext/documents", {
        method: "POST",
        body: formDataToSend,
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Failed to upload document");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading document");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl shadow-2xl max-w-2xl w-full bg-gray-800 border border-gray-700"
      >
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Upload Document</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-700 text-gray-400"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-200">
              Document Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-gray-600 border-2 focus:border-blue-500 focus:outline-none"
              placeholder="e.g., Chemical Handling Safety Policy"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-200">
                Document Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as any })
                }
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-gray-600 border-2 focus:border-blue-500"
              >
                <option value="policy">Policy</option>
                <option value="procedure">Procedure</option>
                <option value="sds">Safety Data Sheet</option>
                <option value="permit">Permit</option>
                <option value="certificate">Certificate</option>
                <option value="report">Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-200">
                ISO Standard
              </label>
              <select
                value={formData.iso_standard}
                onChange={(e) =>
                  setFormData({ ...formData, iso_standard: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-gray-600 border-2 focus:border-blue-500"
              >
                <option value="">Select Standard</option>
                <option value="ISO 9001">ISO 9001</option>
                <option value="ISO 14001">ISO 14001</option>
                <option value="ISO 45001">ISO 45001</option>
                <option value="ISO 27001">ISO 27001</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-200">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-gray-600 border-2 focus:border-blue-500"
                placeholder="e.g., Safety, Quality"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-200">
                Version
              </label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) =>
                  setFormData({ ...formData, version: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-gray-600 border-2 focus:border-blue-500"
                placeholder="1.0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-200">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-gray-600 border-2 focus:border-blue-500"
              placeholder="Brief description of the document..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-200">
              File *
            </label>
            <div className="border-2 border-dashed rounded-xl p-8 text-center border-gray-700 bg-gray-900">
              <i className="ri-file-upload-line text-6xl text-gray-600 mb-3"></i>
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                <i className="ri-add-line"></i> Select File
              </label>
              {formData.file && (
                <p className="mt-2 text-sm text-gray-400">
                  {formData.file.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-700">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg font-semibold bg-gray-700 hover:bg-gray-600 text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
