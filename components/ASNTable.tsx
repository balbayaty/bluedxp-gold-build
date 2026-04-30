"use client";

import { motion } from "framer-motion";
import { ASNData } from "@/types/asn";
import { format, parseISO } from "date-fns";

interface ASNTableProps {
  data: ASNData[];
  gridView?: boolean;
  onStatusUpdate?: (id: string, status: ASNData["status"]) => void;
}

export default function ASNTable({
  data,
  gridView = false,
  onStatusUpdate,
}: ASNTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "in-transit":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "delayed":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-400";
      case "medium":
        return "text-yellow-400";
      case "low":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return "ri-checkbox-circle-line text-green-400";
      case "non-compliant":
        return "ri-close-circle-line text-red-400";
      case "review":
        return "ri-time-line text-yellow-400";
      default:
        return "ri-question-line text-gray-400";
    }
  };

  if (gridView) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((asn, index) => (
          <motion.div
            key={asn.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -8 }}
            className="bg-[#1E293B] border border-[#334155] rounded-lg p-6 hover:border-blue-500/50 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {asn.id}
                </h3>
                <p className="text-sm text-[#94A3B8]">{asn.shipmentNumber}</p>
              </div>
              <i
                className={`${getComplianceIcon(asn.complianceStatus)} text-2xl`}
              ></i>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8] text-sm">Supplier</span>
                <span className="text-white text-sm font-medium">
                  {asn.vendorName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8] text-sm">Destination</span>
                <span className="text-white text-sm font-medium">
                  {asn.destination || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8] text-sm">Items</span>
                <span className="text-white text-sm font-medium">
                  {asn.totalItems || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8] text-sm">Weight</span>
                <span className="text-white text-sm font-medium">
                  {asn.totalWeight} kg
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#334155]">
              <span
                className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(
                  asn.status,
                )}`}
              >
                {asn.status}
              </span>
              <span
                className={`text-sm font-medium ${getPriorityColor(asn.priority)}`}
              >
                {asn.priority} priority
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0F172A] border-b border-[#334155]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                ASN ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                Destination
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                Expected Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                Compliance
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#334155]">
            {data.map((asn, index) => (
              <motion.tr
                key={asn.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-[#0F172A] transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {asn.id}
                    </div>
                    <div className="text-xs text-[#94A3B8]">
                      {asn.shipmentNumber}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">{asn.vendorName}</div>
                  <div className="text-xs text-[#94A3B8]">{asn.carrier}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">{asn.destination}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(
                      asn.status,
                    )}`}
                  >
                    {asn.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">
                    {asn.totalItems || 0}
                  </div>
                  <div className="text-xs text-[#94A3B8]">
                    {asn.totalWeight} kg
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">
                    {format(
                      typeof asn.expectedDeliveryDate === "string"
                        ? parseISO(asn.expectedDeliveryDate)
                        : new Date(asn.expectedDeliveryDate),
                      "MMM dd, yyyy",
                    )}
                  </div>
                  {asn.actualDeliveryDate && (
                    <div className="text-xs text-green-400">
                      Delivered:{" "}
                      {format(
                        typeof asn.actualDeliveryDate === "string"
                          ? parseISO(asn.actualDeliveryDate)
                          : new Date(asn.actualDeliveryDate),
                        "MMM dd",
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`text-sm font-medium ${getPriorityColor(asn.priority)}`}
                  >
                    {asn.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <i
                    className={`${getComplianceIcon(asn.complianceStatus)} text-xl`}
                  ></i>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {onStatusUpdate && (
                      <select
                        value={asn.status}
                        onChange={(e) =>
                          onStatusUpdate(
                            asn.id,
                            e.target.value as ASNData["status"],
                          )
                        }
                        className="bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                        <option value="delayed">Delayed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="View Details"
                    >
                      <i className="ri-eye-line text-lg"></i>
                    </motion.button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
