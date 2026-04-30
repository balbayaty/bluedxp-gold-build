/**
 * SKU Detail View Component
 * Comprehensive detail view for SKU with all information
 * Deep Architecture • Integration-First
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SKU, PackagingHierarchy, CustomerSKURelationship } from "@/types/sku";
import CurrencyDisplay from "@/components/CurrencyDisplay";
import ModuleLinks from "@/components/ModuleLinks";
import { getSKULinks } from "@/utils/moduleInterconnectivity";
import { format } from "date-fns";

interface SKUDetailViewProps {
  sku: SKU;
  packagingHierarchy?: PackagingHierarchy | null;
  customerRelationships?: CustomerSKURelationship[];
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function SKUDetailView({
  sku,
  packagingHierarchy,
  customerRelationships = [],
  onEdit,
  onDelete,
}: SKUDetailViewProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "packaging" | "customers" | "compliance" | "analytics"
  >("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: "ri-information-line" },
    { id: "packaging", label: "Packaging", icon: "ri-box-line" },
    { id: "customers", label: "Customers", icon: "ri-user-line" },
    { id: "compliance", label: "Compliance", icon: "ri-shield-check-line" },
    { id: "analytics", label: "Analytics", icon: "ri-bar-chart-line" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white">{sku.skuCode}</h2>
          <p className="text-lg text-[#9ca3af] mt-1">
            {sku.materialDescription}
          </p>
          {sku.materialNumber && (
            <p className="text-sm text-[#9ca3af] mt-1">
              Material: {sku.materialNumber}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm font-medium"
            >
              <i className="ri-edit-line mr-2"></i>
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium"
            >
              <i className="ri-delete-bin-line mr-2"></i>
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            sku.status === "ACTIVE"
              ? "bg-green-500/20 text-green-400"
              : sku.status === "INACTIVE"
                ? "bg-gray-500/20 text-gray-400"
                : sku.status === "DRAFT"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-red-500/20 text-red-400"
          }`}
        >
          {sku.status}
        </span>
        <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-medium">
          {sku.lifecycleStage}
        </span>
        {sku.hazardous && (
          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
            <i className="ri-alert-line mr-1"></i>
            Hazardous
          </span>
        )}
        {sku.batchManaged && (
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
            Batch Managed
          </span>
        )}
        {sku.serialNumberManaged && (
          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
            Serial Managed
          </span>
        )}
      </div>

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
        {activeTab === "overview" && <OverviewTab sku={sku} />}
        {activeTab === "packaging" && (
          <PackagingTab sku={sku} packagingHierarchy={packagingHierarchy} />
        )}
        {activeTab === "customers" && (
          <CustomersTab
            sku={sku}
            customerRelationships={customerRelationships}
          />
        )}
        {activeTab === "compliance" && <ComplianceTab sku={sku} />}
        {activeTab === "analytics" && <AnalyticsTab sku={sku} />}
      </div>

      {/* Module Links */}
      <div className="pt-6 border-t border-white/10">
        <ModuleLinks
          links={getSKULinks(sku.id, sku.skuCode, sku.materialNumber)}
        />
      </div>
    </div>
  );
}

// ============================================================================
// TAB COMPONENTS
// ============================================================================

