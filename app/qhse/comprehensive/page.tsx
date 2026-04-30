/**
 * Comprehensive QHSE Dashboard Page
 * World's Most Advanced QHSE Management System
 */

"use client";

import ComprehensiveQHSEDashboard from "@/components/qhse/ComprehensiveQHSEDashboard";

export default function ComprehensiveQHSEDashboardPage() {
  return (
    <ComprehensiveQHSEDashboard
      showStandards={true}
      showIRFeatures={true}
      industry="ALL"
      autoRefresh={true}
    />
  );
}
