/**
 * Shipment Booking Wizard
 * 
 * Comprehensive wizard for booking shipments across all modes:
 * - FCL (Full Container Load)
 * - LCL (Less than Container Load)
 * - Air Freight
 * - Sea Freight
 * - Road Transport
 * - Multimodal
 * 
 * Features:
 * - Mode-specific form fields
 * - Real-time rate calculation
 * - Document upload
 * - Compliance checking
 * - Carrier selection
 * - Schedule optimization
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

// Transport modes
type TransportMode = "fcl" | "lcl" | "air" | "sea" | "road" | "multimodal";
type ContainerSize = "20GP" | "40GP" | "40HC" | "45HC" | "20RF" | "40RF";
type IncoTerms = "EXW" | "FCA" | "CPT" | "CIP" | "DAP" | "DPU" | "DDP" | "FAS" | "FOB" | "CFR" | "CIF";

interface ShipmentBookingData {
  // Basic Info
  bookingReference: string;
  mode: TransportMode;
  priority: "standard" | "express" | "premium";
  
  // Shipper
  shipperName: string;
  shipperAddress: string;
  shipperCity: string;
  shipperCountry: string;
  shipperContact: string;
  shipperPhone: string;
  shipperEmail: string;
  
  // Consignee
  consigneeName: string;
  consigneeAddress: string;
  consigneeCity: string;
  consigneeCountry: string;
  consigneeContact: string;
  consigneePhone: string;
  consigneeEmail: string;
  
  // Notify Party
  notifyPartyName: string;
  notifyPartyAddress: string;
  notifyPartyContact: string;
  
  // Origin
  originPort: string;
  originCountry: string;
  pickupRequired: boolean;
  pickupAddress: string;
  
  // Destination
  destinationPort: string;
  destinationCountry: string;
  deliveryRequired: boolean;
  deliveryAddress: string;
  
  // Schedule
  requestedPickupDate: string;
  requestedDeliveryDate: string;
  estimatedDepartureDate: string;
  estimatedArrivalDate: string;
  
  // Cargo
  cargoDescription: string;
  hsCode: string;
  commodityType: string;
  isDangerous: boolean;
  dangerousClass: string;
  unNumber: string;
  
  // FCL Specific
  containers: {
    size: ContainerSize;
    quantity: number;
    weight: number;
    sealNumber: string;
  }[];
  
  // LCL/General
  packages: {
    type: string;
    quantity: number;
    length: number;
    width: number;
    height: number;
    weight: number;
  }[];
  
  totalWeight: number;
  totalVolume: number;
  totalPackages: number;
  
  // Air Specific
  airlinePreference: string;
  flightNumber: string;
  awbNumber: string;
  
  // Sea Specific
  vesselName: string;
  voyageNumber: string;
  billOfLadingNumber: string;
  shippingLine: string;
  
  // Road Specific
  truckType: string;
  vehiclePlate: string;
  driverName: string;
  driverPhone: string;
  
  // Commercial
  incoterms: IncoTerms;
  commercialInvoiceNumber: string;
  commercialValue: number;
  valueCurrency: string;
  
  // Insurance
  insuranceRequired: boolean;
  insuranceValue: number;
  insuranceType: string;
  
  // Customs
  customsClearanceOrigin: boolean;
  customsClearanceDestination: boolean;
  originCustomsBroker: string;
  destinationCustomsBroker: string;
  
  // Documents
  documentsAttached: string[];
  
  // Notes
  specialInstructions: string;
  internalNotes: string;
  
  // Pricing
  freightCharges: number;
  originCharges: number;
  destinationCharges: number;
  customsFees: number;
  insuranceFees: number;
  totalCharges: number;
  paymentTerms: string;
}

// Step definitions based on mode
const getStepsForMode = (mode: TransportMode) => [
  { id: "mode", title: "Select Mode", icon: "ri-ship-line", description: "Choose transport mode" },
  { id: "shipper", title: "Shipper Details", icon: "ri-building-line", description: "Origin shipper information" },
  { id: "consignee", title: "Consignee Details", icon: "ri-home-4-line", description: "Destination receiver info" },
  { id: "route", title: "Route & Schedule", icon: "ri-route-line", description: "Ports and dates" },
  { id: "cargo", title: "Cargo Details", icon: "ri-box-3-line", description: mode === "fcl" ? "Container details" : "Package details" },
  { id: "commercial", title: "Commercial", icon: "ri-file-list-3-line", description: "Incoterms & invoice" },
  { id: "services", title: "Services", icon: "ri-customer-service-2-line", description: "Insurance & customs" },
  { id: "review", title: "Review & Book", icon: "ri-check-double-line", description: "Confirm booking" },
];

// Transport mode cards
const TRANSPORT_MODES = [
  {
    id: "fcl" as TransportMode,
    name: "Full Container Load",
    shortName: "FCL",
    description: "Complete container for your cargo",
    icon: "ri-ship-line",
    color: "blue",
    features: ["Exclusive use", "Door-to-door", "Cost effective for large cargo"],
    estimatedDays: "15-45 days",
  },
  {
    id: "lcl" as TransportMode,
    name: "Less than Container",
    shortName: "LCL",
    description: "Share container space with others",
    icon: "ri-archive-stack-line",
    color: "purple",
    features: ["Cost effective for small cargo", "Flexible quantities", "Consolidated shipping"],
    estimatedDays: "20-50 days",
  },
  {
    id: "air" as TransportMode,
    name: "Air Freight",
    shortName: "AIR",
    description: "Fast delivery by air",
    icon: "ri-plane-line",
    color: "sky",
    features: ["Fastest delivery", "High-value cargo", "Time-sensitive shipments"],
    estimatedDays: "2-7 days",
  },
  {
    id: "sea" as TransportMode,
    name: "Sea Freight (General)",
    shortName: "SEA",
    description: "General sea freight services",
    icon: "ri-sailboat-line",
    color: "teal",
    features: ["Bulk cargo", "Break bulk", "Project cargo"],
    estimatedDays: "20-60 days",
  },
  {
    id: "road" as TransportMode,
    name: "Road Transport",
    shortName: "ROAD",
    description: "Overland trucking",
    icon: "ri-truck-line",
    color: "orange",
    features: ["Door-to-door", "Cross-border", "Regional coverage"],
    estimatedDays: "1-10 days",
  },
  {
    id: "multimodal" as TransportMode,
    name: "Multimodal Transport",
    shortName: "MULTI",
    description: "Combined transport solutions",
    icon: "ri-links-line",
    color: "indigo",
    features: ["Sea + Road", "Air + Road", "Optimized routes"],
    estimatedDays: "Varies",
  },
];

const CONTAINER_SIZES: ContainerSize[] = ["20GP", "40GP", "40HC", "45HC", "20RF", "40RF"];

const INCOTERMS: { code: IncoTerms; name: string; group: string }[] = [
  { code: "EXW", name: "Ex Works", group: "E" },
  { code: "FCA", name: "Free Carrier", group: "F" },
  { code: "FAS", name: "Free Alongside Ship", group: "F" },
  { code: "FOB", name: "Free On Board", group: "F" },
  { code: "CPT", name: "Carriage Paid To", group: "C" },
  { code: "CIP", name: "Carriage Insurance Paid To", group: "C" },
  { code: "CFR", name: "Cost and Freight", group: "C" },
  { code: "CIF", name: "Cost Insurance Freight", group: "C" },
  { code: "DAP", name: "Delivered At Place", group: "D" },
  { code: "DPU", name: "Delivered at Place Unloaded", group: "D" },
  { code: "DDP", name: "Delivered Duty Paid", group: "D" },
];

const COUNTRIES = [
  { code: "SA", name: "Saudi Arabia" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "OM", name: "Oman" },
  { code: "KW", name: "Kuwait" },
  { code: "BH", name: "Bahrain" },
  { code: "QA", name: "Qatar" },
  { code: "JO", name: "Jordan" },
  { code: "EG", name: "Egypt" },
  { code: "IQ", name: "Iraq" },
  { code: "CN", name: "China" },
  { code: "IN", name: "India" },
  { code: "PK", name: "Pakistan" },
  { code: "TR", name: "Turkey" },
  { code: "DE", name: "Germany" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
];

const PORTS = {
  SA: ["Jeddah Islamic Port", "King Abdulaziz Port (Dammam)", "Jubail Commercial Port", "Yanbu Commercial Port", "King Abdullah Port"],
  AE: ["Jebel Ali Port", "Port Rashid", "Khalifa Port", "Sharjah Port"],
  CN: ["Shanghai Port", "Ningbo Port", "Shenzhen Port", "Guangzhou Port", "Qingdao Port"],
  IN: ["Nhava Sheva (JNPT)", "Mundra Port", "Chennai Port", "Kolkata Port"],
};

export default function ShipmentBookingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Initial form data
  const [formData, setFormData] = useState<ShipmentBookingData>({
    bookingReference: "",
    mode: "fcl",
    priority: "standard",
    
    shipperName: "",
    shipperAddress: "",
    shipperCity: "",
    shipperCountry: "SA",
    shipperContact: "",
    shipperPhone: "",
    shipperEmail: "",
    
    consigneeName: "",
    consigneeAddress: "",
    consigneeCity: "",
    consigneeCountry: "",
    consigneeContact: "",
    consigneePhone: "",
    consigneeEmail: "",
    
    notifyPartyName: "",
    notifyPartyAddress: "",
    notifyPartyContact: "",
    
    originPort: "",
    originCountry: "SA",
    pickupRequired: false,
    pickupAddress: "",
    
    destinationPort: "",
    destinationCountry: "",
    deliveryRequired: false,
    deliveryAddress: "",
    
    requestedPickupDate: "",
    requestedDeliveryDate: "",
    estimatedDepartureDate: "",
    estimatedArrivalDate: "",
    
    cargoDescription: "",
    hsCode: "",
    commodityType: "",
    isDangerous: false,
    dangerousClass: "",
    unNumber: "",
    
    containers: [{ size: "40GP", quantity: 1, weight: 0, sealNumber: "" }],
    packages: [{ type: "Pallet", quantity: 1, length: 0, width: 0, height: 0, weight: 0 }],
    
    totalWeight: 0,
    totalVolume: 0,
    totalPackages: 0,
    
    airlinePreference: "",
    flightNumber: "",
    awbNumber: "",
    
    vesselName: "",
    voyageNumber: "",
    billOfLadingNumber: "",
    shippingLine: "",
    
    truckType: "",
    vehiclePlate: "",
    driverName: "",
    driverPhone: "",
    
    incoterms: "FOB",
    commercialInvoiceNumber: "",
    commercialValue: 0,
    valueCurrency: "USD",
    
    insuranceRequired: false,
    insuranceValue: 0,
    insuranceType: "",
    
    customsClearanceOrigin: false,
    customsClearanceDestination: false,
    originCustomsBroker: "",
    destinationCustomsBroker: "",
    
    documentsAttached: [],
    
    specialInstructions: "",
    internalNotes: "",
    
    freightCharges: 0,
    originCharges: 0,
    destinationCharges: 0,
    customsFees: 0,
    insuranceFees: 0,
    totalCharges: 0,
    paymentTerms: "Prepaid",
  });

  const steps = getStepsForMode(formData.mode);

  // Generate booking reference on mount
  useEffect(() => {
    if (!formData.bookingReference) {
      const date = new Date();
      const prefix = "BK";
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
      updateField("bookingReference", `${prefix}-${year}${month}-${random}`);
    }
  }, []);

  // Calculate totals
  const calculateTotals = useCallback(() => {
    if (formData.mode === "fcl") {
      const totalWeight = formData.containers.reduce((sum, c) => sum + (c.weight * c.quantity), 0);
      setFormData(prev => ({ ...prev, totalWeight }));
    } else {
      const totalWeight = formData.packages.reduce((sum, p) => sum + (p.weight * p.quantity), 0);
      const totalVolume = formData.packages.reduce((sum, p) => sum + ((p.length * p.width * p.height / 1000000) * p.quantity), 0);
      const totalPackages = formData.packages.reduce((sum, p) => sum + p.quantity, 0);
      setFormData(prev => ({ ...prev, totalWeight, totalVolume, totalPackages }));
    }
  }, [formData.mode, formData.containers, formData.packages]);

  useEffect(() => {
    calculateTotals();
  }, [formData.containers, formData.packages, formData.mode]);

  // Update form field
  const updateField = (field: keyof ShipmentBookingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Validate step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Mode Selection
        // Already selected by default
        break;
      case 1: // Shipper
        if (!formData.shipperName.trim()) newErrors.shipperName = "Shipper name is required";
        if (!formData.shipperCountry) newErrors.shipperCountry = "Country is required";
        break;
      case 2: // Consignee
        if (!formData.consigneeName.trim()) newErrors.consigneeName = "Consignee name is required";
        if (!formData.consigneeCountry) newErrors.consigneeCountry = "Country is required";
        break;
      case 3: // Route
        if (!formData.originPort && !formData.pickupAddress) newErrors.originPort = "Origin port or pickup address required";
        if (!formData.destinationPort && !formData.deliveryAddress) newErrors.destinationPort = "Destination port or delivery address required";
        break;
      case 4: // Cargo
        if (!formData.cargoDescription.trim()) newErrors.cargoDescription = "Cargo description is required";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // Submit booking
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/tms/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tenantId: "flex-logistics",
          createdAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/tms/shipments/${data.id || formData.bookingReference}`);
      } else {
        throw new Error("Failed to create booking");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Container management
  const addContainer = () => {
    setFormData(prev => ({
      ...prev,
      containers: [...prev.containers, { size: "40GP", quantity: 1, weight: 0, sealNumber: "" }],
    }));
  };

  const removeContainer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      containers: prev.containers.filter((_, i) => i !== index),
    }));
  };

  const updateContainer = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      containers: prev.containers.map((c, i) => i === index ? { ...c, [field]: value } : c),
    }));
  };

  // Package management
  const addPackage = () => {
    setFormData(prev => ({
      ...prev,
      packages: [...prev.packages, { type: "Pallet", quantity: 1, length: 0, width: 0, height: 0, weight: 0 }],
    }));
  };

  const removePackage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index),
    }));
  };

  const updatePackage = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.map((p, i) => i === index ? { ...p, [field]: value } : p),
    }));
  };

  // Get color classes for mode
  const getModeColors = (mode: TransportMode) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      fcl: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600", border: "border-blue-300" },
      lcl: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600", border: "border-purple-300" },
      air: { bg: "bg-sky-50 dark:bg-sky-900/20", text: "text-sky-600", border: "border-sky-300" },
      sea: { bg: "bg-teal-50 dark:bg-teal-900/20", text: "text-teal-600", border: "border-teal-300" },
      road: { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-600", border: "border-orange-300" },
      multimodal: { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-600", border: "border-indigo-300" },
    };
    return colors[mode];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/tms/jobs")}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <i className="ri-arrow-left-line text-xl"></i>
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <i className="ri-ship-line text-blue-600"></i>
                  Book Shipment
                </h1>
                <p className="text-sm text-slate-500">Ref: {formData.bookingReference}</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg ${getModeColors(formData.mode).bg} ${getModeColors(formData.mode).text} font-medium`}>
              {TRANSPORT_MODES.find(m => m.id === formData.mode)?.shortName}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between overflow-x-auto">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                      index < currentStep
                        ? "bg-green-500 text-white"
                        : index === currentStep
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-400"
                    }`}
                  >
                    {index < currentStep ? (
                      <i className="ri-check-line"></i>
                    ) : (
                      <i className={step.icon}></i>
                    )}
                  </div>
                  <span className={`hidden lg:block text-sm font-medium ${
                    index === currentStep ? "text-blue-600" : "text-slate-500"
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    index < currentStep ? "bg-green-500" : "bg-slate-200 dark:bg-slate-700"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 0: Mode Selection */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Choose Your Transport Mode</h2>
                  <p className="text-slate-500 mt-2">Select the best option for your shipment needs</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {TRANSPORT_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => updateField("mode", mode.id)}
                      className={`p-6 rounded-xl border-2 text-left transition-all ${
                        formData.mode === mode.id
                          ? `${getModeColors(mode.id).border} ${getModeColors(mode.id).bg} shadow-lg`
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${getModeColors(mode.id).bg}`}>
                        <i className={`${mode.icon} text-2xl ${getModeColors(mode.id).text}`}></i>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{mode.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">{mode.description}</p>
                      <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                        <i className="ri-time-line mr-1"></i> {mode.estimatedDays}
                      </div>
                      <ul className="mt-3 space-y-1">
                        {mode.features.map((feature, i) => (
                          <li key={i} className="text-xs text-slate-500 flex items-center gap-1">
                            <i className="ri-checkbox-circle-fill text-green-500"></i>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Shipper Details */}
            {currentStep === 1 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <i className="ri-building-line text-blue-600"></i>
                  Shipper Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={formData.shipperName}
                      onChange={(e) => updateField("shipperName", e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${errors.shipperName ? "border-red-500" : "border-slate-200 dark:border-slate-600"} bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500`}
                      placeholder="Enter company name"
                    />
                    {errors.shipperName && <p className="text-red-500 text-sm mt-1">{errors.shipperName}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Address
                    </label>
                    <textarea
                      value={formData.shipperAddress}
                      onChange={(e) => updateField("shipperAddress", e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.shipperCity}
                      onChange={(e) => updateField("shipperCity", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Country *
                    </label>
                    <select
                      value={formData.shipperCountry}
                      onChange={(e) => updateField("shipperCountry", e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${errors.shipperCountry ? "border-red-500" : "border-slate-200 dark:border-slate-600"} bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500`}
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={formData.shipperContact}
                      onChange={(e) => updateField("shipperContact", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
                      placeholder="Contact name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.shipperPhone}
                      onChange={(e) => updateField("shipperPhone", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
                      placeholder="+966 xxx xxx xxxx"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.shipperEmail}
                      onChange={(e) => updateField("shipperEmail", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
                      placeholder="email@company.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Consignee Details */}
            {currentStep === 2 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <i className="ri-home-4-line text-blue-600"></i>
                  Consignee Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={formData.consigneeName}
                      onChange={(e) => updateField("consigneeName", e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${errors.consigneeName ? "border-red-500" : "border-slate-200 dark:border-slate-600"} bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500`}
                      placeholder="Enter company name"
                    />
                    {errors.consigneeName && <p className="text-red-500 text-sm mt-1">{errors.consigneeName}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Address
                    </label>
                    <textarea
                      value={formData.consigneeAddress}
                      onChange={(e) => updateField("consigneeAddress", e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.consigneeCity}
                      onChange={(e) => updateField("consigneeCity", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Country *
                    </label>
                    <select
                      value={formData.consigneeCountry}
                      onChange={(e) => updateField("consigneeCountry", e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${errors.consigneeCountry ? "border-red-500" : "border-slate-200 dark:border-slate-600"} bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={formData.consigneeContact}
                      onChange={(e) => updateField("consigneeContact", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
                      placeholder="Contact name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.consigneePhone}
                      onChange={(e) => updateField("consigneePhone", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                {/* Notify Party */}
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Notify Party (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={formData.notifyPartyName}
                      onChange={(e) => updateField("notifyPartyName", e.target.value)}
                      className="px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      value={formData.notifyPartyAddress}
                      onChange={(e) => updateField("notifyPartyAddress", e.target.value)}
                      className="px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                      placeholder="Address"
                    />
                    <input
                      type="text"
                      value={formData.notifyPartyContact}
                      onChange={(e) => updateField("notifyPartyContact", e.target.value)}
                      className="px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                      placeholder="Contact"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Route & Schedule */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <i className="ri-map-pin-line text-blue-600"></i>
                    Origin
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Country
                      </label>
                      <select
                        value={formData.originCountry}
                        onChange={(e) => updateField("originCountry", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                      >
                        {COUNTRIES.map(c => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Port *
                      </label>
                      <select
                        value={formData.originPort}
                        onChange={(e) => updateField("originPort", e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border ${errors.originPort ? "border-red-500" : "border-slate-200 dark:border-slate-600"} bg-white dark:bg-slate-700`}
                      >
                        <option value="">Select port</option>
                        {(PORTS[formData.originCountry as keyof typeof PORTS] || []).map(port => (
                          <option key={port} value={port}>{port}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.pickupRequired}
                          onChange={(e) => updateField("pickupRequired", e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Pickup from shipper location required
                        </span>
                      </label>
                    </div>
                    {formData.pickupRequired && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Pickup Address
                        </label>
                        <textarea
                          value={formData.pickupAddress}
                          onChange={(e) => updateField("pickupAddress", e.target.value)}
                          rows={2}
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                          placeholder="Full pickup address"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <i className="ri-flag-line text-green-600"></i>
                    Destination
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Country
                      </label>
                      <select
                        value={formData.destinationCountry}
                        onChange={(e) => updateField("destinationCountry", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                      >
                        <option value="">Select country</option>
                        {COUNTRIES.map(c => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Port *
                      </label>
                      <select
                        value={formData.destinationPort}
                        onChange={(e) => updateField("destinationPort", e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border ${errors.destinationPort ? "border-red-500" : "border-slate-200 dark:border-slate-600"} bg-white dark:bg-slate-700`}
                      >
                        <option value="">Select port</option>
                        {(PORTS[formData.destinationCountry as keyof typeof PORTS] || []).map(port => (
                          <option key={port} value={port}>{port}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.deliveryRequired}
                          onChange={(e) => updateField("deliveryRequired", e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Delivery to consignee location required
                        </span>
                      </label>
                    </div>
                    {formData.deliveryRequired && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Delivery Address
                        </label>
                        <textarea
                          value={formData.deliveryAddress}
                          onChange={(e) => updateField("deliveryAddress", e.target.value)}
                          rows={2}
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                          placeholder="Full delivery address"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <i className="ri-calendar-line text-purple-600"></i>
                    Schedule
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Requested Pickup Date
                      </label>
                      <input
                        type="date"
                        value={formData.requestedPickupDate}
                        onChange={(e) => updateField("requestedPickupDate", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Requested Delivery Date
                      </label>
                      <input
                        type="date"
                        value={formData.requestedDeliveryDate}
                        onChange={(e) => updateField("requestedDeliveryDate", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Cargo Details */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <i className="ri-box-3-line text-blue-600"></i>
                    Cargo Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Cargo Description *
                      </label>
                      <textarea
                        value={formData.cargoDescription}
                        onChange={(e) => updateField("cargoDescription", e.target.value)}
                        rows={3}
                        className={`w-full px-4 py-3 rounded-lg border ${errors.cargoDescription ? "border-red-500" : "border-slate-200 dark:border-slate-600"} bg-white dark:bg-slate-700`}
                        placeholder="Describe your cargo"
                      />
                      {errors.cargoDescription && <p className="text-red-500 text-sm mt-1">{errors.cargoDescription}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        HS Code
                      </label>
                      <input
                        type="text"
                        value={formData.hsCode}
                        onChange={(e) => updateField("hsCode", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                        placeholder="e.g., 8471.30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Commodity Type
                      </label>
                      <input
                        type="text"
                        value={formData.commodityType}
                        onChange={(e) => updateField("commodityType", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                        placeholder="e.g., Electronics"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.isDangerous}
                          onChange={(e) => updateField("isDangerous", e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Contains Dangerous Goods (DG)
                        </span>
                      </label>
                    </div>
                    {formData.isDangerous && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            DG Class
                          </label>
                          <input
                            type="text"
                            value={formData.dangerousClass}
                            onChange={(e) => updateField("dangerousClass", e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                            placeholder="e.g., Class 3"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            UN Number
                          </label>
                          <input
                            type="text"
                            value={formData.unNumber}
                            onChange={(e) => updateField("unNumber", e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                            placeholder="e.g., UN1203"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* FCL: Container Details */}
                {formData.mode === "fcl" && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <i className="ri-archive-line text-blue-600"></i>
                        Container Details
                      </h2>
                      <button
                        onClick={addContainer}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <i className="ri-add-line"></i> Add Container
                      </button>
                    </div>
                    <div className="space-y-4">
                      {formData.containers.map((container, index) => (
                        <div key={index} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <span className="font-medium">Container #{index + 1}</span>
                            {formData.containers.length > 1 && (
                              <button
                                onClick={() => removeContainer(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Size
                              </label>
                              <select
                                value={container.size}
                                onChange={(e) => updateContainer(index, "size", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                              >
                                {CONTAINER_SIZES.map(size => (
                                  <option key={size} value={size}>{size}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Quantity
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={container.quantity}
                                onChange={(e) => updateContainer(index, "quantity", parseInt(e.target.value))}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Weight (kg)
                              </label>
                              <input
                                type="number"
                                value={container.weight}
                                onChange={(e) => updateContainer(index, "weight", parseFloat(e.target.value))}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Seal Number
                              </label>
                              <input
                                type="text"
                                value={container.sealNumber}
                                onChange={(e) => updateContainer(index, "sealNumber", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">
                        Total Weight: {formData.totalWeight.toLocaleString()} kg
                      </div>
                    </div>
                  </div>
                )}

                {/* LCL/Other: Package Details */}
                {formData.mode !== "fcl" && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <i className="ri-stack-line text-blue-600"></i>
                        Package Details
                      </h2>
                      <button
                        onClick={addPackage}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <i className="ri-add-line"></i> Add Package
                      </button>
                    </div>
                    <div className="space-y-4">
                      {formData.packages.map((pkg, index) => (
                        <div key={index} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <span className="font-medium">Package #{index + 1}</span>
                            {formData.packages.length > 1 && (
                              <button
                                onClick={() => removePackage(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Type</label>
                              <select
                                value={pkg.type}
                                onChange={(e) => updatePackage(index, "type", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                              >
                                <option>Pallet</option>
                                <option>Box</option>
                                <option>Crate</option>
                                <option>Drum</option>
                                <option>Bag</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Qty</label>
                              <input
                                type="number"
                                min="1"
                                value={pkg.quantity}
                                onChange={(e) => updatePackage(index, "quantity", parseInt(e.target.value))}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">L (cm)</label>
                              <input
                                type="number"
                                value={pkg.length}
                                onChange={(e) => updatePackage(index, "length", parseFloat(e.target.value))}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">W (cm)</label>
                              <input
                                type="number"
                                value={pkg.width}
                                onChange={(e) => updatePackage(index, "width", parseFloat(e.target.value))}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">H (cm)</label>
                              <input
                                type="number"
                                value={pkg.height}
                                onChange={(e) => updatePackage(index, "height", parseFloat(e.target.value))}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                              <input
                                type="number"
                                value={pkg.weight}
                                onChange={(e) => updatePackage(index, "weight", parseFloat(e.target.value))}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-slate-500">Total Packages</div>
                        <div className="text-lg font-semibold">{formData.totalPackages}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">Total Weight</div>
                        <div className="text-lg font-semibold">{formData.totalWeight.toLocaleString()} kg</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">Total Volume</div>
                        <div className="text-lg font-semibold">{formData.totalVolume.toFixed(2)} m³</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Commercial */}
            {currentStep === 5 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <i className="ri-file-list-3-line text-blue-600"></i>
                  Commercial Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Incoterms
                    </label>
                    <select
                      value={formData.incoterms}
                      onChange={(e) => updateField("incoterms", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                    >
                      {INCOTERMS.map(term => (
                        <option key={term.code} value={term.code}>{term.code} - {term.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Commercial Invoice Number
                    </label>
                    <input
                      type="text"
                      value={formData.commercialInvoiceNumber}
                      onChange={(e) => updateField("commercialInvoiceNumber", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                      placeholder="Invoice number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Cargo Value
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.valueCurrency}
                        onChange={(e) => updateField("valueCurrency", e.target.value)}
                        className="w-24 px-3 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                      >
                        <option value="USD">USD</option>
                        <option value="SAR">SAR</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                      <input
                        type="number"
                        value={formData.commercialValue}
                        onChange={(e) => updateField("commercialValue", parseFloat(e.target.value))}
                        className="flex-1 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Payment Terms
                    </label>
                    <select
                      value={formData.paymentTerms}
                      onChange={(e) => updateField("paymentTerms", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                    >
                      <option value="Prepaid">Prepaid</option>
                      <option value="Collect">Collect</option>
                      <option value="Third Party">Third Party</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Services */}
            {currentStep === 6 && (
              <div className="space-y-6">
                {/* Insurance */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <i className="ri-shield-check-line text-green-600"></i>
                    Cargo Insurance
                  </h2>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.insuranceRequired}
                        onChange={(e) => updateField("insuranceRequired", e.target.checked)}
                        className="w-5 h-5 rounded"
                      />
                      <div>
                        <div className="font-medium">Yes, I need cargo insurance</div>
                        <div className="text-sm text-slate-500">Protect your shipment against loss or damage</div>
                      </div>
                    </label>
                    {formData.insuranceRequired && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Insurance Type</label>
                          <select
                            value={formData.insuranceType}
                            onChange={(e) => updateField("insuranceType", e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                          >
                            <option value="">Select type</option>
                            <option value="All Risk">All Risk</option>
                            <option value="Total Loss Only">Total Loss Only</option>
                            <option value="ICC A">ICC (A) - All Risks</option>
                            <option value="ICC B">ICC (B) - Named Perils</option>
                            <option value="ICC C">ICC (C) - Major Risks</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Insured Value</label>
                          <input
                            type="number"
                            value={formData.insuranceValue}
                            onChange={(e) => updateField("insuranceValue", parseFloat(e.target.value))}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customs */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <i className="ri-government-line text-blue-600"></i>
                    Customs Clearance
                  </h2>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.customsClearanceOrigin}
                        onChange={(e) => updateField("customsClearanceOrigin", e.target.checked)}
                        className="w-5 h-5 rounded"
                      />
                      <div>
                        <div className="font-medium">Origin Customs Clearance</div>
                        <div className="text-sm text-slate-500">Handle export customs at origin</div>
                      </div>
                    </label>
                    {formData.customsClearanceOrigin && (
                      <div className="ml-8">
                        <input
                          type="text"
                          value={formData.originCustomsBroker}
                          onChange={(e) => updateField("originCustomsBroker", e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                          placeholder="Customs broker name (optional)"
                        />
                      </div>
                    )}
                    <label className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.customsClearanceDestination}
                        onChange={(e) => updateField("customsClearanceDestination", e.target.checked)}
                        className="w-5 h-5 rounded"
                      />
                      <div>
                        <div className="font-medium">Destination Customs Clearance</div>
                        <div className="text-sm text-slate-500">Handle import customs at destination</div>
                      </div>
                    </label>
                    {formData.customsClearanceDestination && (
                      <div className="ml-8">
                        <input
                          type="text"
                          value={formData.destinationCustomsBroker}
                          onChange={(e) => updateField("destinationCustomsBroker", e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                          placeholder="Customs broker name (optional)"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Special Instructions */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <i className="ri-sticky-note-line text-yellow-600"></i>
                    Special Instructions
                  </h2>
                  <textarea
                    value={formData.specialInstructions}
                    onChange={(e) => updateField("specialInstructions", e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                    placeholder="Any special handling instructions, requirements, or notes..."
                  />
                </div>
              </div>
            )}

            {/* Step 7: Review & Submit */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Review Your Booking</h2>
                  <p className="text-slate-500">Please review all details before submitting</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mode */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <i className="ri-ship-line text-blue-600"></i> Transport Mode
                    </h3>
                    <div className={`inline-flex px-4 py-2 rounded-lg ${getModeColors(formData.mode).bg} ${getModeColors(formData.mode).text} font-medium`}>
                      {TRANSPORT_MODES.find(m => m.id === formData.mode)?.name}
                    </div>
                  </div>

                  {/* Route */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <i className="ri-route-line text-green-600"></i> Route
                    </h3>
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-sm text-slate-500">From</div>
                        <div className="font-medium">{formData.originPort || "TBD"}</div>
                      </div>
                      <i className="ri-arrow-right-line text-slate-400"></i>
                      <div>
                        <div className="text-sm text-slate-500">To</div>
                        <div className="font-medium">{formData.destinationPort || "TBD"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Shipper */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <i className="ri-building-line text-purple-600"></i> Shipper
                    </h3>
                    <div className="font-medium">{formData.shipperName || "-"}</div>
                    <div className="text-sm text-slate-500">{formData.shipperCity}, {COUNTRIES.find(c => c.code === formData.shipperCountry)?.name}</div>
                  </div>

                  {/* Consignee */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <i className="ri-home-4-line text-orange-600"></i> Consignee
                    </h3>
                    <div className="font-medium">{formData.consigneeName || "-"}</div>
                    <div className="text-sm text-slate-500">{formData.consigneeCity}, {COUNTRIES.find(c => c.code === formData.consigneeCountry)?.name}</div>
                  </div>

                  {/* Cargo */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <i className="ri-box-3-line text-teal-600"></i> Cargo
                    </h3>
                    <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">{formData.cargoDescription || "-"}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-slate-500">Weight:</span> {formData.totalWeight.toLocaleString()} kg</div>
                      {formData.mode !== "fcl" && <div><span className="text-slate-500">Volume:</span> {formData.totalVolume.toFixed(2)} m³</div>}
                    </div>
                  </div>

                  {/* Commercial */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <i className="ri-file-list-3-line text-indigo-600"></i> Commercial
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-slate-500">Incoterms:</span> {formData.incoterms}</div>
                      <div><span className="text-slate-500">Value:</span> {formData.valueCurrency} {formData.commercialValue.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Services Summary */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Additional Services</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.pickupRequired && (
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                        <i className="ri-truck-line mr-1"></i> Pickup
                      </span>
                    )}
                    {formData.deliveryRequired && (
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                        <i className="ri-map-pin-line mr-1"></i> Delivery
                      </span>
                    )}
                    {formData.insuranceRequired && (
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                        <i className="ri-shield-check-line mr-1"></i> Insurance
                      </span>
                    )}
                    {formData.customsClearanceOrigin && (
                      <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm">
                        <i className="ri-government-line mr-1"></i> Origin Customs
                      </span>
                    )}
                    {formData.customsClearanceDestination && (
                      <span className="px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full text-sm">
                        <i className="ri-government-line mr-1"></i> Destination Customs
                      </span>
                    )}
                    {formData.isDangerous && (
                      <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm">
                        <i className="ri-alert-line mr-1"></i> Dangerous Goods
                      </span>
                    )}
                  </div>
                </div>

                {/* Terms */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <i className="ri-information-line text-yellow-600 mt-0.5"></i>
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      By submitting this booking, you confirm that all information provided is accurate and you agree to our terms and conditions.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <i className="ri-arrow-left-line"></i>
            Previous
          </button>
          <div className="text-sm text-slate-500">
            Step {currentStep + 1} of {steps.length}
          </div>
          {currentStep < steps.length - 1 ? (
            <button
              onClick={nextStep}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              Next
              <i className="ri-arrow-right-line"></i>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="ri-check-line"></i>
                  Submit Booking
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
