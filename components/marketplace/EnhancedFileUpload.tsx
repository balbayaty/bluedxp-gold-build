/**
 * Enhanced File Upload Component
 * Features: Drag-and-drop, preview, progress tracking, multiple files, image/document support
 */

"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
} from "lucide-react";

interface FileWithPreview extends File {
  preview?: string;
  id: string;
  uploadProgress?: number;
  uploadStatus?: "pending" | "uploading" | "success" | "error";
}

interface EnhancedFileUploadProps {
  value?: FileWithPreview[];
  onChange: (files: FileWithPreview[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  label?: string;
  description?: string;
  showPreview?: boolean;
  onUpload?: (file: File) => Promise<string>;
}

export default function EnhancedFileUpload({
  value = [],
  onChange,
  accept = "*/*",
  maxFiles = 10,
  maxSizeMB = 10,
  label = "Upload Files",
  description = "Drag and drop files here, or click to select",
  showPreview = true,
  onUpload,
}: EnhancedFileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>(value);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileWithPreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }
    if (files.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }
    return null;
  };

  const createFilePreview = (file: File): FileWithPreview => {
    const fileWithPreview: FileWithPreview = Object.assign(file, {
      id: generateId(),
      uploadStatus: "pending",
    });

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        fileWithPreview.preview = e.target?.result as string;
        setFiles((prev) =>
          prev.map((f) => (f.id === fileWithPreview.id ? fileWithPreview : f)),
        );
      };
      reader.readAsDataURL(file);
    }

    return fileWithPreview;
  };

  const handleFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const validFiles: FileWithPreview[] = [];

      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          alert(error);
          continue;
        }

        const fileWithPreview = createFilePreview(file);
        validFiles.push(fileWithPreview);

        // Auto-upload if onUpload is provided
        if (onUpload) {
          fileWithPreview.uploadStatus = "uploading";
          fileWithPreview.uploadProgress = 0;
          setFiles((prev) => [...prev, fileWithPreview]);

          try {
            // Simulate upload progress
            const progressInterval = setInterval(() => {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === fileWithPreview.id
                    ? {
                        ...f,
                        uploadProgress: Math.min(
                          (f.uploadProgress || 0) + 10,
                          90,
                        ),
                      }
                    : f,
                ),
              );
            }, 200);

            const url = await onUpload(file);
            clearInterval(progressInterval);

            fileWithPreview.uploadStatus = "success";
            fileWithPreview.uploadProgress = 100;
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileWithPreview.id ? fileWithPreview : f,
              ),
            );
          } catch (error) {
            fileWithPreview.uploadStatus = "error";
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileWithPreview.id ? fileWithPreview : f,
              ),
            );
            alert(`Failed to upload ${file.name}`);
          }
        }
      }

      if (!onUpload) {
        setFiles((prev) => [...prev, ...validFiles]);
      }
      onChange([...files, ...validFiles]);
    },
    [files, onChange, onUpload, maxFiles, maxSizeMB],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleRemove = (id: string) => {
    const updatedFiles = files.filter((f) => f.id !== id);
    setFiles(updatedFiles);
    onChange(updatedFiles);
  };

  const getFileIcon = (file: FileWithPreview) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    }
    return <FileText className="w-5 h-5 text-slate-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
          {label}
        </label>

        {/* Drop Zone */}
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />

          <motion.div
            animate={{ scale: isDragging ? 1.05 : 1 }}
            className="flex flex-col items-center gap-3"
          >
            <Upload
              className={`w-12 h-12 ${
                isDragging ? "text-blue-500" : "text-slate-400"
              }`}
            />
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {isDragging ? "Drop files here" : description}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Max {maxFiles} files, {maxSizeMB}MB each
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600"
              >
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatFileSize(file.size)}
                    </p>
                    {file.uploadStatus === "uploading" && (
                      <>
                        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${file.uploadProgress || 0}%` }}
                            className="h-full bg-blue-500"
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {file.uploadProgress || 0}%
                        </span>
                      </>
                    )}
                    {file.uploadStatus === "success" && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    {file.uploadStatus === "error" && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {showPreview && file.preview && (
                    <button
                      onClick={() => setPreviewFile(file)}
                      className="p-1.5 text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(file.id)}
                    className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewFile && previewFile.preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewFile(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setPreviewFile(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={previewFile.preview}
                alt={previewFile.name}
                className="w-full h-full object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
