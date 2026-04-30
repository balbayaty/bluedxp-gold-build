/**
 * Geofence Tooltips Component
 *
 * Comprehensive tooltip system for geofence features
 * Provides detailed explanations, use cases, and benefits
 */

"use client";

import Tooltip from "@/components/Tooltip";

interface GeofenceTooltipProps {
  feature: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

const tooltipContent: Record<
  string,
  {
    description: string;
    useCases: string[];
    benefits: string[];
    integration?: string;
  }
> = {
  "zone-creation": {
    description:
      "Create geofence zones to define geographic boundaries for tracking shipments, vehicles, and assets. Zones can be circles or polygons.",
    useCases: [
      "Define warehouse boundaries",
      "Mark customer delivery locations",
      "Set up border crossing checkpoints",
      "Create restricted areas",
      "Mark fuel stations and rest areas",
    ],
    benefits: [
      "Automatic entry/exit detection",
      "Real-time notifications",
      "Dwell time tracking",
      "Route optimization",
      "Compliance monitoring",
    ],
    integration: "Integrates with Transportation, WMS, and QHSE modules",
  },
  "dwell-time": {
    description:
      "Track how long shipments remain within a zone. Set expected and maximum dwell times to monitor efficiency and detect delays.",
    useCases: [
      "Monitor loading/unloading times",
      "Detect delays at checkpoints",
      "Optimize warehouse operations",
      "Track border crossing times",
      "Monitor customer site visits",
    ],
    benefits: [
      "Early delay detection",
      "Performance optimization",
      "Cost reduction",
      "Customer satisfaction",
      "Compliance tracking",
    ],
    integration: "Triggers quantum state updates in Schrödinger's Truck",
  },
  "event-detection": {
    description:
      "Automatically detect when shipments enter or exit zones. Supports multiple event types including entry, exit, dwell warnings, and anomalies.",
    useCases: [
      "Real-time shipment tracking",
      "Automatic status updates",
      "Anomaly detection",
      "Route deviation alerts",
      "Speed violation monitoring",
    ],
    benefits: [
      "Real-time visibility",
      "Automated workflows",
      "Proactive alerts",
      "Exception handling",
      "Audit trail",
    ],
    integration: "Publishes events to Event Bus for cross-module integration",
  },
  analytics: {
    description:
      "Comprehensive analytics dashboard with KPIs, trends, and insights. Powered by AI/ML for predictive analytics and recommendations.",
    useCases: [
      "Performance monitoring",
      "Trend analysis",
      "Cost optimization",
      "Compliance reporting",
      "Strategic planning",
    ],
    benefits: [
      "Data-driven decisions",
      "Predictive insights",
      "Cost savings",
      "Performance improvement",
      "Competitive advantage",
    ],
    integration: "Integrates with Knowledge Base and Agent Orchestration",
  },
  "quantum-triggers": {
    description:
      "Geofence events trigger quantum state updates in Schrödinger's Truck, improving delivery probability predictions.",
    useCases: [
      "Improve ETA accuracy",
      "Update delivery probabilities",
      "Trigger automated actions",
      "Optimize route planning",
      "Enhance customer communication",
    ],
    benefits: [
      "Better predictions",
      "Automated updates",
      "Improved accuracy",
      "Real-time adjustments",
      "Customer satisfaction",
    ],
    integration: "Direct integration with Schrödinger's Truck service",
  },
  "whatsapp-integration": {
    description:
      "Automatic WhatsApp notifications in Arabic and English for zone events. Supports driver communication and customer updates.",
    useCases: [
      "Driver notifications",
      "Customer updates",
      "Operations alerts",
      "Manager escalations",
      "Status confirmations",
    ],
    benefits: [
      "Real-time communication",
      "Bilingual support",
      "Automated messaging",
      "Improved coordination",
      "Customer satisfaction",
    ],
    integration: "Integrates with WhatsApp service and Notification system",
  },
};

export function GeofenceTooltip({
  feature,
  children,
  position = "top",
}: GeofenceTooltipProps) {
  const content = tooltipContent[feature];
  if (!content) {
    return <>{children}</>;
  }

  const tooltipContentJSX = (
    <div className="space-y-2">
      <div className="text-sm text-white font-medium">
        {content.description}
      </div>
      {content.useCases && content.useCases.length > 0 && (
        <div>
          <div className="text-xs text-gray-300 font-semibold mb-1">
            Use Cases:
          </div>
          <ul className="text-xs text-gray-400 space-y-1">
            {content.useCases.map((useCase, idx) => (
              <li key={idx} className="flex items-start gap-1">
                <span className="text-blue-400">•</span>
                <span>{useCase}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {content.benefits && content.benefits.length > 0 && (
        <div>
          <div className="text-xs text-gray-300 font-semibold mb-1">
            Benefits:
          </div>
          <ul className="text-xs text-gray-400 space-y-1">
            {content.benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-1">
                <span className="text-green-400">✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {content.integration && (
        <div className="pt-2 border-t border-gray-600">
          <div className="text-xs text-cyan-300">{content.integration}</div>
        </div>
      )}
    </div>
  );

  return (
    <Tooltip content={tooltipContentJSX} position={position}>
      {children}
    </Tooltip>
  );
}

// Quick tooltip for simple features
export function QuickTooltip({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip content={text}>
      <span className="cursor-help">{children}</span>
    </Tooltip>
  );
}
