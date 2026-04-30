/**
 * IoT Module Definition
 * Advanced IoT device management with network topology, device discovery, edge AI, and federated learning
 * Deep layer architecture with full functionality
 */

import type { ModuleDefinition } from './registry'

export const iotModule: ModuleDefinition = {
  id: 'iot',
  name: 'IoT & Edge Intelligence',
  description: 'Advanced IoT device management with network topology visualization, multi-protocol device discovery, edge AI deployment, federated learning, and device group management',
  version: '2.0.0',
  category: 'iot',
  standalone: true,
  dependencies: ['facility-management'], // Can leverage facility IoT services
  enabled: true,

  routes: [
    {
      path: '/iot',
      component: 'app/iot/page',
      title: 'IoT Dashboard',
      icon: 'ri-radar-line',
      requiresAuth: true,
    },
    {
      path: '/iot/devices',
      component: 'app/iot/devices/page',
      title: 'IoT Devices',
      icon: 'ri-device-line',
      requiresAuth: true,
    },
    {
      path: '/iot/network-topology',
      component: 'app/iot/network-topology/page',
      title: 'Network Topology',
      icon: 'ri-node-tree',
      requiresAuth: true,
    },
    {
      path: '/iot/device-discovery',
      component: 'app/iot/device-discovery/page',
      title: 'Device Discovery',
      icon: 'ri-radar-line',
      requiresAuth: true,
    },
    {
      path: '/iot/edge-ai',
      component: 'app/iot/edge-ai/page',
      title: 'Edge AI Deployment',
      icon: 'ri-brain-line',
      requiresAuth: true,
    },
    {
      path: '/iot/device-groups',
      component: 'app/iot/device-groups/page',
      title: 'Device Groups',
      icon: 'ri-group-line',
      requiresAuth: true,
    },
    {
      path: '/iot/analytics',
      component: 'app/iot/analytics/page',
      title: 'IoT Analytics',
      icon: 'ri-bar-chart-box-line',
      requiresAuth: true,
    },
  ],

  components: [
    'components/iot/NetworkTopologyVisualization',
    'components/iot/DeviceDiscoveryPanel',
    'components/iot/EdgeAIDeploymentPanel',
    'components/iot/DeviceGroupManager',
  ],

  services: [
    {
      name: 'Advanced IoT Manager',
      path: 'lib/services/iot/iotManager',
      description: 'Comprehensive IoT device management with AI-powered analytics',
    },
    {
      name: 'Advanced Network Topology Service',
      path: 'lib/services/iot/advancedNetworkTopologyService',
      description: 'Network topology visualization and optimization',
    },
    {
      name: 'Advanced Device Discovery Service',
      path: 'lib/services/iot/advancedDeviceDiscoveryService',
      description: 'Multi-protocol device discovery (WiFi, LoRa, Zigbee, Bluetooth, 5G, Satellite)',
    },
    {
      name: 'Federated Learning Service',
      path: 'lib/services/iot/federatedLearningService',
      description: 'Distributed machine learning across IoT devices',
    },
    {
      name: 'IoT Real-Time Service',
      path: 'lib/services/iot/iotRealTimeService',
      description: 'Real-time device monitoring and analytics',
    },
    {
      name: 'IoT Analytics Service',
      path: 'lib/services/iot/iotAnalyticsService',
      description: 'IoT analytics and insights',
    },
    {
      name: 'IoT Security Service',
      path: 'lib/services/iot/iotSecurityService',
      description: 'IoT device security management',
    },
    {
      name: 'IoT Provisioning Service',
      path: 'lib/services/iot/iotProvisioningService',
      description: 'Device provisioning and lifecycle management',
    },
    {
      name: 'Edge AI Service',
      path: 'lib/services/iot/edgeAIService',
      description: 'Edge AI model deployment and management',
    },
  ],

  features: [
    {
      id: 'iot.device_management',
      name: 'Device Management',
      description: 'Comprehensive IoT device registration, monitoring, and lifecycle management',
      enabled: true,
    },
    {
      id: 'iot.network_topology',
      name: 'Network Topology',
      description: 'Visual network topology with optimization recommendations',
      enabled: true,
    },
    {
      id: 'iot.device_discovery',
      name: 'Device Discovery',
      description: 'Multi-protocol device discovery (WiFi, LoRa, Zigbee, Bluetooth, 5G, Satellite)',
      enabled: true,
    },
    {
      id: 'iot.edge_ai',
      name: 'Edge AI Deployment',
      description: 'Deploy AI models to edge devices for real-time inference',
      enabled: true,
    },
    {
      id: 'iot.federated_learning',
      name: 'Federated Learning',
      description: 'Distributed machine learning across IoT devices',
      enabled: true,
    },
    {
      id: 'iot.device_groups',
      name: 'Device Groups',
      description: 'Collective device management and automation',
      enabled: true,
    },
    {
      id: 'iot.analytics',
      name: 'IoT Analytics',
      description: 'Comprehensive analytics and insights',
      enabled: true,
    },
  ],
}

