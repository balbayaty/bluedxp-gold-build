/**
 * Service Catalog Page
 * Comprehensive service management for all logistics services
 */

"use client";

import { useState } from "react";
import PageTemplate from "@/components/PageTemplate";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

interface Service {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  unit: string;
  features: string[];
  active: boolean;
}

interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  services: Service[];
}

const serviceCategories: ServiceCategory[] = [
  {
    id: "WAREHOUSING",
    name: "Warehousing",
    icon: "ri-building-4-line",
    color: "bg-indigo-500",
    services: [
      {
        id: "wh-001",
        code: "WH-STD",
        name: "Standard Storage",
        category: "WAREHOUSING",
        description: "General cargo storage in ambient conditions",
        basePrice: 50,
        unit: "pallet/month",
        features: ["24/7 Security", "Inventory Management", "WMS Integration"],
        active: true,
      },
      {
        id: "wh-002",
        code: "WH-COLD",
        name: "Cold Storage",
        category: "WAREHOUSING",
        description: "Temperature-controlled storage for perishables",
        basePrice: 150,
        unit: "pallet/month",
        features: ["Temperature Monitoring", "HACCP Compliance", "Reefer Yard"],
        active: true,
      },
      {
        id: "wh-003",
        code: "WH-HAZ",
        name: "Hazmat Storage",
        category: "WAREHOUSING",
        description: "Specialized storage for dangerous goods",
        basePrice: 200,
        unit: "pallet/month",
        features: ["ADR Compliance", "Fire Suppression", "Spill Containment"],
        active: true,
      },
      {
        id: "wh-004",
        code: "WH-BOND",
        name: "Bonded Warehouse",
        category: "WAREHOUSING",
        description: "Customs bonded facility for duty-deferred storage",
        basePrice: 75,
        unit: "pallet/month",
        features: ["Customs Supervision", "Duty Deferral", "Transit Hub"],
        active: true,
      },
    ],
  },
  {
    id: "TRANSPORTATION",
    name: "Transportation",
    icon: "ri-truck-line",
    color: "bg-emerald-500",
    services: [
      {
        id: "tr-001",
        code: "TR-FTL",
        name: "Full Truck Load",
        category: "TRANSPORTATION",
        description: "Dedicated truck for full load shipments",
        basePrice: 2500,
        unit: "trip",
        features: ["GPS Tracking", "Direct Delivery", "Flexible Scheduling"],
        active: true,
      },
      {
        id: "tr-002",
        code: "TR-LTL",
        name: "Less Than Truck Load",
        category: "TRANSPORTATION",
        description: "Shared truck space for smaller shipments",
        basePrice: 500,
        unit: "pallet",
        features: [
          "Consolidated Shipping",
          "Cost Effective",
          "Hub Distribution",
        ],
        active: true,
      },
      {
        id: "tr-003",
        code: "TR-EXP",
        name: "Express Delivery",
        category: "TRANSPORTATION",
        description: "Time-critical express delivery service",
        basePrice: 3500,
        unit: "trip",
        features: ["Priority Handling", "SLA Guarantee", "24h Delivery"],
        active: true,
      },
      {
        id: "tr-004",
        code: "TR-LAST",
        name: "Last Mile Delivery",
        category: "TRANSPORTATION",
        description: "Final delivery to end customer",
        basePrice: 25,
        unit: "delivery",
        features: ["POD Capture", "Real-time Updates", "Signature Required"],
        active: true,
      },
    ],
  },
  {
    id: "CUSTOMS_CLEARANCE",
    name: "Customs Clearance",
    icon: "ri-shield-check-line",
    color: "bg-amber-500",
    services: [
      {
        id: "cc-001",
        code: "CC-IMP",
        name: "Import Clearance",
        category: "CUSTOMS_CLEARANCE",
        description: "Complete import customs clearance",
        basePrice: 500,
        unit: "shipment",
        features: [
          "Document Filing",
          "Duty Calculation",
          "Inspection Handling",
        ],
        active: true,
      },
      {
        id: "cc-002",
        code: "CC-EXP",
        name: "Export Clearance",
        category: "CUSTOMS_CLEARANCE",
        description: "Complete export customs clearance",
        basePrice: 400,
        unit: "shipment",
        features: ["Export Documentation", "CoO Processing", "EX1 Filing"],
        active: true,
      },
      {
        id: "cc-003",
        code: "CC-TRN",
        name: "Transit Clearance",
        category: "CUSTOMS_CLEARANCE",
        description: "Cross-border transit documentation",
        basePrice: 350,
        unit: "shipment",
        features: ["TIR Carnet", "Bond Management", "Route Planning"],
        active: true,
      },
      {
        id: "cc-004",
        code: "CC-COMP",
        name: "Compliance Review",
        category: "CUSTOMS_CLEARANCE",
        description: "Customs compliance audit and advisory",
        basePrice: 1000,
        unit: "review",
        features: [
          "HS Code Verification",
          "Valuation Review",
          "Risk Assessment",
        ],
        active: true,
      },
    ],
  },
  {
    id: "FREIGHT_FORWARDING",
    name: "Freight Forwarding",
    icon: "ri-ship-line",
    color: "bg-blue-500",
    services: [
      {
        id: "ff-001",
        code: "FF-FCL",
        name: "Full Container Load",
        category: "FREIGHT_FORWARDING",
        description: "Complete container shipment by sea",
        basePrice: 2000,
        unit: "20ft",
        features: ["Door-to-Port", "Container Tracking", "Documentation"],
        active: true,
      },
      {
        id: "ff-002",
        code: "FF-LCL",
        name: "Less Container Load",
        category: "FREIGHT_FORWARDING",
        description: "Consolidated sea freight",
        basePrice: 150,
        unit: "CBM",
        features: ["Consolidation", "CFS Handling", "Multi-Origin"],
        active: true,
      },
      {
        id: "ff-003",
        code: "FF-AIR",
        name: "Air Freight",
        category: "FREIGHT_FORWARDING",
        description: "International air cargo service",
        basePrice: 5,
        unit: "kg",
        features: ["Express Options", "Charter Available", "Special Cargo"],
        active: true,
      },
      {
        id: "ff-004",
        code: "FF-BRK",
        name: "Breakbulk",
        category: "FREIGHT_FORWARDING",
        description: "Non-containerized cargo handling",
        basePrice: 100,
        unit: "MT",
        features: ["Heavy Lift", "Project Cargo", "Special Equipment"],
        active: true,
      },
    ],
  },
  {
    id: "RAIL_FREIGHT",
    name: "Rail Freight",
    icon: "ri-train-line",
    color: "bg-purple-500",
    services: [
      {
        id: "rf-001",
        code: "RF-CONT",
        name: "Container by Rail",
        category: "RAIL_FREIGHT",
        description: "Rail transport for containers",
        basePrice: 1500,
        unit: "TEU",
        features: ["Terminal-to-Terminal", "Block Train", "Intermodal"],
        active: true,
      },
      {
        id: "rf-002",
        code: "RF-BULK",
        name: "Bulk Rail",
        category: "RAIL_FREIGHT",
        description: "Rail transport for bulk commodities",
        basePrice: 50,
        unit: "MT",
        features: ["Hopper Wagons", "Tank Cars", "Covered Wagons"],
        active: true,
      },
      {
        id: "rf-003",
        code: "RF-INTER",
        name: "Intermodal Service",
        category: "RAIL_FREIGHT",
        description: "Combined road-rail transport",
        basePrice: 1800,
        unit: "TEU",
        features: ["Door-to-Door", "Seamless Transfer", "Eco-Friendly"],
        active: true,
      },
      {
        id: "rf-004",
        code: "RF-XBRD",
        name: "Cross-Border Rail",
        category: "RAIL_FREIGHT",
        description: "International rail freight",
        basePrice: 2500,
        unit: "TEU",
        features: ["GCC Network", "Customs Integration", "Track & Trace"],
        active: true,
      },
    ],
  },
  {
    id: "VALUE_ADDED",
    name: "Value Added Services",
    icon: "ri-star-line",
    color: "bg-pink-500",
    services: [
      {
        id: "va-001",
        code: "VA-LABEL",
        name: "Labeling",
        category: "VALUE_ADDED",
        description: "Product labeling and relabeling",
        basePrice: 0.5,
        unit: "item",
        features: ["Barcode Application", "Country Specific", "QC Check"],
        active: true,
      },
      {
        id: "va-002",
        code: "VA-KIT",
        name: "Kitting",
        category: "VALUE_ADDED",
        description: "Product kitting and assembly",
        basePrice: 2,
        unit: "kit",
        features: ["BOM Management", "Quality Control", "Custom Packaging"],
        active: true,
      },
      {
        id: "va-003",
        code: "VA-PACK",
        name: "Repackaging",
        category: "VALUE_ADDED",
        description: "Product repackaging services",
        basePrice: 3,
        unit: "unit",
        features: ["Retail Ready", "Display Packs", "Promotional"],
        active: true,
      },
      {
        id: "va-004",
        code: "VA-QC",
        name: "Quality Inspection",
        category: "VALUE_ADDED",
        description: "Product quality inspection",
        basePrice: 5,
        unit: "unit",
        features: ["Visual Inspection", "Dimensional Check", "Functional Test"],
        active: true,
      },
    ],
  },
];

