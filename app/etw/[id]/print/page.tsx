"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/utils/apiFetch";
import type { ETW } from "@/types/etw";
import { format as formatDate } from "date-fns";

export default function PrintETWPage() {
  const params = useParams();
  const etwId = params.id as string;

  const [etw, setEtw] = useState<ETW | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error("Failed to load ETW:", e);
        setError(errorMessage || "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    if (etwId) {
      load();
    }
  }, [etwId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const res = await apiFetch(`/api/etw/${etwId}/export/pdf`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ETW-${etw?.etwNumber || etwId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error("Failed to download PDF:", e);
      const errorMessage =
        e instanceof Error ? e.message : "Failed to download PDF";
      alert(
        `Error: ${errorMessage}\n\nPlease try again or contact support if the problem persists.`,
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ETW for printing...</p>
        </div>
      </div>
    );
  }

  if (error || !etw) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <i className="ri-error-warning-line text-2xl text-red-500"></i>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-red-800 mb-2">
                Unable to Load e-Waybill
              </h2>
              <p className="text-red-600 mb-4">
                {error ||
                  "The e-Waybill you are trying to print does not exist or you do not have permission to view it."}
              </p>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              >
                <i className="ri-arrow-left-line mr-2"></i>
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8 print:p-4">
      {/* Print Controls (hidden when printing) */}
      <div className="mb-6 print:hidden flex gap-4">
        <button
          onClick={handlePrint}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg"
        >
          Print
        </button>
        <button
          onClick={handleDownloadPDF}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
        >
          Download PDF
        </button>
      </div>

      {/* Print Content */}
      <div className="max-w-4xl mx-auto bg-white">
        {/* Header */}
        <div className="border-b-2 border-gray-900 pb-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">e-Waybill (ETW)</h1>
          <p className="text-gray-600 mt-2">ETW Number: {etw.etwNumber}</p>
          <p className="text-gray-600">
            Generated: {formatDate(new Date(), "MMM dd, yyyy HH:mm")}
          </p>
        </div>

        {/* Transport Reference Matrix */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">
            Transport Reference Matrix
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">ETW Number:</span> {etw.etwNumber}
            </div>
            {etw.references.shipmentNumber && (
              <div>
                <span className="font-semibold">Shipment Number:</span>{" "}
                {etw.references.shipmentNumber}
              </div>
            )}
            {etw.references.customerReference && (
              <div>
                <span className="font-semibold">Customer Reference:</span>{" "}
                {etw.references.customerReference}
              </div>
            )}
          </div>
        </section>

        {/* Transport Scope & Mode */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">
            Transport Scope & Mode
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Scope:</span> {etw.scope}
            </div>
            <div>
              <span className="font-semibold">Mode:</span> {etw.mode}
            </div>
          </div>
        </section>

        {/* Parties */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">
            Parties & Legal Roles
          </h2>
          <div className="space-y-3">
            {etw.parties.map((party) => (
              <div
                key={party.id}
                className="border border-gray-300 p-3 rounded"
              >
                <div className="font-semibold text-gray-900">
                  {party.name} ({party.type})
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {party.contact.name} • {party.contact.phone} •{" "}
                  {party.contact.email}
                </div>
                <div className="text-sm text-gray-600">
                  {party.contact.address}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cargo Declaration */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">
            Cargo Declaration
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="font-semibold">Total Weight:</span>{" "}
              {etw.cargo.totalWeight} kg
            </div>
            <div>
              <span className="font-semibold">Total Value:</span>{" "}
              {etw.cargo.totalValue} {etw.cargo.currency}
            </div>
            <div>
              <span className="font-semibold">Total Pieces:</span>{" "}
              {etw.cargo.totalPieces}
            </div>
            <div>
              <span className="font-semibold">Items:</span>{" "}
              {etw.cargo.items.length}
            </div>
          </div>
          <div className="space-y-2">
            {etw.cargo.items.map((item) => (
              <div
                key={item.id}
                className="border border-gray-300 p-2 rounded text-sm"
              >
                <div className="font-semibold">{item.description}</div>
                <div className="text-gray-600">
                  {item.packaging.quantity} {item.packaging.unit} •{" "}
                  {item.weight.gross} kg
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Route */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">
            Route & Execution
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Origin:</span>{" "}
              {etw.route.origin.name}
              <div className="text-gray-600 text-xs mt-1">
                {etw.route.origin.address?.city},{" "}
                {etw.route.origin.address?.country}
              </div>
            </div>
            <div>
              <span className="font-semibold">Destination:</span>{" "}
              {etw.route.destination.name}
              <div className="text-gray-600 text-xs mt-1">
                {etw.route.destination.address?.city},{" "}
                {etw.route.destination.address?.country}
              </div>
            </div>
          </div>
        </section>

        {/* Event Timeline */}
        {etw.events.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">
              Event Timeline
            </h2>
            <div className="space-y-2 text-sm">
              {etw.events.map((event) => (
                <div key={event.id} className="border-l-2 border-gray-400 pl-3">
                  <div className="font-semibold">{event.type}</div>
                  <div className="text-gray-600">
                    {formatDate(
                      new Date(event.timestamp),
                      "MMM dd, yyyy HH:mm",
                    )}{" "}
                    • {event.actor.name} ({event.actor.role})
                  </div>
                  {event.location && (
                    <div className="text-gray-600 text-xs">
                      at {event.location.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Digital Verification */}
        {etw.verification && (
          <section className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">
              Digital Verification
            </h2>
            <div className="text-sm space-y-1">
              <div>
                <span className="font-semibold">Hash:</span>{" "}
                <span className="font-mono text-xs">
                  {etw.verification.hash.substring(0, 32)}...
                </span>
              </div>
              <div>
                <span className="font-semibold">Verification URL:</span>{" "}
                <span className="text-xs break-all">
                  {etw.verification.verificationUrl}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-600 text-center">
          <p>
            This is a system-generated e-Waybill. For verification, scan the QR
            code or visit the verification URL.
          </p>
          <p className="mt-2">
            Generated by BlueDXP Platform •{" "}
            {formatDate(new Date(), "MMM dd, yyyy HH:mm")}
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none;
          }
          .print\\:p-4 {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