function OverviewTab({ sku }: { sku: SKU }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Basic Information */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">
          Basic Information
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[#9ca3af]">SKU Code:</span>
            <span className="text-white font-medium">{sku.skuCode}</span>
          </div>
          {sku.materialNumber && (
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Material Number:</span>
              <span className="text-white font-medium">
                {sku.materialNumber}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[#9ca3af]">Category:</span>
            <span className="text-white font-medium">{sku.category}</span>
          </div>
          {sku.subcategory && (
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Subcategory:</span>
              <span className="text-white font-medium">{sku.subcategory}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[#9ca3af]">Material Type:</span>
            <span className="text-white font-medium">{sku.materialType}</span>
          </div>
          {sku.brand && (
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Brand:</span>
              <span className="text-white font-medium">{sku.brand}</span>
            </div>
          )}
          {sku.manufacturer && (
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Manufacturer:</span>
              <span className="text-white font-medium">{sku.manufacturer}</span>
            </div>
          )}
        </div>
      </div>

      {/* Physical Properties */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">
          Physical Properties
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[#9ca3af]">Base Unit:</span>
            <span className="text-white font-medium">{sku.baseUnit}</span>
          </div>
          {sku.weight && (
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Weight:</span>
              <span className="text-white font-medium">
                {sku.weight} {sku.weightUnit || "KG"}
              </span>
            </div>
          )}
          {sku.volume && (
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Volume:</span>
              <span className="text-white font-medium">
                {sku.volume} {sku.volumeUnit || "L"}
              </span>
            </div>
          )}
          {sku.dimensions && (
            <>
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Dimensions:</span>
                <span className="text-white font-medium">
                  {sku.dimensions.length} × {sku.dimensions.width} ×{" "}
                  {sku.dimensions.height} {sku.dimensions.unit}
                </span>
              </div>
            </>
          )}
          {sku.density && (
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Density:</span>
              <span className="text-white font-medium">
                {sku.density} kg/m³
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Costing Information */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">
          Costing Information
        </h3>
        <div className="space-y-3 text-sm">
          {sku.standardCost && (
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Standard Cost:</span>
              <span className="text-white font-medium">
                <CurrencyDisplay
                  value={sku.standardCost}
                  currency={sku.currency}
                />
              </span>
            </div>
          )}
          {sku.lastCost && (
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Last Cost:</span>
              <span className="text-white font-medium">
                <CurrencyDisplay value={sku.lastCost} currency={sku.currency} />
              </span>
            </div>
          )}
          {sku.averageCost && (
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Average Cost:</span>
              <span className="text-cyan-400 font-medium">
                <CurrencyDisplay
                  value={sku.averageCost}
                  currency={sku.currency}
                />
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[#9ca3af]">Currency:</span>
            <span className="text-white font-medium">{sku.currency}</span>
          </div>
          {sku.costingMethod && (
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Costing Method:</span>
              <span className="text-white font-medium">
                {sku.costingMethod}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Inventory Settings */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">
          Inventory Settings
        </h3>
        <div className="space-y-3 text-sm">
          {sku.reorderPoint && (
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Reorder Point:</span>
              <span className="text-white font-medium">
                {sku.reorderPoint} {sku.baseUnit}
              </span>
            </div>
          )}
          {sku.reorderQuantity && (
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Reorder Quantity:</span>
              <span className="text-white font-medium">
                {sku.reorderQuantity} {sku.baseUnit}
              </span>
            </div>
          )}
          {sku.minStock && (
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Minimum Stock:</span>
              <span className="text-white font-medium">
                {sku.minStock} {sku.baseUnit}
              </span>
            </div>
          )}
          {sku.maxStock && (
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Maximum Stock:</span>
              <span className="text-white font-medium">
                {sku.maxStock} {sku.baseUnit}
              </span>
            </div>
          )}
          {sku.safetyStock && (
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Safety Stock:</span>
              <span className="text-white font-medium">
                {sku.safetyStock} {sku.baseUnit}
              </span>
            </div>
          )}
          {sku.leadTime && (
            <div className="flex justify-between">
              <span className="text-[#9ca3af]">Lead Time:</span>
              <span className="text-white font-medium">
                {sku.leadTime} {sku.leadTimeUnit || "DAYS"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Storage Requirements */}
      {(sku.temperatureControlled || sku.storageType || sku.storageClass) && (
        <div className="p-6 bg-white/5 border border-white/10 rounded-lg md:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">
            Storage Requirements
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {sku.temperatureControlled && (
              <div>
                <span className="text-[#9ca3af]">Temperature:</span>
                <div className="text-white font-medium">
                  {sku.minTemperature}°{sku.temperatureUnit || "C"} -{" "}
                  {sku.maxTemperature}°{sku.temperatureUnit || "C"}
                </div>
              </div>
            )}
            {sku.storageType && (
              <div>
                <span className="text-[#9ca3af]">Storage Type:</span>
                <div className="text-white font-medium">{sku.storageType}</div>
              </div>
            )}
            {sku.storageClass && (
              <div>
                <span className="text-[#9ca3af]">Storage Class:</span>
                <div className="text-white font-medium">{sku.storageClass}</div>
              </div>
            )}
            {(sku.lightSensitive ||
              sku.airSensitive ||
              sku.moistureSensitive) && (
              <div>
                <span className="text-[#9ca3af]">Sensitivity:</span>
                <div className="text-white font-medium">
                  {[
                    sku.lightSensitive && "Light",
                    sku.airSensitive && "Air",
                    sku.moistureSensitive && "Moisture",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-lg md:col-span-2">
        <h3 className="text-lg font-semibold text-white mb-4">
          Dates & Lifecycle
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-[#9ca3af]">Created:</span>
            <div className="text-white font-medium">
              {format(new Date(sku.createdAt), "MMM dd, yyyy")}
            </div>
          </div>
          <div>
            <span className="text-[#9ca3af]">Updated:</span>
            <div className="text-white font-medium">
              {format(new Date(sku.updatedAt), "MMM dd, yyyy")}
            </div>
          </div>
          {sku.validFrom && (
            <div>
              <span className="text-[#9ca3af]">Valid From:</span>
              <div className="text-white font-medium">
                {format(new Date(sku.validFrom), "MMM dd, yyyy")}
              </div>
            </div>
          )}
          {sku.validTo && (
            <div>
              <span className="text-[#9ca3af]">Valid To:</span>
              <div className="text-white font-medium">
                {format(new Date(sku.validTo), "MMM dd, yyyy")}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PackagingTab({
  sku,
  packagingHierarchy,
}: {
  sku: SKU;
  packagingHierarchy?: PackagingHierarchy | null;
}) {
  if (!packagingHierarchy || packagingHierarchy.levels.length === 0) {
    return (
      <div className="text-center py-12 text-[#9ca3af]">
        <i className="ri-box-line text-4xl mb-2"></i>
        <p>No packaging hierarchy defined</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">
          Packaging Hierarchy
        </h3>
        <div className="space-y-4">
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
                <div className="flex gap-2">
                  {level.isPallet && (
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded">
                      Pallet
                    </span>
                  )}
                  {level.default && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                      Default
                    </span>
                  )}
                </div>
              </div>
              {level.quantityPerParent && (
                <p className="text-sm text-[#9ca3af] mb-2">
                  {level.quantityPerParent} per parent level
                </p>
              )}
              {level.dimensions && (
                <p className="text-sm text-[#9ca3af]">
                  Dimensions: {level.dimensions.length} ×{" "}
                  {level.dimensions.width} × {level.dimensions.height}{" "}
                  {level.dimensions.unit}
                </p>
              )}
              {level.palletConfiguration && (
                <div className="mt-3 p-3 bg-white/5 rounded-lg">
                  <p className="text-sm text-white font-medium mb-2">
                    Pallet Configuration:
                  </p>
                  <div className="text-xs text-[#9ca3af] space-y-1">
                    <div>Type: {level.palletConfiguration.palletType}</div>
                    {level.palletConfiguration.maxWeight && (
                      <div>
                        Max Weight: {level.palletConfiguration.maxWeight} kg
                      </div>
                    )}
                    {level.palletConfiguration.maxLayers && (
                      <div>
                        Max Layers: {level.palletConfiguration.maxLayers}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CustomersTab({
  sku,
  customerRelationships,
}: {
  sku: SKU;
  customerRelationships: CustomerSKURelationship[];
}) {
  if (customerRelationships.length === 0) {
    return (
      <div className="text-center py-12 text-[#9ca3af]">
        <i className="ri-user-line text-4xl mb-2"></i>
        <p>No customers linked to this SKU</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {customerRelationships.map((rel) => (
        <div
          key={rel.id}
          className="p-6 bg-white/5 border border-white/10 rounded-lg"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-white font-medium text-lg">
                {rel.customerName}
              </h4>
              <p className="text-sm text-[#9ca3af]">
                Customer #: {rel.customerNumber}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                rel.status === "ACTIVE"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-gray-500/20 text-gray-400"
              }`}
            >
              {rel.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {rel.customerSKUCode && (
              <div>
                <span className="text-[#9ca3af]">Customer SKU Code:</span>
                <div className="text-white font-medium">
                  {rel.customerSKUCode}
                </div>
              </div>
            )}
            {rel.customerPartNumber && (
              <div>
                <span className="text-[#9ca3af]">Customer Part Number:</span>
                <div className="text-white font-medium">
                  {rel.customerPartNumber}
                </div>
              </div>
            )}
            {rel.customerPrice && (
              <div>
                <span className="text-[#9ca3af]">Customer Price:</span>
                <div className="text-white font-medium">
                  <CurrencyDisplay
                    value={rel.customerPrice}
                    currency={rel.customerCurrency || sku.currency}
                  />
                </div>
              </div>
            )}
            {rel.effectiveDate && (
              <div>
                <span className="text-[#9ca3af]">Effective Date:</span>
                <div className="text-white font-medium">
                  {format(new Date(rel.effectiveDate), "MMM dd, yyyy")}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ComplianceTab({ sku }: { sku: SKU }) {
  return (
    <div className="space-y-6">
      {/* Hazardous Material */}
      {sku.hazardous && (
        <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">
            Hazardous Material Information
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {sku.unNumber && (
              <div>
                <span className="text-[#9ca3af]">UN Number:</span>
                <div className="text-white font-medium">{sku.unNumber}</div>
              </div>
            )}
            {sku.hazardClass && (
              <div>
                <span className="text-[#9ca3af]">Hazard Class:</span>
                <div className="text-white font-medium">{sku.hazardClass}</div>
              </div>
            )}
            {sku.packingGroup && (
              <div>
                <span className="text-[#9ca3af]">Packing Group:</span>
                <div className="text-white font-medium">{sku.packingGroup}</div>
              </div>
            )}
            {sku.properShippingName && (
              <div>
                <span className="text-[#9ca3af]">Proper Shipping Name:</span>
                <div className="text-white font-medium">
                  {sku.properShippingName}
                </div>
              </div>
            )}
            {sku.msdsNumber && (
              <div>
                <span className="text-[#9ca3af]">MSDS Number:</span>
                <div className="text-white font-medium">{sku.msdsNumber}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Certifications */}
      {sku.certifications && sku.certifications.length > 0 && (
        <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">
            Certifications
          </h3>
          <div className="space-y-3">
            {sku.certifications.map((cert) => (
              <div key={cert.id} className="p-3 bg-white/5 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white font-medium">{cert.type}</div>
                    {cert.number && (
                      <div className="text-sm text-[#9ca3af]">
                        #{cert.number}
                      </div>
                    )}
                    {cert.issuer && (
                      <div className="text-sm text-[#9ca3af]">
                        Issued by: {cert.issuer}
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      cert.status === "VALID"
                        ? "bg-green-500/20 text-green-400"
                        : cert.status === "EXPIRED"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {cert.status}
                  </span>
                </div>
                {cert.expiryDate && (
                  <div className="text-xs text-[#9ca3af] mt-2">
                    Expires: {format(new Date(cert.expiryDate), "MMM dd, yyyy")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regulatory Status */}
      {sku.regulatoryStatus && sku.regulatoryStatus.length > 0 && (
        <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">
            Regulatory Status
          </h3>
          <div className="space-y-3">
            {sku.regulatoryStatus.map((status, index) => (
              <div key={index} className="p-3 bg-white/5 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white font-medium">
                      {status.authority}
                    </div>
                    <div className="text-sm text-[#9ca3af]">
                      {status.region}
                    </div>
                    {status.registrationNumber && (
                      <div className="text-sm text-[#9ca3af]">
                        Registration: {status.registrationNumber}
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      status.status === "APPROVED"
                        ? "bg-green-500/20 text-green-400"
                        : status.status === "BANNED"
                          ? "bg-red-500/20 text-red-400"
                          : status.status === "RESTRICTED"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {status.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsTab({ sku }: { sku: SKU }) {
  return (
    <div className="text-center py-12 text-[#9ca3af]">
      <i className="ri-bar-chart-line text-4xl mb-2"></i>
      <p>Analytics data will be loaded here</p>
      <p className="text-sm mt-2">
        Connect to analytics service to view detailed metrics
      </p>
    </div>
  );
}
