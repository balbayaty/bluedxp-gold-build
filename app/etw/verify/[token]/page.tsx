"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/utils/apiFetch";
import { format as formatDate } from "date-fns";

interface VerificationResult {
  success: boolean;
  verified: boolean;
  status: string;
  tamperDetected: boolean;
  etw?: any;
  message: string;
}

export default function ETWVerificationPage() {
  const params = useParams();
  const token = params.token as string;

  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function verify() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await apiFetch(`/api/v/${token}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json().catch(() => {
          throw new Error("Invalid JSON response from server");
        });
        if (!mounted) return;
        setResult(data);
      } catch (e) {
        if (!mounted) return;
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error("[ETW Verification Page] Error:", e);
        setError(errorMessage || "An unexpected error occurred");
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    }

    if (token) {
      verify();
    }
    return () => {
      mounted = false;
    };
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying ETW...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0">
              <i className="ri-error-warning-line text-3xl text-red-400"></i>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-2">
                Verification Error
              </h1>
              <p className="text-red-400 mb-4">
                {error.includes("404") || error.includes("not found")
                  ? "The verification link is invalid or has expired. Please request a new verification link."
                  : error.includes("expired") || error.includes("revoked")
                    ? "This verification link has expired or been revoked. Please request a new link."
                    : error}
              </p>
              <p className="text-gray-400 text-sm">
                If you believe this is an error, please contact the e-Waybill
                owner or system administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Verification Status Banner */}
        <div
          className={`mb-6 rounded-lg p-6 ${
            result.verified && !result.tamperDetected
              ? "bg-green-900/20 border border-green-500"
              : result.tamperDetected
                ? "bg-red-900/20 border border-red-500"
                : "bg-yellow-900/20 border border-yellow-500"
          }`}
        >
          <div className="flex items-center gap-4">
            {result.verified && !result.tamperDetected ? (
              <>
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Verified</h1>
                  <p className="text-gray-300">
                    This e-Waybill has been verified and is authentic
                  </p>
                </div>
              </>
            ) : result.tamperDetected ? (
              <>
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Tamper Detected
                  </h1>
                  <p className="text-red-300">
                    This e-Waybill has been modified and may not be authentic
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Verification Pending
                  </h1>
                  <p className="text-gray-300">{result.message}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ETW Details */}
        {result.etw && (
          <div className="bg-gray-800 rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                e-Waybill Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">ETW Number</label>
                  <p className="text-white font-mono">{result.etw.etwNumber}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Status</label>
                  <p className="text-white">{result.etw.status}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Scope</label>
                  <p className="text-white">{result.etw.scope}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Mode</label>
                  <p className="text-white">{result.etw.mode}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Route</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Origin</label>
                  <p className="text-white">{result.etw.route.origin.name}</p>
                  <p className="text-gray-400 text-sm">
                    {result.etw.route.origin.address?.city},{" "}
                    {result.etw.route.origin.address?.country}
                  </p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Destination</label>
                  <p className="text-white">
                    {result.etw.route.destination.name}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {result.etw.route.destination.address?.city},{" "}
                    {result.etw.route.destination.address?.country}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Cargo</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Total Weight</label>
                  <p className="text-white">
                    {result.etw.cargo.totalWeight} kg
                  </p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Total Value</label>
                  <p className="text-white">
                    {result.etw.cargo.totalValue} {result.etw.cargo.currency}
                  </p>
                </div>
              </div>
            </div>

            {/* Event Timeline */}
            {result.etw.events && result.etw.events.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Event Timeline
                </h3>
                <div className="space-y-3">
                  {result.etw.events.map((event: any, index: number) => (
                    <div
                      key={index}
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery Information */}
            {result.etw.delivery && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Delivery
                </h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-gray-400 text-sm">Receiver</label>
                    <p className="text-white">
                      {result.etw.delivery.receiver.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">
                      Delivered At
                    </label>
                    <p className="text-white">
                      {formatDate(
                        new Date(result.etw.delivery.deliveredAt),
                        "MMM dd, yyyy HH:mm",
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Condition</label>
                    <p className="text-white">
                      {result.etw.delivery.condition}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
