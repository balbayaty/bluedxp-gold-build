/**
 * ISO IMS Module Definition
 * ISO Integrated Management System Module
 * 
 * Source: chemcheck-ai
 */

import { ModuleDefinition } from './registry'

export const isoImsModule: ModuleDefinition = {
  id: 'iso-ims',
  name: 'ISO Integrated Management System',
  description: 'Complete ISO compliance management (ISO 9001, 14001, 45001, 27001)',
  version: '1.0.0',
  category: 'iso-ims',
  standalone: true, // Can work independently
  dependencies: [], // No dependencies, but can integrate with WMS
  routes: [
    { path: '/iso-ims', component: 'app/iso-ims/page', title: 'ISO IMS Dashboard', icon: 'ri-shield-check-line' },
    { path: '/iso-ims/capa', component: 'app/iso-ims/capa/page', title: 'CAPA Management', icon: 'ri-check-double-line' },
    { path: '/iso-ims/ncr', component: 'app/iso-ims/ncr/page', title: 'NCR Management', icon: 'ri-alarm-warning-line' },
    { path: '/iso-ims/audit', component: 'app/iso-ims/audit/page', title: 'Audit Management', icon: 'ri-clipboard-check-line' },
    { path: '/iso-ims/document', component: 'app/iso-ims/document/page', title: 'Document Center', icon: 'ri-file-text-line' },
    { path: '/iso-ims/risk', component: 'app/iso-ims/risk/page', title: 'Risk Management', icon: 'ri-shield-cross-line' },
    { path: '/iso-ims/training', component: 'app/iso-ims/training/page', title: 'Training Management', icon: 'ri-graduation-cap-line' },
    { path: '/iso-ims/intelligence', component: 'app/iso-ims/intelligence/page', title: 'AI Intelligence', icon: 'ri-brain-line' },
    // Legacy routes for backward compatibility
    { path: '/capa-management', component: 'app/iso-ims/capa/page', title: 'CAPA Management', icon: 'ri-tools-line' },
    { path: '/ncr-management', component: 'app/iso-ims/ncr/page', title: 'NCR Management', icon: 'ri-alert-line' },
    { path: '/audit-management', component: 'app/iso-ims/audit/page', title: 'Audit Management', icon: 'ri-file-search-line' },
    { path: '/document-center', component: 'app/iso-ims/document/page', title: 'Document Center', icon: 'ri-file-text-line' },
    { path: '/risk-management', component: 'app/iso-ims/risk/page', title: 'Risk Management', icon: 'ri-shield-cross-line' },
    { path: '/training-management', component: 'app/iso-ims/training/page', title: 'Training Management', icon: 'ri-graduation-cap-line' },
    { path: '/incident-report', component: 'app/incident-report/page', title: 'Incident Reporting', icon: 'ri-error-warning-line' },
    { path: '/inspection-checklist', component: 'app/inspection-checklist/page', title: 'Inspection Checklist', icon: 'ri-checkbox-multiple-line' },
    { path: '/my-tasks', component: 'app/my-tasks/page', title: 'My Tasks', icon: 'ri-task-line' },
    { path: '/my-capa-workspace', component: 'app/my-capa-workspace/page', title: 'My CAPA Workspace', icon: 'ri-briefcase-line' },
    { path: '/approvals', component: 'app/approvals/page', title: 'Approvals', icon: 'ri-check-double-line' },
    { path: '/storage-locations', component: 'app/storage-locations/page', title: 'Storage Locations', icon: 'ri-map-pin-line' },
  ],
  components: [
    'components/ims/AdvancedCAPAForm',
    'components/ims/DocumentUploadModal',
    'components/ims/EditCAPAModal',
    'components/ims/UserSelector',
    'components/StorageLocationForm',
    'components/WarehouseAreasManager',
  ],
  services: [
    'lib/adapters/erpnext/api',
    'lib/services/ai/chemcheckService',
    'lib/services/firebase/database',
    'lib/services/firebase/storage',
  ],
  enabled: true,
  config: {
    erpnext: {
      enabled: true,
      url: process.env.ERP_NEXT_API_URL,
    },
    firebase: {
      enabled: true,
    },
  },
}



