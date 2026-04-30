/**
 * New RFQ Creation Page
 * Comprehensive multi-step RFQ form
 */

"use client";

import { useState } from "react";
import PageTemplate from "@/components/PageTemplate";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/services/observability/logger";

const steps = [
  { id: 1, name: "Customer", icon: "ri-user-line" },
  { id: 2, name: "Services", icon: "ri-service-line" },
  { id: 3, name: "Requirements", icon: "ri-file-list-3-line" },
  { id: 4, name: "Route", icon: "ri-route-line" },
  { id: 5, name: "Timeline", icon: "ri-calendar-line" },
  { id: 6, name: "Review", icon: "ri-checkbox-circle-line" },
];

const serviceCategories = [
  {
    id: "WAREHOUSING",
    name: "Warehousing",
    icon: "ri-building-4-line",
    color: "bg-indigo-500",
  },
  {
    id: "TRANSPORTATION",
    name: "Transportation",
    icon: "ri-truck-line",
    color: "bg-emerald-500",
  },
  {
    id: "CUSTOMS_CLEARANCE",
    name: "Customs Clearance",
    icon: "ri-shield-check-line",
    color: "bg-amber-500",
  },
  {
    id: "FREIGHT_FORWARDING",
    name: "Freight Forwarding",
    icon: "ri-ship-line",
    color: "bg-blue-500",
  },
  {
    id: "RAIL_FREIGHT",
    name: "Rail Freight",
    icon: "ri-train-line",
    color: "bg-purple-500",
  },
  {
    id: "AIR_FREIGHT",
    name: "Air Freight",
    icon: "ri-flight-takeoff-line",
    color: "bg-sky-500",
  },
  {
    id: "CROSS_BORDER",
    name: "Cross-Border",
    icon: "ri-global-line",
    color: "bg-orange-500",
  },
  {
    id: "COLD_CHAIN",
    name: "Cold Chain",
    icon: "ri-temp-cold-line",
    color: "bg-cyan-500",
  },
  { id: "HAZMAT", name: "Hazmat", icon: "ri-alert-line", color: "bg-red-500" },
  {
    id: "PROJECT_LOGISTICS",
    name: "Project Logistics",
    icon: "ri-box-3-line",
    color: "bg-pink-500",
  },
  {
    id: "VALUE_ADDED",
    name: "Value Added",
    icon: "ri-star-line",
    color: "bg-yellow-500",
  },
  {
    id: "SUPPLY_CHAIN",
    name: "Supply Chain",
    icon: "ri-links-line",
    color: "bg-teal-500",
  },
];

