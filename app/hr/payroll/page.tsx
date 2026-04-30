/**
 * Payroll
 *
 * Auto-generated page for /hr/payroll
 * Module: hr
 */

"use client";

import { useEffect, useState } from "react";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";

function HrPayrollPageContent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/hr/payroll");
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          setData({ payroll: [], count: 0, error: "Failed to fetch payroll" });
        }
      } catch (error) {
        console.error("Error fetching payroll:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <PageTemplate
        title="Payroll"
        description="Payroll - hr module"
        icon="ri-money-dollar-circle-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Loading payroll data..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Payroll"
      description="Payroll - hr module"
      icon="ri-money-dollar-circle-line"
    >
      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4">Payroll</h2>
          <p className="text-gray-400">
            This page is ready for implementation. Connect it to your services
            and components.
          </p>
        </div>
      </div>
    </PageTemplate>
  );
}

export default function HrPayrollPagePage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Payroll"
          description="Payroll - hr module"
          icon="ri-money-dollar-circle-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <HrPayrollPageContent />
    </ErrorBoundary>
  );
}
