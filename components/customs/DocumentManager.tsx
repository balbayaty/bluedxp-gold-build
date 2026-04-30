/**
 * Document Manager Component
 * Drag-drop upload, template selection, auto-fill, validation
 */

"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FiUpload,
  FiFileText,
  FiCheckCircle,
  FiX,
  FiDownload,
  FiEye,
  FiTrash2,
  FiRefreshCw,
  FiSearch,
  FiFilter,
} from "react-icons/fi";

interface DocumentManagerProps {
  declarationId: string;
  onDocumentUploaded?: (document: any) => void;
}

export default function DocumentManager({
  declarationId,
  onDocumentUploaded,
}: DocumentManagerProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Load documents on mount
  useEffect(() => {
    if (declarationId) {
      loadDocuments();
    }
  }, [declarationId]);

  const loadDocuments = async () => {
    try {
      const response = await fetch(
        `/api/customs/documents?declarationId=${declarationId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      await uploadFiles(files);
    },
    [],
  );

  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("declarationId", declarationId);
        formData.append("type", detectDocumentType(file.name));

        const response = await fetch("/api/customs/documents", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          const document = result.document;
          setDocuments((prev) => [...prev, document]);
          if (onDocumentUploaded) {
            onDocumentUploaded(document);
          }
          // Reload documents to get updated list
          await loadDocuments();
        }
      }
    } catch (error) {
      console.error("Failed to upload documents:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
          isDragging
            ? "border-cyan-500 bg-cyan-500/10"
            : "border-gray-700 hover:border-gray-600"
        }`}
      >
        <motion.div
          animate={{ scale: isDragging ? 1.05 : 1 }}
          className="space-y-4"
        >
          <div className="flex justify-center">
            <div className="p-4 bg-cyan-500/20 rounded-full">
              <FiUpload className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold mb-2">
              {isDragging ? "Drop files here" : "Drag & drop documents here"}
            </p>
            <p className="text-gray-400 text-sm mb-4">
              or click to browse (PDF, JPG, PNG, DOCX)
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg cursor-pointer transition-all"
            >
              <FiUpload className="w-4 h-4" />
              <span>Select Files</span>
            </label>
          </div>
        </motion.div>
      </div>

      {/* Documents List */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Documents</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadDocuments}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <FiSearch className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <FiFilter className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {documents.length > 0 ? (
            documents.map((doc, index) => (
              <DocumentRow
                key={doc.id || index}
                document={doc}
                onDelete={handleDeleteDocument}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <FiFileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No documents uploaded yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Upload documents using the area above
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Templates */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4">Document Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "Commercial Invoice", type: "COMMERCIAL_INVOICE" },
            { name: "Packing List", type: "PACKING_LIST" },
            { name: "Certificate of Origin", type: "CERTIFICATE_OF_ORIGIN" },
          ].map((template) => (
            <button
              key={template.type}
              className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors text-left"
            >
              <FiFileText className="w-6 h-6 text-cyan-400 mb-2" />
              <p className="font-medium">{template.name}</p>
              <p className="text-sm text-gray-400">Auto-generate from data</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentRow({
  document,
  onDelete,
}: {
  document: any;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
      <div className="flex items-center space-x-4 flex-1">
        <div className="p-2 bg-cyan-500/20 rounded-lg">
          <FiFileText className="w-5 h-5 text-cyan-400" />
        </div>
        <div className="flex-1">
          <p className="font-medium">{document.name}</p>
          <p className="text-sm text-gray-400">
            {document.type} •{" "}
            {document.fileSize
              ? `${(document.fileSize / 1024).toFixed(1)} KB`
              : ""}
            {document.uploadedAt &&
              ` • ${new Date(document.uploadedAt).toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {document.isValid ? (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
              Verified
            </span>
          ) : (
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
              Pending
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {document.fileUrl && (
          <a
            href={document.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiEye className="w-4 h-4" />
          </a>
        )}
        {document.fileUrl && (
          <a
            href={document.fileUrl}
            download
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiDownload className="w-4 h-4" />
          </a>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(document.id)}
            className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
