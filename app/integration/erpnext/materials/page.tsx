/**
 * ERPNext Materials Manager Page
 *
 * Manage hazardous materials with ERPNext integration
 */

"use client";

import PageTemplate from "@/components/PageTemplate";
import { MaterialsManager } from "@/components/erpnext";

export default function ERPNextMaterialsPage() {
  return (
    <PageTemplate
      title="ERPNext Materials Manager"
      description="Manage hazardous materials with ERPNext integration"
      icon="ri-flask-line"
    >
      <MaterialsManager />
    </PageTemplate>
  );
}
