/**
 * Visual Comparison Demo Page
 *
 * Showcase page for VisualComparisonDemo component
 * Demonstrates how components look the same but work better
 */

"use client";

import VisualComparisonDemo from "@/components/demo/VisualComparisonDemo";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function VisualComparisonPage() {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-[#111827] flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500">
              Something went wrong loading the demo. Please refresh the page.
            </p>
          </div>
        </div>
      }
    >
      <VisualComparisonDemo />
    </ErrorBoundary>
  );
}
