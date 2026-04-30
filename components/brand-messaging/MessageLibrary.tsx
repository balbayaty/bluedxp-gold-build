"use client";

import React, { useState, useEffect } from "react";
import type { BrandMessage } from "@/types/brand-messaging";

export const MessageLibrary: React.FC = () => {
  const [messages, setMessages] = useState<BrandMessage[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("all");

  // In production, this would fetch from API/database
  useEffect(() => {
    // Mock data for demonstration
    setMessages([]);
  }, []);

  const filteredMessages = messages.filter((msg) => {
    const matchesFilter =
      !filter ||
      msg.content.en.toLowerCase().includes(filter.toLowerCase()) ||
      msg.content.ar.includes(filter);
    const matchesType = selectedType === "all" || msg.type === selectedType;
    return matchesFilter && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Message Library</h2>
            <p className="text-slate-400 text-sm">
              Browse and manage generated messages
            </p>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="module_header">Module Header</option>
            <option value="empty_state">Empty State</option>
            <option value="loading_state">Loading State</option>
            <option value="success_message">Success Message</option>
          </select>
        </div>

        {filteredMessages.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <div className="text-4xl mb-4">📚</div>
            <div>No messages in library yet</div>
            <div className="text-sm mt-2">
              Generate messages to see them here
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className="bg-slate-900 rounded-lg p-4 border border-slate-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-blue-400 uppercase">
                    {message.type}
                  </span>
                  {message.metadata?.qualityScore && (
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        message.metadata.qualityScore >= 80
                          ? "bg-green-500/20 text-green-400"
                          : message.metadata.qualityScore >= 60
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {message.metadata.qualityScore}%
                    </span>
                  )}
                </div>
                <div className="text-sm text-white mb-2">
                  {message.content.en}
                </div>
                <div className="text-sm text-slate-400" dir="rtl">
                  {message.content.ar}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
