/**
 * RFQ Edit Page
 * 
 * Edit existing RFQ with all fields from the RFQ type
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { useAuth } from "@/contexts/AuthContext";
import type { RFQ, ServiceCategory, RFQPriority, RFQStatus } from "@/types/rfq";
import { UserNotification, useNotifications } from "@/components/ui/UserNotification";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { SaveStatus, UnsavedChangesWarning } from "@/components/ui/FormActions";

const SERVICE_CATEGORIES: { value: ServiceCategory; label: string; icon: string }[] = [
  { value: "WAREHOUSING", label: "Warehousing", icon: "ri-building-2-line" },
  { value: "ROAD_TRANSPORT", label: "Road Transport", icon: "ri-truck-line" },
  { value: "SEA_FREIGHT", label: "Sea Freight", icon: "ri-ship-line" },
  { value: "AIR_FREIGHT", label: "Air Freight", icon: "ri-plane-line" },
  { value: "RAIL_FREIGHT", label: "Rail Freight", icon: "ri-train-line" },
  { value: "CUSTOMS_CLEARANCE", label: "Customs Clearance", icon: "ri-file-shield-line" },
  { value: "VALUE_ADDED_SERVICES", label: "Value Added Services", icon: "ri-add-box-line" },
  { value: "CROSS_DOCKING", label: "Cross Docking", icon: "ri-arrow-left-right-line" },
  { value: "COLD_CHAIN", label: "Cold Chain", icon: "ri-temp-cold-line" },
  { value: "HAZMAT", label: "Hazmat", icon: "ri-alert-line" },
  { value: "PROJECT_CARGO", label: "Project Cargo", icon: "ri-box-3-line" },
  { value: "LAST_MILE", label: "Last Mile", icon: "ri-map-pin-line" },
];

const PRIORITIES: { value: RFQPriority; label: string; color: string }[] = [
  { value: "LOW", label: "Low", color: "bg-gray-500" },
  { value: "MEDIUM", label: "Medium", color: "bg-blue-500" },
  { value: "HIGH", label: "High", color: "bg-orange-500" },
  { value: "URGENT", label: "Urgent", color: "bg-red-500" },
  { value: "CRITICAL", label: "Critical", color: "bg-red-600" },
];

export default function EditRFQPage() {
  const params = useParams();
  const router = useRouter();
  const rfqId = params.id as string;
  const { hasModuleAccess, canPerformAction } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Notifications
  const { notification, showSuccess, showError, showWarning, clearNotification } = useNotifications();
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as RFQPriority,
    customer: {
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      industry: "",
      creditRating: "",
      existingCustomer: false,
      address: {
        street: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
      },
    },
    serviceRequirements: [] as any[],
    shipmentDetails: {
      commodityType: "",
      hsCode: "",
      weight: { value: 0, unit: "KG" },
      volume: { value: 0, unit: "CBM" },
      packageCount: 0,
      packageType: "",
      insuranceRequired: false,
      insuranceValue: 0,
      hazmat: null as any,
      temperatureControlled: null as any,
    },
    routes: [
      {
        origin: { name: "", address: { city: "", country: "" } },
        destination: { name: "", address: { city: "", country: "" } },
        preferredMode: "ROAD",
        estimatedDistance: 0,
        estimatedTransitTime: 0,
      },
    ],
    volumeDetails: {
      frequency: "",
      estimatedVolume: 0,
      volumeUnit: "",
      contractDuration: 0,
      peakSeasons: [] as string[],
    },
    timeline: {
      requestDate: new Date().toISOString(),
      responseDeadline: "",
      expectedStartDate: "",
      projectDuration: 0,
      urgency: "MEDIUM",
    },
    notes: [] as any[],
    attachments: [] as any[],
    estimatedValue: 0,
    currency: "SAR",
  });

  const canEdit = canPerformAction("proposals-rfq", "proposals-rfq.rfq", undefined, "write");

  const steps = [
    { id: 0, title: "Customer", icon: "ri-user-star-line" },
    { id: 1, title: "Services", icon: "ri-service-line" },
    { id: 2, title: "Shipment", icon: "ri-box-3-line" },
    { id: 3, title: "Route", icon: "ri-route-line" },
    { id: 4, title: "Timeline", icon: "ri-calendar-line" },
    { id: 5, title: "Review", icon: "ri-checkbox-circle-line" },
  ];

  useEffect(() => {
    loadRFQ();
  }, [rfqId]);

  const loadRFQ = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/proposals/rfq/${rfqId}`);
      if (!response.ok) throw new Error("RFQ not found");
      const data = await response.json();
      if (data.success && data.data) {
        setFormData(prev => ({
          ...prev,
          ...data.data,
          customer: { ...prev.customer, ...data.data.customer },
          shipmentDetails: { ...prev.shipmentDetails, ...data.data.shipmentDetails },
          timeline: { ...prev.timeline, ...data.data.timeline },
          volumeDetails: { ...prev.volumeDetails, ...data.data.volumeDetails },
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load RFQ");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/proposals/rfq/${rfqId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Failed to save RFQ");
      router.push(`/proposals/rfq/${rfqId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (path: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split(".");
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const toggleService = (category: ServiceCategory) => {
    setFormData(prev => {
      const exists = prev.serviceRequirements.find(s => s.category === category);
      if (exists) {
        return { ...prev, serviceRequirements: prev.serviceRequirements.filter(s => s.category !== category) };
      } else {
        return { ...prev, serviceRequirements: [...prev.serviceRequirements, { category, priority: "MEDIUM", description: "" }] };
      }
    });
  };

  if (!canEdit) {
    return (
      <PageTemplate title="Access Denied" description="You do not have permission to edit RFQs" icon="ri-error-warning-line">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-fill text-3xl text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <Link href={`/proposals/rfq/${rfqId}`} className="text-blue-600 hover:underline">View RFQ</Link>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading RFQ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/proposals/rfq/${rfqId}`} className="text-gray-500 hover:text-gray-700">
                <i className="ri-arrow-left-line text-xl"></i>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit RFQ</h1>
                <p className="text-sm text-gray-500">{formData.title || "Untitled RFQ"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/proposals/rfq/${rfqId}`} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-save-line"></i>}
                Save Changes
              </button>
            </div>
          </div>

          {/* Steps */}
          <div className="mt-6 flex items-center justify-between">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeStep === step.id
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <i className={step.icon}></i>
                <span className="hidden sm:inline">{step.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <i className="ri-error-warning-line"></i>
            {error}
          </div>
        )}

        <motion.div
          key={activeStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          {/* Step 0: Customer */}
          {activeStep === 0 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <i className="ri-user-star-line text-blue-600"></i>
                Customer Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={formData.customer.companyName}
                    onChange={(e) => updateField("customer.companyName", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    value={formData.customer.contactPerson}
                    onChange={(e) => updateField("customer.contactPerson", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="Enter contact name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.customer.email}
                    onChange={(e) => updateField("customer.email", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="email@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.customer.phone}
                    onChange={(e) => updateField("customer.phone", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="+966 XX XXX XXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Industry</label>
                  <input
                    type="text"
                    value={formData.customer.industry}
                    onChange={(e) => updateField("customer.industry", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="e.g., Manufacturing, Retail"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Credit Rating</label>
                  <select
                    value={formData.customer.creditRating}
                    onChange={(e) => updateField("customer.creditRating", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="">Select rating</option>
                    <option value="A">A - Excellent</option>
                    <option value="B">B - Good</option>
                    <option value="C">C - Average</option>
                    <option value="D">D - Below Average</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={formData.customer.address?.street || ""}
                      onChange={(e) => updateField("customer.address.street", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="Street address"
                    />
                  </div>
                  <input
                    type="text"
                    value={formData.customer.address?.city || ""}
                    onChange={(e) => updateField("customer.address.city", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={formData.customer.address?.state || ""}
                    onChange={(e) => updateField("customer.address.state", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="State/Region"
                  />
                  <input
                    type="text"
                    value={formData.customer.address?.country || ""}
                    onChange={(e) => updateField("customer.address.country", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="Country"
                  />
                  <input
                    type="text"
                    value={formData.customer.address?.postalCode || ""}
                    onChange={(e) => updateField("customer.address.postalCode", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="Postal code"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.customer.existingCustomer}
                  onChange={(e) => updateField("customer.existingCustomer", e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Existing Customer</span>
              </label>
            </div>
          )}

          {/* Step 1: Services */}
          {activeStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <i className="ri-service-line text-blue-600"></i>
                Select Services
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {SERVICE_CATEGORIES.map((service) => {
                  const isSelected = formData.serviceRequirements.some(s => s.category === service.value);
                  return (
                    <button
                      key={service.value}
                      onClick={() => toggleService(service.value)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <i className={`${service.icon} text-2xl ${isSelected ? "text-blue-600" : "text-gray-400"}`}></i>
                      <div className={`mt-2 font-medium ${isSelected ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}>
                        {service.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Shipment */}
          {activeStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <i className="ri-box-3-line text-blue-600"></i>
                Shipment Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commodity Type</label>
                  <input
                    type="text"
                    value={formData.shipmentDetails.commodityType}
                    onChange={(e) => updateField("shipmentDetails.commodityType", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="e.g., Electronics, Food, Chemicals"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HS Code</label>
                  <input
                    type="text"
                    value={formData.shipmentDetails.hsCode}
                    onChange={(e) => updateField("shipmentDetails.hsCode", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="e.g., 8471.30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight (KG)</label>
                  <input
                    type="number"
                    value={formData.shipmentDetails.weight.value || ""}
                    onChange={(e) => updateField("shipmentDetails.weight.value", parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Volume (CBM)</label>
                  <input
                    type="number"
                    value={formData.shipmentDetails.volume.value || ""}
                    onChange={(e) => updateField("shipmentDetails.volume.value", parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Package Count</label>
                  <input
                    type="number"
                    value={formData.shipmentDetails.packageCount || ""}
                    onChange={(e) => updateField("shipmentDetails.packageCount", parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Package Type</label>
                  <select
                    value={formData.shipmentDetails.packageType}
                    onChange={(e) => updateField("shipmentDetails.packageType", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="">Select type</option>
                    <option value="PALLET">Pallet</option>
                    <option value="CARTON">Carton</option>
                    <option value="CRATE">Crate</option>
                    <option value="DRUM">Drum</option>
                    <option value="CONTAINER">Container</option>
                    <option value="BULK">Bulk</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.shipmentDetails.insuranceRequired}
                      onChange={(e) => updateField("shipmentDetails.insuranceRequired", e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Insurance Required</span>
                  </label>
                </div>
                {formData.shipmentDetails.insuranceRequired && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Insurance Value (SAR)</label>
                    <input
                      type="number"
                      value={formData.shipmentDetails.insuranceValue || ""}
                      onChange={(e) => updateField("shipmentDetails.insuranceValue", parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Route */}
          {activeStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <i className="ri-route-line text-blue-600"></i>
                Route Information
              </h2>
              {formData.routes.map((route, index) => (
                <div key={index} className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Route {index + 1}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Origin Name</label>
                      <input
                        type="text"
                        value={route.origin?.name || ""}
                        onChange={(e) => {
                          const newRoutes = [...formData.routes];
                          newRoutes[index] = { ...route, origin: { ...route.origin, name: e.target.value } };
                          updateField("routes", newRoutes);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        placeholder="e.g., Riyadh Warehouse"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destination Name</label>
                      <input
                        type="text"
                        value={route.destination?.name || ""}
                        onChange={(e) => {
                          const newRoutes = [...formData.routes];
                          newRoutes[index] = { ...route, destination: { ...route.destination, name: e.target.value } };
                          updateField("routes", newRoutes);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        placeholder="e.g., Jeddah Port"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Origin City</label>
                      <input
                        type="text"
                        value={route.origin?.address?.city || ""}
                        onChange={(e) => {
                          const newRoutes = [...formData.routes];
                          newRoutes[index] = { ...route, origin: { ...route.origin, address: { ...route.origin.address, city: e.target.value } } };
                          updateField("routes", newRoutes);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destination City</label>
                      <input
                        type="text"
                        value={route.destination?.address?.city || ""}
                        onChange={(e) => {
                          const newRoutes = [...formData.routes];
                          newRoutes[index] = { ...route, destination: { ...route.destination, address: { ...route.destination.address, city: e.target.value } } };
                          updateField("routes", newRoutes);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transport Mode</label>
                      <select
                        value={route.preferredMode}
                        onChange={(e) => {
                          const newRoutes = [...formData.routes];
                          newRoutes[index] = { ...route, preferredMode: e.target.value };
                          updateField("routes", newRoutes);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      >
                        <option value="ROAD">Road</option>
                        <option value="SEA">Sea</option>
                        <option value="AIR">Air</option>
                        <option value="RAIL">Rail</option>
                        <option value="MULTIMODAL">Multimodal</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => updateField("routes", [...formData.routes, { origin: { name: "", address: {} }, destination: { name: "", address: {} }, preferredMode: "ROAD" }])}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                <i className="ri-add-line mr-2"></i>
                Add Another Route
              </button>
            </div>
          )}

          {/* Step 4: Timeline */}
          {activeStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <i className="ri-calendar-line text-blue-600"></i>
                Timeline & Volume
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Response Deadline *</label>
                  <input
                    type="date"
                    value={formData.timeline.responseDeadline ? formData.timeline.responseDeadline.split("T")[0] : ""}
                    onChange={(e) => updateField("timeline.responseDeadline", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Start Date</label>
                  <input
                    type="date"
                    value={formData.timeline.expectedStartDate ? formData.timeline.expectedStartDate.split("T")[0] : ""}
                    onChange={(e) => updateField("timeline.expectedStartDate", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Duration (days)</label>
                  <input
                    type="number"
                    value={formData.timeline.projectDuration || ""}
                    onChange={(e) => updateField("timeline.projectDuration", parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => updateField("priority", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Volume Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
                    <select
                      value={formData.volumeDetails.frequency}
                      onChange={(e) => updateField("volumeDetails.frequency", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    >
                      <option value="">Select frequency</option>
                      <option value="ONE_TIME">One Time</option>
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="AS_NEEDED">As Needed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contract Duration (months)</label>
                    <input
                      type="number"
                      value={formData.volumeDetails.contractDuration || ""}
                      onChange={(e) => updateField("volumeDetails.contractDuration", parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimated Value (SAR)</label>
                    <input
                      type="number"
                      value={formData.estimatedValue || ""}
                      onChange={(e) => updateField("estimatedValue", parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {activeStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <i className="ri-checkbox-circle-line text-blue-600"></i>
                Review & Confirm
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Customer</h3>
                  <p className="text-gray-600 dark:text-gray-400">{formData.customer.companyName}</p>
                  <p className="text-sm text-gray-500">{formData.customer.contactPerson}</p>
                  <p className="text-sm text-gray-500">{formData.customer.email}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Services</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.serviceRequirements.map((s, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-sm">
                        {s.category?.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Shipment</h3>
                  <p className="text-gray-600 dark:text-gray-400">{formData.shipmentDetails.commodityType || "Not specified"}</p>
                  <p className="text-sm text-gray-500">Weight: {formData.shipmentDetails.weight.value} KG</p>
                  <p className="text-sm text-gray-500">Volume: {formData.shipmentDetails.volume.value} CBM</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Timeline</h3>
                  <p className="text-gray-600 dark:text-gray-400">Deadline: {formData.timeline.responseDeadline || "Not set"}</p>
                  <p className="text-sm text-gray-500">Priority: {formData.priority}</p>
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <i className="ri-information-line"></i>
                  <span className="font-medium">Ready to save</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Click "Save Changes" to update this RFQ.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
              disabled={activeStep === 0}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
            >
              <i className="ri-arrow-left-line mr-2"></i>
              Previous
            </button>
            {activeStep < steps.length - 1 ? (
              <button
                onClick={() => setActiveStep(activeStep + 1)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
                <i className="ri-arrow-right-line ml-2"></i>
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-save-line"></i>}
                Save Changes
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
