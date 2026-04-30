"use client";

/**
 * Compliance Dashboard - Main Page
 * Enhanced compliance management interface with authority hierarchy, local knowledge, and interactive tools
 * Dark Theme - Matching Hazalyze Design System
 * Auto-initializes comprehensive mock data and intelligent features
 */

import { useEffect, useState } from "react";
import EnhancedComplianceDashboard from "@/components/compliance/EnhancedComplianceDashboard";
import PageTemplate from "@/components/PageTemplate";
import { comprehensiveSetupService } from "@/lib/services/compliance/comprehensiveSetupService";

export default function CompliancePage() {
  const tenantId = "tenant-1"; // Would come from auth context
  const [setupComplete, setSetupComplete] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);

  useEffect(() => {
    // Auto-initialize comprehensive compliance system on first load
    const initializeSystem = async () => {
      try {
        // Check if setup is needed
        const verification = comprehensiveSetupService.verifySetup();

        if (!verification.complete) {
          console.log("🔧 Initializing comprehensive compliance system...");
          const result = await comprehensiveSetupService.quickSetup(tenantId);

          if (result.success) {
            console.log("✅ Compliance system initialized successfully");
            setSetupComplete(true);
          } else {
            console.warn("⚠️ Setup completed with warnings:", result.warnings);
            setSetupComplete(true); // Still show dashboard even with warnings
          }
        } else {
          console.log("✅ Compliance system already initialized");
          setSetupComplete(true);
        }
      } catch (error) {
        console.error("❌ Error initializing compliance system:", error);
        setSetupComplete(true); // Show dashboard anyway
      } finally {
        setSetupLoading(false);
      }
    };

    initializeSystem();
  }, [tenantId]);

  if (setupLoading) {
    return (
      <PageTemplate
        title="Compliance Management"
        description="Initializing comprehensive compliance system..."
        icon="ri-shield-check-line"
        systemInfo={{
          custom: "Hazalyze Enhanced Compliance Engine v2.0",
        }}
        stats={[]}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg mb-2">
              Initializing Compliance System
            </p>
            <p className="text-gray-400 text-sm">
              Setting up authorities, regulations, and intelligent features...
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Compliance Management"
      description="Comprehensive compliance monitoring and management with authority hierarchy, deep local knowledge, intelligent AI recommendations, risk prediction, and interactive tools. Track regulatory requirements, violations, and maintain compliance across all operations."
      icon="ri-shield-check-line"
      systemInfo={{
        sap: "Compliance Management (GRC)",
        oracle: "Oracle GRC Cloud",
        custom: "Hazalyze Enhanced Compliance Engine v2.0 - AI-Powered",
      }}
      stats={[]}
    >
      <EnhancedComplianceDashboard tenantId={tenantId} />
    </PageTemplate>
  );
}
