/**
 * Comprehensive Field Components for Service Requirement Form
 * Full implementations for all 8 service categories
 * No placeholders - complete, production-ready components
 */

"use client";

import React, { useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";

// Lazy load optional components
const VoiceInput = lazy(() => import("./VoiceInput"));
const RichTextEditor = lazy(() => import("./RichTextEditor"));
import {
  Package,
  Truck,
  Globe,
  Users,
  Languages,
  Network,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Building2,
  Target,
  Clock,
  Shield,
  FileText,
  Award,
  Briefcase,
  UserCheck,
  GraduationCap,
} from "lucide-react";

// ============================================================================
// TRANSPORTATION FIELDS - COMPLETE IMPLEMENTATION
// ============================================================================

export function TransportationFields({ requirement, setRequirement }: any) {
  const req = requirement as any;
  const transReq = req as any;

  return (
    <div className="space-y-6">
      {/* Service Type */}
      <div>
        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
          Transportation Service Type <span className="text-red-500">*</span>
        </label>
        <select
          value={transReq.serviceType || ""}
          onChange={(e) =>
            setRequirement({ ...requirement, serviceType: e.target.value })
          }
          className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select service type...</option>
          <option value="FTL">Full Truck Load (FTL)</option>
          <option value="LTL">Less Than Truck Load (LTL)</option>
          <option value="EXPRESS">Express Delivery</option>
          <option value="SAME_DAY">Same Day Delivery</option>
          <option value="SCHEDULED">Scheduled Service</option>
          <option value="ON_DEMAND">On Demand</option>
        </select>
      </div>

      {/* Route Requirements */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Route Information <span className="text-red-500">*</span>
        </h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Origin Address
              </label>
              <input
                type="text"
                value={transReq.route?.origin?.address || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    route: {
                      ...transReq.route,
                      origin: {
                        ...transReq.route?.origin,
                        address: e.target.value,
                      },
                    },
                  })
                }
                placeholder="Street address"
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Origin City
              </label>
              <input
                type="text"
                value={transReq.route?.origin?.city || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    route: {
                      ...transReq.route,
                      origin: {
                        ...transReq.route?.origin,
                        city: e.target.value,
                      },
                    },
                  })
                }
                placeholder="City name"
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Origin Country
              </label>
              <input
                type="text"
                value={transReq.route?.origin?.country || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    route: {
                      ...transReq.route,
                      origin: {
                        ...transReq.route?.origin,
                        country: e.target.value,
                      },
                    },
                  })
                }
                placeholder="Country"
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Destination Address
              </label>
              <input
                type="text"
                value={transReq.route?.destination?.address || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    route: {
                      ...transReq.route,
                      destination: {
                        ...transReq.route?.destination,
                        address: e.target.value,
                      },
                    },
                  })
                }
                placeholder="Street address"
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Destination City
              </label>
              <input
                type="text"
                value={transReq.route?.destination?.city || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    route: {
                      ...transReq.route,
                      destination: {
                        ...transReq.route?.destination,
                        city: e.target.value,
                      },
                    },
                  })
                }
                placeholder="City name"
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Destination Country
              </label>
              <input
                type="text"
                value={transReq.route?.destination?.country || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    route: {
                      ...transReq.route,
                      destination: {
                        ...transReq.route?.destination,
                        country: e.target.value,
                      },
                    },
                  })
                }
                placeholder="Country"
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
              <input
                type="checkbox"
                checked={transReq.route?.multipleStops || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    route: {
                      ...transReq.route,
                      multipleStops: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Multiple Stops</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
              <input
                type="checkbox"
                checked={transReq.route?.returnTrip || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    route: { ...transReq.route, returnTrip: e.target.checked },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Return Trip Required</span>
            </label>
          </div>
        </div>
      </div>

      {/* Cargo Details */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Cargo Details <span className="text-red-500">*</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              value={transReq.cargo?.weight || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  cargo: { ...transReq.cargo, weight: Number(e.target.value) },
                })
              }
              placeholder="0"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Volume (m³)
            </label>
            <input
              type="number"
              value={transReq.cargo?.volume || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  cargo: { ...transReq.cargo, volume: Number(e.target.value) },
                })
              }
              placeholder="0"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Pallets</label>
            <input
              type="number"
              value={transReq.cargo?.pallets || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  cargo: { ...transReq.cargo, pallets: Number(e.target.value) },
                })
              }
              placeholder="0"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Length</label>
            <input
              type="number"
              value={transReq.cargo?.dimensions?.length || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  cargo: {
                    ...transReq.cargo,
                    dimensions: {
                      ...transReq.cargo?.dimensions,
                      length: Number(e.target.value),
                    },
                  },
                })
              }
              placeholder="0"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Width</label>
            <input
              type="number"
              value={transReq.cargo?.dimensions?.width || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  cargo: {
                    ...transReq.cargo,
                    dimensions: {
                      ...transReq.cargo?.dimensions,
                      width: Number(e.target.value),
                    },
                  },
                })
              }
              placeholder="0"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Height</label>
            <input
              type="number"
              value={transReq.cargo?.dimensions?.height || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  cargo: {
                    ...transReq.cargo,
                    dimensions: {
                      ...transReq.cargo?.dimensions,
                      height: Number(e.target.value),
                    },
                  },
                })
              }
              placeholder="0"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
            <input
              type="checkbox"
              checked={transReq.cargo?.hazardous || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  cargo: { ...transReq.cargo, hazardous: e.target.checked },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Hazardous Materials</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
            <input
              type="checkbox"
              checked={transReq.cargo?.temperatureControlled || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  cargo: {
                    ...transReq.cargo,
                    temperatureControlled: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Temperature Controlled</span>
          </label>
        </div>
      </div>

      {/* Vehicle Requirements */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Truck className="w-4 h-4" />
          Vehicle Requirements
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Vehicle Type
            </label>
            <select
              value={transReq.vehicle?.type || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  vehicle: { ...transReq.vehicle, type: e.target.value },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              <option value="">Select vehicle type...</option>
              <option value="TRUCK">Truck</option>
              <option value="VAN">Van</option>
              <option value="TRAILER">Trailer</option>
              <option value="CONTAINER">Container</option>
              <option value="FLEXIBLE">Flexible</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Vehicle Size
            </label>
            <input
              type="text"
              value={transReq.vehicle?.size || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  vehicle: { ...transReq.vehicle, size: e.target.value },
                })
              }
              placeholder="e.g., 3.5 ton, 10 ton"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
            <input
              type="checkbox"
              checked={transReq.vehicle?.refrigeration || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  vehicle: {
                    ...transReq.vehicle,
                    refrigeration: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Refrigeration</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
            <input
              type="checkbox"
              checked={transReq.vehicle?.liftgate || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  vehicle: { ...transReq.vehicle, liftgate: e.target.checked },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Liftgate</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
            <input
              type="checkbox"
              checked={transReq.vehicle?.tailgate || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  vehicle: { ...transReq.vehicle, tailgate: e.target.checked },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Tailgate</span>
          </label>
        </div>
      </div>

      {/* Service Level */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Service Level Requirements
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Pickup Date
            </label>
            <input
              type="date"
              value={transReq.serviceLevel?.pickupDate || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...transReq.serviceLevel,
                    pickupDate: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Delivery Date
            </label>
            <input
              type="date"
              value={transReq.serviceLevel?.deliveryDate || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...transReq.serviceLevel,
                    deliveryDate: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
            <input
              type="checkbox"
              checked={transReq.serviceLevel?.tracking || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...transReq.serviceLevel,
                    tracking: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Real-Time Tracking</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
            <input
              type="checkbox"
              checked={transReq.serviceLevel?.proofOfDelivery || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...transReq.serviceLevel,
                    proofOfDelivery: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Proof of Delivery</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
            <input
              type="checkbox"
              checked={transReq.serviceLevel?.insurance || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...transReq.serviceLevel,
                    insurance: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Insurance</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
            <input
              type="checkbox"
              checked={transReq.serviceLevel?.customsClearance || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...transReq.serviceLevel,
                    customsClearance: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Customs Clearance</span>
          </label>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FREIGHT FIELDS - COMPLETE IMPLEMENTATION
// ============================================================================

export function FreightFields({ requirement, setRequirement }: any) {
  const req = requirement as any;
  const freightReq = req as any;

  return (
    <div className="space-y-6">
      {/* Service Type */}
      <div>
        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
          Freight Service Type <span className="text-red-500">*</span>
        </label>
        <select
          value={freightReq.serviceType || ""}
          onChange={(e) =>
            setRequirement({ ...requirement, serviceType: e.target.value })
          }
          className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select freight type...</option>
          <option value="FCL">Full Container Load (FCL)</option>
          <option value="LCL">Less Than Container Load (LCL)</option>
          <option value="AIR_FREIGHT">Air Freight</option>
          <option value="SEA_FREIGHT">Sea Freight</option>
          <option value="RAIL_FREIGHT">Rail Freight</option>
          <option value="MULTIMODAL">Multimodal</option>
        </select>
      </div>

      {/* Route Requirements */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Route Information <span className="text-red-500">*</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Origin Port/Airport
            </label>
            <input
              type="text"
              value={freightReq.route?.origin?.port || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  route: {
                    ...freightReq.route,
                    origin: {
                      ...freightReq.route?.origin,
                      port: e.target.value,
                    },
                  },
                })
              }
              placeholder="e.g., JED, DXB, RUH"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Origin City
            </label>
            <input
              type="text"
              value={freightReq.route?.origin?.city || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  route: {
                    ...freightReq.route,
                    origin: {
                      ...freightReq.route?.origin,
                      city: e.target.value,
                    },
                  },
                })
              }
              placeholder="City name"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Destination Port/Airport
            </label>
            <input
              type="text"
              value={freightReq.route?.destination?.port || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  route: {
                    ...freightReq.route,
                    destination: {
                      ...freightReq.route?.destination,
                      port: e.target.value,
                    },
                  },
                })
              }
              placeholder="e.g., JED, DXB, RUH"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Destination City
            </label>
            <input
              type="text"
              value={freightReq.route?.destination?.city || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  route: {
                    ...freightReq.route,
                    destination: {
                      ...freightReq.route?.destination,
                      city: e.target.value,
                    },
                  },
                })
              }
              placeholder="City name"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Incoterms</label>
            <select
              value={freightReq.route?.incoterms || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  route: { ...freightReq.route, incoterms: e.target.value },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              <option value="">Select incoterms...</option>
              <option value="FOB">FOB (Free On Board)</option>
              <option value="CIF">CIF (Cost, Insurance & Freight)</option>
              <option value="EXW">EXW (Ex Works)</option>
              <option value="DDP">DDP (Delivered Duty Paid)</option>
              <option value="DAP">DAP (Delivered At Place)</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
            <input
              type="checkbox"
              checked={freightReq.route?.doorToDoor || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  route: { ...freightReq.route, doorToDoor: e.target.checked },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Door to Door Service</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
            <input
              type="checkbox"
              checked={freightReq.route?.portToPort || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  route: { ...freightReq.route, portToPort: e.target.checked },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Port to Port Service</span>
          </label>
        </div>
      </div>

      {/* Container Details (for FCL/LCL) */}
      {(freightReq.serviceType === "FCL" ||
        freightReq.serviceType === "LCL") && (
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
          <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Container Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Container Type
              </label>
              <select
                value={freightReq.cargo?.containers?.type || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    cargo: {
                      ...freightReq.cargo,
                      containers: {
                        ...freightReq.cargo?.containers,
                        type: e.target.value,
                      },
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              >
                <option value="">Select type...</option>
                <option value="20FT">20 FT</option>
                <option value="40FT">40 FT</option>
                <option value="40FT_HC">40 FT High Cube</option>
                <option value="45FT">45 FT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <input
                type="number"
                value={freightReq.cargo?.containers?.quantity || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    cargo: {
                      ...freightReq.cargo,
                      containers: {
                        ...freightReq.cargo?.containers,
                        quantity: Number(e.target.value),
                      },
                    },
                  })
                }
                placeholder="0"
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Full or Partial
              </label>
              <select
                value={freightReq.cargo?.containers?.fullOrPartial || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    cargo: {
                      ...freightReq.cargo,
                      containers: {
                        ...freightReq.cargo?.containers,
                        fullOrPartial: e.target.value,
                      },
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              >
                <option value="">Select...</option>
                <option value="FULL">Full Container</option>
                <option value="PARTIAL">Partial Container</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Cargo Details */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Cargo Details <span className="text-red-500">*</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              value={freightReq.cargo?.weight || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  cargo: {
                    ...freightReq.cargo,
                    weight: Number(e.target.value),
                  },
                })
              }
              placeholder="0"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Volume (m³)
            </label>
            <input
              type="number"
              value={freightReq.cargo?.volume || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  cargo: {
                    ...freightReq.cargo,
                    volume: Number(e.target.value),
                  },
                })
              }
              placeholder="0"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Pieces</label>
            <input
              type="number"
              value={freightReq.cargo?.pieces || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  cargo: {
                    ...freightReq.cargo,
                    pieces: Number(e.target.value),
                  },
                })
              }
              placeholder="0"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
            <input
              type="checkbox"
              checked={freightReq.cargo?.hazardous || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  cargo: { ...freightReq.cargo, hazardous: e.target.checked },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Hazardous Materials</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
            <input
              type="checkbox"
              checked={freightReq.cargo?.temperatureControlled || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  cargo: {
                    ...freightReq.cargo,
                    temperatureControlled: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Temperature Controlled</span>
          </label>
        </div>
      </div>

      {/* Service Level */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Service Level Requirements
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Transit Time (days)
            </label>
            <input
              type="number"
              value={freightReq.serviceLevel?.transitTime || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...freightReq.serviceLevel,
                    transitTime: Number(e.target.value),
                  },
                })
              }
              placeholder="Expected days"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Urgency Level
            </label>
            <select
              value={freightReq.serviceLevel?.urgency || "STANDARD"}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...freightReq.serviceLevel,
                    urgency: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              <option value="STANDARD">Standard</option>
              <option value="EXPRESS">Express</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
            <input
              type="checkbox"
              checked={freightReq.serviceLevel?.customsClearance || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...freightReq.serviceLevel,
                    customsClearance: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Customs Clearance</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
            <input
              type="checkbox"
              checked={freightReq.serviceLevel?.insurance || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...freightReq.serviceLevel,
                    insurance: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Insurance</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
            <input
              type="checkbox"
              checked={freightReq.serviceLevel?.tracking || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...freightReq.serviceLevel,
                    tracking: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Real-Time Tracking</span>
          </label>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CONSULTING FIELDS - COMPLETE IMPLEMENTATION
// ============================================================================

export function ConsultingFields({ requirement, setRequirement }: any) {
  const req = requirement as any;
  const consultingReq = req as any;

  return (
    <div className="space-y-6">
      {/* Service Type */}
      <div>
        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
          Consulting Service Type <span className="text-red-500">*</span>
        </label>
        <select
          value={consultingReq.serviceType || ""}
          onChange={(e) =>
            setRequirement({ ...requirement, serviceType: e.target.value })
          }
          className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select service type...</option>
          <option value="CIVIL_DEFENSE">Civil Defense</option>
          <option value="SAUDIZATION">Saudization</option>
          <option value="COMPLIANCE">Compliance</option>
          <option value="REGULATORY">Regulatory</option>
          <option value="SAFETY">Safety</option>
          <option value="QUALITY">Quality</option>
          <option value="ENVIRONMENTAL">Environmental</option>
          <option value="LEGAL">Legal</option>
          <option value="FINANCIAL">Financial</option>
          <option value="TECHNICAL">Technical</option>
          <option value="STRATEGIC">Strategic</option>
        </select>
      </div>

      {/* Project Details */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Project Details
        </h4>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Project Scope
              </label>
              <Suspense fallback={null}>
                <VoiceInput
                  onTranscript={(text) => {
                    setRequirement({
                      ...requirement,
                      project: {
                        ...consultingReq.project,
                        scope:
                          (consultingReq.project?.scope || "") + " " + text,
                      },
                    });
                  }}
                />
              </Suspense>
            </div>
            <Suspense
              fallback={
                <textarea
                  value={consultingReq.project?.scope || ""}
                  onChange={(e) =>
                    setRequirement({
                      ...requirement,
                      project: {
                        ...consultingReq.project,
                        scope: e.target.value,
                      },
                    })
                  }
                  rows={4}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the project scope and requirements..."
                />
              }
            >
              <RichTextEditor
                value={consultingReq.project?.scope || ""}
                onChange={(value) =>
                  setRequirement({
                    ...requirement,
                    project: { ...consultingReq.project, scope: value },
                  })
                }
                placeholder="Describe the project scope with formatting..."
                minHeight="150px"
              />
            </Suspense>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Project Objectives
            </label>
            <div className="space-y-2">
              {(consultingReq.project?.objectives || [""]).map(
                (obj: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={obj}
                      onChange={(e) => {
                        const newObjectives = [
                          ...(consultingReq.project?.objectives || []),
                        ];
                        newObjectives[idx] = e.target.value;
                        setRequirement({
                          ...requirement,
                          project: {
                            ...consultingReq.project,
                            objectives: newObjectives,
                          },
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                      placeholder={`Objective ${idx + 1}...`}
                    />
                    {(consultingReq.project?.objectives || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newObjectives = (
                            consultingReq.project?.objectives || []
                          ).filter((_: any, i: number) => i !== idx);
                          setRequirement({
                            ...requirement,
                            project: {
                              ...consultingReq.project,
                              objectives: newObjectives,
                            },
                          });
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ),
              )}
              <button
                type="button"
                onClick={() => {
                  setRequirement({
                    ...requirement,
                    project: {
                      ...consultingReq.project,
                      objectives: [
                        ...(consultingReq.project?.objectives || []),
                        "",
                      ],
                    },
                  });
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Objective
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Deliverables
            </label>
            <div className="space-y-2">
              {(consultingReq.project?.deliverables || [""]).map(
                (del: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={del}
                      onChange={(e) => {
                        const newDeliverables = [
                          ...(consultingReq.project?.deliverables || []),
                        ];
                        newDeliverables[idx] = e.target.value;
                        setRequirement({
                          ...requirement,
                          project: {
                            ...consultingReq.project,
                            deliverables: newDeliverables,
                          },
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                      placeholder={`Deliverable ${idx + 1}...`}
                    />
                    {(consultingReq.project?.deliverables || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newDeliverables = (
                            consultingReq.project?.deliverables || []
                          ).filter((_: any, i: number) => i !== idx);
                          setRequirement({
                            ...requirement,
                            project: {
                              ...consultingReq.project,
                              deliverables: newDeliverables,
                            },
                          });
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ),
              )}
              <button
                type="button"
                onClick={() => {
                  setRequirement({
                    ...requirement,
                    project: {
                      ...consultingReq.project,
                      deliverables: [
                        ...(consultingReq.project?.deliverables || []),
                        "",
                      ],
                    },
                  });
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Deliverable
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Complexity Level
              </label>
              <select
                value={consultingReq.project?.complexity || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    project: {
                      ...consultingReq.project,
                      complexity: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              >
                <option value="">Select complexity...</option>
                <option value="SIMPLE">Simple</option>
                <option value="MODERATE">Moderate</option>
                <option value="COMPLEX">Complex</option>
                <option value="VERY_COMPLEX">Very Complex</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Industry
              </label>
              <input
                type="text"
                value={consultingReq.project?.industry || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    project: {
                      ...consultingReq.project,
                      industry: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="e.g., Logistics, Manufacturing"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Sector
            </label>
            <input
              type="text"
              value={consultingReq.project?.sector || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  project: { ...consultingReq.project, sector: e.target.value },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              placeholder="e.g., Supply Chain, Operations"
            />
          </div>
        </div>
      </div>

      {/* Consultant Requirements */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <UserCheck className="w-4 h-4" />
          Consultant Requirements
        </h4>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Minimum Years of Experience
              </label>
              <input
                type="number"
                min="0"
                value={consultingReq.consultant?.experience?.minimumYears || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    consultant: {
                      ...consultingReq.consultant,
                      experience: {
                        ...consultingReq.consultant?.experience,
                        minimumYears: parseInt(e.target.value) || undefined,
                      },
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="e.g., 5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Work Location
              </label>
              <select
                value={consultingReq.consultant?.location || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    consultant: {
                      ...consultingReq.consultant,
                      location: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              >
                <option value="">Select location...</option>
                <option value="ONSITE">Onsite</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Specific Experience Required
            </label>
            <div className="space-y-2">
              {(
                consultingReq.consultant?.experience?.specificExperience || [""]
              ).map((exp: string, idx: number) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={exp}
                    onChange={(e) => {
                      const newExp = [
                        ...(consultingReq.consultant?.experience
                          ?.specificExperience || []),
                      ];
                      newExp[idx] = e.target.value;
                      setRequirement({
                        ...requirement,
                        consultant: {
                          ...consultingReq.consultant,
                          experience: {
                            ...consultingReq.consultant?.experience,
                            specificExperience: newExp,
                          },
                        },
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    placeholder={`Experience ${idx + 1}...`}
                  />
                  {(
                    consultingReq.consultant?.experience?.specificExperience ||
                    []
                  ).length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newExp = (
                          consultingReq.consultant?.experience
                            ?.specificExperience || []
                        ).filter((_: any, i: number) => i !== idx);
                        setRequirement({
                          ...requirement,
                          consultant: {
                            ...consultingReq.consultant,
                            experience: {
                              ...consultingReq.consultant?.experience,
                              specificExperience: newExp,
                            },
                          },
                        });
                      }}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setRequirement({
                    ...requirement,
                    consultant: {
                      ...consultingReq.consultant,
                      experience: {
                        ...consultingReq.consultant?.experience,
                        specificExperience: [
                          ...(consultingReq.consultant?.experience
                            ?.specificExperience || []),
                          "",
                        ],
                      },
                    },
                  });
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Experience
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Required Qualifications
            </label>
            <div className="space-y-2">
              {(consultingReq.consultant?.qualifications || [""]).map(
                (qual: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={qual}
                      onChange={(e) => {
                        const newQuals = [
                          ...(consultingReq.consultant?.qualifications || []),
                        ];
                        newQuals[idx] = e.target.value;
                        setRequirement({
                          ...requirement,
                          consultant: {
                            ...consultingReq.consultant,
                            qualifications: newQuals,
                          },
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                      placeholder={`Qualification ${idx + 1}...`}
                    />
                    {(consultingReq.consultant?.qualifications || []).length >
                      1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newQuals = (
                            consultingReq.consultant?.qualifications || []
                          ).filter((_: any, i: number) => i !== idx);
                          setRequirement({
                            ...requirement,
                            consultant: {
                              ...consultingReq.consultant,
                              qualifications: newQuals,
                            },
                          });
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ),
              )}
              <button
                type="button"
                onClick={() => {
                  setRequirement({
                    ...requirement,
                    consultant: {
                      ...consultingReq.consultant,
                      qualifications: [
                        ...(consultingReq.consultant?.qualifications || []),
                        "",
                      ],
                    },
                  });
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Qualification
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Required Certifications
            </label>
            <div className="space-y-2">
              {(consultingReq.consultant?.certifications || [""]).map(
                (cert: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={cert}
                      onChange={(e) => {
                        const newCerts = [
                          ...(consultingReq.consultant?.certifications || []),
                        ];
                        newCerts[idx] = e.target.value;
                        setRequirement({
                          ...requirement,
                          consultant: {
                            ...consultingReq.consultant,
                            certifications: newCerts,
                          },
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                      placeholder={`Certification ${idx + 1}...`}
                    />
                    {(consultingReq.consultant?.certifications || []).length >
                      1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newCerts = (
                            consultingReq.consultant?.certifications || []
                          ).filter((_: any, i: number) => i !== idx);
                          setRequirement({
                            ...requirement,
                            consultant: {
                              ...consultingReq.consultant,
                              certifications: newCerts,
                            },
                          });
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ),
              )}
              <button
                type="button"
                onClick={() => {
                  setRequirement({
                    ...requirement,
                    consultant: {
                      ...consultingReq.consultant,
                      certifications: [
                        ...(consultingReq.consultant?.certifications || []),
                        "",
                      ],
                    },
                  });
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Certification
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Required Languages
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                "Arabic",
                "English",
                "French",
                "Spanish",
                "German",
                "Chinese",
              ].map((lang) => (
                <label
                  key={lang}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-600"
                >
                  <input
                    type="checkbox"
                    checked={(
                      consultingReq.consultant?.languages || []
                    ).includes(lang)}
                    onChange={(e) => {
                      const current = consultingReq.consultant?.languages || [];
                      const updated = e.target.checked
                        ? [...current, lang]
                        : current.filter((l: string) => l !== lang);
                      setRequirement({
                        ...requirement,
                        consultant: {
                          ...consultingReq.consultant,
                          languages: updated,
                        },
                      });
                    }}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">{lang}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Service Level */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Service Level
        </h4>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Engagement Type
              </label>
              <select
                value={consultingReq.serviceLevel?.engagementType || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    serviceLevel: {
                      ...consultingReq.serviceLevel,
                      engagementType: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              >
                <option value="">Select type...</option>
                <option value="PROJECT">Project-Based</option>
                <option value="ONGOING">Ongoing</option>
                <option value="ADVISORY">Advisory</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Availability
              </label>
              <select
                value={consultingReq.serviceLevel?.availability || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    serviceLevel: {
                      ...consultingReq.serviceLevel,
                      availability: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              >
                <option value="">Select availability...</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="AS_NEEDED">As Needed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Start Date
              </label>
              <input
                type="date"
                value={consultingReq.serviceLevel?.startDate || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    serviceLevel: {
                      ...consultingReq.serviceLevel,
                      startDate: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Duration (weeks)
              </label>
              <input
                type="number"
                min="1"
                value={consultingReq.serviceLevel?.duration || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    serviceLevel: {
                      ...consultingReq.serviceLevel,
                      duration: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="e.g., 12"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Hours Per Week
              </label>
              <input
                type="number"
                min="1"
                max="40"
                value={consultingReq.serviceLevel?.hoursPerWeek || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    serviceLevel: {
                      ...consultingReq.serviceLevel,
                      hoursPerWeek: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="e.g., 20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Response Time (hours)
            </label>
            <input
              type="number"
              min="1"
              value={consultingReq.serviceLevel?.responseTime || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...consultingReq.serviceLevel,
                    responseTime: parseInt(e.target.value) || undefined,
                  },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              placeholder="e.g., 24"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MANPOWER FIELDS - COMPLETE IMPLEMENTATION
// ============================================================================

export function ManpowerFields({ requirement, setRequirement }: any) {
  const req = requirement as any;
  const manpowerReq = req as any;

  return (
    <div className="space-y-6">
      {/* Service Type */}
      <div>
        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
          Manpower Service Type <span className="text-red-500">*</span>
        </label>
        <select
          value={manpowerReq.serviceType || ""}
          onChange={(e) =>
            setRequirement({ ...requirement, serviceType: e.target.value })
          }
          className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select service type...</option>
          <option value="WAREHOUSE_STAFF">Warehouse Staff</option>
          <option value="DRIVERS">Drivers</option>
          <option value="ADMINISTRATIVE">Administrative</option>
          <option value="TECHNICAL">Technical</option>
          <option value="MANAGEMENT">Management</option>
          <option value="SAUDIZATION_COMPLIANCE">Saudization Compliance</option>
          <option value="TRAINING">Training</option>
        </select>
      </div>

      {/* Staff Requirements */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Staff Requirements
        </h4>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Number of Staff <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={manpowerReq.staff?.quantity || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    staff: {
                      ...manpowerReq.staff,
                      quantity: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="e.g., 10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Minimum Years of Experience
              </label>
              <input
                type="number"
                min="0"
                value={manpowerReq.staff?.experience?.minimumYears || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    staff: {
                      ...manpowerReq.staff,
                      experience: {
                        ...manpowerReq.staff?.experience,
                        minimumYears: parseInt(e.target.value) || undefined,
                      },
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="e.g., 2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Required Roles
            </label>
            <div className="space-y-2">
              {(manpowerReq.staff?.roles || [""]).map(
                (role: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => {
                        const newRoles = [...(manpowerReq.staff?.roles || [])];
                        newRoles[idx] = e.target.value;
                        setRequirement({
                          ...requirement,
                          staff: { ...manpowerReq.staff, roles: newRoles },
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                      placeholder={`Role ${idx + 1}...`}
                    />
                    {(manpowerReq.staff?.roles || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newRoles = (
                            manpowerReq.staff?.roles || []
                          ).filter((_: any, i: number) => i !== idx);
                          setRequirement({
                            ...requirement,
                            staff: { ...manpowerReq.staff, roles: newRoles },
                          });
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ),
              )}
              <button
                type="button"
                onClick={() => {
                  setRequirement({
                    ...requirement,
                    staff: {
                      ...manpowerReq.staff,
                      roles: [...(manpowerReq.staff?.roles || []), ""],
                    },
                  });
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Role
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Required Qualifications
            </label>
            <div className="space-y-2">
              {(manpowerReq.staff?.qualifications || [""]).map(
                (qual: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={qual}
                      onChange={(e) => {
                        const newQuals = [
                          ...(manpowerReq.staff?.qualifications || []),
                        ];
                        newQuals[idx] = e.target.value;
                        setRequirement({
                          ...requirement,
                          staff: {
                            ...manpowerReq.staff,
                            qualifications: newQuals,
                          },
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                      placeholder={`Qualification ${idx + 1}...`}
                    />
                    {(manpowerReq.staff?.qualifications || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newQuals = (
                            manpowerReq.staff?.qualifications || []
                          ).filter((_: any, i: number) => i !== idx);
                          setRequirement({
                            ...requirement,
                            staff: {
                              ...manpowerReq.staff,
                              qualifications: newQuals,
                            },
                          });
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ),
              )}
              <button
                type="button"
                onClick={() => {
                  setRequirement({
                    ...requirement,
                    staff: {
                      ...manpowerReq.staff,
                      qualifications: [
                        ...(manpowerReq.staff?.qualifications || []),
                        "",
                      ],
                    },
                  });
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Qualification
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Specific Skills Required
            </label>
            <div className="space-y-2">
              {(manpowerReq.staff?.experience?.specificSkills || [""]).map(
                (skill: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => {
                        const newSkills = [
                          ...(manpowerReq.staff?.experience?.specificSkills ||
                            []),
                        ];
                        newSkills[idx] = e.target.value;
                        setRequirement({
                          ...requirement,
                          staff: {
                            ...manpowerReq.staff,
                            experience: {
                              ...manpowerReq.staff?.experience,
                              specificSkills: newSkills,
                            },
                          },
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                      placeholder={`Skill ${idx + 1}...`}
                    />
                    {(manpowerReq.staff?.experience?.specificSkills || [])
                      .length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newSkills = (
                            manpowerReq.staff?.experience?.specificSkills || []
                          ).filter((_: any, i: number) => i !== idx);
                          setRequirement({
                            ...requirement,
                            staff: {
                              ...manpowerReq.staff,
                              experience: {
                                ...manpowerReq.staff?.experience,
                                specificSkills: newSkills,
                              },
                            },
                          });
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ),
              )}
              <button
                type="button"
                onClick={() => {
                  setRequirement({
                    ...requirement,
                    staff: {
                      ...manpowerReq.staff,
                      experience: {
                        ...manpowerReq.staff?.experience,
                        specificSkills: [
                          ...(manpowerReq.staff?.experience?.specificSkills ||
                            []),
                          "",
                        ],
                      },
                    },
                  });
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Skill
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Required Languages
            </label>
            <div className="flex flex-wrap gap-2">
              {["Arabic", "English", "French", "Spanish", "Urdu", "Hindi"].map(
                (lang) => (
                  <label
                    key={lang}
                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-600"
                  >
                    <input
                      type="checkbox"
                      checked={(manpowerReq.staff?.languages || []).includes(
                        lang,
                      )}
                      onChange={(e) => {
                        const current = manpowerReq.staff?.languages || [];
                        const updated = e.target.checked
                          ? [...current, lang]
                          : current.filter((l: string) => l !== lang);
                        setRequirement({
                          ...requirement,
                          staff: { ...manpowerReq.staff, languages: updated },
                        });
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm">{lang}</span>
                  </label>
                ),
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Required Certifications
            </label>
            <div className="space-y-2">
              {(manpowerReq.staff?.certifications || [""]).map(
                (cert: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={cert}
                      onChange={(e) => {
                        const newCerts = [
                          ...(manpowerReq.staff?.certifications || []),
                        ];
                        newCerts[idx] = e.target.value;
                        setRequirement({
                          ...requirement,
                          staff: {
                            ...manpowerReq.staff,
                            certifications: newCerts,
                          },
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                      placeholder={`Certification ${idx + 1}...`}
                    />
                    {(manpowerReq.staff?.certifications || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newCerts = (
                            manpowerReq.staff?.certifications || []
                          ).filter((_: any, i: number) => i !== idx);
                          setRequirement({
                            ...requirement,
                            staff: {
                              ...manpowerReq.staff,
                              certifications: newCerts,
                            },
                          });
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ),
              )}
              <button
                type="button"
                onClick={() => {
                  setRequirement({
                    ...requirement,
                    staff: {
                      ...manpowerReq.staff,
                      certifications: [
                        ...(manpowerReq.staff?.certifications || []),
                        "",
                      ],
                    },
                  });
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Certification
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={manpowerReq.staff?.backgroundChecks || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    staff: {
                      ...manpowerReq.staff,
                      backgroundChecks: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">
                Background Checks Required
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={manpowerReq.staff?.training || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    staff: { ...manpowerReq.staff, training: e.target.checked },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Training Required</span>
            </label>
          </div>
        </div>
      </div>

      {/* Employment Details */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          Employment Details
        </h4>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Employment Type
              </label>
              <select
                value={manpowerReq.employment?.type || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    employment: {
                      ...manpowerReq.employment,
                      type: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              >
                <option value="">Select type...</option>
                <option value="TEMPORARY">Temporary</option>
                <option value="CONTRACT">Contract</option>
                <option value="PERMANENT">Permanent</option>
                <option value="PROJECT_BASED">Project-Based</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Shift Type
              </label>
              <select
                value={manpowerReq.employment?.shift || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    employment: {
                      ...manpowerReq.employment,
                      shift: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              >
                <option value="">Select shift...</option>
                <option value="DAY">Day</option>
                <option value="NIGHT">Night</option>
                <option value="ROTATING">Rotating</option>
                <option value="FLEXIBLE">Flexible</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Duration
              </label>
              <input
                type="number"
                min="1"
                value={manpowerReq.employment?.duration || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    employment: {
                      ...manpowerReq.employment,
                      duration: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="e.g., 6"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Duration Unit
              </label>
              <select
                value={manpowerReq.employment?.unit || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    employment: {
                      ...manpowerReq.employment,
                      unit: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              >
                <option value="">Select unit...</option>
                <option value="DAYS">Days</option>
                <option value="WEEKS">Weeks</option>
                <option value="MONTHS">Months</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Hours Per Week
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={manpowerReq.employment?.hoursPerWeek || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    employment: {
                      ...manpowerReq.employment,
                      hoursPerWeek: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="e.g., 40"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Work Location
            </label>
            <input
              type="text"
              value={manpowerReq.employment?.location || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  employment: {
                    ...manpowerReq.employment,
                    location: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              placeholder="e.g., Riyadh Warehouse"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={manpowerReq.employment?.remote || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  employment: {
                    ...manpowerReq.employment,
                    remote: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Remote Work Allowed</span>
          </label>
        </div>
      </div>

      {/* Service Level */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Service Level
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Start Date
            </label>
            <input
              type="date"
              value={manpowerReq.serviceLevel?.startDate || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...manpowerReq.serviceLevel,
                    startDate: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Onboarding Time (days)
            </label>
            <input
              type="number"
              min="1"
              value={manpowerReq.serviceLevel?.onboardingTime || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...manpowerReq.serviceLevel,
                    onboardingTime: parseInt(e.target.value) || undefined,
                  },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              placeholder="e.g., 7"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Replacement Policy
            </label>
            <textarea
              value={manpowerReq.serviceLevel?.replacementPolicy || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...manpowerReq.serviceLevel,
                    replacementPolicy: e.target.value,
                  },
                })
              }
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              placeholder="Describe replacement policy and terms..."
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={manpowerReq.serviceLevel?.supervision || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    serviceLevel: {
                      ...manpowerReq.serviceLevel,
                      supervision: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Supervision Required</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={manpowerReq.serviceLevel?.reporting || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    serviceLevel: {
                      ...manpowerReq.serviceLevel,
                      reporting: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">
                Regular Reporting Required
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TRANSLATION FIELDS - COMPLETE IMPLEMENTATION
// ============================================================================

export function TranslationFields({ requirement, setRequirement }: any) {
  const req = requirement as any;
  const translationReq = req as any;

  return (
    <div className="space-y-6">
      {/* Translation Details */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Languages className="w-4 h-4" />
          Translation Details
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Source Languages <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                "Arabic",
                "English",
                "French",
                "Spanish",
                "German",
                "Chinese",
                "Urdu",
                "Hindi",
                "Turkish",
                "Russian",
              ].map((lang) => (
                <label
                  key={lang}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-600"
                >
                  <input
                    type="checkbox"
                    checked={(
                      translationReq.translation?.languages?.from || []
                    ).includes(lang)}
                    onChange={(e) => {
                      const current =
                        translationReq.translation?.languages?.from || [];
                      const updated = e.target.checked
                        ? [...current, lang]
                        : current.filter((l: string) => l !== lang);
                      setRequirement({
                        ...requirement,
                        translation: {
                          ...translationReq.translation,
                          languages: {
                            ...translationReq.translation?.languages,
                            from: updated,
                          },
                        },
                      });
                    }}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">{lang}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Target Languages <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                "Arabic",
                "English",
                "French",
                "Spanish",
                "German",
                "Chinese",
                "Urdu",
                "Hindi",
                "Turkish",
                "Russian",
              ].map((lang) => (
                <label
                  key={lang}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-600"
                >
                  <input
                    type="checkbox"
                    checked={(
                      translationReq.translation?.languages?.to || []
                    ).includes(lang)}
                    onChange={(e) => {
                      const current =
                        translationReq.translation?.languages?.to || [];
                      const updated = e.target.checked
                        ? [...current, lang]
                        : current.filter((l: string) => l !== lang);
                      setRequirement({
                        ...requirement,
                        translation: {
                          ...translationReq.translation,
                          languages: {
                            ...translationReq.translation?.languages,
                            to: updated,
                          },
                        },
                      });
                    }}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">{lang}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Word Count
              </label>
              <input
                type="number"
                min="0"
                value={translationReq.translation?.wordCount || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    translation: {
                      ...translationReq.translation,
                      wordCount: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="e.g., 5000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Page Count
              </label>
              <input
                type="number"
                min="0"
                value={translationReq.translation?.pageCount || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    translation: {
                      ...translationReq.translation,
                      pageCount: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="e.g., 20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                File Count
              </label>
              <input
                type="number"
                min="0"
                value={translationReq.translation?.fileCount || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    translation: {
                      ...translationReq.translation,
                      fileCount: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="e.g., 5"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Document Types
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                "Legal",
                "Technical",
                "Medical",
                "General",
                "Financial",
                "Marketing",
                "Academic",
                "Certified",
              ].map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-600"
                >
                  <input
                    type="checkbox"
                    checked={(
                      translationReq.translation?.documentType || []
                    ).includes(type)}
                    onChange={(e) => {
                      const current =
                        translationReq.translation?.documentType || [];
                      const updated = e.target.checked
                        ? [...current, type]
                        : current.filter((t: string) => t !== type);
                      setRequirement({
                        ...requirement,
                        translation: {
                          ...translationReq.translation,
                          documentType: updated,
                        },
                      });
                    }}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              File Formats
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                "PDF",
                "Word",
                "Excel",
                "PowerPoint",
                "HTML",
                "XML",
                "JSON",
                "TXT",
              ].map((format) => (
                <label
                  key={format}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-600"
                >
                  <input
                    type="checkbox"
                    checked={(
                      translationReq.translation?.format || []
                    ).includes(format)}
                    onChange={(e) => {
                      const current = translationReq.translation?.format || [];
                      const updated = e.target.checked
                        ? [...current, format]
                        : current.filter((f: string) => f !== format);
                      setRequirement({
                        ...requirement,
                        translation: {
                          ...translationReq.translation,
                          format: updated,
                        },
                      });
                    }}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">{format}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Specialty Areas
            </label>
            <div className="space-y-2">
              {(translationReq.translation?.specialty || [""]).map(
                (spec: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={spec}
                      onChange={(e) => {
                        const newSpecs = [
                          ...(translationReq.translation?.specialty || []),
                        ];
                        newSpecs[idx] = e.target.value;
                        setRequirement({
                          ...requirement,
                          translation: {
                            ...translationReq.translation,
                            specialty: newSpecs,
                          },
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                      placeholder={`Specialty ${idx + 1}...`}
                    />
                    {(translationReq.translation?.specialty || []).length >
                      1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newSpecs = (
                            translationReq.translation?.specialty || []
                          ).filter((_: any, i: number) => i !== idx);
                          setRequirement({
                            ...requirement,
                            translation: {
                              ...translationReq.translation,
                              specialty: newSpecs,
                            },
                          });
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ),
              )}
              <button
                type="button"
                onClick={() => {
                  setRequirement({
                    ...requirement,
                    translation: {
                      ...translationReq.translation,
                      specialty: [
                        ...(translationReq.translation?.specialty || []),
                        "",
                      ],
                    },
                  });
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Specialty
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Service Requirements */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Service Requirements
        </h4>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={translationReq.service?.certified || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    service: {
                      ...translationReq.service,
                      certified: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Certified Translation</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={translationReq.service?.notarized || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    service: {
                      ...translationReq.service,
                      notarized: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Notarized</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={translationReq.service?.rushService || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    service: {
                      ...translationReq.service,
                      rushService: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Rush Service</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={translationReq.service?.review || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    service: {
                      ...translationReq.service,
                      review: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Review Required</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={translationReq.service?.proofreading || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    service: {
                      ...translationReq.service,
                      proofreading: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Proofreading</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={translationReq.service?.desktopPublishing || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    service: {
                      ...translationReq.service,
                      desktopPublishing: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Desktop Publishing</span>
            </label>
          </div>

          {translationReq.service?.rushService && (
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Rush Deadline
              </label>
              <input
                type="datetime-local"
                value={translationReq.service?.rushDeadline || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    service: {
                      ...translationReq.service,
                      rushDeadline: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              />
            </div>
          )}
        </div>
      </div>

      {/* Service Level */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Service Level
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Deadline
            </label>
            <input
              type="datetime-local"
              value={translationReq.serviceLevel?.deadline || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...translationReq.serviceLevel,
                    deadline: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Quality Level
              </label>
              <select
                value={translationReq.serviceLevel?.qualityLevel || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    serviceLevel: {
                      ...translationReq.serviceLevel,
                      qualityLevel: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              >
                <option value="">Select level...</option>
                <option value="STANDARD">Standard</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Revision Rounds
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={translationReq.serviceLevel?.revisionRounds || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    serviceLevel: {
                      ...translationReq.serviceLevel,
                      revisionRounds: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="e.g., 2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Confidentiality Level
            </label>
            <select
              value={translationReq.serviceLevel?.confidentiality || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...translationReq.serviceLevel,
                    confidentiality: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              <option value="">Select level...</option>
              <option value="STANDARD">Standard</option>
              <option value="HIGH">High</option>
              <option value="MAXIMUM">Maximum</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CROSS-DOCKING FIELDS - COMPLETE IMPLEMENTATION
// ============================================================================

export function CrossDockingFields({ requirement, setRequirement }: any) {
  const req = requirement as any;
  const crossDockReq = req as any;

  return (
    <div className="space-y-6">
      {/* Facility Requirements */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Facility Requirements
        </h4>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Dock Doors
              </label>
              <input
                type="number"
                min="1"
                value={crossDockReq.facility?.dockDoors || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    facility: {
                      ...crossDockReq.facility,
                      dockDoors: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="e.g., 10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Minimum Dock Doors
              </label>
              <input
                type="number"
                min="1"
                value={crossDockReq.facility?.minimumDoors || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    facility: {
                      ...crossDockReq.facility,
                      minimumDoors: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="e.g., 5"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Yard Space (m²)
            </label>
            <input
              type="number"
              min="0"
              value={crossDockReq.facility?.yardSpace || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  facility: {
                    ...crossDockReq.facility,
                    yardSpace: parseInt(e.target.value) || undefined,
                  },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              placeholder="e.g., 5000"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={crossDockReq.facility?.stagingArea || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    facility: {
                      ...crossDockReq.facility,
                      stagingArea: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Staging Area Required</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={crossDockReq.facility?.sortingArea || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    facility: {
                      ...crossDockReq.facility,
                      sortingArea: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Sorting Area Required</span>
            </label>
          </div>
        </div>
      </div>

      {/* Volume Requirements */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Volume Requirements
        </h4>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Daily Shipments
              </label>
              <input
                type="number"
                min="0"
                value={crossDockReq.volume?.dailyShipments || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    volume: {
                      ...crossDockReq.volume,
                      dailyShipments: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="e.g., 100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Peak Shipments
              </label>
              <input
                type="number"
                min="0"
                value={crossDockReq.volume?.peakShipments || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    volume: {
                      ...crossDockReq.volume,
                      peakShipments: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="e.g., 200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Average Shipment Size
              </label>
              <input
                type="number"
                min="0"
                value={crossDockReq.volume?.averageShipmentSize || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    volume: {
                      ...crossDockReq.volume,
                      averageShipmentSize:
                        parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="e.g., 500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Unit
              </label>
              <select
                value={crossDockReq.volume?.unit || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    volume: { ...crossDockReq.volume, unit: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              >
                <option value="">Select unit...</option>
                <option value="KG">Kilograms (KG)</option>
                <option value="CUBIC_METERS">Cubic Meters</option>
                <option value="PALLETS">Pallets</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Requirements */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Truck className="w-4 h-4" />
          Operational Requirements
        </h4>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Inbound Carriers
              </label>
              <input
                type="number"
                min="0"
                value={crossDockReq.operations?.inboundCarriers || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    operations: {
                      ...crossDockReq.operations,
                      inboundCarriers: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="e.g., 5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Outbound Carriers
              </label>
              <input
                type="number"
                min="0"
                value={crossDockReq.operations?.outboundCarriers || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    operations: {
                      ...crossDockReq.operations,
                      outboundCarriers: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="e.g., 8"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Operating Hours
            </label>
            <input
              type="text"
              value={crossDockReq.operations?.operatingHours || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  operations: {
                    ...crossDockReq.operations,
                    operatingHours: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              placeholder="e.g., 24/7 or 08:00-20:00"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={crossDockReq.operations?.consolidation || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    operations: {
                      ...crossDockReq.operations,
                      consolidation: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Consolidation</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={crossDockReq.operations?.deconsolidation || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    operations: {
                      ...crossDockReq.operations,
                      deconsolidation: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Deconsolidation</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={crossDockReq.operations?.sorting || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    operations: {
                      ...crossDockReq.operations,
                      sorting: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Sorting</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={crossDockReq.operations?.labeling || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    operations: {
                      ...crossDockReq.operations,
                      labeling: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Labeling</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={crossDockReq.operations?.qualityCheck || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    operations: {
                      ...crossDockReq.operations,
                      qualityCheck: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Quality Check</span>
            </label>
          </div>
        </div>
      </div>

      {/* Service Level */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Service Level
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Turnaround Time (hours)
            </label>
            <input
              type="number"
              min="1"
              value={crossDockReq.serviceLevel?.turnaroundTime || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...crossDockReq.serviceLevel,
                    turnaroundTime: parseInt(e.target.value) || undefined,
                  },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              placeholder="e.g., 4"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={crossDockReq.serviceLevel?.sameDayService || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    serviceLevel: {
                      ...crossDockReq.serviceLevel,
                      sameDayService: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Same Day Service</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={crossDockReq.serviceLevel?.weekendService || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    serviceLevel: {
                      ...crossDockReq.serviceLevel,
                      weekendService: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Weekend Service</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={crossDockReq.serviceLevel?.peakHandling || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    serviceLevel: {
                      ...crossDockReq.serviceLevel,
                      peakHandling: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">
                Peak Handling Capability
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// WAREHOUSE NETWORK FIELDS - COMPLETE IMPLEMENTATION
// ============================================================================

export function WarehouseNetworkFields({ requirement, setRequirement }: any) {
  const req = requirement as any;
  const networkReq = req as any;

  return (
    <div className="space-y-6">
      {/* Network Requirements */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Network className="w-4 h-4" />
          Network Requirements
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Coverage Regions
            </label>
            <div className="space-y-2">
              {(networkReq.network?.coverage?.regions || [""]).map(
                (region: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => {
                        const newRegions = [
                          ...(networkReq.network?.coverage?.regions || []),
                        ];
                        newRegions[idx] = e.target.value;
                        setRequirement({
                          ...requirement,
                          network: {
                            ...networkReq.network,
                            coverage: {
                              ...networkReq.network?.coverage,
                              regions: newRegions,
                            },
                          },
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                      placeholder={`Region ${idx + 1}...`}
                    />
                    {(networkReq.network?.coverage?.regions || []).length >
                      1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newRegions = (
                            networkReq.network?.coverage?.regions || []
                          ).filter((_: any, i: number) => i !== idx);
                          setRequirement({
                            ...requirement,
                            network: {
                              ...networkReq.network,
                              coverage: {
                                ...networkReq.network?.coverage,
                                regions: newRegions,
                              },
                            },
                          });
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ),
              )}
              <button
                type="button"
                onClick={() => {
                  setRequirement({
                    ...requirement,
                    network: {
                      ...networkReq.network,
                      coverage: {
                        ...networkReq.network?.coverage,
                        regions: [
                          ...(networkReq.network?.coverage?.regions || []),
                          "",
                        ],
                      },
                    },
                  });
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Region
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Coverage Countries
            </label>
            <div className="space-y-2">
              {(networkReq.network?.coverage?.countries || [""]).map(
                (country: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => {
                        const newCountries = [
                          ...(networkReq.network?.coverage?.countries || []),
                        ];
                        newCountries[idx] = e.target.value;
                        setRequirement({
                          ...requirement,
                          network: {
                            ...networkReq.network,
                            coverage: {
                              ...networkReq.network?.coverage,
                              countries: newCountries,
                            },
                          },
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                      placeholder={`Country ${idx + 1}...`}
                    />
                    {(networkReq.network?.coverage?.countries || []).length >
                      1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newCountries = (
                            networkReq.network?.coverage?.countries || []
                          ).filter((_: any, i: number) => i !== idx);
                          setRequirement({
                            ...requirement,
                            network: {
                              ...networkReq.network,
                              coverage: {
                                ...networkReq.network?.coverage,
                                countries: newCountries,
                              },
                            },
                          });
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ),
              )}
              <button
                type="button"
                onClick={() => {
                  setRequirement({
                    ...requirement,
                    network: {
                      ...networkReq.network,
                      coverage: {
                        ...networkReq.network?.coverage,
                        countries: [
                          ...(networkReq.network?.coverage?.countries || []),
                          "",
                        ],
                      },
                    },
                  });
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Country
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Coverage Cities
            </label>
            <div className="space-y-2">
              {(networkReq.network?.coverage?.cities || [""]).map(
                (city: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => {
                        const newCities = [
                          ...(networkReq.network?.coverage?.cities || []),
                        ];
                        newCities[idx] = e.target.value;
                        setRequirement({
                          ...requirement,
                          network: {
                            ...networkReq.network,
                            coverage: {
                              ...networkReq.network?.coverage,
                              cities: newCities,
                            },
                          },
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                      placeholder={`City ${idx + 1}...`}
                    />
                    {(networkReq.network?.coverage?.cities || []).length >
                      1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newCities = (
                            networkReq.network?.coverage?.cities || []
                          ).filter((_: any, i: number) => i !== idx);
                          setRequirement({
                            ...requirement,
                            network: {
                              ...networkReq.network,
                              coverage: {
                                ...networkReq.network?.coverage,
                                cities: newCities,
                              },
                            },
                          });
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ),
              )}
              <button
                type="button"
                onClick={() => {
                  setRequirement({
                    ...requirement,
                    network: {
                      ...networkReq.network,
                      coverage: {
                        ...networkReq.network?.coverage,
                        cities: [
                          ...(networkReq.network?.coverage?.cities || []),
                          "",
                        ],
                      },
                    },
                  });
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add City
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Warehouse Count
              </label>
              <input
                type="number"
                min="1"
                value={networkReq.network?.warehouseCount || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    network: {
                      ...networkReq.network,
                      warehouseCount: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="e.g., 5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Minimum Warehouses
              </label>
              <input
                type="number"
                min="1"
                value={networkReq.network?.minimumWarehouses || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    network: {
                      ...networkReq.network,
                      minimumWarehouses: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="e.g., 3"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={networkReq.network?.hubAndSpoke || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    network: {
                      ...networkReq.network,
                      hubAndSpoke: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Hub and Spoke Model</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={networkReq.network?.distributionCenters || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    network: {
                      ...networkReq.network,
                      distributionCenters: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Distribution Centers</span>
            </label>
          </div>
        </div>
      </div>

      {/* Operational Requirements */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Truck className="w-4 h-4" />
          Operational Requirements
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={networkReq.operations?.multiLocationInventory || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  operations: {
                    ...networkReq.operations,
                    multiLocationInventory: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">
              Multi-Location Inventory
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={networkReq.operations?.inventoryTransfer || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  operations: {
                    ...networkReq.operations,
                    inventoryTransfer: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Inventory Transfer</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={networkReq.operations?.centralizedManagement || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  operations: {
                    ...networkReq.operations,
                    centralizedManagement: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Centralized Management</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={networkReq.operations?.realTimeVisibility || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  operations: {
                    ...networkReq.operations,
                    realTimeVisibility: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Real-Time Visibility</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={networkReq.operations?.crossDocking || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  operations: {
                    ...networkReq.operations,
                    crossDocking: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Cross-Docking</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={networkReq.operations?.consolidation || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  operations: {
                    ...networkReq.operations,
                    consolidation: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Consolidation</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={networkReq.operations?.deconsolidation || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  operations: {
                    ...networkReq.operations,
                    deconsolidation: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Deconsolidation</span>
          </label>
        </div>
      </div>

      {/* Capacity Requirements */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Capacity Requirements
        </h4>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Total Capacity
              </label>
              <input
                type="number"
                min="0"
                value={networkReq.capacity?.totalCapacity || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    capacity: {
                      ...networkReq.capacity,
                      totalCapacity: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="e.g., 10000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Unit
              </label>
              <select
                value={networkReq.capacity?.unit || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    capacity: { ...networkReq.capacity, unit: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              >
                <option value="">Select unit...</option>
                <option value="CUBIC_METERS">Cubic Meters</option>
                <option value="SQUARE_METERS">Square Meters</option>
                <option value="PALLETS">Pallets</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Utilization Target (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={networkReq.capacity?.utilization || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  capacity: {
                    ...networkReq.capacity,
                    utilization: parseInt(e.target.value) || undefined,
                  },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              placeholder="e.g., 80"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={networkReq.capacity?.growthExpected || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  capacity: {
                    ...networkReq.capacity,
                    growthExpected: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium">Growth Expected</span>
          </label>
        </div>
      </div>

      {/* Service Level */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Service Level
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Support Level
            </label>
            <select
              value={networkReq.serviceLevel?.supportLevel || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...networkReq.serviceLevel,
                    supportLevel: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              <option value="">Select level...</option>
              <option value="STANDARD">Standard</option>
              <option value="PREMIUM">Premium</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={networkReq.serviceLevel?.networkMetrics || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    serviceLevel: {
                      ...networkReq.serviceLevel,
                      networkMetrics: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Network Metrics</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={networkReq.serviceLevel?.performanceReporting || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    serviceLevel: {
                      ...networkReq.serviceLevel,
                      performanceReporting: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Performance Reporting</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={networkReq.serviceLevel?.optimization || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    serviceLevel: {
                      ...networkReq.serviceLevel,
                      optimization: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Optimization Services</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SHARED FIELD COMPONENTS - LOCATION, TIMELINE, BUDGET, REQUIREMENTS
// ============================================================================

export function LocationFields({ requirement, setRequirement }: any) {
  const req = requirement as any;

  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
      <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        Location Details
      </h4>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Address
          </label>
          <input
            type="text"
            value={req.location?.address || ""}
            onChange={(e) =>
              setRequirement({
                ...requirement,
                location: { ...req.location, address: e.target.value },
              })
            }
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            placeholder="Street address..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              City
            </label>
            <input
              type="text"
              value={req.location?.city || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  location: { ...req.location, city: e.target.value },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              placeholder="City name..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Country
            </label>
            <input
              type="text"
              value={req.location?.country || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  location: { ...req.location, country: e.target.value },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              placeholder="Country name..."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={req.location?.coordinates?.lat || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  location: {
                    ...req.location,
                    coordinates: {
                      ...req.location?.coordinates,
                      lat: parseFloat(e.target.value) || undefined,
                    },
                  },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              placeholder="e.g., 24.7136"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={req.location?.coordinates?.lng || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  location: {
                    ...req.location,
                    coordinates: {
                      ...req.location?.coordinates,
                      lng: parseFloat(e.target.value) || undefined,
                    },
                  },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              placeholder="e.g., 46.6753"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Postal Code
          </label>
          <input
            type="text"
            value={req.location?.postalCode || ""}
            onChange={(e) =>
              setRequirement({
                ...requirement,
                location: { ...req.location, postalCode: e.target.value },
              })
            }
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            placeholder="e.g., 11564"
          />
        </div>
      </div>
    </div>
  );
}

export function TimelineFields({ requirement, setRequirement }: any) {
  const req = requirement as any;

  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
      <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        Timeline
      </h4>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Start Date
          </label>
          <input
            type="date"
            value={req.timeline?.startDate || ""}
            onChange={(e) =>
              setRequirement({
                ...requirement,
                timeline: { ...req.timeline, startDate: e.target.value },
              })
            }
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            End Date
          </label>
          <input
            type="date"
            value={req.timeline?.endDate || ""}
            onChange={(e) =>
              setRequirement({
                ...requirement,
                timeline: { ...req.timeline, endDate: e.target.value },
              })
            }
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Duration (days)
          </label>
          <input
            type="number"
            min="1"
            value={req.timeline?.duration || ""}
            onChange={(e) =>
              setRequirement({
                ...requirement,
                timeline: {
                  ...req.timeline,
                  duration: parseInt(e.target.value) || undefined,
                },
              })
            }
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            placeholder="e.g., 30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Urgency
          </label>
          <select
            value={req.timeline?.urgency || ""}
            onChange={(e) =>
              setRequirement({
                ...requirement,
                timeline: { ...req.timeline, urgency: e.target.value },
              })
            }
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
          >
            <option value="">Select urgency...</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Notes
          </label>
          <textarea
            value={req.timeline?.notes || ""}
            onChange={(e) =>
              setRequirement({
                ...requirement,
                timeline: { ...req.timeline, notes: e.target.value },
              })
            }
            rows={3}
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            placeholder="Additional timeline notes..."
          />
        </div>
      </div>
    </div>
  );
}

export function BudgetFields({ requirement, setRequirement }: any) {
  const req = requirement as any;

  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
      <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <DollarSign className="w-4 h-4" />
        Budget Information
      </h4>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Budget Range (Min)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={req.budget?.min || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  budget: {
                    ...req.budget,
                    min: parseFloat(e.target.value) || undefined,
                  },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              placeholder="e.g., 1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Budget Range (Max)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={req.budget?.max || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  budget: {
                    ...req.budget,
                    max: parseFloat(e.target.value) || undefined,
                  },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              placeholder="e.g., 5000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Currency
          </label>
          <select
            value={req.budget?.currency || "SAR"}
            onChange={(e) =>
              setRequirement({
                ...requirement,
                budget: { ...req.budget, currency: e.target.value },
              })
            }
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
          >
            <option value="SAR">SAR (Saudi Riyal)</option>
            <option value="USD">USD (US Dollar)</option>
            <option value="EUR">EUR (Euro)</option>
            <option value="GBP">GBP (British Pound)</option>
            <option value="AED">AED (UAE Dirham)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Payment Terms
          </label>
          <select
            value={req.budget?.paymentTerms || ""}
            onChange={(e) =>
              setRequirement({
                ...requirement,
                budget: { ...req.budget, paymentTerms: e.target.value },
              })
            }
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
          >
            <option value="">Select payment terms...</option>
            <option value="NET_15">Net 15</option>
            <option value="NET_30">Net 30</option>
            <option value="NET_45">Net 45</option>
            <option value="NET_60">Net 60</option>
            <option value="IMMEDIATE">Immediate</option>
            <option value="ADVANCE">Advance Payment</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Budget Notes
          </label>
          <textarea
            value={req.budget?.notes || ""}
            onChange={(e) =>
              setRequirement({
                ...requirement,
                budget: { ...req.budget, notes: e.target.value },
              })
            }
            rows={3}
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            placeholder="Additional budget information..."
          />
        </div>
      </div>
    </div>
  );
}

export function RequirementsFields({ requirement, setRequirement }: any) {
  const req = requirement as any;

  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
      <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        General Requirements
      </h4>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Special Requirements
            </label>
            <Suspense fallback={null}>
              <VoiceInput
                onTranscript={(text) => {
                  setRequirement({
                    ...requirement,
                    requirements: {
                      ...req.requirements,
                      special: (req.requirements?.special || "") + " " + text,
                    },
                  });
                }}
              />
            </Suspense>
          </div>
          <Suspense
            fallback={
              <textarea
                value={req.requirements?.special || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    requirements: {
                      ...req.requirements,
                      special: e.target.value,
                    },
                  })
                }
                rows={4}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="Any special requirements or considerations..."
              />
            }
          >
            <RichTextEditor
              value={req.requirements?.special || ""}
              onChange={(value) =>
                setRequirement({
                  ...requirement,
                  requirements: { ...req.requirements, special: value },
                })
              }
              placeholder="Enter special requirements with formatting..."
              minHeight="150px"
            />
          </Suspense>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Compliance Requirements
          </label>
          <div className="space-y-2">
            {(req.requirements?.compliance || [""]).map(
              (comp: string, idx: number) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={comp}
                    onChange={(e) => {
                      const newCompliance = [
                        ...(req.requirements?.compliance || []),
                      ];
                      newCompliance[idx] = e.target.value;
                      setRequirement({
                        ...requirement,
                        requirements: {
                          ...req.requirements,
                          compliance: newCompliance,
                        },
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    placeholder={`Compliance requirement ${idx + 1}...`}
                  />
                  {(req.requirements?.compliance || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newCompliance = (
                          req.requirements?.compliance || []
                        ).filter((_: any, i: number) => i !== idx);
                        setRequirement({
                          ...requirement,
                          requirements: {
                            ...req.requirements,
                            compliance: newCompliance,
                          },
                        });
                      }}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ),
            )}
            <button
              type="button"
              onClick={() => {
                setRequirement({
                  ...requirement,
                  requirements: {
                    ...req.requirements,
                    compliance: [...(req.requirements?.compliance || []), ""],
                  },
                });
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add Compliance Requirement
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Additional Notes
            </label>
            <Suspense fallback={null}>
              <VoiceInput
                onTranscript={(text) => {
                  setRequirement({
                    ...requirement,
                    requirements: {
                      ...req.requirements,
                      notes: (req.requirements?.notes || "") + " " + text,
                    },
                  });
                }}
              />
            </Suspense>
          </div>
          <Suspense
            fallback={
              <textarea
                value={req.requirements?.notes || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    requirements: {
                      ...req.requirements,
                      notes: e.target.value,
                    },
                  })
                }
                rows={4}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="Any additional notes or requirements..."
              />
            }
          >
            <RichTextEditor
              value={req.requirements?.notes || ""}
              onChange={(value) =>
                setRequirement({
                  ...requirement,
                  requirements: { ...req.requirements, notes: value },
                })
              }
              placeholder="Enter additional notes with formatting..."
              minHeight="150px"
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
