/**
 * Evidence Service
 * Document/file evidence management with lineage tracking
 * Supports validation, integrity verification, and audit trails
 */

import crypto from "crypto";
import { prisma } from "@/lib/services/database/prismaClient";
import {
  Evidence,
  EvidenceType,
  EvidenceCategory,
  ValidationState,
  EvidenceLineage,
  ChangeLogEntry,
  ChangeAction,
  CustodyTransfer,
  EvidenceChain,
  ValidationRule,
  ValidationResult,
  EvidenceSearchQuery,
  EvidenceSearchResult,
  EvidenceStats,
  EvidenceService,
} from "@/types/evidence";

// ============================================================================
// STORAGE (In-memory in dev; DB-backed in production)
// ============================================================================

class EvidenceStore {
  private evidence: Map<string, Evidence> = new Map();
  private chains: Map<string, EvidenceChain> = new Map();
  private rules: Map<string, ValidationRule> = new Map();

  // Evidence operations
  async getEvidence(id: string): Promise<Evidence | undefined> {
    if (process.env.NODE_ENV === "production") {
      const row = await prisma.evidenceItem.findUnique({
        where: { id },
        select: { data: true },
      });
      return (row?.data as Evidence) || undefined;
    }
    return this.evidence.get(id);
  }

  async setEvidence(evidence: Evidence): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      await prisma.evidenceItem.upsert({
        where: { id: evidence.id },
        create: {
          id: evidence.id,
          tenantId: evidence.tenantId || null,
          type: evidence.type,
          category: evidence.category,
          status: evidence.status,
          title: evidence.title,
          data: evidence as any,
        },
        update: {
          tenantId: evidence.tenantId || null,
          type: evidence.type,
          category: evidence.category,
          status: evidence.status,
          title: evidence.title,
          data: evidence as any,
        },
      });
      return;
    }
    this.evidence.set(evidence.id, evidence);
  }

  async deleteEvidence(id: string): Promise<boolean> {
    if (process.env.NODE_ENV === "production") {
      await prisma.evidenceItem
        .delete({ where: { id } })
        .catch(() => undefined);
      return true;
    }
    return this.evidence.delete(id);
  }

  async getAllEvidence(): Promise<Evidence[]> {
    if (process.env.NODE_ENV === "production") {
      const rows = await prisma.evidenceItem.findMany({
        select: { data: true },
      });
      return rows.map((r) => r.data as Evidence);
    }
    return Array.from(this.evidence.values());
  }

  // Chain operations
  async getChain(id: string): Promise<EvidenceChain | undefined> {
    if (process.env.NODE_ENV === "production") {
      const row = await prisma.evidenceChainRecord.findUnique({
        where: { id },
        select: { data: true },
      });
      return (row?.data as EvidenceChain) || undefined;
    }
    return this.chains.get(id);
  }

  async setChain(chain: EvidenceChain): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      await prisma.evidenceChainRecord.upsert({
        where: { id: chain.id },
        create: {
          id: chain.id,
          tenantId: null,
          name: chain.name,
          chainType: chain.chainType,
          status: chain.status,
          data: chain as any,
        },
        update: {
          tenantId: null,
          name: chain.name,
          chainType: chain.chainType,
          status: chain.status,
          data: chain as any,
        },
      });
      return;
    }
    this.chains.set(chain.id, chain);
  }

  async getAllChains(): Promise<EvidenceChain[]> {
    if (process.env.NODE_ENV === "production") {
      const rows = await prisma.evidenceChainRecord.findMany({
        select: { data: true },
      });
      return rows.map((r) => r.data as EvidenceChain);
    }
    return Array.from(this.chains.values());
  }

  // Rule operations
  async getRule(id: string): Promise<ValidationRule | undefined> {
    if (process.env.NODE_ENV === "production") {
      const row = await prisma.evidenceValidationRuleRecord.findUnique({
        where: { id },
        select: { data: true },
      });
      return (row?.data as ValidationRule) || undefined;
    }
    return this.rules.get(id);
  }

  async setRule(rule: ValidationRule): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      await prisma.evidenceValidationRuleRecord.upsert({
        where: { id: rule.id },
        create: {
          id: rule.id,
          tenantId: null,
          name: rule.name,
          isActive: rule.isActive,
          data: rule as any,
        },
        update: {
          tenantId: null,
          name: rule.name,
          isActive: rule.isActive,
          data: rule as any,
        },
      });
      return;
    }
    this.rules.set(rule.id, rule);
  }

  async getAllRules(): Promise<ValidationRule[]> {
    if (process.env.NODE_ENV === "production") {
      const rows = await prisma.evidenceValidationRuleRecord.findMany({
        select: { data: true },
      });
      return rows.map((r) => r.data as ValidationRule);
    }
    return Array.from(this.rules.values());
  }
}

