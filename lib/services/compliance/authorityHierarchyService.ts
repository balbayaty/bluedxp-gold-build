/**
 * Regulatory Authority Hierarchy Service
 * Manages multi-level authority structures and deep local knowledge
 * Supports authority → sub-authority → multiple authorities relationships
 */

import {
  RegulatoryAuthorityNode,
  LocalRegulation,
  LocalKnowledgeEntry,
  HierarchyQuery,
  HierarchyPath,
  LocalKnowledgeSearchQuery,
  AuthorityType,
} from "@/types/compliance-hierarchy";
import {
  RegulatoryAuthority,
  RegulatoryRegion,
  ComplianceCategory,
} from "@/types/compliance";
import { knowledgeBaseService } from "../knowledge-base";

// ============================================================================
// IN-MEMORY STORAGE (Will be replaced with database)
// ============================================================================

class AuthorityHierarchyStore {
  private nodes: Map<string, RegulatoryAuthorityNode> = new Map();
  private regulations: Map<string, LocalRegulation> = new Map();
  private localKnowledge: Map<string, LocalKnowledgeEntry> = new Map();
  private hierarchyIndex: Map<string, string[]> = new Map(); // parentId -> childIds

  // Nodes
  getNode(id: string): RegulatoryAuthorityNode | undefined {
    return this.nodes.get(id);
  }

  setNode(node: RegulatoryAuthorityNode): void {
    this.nodes.set(node.id, node);

    // Update hierarchy index
    if (node.parentId) {
      const siblings = this.hierarchyIndex.get(node.parentId) || [];
      if (!siblings.includes(node.id)) {
        siblings.push(node.id);
        this.hierarchyIndex.set(node.parentId, siblings);
      }
    }
  }

  getAllNodes(): RegulatoryAuthorityNode[] {
    return Array.from(this.nodes.values());
  }

  getRootNodes(): RegulatoryAuthorityNode[] {
    return this.getAllNodes().filter((n) => !n.parentId);
  }

  getChildren(parentId: string): RegulatoryAuthorityNode[] {
    const childIds = this.hierarchyIndex.get(parentId) || [];
    return childIds.map((id) => this.nodes.get(id)!).filter(Boolean);
  }

  getAncestors(nodeId: string): RegulatoryAuthorityNode[] {
    const node = this.nodes.get(nodeId);
    if (!node || !node.parentId) return [];

    const ancestors: RegulatoryAuthorityNode[] = [];
    let current = this.nodes.get(node.parentId);

    while (current) {
      ancestors.unshift(current);
      if (current.parentId) {
        current = this.nodes.get(current.parentId);
      } else {
        break;
      }
    }

    return ancestors;
  }

  getDescendants(nodeId: string): RegulatoryAuthorityNode[] {
    const descendants: RegulatoryAuthorityNode[] = [];
    const children = this.getChildren(nodeId);

    for (const child of children) {
      descendants.push(child);
      descendants.push(...this.getDescendants(child.id));
    }

    return descendants;
  }

  // Regulations
  getRegulation(id: string): LocalRegulation | undefined {
    return this.regulations.get(id);
  }

  setRegulation(regulation: LocalRegulation): void {
    this.regulations.set(regulation.id, regulation);
  }

  getRegulationsByAuthority(authorityId: string): LocalRegulation[] {
    return Array.from(this.regulations.values()).filter(
      (r) => r.authorityId === authorityId,
    );
  }

  // Local Knowledge
  getLocalKnowledge(id: string): LocalKnowledgeEntry | undefined {
    return this.localKnowledge.get(id);
  }

  setLocalKnowledge(entry: LocalKnowledgeEntry): void {
    this.localKnowledge.set(entry.id, entry);
  }

  getAllLocalKnowledge(): LocalKnowledgeEntry[] {
    return Array.from(this.localKnowledge.values());
  }
}

const store = new AuthorityHierarchyStore();

// ============================================================================
// AUTHORITY HIERARCHY MANAGEMENT
// ============================================================================

/**
 * Create or update authority node
 */
