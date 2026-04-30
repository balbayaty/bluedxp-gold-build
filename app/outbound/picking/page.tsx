"use client";

import { ErrorBoundary } from "react-error-boundary";
import PickingInterface from "@/components/outbound/PickingInterface";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white">
      <div className="bg-white/10 p-6 rounded-xl border border-white/20">
        <h2 className="text-xl font-bold text-red-400 mb-2">Picking Error</h2>
        <p>{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 rounded"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default function PickingPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <PickingInterface />
    </ErrorBoundary>
  );
}
