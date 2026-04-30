"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { exportToCSV, exportToExcel, exportToPDF } from "@/utils/exportUtils";

interface ExportButtonProps {
  data: any[];
  columns: Array<{ key: string; label: string }>;
  filename?: string;
  title?: string;
  className?: string;
}

export default function ExportButton({
  data,
  columns,
  filename = "export",
  title = "Export",
  className = "",
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    switch (format) {
      case "csv":
        exportToCSV(data, columns, { filename });
        break;
      case "excel":
        exportToExcel(data, columns, { filename });
        break;
      case "pdf":
        exportToPDF(title, data, columns, { filename });
        break;
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium hover:bg-cyan-600/30 transition-colors flex items-center gap-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <i className="ri-download-line"></i>
        Export
        <i
          className={`ri-arrow-down-s-line transition-transform ${isOpen ? "rotate-180" : ""}`}
        ></i>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-2 min-w-[150px] z-50 shadow-xl"
          >
            <button
              onClick={() => handleExport("csv")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <i className="ri-file-text-line text-green-400"></i>
              <span className="text-white text-sm">Export CSV</span>
            </button>
            <button
              onClick={() => handleExport("excel")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <i className="ri-file-excel-line text-green-400"></i>
              <span className="text-white text-sm">Export Excel</span>
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <i className="ri-file-pdf-line text-red-400"></i>
              <span className="text-white text-sm">Export PDF</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
