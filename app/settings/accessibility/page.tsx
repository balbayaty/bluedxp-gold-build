"use client";

// ============================================================================
// HAZALYZE ADAPTIVE ACCESSIBILITY SETTINGS PAGE
// Route: /settings/accessibility
// ============================================================================

import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with localStorage
const AccessibilitySettings = dynamic(
  () => import("@/components/accessibility/AccessibilitySettings"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen bg-[#111827]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center animate-pulse">
            <i className="ri-user-heart-line text-white text-2xl"></i>
          </div>
          <p className="text-white/70 text-sm">
            Loading Accessibility Settings...
          </p>
          <p className="text-white/40 text-xs mt-1">
            Personalizing your experience
          </p>
        </div>
      </div>
    ),
  },
);

export default function AccessibilitySettingsPage() {
  return <AccessibilitySettings />;
}
