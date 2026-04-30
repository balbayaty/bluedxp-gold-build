import type { CapabilityStatus } from "@/types/capabilities";

/**
 * Capability Registry
 *
 * This is the single source of truth for “what is real vs simulated vs placeholder”.
 * We keep it explicit to avoid surprises: labels should never “guess”.
 */

export type CapabilityEntry = {
  path: string;
  match: RegExp;
  status: CapabilityStatus;
};

export const transportationCapabilities: CapabilityEntry[] = [
  // Dashboards
  {
    path: "/transportation/capabilities",
    match: /^\/transportation\/capabilities\/?$/i,
    status: {
      id: "tms.capabilityCatalog",
      label: "Transportation Capability Catalog",
      maturity: "real",
      reason:
        "This page is the source-of-truth view of what is REAL vs SIMULATED vs CONFIG REQUIRED.",
    },
  },
  {
    path: "/transportation/customs/authorities",
    match: /^\/transportation\/customs\/authorities\/?$/i,
    status: {
      id: "tms.customs.authorities",
      label: "Customs Authorities",
      maturity: "real",
      reason:
        "Uses tenant-scoped APIs and production blocks DB fallback (no mock list).",
    },
  },
  {
    path: "/transportation/customs/declarations",
    match: /^\/transportation\/customs\/declarations\/?$/i,
    status: {
      id: "tms.customs.declarations",
      label: "Customs Declarations",
      maturity: "real",
      reason:
        "Tenant-scoped API + DB persistence + evidence + event bus integration.",
    },
  },
  {
    path: "/transportation/customs/brokers",
    match: /^\/transportation\/customs\/brokers\/?$/i,
    status: {
      id: "tms.customs.brokers",
      label: "Customs Brokers",
      maturity: "config_required",
      reason:
        "Brokers persist tenant-scoped. Performance analytics on the UI was previously demo-enriched; real KPIs require operational data feeds.",
      howToFix:
        "Persist real broker performance KPIs and return them from the API (no UI synthesis).",
    },
  },
  {
    path: "/transportation/exports",
    match: /^\/transportation\/exports\/?$/i,
    status: {
      id: "tms.exports",
      label: "Exports & Reporting",
      maturity: "real",
      reason:
        "Exports are stored durably (MinIO + Postgres) in production; downloads are tenant/RBAC protected.",
    },
  },
  {
    path: "/transportation/geofences",
    match: /^\/transportation\/geofences\/?$/i,
    status: {
      id: "tms.geofence",
      label: "Geofencing",
      maturity: "real",
      reason:
        "Geofence has APIs + Prisma persistence (zones/events/dwell/SLA/KPI); strict production forbids in-memory fallback.",
    },
  },
  {
    path: "/transportation/carriers",
    match: /^\/transportation\/carriers\/?$/i,
    status: {
      id: "tms.carriers",
      label: "Carriers",
      maturity: "real",
      reason: "Tenant-scoped API + DB persistence. No hardcoded demo list.",
    },
  },
  {
    path: "/transportation/documents",
    match: /^\/transportation\/documents\/?$/i,
    status: {
      id: "tms.documents",
      label: "Transport Documents",
      maturity: "real",
      reason:
        "Tenant-scoped API + DB persistence + evidence + event bus integration.",
    },
  },
  {
    path: "/transportation/incidents",
    match: /^\/transportation\/incidents\/?$/i,
    status: {
      id: "tms.incidents",
      label: "Incidents",
      maturity: "real",
      reason: "Tenant-scoped incident ledger in DB + event bus integration.",
    },
  },
  {
    path: "/transportation/quotes",
    match: /^\/transportation\/quotes\/?$/i,
    status: {
      id: "tms.quotes",
      label: "Quotes",
      maturity: "real",
      reason:
        "Tenant-scoped quote API + DB persistence + evidence + event bus integration.",
    },
  },
  {
    path: "/transportation/proposals",
    match: /^\/transportation\/proposals\/?$/i,
    status: {
      id: "tms.proposals",
      label: "Proposals",
      maturity: "real",
      reason:
        "Tenant-scoped proposals API exists and persists records; approvals/workflows are integration-dependent.",
    },
  },
  {
    path: "/transportation/payments",
    match: /^\/transportation\/payments\/?$/i,
    status: {
      id: "tms.payments",
      label: "Payments",
      maturity: "config_required",
      reason:
        "Payment records persist tenant-scoped, but “process payment” depends on real invoice/shipment billing services and a real payment provider configuration.",
      howToFix:
        "Implement invoice persistence + billing reconciliation + configure payment provider.",
    },
  },
  {
    path: "/transportation/shipments/new",
    match: /^\/transportation\/shipments\/new\/?$/i,
    status: {
      id: "tms.shipments.create",
      label: "Create Shipment",
      maturity: "config_required",
      reason:
        "Shipment persistence is real, but “intelligence enrichment” features require real integrations (pricing, predictive, realtime, AI, etc.).",
      howToFix:
        "Configure/implement required intelligence providers or disable intelligence enrichment for production workflows.",
    },
  },
  {
    path: "/transportation",
    match: /^\/transportation\/?$/i,
    status: {
      id: "tms.dashboard",
      label: "Transportation Dashboard",
      maturity: "simulated",
      reason:
        "Dashboard KPIs are currently hardcoded sample numbers for UI/layout validation.",
      howToFix: "Replace hardcoded KPIs with tenant-scoped API calls.",
    },
  },
  {
    path: "/transportation/dashboard",
    match: /^\/transportation\/dashboard\/?$/i,
    status: {
      id: "tms.dashboard.comprehensive",
      label: "Transportation Intelligence Hub",
      maturity: "real",
      reason:
        "Loads tenant-scoped shipments from API and drives the hub off a real selected shipment.",
    },
  },
  {
    path: "/transportation/digital-twins",
    match: /^\/transportation\/digital-twins\/?$/i,
    status: {
      id: "tms.digitalTwins",
      label: "Digital Twins",
      maturity: "simulated",
      reason:
        "Simulation workflows exist; real-world twin ingestion depends on live IoT + shipment telemetry integrations.",
      howToFix:
        "Connect IoT telemetry ingestion + persistence and validate twin state models.",
    },
  },
  {
    path: "/transportation/digital-twins (legacy)",
    match: /^\/transportation\/analytics\/digital-twins\/?$/i,
    status: {
      id: "tms.digitalTwins.analytics",
      label: "Digital Twins (Analytics)",
      maturity: "simulated",
      reason:
        "Analytics view depends on real twin ingestion + storage; currently treated as non-real.",
      howToFix: "Implement ingestion + persistence and wire analytics queries.",
    },
  },
  {
    path: "/transportation/realtime",
    match: /^\/transportation\/realtime\/?$/i,
    status: {
      id: "tms.realtime",
      label: "Real-time Tracking",
      maturity: "real",
      reason:
        "Tenant-scoped tracking view is real; production never generates fake coordinates. Locations can be updated internally via the tracking API.",
    },
  },
  {
    path: "/transportation/route-comparison",
    match: /^\/transportation\/route-comparison\/?$/i,
    status: {
      id: "tms.routeComparison",
      label: "Route Comparison",
      maturity: "config_required",
      reason:
        "In production, strict mode blocks mock carrier/routing. Requires real carrier/routing integrations.",
      howToFix: "Configure carrier network + routing providers.",
    },
  },
  {
    path: "/transportation/load-building",
    match: /^\/transportation\/load-building\/?$/i,
    status: {
      id: "tms.loadBuilding",
      label: "Load Building",
      maturity: "real",
      reason:
        "Load building UI is internal-real and uses the internal load-building API; production no longer auto-injects demo cargo.",
    },
  },
  {
    path: "/transportation/analytics",
    match: /^\/transportation\/analytics\/?$/i,
    status: {
      id: "tms.analytics.dashboard",
      label: "Transportation Analytics",
      maturity: "real",
      reason:
        "Analytics dashboard is computed from tenant-scoped shipments/carriers (no sample chart data).",
    },
  },
  {
    path: "/transportation/analytics/load-building",
    match: /^\/transportation\/analytics\/load-building\/?$/i,
    status: {
      id: "tms.analytics.loadBuilding",
      label: "Load Building Analytics",
      maturity: "real",
      reason:
        "Analytics is computed from tenant-scoped, DB-persisted load plans (no demo arrays).",
    },
  },
  {
    path: "/transportation/analytics/network",
    match: /^\/transportation\/analytics\/network\/?$/i,
    status: {
      id: "tms.analytics.network",
      label: "Network Analytics",
      maturity: "real",
      reason:
        "Analytics is computed from tenant-scoped network models + optimizations via internal API.",
    },
  },
  {
    path: "/transportation/analytics/last-mile",
    match: /^\/transportation\/analytics\/last-mile\/?$/i,
    status: {
      id: "tms.analytics.lastMile",
      label: "Last-Mile Analytics",
      maturity: "real",
      reason:
        "Analytics is computed from tenant-scoped last-mile routes via internal API.",
    },
  },
  {
    path: "/transportation/quantum",
    match: /^\/transportation\/quantum\/?$/i,
    status: {
      id: "tms.quantum",
      label: "Quantum Transportation",
      maturity: "placeholder",
      reason:
        "Placeholder page (navigation-safe) while the quantum-ready optimization engine is implemented.",
      howToFix:
        "Implement quantum optimization workflows and remove placeholder.",
    },
  },
  {
    path: "/transportation/corridors",
    match: /^\/transportation\/corridors\/?$/i,
    status: {
      id: "tms.corridors",
      label: "Transportation Corridors",
      maturity: "placeholder",
      reason:
        "Placeholder page (navigation-safe) while corridor intelligence is implemented.",
      howToFix:
        "Implement corridor intelligence workflows and remove placeholder.",
    },
  },
  {
    path: "/transportation/psychology",
    match: /^\/transportation\/psychology\/?$/i,
    status: {
      id: "tms.psychology",
      label: "Transportation Psychology",
      maturity: "placeholder",
      reason:
        "Placeholder page (navigation-safe) while human-factors analytics is implemented.",
      howToFix:
        "Implement human-factors analytics workflows and remove placeholder.",
    },
  },
  {
    path: "/transportation/pricing",
    match: /^\/transportation\/pricing\/?$/i,
    status: {
      id: "tms.pricing",
      label: "Pricing Intelligence",
      maturity: "config_required",
      reason:
        "Market index updates are simulated unless real pricing feeds are configured.",
      howToFix:
        "Connect real pricing/index providers and remove simulated updates.",
    },
  },
  {
    path: "/transportation/blockchain",
    match: /^\/transportation\/blockchain\/?$/i,
    status: {
      id: "tms.blockchain",
      label: "Blockchain / Smart Contracts",
      maturity: "simulated",
      reason:
        "Hashing/contract monitoring are placeholders; strict mode blocks in production.",
      howToFix:
        "Implement real cryptography + tamper-proof ledger + contract execution engine.",
    },
  },
  {
    path: "/transportation/scenario-simulation",
    match: /^\/transportation\/scenario-simulation\/?$/i,
    status: {
      id: "tms.scenarioSimulation.ui",
      label: "Scenario Simulation",
      maturity: "simulated",
      reason:
        "Scenario simulation is not production-real yet; strict mode blocks in production.",
      howToFix:
        "Wire persisted baselines + real analytics inputs + validated simulation engine.",
    },
  },
  // Everything else under /transportation will be marked “unclassified/config_required” by the fallback below.
  {
    path: "/transportation/iot",
    match: /^\/transportation\/iot\/?$/i,
    status: {
      id: "tms.iot",
      label: "IoT Monitoring",
      maturity: "config_required",
      reason:
        "UI/services exist, but real IoT provider credentials/endpoints are required.",
      howToFix:
        "Set provider credentials + enable ingestion adapters for your devices/providers.",
      autoUpgrade: {
        upgradeTo: "real",
        anyOfAll: [
          // Direct providers configured
          [
            {
              kind: "env_json_array_nonempty",
              key: "TRANSPORTATION_IOT_PROVIDERS",
            },
          ],
          // Government IoT integration enabled and ELM configured
          [
            { kind: "env_true", key: "TRANSPORTATION_GOV_IOT_ENABLED" },
            { kind: "env_set", key: "ELM_API_URL" },
            { kind: "env_set", key: "ELM_API_KEY" },
          ],
        ],
        note: "Auto-upgrades to REAL once IoT providers (or government IoT) are configured.",
      },
    },
  },
  {
    path: "/transportation/integration",
    match: /^\/transportation\/integration(\/.*)?$/i,
    status: {
      id: "tms.integrations",
      label: "Integrations (ERP/WMS/Gov)",
      maturity: "config_required",
      reason:
        "Integration surfaces exist; real external endpoints and auth are required.",
      howToFix:
        "Provide target systems + credentials so adapters can be configured and tested end-to-end.",
      autoUpgrade: {
        upgradeTo: "real",
        anyOfAll: [
          // Government integration (ELM) configured
          [
            { kind: "env_set", key: "ELM_API_URL" },
            { kind: "env_set", key: "ELM_API_KEY" },
          ],
        ],
        note: "Auto-upgrades to REAL once at least one real integration provider is configured.",
      },
    },
  },
];

const all = [...transportationCapabilities];

export function getCapabilityStatusForPath(
  pathname: string,
): CapabilityStatus | null {
  for (const entry of all) {
    if (entry.match.test(pathname)) return entry.status;
  }
  // Generic fallback: anything under Transportation that isn't explicitly classified yet.
  // This prevents silent ambiguity for teams.
  if ((pathname || "").toLowerCase().startsWith("/transportation/")) {
    return {
      id: `tms.unclassified.${pathname.replace(/\W+/g, "_").toLowerCase()}`,
      label: "Transportation (Unclassified)",
      maturity: "config_required",
      reason:
        "This Transportation page is not yet explicitly classified as REAL vs SIMULATED. Treat as config-required until reviewed.",
      howToFix:
        "Add an explicit entry to the Transportation capability registry.",
    };
  }
  return null;
}