export default function NewRFQ() {
  const router = useRouter();
  const { hasModuleAccess, canPerformAction } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  // Permission check
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");
  const canCreate = canPerformAction(
    "proposals-rfq",
    "proposals-rfq.rfq",
    undefined,
    "write",
  );

  const [formData, setFormData] = useState({
    // Customer
    customer: {
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      industry: "",
      address: "",
      creditRating: "",
      existingCustomer: false,
    },
    // Services
    selectedServices: [] as string[],
    serviceDetails: {} as Record<string, any>,
    // Requirements
    cargoType: "",
    weight: "",
    volume: "",
    hsCode: "",
    packageCount: "",
    packageType: "",
    dimensions: {
      length: "",
      width: "",
      height: "",
      unit: "CM",
    },
    hazmat: false,
    hazmatDetails: {
      unNumber: "",
      class: "",
      packingGroup: "",
    },
    temperature: false,
    temperatureRange: "",
    insuranceRequired: false,
    insuranceValue: "",
    specialRequirements: "",
    // Route
    origin: {
      country: "",
      city: "",
      address: "",
    },
    destination: {
      country: "",
      city: "",
      address: "",
    },
    crossBorder: false,
    multiStop: false,
    stops: [] as any[],
    viaPoints: [] as string[],
    // Timeline
    frequency: "ONE_TIME",
    startDate: "",
    endDate: "",
    urgency: "MEDIUM",
    responseDeadline: "",
    projectDuration: "",
    peakSeasons: [] as string[],
    contractDuration: "",
    // Attachments
    attachments: [] as File[],
    estimatedValue: "",
  });

  const updateFormData = (section: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]:
        typeof prev[section as keyof typeof prev] === "object"
          ? {
              ...(prev[section as keyof typeof prev] as object),
              [field]: value,
            }
          : value,
    }));
  };

  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter((s) => s !== serviceId)
        : [...prev.selectedServices, serviceId],
    }));
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!formData.customer.companyName?.trim()) {
      alert("Please enter company name");
      return;
    }
    if (!formData.customer.contactName?.trim()) {
      alert("Please enter contact name");
      return;
    }
    if (!formData.customer.email?.trim()) {
      alert("Please enter email address");
      return;
    }
    if (formData.selectedServices.length === 0) {
      alert("Please select at least one service");
      return;
    }
    if (!formData.responseDeadline) {
      alert("Please set a response deadline");
      return;
    }

    setSubmitting(true);
    try {
      logger.info("Submitting RFQ", undefined, {
        module: "proposals",
        service: "rfq",
      });

      // Submit to API
      const response = await fetch("/api/proposals/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({
            error: `HTTP ${response.status}: ${response.statusText}`,
          }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        alert("RFQ submitted successfully!");
        router.push("/proposals/rfq");
      } else {
        throw new Error(data.error || "Failed to submit RFQ");
      }
    } catch (error) {
      console.error("Error submitting RFQ:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while submitting the RFQ. Please try again.";
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="customer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.customer.companyName}
                  onChange={(e) =>
                    updateFormData("customer", "companyName", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Name *
                </label>
                <input
                  type="text"
                  value={formData.customer.contactName}
                  onChange={(e) =>
                    updateFormData("customer", "contactName", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Enter contact name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.customer.email}
                  onChange={(e) =>
                    updateFormData("customer", "email", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="email@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.customer.phone}
                  onChange={(e) =>
                    updateFormData("customer", "phone", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="+966 5X XXX XXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Industry
                </label>
                <select
                  value={formData.customer.industry}
                  onChange={(e) =>
                    updateFormData("customer", "industry", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select Industry</option>
                  <option value="OIL_GAS">Oil & Gas</option>
                  <option value="PETROCHEMICAL">Petrochemical</option>
                  <option value="MANUFACTURING">Manufacturing</option>
                  <option value="FMCG">FMCG</option>
                  <option value="RETAIL">Retail</option>
                  <option value="HEALTHCARE">Healthcare</option>
                  <option value="AUTOMOTIVE">Automotive</option>
                  <option value="CONSTRUCTION">Construction</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.customer.address}
                  onChange={(e) =>
                    updateFormData("customer", "address", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  rows={2}
                  placeholder="Company address"
                />
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="services"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Services
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Choose one or more services required for this RFQ
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {serviceCategories.map((service) => (
                <motion.button
                  key={service.id}
                  type="button"
                  onClick={() => toggleService(service.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.selectedServices.includes(service.id)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div
                    className={`w-12 h-12 ${service.color} rounded-lg flex items-center justify-center mx-auto mb-3`}
                  >
                    <i className={`${service.icon} text-xl text-white`} />
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {service.name}
                  </p>
                  {formData.selectedServices.includes(service.id) && (
                    <div className="mt-2">
                      <i className="ri-checkbox-circle-fill text-blue-500 text-xl" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="requirements"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Cargo & Requirements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cargo Type
                </label>
                <select
                  value={formData.cargoType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cargoType: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select Type</option>
                  <option value="GENERAL">General Cargo</option>
                  <option value="CONTAINER">Container</option>
                  <option value="BULK">Bulk</option>
                  <option value="LIQUID">Liquid</option>
                  <option value="PERISHABLE">Perishable</option>
                  <option value="DANGEROUS">Dangerous Goods</option>
                  <option value="OVERSIZED">Oversized</option>
                  <option value="HEAVY_LIFT">Heavy Lift</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estimated Weight (MT)
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, weight: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Volume (CBM)
                </label>
                <input
                  type="number"
                  value={formData.volume}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, volume: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  HS Code
                </label>
                <input
                  type="text"
                  value={formData.hsCode}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, hsCode: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="e.g., 8471.30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Package Count
                </label>
                <input
                  type="number"
                  value={formData.packageCount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, packageCount: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Package Type
                </label>
                <select
                  value={formData.packageType}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, packageType: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select Type</option>
                  <option value="PALLET">Pallet</option>
                  <option value="CARTON">Carton</option>
                  <option value="CRATE">Crate</option>
                  <option value="DRUM">Drum</option>
                  <option value="BAG">Bag</option>
                  <option value="CONTAINER">Container</option>
                  <option value="BUNDLE">Bundle</option>
                </select>
              </div>
            </div>

            {/* Dimensions */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dimensions (L × W × H)
              </label>
              <div className="grid grid-cols-4 gap-3">
                <input
                  type="number"
                  value={formData.dimensions.length}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dimensions: { ...prev.dimensions, length: e.target.value } }))
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="L"
                />
                <input
                  type="number"
                  value={formData.dimensions.width}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dimensions: { ...prev.dimensions, width: e.target.value } }))
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="W"
                />
                <input
                  type="number"
                  value={formData.dimensions.height}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dimensions: { ...prev.dimensions, height: e.target.value } }))
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="H"
                />
                <select
                  value={formData.dimensions.unit}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dimensions: { ...prev.dimensions, unit: e.target.value } }))
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="CM">CM</option>
                  <option value="M">M</option>
                  <option value="IN">IN</option>
                  <option value="FT">FT</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hazmat}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        hazmat: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Hazardous Materials (HAZMAT)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.temperature}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        temperature: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Temperature Controlled
                  </span>
                </label>
              </div>

              {formData.hazmat && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-medium text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
                    <i className="ri-alert-fill"></i>
                    Hazmat Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={formData.hazmatDetails.unNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          hazmatDetails: { ...prev.hazmatDetails, unNumber: e.target.value },
                        }))
                      }
                      className="px-3 py-2 border border-red-300 dark:border-red-600 rounded-lg bg-white dark:bg-gray-800"
                      placeholder="UN Number"
                    />
                    <select
                      value={formData.hazmatDetails.class}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          hazmatDetails: { ...prev.hazmatDetails, class: e.target.value },
                        }))
                      }
                      className="px-3 py-2 border border-red-300 dark:border-red-600 rounded-lg bg-white dark:bg-gray-800"
                    >
                      <option value="">Hazmat Class</option>
                      <option value="1">Class 1 - Explosives</option>
                      <option value="2">Class 2 - Gases</option>
                      <option value="3">Class 3 - Flammable Liquids</option>
                      <option value="4">Class 4 - Flammable Solids</option>
                      <option value="5">Class 5 - Oxidizers</option>
                      <option value="6">Class 6 - Toxic/Infectious</option>
                      <option value="7">Class 7 - Radioactive</option>
                      <option value="8">Class 8 - Corrosives</option>
                      <option value="9">Class 9 - Miscellaneous</option>
                    </select>
                    <select
                      value={formData.hazmatDetails.packingGroup}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          hazmatDetails: { ...prev.hazmatDetails, packingGroup: e.target.value },
                        }))
                      }
                      className="px-3 py-2 border border-red-300 dark:border-red-600 rounded-lg bg-white dark:bg-gray-800"
                    >
                      <option value="">Packing Group</option>
                      <option value="I">I - High Danger</option>
                      <option value="II">II - Medium Danger</option>
                      <option value="III">III - Low Danger</option>
                    </select>
                  </div>
                </div>
              )}

              {formData.temperature && (
                <div className="md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Temperature Range
                  </label>
                  <select
                    value={formData.temperatureRange}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        temperatureRange: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Range</option>
                    <option value="FROZEN">Frozen (-18°C to -25°C)</option>
                    <option value="CHILLED">Chilled (0°C to 4°C)</option>
                    <option value="COOL">Cool (8°C to 15°C)</option>
                    <option value="AMBIENT">
                      Controlled Ambient (15°C to 25°C)
                    </option>
                  </select>
                </div>
              )}

              {/* Insurance */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={formData.insuranceRequired}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        insuranceRequired: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Insurance Required
                  </span>
                </label>
                {formData.insuranceRequired && (
                  <div className="md:w-1/2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cargo Value for Insurance (SAR)
                    </label>
                    <input
                      type="number"
                      value={formData.insuranceValue}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          insuranceValue: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Special Requirements
                </label>
                <textarea
                  value={formData.specialRequirements}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      specialRequirements: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Any special handling requirements, certifications needed, etc."
                />
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="route"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Route Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Origin */}
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <i className="ri-map-pin-line text-green-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Origin
                  </h4>
                </div>
                <div className="space-y-3">
                  <select
                    value={formData.origin.country}
                    onChange={(e) =>
                      updateFormData("origin", "country", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Country</option>
                    <option value="SA">Saudi Arabia</option>
                    <option value="AE">UAE</option>
                    <option value="KW">Kuwait</option>
                    <option value="BH">Bahrain</option>
                    <option value="QA">Qatar</option>
                    <option value="OM">Oman</option>
                  </select>
                  <input
                    type="text"
                    value={formData.origin.city}
                    onChange={(e) =>
                      updateFormData("origin", "city", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={formData.origin.address}
                    onChange={(e) =>
                      updateFormData("origin", "address", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Full Address"
                  />
                </div>
              </div>

              {/* Destination */}
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <i className="ri-map-pin-fill text-red-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Destination
                  </h4>
                </div>
                <div className="space-y-3">
                  <select
                    value={formData.destination.country}
                    onChange={(e) =>
                      updateFormData("destination", "country", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Country</option>
                    <option value="SA">Saudi Arabia</option>
                    <option value="AE">UAE</option>
                    <option value="KW">Kuwait</option>
                    <option value="BH">Bahrain</option>
                    <option value="QA">Qatar</option>
                    <option value="OM">Oman</option>
                  </select>
                  <input
                    type="text"
                    value={formData.destination.city}
                    onChange={(e) =>
                      updateFormData("destination", "city", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={formData.destination.address}
                    onChange={(e) =>
                      updateFormData("destination", "address", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Full Address"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.crossBorder}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      crossBorder: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Cross-Border Shipment
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.multiStop}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      multiStop: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Multiple Stops
                </span>
              </label>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Timeline & Schedule
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Shipment Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      frequency: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="ONE_TIME">One-Time Shipment</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="ANNUAL">Annual Contract</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Urgency
                </label>
                <select
                  value={formData.urgency}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      urgency: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="LOW">Low - Flexible timeline</option>
                  <option value="MEDIUM">Medium - Standard</option>
                  <option value="HIGH">High - Time sensitive</option>
                  <option value="URGENT">Urgent - ASAP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date (if contract)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Response Deadline *
                </label>
                <input
                  type="date"
                  value={formData.responseDeadline}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      responseDeadline: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  When do you need the quotation by?
                </p>
              </div>
            </div>

            {/* Additional Volume Details */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">Volume & Contract Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Duration (days)
                  </label>
                  <input
                    type="number"
                    value={formData.projectDuration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        projectDuration: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contract Duration (months)
                  </label>
                  <input
                    type="number"
                    value={formData.contractDuration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contractDuration: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estimated Value (SAR)
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedValue}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        estimatedValue: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Peak Seasons (if applicable)
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)", "Ramadan", "Hajj Season", "Back to School", "Holiday Season"].map((season) => (
                    <button
                      key={season}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          peakSeasons: prev.peakSeasons.includes(season)
                            ? prev.peakSeasons.filter((s) => s !== season)
                            : [...prev.peakSeasons, season],
                        }))
                      }
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        formData.peakSeasons.includes(season)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      {season}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Review & Submit
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Summary */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <i className="ri-user-line text-blue-500" />
                  Customer
                </h4>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-900 dark:text-white font-medium">
                    {formData.customer.companyName || "Not specified"}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    {formData.customer.contactName}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    {formData.customer.email}
                  </p>
                </div>
              </div>

              {/* Services Summary */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <i className="ri-service-line text-purple-500" />
                  Services
                </h4>
                <div className="flex flex-wrap gap-2">
                  {formData.selectedServices.map((id) => {
                    const service = serviceCategories.find((s) => s.id === id);
                    return service ? (
                      <span
                        key={id}
                        className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-xs"
                      >
                        {service.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Route Summary */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <i className="ri-route-line text-emerald-500" />
                  Route
                </h4>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-900 dark:text-white">
                    {formData.origin.city || "Origin"}
                  </span>
                  <i className="ri-arrow-right-line text-gray-400" />
                  <span className="text-gray-900 dark:text-white">
                    {formData.destination.city || "Destination"}
                  </span>
                </div>
                {formData.crossBorder && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-xs">
                    Cross-Border
                  </span>
                )}
              </div>

              {/* Timeline Summary */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <i className="ri-calendar-line text-amber-500" />
                  Timeline
                </h4>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-500 dark:text-gray-400">
                    Frequency:{" "}
                    <span className="text-gray-900 dark:text-white">
                      {formData.frequency.replace(/_/g, " ")}
                    </span>
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    Start:{" "}
                    <span className="text-gray-900 dark:text-white">
                      {formData.startDate || "TBD"}
                    </span>
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    Response by:{" "}
                    <span className="text-gray-900 dark:text-white">
                      {formData.responseDeadline || "TBD"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (!hasAccess || !canCreate) {
    return (
      <PageTemplate
        title="Access Denied"
        description="You do not have permission to create RFQs"
        icon="ri-error-warning-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-fill text-3xl text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You do not have the required permissions to create RFQs. Please
              contact your administrator.
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <ProposalErrorBoundary>
      <PageTemplate
        title="Create New RFQ"
        description="Request for quotation creation wizard"
        icon="ri-add-circle-line"
      >
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                      currentStep > step.id
                        ? "bg-blue-600 border-blue-600 text-white"
                        : currentStep === step.id
                          ? "border-blue-600 text-blue-600"
                          : "border-gray-300 dark:border-gray-600 text-gray-400"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <i className="ri-check-line" />
                    ) : (
                      <i className={step.icon} />
                    )}
                  </div>
                  <span
                    className={`hidden md:block ml-2 text-sm ${
                      currentStep >= step.id
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-400"
                    }`}
                  >
                    {step.name}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 md:w-24 h-0.5 mx-2 ${
                        currentStep > step.id
                          ? "bg-blue-600"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px]">
            <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="ri-arrow-left-line mr-2" />
              Previous
            </button>

            {currentStep < steps.length ? (
              <button
                onClick={() =>
                  setCurrentStep((prev) => Math.min(steps.length, prev + 1))
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
                <i className="ri-arrow-right-line ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="ri-check-line" />
                    Submit RFQ
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </PageTemplate>
    </ProposalErrorBoundary>
  );
}
