"use client";

/**
 * Cross-Module QR Intelligence Dashboard
 * Shows correlations and integrations across all modules
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function CrossModuleQRIntelligenceDashboard() {
  const [intelligence, setIntelligence] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCrossModuleIntelligence();
  }, []);

  const loadCrossModuleIntelligence = async () => {
    setLoading(true);
    try {
      const [damageRes, incidentRes, complianceRes] = await Promise.all([
        fetch("/api/qr/integrations/damage"),
        fetch("/api/qr/integrations/incident"),
        fetch("/api/qr/integrations/compliance"),
      ]);

      const damage = await damageRes.json();
      const incident = await incidentRes.json();
      const compliance = await complianceRes.json();

      setIntelligence({
        damage: damage.analytics,
        incident: incident.analytics,
        compliance: compliance.analytics,
      });
    } catch (error) {
      console.error("Error loading cross-module intelligence:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line animate-spin text-4xl mb-4"></i>
          <div>Loading cross-module intelligence...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <i className="ri-node-tree text-green-400"></i>
          Cross-Module QR Intelligence
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Damage Integration */}
          {intelligence?.damage && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <i className="ri-alert-line text-red-400"></i>
                Damage Integration
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-400">
                    QR Codes on Damaged Items
                  </div>
                  <div className="text-2xl font-bold">
                    {intelligence.damage.qrCodesOnDamagedItems || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Correlation Rate</div>
                  <div className="text-2xl font-bold text-red-400">
                    {(
                      intelligence.damage.correlation?.qrScansToDamageRate || 0
                    ).toFixed(2)}
                    %
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Incident Integration */}
          {intelligence?.incident && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <i className="ri-error-warning-line text-orange-400"></i>
                Incident Integration
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-400">
                    QR Codes at Incident Locations
                  </div>
                  <div className="text-2xl font-bold">
                    {intelligence.incident.qrCodesAtIncidentLocations || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Correlation Rate</div>
                  <div className="text-2xl font-bold text-orange-400">
                    {(
                      intelligence.incident.correlation
                        ?.qrScansToIncidentRate || 0
                    ).toFixed(2)}
                    %
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Compliance Integration */}
          {intelligence?.compliance && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <i className="ri-shield-check-line text-green-400"></i>
                Compliance Integration
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-400">
                    Compliance Checks via QR
                  </div>
                  <div className="text-2xl font-bold">
                    {intelligence.compliance.complianceChecksViaQR || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Compliance Score</div>
                  <div className="text-2xl font-bold text-green-400">
                    {intelligence.compliance.complianceScore || 0}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
