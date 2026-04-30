/**
 * Storage Location Form Component
 * Create and edit storage locations for warehouse management
 * Migrated from chemcheck-ai/components/StorageLocationForm.tsx
 * Adapted for BlueDXP Platform
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AdvancedSmartDetectionForm from "@/components/forms/AdvancedSmartDetectionForm";

type AdvancedDetectionContext = any;

interface StorageLocation {
  id?: string;
  locationCode: string;
  warehouse: string;
  zone: string;
  aisle: string;
  rack: string;
  level: string;
  locationType: "Storage" | "Picking" | "Staging" | "Receiving" | "Shipping";
  capacity: number;
  maxWeight: number;
  length: number;
  width: number;
  height: number;
  temperatureControlled?: boolean;
  minTemperature?: number;
  maxTemperature?: number;
  hazardous?: boolean;
  requiresEquipment?: boolean;
  equipmentType?: string;
  status:
    | "AVAILABLE"
    | "OCCUPIED"
    | "FULL"
    | "NEAR_FULL"
    | "RESERVED"
    | "BLOCKED";
}

interface StorageLocationFormProps {
  onSubmit: (location: StorageLocation) => void;
  onCancel: () => void;
  initialData?: StorageLocation;
  warehouses?: Array<{ name: string; warehouse_name: string }>;
  useSmartDetection?: boolean;
  previousLocations?: StorageLocation[];
}

export default function StorageLocationForm({
  onSubmit,
  onCancel,
  initialData,
  warehouses = [],
  useSmartDetection = false,
  previousLocations = [],
}: StorageLocationFormProps) {
  const [formData, setFormData] = useState<StorageLocation>({
    locationCode: initialData?.locationCode || "",
    warehouse: initialData?.warehouse || "",
    zone: initialData?.zone || "",
    aisle: initialData?.aisle || "",
    rack: initialData?.rack || "",
    level: initialData?.level || "",
    locationType: initialData?.locationType || "Storage",
    capacity: initialData?.capacity || 1000,
    maxWeight: initialData?.maxWeight || 5000,
    length: initialData?.length || 1,
    width: initialData?.width || 1,
    height: initialData?.height || 1,
    temperatureControlled: initialData?.temperatureControlled || false,
    minTemperature: initialData?.minTemperature,
    maxTemperature: initialData?.maxTemperature,
    hazardous: initialData?.hazardous || false,
    requiresEquipment: initialData?.requiresEquipment || false,
    equipmentType: initialData?.equipmentType || "",
    status: initialData?.status || "AVAILABLE",
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch warehouses if not provided
    if (warehouses.length === 0) {
      fetch("/api/erpnext/warehouses")
        .then((res) => res.json())
        .then((data) => {
          if (data.warehouses) {
            // Update warehouses list
          }
        })
        .catch(console.error);
    }
  }, [warehouses.length]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.locationCode.trim()) {
      newErrors.locationCode = "Location code is required";
    }

    if (!formData.warehouse) {
      newErrors.warehouse = "Warehouse is required";
    }

    if (!formData.zone.trim()) {
      newErrors.zone = "Zone is required";
    }

    if (!formData.aisle.trim()) {
      newErrors.aisle = "Aisle is required";
    }

    if (!formData.rack.trim()) {
      newErrors.rack = "Rack is required";
    }

    if (!formData.level.trim()) {
      newErrors.level = "Level is required";
    }

    if (formData.capacity <= 0) {
      newErrors.capacity = "Capacity must be greater than 0";
    }

    if (formData.maxWeight <= 0) {
      newErrors.maxWeight = "Max weight must be greater than 0";
    }

    if (formData.temperatureControlled) {
      if (
        formData.minTemperature === undefined ||
        formData.maxTemperature === undefined
      ) {
        newErrors.temperature =
          "Temperature range is required for temperature-controlled locations";
      } else if (formData.minTemperature >= formData.maxTemperature) {
        newErrors.temperature =
          "Min temperature must be less than max temperature";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const generateLocationCode = () => {
    if (
      formData.warehouse &&
      formData.zone &&
      formData.aisle &&
      formData.rack &&
      formData.level
    ) {
      const code = `${formData.warehouse}-${formData.zone}-${formData.aisle.padStart(2, "0")}-${formData.rack.padStart(2, "0")}-${formData.level.padStart(2, "0")}`;
      setFormData({ ...formData, locationCode: code });
    }
  };

  useEffect(() => {
    if (!initialData?.locationCode) {
      generateLocationCode();
    }
  }, [
    formData.warehouse,
    formData.zone,
    formData.aisle,
    formData.rack,
    formData.level,
  ]);

  // Use smart detection if enabled
  if (useSmartDetection) {
    return (
      <AdvancedSmartDetectionForm
        formId={`storage-location-form-${Date.now()}`}
        fields={[
          {
            id: "locationCode",
            name: "locationCode",
            type: "text",
            label: "Location Code",
            value: formData.locationCode,
            required: true,
            placeholder: "WH-A-01-01-01",
          },
          {
            id: "warehouse",
            name: "warehouse",
            type: "select",
            label: "Warehouse",
            value: formData.warehouse,
            required: true,
            options: warehouses.map((wh) => ({
              label: wh.warehouse_name,
              value: wh.name,
            })),
          },
          {
            id: "zone",
            name: "zone",
            type: "text",
            label: "Zone",
            value: formData.zone,
            required: true,
            placeholder: "A",
          },
          {
            id: "aisle",
            name: "aisle",
            type: "text",
            label: "Aisle",
            value: formData.aisle,
            required: true,
            placeholder: "01",
          },
          {
            id: "rack",
            name: "rack",
            type: "text",
            label: "Rack",
            value: formData.rack,
            required: true,
            placeholder: "01",
          },
          {
            id: "level",
            name: "level",
            type: "text",
            label: "Level",
            value: formData.level,
            required: true,
            placeholder: "01",
          },
          {
            id: "locationType",
            name: "locationType",
            type: "select",
            label: "Location Type",
            value: formData.locationType,
            required: true,
            options: [
              { label: "Storage", value: "Storage" },
              { label: "Picking", value: "Picking" },
              { label: "Staging", value: "Staging" },
              { label: "Receiving", value: "Receiving" },
              { label: "Shipping", value: "Shipping" },
            ],
          },
          {
            id: "status",
            name: "status",
            type: "select",
            label: "Status",
            value: formData.status,
            required: true,
            options: [
              { label: "Available", value: "AVAILABLE" },
              { label: "Occupied", value: "OCCUPIED" },
              { label: "Full", value: "FULL" },
              { label: "Near Full", value: "NEAR_FULL" },
              { label: "Reserved", value: "RESERVED" },
              { label: "Blocked", value: "BLOCKED" },
            ],
          },
          {
            id: "capacity",
            name: "capacity",
            type: "number",
            label: "Capacity (units)",
            value: formData.capacity.toString(),
            required: true,
          },
          {
            id: "maxWeight",
            name: "maxWeight",
            type: "number",
            label: "Max Weight (kg)",
            value: formData.maxWeight.toString(),
            required: true,
          },
        ]}
        context={{
          formType: "OTHER",
          moduleId: "wms",
          previousForms: previousLocations.map((loc) => ({
            locationCode: loc.locationCode,
            warehouse: loc.warehouse,
            zone: loc.zone,
            aisle: loc.aisle,
            rack: loc.rack,
            level: loc.level,
            locationType: loc.locationType,
            status: loc.status,
            capacity: loc.capacity,
            maxWeight: loc.maxWeight,
          })),
          userRole: "USER",
          tenantId: "default-tenant",
        }}
        onSubmit={(data) => handleSubmit(undefined, data)}
        onCancel={onCancel}
        title={
          initialData ? "Edit Storage Location" : "Create Storage Location"
        }
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Basic Information
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Location Code *
            </label>
            <input
              type="text"
              value={formData.locationCode}
              onChange={(e) =>
                setFormData({ ...formData, locationCode: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                errors.locationCode
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="WH-A-01-01-01"
            />
            {errors.locationCode && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.locationCode}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Warehouse *
            </label>
            <select
              value={formData.warehouse}
              onChange={(e) =>
                setFormData({ ...formData, warehouse: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                errors.warehouse
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            >
              <option value="">Select Warehouse</option>
              {warehouses.map((wh) => (
                <option key={wh.name} value={wh.name}>
                  {wh.warehouse_name}
                </option>
              ))}
            </select>
            {errors.warehouse && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.warehouse}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Zone *
            </label>
            <input
              type="text"
              value={formData.zone}
              onChange={(e) =>
                setFormData({ ...formData, zone: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                errors.zone
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="A"
            />
            {errors.zone && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.zone}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Aisle *
            </label>
            <input
              type="text"
              value={formData.aisle}
              onChange={(e) =>
                setFormData({ ...formData, aisle: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                errors.aisle
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="01"
            />
            {errors.aisle && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.aisle}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rack *
            </label>
            <input
              type="text"
              value={formData.rack}
              onChange={(e) =>
                setFormData({ ...formData, rack: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                errors.rack
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="01"
            />
            {errors.rack && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.rack}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Level *
            </label>
            <input
              type="text"
              value={formData.level}
              onChange={(e) =>
                setFormData({ ...formData, level: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                errors.level
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="01"
            />
            {errors.level && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.level}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Location Type *
            </label>
            <select
              value={formData.locationType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  locationType: e.target
                    .value as StorageLocation["locationType"],
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="Storage">Storage</option>
              <option value="Picking">Picking</option>
              <option value="Staging">Staging</option>
              <option value="Receiving">Receiving</option>
              <option value="Shipping">Shipping</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as StorageLocation["status"],
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="FULL">Full</option>
              <option value="NEAR_FULL">Near Full</option>
              <option value="RESERVED">Reserved</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Capacity & Dimensions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Capacity & Dimensions
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Capacity (units) *
            </label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  capacity: parseInt(e.target.value) || 0,
                })
              }
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                errors.capacity
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              min="1"
            />
            {errors.capacity && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.capacity}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Weight (kg) *
            </label>
            <input
              type="number"
              value={formData.maxWeight}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxWeight: parseInt(e.target.value) || 0,
                })
              }
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                errors.maxWeight
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              min="1"
            />
            {errors.maxWeight && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.maxWeight}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Length (m)
            </label>
            <input
              type="number"
              value={formData.length}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  length: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              step="0.1"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Width (m)
            </label>
            <input
              type="number"
              value={formData.width}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  width: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              step="0.1"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Height (m)
            </label>
            <input
              type="number"
              value={formData.height}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  height: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              step="0.1"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Special Requirements */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Special Requirements
        </h3>

        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.temperatureControlled}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  temperatureControlled: e.target.checked,
                })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Temperature Controlled
            </span>
          </label>

          {formData.temperatureControlled && (
            <div className="grid grid-cols-2 gap-4 ml-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Min Temperature (°C)
                </label>
                <input
                  type="number"
                  value={formData.minTemperature || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minTemperature: parseFloat(e.target.value) || undefined,
                    })
                  }
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.temperature
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Temperature (°C)
                </label>
                <input
                  type="number"
                  value={formData.maxTemperature || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxTemperature: parseFloat(e.target.value) || undefined,
                    })
                  }
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.temperature
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  step="0.1"
                />
              </div>
              {errors.temperature && (
                <p className="col-span-2 mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.temperature}
                </p>
              )}
            </div>
          )}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.hazardous}
              onChange={(e) =>
                setFormData({ ...formData, hazardous: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Hazardous Material Storage
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.requiresEquipment}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  requiresEquipment: e.target.checked,
                })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Requires Special Equipment
            </span>
          </label>

          {formData.requiresEquipment && (
            <div className="ml-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Equipment Type
              </label>
              <input
                type="text"
                value={formData.equipmentType}
                onChange={(e) =>
                  setFormData({ ...formData, equipmentType: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="e.g., Forklift, Crane, Pallet Jack"
              />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {initialData ? "Update Location" : "Create Location"}
        </button>
      </div>
    </form>
  );
}
