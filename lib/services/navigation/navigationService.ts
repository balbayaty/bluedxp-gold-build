/**
 * Navigation Service
 * Database-driven navigation with fallback to hardcoded structure
 * Preserves UI/UX while enabling configuration
 */

import { ModuleId, FeatureId } from "@/types/user";
import { getDatabaseClient } from "@/lib/database/client";

export interface NavItem {
  id?: string;
  name: string;
  href?: string;
  icon: string;
  description?: string;
  badge?: string | number;
  comingSoon?: boolean;
  children?: NavItem[];
  // Permission requirements
  moduleId?: ModuleId;
  featureId?: FeatureId;
  requiredAccess?: "full" | "partial" | "read_only";
  // Configuration
  order?: number;
  enabled?: boolean;
  tenantId?: string;
  customerId?: string;
  warehouseId?: string;
}

/**
 * Get navigation structure from database or fallback to default
 */
export async function getNavigationStructure(options?: {
  tenantId?: string;
  customerId?: string;
  warehouseId?: string;
  useDatabase?: boolean;
}): Promise<NavItem[]> {
  const {
    tenantId,
    customerId,
    warehouseId,
    useDatabase = true,
  } = options || {};

  // Try to load from database if enabled
  if (useDatabase) {
    try {
      const dbNav = await loadNavigationFromDatabase({
        tenantId,
        customerId,
        warehouseId,
      });
      if (dbNav && dbNav.length > 0) {
        return dbNav;
      }
    } catch (error) {
      console.warn(
        "⚠️ Failed to load navigation from database, using fallback:",
        error,
      );
    }
  }

  // Fallback to default hardcoded structure
  return getDefaultNavigationStructure();
}

/**
 * Load navigation from database
 */
async function loadNavigationFromDatabase(filters?: {
  tenantId?: string;
  customerId?: string;
  warehouseId?: string;
}): Promise<NavItem[]> {
  try {
    const client = getDatabaseClient();

    // Check if navigation table exists
    const tableExists = await checkTableExists(client, "navigation_items");
    if (!tableExists) {
      return [];
    }

    // Build query with filters
    let query = `
      SELECT 
        id, name, href, icon, description, badge, 
        coming_soon as "comingSoon",
        module_id as "moduleId",
        feature_id as "featureId",
        required_access as "requiredAccess",
        "order", enabled, tenant_id as "tenantId",
        customer_id as "customerId",
        warehouse_id as "warehouseId",
        parent_id as "parentId"
      FROM navigation_items
      WHERE enabled = true
    `;

    const params: any[] = [];
    if (filters?.tenantId) {
      query += ` AND (tenant_id IS NULL OR tenant_id = $${params.length + 1})`;
      params.push(filters.tenantId);
    }
    if (filters?.customerId) {
      query += ` AND (customer_id IS NULL OR customer_id = $${params.length + 1})`;
      params.push(filters.customerId);
    }
    if (filters?.warehouseId) {
      query += ` AND (warehouse_id IS NULL OR warehouse_id = $${params.length + 1})`;
      params.push(filters.warehouseId);
    }

    query += ` ORDER BY "order" ASC, name ASC`;

    const rows = await client.query(query, params);

    // Build hierarchical structure
    const itemsMap = new Map<string, NavItem>();
    const rootItems: NavItem[] = [];

    // First pass: create all items
    for (const row of rows) {
      const item: NavItem = {
        id: row.id,
        name: row.name,
        href: row.href,
        icon: row.icon,
        description: row.description,
        badge: row.badge,
        comingSoon: row.comingSoon,
        moduleId: row.moduleId as ModuleId | undefined,
        featureId: row.featureId as FeatureId | undefined,
        requiredAccess: row.requiredAccess,
        order: row.order,
        enabled: row.enabled,
        children: [],
      };
      itemsMap.set(row.id, item);
    }

    // Second pass: build hierarchy
    for (const row of rows) {
      const item = itemsMap.get(row.id)!;
      if (row.parentId) {
        const parent = itemsMap.get(row.parentId);
        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.push(item);
        } else {
          rootItems.push(item);
        }
      } else {
        rootItems.push(item);
      }
    }

    // Sort children
    const sortItems = (items: NavItem[]) => {
      items.sort((a, b) => (a.order || 0) - (b.order || 0));
      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          sortItems(item.children);
        }
      });
    };
    sortItems(rootItems);

    return rootItems;
  } catch (error) {
    console.error("Error loading navigation from database:", error);
    return [];
  }
}

