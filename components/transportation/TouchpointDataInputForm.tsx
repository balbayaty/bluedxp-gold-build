/**
 * Touchpoint Data Input Form
 *
 * Comprehensive form for entering touchpoint data including:
 * - Basic information
 * - Location and coordinates
 * - Operating hours
 * - Capacity and capabilities
 * - Restrictions and requirements
 * - Compliance program benefits
 *
 * World-Class UX with descriptive tooltips
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  Building,
  Shield,
  AlertTriangle,
  Info,
  Save,
  Calendar,
} from "lucide-react";
import type {
  Touchpoint,
  OperatingHours,
  TouchpointType,
} from "@/types/touchpoint";

interface TouchpointDataInputFormProps {
  onSubmit?: (data: TouchpointFormData) => void;
  initialData?: Partial<TouchpointFormData>;
  mode?: "create" | "edit";
}

export interface TouchpointFormData {
  // Basic Info
  code: string;
  name: string;
  nameLocal?: string;
  type: TouchpointType;
  country: string;

  // Location
  address: {
    street: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
  timezone: string;

  // Operating Hours
  operatingHours: OperatingHours;

  // Capacity
  capacity: {
    dailyVehicles?: number;
    dailyContainers?: number;
    dailyShipments?: number;
    storageCapacity?: number;
  };

  // Capabilities
  capabilities: string[];
  features: string[];

  // Restrictions
  restrictions: Array<{
    type: string;
    description: string;
  }>;

  // Requirements
  requiredDocuments: Array<{
    type: string;
    name: string;
    required: boolean;
  }>;

  // Compliance Programs
  preferredPrograms: string[];

  // Contact
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };

  // Notes
  notes?: string;
}

export default function TouchpointDataInputForm({
  onSubmit,
  initialData,
  mode = "create",
}: TouchpointDataInputFormProps) {
  const [formData, setFormData] = useState<TouchpointFormData>({
    code: initialData?.code || "",
    name: initialData?.name || "",
    nameLocal: initialData?.nameLocal,
    type: initialData?.type || "FACILITY",
    country: initialData?.country || "SA",
    address: initialData?.address || {
      street: "",
      city: "",
      country: "Saudi Arabia",
    },
    coordinates: initialData?.coordinates || { lat: 0, lng: 0 },
    timezone: initialData?.timezone || "Asia/Riyadh",
    operatingHours: initialData?.operatingHours || {
      monday: { open: "08:00", close: "17:00", closed: false },
      tuesday: { open: "08:00", close: "17:00", closed: false },
      wednesday: { open: "08:00", close: "17:00", closed: false },
      thursday: { open: "08:00", close: "17:00", closed: false },
      friday: { open: "08:00", close: "17:00", closed: false },
      saturday: { open: "08:00", close: "17:00", closed: false },
      sunday: { open: "08:00", close: "17:00", closed: false },
      timezone: "Asia/Riyadh",
    },
    capacity: initialData?.capacity || {},
    capabilities: initialData?.capabilities || [],
    features: initialData?.features || [],
    restrictions: initialData?.restrictions || [],
    requiredDocuments: initialData?.requiredDocuments || [],
    preferredPrograms: initialData?.preferredPrograms || [],
    contact: initialData?.contact || {},
    notes: initialData?.notes,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};
    if (!formData.code.trim()) {
      newErrors.code = "Touchpoint code is required";
    }
    if (!formData.name.trim()) {
      newErrors.name = "Touchpoint name is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit?.(formData);
  };

  const days = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Touchpoint Code *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., BCP-001"
            />
            {errors.code && (
              <p className="text-sm text-red-500 mt-1">{errors.code}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Unique code for this touchpoint (e.g., border crossing point code)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Touchpoint Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as TouchpointType,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="BORDER">Border Crossing Point</option>
              <option value="FACILITY">Facility</option>
              <option value="BONDED_WAREHOUSE">Bonded Warehouse</option>
              <option value="REGULATORY_OFFICE">Regulatory Office</option>
              <option value="INSPECTION_FACILITY">Inspection Facility</option>
              <option value="FREE_ZONE">Free Zone</option>
              <option value="CUSTOMS_OFFICE">Customs Office</option>
              <option value="PORT">Port</option>
              <option value="AIRPORT">Airport</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Al Khafji Border Crossing Point"
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name}</p>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-500" />
          Location
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Street Address
            </label>
            <input
              type="text"
              value={formData.address.street}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, street: e.target.value },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              City *
            </label>
            <input
              type="text"
              value={formData.address.city}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, city: e.target.value },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Latitude
            </label>
            <input
              type="number"
              value={formData.coordinates.lat}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  coordinates: {
                    ...formData.coordinates,
                    lat: Number(e.target.value),
                  },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              step="0.000001"
            />
            <p className="text-xs text-gray-500 mt-1">
              GPS coordinates for accurate route planning and geofencing
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Longitude
            </label>
            <input
              type="number"
              value={formData.coordinates.lng}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  coordinates: {
                    ...formData.coordinates,
                    lng: Number(e.target.value),
                  },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              step="0.000001"
            />
          </div>
        </div>
      </div>

      {/* Operating Hours */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          Operating Hours
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Set operating hours for each day. The system uses this to calculate
          wait times and optimize arrival times.
        </p>

        <div className="space-y-3">
          {days.map((day) => {
            const dayHours = formData.operatingHours[day.key];
            return (
              <div
                key={day.key}
                className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="w-24 font-medium text-sm">{day.label}</div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!dayHours?.closed}
                    onChange={(e) => {
                      const newHours = { ...formData.operatingHours };
                      newHours[day.key] = {
                        ...dayHours,
                        closed: !e.target.checked,
                        open: dayHours?.open || "08:00",
                        close: dayHours?.close || "17:00",
                      };
                      setFormData({ ...formData, operatingHours: newHours });
                    }}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Open</span>
                </label>
                {!dayHours?.closed && (
                  <>
                    <input
                      type="time"
                      value={dayHours?.open || "08:00"}
                      onChange={(e) => {
                        const newHours = { ...formData.operatingHours };
                        newHours[day.key] = {
                          ...dayHours,
                          open: e.target.value,
                          close: dayHours?.close || "17:00",
                        };
                        setFormData({ ...formData, operatingHours: newHours });
                      }}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={dayHours?.close || "17:00"}
                      onChange={(e) => {
                        const newHours = { ...formData.operatingHours };
                        newHours[day.key] = {
                          ...dayHours,
                          open: dayHours?.open || "08:00",
                          close: e.target.value,
                        };
                        setFormData({ ...formData, operatingHours: newHours });
                      }}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Capacity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Building className="w-5 h-5 text-blue-500" />
          Capacity
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Define capacity limits. The system uses this to predict wait times and
          recommend arrival times.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Daily Vehicles
            </label>
            <input
              type="number"
              value={formData.capacity.dailyVehicles || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  capacity: {
                    ...formData.capacity,
                    dailyVehicles: Number(e.target.value),
                  },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum number of vehicles that can be processed per day
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Daily Containers
            </label>
            <input
              type="number"
              value={formData.capacity.dailyContainers || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  capacity: {
                    ...formData.capacity,
                    dailyContainers: Number(e.target.value),
                  },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Daily Shipments
            </label>
            <input
              type="number"
              value={formData.capacity.dailyShipments || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  capacity: {
                    ...formData.capacity,
                    dailyShipments: Number(e.target.value),
                  },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Compliance Programs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-500" />
          Preferred Compliance Programs
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Select compliance programs that provide benefits at this touchpoint
          (e.g., faster processing for AEO members).
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["AEO", "GOLDEN_LIST", "TIR", "WHITE_LIST", "GREEN_LANE"].map(
            (program) => (
              <label
                key={program}
                className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <input
                  type="checkbox"
                  checked={formData.preferredPrograms.includes(program)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        preferredPrograms: [
                          ...formData.preferredPrograms,
                          program,
                        ],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        preferredPrograms: formData.preferredPrograms.filter(
                          (p) => p !== program,
                        ),
                      });
                    }
                  }}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium">{program}</span>
              </label>
            ),
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4">Contact Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.contact.phone || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contact: { ...formData.contact, phone: e.target.value },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.contact.email || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contact: { ...formData.contact, email: e.target.value },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.contact.website || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contact: { ...formData.contact, website: e.target.value },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
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
          {mode === "create" ? "Create Touchpoint" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
