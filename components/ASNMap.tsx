"use client";

import { motion } from "framer-motion";
import { ASNData } from "@/types/asn";

interface ASNMapProps {
  data: ASNData[];
}

export default function ASNMap({ data }: ASNMapProps) {
  // This is a simplified map view - in production, you'd use a real map library like Google Maps or Mapbox
  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-500";
      case "in-transit":
        return "bg-blue-500";
      case "pending":
        return "bg-yellow-500";
      case "delayed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#1E293B] border border-[#334155] rounded-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Shipment Locations</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-400">Delivered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-400">In Transit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-400">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-400">Delayed</span>
          </div>
        </div>
      </div>

      {/* Map Container - In production, replace with actual map component */}
      <div
        className="relative bg-[#0F172A] border border-[#334155] rounded-lg overflow-hidden"
        style={{ height: "500px" }}
      >
        {/* Simplified map visualization */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <i className="ri-map-line text-6xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">Interactive Map View</p>
            <p className="text-gray-500 text-sm mt-2">
              Integrate with Google Maps or Mapbox for real-time tracking
            </p>
          </div>
        </div>

        {/* Shipment markers */}
        {data.map((asn, index) => (
          <motion.div
            key={asn.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="absolute"
            style={{
              left: `${30 + (index % 3) * 30}%`,
              top: `${20 + Math.floor(index / 3) * 30}%`,
            }}
          >
            <div className="relative group">
              <div
                className={`w-4 h-4 rounded-full ${getStatusColor(asn.status)} cursor-pointer hover:scale-150 transition-transform shadow-lg`}
              >
                <div className="absolute inset-0 rounded-full animate-ping opacity-75"></div>
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3 min-w-[200px] shadow-xl">
                  <div className="text-white text-sm font-semibold mb-1">
                    {asn.documentNumber}
                  </div>
                  <div className="text-gray-400 text-xs mb-2">
                    {asn.vendorName}
                  </div>
                  <div className="text-gray-400 text-xs">
                    <div>Destination: {asn.destination}</div>
                    <div>Status: {asn.status}</div>
                    <div>Items: {asn.totalItems || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Shipment List */}
      <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((asn) => (
          <motion.div
            key={asn.id}
            whileHover={{ y: -4 }}
            className="bg-[#1E293B] border border-[#334155] rounded-lg p-4 hover:border-blue-500/50 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-white font-semibold">
                  {asn.documentNumber}
                </div>
                <div className="text-gray-400 text-sm">
                  {asn.shipmentNumber || asn.trackingNumber || "N/A"}
                </div>
              </div>
              <div
                className={`w-3 h-3 rounded-full ${getStatusColor(asn.status)}`}
              ></div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Vendor:</span>
                <span className="text-white">{asn.vendorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Destination:</span>
                <span className="text-white">{asn.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Location:</span>
                <span className="text-white">
                  {asn.location
                    ? `${asn.location.lat.toFixed(2)}, ${asn.location.lng.toFixed(2)}`
                    : "N/A"}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