export async function createOrUpdateAuthorityNode(
  node: Omit<RegulatoryAuthorityNode, "createdAt" | "updatedAt" | "children">,
): Promise<RegulatoryAuthorityNode> {
  const existing = store.getNode(node.id);
  const now = new Date().toISOString();

  // Resolve parent if parentId provided
  let parent: RegulatoryAuthorityNode | undefined;
  if (node.parentId) {
    parent = store.getNode(node.parentId);
    if (!parent) {
      throw new Error(`Parent authority ${node.parentId} not found`);
    }
  }

  // Calculate level
  const level = parent ? parent.level + 1 : 0;

  // Get siblings
  const siblings = node.parentId
    ? store.getChildren(node.parentId)
    : store.getRootNodes();
  const siblingIds = siblings.filter((s) => s.id !== node.id).map((s) => s.id);

  // Get children
  const children = existing ? store.getChildren(node.id) : [];

  const updated: RegulatoryAuthorityNode = {
    ...node,
    level,
    parent,
    children,
    siblingIds,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  store.setNode(updated);

  // Update parent's children reference
  if (parent) {
    const parentChildren = store.getChildren(parent.id);
    if (!parentChildren.find((c) => c.id === node.id)) {
      parent.children = [...parentChildren, updated];
      store.setNode(parent);
    }
  }

  // Sync to knowledge base
  await syncAuthorityToKnowledgeBase(updated);

  return updated;
}

/**
 * Get authority hierarchy path
 */
export function getHierarchyPath(authorityId: string): HierarchyPath | null {
  const node = store.getNode(authorityId);
  if (!node) return null;

  const ancestors = store.getAncestors(authorityId);
  const path = [...ancestors, node];
  const descendants = store.getDescendants(authorityId);

  return {
    path,
    depth: path.length - 1,
    totalAuthorities: 1 + descendants.length,
  };
}

/**
 * Query authority hierarchy
 */
export function queryHierarchy(
  query: HierarchyQuery,
): RegulatoryAuthorityNode[] {
  let nodes = store.getAllNodes();

  // Apply filters
  if (query.rootOnly) {
    nodes = nodes.filter((n) => !n.parentId);
  }

  if (query.level !== undefined) {
    nodes = nodes.filter((n) => n.level === query.level);
  }

  if (query.parentId) {
    nodes = nodes.filter((n) => n.parentId === query.parentId);
  }

  if (query.type) {
    nodes = nodes.filter((n) => n.type === query.type);
  }

  if (query.region) {
    nodes = nodes.filter((n) => n.region === query.region);
  }

  if (query.category) {
    nodes = nodes.filter((n) => n.categories.includes(query.category!));
  }

  if (query.status) {
    nodes = nodes.filter((n) => n.status === query.status);
  }

  if (query.search) {
    const searchLower = query.search.toLowerCase();
    nodes = nodes.filter(
      (n) =>
        n.name.toLowerCase().includes(searchLower) ||
        n.description.toLowerCase().includes(searchLower) ||
        n.code.toLowerCase().includes(searchLower),
    );
  }

  return nodes;
}

/**
 * Get all authorities for a requirement (including parent and child authorities)
 */
export function getRelatedAuthorities(
  authorityId: string,
): RegulatoryAuthorityNode[] {
  const node = store.getNode(authorityId);
  if (!node) return [];

  const related: RegulatoryAuthorityNode[] = [node];

  // Add parent
  if (node.parent) {
    related.push(node.parent);
  }

  // Add children
  related.push(...node.children);

  // Add siblings
  for (const siblingId of node.siblingIds) {
    const sibling = store.getNode(siblingId);
    if (sibling) related.push(sibling);
  }

  // Add explicitly related
  for (const relatedId of node.relatedAuthorities) {
    const relatedNode = store.getNode(relatedId);
    if (relatedNode) related.push(relatedNode);
  }

  return Array.from(new Map(related.map((n) => [n.id, n])).values());
}

// ============================================================================
// LOCAL REGULATION MANAGEMENT
// ============================================================================

/**
 * Create or update local regulation
 */
export async function createOrUpdateLocalRegulation(
  regulation: Omit<LocalRegulation, "createdAt" | "updatedAt">,
): Promise<LocalRegulation> {
  const existing = store.getRegulation(regulation.id);
  const now = new Date().toISOString();

  // Verify authority exists
  const authority = store.getNode(regulation.authorityId);
  if (!authority) {
    throw new Error(`Authority ${regulation.authorityId} not found`);
  }

  const updated: LocalRegulation = {
    ...regulation,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  store.setRegulation(updated);

  // Sync to knowledge base
  await syncRegulationToKnowledgeBase(updated, authority);

  return updated;
}

/**
 * Search local regulations
 */
export async function searchLocalRegulations(
  query: string,
  filters?: {
    authorityId?: string;
    category?: ComplianceCategory;
    priority?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    status?: "ACTIVE" | "DRAFT" | "SUSPENDED" | "REVOKED";
  },
): Promise<LocalRegulation[]> {
  // Use knowledge base for semantic search
  const kbResults = await knowledgeBaseService.search({
    query,
    filters: {
      categories: ["regulatory_compliance", "local_regulation"],
      minConfidence: 70,
    },
    limit: 50,
  });

  // Map to regulations
  const regulationIds = kbResults
    .map((r) => r.entry.metadata?.regulationId)
    .filter((id): id is string => !!id);

  let regulations = regulationIds
    .map((id) => store.getRegulation(id))
    .filter((reg): reg is LocalRegulation => !!reg);

  // Apply filters
  if (filters?.authorityId) {
    regulations = regulations.filter(
      (r) => r.authorityId === filters.authorityId,
    );
  }

  if (filters?.category) {
    regulations = regulations.filter((r) => r.category === filters.category);
  }

  if (filters?.priority) {
    regulations = regulations.filter((r) => r.priority === filters.priority);
  }

  if (filters?.status) {
    regulations = regulations.filter((r) => r.status === filters.status);
  }

  return regulations;
}

// ============================================================================
// LOCAL KNOWLEDGE BASE MANAGEMENT
// ============================================================================

/**
 * Create or update local knowledge entry
 */
export async function createOrUpdateLocalKnowledge(
  entry: Omit<
    LocalKnowledgeEntry,
    "id" | "createdAt" | "updatedAt" | "usageCount" | "feedbackScore"
  >,
): Promise<LocalKnowledgeEntry> {
  const id =
    entry.id ||
    `lk-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const now = new Date().toISOString();
  const existing = store.getLocalKnowledge(id);

  // Verify authority exists
  if (entry.authorityId) {
    const authority = store.getNode(entry.authorityId);
    if (!authority) {
      throw new Error(`Authority ${entry.authorityId} not found`);
    }
  }

  const updated: LocalKnowledgeEntry = {
    ...entry,
    id,
    usageCount: existing?.usageCount || 0,
    feedbackScore: existing?.feedbackScore || 0,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  store.setLocalKnowledge(updated);

  // Generate embedding and sync to knowledge base
  await syncLocalKnowledgeToKnowledgeBase(updated);

  return updated;
}

/**
 * Search local knowledge
 */
export async function searchLocalKnowledge(
  query: LocalKnowledgeSearchQuery,
): Promise<LocalKnowledgeEntry[]> {
  // Use knowledge base for semantic search
  const kbResults = await knowledgeBaseService.search({
    query: query.query,
    filters: {
      categories: ["regulatory_compliance", "local_knowledge"],
      minConfidence: query.minConfidence || 70,
    },
    limit: query.limit || 20,
  });

  // Map to local knowledge entries
  const knowledgeIds = kbResults
    .map((r) => r.entry.metadata?.localKnowledgeId)
    .filter((id): id is string => !!id);

  let entries = knowledgeIds
    .map((id) => store.getLocalKnowledge(id))
    .filter((e): e is LocalKnowledgeEntry => !!e);

  // Apply filters
  if (query.authorityId) {
    entries = entries.filter((e) => e.authorityId === query.authorityId);
  }

  if (query.regulationId) {
    entries = entries.filter((e) => e.regulationId === query.regulationId);
  }

  if (query.type) {
    entries = entries.filter((e) => e.type === query.type);
  }

  if (query.category) {
    entries = entries.filter((e) => e.category === query.category);
  }

  if (query.verifiedOnly) {
    entries = entries.filter((e) => e.verified);
  }

  // Update usage count
  for (const entry of entries) {
    entry.usageCount++;
    entry.lastAccessed = new Date().toISOString();
    store.setLocalKnowledge(entry);
  }

  return entries;
}

// ============================================================================
// KNOWLEDGE BASE SYNC
// ============================================================================

/**
 * Sync authority to knowledge base
 */
async function syncAuthorityToKnowledgeBase(
  node: RegulatoryAuthorityNode,
): Promise<void> {
  const content = `
    Regulatory Authority: ${node.name}
    Code: ${node.code}
    Type: ${node.type}
    Region: ${node.region}
    Level: ${node.level}
    
    Description: ${node.description}
    
    Categories: ${node.categories.join(", ")}
    ${node.parent ? `Parent Authority: ${node.parent.name}` : "Root Authority"}
    ${node.children.length > 0 ? `Sub-Authorities: ${node.children.map((c) => c.name).join(", ")}` : ""}
  `.trim();

  const searchableText = `
    ${node.name} ${node.code} ${node.description}
    ${node.type} ${node.region} ${node.categories.join(" ")}
    ${node.children.map((c) => c.name).join(" ")}
  `.trim();

  try {
    await knowledgeBaseService.create({
      tenantId: undefined, // Global knowledge
      type: "fact",
      category: "regulatory_compliance",
      content,
      summary: node.description.substring(0, 200),
      searchableText,
      keywords: [node.code, node.name, ...node.categories],
      source: "regulatory_authority",
      metadata: {
        authorityId: node.id,
        authorityCode: node.code,
        authorityType: node.type,
        region: node.region,
        level: node.level,
        parentId: node.parentId,
      },
      confidence: 100,
      verified: true,
      feedbackScore: 0,
      usageCount: 0,
      status: "active",
    });
  } catch (error) {
    console.error("Error syncing authority to knowledge base:", error);
  }
}

/**
 * Sync regulation to knowledge base
 */
async function syncRegulationToKnowledgeBase(
  regulation: LocalRegulation,
  authority: RegulatoryAuthorityNode,
): Promise<void> {
  const content = `
    Local Regulation: ${regulation.title}
    Code: ${regulation.regulationCode}
    Authority: ${authority.name} (${authority.code})
    Category: ${regulation.category}
    Priority: ${regulation.priority}
    
    Description: ${regulation.description}
    
    Summary: ${regulation.summary}
    
    Key Points:
    ${regulation.keyPoints.map((p) => `- ${p}`).join("\n")}
    
    Requirements: ${regulation.requirements.length} requirement(s)
    Effective Date: ${regulation.effectiveDate}
    ${regulation.expiryDate ? `Expiry Date: ${regulation.expiryDate}` : ""}
  `.trim();

  const searchableText = `
    ${regulation.title} ${regulation.regulationCode}
    ${regulation.description} ${regulation.summary}
    ${authority.name} ${authority.code}
    ${regulation.category} ${regulation.priority}
    ${regulation.keyPoints.join(" ")}
    ${regulation.tags.join(" ")} ${regulation.keywords.join(" ")}
  `.trim();

  try {
    await knowledgeBaseService.create({
      tenantId: undefined,
      type: "regulation",
      category: "regulatory_compliance",
      content,
      summary: regulation.summary,
      searchableText,
      keywords: [
        regulation.regulationCode,
        regulation.title,
        authority.code,
        ...regulation.keywords,
      ],
      source: "regulatory_authority",
      metadata: {
        regulationId: regulation.id,
        authorityId: authority.id,
        authorityCode: authority.code,
        category: regulation.category,
        priority: regulation.priority,
      },
      confidence: 100,
      verified: regulation.verifiedBy ? true : false,
      feedbackScore: 0,
      usageCount: 0,
      status: regulation.status === "ACTIVE" ? "active" : "archived",
    });
  } catch (error) {
    console.error("Error syncing regulation to knowledge base:", error);
  }
}

/**
 * Sync local knowledge to knowledge base
 */
async function syncLocalKnowledgeToKnowledgeBase(
  entry: LocalKnowledgeEntry,
): Promise<void> {
  const content = `
    ${entry.type}: ${entry.title}
    
    ${entry.content}
    
    ${entry.summary}
  `.trim();

  const searchableText = `
    ${entry.title} ${entry.content} ${entry.summary}
    ${entry.keywords.join(" ")} ${entry.tags.join(" ")}
  `.trim();

  try {
    await knowledgeBaseService.create({
      tenantId: undefined,
      type: entry.type === "REGULATION" ? "regulation" : "fact",
      category: "regulatory_compliance",
      content,
      summary: entry.summary,
      searchableText,
      keywords: entry.keywords,
      source:
        entry.sourceType === "AUTHORITY" ? "regulatory_authority" : "internal",
      metadata: {
        localKnowledgeId: entry.id,
        authorityId: entry.authorityId,
        regulationId: entry.regulationId,
        type: entry.type,
        category: entry.category,
        confidence: entry.confidence,
      },
      confidence: entry.confidence,
      verified: entry.verified,
      feedbackScore: entry.feedbackScore,
      usageCount: entry.usageCount,
      status: entry.status === "ACTIVE" ? "active" : "archived",
    });
  } catch (error) {
    console.error("Error syncing local knowledge to knowledge base:", error);
  }
}

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const authorityHierarchyService = {
  // Authority Nodes
  createOrUpdateAuthorityNode,
  getNode: (id: string) => store.getNode(id),
  getAllNodes: () => store.getAllNodes(),
  getRootNodes: () => store.getRootNodes(),
  getChildren: (parentId: string) => store.getChildren(parentId),
  getHierarchyPath,
  queryHierarchy,
  getRelatedAuthorities,

  // Local Regulations
  createOrUpdateLocalRegulation,
  getRegulation: (id: string) => store.getRegulation(id),
  getRegulationsByAuthority: (authorityId: string) =>
    store.getRegulationsByAuthority(authorityId),
  searchLocalRegulations,

  // Local Knowledge
  createOrUpdateLocalKnowledge,
  getLocalKnowledge: (id: string) => store.getLocalKnowledge(id),
  searchLocalKnowledge,
};

export default authorityHierarchyService;
