"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import type { BrandMessage } from "@/types/brand-messaging";

interface ExportOptionsProps {
  message: BrandMessage;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({ message }) => {
  const [exportFormat, setExportFormat] = useState<
    "json" | "markdown" | "csv" | "code"
  >("json");

  const exportData = () => {
    let content = "";
    let filename = "";
    let mimeType = "";

    switch (exportFormat) {
      case "json":
        content = JSON.stringify(message, null, 2);
        filename = `message-${message.id}.json`;
        mimeType = "application/json";
        break;
      case "markdown":
        content = `# ${message.type}\n\n## English\n${message.content.en}\n\n## Arabic\n${message.content.ar}\n\n## Metadata\n\`\`\`json\n${JSON.stringify(message.metadata, null, 2)}\n\`\`\``;
        filename = `message-${message.id}.md`;
        mimeType = "text/markdown";
        break;
      case "csv":
        content = `Type,English,Arabic,Quality Score\n${message.type},"${message.content.en}","${message.content.ar}",${message.metadata?.qualityScore || "N/A"}`;
        filename = `message-${message.id}.csv`;
        mimeType = "text/csv";
        break;
      case "code":
        content = `// Brand Message: ${message.type}\nconst message = {\n  en: "${message.content.en}",\n  ar: "${message.content.ar}",\n  type: "${message.type}"\n}`;
        filename = `message-${message.id}.ts`;
        mimeType = "text/typescript";
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (format: "en" | "ar" | "both") => {
    let text = "";
    if (format === "en") text = message.content.en;
    else if (format === "ar") text = message.content.ar;
    else text = `${message.content.en}\n\n${message.content.ar}`;

    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">Export Options</h3>

      {/* Format Selection */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {(["json", "markdown", "csv", "code"] as const).map((format) => (
          <motion.button
            key={format}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setExportFormat(format)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              exportFormat === format
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {format.toUpperCase()}
          </motion.button>
        ))}
      </div>

      {/* Quick Copy */}
      <div className="flex gap-2 mb-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => copyToClipboard("en")}
          className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
        >
          📋 Copy English
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => copyToClipboard("ar")}
          className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
        >
          📋 Copy Arabic
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => copyToClipboard("both")}
          className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
        >
          📋 Copy Both
        </motion.button>
      </div>

      {/* Export Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={exportData}
        className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all font-medium"
      >
        💾 Export as {exportFormat.toUpperCase()}
      </motion.button>
    </div>
  );
};
