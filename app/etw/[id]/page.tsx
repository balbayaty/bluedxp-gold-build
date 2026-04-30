"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import { apiFetch } from "@/utils/apiFetch";
import type { ETW } from "@/types/etw";
import { format as formatDate } from "date-fns";

export default function ETWDetailPage() {
  const router = useRouter();
  const params = useParams();
  const etwId = params.id as string;

  const [etw, setEtw] = useState<ETW | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [customerView, setCustomerView] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const res = await apiFetch(`/api/etw/${etwId}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json().catch(() => {
          throw new Error("Invalid JSON response from server");
        });
        if (!mounted) return;
        if (data.success && data.data) {
          setEtw(data.data);
        } else {
          setLoadError(data.error || "Failed to load ETW");
        }
      } catch (e) {
        if (!mounted) return;
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error("[ETW Detail Page] Load error:", e);
        setLoadError(errorMessage || "An unexpected error occurred");
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    }

    if (etwId) {
      load();
    }
    return () => {
      mounted = false;
    };
  }, [etwId]);

  if (isLoading) {
    return (
      <PageTemplate title="Loading..." description="Loading ETW details">
        <div className="text-center py-12 text-gray-400">Loading ETW...</div>
      </PageTemplate>
    );
  }

  if (loadError || !etw) {
    return (
      <PageTemplate title="Error" description="Failed to load ETW">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-red-400">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <i className="ri-error-warning-line text-2xl"></i>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-300 mb-2">
                {loadError?.includes("404") || loadError?.includes("not found")
                  ? "e-Waybill Not Found"
                  : "Unable to Load e-Waybill"}
              </h3>
              <p className="text-sm mb-4">
                {loadError ||
                  "The e-Waybill you are looking for does not exist or you do not have permission to view it."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/etw")}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                >
                  <i className="ri-arrow-left-line mr-2"></i>
                  Back to List
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                >
                  <i className="ri-refresh-line mr-2"></i>
                  Retry
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
      title={`ETW: ${etw.etwNumber}`}
      description="e-Waybill Details"
      actions={
        <div className="flex gap-2">
          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={customerView}
              onChange={(e) => setCustomerView(e.target.checked)}
              className="rounded"
            />
            Customer View
          </label>
          <button
            onClick={() => router.push(`/etw/${etwId}/print`)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Print
          </button>
          <button
            onClick={() => router.push(`/etw/${etwId}/edit`)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg"
          >
            Edit
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Transport Reference Matrix */}
        <section className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Transport Reference Matrix
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm">ETW Number</label>
              <p className="text-white font-mono">{etw.etwNumber}</p>
            </div>
            {etw.references.shipmentNumber && (
              <div>
                <label className="text-gray-400 text-sm">Shipment Number</label>
                <p className="text-white">{etw.references.shipmentNumber}</p>
              </div>
            )}
            {etw.references.invoiceNumber && (
              <div>
                <label className="text-gray-400 text-sm">Invoice Number</label>
                <p className="text-white">{etw.references.invoiceNumber}</p>
              </div>
            )}
            {etw.references.customerReference && (
              <div>
                <label className="text-gray-400 text-sm">
                  Customer Reference
                </label>
                <p className="text-white">{etw.references.customerReference}</p>
              </div>
            )}
          </div>
        </section>

        {/* Transport Scope & Mode */}
        <section className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Transport Scope & Mode
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm">Scope</label>
              <p className="text-white">{etw.scope}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Mode</label>
              <p className="text-white">{etw.mode}</p>
            </div>
            {etw.isMultimodal && (
              <div className="col-span-2">
                <label className="text-gray-400 text-sm">Multimodal</label>
                <p className="text-white">Yes ({etw.legs?.length || 0} legs)</p>
              </div>
            )}
          </div>
        </section>

        {/* Parties & Legal Roles */}
        <section className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Parties & Legal Roles
          </h2>
          <div className="space-y-4">
            {etw.parties.map((party) => (
              <div
                key={party.id}
                className="border-b border-gray-700 pb-4 last:border-0"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium">{party.name}</p>
                    <p className="text-gray-400 text-sm">{party.type}</p>
                  </div>
                  {party.signature?.verified && (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                      Verified
                    </span>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  <p>{party.contact.name}</p>
                  <p>{party.contact.phone}</p>
                  <p>{party.contact.email}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cargo Declaration */}
        <section className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Cargo Declaration
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-gray-400 text-sm">Total Weight</label>
              <p className="text-white">{etw.cargo.totalWeight} kg</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Total Value</label>
              <p className="text-white">
                {etw.cargo.totalValue} {etw.cargo.currency}
              </p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Total Pieces</label>
              <p className="text-white">{etw.cargo.totalPieces}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Items</label>
              <p className="text-white">{etw.cargo.items.length} items</p>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-gray-300 font-medium mb-2">Items</h3>
            <div className="space-y-2">
              {etw.cargo.items.map((item) => (
                <div key={item.id} className="bg-gray-900 rounded p-3">
                  <p className="text-white">{item.description}</p>
                  <p className="text-gray-400 text-sm">
                    {item.packaging.quantity} {item.packaging.unit} •{" "}
                    {item.weight.gross} kg
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compliance Flags */}
        {etw.compliance.hazardous && (
          <section className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Compliance Flags
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">
                  Hazardous
                </span>
                {etw.compliance.msdsId && (
                  <span className="text-gray-300 text-sm">
                    MSDS: {etw.compliance.msdsId}
                  </span>
                )}
              </div>
              {etw.compliance.civilDefenseReference && (
                <p className="text-gray-300 text-sm">
                  Civil Defense: {etw.compliance.civilDefenseReference}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Route & Execution */}
        <section className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Route & Execution
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm">Origin</label>
              <p className="text-white">{etw.route.origin.name}</p>
              <p className="text-gray-400 text-sm">
                {etw.route.origin.address?.city},{" "}
                {etw.route.origin.address?.country}
              </p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Destination</label>
              <p className="text-white">{etw.route.destination.name}</p>
              <p className="text-gray-400 text-sm">
                {etw.route.destination.address?.city},{" "}
                {etw.route.destination.address?.country}
              </p>
            </div>
          </div>
        </section>

        {/* Event Timeline */}
        <section className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Event Timeline
          </h2>
          <div className="space-y-3">
            {etw.events.length === 0 ? (
              <p className="text-gray-400">No events yet</p>
            ) : (
              etw.events.map((event) => (
                <div
                  key={event.id}
                  className="flex gap-4 border-l-2 border-gray-700 pl-4"
                >
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{event.type}</p>
                    <p className="text-gray-400 text-sm">
                      {formatDate(
                        new Date(event.timestamp),
                        "MMM dd, yyyy HH:mm",
                      )}
                    </p>
                    <p className="text-gray-400 text-sm">
                      by {event.actor.name} ({event.actor.role})
                    </p>
                    {event.location && (
                      <p className="text-gray-400 text-sm">
                        at {event.location.name}
                      </p>
                    )}
                    {event.verified && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-green-500 text-white text-xs rounded">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Digital Verification */}
        {etw.verification && (
          <section className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Digital Verification
            </h2>
            <div className="space-y-2">
              <div>
                <label className="text-gray-400 text-sm">Hash</label>
                <p className="text-white font-mono text-xs break-all">
                  {etw.verification.hash.substring(0, 32)}...
                </p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">
                  Verification URL
                </label>
                <a
                  href={etw.verification.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 text-sm break-all"
                >
                  {etw.verification.verificationUrl}
                </a>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Created</label>
                <p className="text-white text-sm">
                  {formatDate(
                    new Date(etw.verification.createdAt),
                    "MMM dd, yyyy HH:mm",
                  )}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </PageTemplate>
  );
}