const store = new EvidenceStore();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function generateHash(content: string | Buffer): string {
  const hash = crypto.createHash("sha256");
  hash.update(content);
  return hash.digest("hex");
}

function createChangelogEntry(
  action: ChangeAction,
  userId: string,
  userName?: string,
  field?: string,
  previousValue?: any,
  newValue?: any,
  reason?: string,
): ChangeLogEntry {
  return {
    id: generateId("log"),
    timestamp: new Date().toISOString(),
    userId,
    userName,
    action,
    field,
    previousValue,
    newValue,
    reason,
  };
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

async function createEvidence(
  data: Omit<
    Evidence,
    "id" | "createdAt" | "updatedAt" | "lineage" | "hash"
  > & { content?: string | Buffer },
): Promise<Evidence> {
  const id = generateId("evd");

  // Generate hash
  const hashContent = data.content || data.fileUrl || data.title;
  const hash = generateHash(
    typeof hashContent === "string"
      ? hashContent
      : hashContent
        ? String(hashContent)
        : data.title || "",
  );

  // Initialize lineage
  const lineage: EvidenceLineage = {
    derivedFrom: [],
    version: 1,
    changelog: [
      createChangelogEntry(
        "create",
        data.createdBy || "system",
        undefined,
        undefined,
        undefined,
        undefined,
        "Initial creation",
      ),
    ],
    custodyChain: [],
  };

  const evidence: Evidence = {
    ...data,
    id,
    hash,
    hashAlgorithm: "sha256",
    lineage,
    validationState: data.validationState || "pending",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      ...data.metadata,
      processed: false,
    },
  };

  // Remove content from stored evidence (store separately in real implementation)
  delete (evidence as any).content;

  await store.setEvidence(evidence);
  return evidence;
}

async function getEvidence(id: string): Promise<Evidence | null> {
  const evidence = await store.getEvidence(id);
  if (!evidence) return null;

  // Log view
  evidence.lineage.changelog.push(
    createChangelogEntry(
      "view",
      "system",
      undefined,
      undefined,
      undefined,
      undefined,
    ),
  );
  await store.setEvidence(evidence);

  return evidence;
}

async function updateEvidence(
  id: string,
  updates: Partial<Evidence>,
  reason?: string,
): Promise<Evidence> {
  const existing = await store.getEvidence(id);
  if (!existing) {
    throw new Error(`Evidence ${id} not found`);
  }

  // Track changes
  for (const [key, newValue] of Object.entries(updates)) {
    if (key !== "lineage" && key !== "id" && key !== "createdAt") {
      const previousValue = (existing as any)[key];
      if (JSON.stringify(previousValue) !== JSON.stringify(newValue)) {
        existing.lineage.changelog.push(
          createChangelogEntry(
            "update",
            updates.updatedBy || "system",
            undefined,
            key,
            previousValue,
            newValue,
            reason,
          ),
        );
      }
    }
  }

  // Increment version
  existing.lineage.version++;

  const updated: Evidence = {
    ...existing,
    ...updates,
    id, // Prevent ID change
    createdAt: existing.createdAt, // Preserve
    updatedAt: new Date().toISOString(),
  };

  await store.setEvidence(updated);
  return updated;
}

