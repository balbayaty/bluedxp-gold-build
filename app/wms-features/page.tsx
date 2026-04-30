"use client";

import PageTemplate from "@/components/PageTemplate";
import FeatureDashboard from "@/components/wms/FeatureDashboard";

export default function WMSFeaturesPage() {
  const stats = [
    {
      label: "Total Features",
      value: "8",
      icon: "ri-apps-line",
      color: "cyan",
    },
    {
      label: "Production Ready",
      value: "0",
      icon: "ri-verified-badge-line",
      color: "green",
    },
    {
      label: "Ready to Use",
      value: "2",
      icon: "ri-checkbox-circle-line",
      color: "blue",
    },
    {
      label: "In Development",
      value: "6",
      icon: "ri-tools-line",
      color: "yellow",
    },
  ];

  return (
    <PageTemplate
      title="WMS Feature Dashboard"
      subtitle="Comprehensive view of all WMS features with requirements, readiness, and industry benchmarks"
      icon="ri-dashboard-3-line"
      features={[
        "Feature requirements tracking",
        "Readiness assessment",
        "Industry benchmarking",
        "Configuration guides",
        "Interactive tooltips",
      ]}
      stats={stats}
    >
      <FeatureDashboard />
    </PageTemplate>
  );
}
