/**
 * Entity Graph Service
 * Cross-entity relationship management with graph traversal
 * Supports impact analysis and relationship tracking
 */

import {
  CanonicalEntity,
  EntityType,
  EntityRelationship,
  RelationshipType,
  GraphQuery,
  GraphQueryResult,
  GraphPath,
  ImpactAnalysis,
  ImpactedEntity,
  GraphOperationResult,
  EntityMergeRequest,
  GraphAnalytics,
  GraphCluster,
  EntityGraphService,
} from "@/types/entityGraph";

// ============================================================================
// IN-MEMORY STORAGE (Will be replaced with graph DB)
// ============================================================================

class GraphStore {
  private entities: Map<string, CanonicalEntity> = new Map();
  private relationships: Map<string, EntityRelationship> = new Map();
  private entityRelationships: Map<string, Set<string>> = new Map(); // entityId -> relationshipIds

  // Entity operations
  getEntity(id: string): CanonicalEntity | undefined {
    return this.entities.get(id);
  }

  setEntity(entity: CanonicalEntity): void {
    this.entities.set(entity.id, entity);
  }

  deleteEntity(id: string): boolean {
    // Also clean up relationships
    const relIds = this.entityRelationships.get(id);
    if (relIds) {
      for (const relId of relIds) {
        this.relationships.delete(relId);
      }
      this.entityRelationships.delete(id);
    }
    return this.entities.delete(id);
  }

  getAllEntities(): CanonicalEntity[] {
    return Array.from(this.entities.values());
  }

  getEntitiesByType(type: EntityType): CanonicalEntity[] {
    return this.getAllEntities().filter((e) => e.type === type);
  }

  getEntitiesByTenant(tenantId: string): CanonicalEntity[] {
    return this.getAllEntities().filter((e) => e.tenantId === tenantId);
  }

  // Relationship operations
  getRelationship(id: string): EntityRelationship | undefined {
    return this.relationships.get(id);
  }

  setRelationship(rel: EntityRelationship): void {
    this.relationships.set(rel.id, rel);

    // Index by entity
    if (!this.entityRelationships.has(rel.sourceEntityId)) {
      this.entityRelationships.set(rel.sourceEntityId, new Set());
    }
    this.entityRelationships.get(rel.sourceEntityId)!.add(rel.id);

    if (!this.entityRelationships.has(rel.targetEntityId)) {
      this.entityRelationships.set(rel.targetEntityId, new Set());
    }
    this.entityRelationships.get(rel.targetEntityId)!.add(rel.id);
  }

  deleteRelationship(id: string): boolean {
    const rel = this.relationships.get(id);
    if (rel) {
      this.entityRelationships.get(rel.sourceEntityId)?.delete(id);
      this.entityRelationships.get(rel.targetEntityId)?.delete(id);
    }
    return this.relationships.delete(id);
  }

  getAllRelationships(): EntityRelationship[] {
    return Array.from(this.relationships.values());
  }

  getEntityRelationships(entityId: string): EntityRelationship[] {
    const relIds = this.entityRelationships.get(entityId) || new Set();
    return Array.from(relIds)
      .map((id) => this.relationships.get(id))
      .filter((r): r is EntityRelationship => r !== undefined);
  }

  getOutgoingRelationships(entityId: string): EntityRelationship[] {
    return this.getEntityRelationships(entityId).filter(
      (r) => r.sourceEntityId === entityId,
    );
  }

  getIncomingRelationships(entityId: string): EntityRelationship[] {
    return this.getEntityRelationships(entityId).filter(
      (r) => r.targetEntityId === entityId,
    );
  }
}

const store = new GraphStore();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================================================
// ENTITY OPERATIONS
// ============================================================================