async function deleteEvidenceById(
  id: string,
  reason?: string,
): Promise<boolean> {
  const evidence = await store.getEvidence(id);
  if (!evidence) return false;

  // Soft delete
  evidence.status = "deleted";
  evidence.lineage.changelog.push(
    createChangelogEntry(
      "delete",
      "system",
      undefined,
      "status",
      "active",
      "deleted",
      reason,
    ),
  );
  evidence.updatedAt = new Date().toISOString();

  await store.setEvidence(evidence);
  return true;
}

async function archiveEvidence(id: string, reason?: string): Promise<boolean> {
  const evidence = await store.getEvidence(id);
  if (!evidence) return false;

  evidence.status = "archived";
  evidence.lineage.changelog.push(
    createChangelogEntry(
      "archive",
      "system",
      undefined,
      "status",
      "active",
      "archived",
      reason,
    ),
  );
  evidence.updatedAt = new Date().toISOString();

  await store.setEvidence(evidence);
  return true;
}

// ============================================================================
// VALIDATION OPERATIONS
// ============================================================================

async function validateEvidence(
  id: string,
  validatedBy: string,
  notes?: string,
): Promise<Evidence> {
  const evidence = await store.getEvidence(id);
  if (!evidence) {
    throw new Error(`Evidence ${id} not found`);
  }

  const prevState = evidence.validationState;
  evidence.validationState = "validated";
  evidence.validatedBy = validatedBy;
  evidence.validatedAt = new Date().toISOString();
  evidence.validationNotes = notes;
  evidence.updatedAt = new Date().toISOString();

  evidence.lineage.changelog.push(
    createChangelogEntry(
      "validate",
      validatedBy,
      undefined,
      "validationState",
      prevState,
      "validated",
      notes,
    ),
  );

  await store.setEvidence(evidence);
  return evidence;
}

async function rejectEvidence(
  id: string,
  rejectedBy: string,
  reason: string,
): Promise<Evidence> {
  const evidence = await store.getEvidence(id);
  if (!evidence) {
    throw new Error(`Evidence ${id} not found`);
  }

  const prevState = evidence.validationState;
  evidence.validationState = "rejected";
  evidence.validatedBy = rejectedBy;
  evidence.validatedAt = new Date().toISOString();
  evidence.validationNotes = reason;
  evidence.updatedAt = new Date().toISOString();

  evidence.lineage.changelog.push(
    createChangelogEntry(
      "reject",
      rejectedBy,
      undefined,
      "validationState",
      prevState,
      "rejected",
      reason,
    ),
  );

  await store.setEvidence(evidence);
  return evidence;
}

async function runValidationRules(id: string): Promise<ValidationResult[]> {
  const evidence = await store.getEvidence(id);
  if (!evidence) {
    throw new Error(`Evidence ${id} not found`);
  }

  const results: ValidationResult[] = [];
  const rules = (await store.getAllRules()).filter(
    (r) =>
      r.isActive &&
      (r.appliesToTypes.length === 0 ||
        r.appliesToTypes.includes(evidence.type)) &&
      (r.appliesToCategories.length === 0 ||
        r.appliesToCategories.includes(evidence.category)),
  );

  for (const rule of rules) {
    const result: ValidationResult = {
      evidenceId: id,
      ruleId: rule.id,
      ruleName: rule.name,
      passed: true,
      severity: rule.severity,
      message: "",
      validatedAt: new Date().toISOString(),
    };

    switch (rule.ruleType) {
      case "required_field":
        const fieldName = rule.parameters?.field;
        if (fieldName && !(evidence as any)[fieldName]) {
          result.passed = false;
          result.message = `Required field "${fieldName}" is missing`;
        }
        break;

      case "size":
        const maxSize = rule.parameters?.maxSize;
        if (maxSize && evidence.fileSize && evidence.fileSize > maxSize) {
          result.passed = false;
          result.message = `File size ${evidence.fileSize} exceeds maximum ${maxSize}`;
        }
        break;

      case "age":
        const maxAgeDays = rule.parameters?.maxAgeDays;
        if (maxAgeDays) {
          const age =
            (Date.now() - new Date(evidence.createdAt).getTime()) /
            (1000 * 60 * 60 * 24);
          if (age > maxAgeDays) {
            result.passed = false;
            result.message = `Evidence age ${Math.round(age)} days exceeds maximum ${maxAgeDays} days`;
          }
        }
        break;

      case "signature":
        if (rule.parameters?.required && !evidence.digitalSignature) {
          result.passed = false;
          result.message = "Digital signature is required but missing";
        }
        break;

      case "hash":
        // Would verify hash in real implementation
        result.passed = !!evidence.hash;
        if (!result.passed) {
          result.message = "Evidence hash is missing";
        }
        break;
    }

    if (result.passed) {
      result.message = `Passed: ${rule.name}`;
    }

    results.push(result);
  }

  return results;
}