export default function ServiceCatalog() {
  const { hasModuleAccess } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddService, setShowAddService] = useState(false);

  // Permission check
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");

  const filteredCategories = serviceCategories.filter((cat) => {
    if (!searchQuery) return true;
    return (
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.services.some(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.code.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    );
  });

  const totalServices = serviceCategories.reduce(
    (sum, cat) => sum + cat.services.length,
    0,
  );
  const activeServices = serviceCategories.reduce(
    (sum, cat) => sum + cat.services.filter((s) => s.active).length,
    0,
  );

  return (
    <ProposalErrorBoundary>
      <PageTemplate
        title="Service Catalog"
        description="Manage all logistics services and pricing"
        icon="ri-service-line"
      >
        <div className="space-y-6">
          {/* Header Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                  <i className="ri-folder-line text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {serviceCategories.length}
                  </p>
                  <p className="text-xs text-gray-500">Categories</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                  <i className="ri-service-line text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalServices}
                  </p>
                  <p className="text-xs text-gray-500">Total Services</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                  <i className="ri-checkbox-circle-line text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {activeServices}
                  </p>
                  <p className="text-xs text-gray-500">Active</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                  <i className="ri-price-tag-3-line text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    SAR
                  </p>
                  <p className="text-xs text-gray-500">Currency</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddService(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <i className="ri-add-line" />
                Add Service
              </button>
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                <i className="ri-download-line" />
                Export
              </button>
            </div>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className={`${category.color} p-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <i className={`${category.icon} text-xl text-white`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {category.name}
                        </h3>
                        <p className="text-sm text-white/80">
                          {category.services.length} services
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setSelectedCategory(
                          selectedCategory === category.id ? null : category.id,
                        )
                      }
                      className="p-2 hover:bg-white/20 rounded-lg text-white"
                    >
                      <i
                        className={`ri-arrow-${selectedCategory === category.id ? "up" : "down"}-s-line`}
                      />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {selectedCategory === category.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-3">
                        {category.services.map((service) => (
                          <div
                            key={service.id}
                            className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                                    {service.code}
                                  </span>
                                  {service.active ? (
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  ) : (
                                    <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                                  )}
                                </div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {service.name}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {service.description}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-900 dark:text-white">
                                  SAR {service.basePrice}
                                </p>
                                <p className="text-xs text-gray-500">
                                  /{service.unit}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {service.features.map((feature, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs text-gray-700 dark:text-gray-300"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {selectedCategory !== category.id && (
                  <div className="p-4 grid grid-cols-2 gap-2">
                    {category.services.slice(0, 4).map((service) => (
                      <div key={service.id} className="text-sm">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {service.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          SAR {service.basePrice}/{service.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Quick Stats by Category */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Service Overview
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      Services
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      Active
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      Avg. Price
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {serviceCategories.map((cat, index) => {
                    const avgPrice =
                      cat.services.reduce((sum, s) => sum + s.basePrice, 0) /
                      cat.services.length;
                    return (
                      <tr
                        key={cat.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg ${cat.color} flex items-center justify-center`}
                            >
                              <i className={`${cat.icon} text-white text-sm`} />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {cat.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-900 dark:text-white">
                          {cat.services.length}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-green-600">
                            {cat.services.filter((s) => s.active).length}
                          </span>
                          <span className="text-gray-400">
                            {" "}
                            / {cat.services.length}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-900 dark:text-white">
                          SAR {avgPrice.toFixed(0)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-1">
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500">
                              <i className="ri-edit-line" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500">
                              <i className="ri-more-2-fill" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </PageTemplate>
    </ProposalErrorBoundary>
  );
}
