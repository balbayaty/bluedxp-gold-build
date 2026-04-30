/**
 * Training
 *
 * Auto-generated page for /hr/training
 * Module: hr
 */

"use client";

import { useEffect, useState } from "react";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";

function HrTrainingPageContent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/hr/training");
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          setData({
            training: [],
            count: 0,
            error: "Failed to fetch training",
          });
        }
      } catch (error) {
        console.error("Error fetching training:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <PageTemplate
        title="Training"
        description="Training - hr module"
        icon="ri-graduation-cap-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Loading training programs..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Training"
      description="Training - hr module"
      icon="ri-graduation-cap-line"
    >
      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4">Training</h2>
          <p className="text-gray-400">
            This page is ready for implementation. Connect it to your services
            and components.
          </p>
        </div>
      </div>
    </PageTemplate>
  );
}

export default function HrTrainingPagePage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Training"
          description="Training - hr module"
          icon="ri-graduation-cap-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <HrTrainingPageContent />
    </ErrorBoundary>
  );
}
