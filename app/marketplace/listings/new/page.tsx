"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import {
  Building2,
  MapPin,
  DollarSign,
  FileText,
  CheckCircle,
} from "lucide-react";
import { marketplaceService } from "@/lib/services/marketplace";
import type {
  MarketplaceServiceCategory,
  StorageServiceType,
} from "@/types/marketplace";

export default function NewListingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    category: "STORAGE" as MarketplaceServiceCategory,
    serviceType: "GENERAL_STORAGE" as StorageServiceType,
    providerName: "",
    warehouseName: "",
    location: {
      address: "",
      city: "",
      country: "Saudi Arabia",
      coordinates: undefined as { lat: number; lng: number } | undefined,
    },
    capacity: {
      total: 0,
      available: 0,
      unit: "CUBIC_METERS" as
        | "CUBIC_METERS"
        | "SQUARE_METERS"
        | "PALLETS"
        | "TONS",
    },
    features: [] as string[],
    pricing: {
      model: "PER_MONTH" as "PER_UNIT" | "PER_MONTH" | "PER_DAY" | "CUSTOM",
      basePrice: 0,
      currency: "SAR",
    },
    capabilities: {
      handling: false,
      inventoryManagement: false,
      realTimeTracking: false,
      reporting: false,
    },
    certifications: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  const availableFeatures = [
    "24/7 Access",
    "Security",
    "Climate Control",
    "Fire Suppression",
    "Insurance",
    "Real-time Tracking",
    "Inventory Management",
    "Reporting",
  ];

  const availableCertifications = [
    "ISO 9001",
    "ISO 14001",
    "SABER",
    "SFDA",
    "MODON",
    "Civil Defense",
    "ZATCA Bonded",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // In a real app, get provider ID from auth context
      const providerId = "provider-1"; // Mock

      const response = await fetch("/api/marketplace/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId,
          category: formData.category,
          listing: {
            providerName: formData.providerName || "My Company",
            serviceType: formData.serviceType,
            warehouseName: formData.warehouseName,
            location: formData.location,
            capacity: formData.capacity,
            features: formData.features,
            pricing: formData.pricing,
            capabilities: formData.capabilities,
            certifications: formData.certifications,
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        router.push(`/marketplace/listings/${result.data.id}`);
      } else {
        alert(result.error || "Failed to create listing. Please try again.");
      }
    } catch (error) {
      console.error("Failed to create listing:", error);
      alert("Failed to create listing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFeature = (feature: string) => {
    setFormData({
      ...formData,
      features: formData.features.includes(feature)
        ? formData.features.filter((f) => f !== feature)
        : [...formData.features, feature],
    });
  };

  const toggleCertification = (cert: string) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.includes(cert)
        ? formData.certifications.filter((c) => c !== cert)
        : [...formData.certifications, cert],
    });
  };

  return (
    <PageTemplate
      title="Create Service Listing"
      description="Add a new service to the marketplace"
      icon="ri-add-circle-line"
    >
      <div className="max-w-4xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-6 space-y-8"
        >
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Service Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as MarketplaceServiceCategory,
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="STORAGE">Storage</option>
                  <option value="CROSSDOCKING">Cross-Docking</option>
                  <option value="TRANSPORTATION">Transportation</option>
                  <option value="FREIGHT">Freight</option>
                  <option value="CONSULTING">Consulting</option>
                  <option value="MANPOWER">Manpower</option>
                  <option value="TRANSLATION">Translation</option>
                  <option value="WAREHOUSE_NETWORK">Warehouse Network</option>
                </select>
              </div>

              {formData.category === "STORAGE" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Service Type *
                  </label>
                  <select
                    required
                    value={formData.serviceType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        serviceType: e.target.value as StorageServiceType,
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="GENERAL_STORAGE">General Storage</option>
                    <option value="COLD_STORAGE">Cold Storage</option>
                    <option value="HAZMAT_STORAGE">Hazmat Storage</option>
                    <option value="BONDED_STORAGE">Bonded Storage</option>
                    <option value="BULK_STORAGE">Bulk Storage</option>
                    <option value="RACK_STORAGE">Rack Storage</option>
                    <option value="OPEN_YARD">Open Yard</option>
                    <option value="TEMPORARY_STORAGE">Temporary Storage</option>
                    <option value="LONG_TERM_STORAGE">Long-term Storage</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Provider Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.providerName}
                  onChange={(e) =>
                    setFormData({ ...formData, providerName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your company name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Warehouse Name
                </label>
                <input
                  type="text"
                  value={formData.warehouseName}
                  onChange={(e) =>
                    setFormData({ ...formData, warehouseName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Warehouse name (optional)"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: {
                        ...formData.location,
                        address: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: { ...formData.location, city: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location.country}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: {
                        ...formData.location,
                        country: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Capacity */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Capacity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Total Capacity *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.capacity.total}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: {
                        ...formData.capacity,
                        total: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Available Capacity *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.capacity.available}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: {
                        ...formData.capacity,
                        available: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Unit *
                </label>
                <select
                  required
                  value={formData.capacity.unit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: {
                        ...formData.capacity,
                        unit: e.target.value as any,
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CUBIC_METERS">Cubic Meters (m³)</option>
                  <option value="SQUARE_METERS">Square Meters (m²)</option>
                  <option value="PALLETS">Pallets</option>
                  <option value="TONS">Tons</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Pricing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Pricing Model *
                </label>
                <select
                  required
                  value={formData.pricing.model}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricing: {
                        ...formData.pricing,
                        model: e.target.value as any,
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PER_UNIT">Per Unit</option>
                  <option value="PER_MONTH">Per Month</option>
                  <option value="PER_DAY">Per Day</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Base Price *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.pricing.basePrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricing: {
                        ...formData.pricing,
                        basePrice: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Currency *
                </label>
                <select
                  required
                  value={formData.pricing.currency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricing: {
                        ...formData.pricing,
                        currency: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SAR">SAR</option>
                  <option value="AED">AED</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Features
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {availableFeatures.map((feature) => (
                <label
                  key={feature}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.features.includes(feature)}
                    onChange={() => toggleFeature(feature)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">{feature}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Capabilities */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Capabilities
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(formData.capabilities).map(([key, value]) => (
                <label
                  key={key}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capabilities: {
                          ...formData.capabilities,
                          [key]: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Certifications
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {availableCertifications.map((cert) => (
                <label
                  key={cert}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.certifications.includes(cert)}
                    onChange={() => toggleCertification(cert)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">{cert}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Create Listing</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </PageTemplate>
  );
}
