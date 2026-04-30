"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import { Network, MapPin, Package } from "lucide-react";
import { warehouseNetworkService } from "@/lib/services/warehouse-network";

export default function CreateNetworkPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    regions: [] as string[],
    countries: [] as string[],
    capabilities: {
      multiLocationInventory: false,
      inventoryTransfer: false,
      centralizedManagement: false,
      realTimeVisibility: false,
      crossDocking: false,
      consolidation: false,
      deconsolidation: false,
    },
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // In a real app, get provider ID from auth context
      const providerId = "provider-1";
      const providerName = "Provider Name"; // Mock

      const response = await fetch("/api/warehouse-network/networks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId,
          providerName,
          network: {
            name: formData.name,
            description: formData.description,
            warehouses: [],
            coverage: {
              regions: formData.regions,
              countries: formData.countries,
            },
            capabilities: formData.capabilities,
            networkMetrics: {
              totalCapacity: 0,
              totalUtilization: 0,
              averageThroughput: 0,
              onTimePerformance: 0,
            },
            pricing: {
              model: "NETWORK_FEE",
              currency: "SAR",
            },
            status: "PLANNING",
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        router.push(`/warehouse-network`);
      } else {
        alert(result.error || "Failed to create network. Please try again.");
      }
    } catch (error) {
      console.error("Failed to create network:", error);
      alert("Failed to create network. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRegion = (region: string) => {
    setFormData({
      ...formData,
      regions: formData.regions.includes(region)
        ? formData.regions.filter((r) => r !== region)
        : [...formData.regions, region],
    });
  };

  const toggleCountry = (country: string) => {
    setFormData({
      ...formData,
      countries: formData.countries.includes(country)
        ? formData.countries.filter((c) => c !== country)
        : [...formData.countries, country],
    });
  };

  const commonRegions = [
    "Riyadh",
    "Jeddah",
    "Dammam",
    "Khobar",
    "Mecca",
    "Medina",
  ];
  const commonCountries = [
    "Saudi Arabia",
    "UAE",
    "Kuwait",
    "Qatar",
    "Bahrain",
    "Oman",
  ];

  return (
    <PageTemplate
      title="Create Warehouse Network"
      description="Set up a new warehouse network"
      icon="ri-add-circle-line"
    >
      <div className="max-w-3xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-6 space-y-6"
        >
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Network Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Network Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Central Distribution Network"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your warehouse network..."
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Coverage
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Regions
                </label>
                <div className="flex flex-wrap gap-2">
                  {commonRegions.map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => toggleRegion(region)}
                      className={`px-4 py-2 rounded-lg border-2 transition ${
                        formData.regions.includes(region)
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Countries
                </label>
                <div className="flex flex-wrap gap-2">
                  {commonCountries.map((country) => (
                    <button
                      key={country}
                      type="button"
                      onClick={() => toggleCountry(country)}
                      className={`px-4 py-2 rounded-lg border-2 transition ${
                        formData.countries.includes(country)
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      {country}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

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

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Network"}
            </button>
          </div>
        </form>
      </div>
    </PageTemplate>
  );
}
