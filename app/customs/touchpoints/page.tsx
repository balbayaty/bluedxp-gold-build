/**
 * Touchpoints Page
 */

"use client";

import TouchpointMap from "@/components/customs/TouchpointMap";
import { FiMapPin } from "react-icons/fi";

export default function TouchpointsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-3">
            <FiMapPin className="text-cyan-400" />
            <span>Touchpoint Intelligence</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Real-time border, facility, and warehouse intelligence
          </p>
        </div>

        <div className="h-[calc(100vh-200px)]">
          <TouchpointMap />
        </div>
      </div>
    </div>
  );
}
