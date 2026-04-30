/**
 * Comprehensive SKU Setup Form Component
 * Enterprise-grade SKU creation and editing form
 * Exceeds SAP and Oracle capabilities
 * Deep Architecture • Integration-First • 4IR & 5IR Aligned
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Textarea from "@/components/Textarea";
import Modal from "@/components/Modal";
import {
  SKU,
  MaterialType,
  SKUStatus,
  SKULifecycleStage,
  PackagingHierarchy,
  PackagingLevel,
  CustomerSKURelationship,
} from "@/types/sku";
import { useNotifications } from "@/lib/utils/notifications";
import { NotificationPatterns } from "@/lib/utils/notifications";

interface SKUSetupFormProps {
  sku?: SKU;
  onSave: (sku: Partial<SKU>) => Promise<void>;
  onCancel: () => void;
  customers?: Array<{
    id: string;
    customerNumber: string;
    customerName: string;
  }>;
}

export default function SKUSetupForm({
  sku,
  onSave,
  onCancel,
  customers = [],
}: SKUSetupFormProps) {
  const [activeTab, setActiveTab] = useState<
    | "basic"
    | "physical"
    | "packaging"
    | "storage"
    | "hazmat"
    | "quality"
    | "costing"
    | "inventory"
    | "customers"
    | "integration"
  >("basic");
  const [formData, setFormData] = useState<Partial<SKU>>({
    status: "DRAFT",
    lifecycleStage: "DEVELOPMENT",
    materialType: "FINISHED_GOOD",
    baseUnit: "EA",
    currency: "SAR",
    hazardous: false,
    batchManaged: false,
    serialNumberManaged: false,
    temperatureControlled: false,
    ...sku,
  });

  const [packagingHierarchy, setPackagingHierarchy] =
    useState<PackagingHierarchy | null>(sku?.packagingHierarchy || null);
  const [customerRelationships, setCustomerRelationships] = useState<
    CustomerSKURelationship[]
  >(sku?.customerSKUs || []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const tabs = [
    { id: "basic", label: "Basic Info", icon: "ri-information-line" },
    { id: "physical", label: "Physical Properties", icon: "ri-ruler-line" },
    { id: "packaging", label: "Packaging", icon: "ri-box-line" },
    { id: "storage", label: "Storage", icon: "ri-stack-line" },
    { id: "hazmat", label: "Hazmat", icon: "ri-alert-line" },
    { id: "quality", label: "Quality", icon: "ri-award-line" },
    { id: "costing", label: "Costing", icon: "ri-money-dollar-circle-line" },
    { id: "inventory", label: "Inventory", icon: "ri-stack-line" },
    { id: "customers", label: "Customers", icon: "ri-user-line" },
    { id: "integration", label: "Integration", icon: "ri-plug-line" },
  ];

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    // Validate required fields
    const newErrors: Record<string, string> = {};

    if (!formData.materialDescription && !formData.skuCode) {
      newErrors.materialDescription =
        "Material description or SKU code is required";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (!formData.baseUnit) {
      newErrors.baseUnit = "Base unit is required";
    }

    if (formData.hazardous && !formData.unNumber && !formData.hazardClass) {
      newErrors.hazardClass =
        "Hazardous materials must have UN number or hazard class";
    }

    if (
      formData.temperatureControlled &&
      (!formData.minTemperature || !formData.maxTemperature)
    ) {
      newErrors.temperature =
        "Temperature controlled SKUs must have min and max temperature";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setActiveTab("basic");
      return;
    }

    setIsSaving(true);
    try {
      const skuData = {
        ...formData,
        packagingHierarchy,
        customerSKUs: customerRelationships,
      };
      await onSave(skuData);
      // Success notification will be handled by parent component
    } catch (error) {
      console.error("Error saving SKU:", error);
      // Notifications hook needs to be added to parent component
      // For now, log error - parent should handle notification
      throw error; // Re-throw so parent can handle
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={sku ? "Edit SKU" : "Create New SKU"}
      size="xl"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white hover:bg-white/5"
              }`}
            >
              <i className={tab.icon}></i>
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "basic" && (
            <BasicInfoTab
              formData={formData}
              onChange={handleChange}
              errors={errors}
            />
          )}

          {activeTab === "physical" && (
            <PhysicalPropertiesTab
              formData={formData}
              onChange={handleChange}
              errors={errors}
            />
          )}

          {activeTab === "packaging" && (
            <PackagingTab
              formData={formData}
              packagingHierarchy={packagingHierarchy}
              onChange={handleChange}
              onPackagingChange={setPackagingHierarchy}
            />
          )}

          {activeTab === "storage" && (
            <StorageTab
              formData={formData}
              onChange={handleChange}
              errors={errors}
            />
          )}

          {activeTab === "hazmat" && (
            <HazmatTab
              formData={formData}
              onChange={handleChange}
              errors={errors}
            />
          )}

          {activeTab === "quality" && (
            <QualityTab formData={formData} onChange={handleChange} />
          )}

          {activeTab === "costing" && (
            <CostingTab formData={formData} onChange={handleChange} />
          )}

          {activeTab === "inventory" && (
            <InventoryTab formData={formData} onChange={handleChange} />
          )}

          {activeTab === "customers" && (
            <CustomersTab
              formData={formData}
              customerRelationships={customerRelationships}
              customers={customers}
              onChange={handleChange}
              onRelationshipsChange={setCustomerRelationships}
            />
          )}

          {activeTab === "integration" && (
            <IntegrationTab formData={formData} onChange={handleChange} />
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : sku ? "Update SKU" : "Create SKU"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// TAB COMPONENTS
// ============================================================================

function BasicInfoTab({
  formData,
  onChange,
  errors,
}: {
  formData: Partial<SKU>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="SKU Code"
        value={formData.skuCode || ""}
        onChange={(e) => onChange("skuCode", e.target.value)}
        error={errors.skuCode}
        placeholder="Auto-generated if not provided"
      />

      <Input
        label="Material Number"
        value={formData.materialNumber || ""}
        onChange={(e) => onChange("materialNumber", e.target.value)}
        placeholder="MAT-000001"
      />

      <div className="md:col-span-2">
        <Textarea
          label="Material Description *"
          value={formData.materialDescription || ""}
          onChange={(e) => onChange("materialDescription", e.target.value)}
          error={errors.materialDescription}
          placeholder="Enter full material description"
          rows={2}
        />
      </div>

      <Input
        label="Short Description"
        value={formData.shortDescription || ""}
        onChange={(e) => onChange("shortDescription", e.target.value)}
        placeholder="Short description for displays"
      />

      <Select
        label="Status *"
        value={formData.status || "DRAFT"}
        onChange={(e) => onChange("status", e.target.value)}
        options={[
          { value: "DRAFT", label: "Draft" },
          { value: "ACTIVE", label: "Active" },
          { value: "INACTIVE", label: "Inactive" },
          { value: "PENDING_APPROVAL", label: "Pending Approval" },
          { value: "SUSPENDED", label: "Suspended" },
        ]}
      />

      <Select
        label="Lifecycle Stage"
        value={formData.lifecycleStage || "DEVELOPMENT"}
        onChange={(e) => onChange("lifecycleStage", e.target.value)}
        options={[
          { value: "DEVELOPMENT", label: "Development" },
          { value: "TESTING", label: "Testing" },
          { value: "PRODUCTION", label: "Production" },
          { value: "PHASE_OUT", label: "Phase Out" },
          { value: "OBSOLETE", label: "Obsolete" },
        ]}
      />

      <Select
        label="Category *"
        value={formData.category || ""}
        onChange={(e) => onChange("category", e.target.value)}
        error={errors.category}
        options={[
          { value: "HAZMAT", label: "Hazmat" },
          { value: "NON-HAZMAT", label: "Non-Hazmat" },
          { value: "LIQUID", label: "Liquid" },
          { value: "SOLID", label: "Solid" },
          { value: "GAS", label: "Gas" },
          { value: "POWDER", label: "Powder" },
          { value: "PHARMACEUTICAL", label: "Pharmaceutical" },
          { value: "FOOD_GRADE", label: "Food Grade" },
        ]}
      />

      <Input
        label="Subcategory"
        value={formData.subcategory || ""}
        onChange={(e) => onChange("subcategory", e.target.value)}
        placeholder="Subcategory"
      />

      <Select
        label="Material Type *"
        value={formData.materialType || "FINISHED_GOOD"}
        onChange={(e) => onChange("materialType", e.target.value)}
        options={[
          { value: "RAW_MATERIAL", label: "Raw Material" },
          { value: "SEMI_FINISHED", label: "Semi-Finished" },
          { value: "FINISHED_GOOD", label: "Finished Good" },
          { value: "PACKAGING", label: "Packaging" },
          { value: "CONSUMABLE", label: "Consumable" },
          { value: "SPARE_PART", label: "Spare Part" },
          { value: "TOOL", label: "Tool" },
          { value: "SERVICE", label: "Service" },
        ]}
      />

      <Input
        label="Product Group"
        value={formData.productGroup || ""}
        onChange={(e) => onChange("productGroup", e.target.value)}
        placeholder="Product group"
      />

      <Input
        label="Brand"
        value={formData.brand || ""}
        onChange={(e) => onChange("brand", e.target.value)}
        placeholder="Brand name"
      />

      <Input
        label="Manufacturer"
        value={formData.manufacturer || ""}
        onChange={(e) => onChange("manufacturer", e.target.value)}
        placeholder="Manufacturer name"
      />

      <Input
        label="Barcode"
        value={formData.barcode || ""}
        onChange={(e) => onChange("barcode", e.target.value)}
        placeholder="Primary barcode"
      />

      <Input
        label="GTIN"
        value={formData.gtin || ""}
        onChange={(e) => onChange("gtin", e.target.value)}
        placeholder="Global Trade Item Number"
      />

      <Input
        label="HS Code"
        value={formData.hsCode || ""}
        onChange={(e) => onChange("hsCode", e.target.value)}
        placeholder="Harmonized System code"
      />
    </div>
  );
}

function PhysicalPropertiesTab({
  formData,
  onChange,
  errors,
}: {
  formData: Partial<SKU>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Select
        label="Base Unit of Measure *"
        value={formData.baseUnit || "EA"}
        onChange={(e) => onChange("baseUnit", e.target.value)}
        error={errors.baseUnit}
        options={[
          { value: "EA", label: "Each (EA)" },
          { value: "KG", label: "Kilogram (KG)" },
          { value: "L", label: "Liter (L)" },
          { value: "M", label: "Meter (M)" },
          { value: "M2", label: "Square Meter (M²)" },
          { value: "M3", label: "Cubic Meter (M³)" },
          { value: "PAL", label: "Pallet (PAL)" },
          { value: "BOX", label: "Box (BOX)" },
          { value: "BAG", label: "Bag (BAG)" },
          { value: "DRUM", label: "Drum (DRUM)" },
        ]}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Weight"
          type="number"
          value={formData.weight || ""}
          onChange={(e) =>
            onChange("weight", parseFloat(e.target.value) || undefined)
          }
          placeholder="0.00"
        />
        <Select
          label="Weight Unit"
          value={formData.weightUnit || "KG"}
          onChange={(e) => onChange("weightUnit", e.target.value)}
          options={[
            { value: "KG", label: "KG" },
            { value: "LBS", label: "LBS" },
            { value: "G", label: "G" },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Volume"
          type="number"
          value={formData.volume || ""}
          onChange={(e) =>
            onChange("volume", parseFloat(e.target.value) || undefined)
          }
          placeholder="0.00"
        />
        <Select
          label="Volume Unit"
          value={formData.volumeUnit || "L"}
          onChange={(e) => onChange("volumeUnit", e.target.value)}
          options={[
            { value: "L", label: "L" },
            { value: "M3", label: "M³" },
            { value: "GAL", label: "GAL" },
          ]}
        />
      </div>

      <div className="md:col-span-2">
        <h3 className="text-sm font-medium text-white mb-3">Dimensions</h3>
        <div className="grid grid-cols-4 gap-4">
          <Input
            label="Length"
            type="number"
            value={formData.dimensions?.length || ""}
            onChange={(e) =>
              onChange("dimensions", {
                ...formData.dimensions,
                length: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="0.00"
          />
          <Input
            label="Width"
            type="number"
            value={formData.dimensions?.width || ""}
            onChange={(e) =>
              onChange("dimensions", {
                ...formData.dimensions,
                width: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="0.00"
          />
          <Input
            label="Height"
            type="number"
            value={formData.dimensions?.height || ""}
            onChange={(e) =>
              onChange("dimensions", {
                ...formData.dimensions,
                height: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="0.00"
          />
          <Select
            label="Unit"
            value={formData.dimensions?.unit || "CM"}
            onChange={(e) =>
              onChange("dimensions", {
                ...formData.dimensions,
                unit: e.target.value,
              })
            }
            options={[
              { value: "CM", label: "CM" },
              { value: "M", label: "M" },
              { value: "IN", label: "IN" },
              { value: "FT", label: "FT" },
            ]}
          />
        </div>
      </div>

      <Input
        label="Density (kg/m³)"
        type="number"
        value={formData.density || ""}
        onChange={(e) =>
          onChange("density", parseFloat(e.target.value) || undefined)
        }
        placeholder="0.00"
      />

      <Input
        label="Specific Gravity"
        type="number"
        value={formData.specificGravity || ""}
        onChange={(e) =>
          onChange("specificGravity", parseFloat(e.target.value) || undefined)
        }
        placeholder="0.00"
      />
    </div>
  );
}

function PackagingTab({
  formData,
  packagingHierarchy,
  onChange,
  onPackagingChange,
}: {
  formData: Partial<SKU>;
  packagingHierarchy: PackagingHierarchy | null;
  onChange: (field: string, value: any) => void;
  onPackagingChange: (hierarchy: PackagingHierarchy | null) => void;
}) {
  const [showAddLevel, setShowAddLevel] = useState(false);
  const [newLevel, setNewLevel] = useState<Partial<PackagingLevel>>({
    level: packagingHierarchy ? packagingHierarchy.levels.length + 1 : 1,
    name: "",
    code: "",
    unitOfMeasure: "EA",
    active: true,
  });

  const handleAddLevel = () => {
    if (!packagingHierarchy) {
      // Create new hierarchy
      const hierarchy: PackagingHierarchy = {
        id: `pkg-hier-${Date.now()}`,
        skuId: formData.id || "",
        levels: [newLevel as PackagingLevel],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onPackagingChange(hierarchy);
    } else {
      // Add to existing hierarchy
      const updated = {
        ...packagingHierarchy,
        levels: [...packagingHierarchy.levels, newLevel as PackagingLevel],
        updatedAt: new Date().toISOString(),
      };
      onPackagingChange(updated);
    }
    setNewLevel({
      level: (packagingHierarchy?.levels.length || 0) + 2,
      name: "",
      code: "",
      unitOfMeasure: "EA",
      active: true,
    });
    setShowAddLevel(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Packaging Hierarchy</h3>
        <button
          onClick={() => setShowAddLevel(true)}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm font-medium"
        >
          <i className="ri-add-line mr-2"></i>
          Add Packaging Level
        </button>
      </div>

      {packagingHierarchy && packagingHierarchy.levels.length > 0 ? (
        <div className="space-y-3">
          {packagingHierarchy.levels.map((level, index) => (
            <div
              key={level.id || index}
              className="p-4 bg-white/5 border border-white/10 rounded-lg"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-white font-medium">
                    {level.name} ({level.code})
                  </h4>
                  <p className="text-sm text-[#9ca3af]">
                    Level {level.level} - {level.unitOfMeasure}
                  </p>
                </div>
                {level.isPallet && (
                  <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded">
                    Pallet
                  </span>
                )}
              </div>
              {level.quantityPerParent && (
                <p className="text-sm text-[#9ca3af]">
                  {level.quantityPerParent} per parent level
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-[#9ca3af]">
          <i className="ri-box-line text-4xl mb-2"></i>
          <p>No packaging levels defined</p>
          <p className="text-sm">Click "Add Packaging Level" to get started</p>
        </div>
      )}

      {showAddLevel && (
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-4">
          <h4 className="text-white font-medium">Add Packaging Level</h4>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name *"
              value={newLevel.name || ""}
              onChange={(e) =>
                setNewLevel({ ...newLevel, name: e.target.value })
              }
              placeholder="e.g., Each, Box, Case, Pallet"
            />
            <Input
              label="Code *"
              value={newLevel.code || ""}
              onChange={(e) =>
                setNewLevel({ ...newLevel, code: e.target.value })
              }
              placeholder="e.g., EA, BX, CS, PLT"
            />
            <Select
              label="Unit of Measure"
              value={newLevel.unitOfMeasure || "EA"}
              onChange={(e) =>
                setNewLevel({ ...newLevel, unitOfMeasure: e.target.value })
              }
              options={[
                { value: "EA", label: "Each (EA)" },
                { value: "BX", label: "Box (BX)" },
                { value: "CS", label: "Case (CS)" },
                { value: "PLT", label: "Pallet (PLT)" },
              ]}
            />
            <Input
              label="Quantity per Parent"
              type="number"
              value={newLevel.quantityPerParent || ""}
              onChange={(e) =>
                setNewLevel({
                  ...newLevel,
                  quantityPerParent: parseFloat(e.target.value) || undefined,
                })
              }
              placeholder="e.g., 12"
            />
          </div>
          <div className="flex gap-2">
            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                checked={newLevel.isPallet || false}
                onChange={(e) =>
                  setNewLevel({ ...newLevel, isPallet: e.target.checked })
                }
                className="rounded"
              />
              Is Pallet
            </label>
            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                checked={newLevel.default || false}
                onChange={(e) =>
                  setNewLevel({ ...newLevel, default: e.target.checked })
                }
                className="rounded"
              />
              Default Level
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAddLevel(false)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleAddLevel}
              disabled={!newLevel.name || !newLevel.code}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white disabled:opacity-50"
            >
              Add Level
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StorageTab({
  formData,
  onChange,
  errors,
}: {
  formData: Partial<SKU>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label className="flex items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={formData.temperatureControlled || false}
          onChange={(e) => onChange("temperatureControlled", e.target.checked)}
          className="rounded"
        />
        Temperature Controlled
      </label>

      {formData.temperatureControlled && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Temperature"
              type="number"
              value={formData.minTemperature || ""}
              onChange={(e) =>
                onChange(
                  "minTemperature",
                  parseFloat(e.target.value) || undefined,
                )
              }
              error={errors.temperature}
            />
            <Input
              label="Max Temperature"
              type="number"
              value={formData.maxTemperature || ""}
              onChange={(e) =>
                onChange(
                  "maxTemperature",
                  parseFloat(e.target.value) || undefined,
                )
              }
            />
          </div>
          <Select
            label="Temperature Unit"
            value={formData.temperatureUnit || "C"}
            onChange={(e) => onChange("temperatureUnit", e.target.value)}
            options={[
              { value: "C", label: "Celsius (°C)" },
              { value: "F", label: "Fahrenheit (°F)" },
            ]}
          />
        </>
      )}

      <label className="flex items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={formData.humidityControlled || false}
          onChange={(e) => onChange("humidityControlled", e.target.checked)}
          className="rounded"
        />
        Humidity Controlled
      </label>

      {formData.humidityControlled && (
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Min Humidity (%)"
            type="number"
            value={formData.minHumidity || ""}
            onChange={(e) =>
              onChange("minHumidity", parseFloat(e.target.value) || undefined)
            }
          />
          <Input
            label="Max Humidity (%)"
            type="number"
            value={formData.maxHumidity || ""}
            onChange={(e) =>
              onChange("maxHumidity", parseFloat(e.target.value) || undefined)
            }
          />
        </div>
      )}

      <Select
        label="Storage Type"
        value={formData.storageType || "AMBIENT"}
        onChange={(e) => onChange("storageType", e.target.value)}
        options={[
          { value: "AMBIENT", label: "Ambient" },
          { value: "COLD", label: "Cold" },
          { value: "FROZEN", label: "Frozen" },
          { value: "CONTROLLED", label: "Controlled Atmosphere" },
        ]}
      />

      <Input
        label="Storage Class"
        value={formData.storageClass || ""}
        onChange={(e) => onChange("storageClass", e.target.value)}
        placeholder="A, B, C, D, E"
      />

      <label className="flex items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={formData.lightSensitive || false}
          onChange={(e) => onChange("lightSensitive", e.target.checked)}
          className="rounded"
        />
        Light Sensitive
      </label>

      <label className="flex items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={formData.airSensitive || false}
          onChange={(e) => onChange("airSensitive", e.target.checked)}
          className="rounded"
        />
        Air Sensitive
      </label>

      <label className="flex items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={formData.moistureSensitive || false}
          onChange={(e) => onChange("moistureSensitive", e.target.checked)}
          className="rounded"
        />
        Moisture Sensitive
      </label>
    </div>
  );
}

function HazmatTab({
  formData,
  onChange,
  errors,
}: {
  formData: Partial<SKU>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label className="flex items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={formData.hazardous || false}
          onChange={(e) => onChange("hazardous", e.target.checked)}
          className="rounded"
        />
        Hazardous Material
      </label>

      {formData.hazardous && (
        <>
          <Input
            label="UN Number"
            value={formData.unNumber || ""}
            onChange={(e) => onChange("unNumber", e.target.value)}
            placeholder="UN1234"
          />

          <Input
            label="Hazard Class"
            value={formData.hazardClass || ""}
            onChange={(e) => onChange("hazardClass", e.target.value)}
            error={errors.hazardClass}
            placeholder="e.g., 3, 6.1, 8"
          />

          <Input
            label="Hazard Subclass"
            value={formData.hazardSubclass || ""}
            onChange={(e) => onChange("hazardSubclass", e.target.value)}
            placeholder="e.g., 3.1, 6.1A"
          />

          <Select
            label="Packing Group"
            value={formData.packingGroup || ""}
            onChange={(e) => onChange("packingGroup", e.target.value)}
            options={[
              { value: "", label: "Select..." },
              { value: "I", label: "I (Great Danger)" },
              { value: "II", label: "II (Medium Danger)" },
              { value: "III", label: "III (Minor Danger)" },
            ]}
          />

          <Input
            label="Proper Shipping Name"
            value={formData.properShippingName || ""}
            onChange={(e) => onChange("properShippingName", e.target.value)}
            placeholder="Proper shipping name"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Flash Point"
              type="number"
              value={formData.flashPoint || ""}
              onChange={(e) =>
                onChange("flashPoint", parseFloat(e.target.value) || undefined)
              }
              placeholder="0.00"
            />
            <Select
              label="Flash Point Unit"
              value={formData.flashPointUnit || "C"}
              onChange={(e) => onChange("flashPointUnit", e.target.value)}
              options={[
                { value: "C", label: "°C" },
                { value: "F", label: "°F" },
              ]}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-white">
            <input
              type="checkbox"
              checked={formData.msdsRequired || false}
              onChange={(e) => onChange("msdsRequired", e.target.checked)}
              className="rounded"
            />
            MSDS Required
          </label>

          {formData.msdsRequired && (
            <Input
              label="MSDS Number"
              value={formData.msdsNumber || ""}
              onChange={(e) => onChange("msdsNumber", e.target.value)}
              placeholder="MSDS-000001"
            />
          )}
        </>
      )}
    </div>
  );
}

function QualityTab({
  formData,
  onChange,
}: {
  formData: Partial<SKU>;
  onChange: (field: string, value: any) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label className="flex items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={formData.batchManaged || false}
          onChange={(e) => onChange("batchManaged", e.target.checked)}
          className="rounded"
        />
        Batch/Lot Tracking Required
      </label>

      <label className="flex items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={formData.serialNumberManaged || false}
          onChange={(e) => onChange("serialNumberManaged", e.target.checked)}
          className="rounded"
        />
        Serial Number Tracking Required
      </label>

      <label className="flex items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={formData.expiryDateManaged || false}
          onChange={(e) => onChange("expiryDateManaged", e.target.checked)}
          className="rounded"
        />
        Expiry Date Tracking Required
      </label>

      {formData.expiryDateManaged && (
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Shelf Life"
            type="number"
            value={formData.shelfLife || ""}
            onChange={(e) =>
              onChange("shelfLife", parseInt(e.target.value) || undefined)
            }
            placeholder="365"
          />
          <Select
            label="Shelf Life Unit"
            value={formData.shelfLifeUnit || "DAYS"}
            onChange={(e) => onChange("shelfLifeUnit", e.target.value)}
            options={[
              { value: "DAYS", label: "Days" },
              { value: "MONTHS", label: "Months" },
              { value: "YEARS", label: "Years" },
            ]}
          />
        </div>
      )}

      <Input
        label="Quality Grade"
        value={formData.qualityGrade || ""}
        onChange={(e) => onChange("qualityGrade", e.target.value)}
        placeholder="A, B, Premium, etc."
      />
    </div>
  );
}

function CostingTab({
  formData,
  onChange,
}: {
  formData: Partial<SKU>;
  onChange: (field: string, value: any) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="Standard Cost"
        type="number"
        value={formData.standardCost || ""}
        onChange={(e) =>
          onChange("standardCost", parseFloat(e.target.value) || undefined)
        }
        placeholder="0.00"
      />

      <Input
        label="Last Cost"
        type="number"
        value={formData.lastCost || ""}
        onChange={(e) =>
          onChange("lastCost", parseFloat(e.target.value) || undefined)
        }
        placeholder="0.00"
      />

      <Input
        label="Average Cost"
        type="number"
        value={formData.averageCost || ""}
        onChange={(e) =>
          onChange("averageCost", parseFloat(e.target.value) || undefined)
        }
        placeholder="0.00"
      />

      <Select
        label="Currency *"
        value={formData.currency || "SAR"}
        onChange={(e) => onChange("currency", e.target.value)}
        options={[
          { value: "SAR", label: "SAR (Saudi Riyal)" },
          { value: "USD", label: "USD (US Dollar)" },
          { value: "EUR", label: "EUR (Euro)" },
          { value: "GBP", label: "GBP (British Pound)" },
        ]}
      />

      <Select
        label="Costing Method"
        value={formData.costingMethod || "STANDARD"}
        onChange={(e) => onChange("costingMethod", e.target.value)}
        options={[
          { value: "STANDARD", label: "Standard" },
          { value: "AVERAGE", label: "Average" },
          { value: "FIFO", label: "FIFO" },
          { value: "LIFO", label: "LIFO" },
          { value: "SPECIFIC", label: "Specific" },
        ]}
      />

      <Select
        label="Valuation Method"
        value={formData.valuationMethod || "STANDARD"}
        onChange={(e) => onChange("valuationMethod", e.target.value)}
        options={[
          { value: "STANDARD", label: "Standard" },
          { value: "AVERAGE", label: "Average" },
          { value: "FIFO", label: "FIFO" },
          { value: "LIFO", label: "LIFO" },
        ]}
      />
    </div>
  );
}

function InventoryTab({
  formData,
  onChange,
}: {
  formData: Partial<SKU>;
  onChange: (field: string, value: any) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="Reorder Point"
        type="number"
        value={formData.reorderPoint || ""}
        onChange={(e) =>
          onChange("reorderPoint", parseFloat(e.target.value) || undefined)
        }
        placeholder="50"
      />

      <Input
        label="Reorder Quantity"
        type="number"
        value={formData.reorderQuantity || ""}
        onChange={(e) =>
          onChange("reorderQuantity", parseFloat(e.target.value) || undefined)
        }
        placeholder="100"
      />

      <Input
        label="Minimum Stock"
        type="number"
        value={formData.minStock || ""}
        onChange={(e) =>
          onChange("minStock", parseFloat(e.target.value) || undefined)
        }
        placeholder="20"
      />

      <Input
        label="Maximum Stock"
        type="number"
        value={formData.maxStock || ""}
        onChange={(e) =>
          onChange("maxStock", parseFloat(e.target.value) || undefined)
        }
        placeholder="500"
      />

      <Input
        label="Safety Stock"
        type="number"
        value={formData.safetyStock || ""}
        onChange={(e) =>
          onChange("safetyStock", parseFloat(e.target.value) || undefined)
        }
        placeholder="20"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Lead Time"
          type="number"
          value={formData.leadTime || ""}
          onChange={(e) =>
            onChange("leadTime", parseInt(e.target.value) || undefined)
          }
          placeholder="7"
        />
        <Select
          label="Lead Time Unit"
          value={formData.leadTimeUnit || "DAYS"}
          onChange={(e) => onChange("leadTimeUnit", e.target.value)}
          options={[
            { value: "DAYS", label: "Days" },
            { value: "WEEKS", label: "Weeks" },
            { value: "MONTHS", label: "Months" },
          ]}
        />
      </div>
    </div>
  );
}

function CustomersTab({
  formData,
  customerRelationships,
  customers,
  onChange,
  onRelationshipsChange,
}: {
  formData: Partial<SKU>;
  customerRelationships: CustomerSKURelationship[];
  customers: Array<{
    id: string;
    customerNumber: string;
    customerName: string;
  }>;
  onChange: (field: string, value: any) => void;
  onRelationshipsChange: (relationships: CustomerSKURelationship[]) => void;
}) {
  const [showLinkCustomer, setShowLinkCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerSKUCode, setCustomerSKUCode] = useState("");

  const handleLinkCustomer = () => {
    if (!selectedCustomer) return;

    const customer = customers.find((c) => c.id === selectedCustomer);
    if (!customer) return;

    const relationship: CustomerSKURelationship = {
      id: `cust-sku-${Date.now()}`,
      skuId: formData.id || "",
      customerId: selectedCustomer,
      customerNumber: customer.customerNumber,
      customerName: customer.customerName,
      customerSKUCode: customerSKUCode || undefined,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onRelationshipsChange([...customerRelationships, relationship]);
    setSelectedCustomer("");
    setCustomerSKUCode("");
    setShowLinkCustomer(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Customer Links</h3>
        <button
          onClick={() => setShowLinkCustomer(true)}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm font-medium"
        >
          <i className="ri-user-add-line mr-2"></i>
          Link Customer
        </button>
      </div>

      {customerRelationships.length > 0 ? (
        <div className="space-y-3">
          {customerRelationships.map((rel) => (
            <div
              key={rel.id}
              className="p-4 bg-white/5 border border-white/10 rounded-lg"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-white font-medium">{rel.customerName}</h4>
                  <p className="text-sm text-[#9ca3af]">
                    Customer #: {rel.customerNumber}
                  </p>
                  {rel.customerSKUCode && (
                    <p className="text-sm text-cyan-400">
                      Customer SKU: {rel.customerSKUCode}
                    </p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    rel.status === "ACTIVE"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {rel.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-[#9ca3af]">
          <i className="ri-user-line text-4xl mb-2"></i>
          <p>No customers linked</p>
          <p className="text-sm">Click "Link Customer" to add a customer</p>
        </div>
      )}

      {showLinkCustomer && (
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-4">
          <h4 className="text-white font-medium">Link Customer</h4>
          <Select
            label="Customer *"
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            options={[
              { value: "", label: "Select customer..." },
              ...customers.map((c) => ({
                value: c.id,
                label: `${c.customerName} (${c.customerNumber})`,
              })),
            ]}
          />
          <Input
            label="Customer SKU Code"
            value={customerSKUCode}
            onChange={(e) => setCustomerSKUCode(e.target.value)}
            placeholder="Customer's SKU code for this item"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowLinkCustomer(false);
                setSelectedCustomer("");
                setCustomerSKUCode("");
              }}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleLinkCustomer}
              disabled={!selectedCustomer}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white disabled:opacity-50"
            >
              Link Customer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function IntegrationTab({
  formData,
  onChange,
}: {
  formData: Partial<SKU>;
  onChange: (field: string, value: any) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Select
        label="ERP System"
        value={formData.erpSystemId || ""}
        onChange={(e) => onChange("erpSystemId", e.target.value)}
        options={[
          { value: "", label: "None" },
          { value: "SAP", label: "SAP" },
          { value: "ORACLE", label: "Oracle" },
          { value: "ERP_NEXT", label: "ERPNext" },
          { value: "CUSTOM", label: "Custom" },
        ]}
      />

      <Input
        label="ERP Material Number"
        value={formData.erpMaterialNumber || ""}
        onChange={(e) => onChange("erpMaterialNumber", e.target.value)}
        placeholder="ERP system material number"
      />
    </div>
  );
}
