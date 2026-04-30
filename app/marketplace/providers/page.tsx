"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import { Star, Building2, TrendingUp, CheckCircle } from "lucide-react";
import { marketplaceService } from "@/lib/services/marketplace";
import type { ServiceProvider } from "@/types/marketplace";

export default function ProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, load providers from API
    // For now, we'll show a message
    setLoading(false);
  }, []);

  return (
    <PageTemplate
      title="Service Providers"
      description="Browse verified service providers"
      icon="ri-building-line"
    >
      <div className="space-y-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-lg p-6 animate-pulse"
              >
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Provider Directory
            </h3>
            <p className="text-slate-500 mb-6">
              Browse all verified service providers on the marketplace
            </p>
            <button
              onClick={() => router.push("/marketplace/providers/register")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Register as Provider
            </button>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}
