"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { warehouseWhatsAppIntegration } from "@/lib/services/wms/whatsappIntegration";
import type {
  WarehouseWhatsAppNotification,
  WarehouseWhatsAppStats,
} from "@/lib/services/wms/whatsappIntegration";

interface WarehouseWhatsAppIntegrationProps {
  warehouseId: string;
}

export default function WarehouseWhatsAppIntegration({
  warehouseId,
}: WarehouseWhatsAppIntegrationProps) {
  const [stats, setStats] = useState<WarehouseWhatsAppStats | null>(null);
  const [notifications, setNotifications] = useState<
    WarehouseWhatsAppNotification[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [warehouseId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, notificationsData] = await Promise.all([
        warehouseWhatsAppIntegration.getStats(warehouseId),
        warehouseWhatsAppIntegration.getRecentNotifications(warehouseId, 20),
      ]);
      setStats(statsData);
      setNotifications(notificationsData);
    } catch (error) {
      console.error("Error loading WhatsApp data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading WhatsApp integration...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Total Sent</div>
            <div className="text-2xl font-bold text-white">
              {stats.totalSent}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Total Failed</div>
            <div className="text-2xl font-bold text-red-400">
              {stats.totalFailed}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Last 24 Hours</div>
            <div className="text-2xl font-bold text-cyan-400">
              {stats.last24Hours}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Success Rate</div>
            <div className="text-2xl font-bold text-green-400">
              {stats.totalSent + stats.totalFailed > 0
                ? Math.round(
                    (stats.totalSent / (stats.totalSent + stats.totalFailed)) *
                      100,
                  )
                : 0}
              %
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
          <i className="ri-message-3-line mr-2 text-green-400"></i>
          Recent Notifications
        </h3>
        <div className="space-y-2">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="p-3 rounded bg-black/20 border border-white/5 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="text-white font-medium">
                    {notification.type}
                  </div>
                  <div className="text-sm text-gray-400">
                    {notification.message}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {notification.sentAt
                      ? new Date(notification.sentAt).toLocaleString()
                      : "Pending"}
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    notification.status === "sent"
                      ? "bg-green-500/20 text-green-400"
                      : notification.status === "failed"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {notification.status}
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-center py-8">
              No notifications yet
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
