/**
 * ERPNext Inventory Dashboard Page
 *
 * Overview of inventory grouped by material and warehouse
 * Sync with ERPNext for real-time inventory data
 */

"use client";

import PageTemplate from "@/components/PageTemplate";
import { InventoryDashboard } from "@/components/erpnext";

export default function ERPNextInventoryPage() {
  return (
    <PageTemplate
      title="ERPNext Inventory Dashboard"
      description="Overview of inventory grouped by material and warehouse with ERPNext sync"
      icon="ri-stack-line"
    >
      <InventoryDashboard />
    </PageTemplate>
  );
}
