/**
 * Fire Safety Configuration Component
 * Comprehensive fire suppression system configuration and recommendations
 * BlueDXP Platform - 4IR & 5IR Aligned
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Modal from "@/components/Modal";
import Tooltip from "@/components/Tooltip";
import {
  fireSafetyService,
  type FireSuppressionSystemSpec,
} from "@/lib/services/wms/fireSafetyService";
import type { FireSuppressionSystemType } from "@/types/warehouseLocation";
import { ALL_HAZARD_CLASSES } from "@/types/warehouseLocation";

interface FireSafetyConfigProps {
  locationId?: string;
  currentSystem?: FireSuppressionSystemType;
  hazardClasses: string[];
  areaSize: number;
  onSystemSelect?: (system: FireSuppressionSystemType) => void;
  onClose?: () => void;
}

export default function FireSafetyConfig({
  locationId,
  currentSystem,
  hazardClasses,
  areaSize,
  onSystemSelect,
  onClose,
}: FireSafetyConfigProps) {
  const [selectedSystem, setSelectedSystem] =
    useState<FireSuppressionSystemType | null>(currentSystem || null);
  const [recommendedSystems, setRecommendedSystems] = useState<
    FireSuppressionSystemType[]
  >([]);
  const [systemSpecs, setSystemSpecs] =
    useState<FireSuppressionSystemSpec | null>(null);
  const [complianceCheck, setComplianceCheck] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hazardClasses.length > 0) {
      const recommendations = fireSafetyService.getRecommendedSystem(
        hazardClasses,
        areaSize,
      );
      setRecommendedSystems(recommendations);
    }
  }, [hazardClasses, areaSize]);

  useEffect(() => {
    if (selectedSystem) {
      const spec = fireSafetyService.getSystemSpecs(selectedSystem);
      setSystemSpecs(spec);

      if (locationId) {
        checkCompliance();
      }
    }
  }, [selectedSystem, locationId, hazardClasses]);

  const checkCompliance = async () => {
    if (!selectedSystem || !locationId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/wms/fire-safety?action=compliance&locationId=${locationId}`,
      );
      const data = await response.json();
      if (data.success) {
        setComplianceCheck(data.data);
      }
    } catch (error) {
      console.error("Error checking compliance:", error);
    } finally {
      setLoading(false);
    }
  };

  const allSystems: FireSuppressionSystemType[] = [
    "Sprinkler System with FM-200",
    "CO2 System",
    "Foam System",
    "Dry Chemical System",
    "Water Sprinkler System",
    "Gas Suppression (FM-200)",
    "Gas Suppression (Novec 1230)",
    "Inert Gas System (IG-541)",
    "Pre-Action Sprinkler System",
    "Deluge System",
    "Foam-Water Sprinkler System",
    "Multiple Systems (Combined)",
    "None",
  ];

  const handleSystemSelect = (system: FireSuppressionSystemType) => {
    setSelectedSystem(system);
    onSystemSelect?.(system);
  };

  const content = (
    <div className="space-y-6">
      {/* Recommended Systems */}
      {recommendedSystems.length > 0 && (
        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-3">
            <i className="ri-lightbulb-line text-cyan-400"></i>
            <h4 className="font-semibold text-cyan-400">Recommended Systems</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {recommendedSystems.map((system) => (
              <button
                key={system}
                onClick={() => handleSystemSelect(system)}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  selectedSystem === system
                    ? "bg-cyan-500 text-white"
                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                {system}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* System Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Fire Suppression System <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {allSystems.map((system) => {
            const spec = fireSafetyService.getSystemSpecs(system);
            const isRecommended = recommendedSystems.includes(system);
            const isCompatible = spec
              ? hazardClasses.every((hc) => spec.suitableFor.includes(hc))
              : false;

            return (
              <button
                key={system}
                onClick={() => handleSystemSelect(system)}
                className={`p-4 rounded-lg border text-left transition ${
                  selectedSystem === system
                    ? "bg-cyan-500/20 border-cyan-500"
                    : "bg-white/5 border-white/10 hover:border-cyan-500/50"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-white">{system}</span>
                  {isRecommended && (
                    <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
                      Recommended
                    </span>
                  )}
                </div>
                {spec && (
                  <div className="space-y-1 text-xs text-gray-400">
                    <div>Coverage: {spec.coverageArea.toLocaleString()} m²</div>
                    <div>Agent: {spec.agent}</div>
                    <div>
                      Standards: {spec.certificationStandards.join(", ")}
                    </div>
                    {!isCompatible && hazardClasses.length > 0 && (
                      <div className="text-yellow-400">
                        ⚠ May not cover all hazard classes
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected System Details */}
      {selectedSystem && systemSpecs && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="font-semibold text-white mb-3">
            System Specifications
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Description:</span>
              <p className="text-white mt-1">{systemSpecs.description}</p>
            </div>
            <div>
              <span className="text-gray-400">Coverage Area:</span>
              <p className="text-white mt-1">
                {systemSpecs.coverageArea.toLocaleString()} m²
              </p>
            </div>
            <div>
              <span className="text-gray-400">Activation Type:</span>
              <p className="text-white mt-1">{systemSpecs.activationType}</p>
            </div>
            <div>
              <span className="text-gray-400">Agent:</span>
              <p className="text-white mt-1">{systemSpecs.agent}</p>
            </div>
            <div>
              <span className="text-gray-400">Environmental Impact:</span>
              <p className="text-white mt-1">
                {systemSpecs.environmentalImpact}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Maintenance:</span>
              <p className="text-white mt-1">
                {systemSpecs.maintenanceFrequency}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-400">Suitable For:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {systemSpecs.suitableFor.map((hc) => (
                  <span
                    key={hc}
                    className="px-2 py-1 rounded text-xs bg-cyan-500/10 text-cyan-400"
                  >
                    {hc}
                  </span>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <span className="text-gray-400">Certification Standards:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {systemSpecs.certificationStandards.map((std) => (
                  <span
                    key={std}
                    className="px-2 py-1 rounded text-xs bg-blue-500/10 text-blue-400"
                  >
                    {std}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Check */}
      {complianceCheck && (
        <div
          className={`p-4 rounded-xl border ${
            complianceCheck.compliant
              ? "bg-green-500/10 border-green-500/20"
              : "bg-red-500/10 border-red-500/20"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white">Compliance Check</h4>
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${
                complianceCheck.compliant
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {complianceCheck.compliant ? "Compliant" : "Non-Compliant"}
            </span>
          </div>
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-400">Compliance Score</span>
              <span className="text-lg font-bold text-white">
                {complianceCheck.complianceScore}%
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  complianceCheck.complianceScore >= 90
                    ? "bg-green-500"
                    : complianceCheck.complianceScore >= 70
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${complianceCheck.complianceScore}%` }}
              />
            </div>
          </div>
          {complianceCheck.issues.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium text-red-400 mb-2">Issues:</p>
              <ul className="space-y-1">
                {complianceCheck.issues.map((issue: string, idx: number) => (
                  <li
                    key={idx}
                    className="text-sm text-gray-300 flex items-start gap-2"
                  >
                    <i className="ri-close-circle-line text-red-400 mt-0.5"></i>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {complianceCheck.recommendations.length > 0 && (
            <div>
              <p className="text-sm font-medium text-cyan-400 mb-2">
                Recommendations:
              </p>
              <ul className="space-y-1">
                {complianceCheck.recommendations.map(
                  (rec: string, idx: number) => (
                    <li
                      key={idx}
                      className="text-sm text-gray-300 flex items-start gap-2"
                    >
                      <i className="ri-arrow-right-s-line text-cyan-400 mt-0.5"></i>
                      {rec}
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Hazard Class Compatibility */}
      {hazardClasses.length > 0 && selectedSystem && systemSpecs && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="font-semibold text-white mb-3">
            Hazard Class Compatibility
          </h4>
          <div className="space-y-2">
            {hazardClasses.map((hc) => {
              const isCompatible = systemSpecs.suitableFor.includes(hc);
              return (
                <div
                  key={hc}
                  className="flex items-center justify-between p-2 rounded bg-white/5"
                >
                  <span className="text-sm text-white">{hc}</span>
                  {isCompatible ? (
                    <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">
                      <i className="ri-check-line mr-1"></i>
                      Compatible
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400">
                      <i className="ri-close-line mr-1"></i>
                      Not Compatible
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  if (onClose) {
    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Fire Safety Configuration"
        size="xl"
      >
        {content}
      </Modal>
    );
  }

  return <div>{content}</div>;
}
