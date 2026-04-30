/**
 * Order Timeline View Component
 * Visualizes order lifecycle from creation to delivery
 */

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { format, differenceInHours, differenceInDays } from "date-fns";
import type { ASNData, OrderStatus } from "@/types/asn";

interface OrderTimelineViewProps {
  orders: ASNData[];
  onOrderClick?: (order: ASNData) => void;
}

export default function OrderTimelineView({
  orders,
  onOrderClick,
}: OrderTimelineViewProps) {
  const timelineData = useMemo(() => {
    return orders.map((order) => {
      const orderStatus = (order.orderStatus || order.status) as OrderStatus;
      const stages = [
        {
          id: "created",
          label: "Created",
          date: order.createdAt,
          status: "completed" as const,
          icon: "ri-file-add-line",
        },
        {
          id: "confirmed",
          label: "Confirmed",
          date: order.confirmedAt || order.createdAt,
          status:
            orderStatus === "CANCELLED"
              ? ("skipped" as const)
              : orderStatus === "CONFIRMED" ||
                  orderStatus === "PICK_RELEASED" ||
                  orderStatus === "PICKING" ||
                  orderStatus === "PICKED" ||
                  orderStatus === "DISPATCHED" ||
                  orderStatus === "DELIVERED" ||
                  orderStatus === "COMPLETED"
                ? ("completed" as const)
                : ("pending" as const),
          icon: "ri-checkbox-circle-line",
        },
        {
          id: "picking",
          label: "Picking",
          date: order.pickingStartedAt,
          status:
            orderStatus === "PICKING" ||
            orderStatus === "PICKED" ||
            orderStatus === "QC_IN_PROGRESS" ||
            orderStatus === "QC_COMPLETED" ||
            orderStatus === "READY_FOR_DISPATCH" ||
            orderStatus === "DISPATCHED" ||
            orderStatus === "IN_TRANSIT" ||
            orderStatus === "DELIVERED" ||
            orderStatus === "COMPLETED"
              ? ("completed" as const)
              : orderStatus === "PICK_RELEASED"
                ? ("in-progress" as const)
                : ("pending" as const),
          icon: "ri-shopping-cart-line",
        },
        {
          id: "packing",
          label: "Packing",
          date: order.packingStartedAt,
          status:
            orderStatus === "QC_COMPLETED" ||
            orderStatus === "READY_FOR_DISPATCH" ||
            orderStatus === "DISPATCHED" ||
            orderStatus === "IN_TRANSIT" ||
            orderStatus === "DELIVERED" ||
            orderStatus === "COMPLETED"
              ? ("completed" as const)
              : orderStatus === "QC_IN_PROGRESS"
                ? ("in-progress" as const)
                : ("pending" as const),
          icon: "ri-box-3-line",
        },
        {
          id: "shipped",
          label: "Shipped",
          date: order.shippedAt || order.dispatchDate,
          status:
            orderStatus === "DISPATCHED" ||
            orderStatus === "IN_TRANSIT" ||
            orderStatus === "DELIVERED" ||
            orderStatus === "COMPLETED"
              ? ("completed" as const)
              : orderStatus === "READY_FOR_DISPATCH"
                ? ("in-progress" as const)
                : ("pending" as const),
          icon: "ri-truck-line",
        },
        {
          id: "delivered",
          label: "Delivered",
          date: order.deliveredAt || order.actualDeliveryDate,
          status:
            orderStatus === "DELIVERED" || orderStatus === "COMPLETED"
              ? ("completed" as const)
              : ("pending" as const),
          icon: "ri-check-double-line",
        },
      ].filter((stage) => stage.date || stage.status === "pending");

      return {
        order,
        stages,
        totalDuration:
          (order.deliveredAt || order.actualDeliveryDate) && order.createdAt
            ? differenceInDays(
                new Date(
                  order.deliveredAt || order.actualDeliveryDate || new Date(),
                ),
                new Date(order.createdAt),
              )
            : order.createdAt
              ? differenceInDays(new Date(), new Date(order.createdAt))
              : 0,
      };
    });
  }, [orders]);

  const getStatusColor = (
    status: "completed" | "in-progress" | "pending" | "skipped",
  ) => {
    switch (status) {
      case "completed":
        return "bg-green-500 border-green-600";
      case "in-progress":
        return "bg-blue-500 border-blue-600";
      case "skipped":
        return "bg-gray-400 border-gray-500";
      default:
        return "bg-gray-300 border-gray-400";
    }
  };

  const getStatusIcon = (
    status: "completed" | "in-progress" | "pending" | "skipped",
  ) => {
    switch (status) {
      case "completed":
        return "ri-checkbox-circle-fill";
      case "in-progress":
        return "ri-loader-4-line animate-spin";
      case "skipped":
        return "ri-close-circle-line";
      default:
        return "ri-circle-line";
    }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
        <i className="ri-inbox-line text-4xl text-[#9ca3af] mb-4"></i>
        <p className="text-[#9ca3af]">No orders to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {timelineData.map(({ order, stages, totalDuration }) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-cyan-500/50 transition-all cursor-pointer"
          onClick={() => onOrderClick?.(order)}
        >
          {/* Order Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-semibold text-white font-mono">
                {order.documentNumber}
              </h4>
              <p className="text-sm text-[#9ca3af] mt-1">
                {order.customerName || "N/A"}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-[#9ca3af]">
                {totalDuration > 0 ? `${totalDuration} days` : "In progress"}
              </div>
              <div
                className={`px-3 py-1 rounded text-xs font-medium mt-2 ${
                  orderStatus === "DELIVERED" || orderStatus === "COMPLETED"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : orderStatus === "DISPATCHED" ||
                        orderStatus === "IN_TRANSIT"
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : orderStatus === "PICKING" ||
                          orderStatus === "PICKED" ||
                          orderStatus === "QC_IN_PROGRESS"
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        : orderStatus === "CANCELLED"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                }`}
              >
                {orderStatus}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10" />

            {/* Stages */}
            <div className="space-y-6">
              {stages.map((stage, idx) => (
                <div key={stage.id} className="relative flex items-start gap-4">
                  {/* Stage Icon */}
                  <div
                    className={`relative z-10 w-12 h-12 rounded-full border-4 flex items-center justify-center ${getStatusColor(stage.status)}`}
                  >
                    <i
                      className={`${getStatusIcon(stage.status)} text-white text-lg`}
                    ></i>
                  </div>

                  {/* Stage Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="text-sm font-semibold text-white">
                        {stage.label}
                      </h5>
                      {stage.date && (
                        <span className="text-xs text-[#9ca3af]">
                          {format(new Date(stage.date), "MMM dd, yyyy HH:mm")}
                        </span>
                      )}
                    </div>
                    {stage.date && idx > 0 && stages[idx - 1].date && (
                      <div className="text-xs text-[#9ca3af]">
                        {differenceInHours(
                          new Date(stage.date),
                          new Date(stages[idx - 1].date),
                        )}{" "}
                        hours from previous stage
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-[#9ca3af]">Items</div>
              <div className="text-white font-medium">
                {order.items?.length || 0}
              </div>
            </div>
            <div>
              <div className="text-[#9ca3af]">Total Value</div>
              <div className="text-white font-medium">
                {order.totalValue
                  ? `$${order.totalValue.toFixed(2)}`
                  : order.totalAmount
                    ? `$${order.totalAmount.toFixed(2)}`
                    : "N/A"}
              </div>
            </div>
            <div>
              <div className="text-[#9ca3af]">Priority</div>
              <div className="text-white font-medium">
                {order.priority || "NORMAL"}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
