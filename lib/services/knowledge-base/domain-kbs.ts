/**
 * Domain Knowledge Bases
 * Pre-configured knowledge bases for different domains
 * KB_ARCH, KB_COMP, KB_LEGAL, KB_OPERATIONS, KB_TECH, etc.
 */

import {
  KnowledgeEntry,
  KnowledgeType,
  KnowledgeCategory,
} from "@/types/knowledgeBase";
import { knowledgeBaseService } from "./index";

export type DomainKB =
  | "KB_ARCH" // Architecture
  | "KB_COMP" // Compliance
  | "KB_LEGAL" // Legal
  | "KB_OPERATIONS" // Operations
  | "KB_TECH" // Technical
  | "KB_FINANCE" // Finance
  | "KB_HR" // Human Resources
  | "KB_PROCUREMENT" // Procurement
  | "KB_TRADE" // Trade Compliance
  | "KB_MSDS" // MSDS/Chemical Safety
  | "KB_WMS" // Warehouse Management
  | "KB_TMS" // Transportation Management
  | "KB_QHSE" // Quality, Health, Safety, Environment
  | "KB_MAAS" // Manufacturing as a Service
  | "KB_IOT"; // IoT & Edge Computing

export interface DomainKBConfig {
  id: DomainKB;
  name: string;
  description: string;
  category: KnowledgeCategory;
  defaultTypes: KnowledgeType[];
  autoIndex: boolean;
  vectorDimensions: number;
}

export const DOMAIN_KB_CONFIGS: Record<DomainKB, DomainKBConfig> = {
  KB_ARCH: {
    id: "KB_ARCH",
    name: "Architecture Knowledge Base",
    description:
      "System architecture, design patterns, integration patterns, and technical decisions",
    category: "technical",
    defaultTypes: ["documentation", "design", "pattern"],
    autoIndex: true,
    vectorDimensions: 1536,
  },
  KB_COMP: {
    id: "KB_COMP",
    name: "Compliance Knowledge Base",
    description:
      "Regulatory compliance, standards, certifications, and audit requirements",
    category: "compliance",
    defaultTypes: ["regulation", "standard", "policy"],
    autoIndex: true,
    vectorDimensions: 1536,
  },
  KB_LEGAL: {
    id: "KB_LEGAL",
    name: "Legal Knowledge Base",
    description: "Legal documents, contracts, terms, and legal precedents",
    category: "legal",
    defaultTypes: ["contract", "legal", "precedent"],
    autoIndex: true,
    vectorDimensions: 1536,
  },
  KB_OPERATIONS: {
    id: "KB_OPERATIONS",
    name: "Operations Knowledge Base",
    description:
      "Operational procedures, workflows, best practices, and runbooks",
    category: "operations",
    defaultTypes: ["procedure", "workflow", "runbook"],
    autoIndex: true,
    vectorDimensions: 1536,
  },
  KB_TECH: {
    id: "KB_TECH",
    name: "Technical Knowledge Base",
    description:
      "Technical documentation, APIs, code examples, and troubleshooting guides",
    category: "technical",
    defaultTypes: ["documentation", "api", "code"],
    autoIndex: true,
    vectorDimensions: 1536,
  },
  KB_FINANCE: {
    id: "KB_FINANCE",
    name: "Finance Knowledge Base",
    description:
      "Financial procedures, accounting standards, tax regulations, and financial policies",
    category: "finance",
    defaultTypes: ["procedure", "standard", "policy"],
    autoIndex: true,
    vectorDimensions: 1536,
  },
  KB_HR: {
    id: "KB_HR",
    name: "Human Resources Knowledge Base",
    description:
      "HR policies, procedures, employee handbooks, and labor regulations",
    category: "hr",
    defaultTypes: ["policy", "procedure", "handbook"],
    autoIndex: true,
    vectorDimensions: 1536,
  },
  KB_PROCUREMENT: {
    id: "KB_PROCUREMENT",
    name: "Procurement Knowledge Base",
    description:
      "Procurement procedures, vendor management, and purchasing policies",
    category: "procurement",
    defaultTypes: ["procedure", "policy", "vendor"],
    autoIndex: true,
    vectorDimensions: 1536,
  },
  KB_TRADE: {
    id: "KB_TRADE",
    name: "Trade Compliance Knowledge Base",
    description:
      "Trade regulations, customs procedures, export/import rules, and trade agreements",
    category: "compliance",
    defaultTypes: ["regulation", "procedure", "agreement"],
    autoIndex: true,
    vectorDimensions: 1536,
  },
  KB_MSDS: {
    id: "KB_MSDS",
    name: "MSDS & Chemical Safety Knowledge Base",
    description:
      "Material Safety Data Sheets, chemical safety procedures, and hazard information",
    category: "safety",
    defaultTypes: ["msds", "safety", "hazard"],
    autoIndex: true,
    vectorDimensions: 1536,
  },
  KB_WMS: {
    id: "KB_WMS",
    name: "Warehouse Management Knowledge Base",
    description:
      "Warehouse operations, inventory management, and storage procedures",
    category: "operations",
    defaultTypes: ["procedure", "operation", "guide"],
    autoIndex: true,
    vectorDimensions: 1536,
  },
  KB_TMS: {
    id: "KB_TMS",
    name: "Transportation Management Knowledge Base",
    description:
      "Transportation procedures, routing, carrier management, and logistics",
    category: "operations",
    defaultTypes: ["procedure", "route", "carrier"],
    autoIndex: true,
    vectorDimensions: 1536,
  },
  KB_QHSE: {
    id: "KB_QHSE",
    name: "QHSE Knowledge Base",
    description:
      "Quality, Health, Safety, and Environment procedures and standards",
    category: "safety",
    defaultTypes: ["procedure", "standard", "safety"],
    autoIndex: true,
    vectorDimensions: 1536,
  },
  KB_MAAS: {
    id: "KB_MAAS",
    name: "Manufacturing as a Service Knowledge Base",
    description:
      "Manufacturing procedures, production standards, and MaaS operations",
    category: "operations",
    defaultTypes: ["procedure", "standard", "production"],
    autoIndex: true,
    vectorDimensions: 1536,
  },
  KB_IOT: {
    id: "KB_IOT",
    name: "IoT & Edge Computing Knowledge Base",
    description:
      "IoT device management, edge computing, and sensor data procedures",
    category: "technical",
    defaultTypes: ["documentation", "device", "sensor"],
    autoIndex: true,
    vectorDimensions: 1536,
  },
};

