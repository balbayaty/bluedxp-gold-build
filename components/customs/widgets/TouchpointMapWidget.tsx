/**
 * Touchpoint Map Widget (Compact version for dashboard)
 */

"use client";

import React from "react";
import { FiMapPin } from "react-icons/fi";

export default function TouchpointMapWidget() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center space-x-2">
          <FiMapPin className="text-cyan-400" />
          <span>Touchpoint Map</span>
        </h3>
      </div>

      <div className="h-64 bg-gray-800/50 rounded-lg flex items-center justify-center">
        <p className="text-gray-400">Interactive map view</p>
      </div>
    </div>
  );
}
