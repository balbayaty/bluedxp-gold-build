"use client";

import React, { useState } from "react";
import type { MessagingType, MessagingContext } from "@/types/brand-messaging";

export const BatchGenerator: React.FC = () => {
  const [items, setItems] = useState<
    Array<{ type: MessagingType; context: MessagingContext }>
  >([
    {
      type: "module_header",
      context: {
        moduleId: "wms",
        moduleName: "Warehouse Management",
        language: "both",
      },
    },
  ]);
  const [results, setResults] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [parallel, setParallel] = useState(true);
  const [consistencyCheck, setConsistencyCheck] = useState(true);

  const addItem = () => {
    setItems([
      ...items,
      { type: "module_header", context: { language: "both", metadata: {} } },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    if (field === "type") {
      newItems[index].type = value;
    } else {
      newItems[index].context = { ...newItems[index].context, [field]: value };
    }
    setItems(newItems);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/brand-messaging/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          parallel,
          consistencyCheck,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setResults(result.data.messages || []);
      }
    } catch (error) {
      console.error("Batch generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Batch Generate</h2>
            <p className="text-slate-400 text-sm">
              Generate multiple messages at once
            </p>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={parallel}
                onChange={(e) => setParallel(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-600 rounded"
              />
              <span className="text-sm text-slate-300">Parallel</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={consistencyCheck}
                onChange={(e) => setConsistencyCheck(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-600 rounded"
              />
              <span className="text-sm text-slate-300">Consistency Check</span>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-slate-900 rounded-lg p-4 border border-slate-600"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-300">
                  Item {index + 1}
                </span>
                <button
                  onClick={() => removeItem(index)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Type
                  </label>
                  <select
                    value={item.type}
                    onChange={(e) => updateItem(index, "type", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white"
                  >
                    <option value="module_header">Module Header</option>
                    <option value="empty_state">Empty State</option>
                    <option value="loading_state">Loading State</option>
                    <option value="success_message">Success Message</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Module Name
                  </label>
                  <input
                    type="text"
                    value={item.context.moduleName || ""}
                    onChange={(e) =>
                      updateItem(index, "moduleName", e.target.value)
                    }
                    placeholder="Warehouse Management"
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={addItem}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            + Add Item
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || items.length === 0}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? "Generating..." : "Generate All"}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold mb-4">
            Results ({results.length})
          </h3>
          <div className="space-y-4">
            {results.map((message, index) => (
              <div
                key={index}
                className="bg-slate-900 rounded-lg p-4 border border-slate-600"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">English</div>
                    <div className="text-sm text-white">
                      {message.content?.en || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Arabic</div>
                    <div className="text-sm text-white" dir="rtl">
                      {message.content?.ar || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