/**
 * Initialize domain knowledge base
 */
export async function initializeDomainKB(
  tenantId: string,
  domainKB: DomainKB,
): Promise<void> {
  const config = DOMAIN_KB_CONFIGS[domainKB];

  // Create initial entry for domain KB
  await knowledgeBaseService.addEntry({
    id: `kb-${domainKB.toLowerCase()}-${tenantId}`,
    tenantId,
    type: "documentation",
    category: config.category,
    source: "system",
    title: config.name,
    content: config.description,
    status: "active",
    verified: true,
    confidence: 1.0,
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {
      domainKB,
      autoIndex: config.autoIndex,
      vectorDimensions: config.vectorDimensions,
    },
  });
}

/**
 * Get domain knowledge base entries
 */
export async function getDomainKBEntries(
  tenantId: string,
  domainKB: DomainKB,
  limit: number = 50,
): Promise<KnowledgeEntry[]> {
  const results = await knowledgeBaseService.search({
    query: DOMAIN_KB_CONFIGS[domainKB].name,
    tenantId,
    limit,
    filters: {
      metadata: {
        domainKB,
      },
    },
  });

  return results.map((r) => r.entry);
}

/**
 * Add entry to domain knowledge base
 */
export async function addToDomainKB(
  tenantId: string,
  domainKB: DomainKB,
  entry: Omit<
    KnowledgeEntry,
    "id" | "tenantId" | "createdAt" | "updatedAt" | "metadata"
  >,
): Promise<KnowledgeEntry> {
  const config = DOMAIN_KB_CONFIGS[domainKB];

  return await knowledgeBaseService.addEntry({
    ...entry,
    tenantId,
    category: config.category,
    metadata: {
      ...entry.metadata,
      domainKB,
    },
  });
}

/**
 * Search across all domain knowledge bases
 */
export async function searchAllDomainKBs(
  tenantId: string,
  query: string,
  domainKBs?: DomainKB[],
  limit: number = 20,
): Promise<
  Array<{ domainKB: DomainKB; entry: KnowledgeEntry; score: number }>
> {
  const kbsToSearch =
    domainKBs || (Object.keys(DOMAIN_KB_CONFIGS) as DomainKB[]);

  const allResults = await Promise.all(
    kbsToSearch.map(async (domainKB) => {
      const results = await knowledgeBaseService.search({
        query,
        tenantId,
        limit,
        filters: {
          metadata: {
            domainKB,
          },
        },
      });

      return results.map((r) => ({
        domainKB,
        entry: r.entry,
        score: r.score,
      }));
    }),
  );

  // Flatten and sort by score
  return allResults
    .flat()
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
