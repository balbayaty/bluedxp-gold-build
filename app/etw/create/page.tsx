"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import { apiFetch } from "@/utils/apiFetch";
import ETWCreateForm from "@/components/etw/ETWCreateForm";
import { CreateETWSchema } from "@/types/etw";
import { z } from "zod";

export default function CreateETWPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: z.infer<typeof CreateETWSchema>) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch("/api/etw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${res.statusText} - ${errorText}`);
      }

      const data = await res.json().catch(() => {
        throw new Error("Invalid JSON response from server");
      });

      if (data.success && data.data?.id) {
        router.push(`/etw/${data.data.id}`);
      } else {
        setError(data.error || "Failed to create ETW");
        if (data.details) {
          console.error("Validation errors:", data.details);
        }
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error("[ETW Create Page] Submit error:", e);
      setError(errorMessage || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTemplate
      title="Create e-Waybill"
      description="Create a new Flex Smart e-Waybill with comprehensive details"
      actions={
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
        >
          Cancel
        </button>
      }
    >
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-red-400 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <i className="ri-error-warning-line text-2xl"></i>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-300 mb-2">
                Unable to Create e-Waybill
              </h3>
              <p className="text-sm mb-4">
                {error.includes("Validation error") ||
                error.includes("validation")
                  ? "Please check the form for errors and try again."
                  : error.includes("Permission") || error.includes("permission")
                    ? "You do not have permission to create e-Waybills. Please contact your administrator."
                    : error.includes("Network") || error.includes("network")
                      ? "Network error. Please check your connection and try again."
                      : error}
              </p>
              {error.includes("Validation error") && (
                <p className="text-xs text-red-500 mt-2">
                  Tip: Check all required fields are filled and data is in the
                  correct format.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <ETWCreateForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={isSubmitting}
      />
    </PageTemplate>
  );
}
