"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import { apiFetch } from "@/utils/apiFetch";
import type { ETW } from "@/types/etw";

export default function EditETWPage() {
  const router = useRouter();
  const params = useParams();
  const etwId = params.id as string;

  const [etw, setEtw] = useState<ETW | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch(`/api/etw/${etwId}`);
        const data = await res.json();
        if (data.success) {
          setEtw(data.data);
        } else {
          setError(data.error || "Failed to load ETW");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsLoading(false);
      }
    }

    if (etwId) {
      load();
    }
  }, [etwId]);

  const handleSave = async () => {
    if (!etw) return;

    setIsSaving(true);
    setError(null);

    try {
      const res = await apiFetch(`/api/etw/${etwId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(etw),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/etw/${etwId}`);
      } else {
        setError(data.error || "Failed to update ETW");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update ETW");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageTemplate title="Loading..." description="Loading ETW for editing">
        <div className="text-center py-12 text-gray-400">Loading ETW...</div>
      </PageTemplate>
    );
  }

  if (error || !etw) {
    return (
      <PageTemplate title="Error" description="Failed to load ETW">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-red-400">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <i className="ri-error-warning-line text-2xl"></i>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-300 mb-2">
                {error?.includes("404") || error?.includes("not found")
                  ? "e-Waybill Not Found"
                  : "Unable to Load e-Waybill"}
              </h3>
              <p className="text-sm mb-4">
                {error ||
                  "The e-Waybill you are trying to edit does not exist or you do not have permission to edit it."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/etw/${etwId}`)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                >
                  <i className="ri-arrow-left-line mr-2"></i>
                  View Details
                </button>
                <button
                  onClick={() => router.push("/etw")}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                >
                  <i className="ri-list-line mr-2"></i>
                  Back to List
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title={`Edit ETW: ${etw.etwNumber}`}
      description="Edit e-Waybill Details"
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/etw/${etwId}`)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white rounded-lg"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      }
    >
      <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4 text-blue-300 mb-6">
        <p className="text-sm">
          <strong>Note:</strong> This is a simplified edit page. The full ETW
          edit form with all sections will be implemented in the ETWForm
          component.
        </p>
        <p className="text-sm mt-2">
          For now, ETW editing is available via the API. The detail page shows
          all ETW information and is fully functional.
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          ETW Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              ETW Number
            </label>
            <p className="text-white font-mono">{etw.etwNumber}</p>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">Status</label>
            <p className="text-white">{etw.status}</p>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">Scope</label>
            <p className="text-white">{etw.scope}</p>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">Mode</label>
            <p className="text-white">{etw.mode}</p>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