/**
 * Check if table exists
 */
async function checkTableExists(
  client: any,
  tableName: string,
): Promise<boolean> {
  try {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `;
    const result = await client.query(query, [tableName]);
    return result[0]?.exists || false;
  } catch {
    return false;
  }
}

/**
 * Get default navigation structure (fallback)
 * This is the current hardcoded structure from Layout.tsx
 */
function getDefaultNavigationStructure(): NavItem[] {
  // Import the default structure from a separate file
  const {
    getDefaultNavigationStructure: getDefault,
  } = require("./defaultNavigation");
  return getDefault();
}

/**
 * Save navigation structure to database
 */
export async function saveNavigationStructure(
  items: NavItem[],
  options?: {
    tenantId?: string;
    customerId?: string;
    warehouseId?: string;
  },
): Promise<void> {
  try {
    const client = getDatabaseClient();

    // Ensure table exists
    await ensureNavigationTable(client);

    // Save items recursively
    await saveNavigationItems(client, items, null, options);
  } catch (error) {
    console.error("Error saving navigation to database:", error);
    throw error;
  }
}

/**
 * Save navigation items recursively
 */
async function saveNavigationItems(
  client: any,
  items: NavItem[],
  parentId: string | null,
  options?: {
    tenantId?: string;
    customerId?: string;
    warehouseId?: string;
  },
  order: number = 0,
): Promise<void> {
  for (const item of items) {
    const query = `
      INSERT INTO navigation_items (
        name, href, icon, description, badge, coming_soon,
        module_id, feature_id, required_access, "order",
        enabled, tenant_id, customer_id, warehouse_id, parent_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        href = EXCLUDED.href,
        icon = EXCLUDED.icon,
        description = EXCLUDED.description,
        badge = EXCLUDED.badge,
        coming_soon = EXCLUDED.coming_soon,
        module_id = EXCLUDED.module_id,
        feature_id = EXCLUDED.feature_id,
        required_access = EXCLUDED.required_access,
        "order" = EXCLUDED."order",
        enabled = EXCLUDED.enabled,
        tenant_id = EXCLUDED.tenant_id,
        customer_id = EXCLUDED.customer_id,
        warehouse_id = EXCLUDED.warehouse_id,
        parent_id = EXCLUDED.parent_id
      RETURNING id
    `;

    const params = [
      item.name,
      item.href || null,
      item.icon,
      item.description || null,
      item.badge || null,
      item.comingSoon || false,
      item.moduleId || null,
      item.featureId || null,
      item.requiredAccess || null,
      order,
      item.enabled !== false,
      options?.tenantId || null,
      options?.customerId || null,
      options?.warehouseId || null,
      parentId,
    ];

    const result = await client.query(query, params);
    const savedId = result[0]?.id;

    // Save children recursively
    if (item.children && item.children.length > 0) {
      await saveNavigationItems(client, item.children, savedId, options, 0);
    }

    order++;
  }
}

/**
 * Ensure navigation table exists
 */
async function ensureNavigationTable(client: any): Promise<void> {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS navigation_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      href VARCHAR(500),
      icon VARCHAR(100),
      description TEXT,
      badge VARCHAR(50),
      coming_soon BOOLEAN DEFAULT false,
      module_id VARCHAR(50),
      feature_id VARCHAR(100),
      required_access VARCHAR(20),
      "order" INTEGER DEFAULT 0,
      enabled BOOLEAN DEFAULT true,
      tenant_id VARCHAR(100),
      customer_id VARCHAR(100),
      warehouse_id VARCHAR(100),
      parent_id UUID REFERENCES navigation_items(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(name, parent_id, tenant_id, customer_id, warehouse_id)
    );

    CREATE INDEX IF NOT EXISTS idx_navigation_items_parent ON navigation_items(parent_id);
    CREATE INDEX IF NOT EXISTS idx_navigation_items_tenant ON navigation_items(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_navigation_items_customer ON navigation_items(customer_id);
    CREATE INDEX IF NOT EXISTS idx_navigation_items_warehouse ON navigation_items(warehouse_id);
    CREATE INDEX IF NOT EXISTS idx_navigation_items_enabled ON navigation_items(enabled);
  `;

  await client.query(createTableQuery);
}
