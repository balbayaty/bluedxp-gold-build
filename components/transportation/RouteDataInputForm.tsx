/**
 * Route Data Input Form
 *
 * Comprehensive form for entering route data including:
 * - Origin and destination
 * - Waypoints
 * - Cargo details
 * - Constraints (truck bans, opening hours, etc.)
 * - Compliance programs
 *
 * World-Class UX with descriptive tooltips
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Package,
  Calendar,
  Shield,
  AlertTriangle,
  Info,
  Plus,
  X,
  Save,
} from "lucide-react";
import type { Location, TransportMode, ShipmentType } from "@/types/tms";

interface RouteDataInputFormProps {
  onSubmit?: (data: RouteFormData) => void;
  initialData?: Partial<RouteFormData>;
  mode?: "create" | "edit";
}

export interface RouteFormData {
  // Basic Info
  name: string;
  description?: string;

  // Route
  origin: Location;
  destination: Location;
  waypoints: Location[];
  mode: TransportMode;
  type: ShipmentType;

  // Cargo
  cargo: {
    weight: number;
    volume: number;
    value?: number;
    hazmat: boolean;
    temperatureControlled: boolean;
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: "CM" | "M";
    };
  };

  // Constraints (manual entry)
  constraints: {
    truckBans?: Array<{
      location: string;
      days: string[];
      timeRange: { start: string; end: string };
      description: string;
    }>;
    facilityHours?: Array<{
      facilityName: string;
      operatingHours: any;
    }>;
  };

  // Compliance Programs
  compliancePrograms: string[];

  // Preferences
  preferences: {
    avoidTruckBans: boolean;
    prioritizeFastest: boolean;
    minimizeCost: boolean;
    maximizeReliability: boolean;
  };

  // Metadata
  tags?: string[];
  notes?: string;
}

export default function RouteDataInputForm({
  onSubmit,
  initialData,
  mode = "create",
}: RouteDataInputFormProps) {
  const [formData, setFormData] = useState<RouteFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    origin: initialData?.origin || {
      id: "origin-1",
      name: "",
      address: {
        street: "",
        city: "",
        country: "Saudi Arabia",
        countryCode: "SA",
        postalCode: "",
      },
      type: "ORIGIN",
    },
    destination: initialData?.destination || {
      id: "dest-1",
      name: "",
      address: {
        street: "",
        city: "",
        country: "Saudi Arabia",
        countryCode: "SA",
        postalCode: "",
      },
      type: "DESTINATION",
    },
    waypoints: initialData?.waypoints || [],
    mode: initialData?.mode || "LAND",
    type: initialData?.type || "FTL",
    cargo: initialData?.cargo || {
      weight: 10000,
      volume: 50,
      hazmat: false,
      temperatureControlled: false,
    },
    constraints: initialData?.constraints || {},
    compliancePrograms: initialData?.compliancePrograms || [],
    preferences: initialData?.preferences || {
      avoidTruckBans: true,
      prioritizeFastest: false,
      minimizeCost: true,
      maximizeReliability: false,
    },
    tags: initialData?.tags || [],
    notes: initialData?.notes || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Route name is required";
    }
    if (!formData.origin.name.trim()) {
      newErrors.origin = "Origin is required";
    }
    if (!formData.destination.name.trim()) {
      newErrors.destination = "Destination is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit?.(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4">Basic Information</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Route Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Riyadh to Jeddah - Standard Route"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              A descriptive name for this route to help identify it later
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Additional details about this route..."
            />
          </div>
        </div>
      </div>

      {/* Origin & Destination */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-500" />
          Route Locations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Origin *
            </label>
            <input
              type="text"
              value={formData.origin.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  origin: { ...formData.origin, name: e.target.value },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter origin city or address"
            />
            {errors.origin && (
              <p className="text-sm text-red-500 mt-1">{errors.origin}</p>
            )}
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3" />
              The system will automatically geocode the address and identify
              nearby constraints
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Destination *
            </label>
            <input
              type="text"
              value={formData.destination.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  destination: {
                    ...formData.destination,
                    name: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter destination city or address"
            />
            {errors.destination && (
              <p className="text-sm text-red-500 mt-1">{errors.destination}</p>
            )}
          </div>
        </div>

        {/* Waypoints */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Waypoints (Optional)
          </label>
          <div className="space-y-2">
            {formData.waypoints.map((waypoint, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={waypoint.name}
                  onChange={(e) => {
                    const newWaypoints = [...formData.waypoints];
                    newWaypoints[index] = { ...waypoint, name: e.target.value };
                    setFormData({ ...formData, waypoints: newWaypoints });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={`Waypoint ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const newWaypoints = formData.waypoints.filter(
                      (_, i) => i !== index,
                    );
                    setFormData({ ...formData, waypoints: newWaypoints });
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setFormData({
                  ...formData,
                  waypoints: [
                    ...formData.waypoints,
                    {
                      id: `waypoint-${Date.now()}`,
                      name: "",
                      address: {
                        street: "",
                        city: "",
                        country: "Saudi Arabia",
                        countryCode: "SA",
                        postalCode: "",
                      },
                      type: "WAYPOINT",
                    },
                  ],
                });
              }}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Waypoint
            </button>
          </div>
        </div>
      </div>

      {/* Transport Mode & Type */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4">Transport Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transport Mode *
            </label>
            <select
              value={formData.mode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mode: e.target.value as TransportMode,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="LAND">Road Transport</option>
              <option value="AIR">Air Freight</option>
              <option value="SEA">Sea Freight</option>
              <option value="RAIL">Rail Transport</option>
              <option value="MULTIMODAL">Multimodal</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Primary transport mode for this route
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Shipment Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as ShipmentType,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="FTL">Full Truck Load (FTL)</option>
              <option value="LTL">Less Than Truck Load (LTL)</option>
              <option value="FCL">Full Container Load (FCL)</option>
              <option value="LCL">Less Than Container Load (LCL)</option>
              <option value="AIR_EXPRESS">Air Express</option>
              <option value="AIR_STANDARD">Air Standard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cargo Details */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-500" />
          Cargo Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Weight (kg) *
            </label>
            <input
              type="number"
              value={formData.cargo.weight}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cargo: { ...formData.cargo, weight: Number(e.target.value) },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1">
              Total weight in kilograms. Used to check weight restrictions.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Volume (m³) *
            </label>
            <input
              type="number"
              value={formData.cargo.volume}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cargo: { ...formData.cargo, volume: Number(e.target.value) },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.cargo.hazmat}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cargo: { ...formData.cargo, hazmat: e.target.checked },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Hazmat Cargo
            </span>
          </label>
          <p className="text-xs text-gray-500 ml-6">
            Check if cargo contains hazardous materials. This affects route
            restrictions and processing times.
          </p>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.cargo.temperatureControlled}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cargo: {
                    ...formData.cargo,
                    temperatureControlled: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Temperature Controlled
            </span>
          </label>
          <p className="text-xs text-gray-500 ml-6">
            Check if cargo requires temperature control. Requires specialized
            vehicles and facilities.
          </p>
        </div>
      </div>

      {/* Compliance Programs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-500" />
          Compliance Programs
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Select compliance programs you're enrolled in. These will reduce
          processing times and restrictions.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            "AEO",
            "GOLDEN_LIST",
            "TIR",
            "WHITE_LIST",
            "GREEN_LANE",
            "PREFERRED_OPERATOR",
          ].map((program) => (
            <label
              key={program}
              className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <input
                type="checkbox"
                checked={formData.compliancePrograms.includes(program)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      compliancePrograms: [
                        ...formData.compliancePrograms,
                        program,
                      ],
                    });
                  } else {
                    setFormData({
                      ...formData,
                      compliancePrograms: formData.compliancePrograms.filter(
                        (p) => p !== program,
                      ),
                    });
                  }
                }}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">{program}</span>
            </label>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Compliance Program Benefits:</strong> Enrolled programs
              can reduce processing times by up to 50% and eliminate certain
              restrictions. The system will automatically apply these benefits
              when planning routes.
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4">Route Preferences</h3>

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <input
              type="checkbox"
              checked={formData.preferences.avoidTruckBans}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  preferences: {
                    ...formData.preferences,
                    avoidTruckBans: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded mt-0.5"
            />
            <div className="flex-1">
              <div className="font-medium text-sm">Avoid Truck Bans</div>
              <div className="text-xs text-gray-500 mt-1">
                Route will automatically avoid areas with active truck bans,
                even if it means a longer route
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <input
              type="checkbox"
              checked={formData.preferences.minimizeCost}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  preferences: {
                    ...formData.preferences,
                    minimizeCost: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded mt-0.5"
            />
            <div className="flex-1">
              <div className="font-medium text-sm">Minimize Cost</div>
              <div className="text-xs text-gray-500 mt-1">
                Prioritize cost-effective routes over fastest routes
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <input
              type="checkbox"
              checked={formData.preferences.prioritizeFastest}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  preferences: {
                    ...formData.preferences,
                    prioritizeFastest: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded mt-0.5"
            />
            <div className="flex-1">
              <div className="font-medium text-sm">Prioritize Fastest</div>
              <div className="text-xs text-gray-500 mt-1">
                Choose the fastest route even if it costs more
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <input
              type="checkbox"
              checked={formData.preferences.maximizeReliability}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  preferences: {
                    ...formData.preferences,
                    maximizeReliability: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded mt-0.5"
            />
            <div className="flex-1">
              <div className="font-medium text-sm">Maximize Reliability</div>
              <div className="text-xs text-gray-500 mt-1">
                Prioritize routes with higher on-time delivery rates
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4">Additional Notes</h3>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Any additional information about this route..."
        />
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {mode === "create" ? "Create Route" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