// ============================================================================
// INTEGRITY OPERATIONS
// ============================================================================

async function verifyIntegrity(
  id: string,
): Promise<{ valid: boolean; issues: string[] }> {
  const evidence = await store.getEvidence(id);
  if (!evidence) {
    return { valid: false, issues: ["Evidence not found"] };
  }

  const issues: string[] = [];

  // Check hash
  if (!evidence.hash) {
    issues.push("No hash stored for integrity verification");
  }

  // Check digital signature
  if (evidence.digitalSignature) {
    if (evidence.digitalSignature.verificationStatus !== "valid") {
      issues.push("Digital signature verification failed");
    }
  }

  // Check lineage integrity
  if (evidence.lineage.parentEvidenceId) {
    const parent = await store.getEvidence(evidence.lineage.parentEvidenceId);
    if (!parent) {
      issues.push("Parent evidence referenced in lineage not found");
    }
  }

  // Check chain integrity
  const chains = (await store.getAllChains()).filter((c) =>
    c.evidenceIds.includes(id),
  );
  for (const chain of chains) {
    if (chain.status === "broken") {
      issues.push(`Part of broken chain: ${chain.name}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

// ============================================================================
// LINEAGE OPERATIONS
// ============================================================================

async function getLineage(id: string): Promise<Evidence[]> {
  const evidence = await store.getEvidence(id);
  if (!evidence) return [];

  const lineage: Evidence[] = [];
  let currentId = evidence.lineage.parentEvidenceId;

  while (currentId) {
    const parent = await store.getEvidence(currentId);
    if (parent) {
      lineage.push(parent);
      currentId = parent.lineage.parentEvidenceId;
    } else {
      break;
    }
  }

  return lineage.reverse(); // Root first
}

async function getChildren(id: string): Promise<Evidence[]> {
  return (await store.getAllEvidence()).filter(
    (e) => e.lineage.parentEvidenceId === id,
  );
}

async function createDerived(
  parentId: string,
  derivation: { type: string; notes?: string },
  newEvidence: Partial<Evidence>,
): Promise<Evidence> {
  const parent = await store.getEvidence(parentId);
  if (!parent) {
    throw new Error(`Parent evidence ${parentId} not found`);
  }

  const created = await createEvidence({
    type: newEvidence.type || parent.type,
    category: newEvidence.category || parent.category,
    title: newEvidence.title || `Derived from: ${parent.title}`,
    description: newEvidence.description,
    validationState: "pending",
    status: newEvidence.status || "active",
    hashAlgorithm: newEvidence.hashAlgorithm || "sha256",
    relatedEntities: [
      ...(newEvidence.relatedEntities || []),
      {
        entityId: parentId,
        entityType: "evidence",
        relationship: "generated_from",
        addedAt: new Date().toISOString(),
      },
    ],
    tags: [...(parent.tags || []), "derived"],
    metadata: {
      source: "derivation",
      capturedAt: new Date().toISOString(),
      capturedMethod: "generated",
      processed: false,
    },
    ...newEvidence,
  });

  // Update lineage
  created.lineage.parentEvidenceId = parentId;
  created.lineage.rootEvidenceId = parent.lineage.rootEvidenceId || parentId;
  created.lineage.derivedFrom = [...parent.lineage.derivedFrom, parentId];
  created.lineage.derivationType = derivation.type as any;
  created.lineage.derivationNotes = derivation.notes;

  await store.setEvidence(created);
  return created;
}

// ============================================================================
// CHAIN OPERATIONS
// ============================================================================

async function createChain(
  name: string,
  evidenceIds: string[],
  chainType: EvidenceChain["chainType"],
): Promise<EvidenceChain> {
  const items = await Promise.all(
    evidenceIds.map((id) => store.getEvidence(id)),
  );
  for (let i = 0; i < items.length; i++) {
    if (!items[i]) throw new Error(`Evidence ${evidenceIds[i]} not found`);
  }

  // Generate combined hash
  const chainHash = generateHash(items.map((e) => (e ? e.hash : "")).join(""));

  const chain: EvidenceChain = {
    id: generateId("chain"),
    name,
    evidenceIds,
    chainType,
    chainHash,
    isValid: true,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await store.setChain(chain);
  return chain;
}

async function addToChain(
  chainId: string,
  evidenceId: string,
): Promise<EvidenceChain> {
  const chain = await store.getChain(chainId);
  if (!chain) {
    throw new Error(`Chain ${chainId} not found`);
  }

  if (chain.status === "sealed") {
    throw new Error("Cannot add to sealed chain");
  }

  const evidence = await store.getEvidence(evidenceId);
  if (!evidence) {
    throw new Error(`Evidence ${evidenceId} not found`);
  }

  chain.evidenceIds.push(evidenceId);

  // Regenerate chain hash
  const items = await Promise.all(
    chain.evidenceIds.map((id) => store.getEvidence(id)),
  );
  chain.chainHash = generateHash(items.map((e) => e?.hash || "").join(""));
  chain.updatedAt = new Date().toISOString();

  await store.setChain(chain);
  return chain;
}

async function sealChain(
  chainId: string,
  sealedBy: string,
): Promise<EvidenceChain> {
  const chain = await store.getChain(chainId);
  if (!chain) {
    throw new Error(`Chain ${chainId} not found`);
  }

  chain.status = "sealed";
  chain.sealedAt = new Date().toISOString();
  chain.sealedBy = sealedBy;
  chain.updatedAt = new Date().toISOString();

  await store.setChain(chain);
  return chain;
}

async function verifyChain(
  chainId: string,
): Promise<{ valid: boolean; issues: string[] }> {
  const chain = await store.getChain(chainId);
  if (!chain) {
    return { valid: false, issues: ["Chain not found"] };
  }

  const issues: string[] = [];

  // Verify all evidence exists and is valid
  const items = await Promise.all(
    chain.evidenceIds.map((id) => store.getEvidence(id)),
  );
  for (let i = 0; i < items.length; i++) {
    const ev = items[i];
    const evidenceId = chain.evidenceIds[i];
    if (!ev) {
      issues.push(`Evidence ${evidenceId} not found in chain`);
      continue;
    }
    if (ev.status === "deleted") {
      issues.push(`Evidence ${evidenceId} has been deleted`);
    }
  }

  // Verify chain hash
  const currentHash = generateHash(items.map((e) => e?.hash || "").join(""));

  if (currentHash !== chain.chainHash) {
    issues.push("Chain hash mismatch - evidence may have been modified");
  }

  const valid = issues.length === 0;

  if (!valid && chain.status !== "broken") {
    chain.status = "broken";
    chain.isValid = false;
    chain.updatedAt = new Date().toISOString();
    await store.setChain(chain);
  }

  return { valid, issues };
}

// ============================================================================
// CUSTODY OPERATIONS
// ============================================================================

async function transferCustody(
  evidenceId: string,
  toUserId: string,
  reason?: string,
): Promise<Evidence> {
  const evidence = await store.getEvidence(evidenceId);
  if (!evidence) {
    throw new Error(`Evidence ${evidenceId} not found`);
  }

  const transfer: CustodyTransfer = {
    id: generateId("transfer"),
    fromUserId: evidence.updatedBy,
    toUserId,
    transferredAt: new Date().toISOString(),
    reason,
    acknowledged: false,
  };

  evidence.lineage.custodyChain.push(transfer);
  evidence.lineage.changelog.push(
    createChangelogEntry(
      "transfer",
      "system",
      undefined,
      "custody",
      evidence.updatedBy,
      toUserId,
      reason,
    ),
  );
  evidence.updatedAt = new Date().toISOString();

  await store.setEvidence(evidence);
  return evidence;
}

async function acknowledgeCustody(
  evidenceId: string,
  transferId: string,
): Promise<Evidence> {
  const evidence = await store.getEvidence(evidenceId);
  if (!evidence) {
    throw new Error(`Evidence ${evidenceId} not found`);
  }

  const transfer = evidence.lineage.custodyChain.find(
    (t) => t.id === transferId,
  );
  if (!transfer) {
    throw new Error(`Transfer ${transferId} not found`);
  }

  transfer.acknowledged = true;
  transfer.acknowledgedAt = new Date().toISOString();
  evidence.updatedAt = new Date().toISOString();

  await store.setEvidence(evidence);
  return evidence;
}

// ============================================================================
// SEARCH OPERATIONS
// ============================================================================

async function searchEvidence(
  query: EvidenceSearchQuery,
): Promise<EvidenceSearchResult> {
  let results = (await store.getAllEvidence()).filter(
    (e) => e.status !== "deleted",
  );

  // Apply filters
  if (query.tenantId) {
    results = results.filter((e) => e.tenantId === query.tenantId);
  }
  if (query.types?.length) {
    results = results.filter((e) => query.types!.includes(e.type));
  }
  if (query.categories?.length) {
    results = results.filter((e) => query.categories!.includes(e.category));
  }
  if (query.validationStates?.length) {
    results = results.filter((e) =>
      query.validationStates!.includes(e.validationState),
    );
  }
  if (query.tags?.length) {
    results = results.filter((e) =>
      query.tags!.some((t) => e.tags.includes(t)),
    );
  }
  if (query.createdAfter) {
    const after = new Date(query.createdAfter).getTime();
    results = results.filter((e) => new Date(e.createdAt).getTime() >= after);
  }
  if (query.createdBefore) {
    const before = new Date(query.createdBefore).getTime();
    results = results.filter((e) => new Date(e.createdAt).getTime() <= before);
  }
  if (query.relatedEntityId) {
    results = results.filter((e) =>
      e.relatedEntities.some((r) => r.entityId === query.relatedEntityId),
    );
  }
  if (query.hasParent !== undefined) {
    results = results.filter((e) =>
      query.hasParent
        ? !!e.lineage.parentEvidenceId
        : !e.lineage.parentEvidenceId,
    );
  }
  if (query.parentId) {
    results = results.filter(
      (e) => e.lineage.parentEvidenceId === query.parentId,
    );
  }

  // Text search
  if (query.query) {
    const searchLower = query.query.toLowerCase();
    results = results.filter(
      (e) =>
        e.title.toLowerCase().includes(searchLower) ||
        e.description?.toLowerCase().includes(searchLower) ||
        e.tags.some((t) => t.toLowerCase().includes(searchLower)),
    );
  }

  // Sort
  const sortField = query.sortBy || "createdAt";
  const sortDir = query.sortOrder === "asc" ? 1 : -1;
  results.sort((a, b) => {
    const aVal = (a as any)[sortField];
    const bVal = (b as any)[sortField];
    if (aVal < bVal) return -sortDir;
    if (aVal > bVal) return sortDir;
    return 0;
  });

  const totalCount = results.length;

  // Pagination
  if (query.offset) {
    results = results.slice(query.offset);
  }
  if (query.limit) {
    results = results.slice(0, query.limit);
  }

  return {
    evidence: results,
    totalCount,
    hasMore:
      query.offset !== undefined && query.limit !== undefined
        ? query.offset + query.limit < totalCount
        : false,
  };
}

// ============================================================================
// STATISTICS
// ============================================================================

async function getStats(tenantId?: string): Promise<EvidenceStats> {
  let evidence = (await store.getAllEvidence()).filter(
    (e) => e.status !== "deleted",
  );

  if (tenantId) {
    evidence = evidence.filter((e) => e.tenantId === tenantId);
  }

  const byType: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const byValidationState: Record<string, number> = {};
  let totalSize = 0;
  let withLineage = 0;
  let totalChainLength = 0;

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  let createdThisWeek = 0;
  let updatedThisWeek = 0;
  let viewedThisWeek = 0;
  let validatedThisMonth = 0;
  let rejectedThisMonth = 0;

  for (const e of evidence) {
    byType[e.type] = (byType[e.type] || 0) + 1;
    byCategory[e.category] = (byCategory[e.category] || 0) + 1;
    byValidationState[e.validationState] =
      (byValidationState[e.validationState] || 0) + 1;

    totalSize += e.fileSize || 0;

    if (e.lineage.parentEvidenceId) {
      withLineage++;
      totalChainLength += e.lineage.derivedFrom.length + 1;
    }

    const createdAt = new Date(e.createdAt).getTime();
    const updatedAt = new Date(e.updatedAt).getTime();

    if (createdAt >= weekAgo) createdThisWeek++;
    if (updatedAt >= weekAgo) updatedThisWeek++;

    // Count views this week
    const viewsThisWeek = e.lineage.changelog.filter(
      (c) => c.action === "view" && new Date(c.timestamp).getTime() >= weekAgo,
    ).length;
    viewedThisWeek += viewsThisWeek;

    // Count validations/rejections this month
    if (e.validatedAt) {
      const validatedAt = new Date(e.validatedAt).getTime();
      if (validatedAt >= monthAgo) {
        if (e.validationState === "validated") validatedThisMonth++;
        if (e.validationState === "rejected") rejectedThisMonth++;
      }
    }
  }

  return {
    totalCount: evidence.length,
    byType: byType as Record<EvidenceType, number>,
    byCategory: byCategory as Record<EvidenceCategory, number>,
    byValidationState: byValidationState as Record<ValidationState, number>,
    totalSizeBytes: totalSize,
    averageSizeBytes:
      evidence.length > 0 ? Math.round(totalSize / evidence.length) : 0,
    withLineage,
    averageChainLength: withLineage > 0 ? totalChainLength / withLineage : 0,
    pendingValidation: byValidationState["pending"] || 0,
    validatedThisMonth,
    rejectedThisMonth,
    createdThisWeek,
    updatedThisWeek,
    viewedThisWeek,
    calculatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// CHANGELOG OPERATIONS
// ============================================================================

async function getChangelog(evidenceId: string): Promise<ChangeLogEntry[]> {
  const evidence = await store.getEvidence(evidenceId);
  if (!evidence) return [];
  return evidence.lineage.changelog;
}

async function addChangelogEntry(
  evidenceId: string,
  entry: Omit<ChangeLogEntry, "id" | "timestamp">,
): Promise<ChangeLogEntry> {
  const evidence = await store.getEvidence(evidenceId);
  if (!evidence) {
    throw new Error(`Evidence ${evidenceId} not found`);
  }

  const newEntry: ChangeLogEntry = {
    ...entry,
    id: generateId("log"),
    timestamp: new Date().toISOString(),
  };

  evidence.lineage.changelog.push(newEntry);
  evidence.updatedAt = new Date().toISOString();
  await store.setEvidence(evidence);

  return newEntry;
}

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const evidenceService: EvidenceService = {
  // CRUD
  create: createEvidence,
  get: getEvidence,
  update: updateEvidence,
  delete: deleteEvidenceById,
  archive: archiveEvidence,

  // Validation
  validate: validateEvidence,
  reject: rejectEvidence,
  runValidationRules,

  // Integrity
  verifyIntegrity,
  generateHash,

  // Lineage
  getLineage,
  getChildren,
  createDerived,

  // Chain
  createChain,
  addToChain,
  sealChain,
  verifyChain,

  // Custody
  transferCustody,
  acknowledgeCustody,

  // Search
  search: searchEvidence,

  // Statistics
  getStats,

  // Changelog
  getChangelog,
  addChangelogEntry,
};

export default evidenceService;
