/**
 * 🌳 PERMISSION INHERITANCE VISUALIZER
 *
 * Mind-blowing visualization:
 * - Permission inheritance tree
 * - Module → Feature → Tab hierarchy
 * - Visual inheritance flow
 * - Conflict detection
 * - Override visualization
 */

import type {
  User,
  HierarchicalPermission,
  ModuleId,
  FeatureId,
  TabId,
} from "@/types/user";

// ============================================================================
// TYPES
// ============================================================================

export interface InheritanceNode {
  id: string;
  type: "MODULE" | "FEATURE" | "TAB";
  name: string;
  moduleId?: ModuleId;
  featureId?: FeatureId;
  tabId?: TabId;
  access: "full" | "partial" | "read_only" | "none";
  source: "EXPLICIT" | "INHERITED" | "OVERRIDDEN";
  children: InheritanceNode[];
  permissions: HierarchicalPermission[];
}

export interface InheritanceTree {
  root: InheritanceNode;
  conflicts: Array<{
    node: InheritanceNode;
    conflictType: "OVERRIDE" | "CONFLICT" | "GAP";
    description: string;
  }>;
}

// ============================================================================
// INHERITANCE VISUALIZER SERVICE
// ============================================================================

class PermissionInheritanceVisualizerService {
  /**
   * Build inheritance tree for user
   */
  async buildInheritanceTree(user: User): Promise<InheritanceTree> {
    const permissions = user.hierarchicalPermissions || [];
    const conflicts: InheritanceTree["conflicts"] = [];

    // Build tree structure
    const root: InheritanceNode = {
      id: "root",
      type: "MODULE",
      name: "All Modules",
      access: "full",
      source: "EXPLICIT",
      children: [],
      permissions: [],
    };

    // Group permissions by module
    const moduleMap = new Map<
      ModuleId,
      {
        permissions: HierarchicalPermission[];
        features: Map<
          FeatureId,
          {
            permissions: HierarchicalPermission[];
            tabs: Map<TabId, HierarchicalPermission[]>;
          }
        >;
      }
    >();

    permissions.forEach((perm) => {
      if (!perm.moduleId) return;

      if (!moduleMap.has(perm.moduleId)) {
        moduleMap.set(perm.moduleId, {
          permissions: [],
          features: new Map(),
        });
      }

      const moduleEntry = moduleMap.get(perm.moduleId)!;

      if (perm.featureId) {
        if (!moduleEntry.features.has(perm.featureId)) {
          moduleEntry.features.set(perm.featureId, {
            permissions: [],
            tabs: new Map(),
          });
        }

        const feature = moduleEntry.features.get(perm.featureId)!;

        if (perm.tabId) {
          if (!feature.tabs.has(perm.tabId)) {
            feature.tabs.set(perm.tabId, []);
          }
          feature.tabs.get(perm.tabId)!.push(perm);
        } else {
          feature.permissions.push(perm);
        }
      } else {
        moduleEntry.permissions.push(perm);
      }
    });

    // Build tree nodes
    moduleMap.forEach((moduleData, moduleId) => {
      const modulePerm = moduleData.permissions.find(
        (p) => !p.featureId && !p.tabId,
      );
      const moduleAccess = modulePerm?.moduleAccess || "none";
      const moduleSource = modulePerm ? "EXPLICIT" : "INHERITED";

      const moduleNode: InheritanceNode = {
        id: moduleId,
        type: "MODULE",
        name: moduleId,
        moduleId,
        access: moduleAccess as any,
        source: moduleSource as any,
        children: [],
        permissions: moduleData.permissions,
      };

      // Add features
      moduleData.features.forEach((featureData, featureId) => {
        const featurePerm = featureData.permissions.find((p) => !p.tabId);
        const featureAccess = featurePerm?.featureAccess || moduleAccess;
        const featureSource = featurePerm ? "EXPLICIT" : "INHERITED";

        const featureNode: InheritanceNode = {
          id: featureId,
          type: "FEATURE",
          name: featureId.split(".")[1] || featureId,
          moduleId,
          featureId,
          access: featureAccess as any,
          source: featureSource as any,
          children: [],
          permissions: featureData.permissions,
        };

        // Add tabs
        featureData.tabs.forEach((tabPerms, tabId) => {
          const tabPerm = tabPerms[0];
          const tabAccess = tabPerm?.tabAccess || featureAccess;
          const tabSource = tabPerm ? "EXPLICIT" : "INHERITED";

          const tabNode: InheritanceNode = {
            id: tabId,
            type: "TAB",
            name: tabId.split(".").pop() || tabId,
            moduleId,
            featureId,
            tabId,
            access: tabAccess as any,
            source: tabSource as any,
            children: [],
            permissions: tabPerms,
          };

          featureNode.children.push(tabNode);
        });

        moduleNode.children.push(featureNode);
      });

      root.children.push(moduleNode);
    });

    // Detect conflicts
    this.detectConflicts(root, conflicts);

    return { root, conflicts };
  }

  /**
   * Detect conflicts in tree
   */
  private detectConflicts(
    node: InheritanceNode,
    conflicts: InheritanceTree["conflicts"],
  ): void {
    // Check for override conflicts
    if (node.source === "OVERRIDDEN" && node.children.length > 0) {
      const childAccess = node.children[0].access;
      if (childAccess !== node.access) {
        conflicts.push({
          node,
          conflictType: "OVERRIDE",
          description: `Module access (${node.access}) overrides child access (${childAccess})`,
        });
      }
    }

    // Check for gaps
    if (
      node.access === "none" &&
      node.children.some((c) => c.access !== "none")
    ) {
      conflicts.push({
        node,
        conflictType: "GAP",
        description: "Module access is none but children have access",
      });
    }

    // Recursively check children
    node.children.forEach((child) => this.detectConflicts(child, conflicts));
  }

  /**
   * Get inheritance path for permission
   */
  getInheritancePath(
    tree: InheritanceTree,
    moduleId: ModuleId,
    featureId?: FeatureId,
    tabId?: TabId,
  ): InheritanceNode[] {
    const path: InheritanceNode[] = [];

    const findNode = (node: InheritanceNode): InheritanceNode | null => {
      if (
        node.moduleId === moduleId &&
        (!featureId || node.featureId === featureId) &&
        (!tabId || node.tabId === tabId)
      ) {
        return node;
      }

      for (const child of node.children) {
        const found = findNode(child);
        if (found) {
          path.push(node);
          return found;
        }
      }

      return null;
    };

    const found = findNode(tree.root);
    if (found) {
      path.push(found);
    }

    return path;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const permissionInheritanceVisualizer =
  new PermissionInheritanceVisualizerService();
