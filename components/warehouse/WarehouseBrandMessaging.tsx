"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { warehouseBrandMessagingIntegration } from "@/lib/services/wms/brandMessagingIntegration";
import type {
  WarehouseBrandMessage,
  WarehouseBrandMessagingStats,
} from "@/lib/services/wms/brandMessagingIntegration";

interface WarehouseBrandMessagingProps {
  warehouseId: string;
}

export default function WarehouseBrandMessaging({
  warehouseId,
}: WarehouseBrandMessagingProps) {
  const [stats, setStats] = useState<WarehouseBrandMessagingStats | null>(null);
  const [messages, setMessages] = useState<WarehouseBrandMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [warehouseId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, messagesData] = await Promise.all([
        warehouseBrandMessagingIntegration.getStats(warehouseId),
        warehouseBrandMessagingIntegration.getRecentMessages(warehouseId, 20),
      ]);
      setStats(statsData);
      setMessages(messagesData);
    } catch (error) {
      console.error("Error loading brand messaging data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading brand messaging...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Total Messages</div>
            <div className="text-2xl font-bold text-white">
              {stats.totalMessages}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Last 24 Hours</div>
            <div className="text-2xl font-bold text-cyan-400">
              {stats.last24Hours}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Avg Quality Score</div>
            <div className="text-2xl font-bold text-yellow-400">
              {Math.round(stats.averageQuality * 100)}%
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-lg bg-white/5 border border-white/10"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <i className="ri-message-2-line mr-2 text-purple-400"></i>
          Recent Brand Messages
        </h3>
        <div className="space-y-2">
          {messages.length > 0 ? (
            messages.map((message) => (
              <div
                key={message.id}
                className="p-3 rounded bg-black/20 border border-white/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-white font-medium">{message.type}</div>
                  <div className="text-xs text-gray-500">
                    {message.sentAt
                      ? new Date(message.sentAt).toLocaleString()
                      : "Pending"}
                  </div>
                </div>
                <div className="text-sm text-gray-300">
                  {message.message.content?.en ||
                    message.message.content?.ar ||
                    "No content"}
                </div>
                {message.message.quality && (
                  <div className="text-xs text-gray-500 mt-2">
                    Quality:{" "}
                    {Math.round((message.message.quality.score || 0) * 100)}%
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-center py-8">
              No messages yet
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
