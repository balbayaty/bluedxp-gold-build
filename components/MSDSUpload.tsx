/**
 * MSDS Upload Component
 * Upload and manage Material Safety Data Sheets
 * Migrated from chemcheck-ai/components/MSDSUpload.tsx
 * Adapted for BlueDXP Platform
 */

"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";

interface MSDSFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
  uploadedUrl?: string;
}

interface MSDSUploadProps {
  onUploadComplete?: (files: MSDSFile[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  autoUpload?: boolean;
}

export default function MSDSUpload({
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  maxFileSize = 50,
  acceptedTypes = [".pdf", ".doc", ".docx", ".xls", ".xlsx"],
  autoUpload = false,
}: MSDSUploadProps) {
  const [files, setFiles] = useState<MSDSFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        handleFiles(selectedFiles);
      }
    },
    [],
  );

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      // Check file type
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      if (!acceptedTypes.includes(fileExtension)) {
        onUploadError?.(
          `File ${file.name} has invalid type. Accepted: ${acceptedTypes.join(", ")}`,
        );
        return false;
      }

      // Check file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxFileSize) {
        onUploadError?.(
          `File ${file.name} exceeds maximum size of ${maxFileSize}MB`,
        );
        return false;
      }

      return true;
    });

    const msdsFiles: MSDSFile[] = validFiles.map((file) => ({
      id: `msds-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: "uploading",
    }));

    const updatedFiles = [...files, ...msdsFiles].slice(0, maxFiles);
    setFiles(updatedFiles);

    if (autoUpload) {
      uploadFiles(msdsFiles);
    }
  };

  const uploadFiles = async (filesToUpload: MSDSFile[] = files) => {
    setUploading(true);

    const uploadPromises = filesToUpload.map(async (msdsFile) => {
      try {
        const formData = new FormData();
        formData.append("file", msdsFile.file);
        formData.append("type", "MSDS");
        formData.append("name", msdsFile.name);

        // Simulate upload progress
        const xhr = new XMLHttpRequest();

        return new Promise<MSDSFile>((resolve, reject) => {
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === msdsFile.id ? { ...f, progress } : f,
                ),
              );
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.responseText);
              const updatedFile: MSDSFile = {
                ...msdsFile,
                status: "success",
                progress: 100,
                uploadedUrl: response.url || response.file_url,
              };
              resolve(updatedFile);
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Upload failed"));
          });

          // Try to upload to API
          xhr.open("POST", "/api/erpnext/save-msds");
          xhr.send(formData);
        });
      } catch (error: any) {
        return {
          ...msdsFile,
          status: "error" as const,
          error: error.message || "Upload failed",
        };
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      setFiles((prev) =>
        prev.map((f) => {
          const result = results.find((r) => r.id === f.id);
          return result || f;
        }),
      );
      onUploadComplete?.(results.filter((r) => r.status === "success"));
    } catch (error: any) {
      onUploadError?.(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(files.filter((f) => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
        }`}
      >
        <i className="ri-file-upload-line text-4xl text-gray-400 dark:text-gray-500 mb-4"></i>
        <p className="text-gray-700 dark:text-gray-300 mb-2">
          Drag and drop MSDS files here, or{" "}
          <label className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
            browse
            <input
              type="file"
              multiple
              accept={acceptedTypes.join(",")}
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Accepted formats: {acceptedTypes.join(", ")} (Max {maxFileSize}MB per
          file)
        </p>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Selected Files ({files.length}/{maxFiles})
            </h4>
            {!autoUpload && (
              <button
                onClick={() => uploadFiles()}
                disabled={uploading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <i className="ri-upload-cloud-line"></i>
                {uploading ? "Uploading..." : "Upload All"}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((msdsFile) => (
              <motion.div
                key={msdsFile.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <i className="ri-file-text-line text-2xl text-blue-600 dark:text-blue-400"></i>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {msdsFile.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(msdsFile.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {msdsFile.status === "uploading" && (
                      <div className="w-32">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${msdsFile.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                          {msdsFile.progress}%
                        </p>
                      </div>
                    )}

                    {msdsFile.status === "success" && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 flex items-center gap-1">
                        <i className="ri-checkbox-circle-line"></i>
                        Uploaded
                      </span>
                    )}

                    {msdsFile.status === "error" && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 flex items-center gap-1">
                        <i className="ri-error-warning-line"></i>
                        Error
                      </span>
                    )}

                    <button
                      onClick={() => removeFile(msdsFile.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title="Remove file"
                    >
                      <i className="ri-close-line text-xl"></i>
                    </button>
                  </div>
                </div>

                {msdsFile.error && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {msdsFile.error}
                  </p>
                )}

                {msdsFile.uploadedUrl && (
                  <a
                    href={msdsFile.uploadedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <i className="ri-external-link-line"></i>
                    View uploaded file
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
