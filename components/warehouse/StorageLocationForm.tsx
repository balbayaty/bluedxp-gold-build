/**
 * Comprehensive Storage Location Form Component
 * Migrated from chemcheck-ai with full BlueDXP integration
 * World's Most Comprehensive Warehouse Location Management
 * BlueDXP Platform - 4IR & 5IR Aligned • Global Support
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/Modal";
import Tooltip from "@/components/Tooltip";
import {
  GLOBAL_COUNTRIES,
  GLOBAL_CITIES,
  getCitiesByCountry,
  generateLocationCode,
} from "@/lib/utils/globalLocations";
import {
  ALL_HAZARD_CLASSES,
  type StorageLocation,
  type StorageLocationRequest,
  type FireSuppressionSystemType,
  type FacilityType,
  type ComplianceStatus,
} from "@/types/warehouseLocation";
import { warehouseLocationService } from "@/lib/services/wms/locationService";
import { fireSafetyService } from "@/lib/services/wms/fireSafetyService";
import { regulatoryComplianceService } from "@/lib/services/wms/regulatoryComplianceService";

interface StorageLocationFormProps {
  location?: StorageLocation;
  onClose: () => void;
  onSave: (location: StorageLocation) => void;
  warehouseId?: string;
  tenantId?: string;
  customerId?: string;
}

type FormTab = "basic" | "storage" | "compliance";

export default function StorageLocationForm({
  location,
  onClose,
  onSave,
  warehouseId,
  tenantId,
  customerId,
}: StorageLocationFormProps) {
  const [activeTab, setActiveTab] = useState<FormTab>("basic");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [complianceScore, setComplianceScore] = useState<number | null>(null);

  const [formData, setFormData] = useState<Partial<StorageLocationRequest>>({
    name: location?.name || "",
    type: location?.type || "Warehouse",
    code: location?.code || "",
    location: location?.location || {
      country: "Saudi Arabia",
      countryCode: "SAU",
      city: "",
      cityCode: "",
      address: "",
      coordinates: { latitude: 24.7136, longitude: 46.6753 },
    },
    regulatoryAuthority: location?.regulatoryAuthority || "Civil Defense",
    fireSuppressionType: location?.fireSuppressionType || "",
    totalPalletCapacity: location?.totalPalletCapacity,
    bulkAreaCapacity: location?.bulkAreaCapacity,
    currentPalletsUsed: location?.currentPalletsUsed,
    storageRestrictions: location?.storageRestrictions || {
      hazardClassesAllowed: [],
      hazardClassLimits: {},
      maximumQuantity: 0,
      temperatureControlled: false,
      specialRequirements: [],
    },
    complianceStatus: location?.complianceStatus || "Pending Inspection",
    lastInspection:
      location?.lastInspection || new Date().toISOString().split("T")[0],
    regulatoryNotes: location?.regulatoryNotes || "",
  });

  const [selectedHazards, setSelectedHazards] = useState<
    Record<string, { enabled: boolean; limit: number; hasLimit: boolean }>
  >(
    location?.storageRestrictions?.hazardClassesAllowed?.reduce(
      (acc, hc) => {
        const hazardClass = ALL_HAZARD_CLASSES.find((h) => h.value === hc);
        acc[hc] = {
          enabled: true,
          limit:
            location.storageRestrictions.hazardClassLimits?.[hc] ||
            hazardClass?.defaultLimit ||
            1000,
          hasLimit: true,
        };
        return acc;
      },
      {} as Record<
        string,
        { enabled: boolean; limit: number; hasLimit: boolean }
      >,
    ) || {},
  );

  // Auto-generate code when country/city changes
  useEffect(() => {
    if (
      formData.location?.countryCode &&
      formData.location?.cityCode &&
      !location
    ) {
      const code = generateLocationCode(
        formData.location.countryCode,
        formData.location.cityCode,
        1,
      );
      setFormData((prev) => ({ ...prev, code }));
    }
  }, [formData.location?.countryCode, formData.location?.cityCode, location]);

  // Get regulatory authorities for selected country
  const getRegulatoryAuthorities = (countryCode: string) => {
    return regulatoryComplianceService.getAuthoritiesByCountry(countryCode);
  };

  // Get recommended fire suppression systems
  const getRecommendedFireSystems = () => {
    if (
      !formData.storageRestrictions?.hazardClassesAllowed ||
      formData.storageRestrictions.hazardClassesAllowed.length === 0
    ) {
      return [];
    }
    const areaSize = formData.totalPalletCapacity
      ? formData.totalPalletCapacity * 10
      : 1000; // Rough estimate
    return fireSafetyService.getRecommendedSystem(
      formData.storageRestrictions.hazardClassesAllowed,
      areaSize,
    );
  };

  // AI Compliance Verification
  const checkAICompliance = async () => {
    if (!formData.name || !formData.location?.countryCode) return;

    try {
      setLoading(true);
      // Create temporary location for AI check
      const tempLocation: StorageLocation = {
        id: "temp",
        name: formData.name || "",
        type: formData.type || "Warehouse",
        code: formData.code || "",
        location: formData.location!,
        regulatoryAuthority: formData.regulatoryAuthority || "",
        fireSuppressionType: formData.fireSuppressionType || "None",
        totalPalletCapacity: formData.totalPalletCapacity,
        bulkAreaCapacity: formData.bulkAreaCapacity,
        currentPalletsUsed: formData.currentPalletsUsed,
        storageRestrictions: formData.storageRestrictions || {
          hazardClassesAllowed: [],
          hazardClassLimits: {},
          maximumQuantity: 0,
          temperatureControlled: false,
          specialRequirements: [],
        },
        complianceStatus: formData.complianceStatus || "Pending Inspection",
        lastInspection:
          formData.lastInspection || new Date().toISOString().split("T")[0],
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const verification =
        await regulatoryComplianceService.aiVerifyCompliance(tempLocation);
      setComplianceScore(verification.complianceScore);
      setAiRecommendations(verification.recommendations);
    } catch (error) {
      console.error("Error checking AI compliance:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle hazard class toggle
  const handleHazardToggle = (hazardValue: string) => {
    setSelectedHazards((prev) => {
      const current = prev[hazardValue];
      if (current?.enabled) {
        const newState = { ...prev };
        delete newState[hazardValue];
        return newState;
      } else {
        const hazard = ALL_HAZARD_CLASSES.find((h) => h.value === hazardValue);
        return {
          ...prev,
          [hazardValue]: {
            enabled: true,
            limit: hazard?.defaultLimit || 1000,
            hasLimit: true,
          },
        };
      }
    });
  };

  // Update form data when hazards change
  useEffect(() => {
    const hazardClassesAllowed = Object.keys(selectedHazards).filter(
      (hc) => selectedHazards[hc].enabled,
    );
    const hazardClassLimits: Record<string, number> = {};

    hazardClassesAllowed.forEach((hc) => {
      if (selectedHazards[hc].hasLimit) {
        hazardClassLimits[hc] = selectedHazards[hc].limit;
      }
    });

    setFormData((prev) => ({
      ...prev,
      storageRestrictions: {
        ...prev.storageRestrictions!,
        hazardClassesAllowed,
        hazardClassLimits,
      },
    }));
  }, [selectedHazards]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Facility name is required";
    }
    if (!formData.location?.countryCode) {
      newErrors.country = "Country is required";
    }
    if (!formData.location?.cityCode) {
      newErrors.city = "City is required";
    }
    if (!formData.location?.address?.trim()) {
      newErrors.address = "Address is required";
    }
    if (!formData.regulatoryAuthority) {
      newErrors.regulatoryAuthority = "Regulatory authority is required";
    }
    if (!formData.fireSuppressionType) {
      newErrors.fireSuppressionType = "Fire suppression system is required";
    }
    if (
      formData.storageRestrictions?.maximumQuantity === undefined ||
      formData.storageRestrictions.maximumQuantity <= 0
    ) {
      newErrors.maximumQuantity = "Maximum quantity is required";
    }
    if (formData.storageRestrictions?.temperatureControlled) {
      if (
        !formData.storageRestrictions.temperatureRange?.min ||
        !formData.storageRestrictions.temperatureRange?.max
      ) {
        newErrors.temperature =
          "Temperature range is required for temperature-controlled storage";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setSaving(true);

      const locationData: StorageLocationRequest = {
        name: formData.name!,
        type: formData.type!,
        code: formData.code,
        location: formData.location!,
        regulatoryAuthority: formData.regulatoryAuthority!,
        fireSuppressionType:
          formData.fireSuppressionType as FireSuppressionSystemType,
        totalPalletCapacity: formData.totalPalletCapacity,
        bulkAreaCapacity: formData.bulkAreaCapacity,
        currentPalletsUsed: formData.currentPalletsUsed,
        storageRestrictions: {
          hazardClassesAllowed:
            formData.storageRestrictions?.hazardClassesAllowed || [],
          hazardClassLimits:
            formData.storageRestrictions?.hazardClassLimits || {},
          maximumQuantity: formData.storageRestrictions?.maximumQuantity || 0,
          temperatureControlled:
            formData.storageRestrictions?.temperatureControlled || false,
          temperatureRange: formData.storageRestrictions?.temperatureRange,
          specialRequirements:
            formData.storageRestrictions?.specialRequirements || [],
        },
        complianceStatus: formData.complianceStatus!,
        lastInspection: formData.lastInspection!,
        regulatoryNotes: formData.regulatoryNotes,
      };

      let savedLocation: StorageLocation;

      if (location) {
        savedLocation = await warehouseLocationService.updateLocation(
          location.id,
          locationData,
        );
      } else {
        savedLocation =
          await warehouseLocationService.createLocation(locationData);
      }

      onSave(savedLocation);
      onClose();
    } catch (error) {
      console.error("Error saving location:", error);
      setErrors({
        submit:
          error instanceof Error ? error.message : "Failed to save location",
      });
    } finally {
      setSaving(false);
    }
  };

  const availableCities = formData.location?.countryCode
    ? getCitiesByCountry(formData.location.countryCode)
    : [];
  const regulatoryAuthorities = formData.location?.countryCode
    ? getRegulatoryAuthorities(formData.location.countryCode)
    : [];
  const recommendedFireSystems = getRecommendedFireSystems();

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={location ? "Edit Storage Location" : "Create Storage Location"}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10">
          {[
            {
              key: "basic" as const,
              label: "Basic Info",
              icon: "ri-global-line",
            },
            {
              key: "storage" as const,
              label: "Storage Parameters",
              icon: "ri-shield-line",
            },
            {
              key: "compliance" as const,
              label: "Compliance",
              icon: "ri-checkbox-circle-line",
            },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition font-medium ${
                activeTab === tab.key
                  ? "bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-500"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <i className={`ri-${tab.icon.split("-")[1]}-line`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Basic Info Tab */}
        <AnimatePresence mode="wait">
          {activeTab === "basic" && (
            <motion.div
              key="basic"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Facility Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                      errors.name ? "border-red-500" : "border-white/10"
                    } focus:border-cyan-500/50 outline-none text-white`}
                    placeholder="e.g. Main Chemical Warehouse"
                    required
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Facility Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.type || "Warehouse"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as FacilityType,
                      })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-white"
                  >
                    <option value="Warehouse">Warehouse</option>
                    <option value="Lab">Laboratory</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Support Services">Support Services</option>
                    <option value="Distribution Center">
                      Distribution Center
                    </option>
                    <option value="Storage Facility">Storage Facility</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Facility Code
                  </label>
                  <input
                    type="text"
                    value={formData.code || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none font-mono text-cyan-400"
                    placeholder="Auto-generated"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Country <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.location?.countryCode || ""}
                    onChange={(e) => {
                      const country = GLOBAL_COUNTRIES.find(
                        (c) => c.code === e.target.value,
                      );
                      const cities = getCitiesByCountry(e.target.value);
                      const authorities = getRegulatoryAuthorities(
                        e.target.value,
                      );

                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location!,
                          country: country?.name || "",
                          countryCode: e.target.value,
                          city: "",
                          cityCode: "",
                        },
                        regulatoryAuthority: authorities[0]?.name || "",
                      });
                    }}
                    className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                      errors.country ? "border-red-500" : "border-white/10"
                    } focus:border-cyan-500/50 outline-none text-white`}
                    required
                  >
                    <option value="">Select country...</option>
                    {GLOBAL_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                  {errors.country && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.country}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    City <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.location?.cityCode || ""}
                    onChange={(e) => {
                      const city = availableCities.find(
                        (c) => c.code === e.target.value,
                      );
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location!,
                          city: city?.name || "",
                          cityCode: e.target.value,
                          coordinates: city?.coordinates ||
                            formData.location?.coordinates || {
                              latitude: 0,
                              longitude: 0,
                            },
                        },
                      });
                    }}
                    className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                      errors.city ? "border-red-500" : "border-white/10"
                    } focus:border-cyan-500/50 outline-none text-white`}
                    required
                    disabled={!formData.location?.countryCode}
                  >
                    <option value="">Select city...</option>
                    {availableCities.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-400">{errors.city}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Street Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location?.address || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location!,
                          address: e.target.value,
                        },
                      })
                    }
                    className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                      errors.address ? "border-red-500" : "border-white/10"
                    } focus:border-cyan-500/50 outline-none text-white`}
                    placeholder="Industrial City, Phase 2, Block C"
                    required
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.address}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.location?.coordinates?.latitude || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location!,
                          coordinates: {
                            ...formData.location!.coordinates!,
                            latitude: parseFloat(e.target.value) || 0,
                          },
                        },
                      })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.location?.coordinates?.longitude || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location!,
                          coordinates: {
                            ...formData.location!.coordinates!,
                            longitude: parseFloat(e.target.value) || 0,
                          },
                        },
                      })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Regulatory Authority <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.regulatoryAuthority || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        regulatoryAuthority: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                      errors.regulatoryAuthority
                        ? "border-red-500"
                        : "border-white/10"
                    } focus:border-cyan-500/50 outline-none text-white`}
                    required
                  >
                    <option value="">Select authority...</option>
                    {regulatoryAuthorities.map((auth) => (
                      <option key={auth.id} value={auth.name}>
                        {auth.name}
                      </option>
                    ))}
                  </select>
                  {errors.regulatoryAuthority && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.regulatoryAuthority}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Storage Parameters Tab */}
          {activeTab === "storage" && (
            <motion.div
              key="storage"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Fire Suppression System */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fire Suppression System{" "}
                  <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.fireSuppressionType || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fireSuppressionType: e.target
                        .value as FireSuppressionSystemType,
                    })
                  }
                  className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                    errors.fireSuppressionType
                      ? "border-red-500"
                      : "border-white/10"
                  } focus:border-cyan-500/50 outline-none text-white`}
                  required
                >
                  <option value="">Select fire suppression system...</option>
                  <option value="Sprinkler System with FM-200">
                    Sprinkler System with FM-200
                  </option>
                  <option value="CO2 System">CO2 System</option>
                  <option value="Foam System">Foam System</option>
                  <option value="Dry Chemical System">
                    Dry Chemical System
                  </option>
                  <option value="Water Sprinkler System">
                    Water Sprinkler System
                  </option>
                  <option value="Gas Suppression (FM-200)">
                    Gas Suppression (FM-200)
                  </option>
                  <option value="Gas Suppression (Novec 1230)">
                    Gas Suppression (Novec 1230)
                  </option>
                  <option value="Inert Gas System (IG-541)">
                    Inert Gas System (IG-541)
                  </option>
                  <option value="Pre-Action Sprinkler System">
                    Pre-Action Sprinkler System
                  </option>
                  <option value="Deluge System">Deluge System</option>
                  <option value="Foam-Water Sprinkler System">
                    Foam-Water Sprinkler System
                  </option>
                  <option value="Multiple Systems (Combined)">
                    Multiple Systems (Combined)
                  </option>
                  <option value="None">None / Not Required</option>
                </select>
                {errors.fireSuppressionType && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.fireSuppressionType}
                  </p>
                )}

                {/* Recommended Systems */}
                {recommendedFireSystems.length > 0 &&
                  formData.storageRestrictions?.hazardClassesAllowed &&
                  formData.storageRestrictions.hazardClassesAllowed.length >
                    0 && (
                    <div className="mt-2 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                      <p className="text-xs text-cyan-400 mb-1">
                        <i className="ri-lightbulb-line mr-1"></i>
                        Recommended systems for selected hazard classes:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recommendedFireSystems.map((system) => (
                          <span
                            key={system}
                            className="px-2 py-1 rounded text-xs bg-cyan-500/20 text-cyan-300"
                          >
                            {system}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Capacity Management */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Total Pallet Capacity
                  </label>
                  <input
                    type="number"
                    value={formData.totalPalletCapacity || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalPalletCapacity:
                          parseInt(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-white"
                    placeholder="e.g. 500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bulk Area Capacity (Pallets)
                  </label>
                  <input
                    type="number"
                    value={formData.bulkAreaCapacity || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bulkAreaCapacity: parseInt(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-white"
                    placeholder="e.g. 200"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Pallets in Use
                  </label>
                  <input
                    type="number"
                    value={formData.currentPalletsUsed || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentPalletsUsed:
                          parseInt(e.target.value) || undefined,
                      })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-white"
                    placeholder="e.g. 325"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Utilization Rate
                  </label>
                  <div className="px-4 py-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <p className="text-2xl font-bold text-cyan-400">
                      {formData.totalPalletCapacity &&
                      formData.currentPalletsUsed
                        ? Math.round(
                            (formData.currentPalletsUsed /
                              formData.totalPalletCapacity) *
                              100,
                          )
                        : 0}
                      %
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formData.currentPalletsUsed || 0} /{" "}
                      {formData.totalPalletCapacity || 0} pallets
                    </p>
                  </div>
                </div>
              </div>

              {/* Hazard Classes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Allowed Hazard Classes & Volume Limits
                </label>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 max-h-96 overflow-y-auto">
                  {ALL_HAZARD_CLASSES.map((hazard) => {
                    const isSelected = selectedHazards[hazard.value]?.enabled;
                    const hasLimit = selectedHazards[hazard.value]?.hasLimit;
                    const limit =
                      selectedHazards[hazard.value]?.limit ||
                      hazard.defaultLimit;

                    return (
                      <div
                        key={hazard.value}
                        className={`p-3 rounded-lg border transition ${
                          isSelected
                            ? "bg-cyan-500/10 border-cyan-500/30"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-3 flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleHazardToggle(hazard.value)}
                              className="w-5 h-5 rounded border-cyan-500 text-cyan-500"
                            />
                            <span className="font-medium text-white">
                              {hazard.label}
                            </span>
                            {isSelected && (
                              <span className="ml-2 text-xs text-cyan-400">
                                ✓ Enabled
                              </span>
                            )}
                          </label>

                          {isSelected && (
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={hasLimit}
                                  onChange={() => {
                                    setSelectedHazards((prev) => ({
                                      ...prev,
                                      [hazard.value]: {
                                        ...prev[hazard.value],
                                        hasLimit: !prev[hazard.value].hasLimit,
                                      },
                                    }));
                                  }}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm text-gray-400">
                                  Set Limit
                                </span>
                              </label>

                              {hasLimit && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={limit}
                                    onChange={(e) => {
                                      setSelectedHazards((prev) => ({
                                        ...prev,
                                        [hazard.value]: {
                                          ...prev[hazard.value],
                                          limit: parseInt(e.target.value) || 0,
                                        },
                                      }));
                                    }}
                                    className="w-24 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
                                    min="0"
                                  />
                                  <span className="text-sm text-gray-400">
                                    L/kg
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Maximum Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Total Maximum Quantity (L/kg){" "}
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={formData.storageRestrictions?.maximumQuantity || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      storageRestrictions: {
                        ...formData.storageRestrictions!,
                        maximumQuantity: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                    errors.maximumQuantity
                      ? "border-red-500"
                      : "border-white/10"
                  } focus:border-cyan-500/50 outline-none text-white`}
                  min="0"
                  required
                />
                {errors.maximumQuantity && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.maximumQuantity}
                  </p>
                )}
              </div>

              {/* Temperature Control */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={
                      formData.storageRestrictions?.temperatureControlled ||
                      false
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        storageRestrictions: {
                          ...formData.storageRestrictions!,
                          temperatureControlled: e.target.checked,
                          temperatureRange: e.target.checked
                            ? formData.storageRestrictions
                                ?.temperatureRange || { min: 15, max: 30 }
                            : undefined,
                        },
                      })
                    }
                    className="w-5 h-5"
                  />
                  <i className="ri-thermometer-line text-blue-400"></i>
                  <span className="text-sm font-medium">
                    Temperature Controlled Storage
                  </span>
                </label>

                {formData.storageRestrictions?.temperatureControlled && (
                  <div className="grid grid-cols-2 gap-4 ml-7">
                    <div>
                      <label className="block text-xs mb-1 text-gray-400">
                        Min Temperature (°C)
                      </label>
                      <input
                        type="number"
                        value={
                          formData.storageRestrictions.temperatureRange?.min ||
                          15
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            storageRestrictions: {
                              ...formData.storageRestrictions!,
                              temperatureRange: {
                                min: parseInt(e.target.value) || 15,
                                max:
                                  formData.storageRestrictions.temperatureRange
                                    ?.max || 30,
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 outline-none text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1 text-gray-400">
                        Max Temperature (°C)
                      </label>
                      <input
                        type="number"
                        value={
                          formData.storageRestrictions.temperatureRange?.max ||
                          30
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            storageRestrictions: {
                              ...formData.storageRestrictions!,
                              temperatureRange: {
                                min:
                                  formData.storageRestrictions.temperatureRange
                                    ?.min || 15,
                                max: parseInt(e.target.value) || 30,
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 outline-none text-white"
                      />
                    </div>
                    {errors.temperature && (
                      <p className="col-span-2 mt-1 text-sm text-red-400">
                        {errors.temperature}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Special Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Special Requirements
                </label>
                <textarea
                  value={
                    formData.storageRestrictions?.specialRequirements?.join(
                      ", ",
                    ) || ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      storageRestrictions: {
                        ...formData.storageRestrictions!,
                        specialRequirements: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      },
                    })
                  }
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-white resize-none"
                  rows={3}
                  placeholder="Ventilation, Spill containment, Security access (comma separated)"
                />
              </div>
            </motion.div>
          )}

          {/* Compliance Tab */}
          {activeTab === "compliance" && (
            <motion.div
              key="compliance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Compliance Status <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.complianceStatus || "Pending Inspection"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        complianceStatus: e.target.value as ComplianceStatus,
                      })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-white"
                    required
                  >
                    <option value="Compliant">✓ Fully Compliant</option>
                    <option value="Compliant with exceptions">
                      ⚠ Compliant with Exceptions
                    </option>
                    <option value="Non-Compliant">✗ Non-Compliant</option>
                    <option value="Pending Inspection">
                      ⏳ Pending Inspection
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Inspection Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.lastInspection || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lastInspection: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-white"
                    required
                  />
                </div>
              </div>

              {/* AI Compliance Verification */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                <div className="flex items-start gap-3 mb-4">
                  <i className="ri-cpu-line text-2xl text-cyan-400 mt-0.5"></i>
                  <div className="flex-1">
                    <h4 className="font-semibold text-cyan-400 mb-2">
                      AI Compliance Verification (5IR)
                    </h4>
                    <p className="text-sm text-gray-300 mb-3">
                      Get AI-powered compliance verification and recommendations
                    </p>
                    <button
                      type="button"
                      onClick={checkAICompliance}
                      disabled={loading}
                      className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition flex items-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                          Checking...
                        </>
                      ) : (
                        <>
                          <i className="ri-magic-line"></i>
                          Verify Compliance
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {complianceScore !== null && (
                  <div className="mt-4 p-3 rounded-lg bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">
                        Compliance Score
                      </span>
                      <span
                        className={`text-lg font-bold ${
                          complianceScore >= 90
                            ? "text-green-400"
                            : complianceScore >= 70
                              ? "text-yellow-400"
                              : "text-red-400"
                        }`}
                      >
                        {complianceScore}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          complianceScore >= 90
                            ? "bg-green-500"
                            : complianceScore >= 70
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${complianceScore}%` }}
                      />
                    </div>
                  </div>
                )}

                {aiRecommendations.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-300 mb-2">
                      AI Recommendations:
                    </p>
                    <ul className="space-y-1">
                      {aiRecommendations.map((rec, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-400 flex items-start gap-2"
                        >
                          <i className="ri-arrow-right-s-line text-cyan-400 mt-0.5"></i>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Regulatory Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Regulatory Notes & Compliance Details
                </label>
                <textarea
                  value={formData.regulatoryNotes || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      regulatoryNotes: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500/50 outline-none text-white resize-none"
                  rows={6}
                  placeholder="Enter regulatory compliance details, special approvals, restrictions, NFPA requirements, etc..."
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-white/10">
          <div className="text-sm text-gray-400">
            {activeTab === "basic" && "1/3: Basic Information"}
            {activeTab === "storage" && "2/3: Storage Parameters"}
            {activeTab === "compliance" && "3/3: Compliance & Regulations"}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition font-medium text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <i className="ri-check-line"></i>
                  {location ? "Update Location" : "Create Location"}
                </>
              )}
            </button>
          </div>
        </div>

        {errors.submit && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {errors.submit}
          </div>
        )}
      </form>
    </Modal>
  );
}
