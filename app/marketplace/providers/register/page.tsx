"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import { Building2, Mail, Phone, Globe, FileText } from "lucide-react";
import { marketplaceService } from "@/lib/services/marketplace";

export default function RegisterProviderPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    type: "COMPANY" as "COMPANY" | "INDIVIDUAL" | "NETWORK",
    description: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    services: [] as string[],
    certifications: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  const serviceCategories = [
    "STORAGE",
    "CROSSDOCKING",
    "TRANSPORTATION",
    "FREIGHT",
    "CONSULTING",
    "MANPOWER",
    "TRANSLATION",
    "WAREHOUSE_NETWORK",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const provider = await marketplaceService.registerProvider({
        name: formData.name,
        type: formData.type,
        description: formData.description,
        contact: {
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          address: formData.address,
        },
        services: formData.services as any,
        certifications: formData.certifications,
      });

      router.push(`/marketplace/providers/${provider.id}`);
    } catch (error) {
      console.error("Failed to register provider:", error);
      alert("Failed to register. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleService = (service: string) => {
    setFormData({
      ...formData,
      services: formData.services.includes(service)
        ? formData.services.filter((s) => s !== service)
        : [...formData.services, service],
    });
  };

  return (
    <PageTemplate
      title="Register as Provider"
      description="Join our marketplace and start offering your services"
      icon="ri-user-add-line"
    >
      <div className="max-w-3xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-6 space-y-6"
        >
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Company Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Provider Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Company or Individual Name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as any })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="COMPANY">Company</option>
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="NETWORK">Network</option>
                </select>
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
                  placeholder="Describe your services and expertise..."
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Services Offered
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {serviceCategories.map((service) => (
                <button
                  key={service}
                  type="button"
                  onClick={() => toggleService(service)}
                  className={`px-4 py-2 rounded-lg border-2 transition ${
                    formData.services.includes(service)
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                >
                  {service.replace(/_/g, " ")}
                </button>
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
              {submitting ? "Registering..." : "Register Provider"}
            </button>
          </div>
        </form>
      </div>
    </PageTemplate>
  );
}
