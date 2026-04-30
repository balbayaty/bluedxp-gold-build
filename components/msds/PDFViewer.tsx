/**
 * PDF Viewer Component with Annotations
 * Displays PDF documents with annotation capabilities
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Annotation {
  id: string;
  type: "highlight" | "note" | "comment";
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color?: string;
  createdAt: Date;
  createdBy: string;
}

interface PDFViewerProps {
  fileUrl: string | File;
  fileName?: string;
  annotations?: Annotation[];
  onAnnotationAdd?: (annotation: Omit<Annotation, "id" | "createdAt">) => void;
  onAnnotationDelete?: (annotationId: string) => void;
  onClose?: () => void;
  readOnly?: boolean;
}

export default function PDFViewer({
  fileUrl,
  fileName,
  annotations = [],
  onAnnotationAdd,
  onAnnotationDelete,
  onClose,
  readOnly = false,
}: PDFViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [annotationMode, setAnnotationMode] = useState<
    "none" | "highlight" | "note"
  >("none");
  const [selectedAnnotation, setSelectedAnnotation] =
    useState<Annotation | null>(null);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Convert File to URL if needed
  const [pdfUrl, setPdfUrl] = useState<string>("");

  useEffect(() => {
    if (fileUrl instanceof File) {
      const url = URL.createObjectURL(fileUrl);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPdfUrl(fileUrl);
    }
  }, [fileUrl]);

  // Handle zoom
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => setZoom(1);

  // Handle fullscreen
  const handleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Handle page navigation
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  // Handle annotation
  const handleAddAnnotation = (type: "highlight" | "note") => {
    if (readOnly) return;
    setAnnotationMode(type);
  };

  const handleDeleteAnnotation = (id: string) => {
    if (onAnnotationDelete) {
      onAnnotationDelete(id);
    }
  };

  // Filter annotations for current page
  const pageAnnotations = annotations.filter((a) => a.page === currentPage);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900/95 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h3 className="text-white font-semibold">
            {fileName || "PDF Document"}
          </h3>
          {totalPages > 0 && (
            <span className="text-gray-400 text-sm">
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Annotation Controls */}
          {!readOnly && (
            <>
              <button
                onClick={() => handleAddAnnotation("highlight")}
                className={`p-2 rounded-lg transition-colors ${
                  annotationMode === "highlight"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
                title="Add Highlight"
              >
                <i className="ri-edit-line text-xl"></i>
              </button>
              <button
                onClick={() => handleAddAnnotation("note")}
                className={`p-2 rounded-lg transition-colors ${
                  annotationMode === "note"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
                title="Add Note"
              >
                <i className="ri-edit-line text-xl"></i>
              </button>
              <button
                onClick={() => setShowAnnotations(!showAnnotations)}
                className={`p-2 rounded-lg transition-colors ${
                  showAnnotations
                    ? "bg-gray-700 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
                title="Toggle Annotations"
              >
                <i className="ri-edit-line text-xl"></i>
              </button>
            </>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded transition-colors hover:bg-gray-700 text-gray-300"
              title="Zoom Out"
            >
              <i className="ri-zoom-out-line text-lg"></i>
            </button>
            <span className="px-3 text-sm text-gray-300 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 rounded transition-colors hover:bg-gray-700 text-gray-300"
              title="Zoom In"
            >
              <i className="ri-zoom-in-line text-lg"></i>
            </button>
            <button
              onClick={handleZoomReset}
              className="px-2 py-1 text-xs text-gray-400 hover:text-gray-300"
              title="Reset Zoom"
            >
              Reset
            </button>
          </div>

          {/* Fullscreen */}
          <button
            onClick={handleFullscreen}
            className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
            title="Toggle Fullscreen"
          >
            <i className="ri-fullscreen-line text-xl"></i>
          </button>

          {/* Download */}
          <a
            href={pdfUrl}
            download={fileName}
            className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
            title="Download PDF"
          >
            <i className="ri-download-line text-xl"></i>
          </a>

          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
              title="Close"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          )}
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-gray-800 p-4 flex items-center justify-center">
        <div
          className="relative bg-white shadow-2xl"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center",
            transition: "transform 0.2s",
          }}
        >
          <iframe
            ref={iframeRef}
            src={`${pdfUrl}#page=${currentPage}`}
            className="w-full h-full border-0"
            style={{
              width: "800px",
              height: "1000px",
            }}
            title="PDF Viewer"
            onLoad={() => {
              // Try to get total pages (this would need PDF.js for accurate count)
              // For now, we'll estimate or use a default
              setTotalPages((prev) => prev || 10); // Default estimate
            }}
          />
        </div>
      </div>

      {/* Page Navigation */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 p-4 bg-gray-900/95 border-t border-gray-700">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page >= 1 && page <= totalPages) {
                setCurrentPage(page);
              }
            }}
            className="w-20 px-3 py-2 rounded-lg bg-gray-800 text-white text-center border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
          <span className="text-gray-400">of {totalPages}</span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Annotations Panel */}
      {showAnnotations && pageAnnotations.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-20 right-4 bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 max-w-sm border border-gray-700 shadow-xl"
        >
          <h4 className="text-white font-semibold mb-3">
            Annotations (Page {currentPage})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {pageAnnotations.map((annotation) => (
              <div
                key={annotation.id}
                className="p-3 bg-gray-800 rounded-lg border border-gray-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          annotation.type === "highlight"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {annotation.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {annotation.createdBy}
                      </span>
                    </div>
                    {annotation.text && (
                      <p className="text-sm text-gray-300">{annotation.text}</p>
                    )}
                  </div>
                  {!readOnly && onAnnotationDelete && (
                    <button
                      onClick={() => handleDeleteAnnotation(annotation.id)}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Annotation"
                    >
                      <i className="ri-delete-bin-line text-base"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
