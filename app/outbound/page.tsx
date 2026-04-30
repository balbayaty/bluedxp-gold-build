"use client";

import { ErrorBoundary } from "react-error-boundary";
import OutboundPage from "@/components/OutboundPage";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-2xl">
        <h2 className="text-2xl font-bold text-red-400 mb-4">
          Something went wrong
        </h2>
        <p className="text-white mb-4">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

export default function OutboundHome() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <OutboundPage />
    </ErrorBoundary>
  );
}