async function createEntity(
  data: Omit<CanonicalEntity, "id" | "createdAt" | "updatedAt" | "version">,
): Promise<CanonicalEntity> {
  const entity: CanonicalEntity = {
    ...data,
    id: generateId("ent"),
    relationships: [],
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.setEntity(entity);
  return entity;
}

async function getEntity(id: string): Promise<CanonicalEntity | null> {
  const entity = store.getEntity(id);
  if (!entity) return null;

  // Populate relationships
  entity.relationships = store.getEntityRelationships(id);
  entity.relatedEntitiesCount = entity.relationships.length;

  return entity;
}

async function updateEntity(
  id: string,
  updates: Partial<CanonicalEntity>,
): Promise<CanonicalEntity> {
  const existing = store.getEntity(id);
  if (!existing) {
    throw new Error(`Entity ${id} not found`);
  }

  const updated: CanonicalEntity = {
    ...existing,
    ...updates,
    id, // Prevent ID change
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  };

  store.setEntity(updated);
  return updated;
}

async function deleteEntity(
  id: string,
  cascade: boolean = false,
): Promise<GraphOperationResult> {
  const entity = store.getEntity(id);
  if (!entity) {
    return {
      success: false,
      operation: "delete",
      entityId: id,
      affectedEntities: [],
      error: "Entity not found",
    };
  }

  const affectedEntities: string[] = [id];

  if (cascade) {
    // Find and delete related entities
    const related = store
      .getOutgoingRelationships(id)
      .filter((r) => r.type === "owns" || r.type === "contains")
      .map((r) => r.targetEntityId);

    for (const relatedId of related) {
      await deleteEntity(relatedId, true);
      affectedEntities.push(relatedId);
    }
  }

  store.deleteEntity(id);

  return {
    success: true,
    operation: "delete",
    entityId: id,
    affectedEntities,
  };
}

// ============================================================================
// RELATIONSHIP OPERATIONS
// ============================================================================

async function createRelationship(
  data: Omit<EntityRelationship, "id" | "createdAt">,
): Promise<EntityRelationship> {
  const relationship: EntityRelationship = {
    ...data,
    id: generateId("rel"),
    createdAt: new Date().toISOString(),
  };

  store.setRelationship(relationship);
  return relationship;
}

async function getRelationship(id: string): Promise<EntityRelationship | null> {
  return store.getRelationship(id) || null;
}

async function updateRelationship(
  id: string,
  updates: Partial<EntityRelationship>,
): Promise<EntityRelationship> {
  const existing = store.getRelationship(id);
  if (!existing) {
    throw new Error(`Relationship ${id} not found`);
  }

  const updated: EntityRelationship = {
    ...existing,
    ...updates,
    id, // Prevent ID change
  };

  store.setRelationship(updated);
  return updated;
}

async function deleteRelationship(id: string): Promise<boolean> {
  return store.deleteRelationship(id);
}

// ============================================================================
// GRAPH QUERIES
// ============================================================================

async function query(queryParams: GraphQuery): Promise<GraphQueryResult> {
  let entities: CanonicalEntity[] = [];
  let relationships: EntityRelationship[] = [];

  if (queryParams.startEntityId) {
    // Start from specific entity
    const visited = new Set<string>();
    const toVisit: { entityId: string; depth: number }[] = [
      { entityId: queryParams.startEntityId, depth: 0 },
    ];

    while (toVisit.length > 0) {
      const { entityId, depth } = toVisit.shift()!;

      if (visited.has(entityId)) continue;
      if (queryParams.maxDepth !== undefined && depth > queryParams.maxDepth)
        continue;

      visited.add(entityId);

      const entity = store.getEntity(entityId);
      if (!entity) continue;

      // Check filters
      if (
        queryParams.targetEntityTypes?.length &&
        !queryParams.targetEntityTypes.includes(entity.type)
      ) {
        continue;
      }
      if (entity.status !== "active" && !queryParams.includeInactive) {
        continue;
      }

      entities.push(entity);

      // Get relationships
      let rels = store.getEntityRelationships(entityId);

      if (queryParams.direction === "outgoing") {
        rels = rels.filter((r) => r.sourceEntityId === entityId);
      } else if (queryParams.direction === "incoming") {
        rels = rels.filter((r) => r.targetEntityId === entityId);
      }

      if (queryParams.relationshipTypes?.length) {
        rels = rels.filter((r) =>
          queryParams.relationshipTypes!.includes(r.type),
        );
      }

      if (queryParams.minStrength !== undefined) {
        rels = rels.filter((r) => r.strength >= queryParams.minStrength!);
      }

      if (!queryParams.includeInactive) {
        rels = rels.filter((r) => r.isActive);
      }

      relationships.push(...rels);

      // Queue related entities
      for (const rel of rels) {
        const nextEntityId =
          rel.sourceEntityId === entityId
            ? rel.targetEntityId
            : rel.sourceEntityId;
        if (!visited.has(nextEntityId)) {
          toVisit.push({ entityId: nextEntityId, depth: depth + 1 });
        }
      }
    }
  } else {
    // Query all entities
    entities = store.getAllEntities();

    if (queryParams.startEntityType) {
      entities = entities.filter((e) => e.type === queryParams.startEntityType);
    }
    if (queryParams.targetEntityTypes?.length) {
      entities = entities.filter((e) =>
        queryParams.targetEntityTypes!.includes(e.type),
      );
    }
    if (!queryParams.includeInactive) {
      entities = entities.filter((e) => e.status === "active");
    }

    // Get all relationships for these entities
    for (const entity of entities) {
      relationships.push(...store.getEntityRelationships(entity.id));
    }
  }

  // Apply pagination
  const totalCount = entities.length;
  if (queryParams.offset) {
    entities = entities.slice(queryParams.offset);
  }
  if (queryParams.limit) {
    entities = entities.slice(0, queryParams.limit);
  }

  // Deduplicate relationships
  relationships = Array.from(
    new Map(relationships.map((r) => [r.id, r])).values(),
  );

  return {
    entities,
    relationships,
    totalCount,
  };
}

async function findRelated(
  entityId: string,
  options?: Partial<GraphQuery>,
): Promise<CanonicalEntity[]> {
  const result = await query({
    startEntityId: entityId,
    maxDepth: options?.maxDepth ?? 1,
    ...options,
  });

  // Exclude the starting entity
  return result.entities.filter((e) => e.id !== entityId);
}

async function findPath(
  fromEntityId: string,
  toEntityId: string,
  maxDepth: number = 5,
): Promise<GraphPath | null> {
  // BFS to find shortest path
  const visited = new Set<string>();
  const queue: {
    entityId: string;
    path: CanonicalEntity[];
    edges: EntityRelationship[];
  }[] = [];

  const fromEntity = store.getEntity(fromEntityId);
  if (!fromEntity) return null;

  queue.push({ entityId: fromEntityId, path: [fromEntity], edges: [] });

  while (queue.length > 0) {
    const { entityId, path, edges } = queue.shift()!;

    if (entityId === toEntityId) {
      return {
        nodes: path,
        edges,
        totalWeight: edges.reduce((sum, e) => sum + (e.weight || 1), 0),
        depth: path.length - 1,
      };
    }

    if (path.length > maxDepth) continue;
    if (visited.has(entityId)) continue;

    visited.add(entityId);

    const rels = store.getEntityRelationships(entityId);
    for (const rel of rels) {
      const nextEntityId =
        rel.sourceEntityId === entityId
          ? rel.targetEntityId
          : rel.sourceEntityId;
      if (!visited.has(nextEntityId)) {
        const nextEntity = store.getEntity(nextEntityId);
        if (nextEntity) {
          queue.push({
            entityId: nextEntityId,
            path: [...path, nextEntity],
            edges: [...edges, rel],
          });
        }
      }
    }
  }

  return null;
}

// ============================================================================
// IMPACT ANALYSIS
// ============================================================================

async function analyzeImpact(
  entityId: string,
  changeType: "delete" | "update" | "disable",
): Promise<ImpactAnalysis> {
  const sourceEntity = store.getEntity(entityId);
  if (!sourceEntity) {
    throw new Error(`Entity ${entityId} not found`);
  }

  const impactedEntities: ImpactedEntity[] = [];
  const visited = new Set<string>();

  // BFS to find all impacted entities
  const queue: {
    entityId: string;
    depth: number;
    pathRels: EntityRelationship[];
  }[] = [];

  // Start with direct relationships
  const directRels = store.getOutgoingRelationships(entityId);
  for (const rel of directRels) {
    if (
      rel.type === "impacts" ||
      rel.type === "owns" ||
      rel.type === "contains" ||
      rel.type === "depends_on"
    ) {
      queue.push({ entityId: rel.targetEntityId, depth: 1, pathRels: [rel] });
    }
  }

  while (queue.length > 0) {
    const { entityId: currentId, depth, pathRels } = queue.shift()!;

    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const entity = store.getEntity(currentId);
    if (!entity || entity.status !== "active") continue;

    // Calculate impact score based on relationship strength and depth
    const avgStrength =
      pathRels.reduce((sum, r) => sum + r.strength, 0) / pathRels.length;
    const impactScore = Math.round(
      avgStrength * 100 * Math.pow(0.8, depth - 1),
    );

    impactedEntities.push({
      entity,
      impactType: depth === 1 ? "direct" : "indirect",
      impactScore,
      pathToSource: pathRels,
      estimatedEffect:
        depth === 1
          ? `Directly ${changeType === "delete" ? "affected" : "modified"} by ${changeType}`
          : `Indirectly affected through ${depth - 1} intermediate entit${depth - 1 > 1 ? "ies" : "y"}`,
      mitigationSuggestions:
        impactScore > 70
          ? [
              `Review ${entity.type} "${entity.name}" before proceeding`,
              `Consider updating dependent configurations`,
            ]
          : [],
    });

    // Continue traversal for high-impact relationships
    if (depth < 5) {
      const nextRels = store
        .getOutgoingRelationships(currentId)
        .filter(
          (r) =>
            r.type === "impacts" ||
            r.type === "owns" ||
            r.type === "depends_on",
        );

      for (const rel of nextRels) {
        if (!visited.has(rel.targetEntityId)) {
          queue.push({
            entityId: rel.targetEntityId,
            depth: depth + 1,
            pathRels: [...pathRels, rel],
          });
        }
      }
    }
  }

  // Calculate overall risk
  const totalImpactScore =
    impactedEntities.reduce((sum, e) => sum + e.impactScore, 0) /
    Math.max(impactedEntities.length, 1);
  const riskLevel: "low" | "medium" | "high" | "critical" =
    totalImpactScore >= 80
      ? "critical"
      : totalImpactScore >= 60
        ? "high"
        : totalImpactScore >= 40
          ? "medium"
          : "low";

  const recommendations: string[] = [];
  if (impactedEntities.length > 10) {
    recommendations.push("Consider breaking this operation into smaller steps");
  }
  if (riskLevel === "critical" || riskLevel === "high") {
    recommendations.push("Review all high-impact entities before proceeding");
    recommendations.push("Notify stakeholders of the planned change");
  }
  if (changeType === "delete") {
    recommendations.push("Ensure data backup is available before deletion");
  }

  return {
    sourceEntity,
    impactedEntities: impactedEntities.sort(
      (a, b) => b.impactScore - a.impactScore,
    ),
    totalImpactScore,
    riskLevel,
    recommendations,
    analysisTimestamp: new Date().toISOString(),
  };
}

async function getImpactedBy(entityId: string): Promise<ImpactedEntity[]> {
  const analysis = await analyzeImpact(entityId, "update");
  return analysis.impactedEntities;
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

async function mergeEntities(
  request: EntityMergeRequest,
): Promise<GraphOperationResult> {
  const source = store.getEntity(request.sourceEntityId);
  const target = store.getEntity(request.targetEntityId);

  if (!source || !target) {
    return {
      success: false,
      operation: "merge",
      affectedEntities: [],
      error: "Source or target entity not found",
    };
  }

  if (source.type !== target.type) {
    return {
      success: false,
      operation: "merge",
      affectedEntities: [],
      error: "Cannot merge entities of different types",
    };
  }

  const affectedEntities: string[] = [source.id, target.id];

  // Merge based on strategy
  let mergedAttributes: Record<string, any>;

  switch (request.strategy) {
    case "keep_source":
      mergedAttributes = { ...target.attributes, ...source.attributes };
      break;
    case "keep_target":
      mergedAttributes = { ...source.attributes, ...target.attributes };
      break;
    case "merge_attributes":
      mergedAttributes = { ...source.attributes };
      for (const [key, value] of Object.entries(target.attributes)) {
        if (request.attributeMergeRules?.[key] === "target") {
          mergedAttributes[key] = value;
        } else if (request.attributeMergeRules?.[key] === "combine") {
          mergedAttributes[key] = Array.isArray(mergedAttributes[key])
            ? [...mergedAttributes[key], value]
            : [mergedAttributes[key], value];
        }
      }
      break;
    default:
      mergedAttributes = source.attributes;
  }

  // Update target with merged data
  await updateEntity(target.id, {
    attributes: mergedAttributes,
    tags: Array.from(new Set([...source.tags, ...target.tags])),
    externalIds: { ...source.externalIds, ...target.externalIds },
  });

  // Redirect all relationships from source to target
  const sourceRels = store.getEntityRelationships(source.id);
  for (const rel of sourceRels) {
    if (rel.sourceEntityId === source.id) {
      await updateRelationship(rel.id, { sourceEntityId: target.id });
    }
    if (rel.targetEntityId === source.id) {
      await updateRelationship(rel.id, { targetEntityId: target.id });
    }
    affectedEntities.push(rel.sourceEntityId, rel.targetEntityId);
  }

  // Archive source
  await updateEntity(source.id, { status: "archived" });

  return {
    success: true,
    operation: "merge",
    entityId: target.id,
    affectedEntities: Array.from(new Set(affectedEntities)),
  };
}

async function bulkCreateRelationships(
  relationships: Omit<EntityRelationship, "id" | "createdAt">[],
): Promise<EntityRelationship[]> {
  const created: EntityRelationship[] = [];
  for (const rel of relationships) {
    created.push(await createRelationship(rel));
  }
  return created;
}

// ============================================================================
// ANALYTICS
// ============================================================================

async function getAnalytics(tenantId?: string): Promise<GraphAnalytics> {
  let entities = store.getAllEntities();
  let relationships = store.getAllRelationships();

  if (tenantId) {
    entities = entities.filter((e) => e.tenantId === tenantId);
    const entityIds = new Set(entities.map((e) => e.id));
    relationships = relationships.filter(
      (r) => entityIds.has(r.sourceEntityId) || entityIds.has(r.targetEntityId),
    );
  }

  // Count by type
  const entityCounts: Record<string, number> = {};
  for (const entity of entities) {
    entityCounts[entity.type] = (entityCounts[entity.type] || 0) + 1;
  }

  const relationshipCounts: Record<string, number> = {};
  for (const rel of relationships) {
    relationshipCounts[rel.type] = (relationshipCounts[rel.type] || 0) + 1;
  }

  // Calculate metrics
  const totalNodes = entities.length;
  const totalEdges = relationships.length;
  const averageDegree = totalNodes > 0 ? (totalEdges * 2) / totalNodes : 0;
  const maxPossibleEdges = (totalNodes * (totalNodes - 1)) / 2;
  const density = maxPossibleEdges > 0 ? totalEdges / maxPossibleEdges : 0;

  // Top by connections
  const connectionCounts: Record<string, number> = {};
  for (const rel of relationships) {
    connectionCounts[rel.sourceEntityId] =
      (connectionCounts[rel.sourceEntityId] || 0) + 1;
    connectionCounts[rel.targetEntityId] =
      (connectionCounts[rel.targetEntityId] || 0) + 1;
  }

  const topByConnections = Object.entries(connectionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([entityId, connections]) => ({ entityId, connections }));

  // Orphaned entities (no relationships)
  const entitiesWithRelationships = new Set([
    ...relationships.map((r) => r.sourceEntityId),
    ...relationships.map((r) => r.targetEntityId),
  ]);
  const orphanedEntities = entities.filter(
    (e) => !entitiesWithRelationships.has(e.id),
  ).length;

  // Broken relationships
  const activeEntityIds = new Set(
    entities.filter((e) => e.status === "active").map((e) => e.id),
  );
  const brokenRelationships = relationships.filter(
    (r) =>
      !activeEntityIds.has(r.sourceEntityId) ||
      !activeEntityIds.has(r.targetEntityId),
  ).length;

  return {
    entityCounts: entityCounts as Record<EntityType, number>,
    relationshipCounts: relationshipCounts as Record<RelationshipType, number>,
    totalNodes,
    totalEdges,
    averageDegree,
    density,
    topByConnections,
    topByImpact: [], // Would require full impact analysis
    orphanedEntities,
    brokenRelationships,
    analyzedAt: new Date().toISOString(),
  };
}

async function detectClusters(minSize: number = 3): Promise<GraphCluster[]> {
  // Simple clustering based on connected components
  const entities = store.getAllEntities().filter((e) => e.status === "active");
  const visited = new Set<string>();
  const clusters: GraphCluster[] = [];

  for (const entity of entities) {
    if (visited.has(entity.id)) continue;

    const cluster: string[] = [];
    const queue = [entity.id];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;

      visited.add(currentId);
      cluster.push(currentId);

      const rels = store.getEntityRelationships(currentId);
      for (const rel of rels) {
        const nextId =
          rel.sourceEntityId === currentId
            ? rel.targetEntityId
            : rel.sourceEntityId;
        if (!visited.has(nextId)) {
          queue.push(nextId);
        }
      }
    }

    if (cluster.length >= minSize) {
      // Determine primary type
      const typeCounts: Record<string, number> = {};
      for (const id of cluster) {
        const e = store.getEntity(id);
        if (e) {
          typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
        }
      }
      const primaryType = Object.entries(typeCounts).sort(
        (a, b) => b[1] - a[1],
      )[0][0] as EntityType;

      clusters.push({
        id: generateId("cluster"),
        entities: cluster,
        primaryType,
        cohesion:
          cluster.length > 1
            ? store
                .getAllRelationships()
                .filter(
                  (r) =>
                    cluster.includes(r.sourceEntityId) &&
                    cluster.includes(r.targetEntityId),
                ).length /
              ((cluster.length * (cluster.length - 1)) / 2)
            : 1,
      });
    }
  }

  return clusters;
}

// ============================================================================
// SEARCH
// ============================================================================

async function searchEntities(
  searchQuery: string,
  filters?: { types?: EntityType[]; tenantId?: string },
): Promise<CanonicalEntity[]> {
  let entities = store.getAllEntities().filter((e) => e.status === "active");

  if (filters?.types?.length) {
    entities = entities.filter((e) => filters.types!.includes(e.type));
  }
  if (filters?.tenantId) {
    entities = entities.filter((e) => e.tenantId === filters.tenantId);
  }

  const queryLower = searchQuery.toLowerCase();

  return entities
    .filter(
      (e) =>
        e.name.toLowerCase().includes(queryLower) ||
        e.code?.toLowerCase().includes(queryLower) ||
        e.tags.some((t) => t.toLowerCase().includes(queryLower)) ||
        Object.values(e.attributes).some((v) =>
          String(v).toLowerCase().includes(queryLower),
        ),
    )
    .slice(0, 50); // Limit results
}

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const entityGraphService: EntityGraphService = {
  // Entity CRUD
  createEntity,
  getEntity,
  updateEntity,
  deleteEntity,

  // Relationship CRUD
  createRelationship,
  getRelationship,
  updateRelationship,
  deleteRelationship,

  // Graph queries
  query,
  findRelated,
  findPath,

  // Impact analysis
  analyzeImpact,
  getImpactedBy,

  // Bulk operations
  mergeEntities,
  bulkCreateRelationships,

  // Analytics
  getAnalytics,
  detectClusters,

  // Search
  searchEntities,
};

export default entityGraphService;
