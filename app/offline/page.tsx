/**
 * Offline Page
 * Displayed when user is offline
 */

"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <i className="ri-wifi-off-line text-6xl text-gray-500 mb-4"></i>
        <h1 className="text-2xl font-bold text-white mb-2">You're Offline</h1>
        <p className="text-gray-400 mb-6">
          Please check your internet connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
