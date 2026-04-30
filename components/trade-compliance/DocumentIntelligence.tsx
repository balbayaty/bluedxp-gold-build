/**
 * Document Intelligence Component
 * OCR, extraction, and validation for trade compliance documents
 */

"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";

type DocumentExtraction = {
  documentType: string;
  fields: Record<string, any>;
  confidence: number;
  rawText: string;
  structuredData: any;
};

type DocumentValidation = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
  confidence: number;
};

export default function DocumentIntelligence() {
  const [files, setFiles] = useState<File[]>([]);
  const [extractions, setExtractions] = useState<
    Map<string, DocumentExtraction>
  >(new Map());
  const [validations, setValidations] = useState<
    Map<string, DocumentValidation>
  >(new Map());
  const [processing, setProcessing] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] =
    useState<string>("COMMERCIAL_INVOICE");

  const documentTypes = [
    {
      value: "COMMERCIAL_INVOICE",
      label: "Commercial Invoice",
      icon: "ri-file-text-line",
    },
    { value: "PACKING_LIST", label: "Packing List", icon: "ri-file-list-line" },
    { value: "BILL_OF_LADING", label: "Bill of Lading", icon: "ri-ship-line" },
    {
      value: "CERTIFICATE_OF_ORIGIN",
      label: "Certificate of Origin",
      icon: "ri-global-line",
    },
    { value: "MSDS", label: "MSDS", icon: "ri-file-warning-line" },
  ];

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        setFiles((prev) => [...prev, ...selectedFiles]);
      }
    },
    [],
  );

  const processDocument = async (file: File) => {
    setProcessing(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("documentType", selectedDocumentType);

      const res = await fetch("/api/trade-compliance/documents/intelligence", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to process document");
      }

      setExtractions((prev) =>
        new Map(prev).set(file.name, data.extraction as DocumentExtraction),
      );
      setValidations((prev) =>
        new Map(prev).set(file.name, data.validation as DocumentValidation),
      );
    } catch (error) {
      console.error("Error processing document:", error);
    } finally {
      setProcessing(false);
    }
  };

  const processAllDocuments = async () => {
    for (const file of files) {
      await processDocument(file);
    }
  };

  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
    setExtractions((prev) => {
      const newMap = new Map(prev);
      newMap.delete(fileName);
      return newMap;
    });
    setValidations((prev) => {
      const newMap = new Map(prev);
      newMap.delete(fileName);
      return newMap;
    });
  };

  return (
    <div className="space-y-6">
      {/* Document Type Selection */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6 hover:border-cyan-500/50 transition-all">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i className="ri-file-text-line text-cyan-400"></i>
          Document Type
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {documentTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedDocumentType(type.value)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedDocumentType === type.value
                  ? "border-cyan-500 bg-cyan-500/20"
                  : "border-white/10 hover:border-white/20 bg-white/5"
              }`}
            >
              <i
                className={`${type.icon} text-2xl mb-2 ${selectedDocumentType === type.value ? "text-cyan-400" : "text-[#9ca3af]"}`}
              ></i>
              <div className="text-sm font-medium text-white">{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6 hover:border-cyan-500/50 transition-all">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i className="ri-upload-cloud-line text-cyan-400"></i>
          Upload Documents
        </h3>
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center hover:border-cyan-500/50 transition-colors bg-white/5"
        >
          <i className="ri-upload-cloud-line text-4xl text-[#9ca3af] mb-4"></i>
          <p className="text-[#9ca3af] mb-4">
            Drag and drop documents here, or
          </p>
          <label className="inline-block px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 cursor-pointer transition-all">
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
            Select Files
          </label>
        </div>

        {files.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-white">
                {files.length} file(s) selected
              </span>
              <button
                onClick={processAllDocuments}
                disabled={processing}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
              >
                {processing ? "Processing..." : "Process All"}
              </button>
            </div>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <i className="ri-file-line text-xl text-[#9ca3af]"></i>
                    <div>
                      <div className="font-medium text-white">{file.name}</div>
                      <div className="text-xs text-[#9ca3af]">
                        {(file.size / 1024).toFixed(2)} KB
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {extractions.has(file.name) && (
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/30">
                        Extracted
                      </span>
                    )}
                    <button
                      onClick={() => removeFile(file.name)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Extraction Results */}
      {extractions.size > 0 && (
        <div className="space-y-4">
          {Array.from(extractions.entries()).map(([fileName, extraction]) => {
            const validation = validations.get(fileName);
            return (
              <motion.div
                key={fileName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6 hover:border-cyan-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-white">{fileName}</h4>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        validation?.isValid
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {validation?.isValid ? "Valid" : "Invalid"}
                    </span>
                    <span className="text-xs text-[#9ca3af]">
                      {Math.round(extraction.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>

                {/* Extracted Fields */}
                <div className="mb-4">
                  <div className="text-sm font-medium text-white mb-2">
                    Extracted Fields
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(extraction.fields).map(([key, value]) => (
                      <div
                        key={key}
                        className="p-2 bg-white/5 rounded border border-white/10"
                      >
                        <div className="text-xs text-[#9ca3af] mb-1">{key}</div>
                        <div className="text-sm font-medium text-white">
                          {typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Validation Results */}
                {validation && (
                  <div>
                    {validation.errors.length > 0 && (
                      <div className="mb-2">
                        <div className="text-sm font-medium text-red-400 mb-1">
                          Errors
                        </div>
                        <ul className="text-sm text-red-300 space-y-1">
                          {validation.errors.map((error, idx) => (
                            <li key={idx}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {validation.warnings.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-yellow-400 mb-1">
                          Warnings
                        </div>
                        <ul className="text-sm text-yellow-300 space-y-1">
                          {validation.warnings.map((warning, idx) => (
                            <li key={idx}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
