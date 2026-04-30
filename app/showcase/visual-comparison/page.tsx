/**
 * Visual Comparison Showcase
 *
 * Showcase page for VisualComparisonDemo component
 */

"use client";

import VisualComparisonDemo from "@/components/demo/VisualComparisonDemo";
import PageTemplate from "@/components/PageTemplate";

export default function VisualComparisonPage() {
  return (
    <PageTemplate
      title="Visual Comparison Demo"
      description="Side-by-side comparison of current design vs enhanced design"
      shortDescription="Design comparison showcase"
      icon="ri-eye-line"
    >
      <VisualComparisonDemo />
    </PageTemplate>
  );
}
