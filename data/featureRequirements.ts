/**
 * Feature Requirements Data
 * Configuration for all advanced features and their requirements
 * Used by FeatureTooltip component to display requirements on hover
 */

import { FeatureRequirement } from '@/types/featureTooltips';

export const featureRequirements: FeatureRequirement[] = [
  // ============================================
  // PHASE 1: IoT Management System
  // ============================================
  {
    id: 'iot-management',
    name: 'Advanced IoT Management System',
    description: 'Comprehensive IoT device management with AI-powered analytics, predictive maintenance, and edge computing capabilities.',
    priority: 'HIGH',
    estimatedTime: '4-6 hours',
    dependencies: ['WMS Module', 'Compliance Module'],
    requiredServices: [
      'lib/services/iot/iotManager.ts',
      'lib/services/iot/iotAnalyticsService.ts',
      'lib/services/iot/iotSecurityService.ts',
      'lib/services/iot/edgeAIService.ts'
    ],
    integrationPoints: [
      'Event Bus (lib/services/event-bus/)',
      'Module Registry (lib/modules/registry.ts)',
      'Knowledge Base',
      'Evidence Service',
      'Agent System'
    ],
    status: 'planned',
    phase: 1,
    capabilities: [
      'Device Discovery & Registration',
      'AI Model Deployment to Edge',
      'Predictive Maintenance',
      'Network Optimization',
      'Security Management',
      'Real-time Analytics',
      'Multi-Protocol Support (WiFi, LoRa, Zigbee, 5G)'
    ],
    industrialAlignment: ['4IR', '5IR']
  },
  
  // ============================================
  // PHASE 2: Dashboard Management System
  // ============================================
  {
    id: 'dashboard-management',
    name: 'Dashboard Management System',
    description: 'Centralized dashboard management with widget library, role-based access, and real-time updates.',
    priority: 'HIGH',
    estimatedTime: '3-4 hours',
    dependencies: ['Multi-Tenant System', 'RBAC System'],
    requiredServices: [
      'lib/services/dashboards/dashboardManager.ts',
      'lib/services/dashboards/widgetService.ts',
      'lib/services/dashboards/layoutService.ts',
      'lib/services/dashboards/dashboardAnalyticsService.ts'
    ],
    integrationPoints: [
      'Multi-Tenant Architecture',
      'Role-Based Access Control (11 roles)',
      'View Context System',
      'Module Registry',
      'Event Bus'
    ],
    status: 'partial',
    phase: 2,
    capabilities: [
      'Centralized Dashboard Management',
      'Layout Templates',
      'Widget Library (50+ widgets)',
      'Role-Based Widget Access',
      'Real-time Updates via WebSocket',
      'User Customizable Layouts',
      'Analytics Tracking'
    ],
    industrialAlignment: ['4IR']
  },
  
  {
    id: 'ultimate-dashboard',
    name: 'Ultimate Consolidated Dashboard',
    description: 'Modern glassmorphism UI dashboard with AI-powered insights and 18 widget categories.',
    priority: 'HIGH',
    estimatedTime: '2-3 hours',
    dependencies: ['Dashboard Management System', 'Framer Motion'],
    requiredServices: [
      'lib/services/dashboards/widgetService.ts',
      'lib/services/ai/',
      'lib/services/analytics/'
    ],
    integrationPoints: [
      'Universal Tabs Integration',
      'Multi-Tenant Support',
      'Widget-Level Permissions',
      'Real-time Data Streaming'
    ],
    status: 'partial',
    phase: 2,
    capabilities: [
      'Glassmorphism UI Design',
      'Framer Motion Animations',
      'AI-Powered Insights',
      'Drag-and-Drop Layouts',
      '18 Widget Categories',
      'Category Filtering'
    ],
    industrialAlignment: ['5IR']
  },
  
  {
    id: 'executive-dashboard',
    name: 'Executive Overview Dashboard',
    description: 'Real-time KPI tracking with advanced charts, revenue analytics, and compliance scoring.',
    priority: 'MEDIUM',
    estimatedTime: '2-3 hours',
    dependencies: ['Recharts Library', 'Analytics Service'],
    requiredServices: [
      'lib/services/analytics/',
      'lib/services/compliance/',
      'lib/services/export/'
    ],
    integrationPoints: [
      'Time Range Selection',
      'Export Capabilities',
      'Theme System (Dark Mode)'
    ],
    status: 'ready',
    phase: 2,
    capabilities: [
      'Real-time KPI Metrics',
      'Revenue & Profit Analytics',
      'Department Breakdown Charts',
      'Multi-Category Compliance Scoring',
      'Data Export'
    ],
    industrialAlignment: ['4IR']
  },
  
  // ============================================
  // PHASE 3: Enhanced Dashboards
  // ============================================
  {
    id: 'qhse-dashboard',
    name: 'QHSE Dashboard',
    description: 'Comprehensive Quality, Health, Safety, and Environment metrics with multi-facility support.',
    priority: 'HIGH',
    estimatedTime: '2-3 hours',
    dependencies: ['Compliance Module', 'WMS Module'],
    requiredServices: [
      'lib/services/qhse/',
      'lib/services/compliance/',
      'lib/services/incidents/',
      'lib/services/inspections/'
    ],
    integrationPoints: [
      'Customer-Facility Filtering',
      'Incident Management',
      'Training Compliance',
      'Regulatory Audits'
    ],
    status: 'ready',
    phase: 3,
    capabilities: [
      'Safety Performance (TRIR, LTIFR)',
      'Quality Metrics (Defect Rate, NCRs)',
      'Environmental Metrics (Carbon, Waste)',
      'Employee Engagement Tracking',
      'Multi-Facility Support',
      'Tab-Based Navigation'
    ],
    industrialAlignment: ['5IR']
  },
  
  {
    id: 'ml-analytics',
    name: 'ML Analytics Dashboard',
    description: 'Machine learning model performance tracking with confusion matrix and confidence distribution.',
    priority: 'MEDIUM',
    estimatedTime: '2-3 hours',
    dependencies: ['ML Registry', 'Chart.js'],
    requiredServices: [
      'lib/services/ml-registry/',
      'lib/services/analytics/',
      'lib/services/ai/'
    ],
    integrationPoints: [
      'Model Performance Metrics',
      'Time Range Selection',
      'Export Capabilities'
    ],
    status: 'planned',
    phase: 3,
    capabilities: [
      'Model Performance Metrics (Accuracy, Precision, Recall, F1)',
      'Confusion Matrix Visualization',
      'Confidence Distribution Analysis',
      'Performance by Chemical Class',
      'Model Improvement Tracking'
    ],
    industrialAlignment: ['4IR', '5IR']
  },
  
  {
    id: 'chemical-dashboard',
    name: 'Enhanced Chemical Dashboard',
    description: '3D chemical visualization with risk assessment and compatibility matrix.',
    priority: 'MEDIUM',
    estimatedTime: '3-4 hours',
    dependencies: ['Three.js or 3D Library', 'Chart.js'],
    requiredServices: [
      'lib/services/chemical/',
      'lib/services/ai/visionService.ts',
      'lib/services/risk/'
    ],
    integrationPoints: [
      'AI-Powered Risk Scoring',
      'Chemical Database',
      'Hazard Classification'
    ],
    status: 'planned',
    phase: 3,
    capabilities: [
      '3D Molecular Visualization',
      'AI-Powered Risk Assessment',
      'Chemical Compatibility Matrix',
      'Hazard Class Distribution',
      'Classification Summary'
    ],
    industrialAlignment: ['4IR', '5IR']
  },
  
  // ============================================
  // PHASE 4: Edge AI & Model Deployment
  // ============================================
  {
    id: 'edge-ai',
    name: 'Edge AI & Model Deployment',
    description: 'Deploy AI models to edge devices with support for TensorFlow Lite, ONNX, and OpenVINO.',
    priority: 'MEDIUM',
    estimatedTime: '3-4 hours',
    dependencies: ['IoT Management', 'ML Registry'],
    requiredServices: [
      'lib/services/iot/edgeAIService.ts',
      'lib/services/ml-registry/',
      'lib/adapters/edge/'
    ],
    integrationPoints: [
      'IoT Manager',
      'Model Compatibility Checker',
      'Deployment Monitoring'
    ],
    status: 'planned',
    phase: 4,
    capabilities: [
      'TensorFlow Lite Support',
      'ONNX Runtime Support',
      'OpenVINO Support',
      'Edge-to-Cloud Sync',
      'Offline Capability',
      'Real-time Inference'
    ],
    industrialAlignment: ['4IR', '5IR']
  },
  
  // ============================================
  // PHASE 5: Network Optimization
  // ============================================
  {
    id: 'network-optimization',
    name: 'Network Optimization',
    description: 'Network topology analysis, protocol optimization, and load balancing for IoT infrastructure.',
    priority: 'LOW',
    estimatedTime: '2-3 hours',
    dependencies: ['IoT Management'],
    requiredServices: [
      'lib/services/iot/networkService.ts',
      'lib/services/iot/loadBalancer.ts'
    ],
    integrationPoints: [
      'IoT Manager',
      'Health Monitoring',
      'Optimization Recommendations'
    ],
    status: 'planned',
    phase: 5,
    capabilities: [
      'Network Topology Analysis',
      'Protocol Optimization',
      'Load Balancing',
      'Latency Monitoring',
      'Health Recommendations'
    ],
    industrialAlignment: ['4IR']
  }
];

// Helper function to get feature by ID
export function getFeatureById(id: string): FeatureRequirement | undefined {
  return featureRequirements.find(f => f.id === id);
}

// Helper function to get features by phase
export function getFeaturesByPhase(phase: number): FeatureRequirement[] {
  return featureRequirements.filter(f => f.phase === phase);
}

// Helper function to get features by priority
export function getFeaturesByPriority(priority: 'HIGH' | 'MEDIUM' | 'LOW'): FeatureRequirement[] {
  return featureRequirements.filter(f => f.priority === priority);
}

// Helper function to get features by status
export function getFeaturesByStatus(status: FeatureRequirement['status']): FeatureRequirement[] {
  return featureRequirements.filter(f => f.status === status);
}

// Group features by phase for display
export function getFeaturesByPhaseGrouped(): Record<number, FeatureRequirement[]> {
  return featureRequirements.reduce((acc, feature) => {
    const phase = feature.phase || 0;
    if (!acc[phase]) {
      acc[phase] = [];
    }
    acc[phase].push(feature);
    return acc;
  }, {} as Record<number, FeatureRequirement[]>);
}

