/**
 * ASN Main Page
 * Landing page for ASN module with dashboard overview
 * Optimized with dynamic import for faster loading
 */

import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamic import for faster initial page load
const ExecutiveDashboard = dynamic(
  () =>
    import("@/components/asn/ExecutiveDashboard").then((mod) => ({
      default: mod.ExecutiveDashboard,
    })),
  {
    loading: () => (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    ),
    ssr: false,
  },
);

export default function AsnPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">ASN Intelligence</h1>
        <p className="text-muted-foreground mt-2">
          Advanced Shipping Notice management with AI-powered insights
        </p>
      </div>

      <Suspense
        fallback={
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        }
      >
        <ExecutiveDashboard days={30} />
      </Suspense>
    </div>
  );
}
