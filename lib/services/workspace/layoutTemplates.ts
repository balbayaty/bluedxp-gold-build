/**
 * Layout Templates - Pre-built Workspace Layouts
 *
 * Professional templates for different use cases:
 * - Executive Dashboard
 * - Operations Dashboard
 * - Analytics Dashboard
 * - Compliance Dashboard
 * - Custom Templates
 */

import type { CreateWorkspaceLayoutInput } from "@/types/workspace";

export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  widgets: Array<{
    widgetDefId: string;
    position: { x: number; y: number; w: number; h: number };
    config?: Record<string, any>;
  }>;
  metadata?: Record<string, any>;
}

export const layoutTemplates: LayoutTemplate[] = [
  {
    id: "executive-dashboard",
    name: "Executive Dashboard",
    description: "High-level KPIs and strategic metrics for executives",
    category: "executive",
    icon: "ri-dashboard-line",
    widgets: [
      {
        widgetDefId: "total-orders", // These will be matched by name or ID
        position: { x: 0, y: 0, w: 3, h: 2 },
        config: { title: "Total Orders" },
      },
      {
        widgetDefId: "revenue-trend",
        position: { x: 3, y: 0, w: 6, h: 2 },
        config: { title: "Revenue Trend" },
      },
      {
        widgetDefId: "compliance-score",
        position: { x: 9, y: 0, w: 3, h: 2 },
        config: { title: "Compliance Score" },
      },
      {
        widgetDefId: "active-shipments",
        position: { x: 0, y: 2, w: 4, h: 2 },
        config: { title: "Active Shipments" },
      },
      {
        widgetDefId: "warehouse-utilization",
        position: { x: 4, y: 2, w: 4, h: 2 },
        config: { title: "Warehouse Utilization" },
      },
      {
        widgetDefId: "safety-incidents",
        position: { x: 8, y: 2, w: 4, h: 2 },
        config: { title: "Safety Incidents" },
      },
    ],
    metadata: {
      recommendedRoles: ["EXECUTIVE", "SYSTEM_ADMIN"],
      tags: ["executive", "kpi", "strategic"],
    },
  },
  {
    id: "operations-dashboard",
    name: "Operations Dashboard",
    description: "Real-time operations monitoring and management",
    category: "operations",
    icon: "ri-settings-3-line",
    widgets: [
      {
        widgetDefId: "active-shipments",
        position: { x: 0, y: 0, w: 3, h: 2 },
      },
      {
        widgetDefId: "warehouse-utilization",
        position: { x: 3, y: 0, w: 3, h: 2 },
      },
      {
        widgetDefId: "order-status",
        position: { x: 6, y: 0, w: 6, h: 3 },
      },
      {
        widgetDefId: "activities",
        position: { x: 0, y: 2, w: 6, h: 3 },
      },
    ],
    metadata: {
      recommendedRoles: ["OPERATIONS_MANAGER", "WAREHOUSE_MANAGER"],
      tags: ["operations", "real-time", "monitoring"],
    },
  },
  {
    id: "analytics-dashboard",
    name: "Analytics Dashboard",
    description: "Data analysis, trends, and insights",
    category: "analytics",
    icon: "ri-bar-chart-box-line",
    widgets: [
      {
        widgetDefId: "revenue-trend",
        position: { x: 0, y: 0, w: 8, h: 4 },
      },
      {
        widgetDefId: "order-status",
        position: { x: 8, y: 0, w: 4, h: 4 },
      },
      {
        widgetDefId: "total-orders",
        position: { x: 0, y: 4, w: 4, h: 2 },
      },
      {
        widgetDefId: "compliance-score",
        position: { x: 4, y: 4, w: 4, h: 2 },
      },
      {
        widgetDefId: "safety-incidents",
        position: { x: 8, y: 4, w: 4, h: 2 },
      },
    ],
    metadata: {
      recommendedRoles: ["ANALYST", "DATA_SCIENTIST"],
      tags: ["analytics", "charts", "insights"],
    },
  },
  {
    id: "compliance-dashboard",
    name: "Compliance Dashboard",
    description: "Compliance monitoring and regulatory tracking",
    category: "compliance",
    icon: "ri-shield-check-line",
    widgets: [
      {
        widgetDefId: "compliance-score",
        position: { x: 0, y: 0, w: 6, h: 3 },
      },
      {
        widgetDefId: "safety-incidents",
        position: { x: 6, y: 0, w: 6, h: 3 },
      },
      {
        widgetDefId: "activities",
        position: { x: 0, y: 3, w: 12, h: 3 },
      },
    ],
    metadata: {
      recommendedRoles: ["COMPLIANCE_OFFICER", "QHSE_MANAGER"],
      tags: ["compliance", "safety", "regulatory"],
    },
  },
  {
    id: "blank-layout",
    name: "Blank Layout",
    description: "Start from scratch with an empty layout",
    category: "custom",
    icon: "ri-file-blank-line",
    widgets: [],
    metadata: {
      recommendedRoles: [],
      tags: ["blank", "custom", "empty"],
    },
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(
  templateId: string,
): LayoutTemplate | undefined {
  return layoutTemplates.find((t) => t.id === templateId);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): LayoutTemplate[] {
  return layoutTemplates.filter((t) => t.category === category);
}

/**
 * Get all templates
 */
export function getAllTemplates(): LayoutTemplate[] {
  return layoutTemplates;
}

/**
 * Convert template to layout input
 */
export function templateToLayoutInput(
  template: LayoutTemplate,
  name?: string,
  isDefault?: boolean,
): CreateWorkspaceLayoutInput {
  return {
    name: name || template.name,
    description: template.description,
    category: template.category,
    isDefault: isDefault || false,
    isTemplate: false,
    widgets: template.widgets.map((w) => ({
      widgetDefId: w.widgetDefId,
      position: w.position,
      config: w.config || {},
    })),
    metadata: {
      ...template.metadata,
      templateId: template.id,
      createdAt: new Date().toISOString(),
    },
  };
}
