"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-2xl">⚠</span>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">
            Something went wrong!
          </h2>
          <p className="text-[#9ca3af] mb-6">
            {error.message || "An unexpected error occurred"}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Go home
            </button>
          </div>
          {error.digest && (
            <p className="text-xs text-[#6b7280] mt-4">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
