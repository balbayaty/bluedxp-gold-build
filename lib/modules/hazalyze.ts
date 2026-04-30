/**
 * Hazalyze Module Definition
 * Core AI & Intelligence Module for BlueDXP Platform
 * 
 * Hazalyze is the intelligent core of the BlueDXP platform, providing:
 * - AI Copilot (HazalyzeCopilot) - Conversational AI assistant
 * - AI Vision Intelligence - Multi-modal vision analysis (images, video, streaming)
 * - Intelligent Orchestration - Process mining, root cause analysis, predictive analytics
 * - Agent Orchestration - Specialized AI agents for different tasks
 * - Knowledge Base - Self-learning system with vector embeddings
 * - AI Insights & Recommendations - Automated insights and recommendations
 * 
 * This module serves as the AI brain of the platform, enabling:
 * - Autonomous decision-making
 * - Real-time compliance monitoring
 * - Predictive optimization
 * - Human-machine collaboration
 * - Conversational decision intelligence
 * 
 * Aligned with BlueDXP vision and 4IR/5IR capabilities
 */

import { ModuleDefinition } from './registry'

export const hazalyzeModule: ModuleDefinition = {
  id: 'hazalyze',
  name: 'Hazalyze AI & Intelligence',
  description: 'Core AI and intelligence module providing AI Copilot, Vision Intelligence, Intelligent Orchestration, Agent Orchestration, Knowledge Base, and automated insights. The intelligent brain of the BlueDXP platform.',
  version: '1.0.0',
  category: 'ai',
  standalone: true, // Can work independently
  dependencies: [], // No dependencies - other modules may depend on this
  enabled: true,

  routes: [
    // AI Copilot (integrated throughout, but has dedicated settings)
    {
      path: '/settings/ai',
      component: 'app/settings/ai/page',
      title: 'AI Settings',
      icon: 'ri-settings-3-line',
      requiresAuth: true,
    },

    // AI Vision Intelligence
    {
      path: '/ai-vision-unified',
      component: 'app/ai-vision-unified/page',
      title: 'Unified Vision Dashboard',
      icon: 'ri-eye-line',
      requiresAuth: true,
    },
    {
      path: '/ai-vision-unified-enhanced',
      component: 'app/ai-vision-unified-enhanced/page',
      title: 'Enhanced Unified Vision Dashboard',
      icon: 'ri-eye-2-line',
      requiresAuth: true,
    },
    {
      path: '/ai-vision',
      component: 'app/ai-vision/page',
      title: 'Image Analysis',
      icon: 'ri-image-line',
      requiresAuth: true,
    },
    {
      path: '/ai-vision/video',
      component: 'app/ai-vision/video/page',
      title: 'Video Analysis',
      icon: 'ri-video-line',
      requiresAuth: true,
    },
    {
      path: '/ai-vision/stream',
      component: 'app/ai-vision/stream/page',
      title: 'Live Streaming',
      icon: 'ri-live-line',
      requiresAuth: true,
    },
    {
      path: '/ai-vision/chemical',
      component: 'app/ai-vision/chemical/page',
      title: 'Chemical Vision',
      icon: 'ri-flask-line',
      requiresAuth: true,
    },
    {
      path: '/ai-vision/manufacturing',
      component: 'app/ai-vision/manufacturing/page',
      title: 'Manufacturing Vision',
      icon: 'ri-tools-line',
      requiresAuth: true,
    },
    {
      path: '/ai-vision/logistics',
      component: 'app/ai-vision/logistics/page',
      title: 'Logistics Vision',
      icon: 'ri-truck-line',
      requiresAuth: true,
    },
    {
      path: '/ai-vision/healthcare',
      component: 'app/ai-vision/healthcare/page',
      title: 'Healthcare Vision',
      icon: 'ri-hospital-line',
      requiresAuth: true,
    },
    {
      path: '/ai-vision/scene',
      component: 'app/ai-vision/scene/page',
      title: 'Scene Understanding',
      icon: 'ri-landscape-line',
      requiresAuth: true,
    },
    {
      path: '/ai-vision/tracking',
      component: 'app/ai-vision/tracking/page',
      title: 'Object Tracking',
      icon: 'ri-focus-3-line',
      requiresAuth: true,
    },
    {
      path: '/ai-vision/anomalies',
      component: 'app/ai-vision/anomalies/page',
      title: 'Anomaly Detection',
      icon: 'ri-alert-line',
      requiresAuth: true,
    },
    {
      path: '/ai-vision/history',
      component: 'app/ai-vision/history/page',
      title: 'Analysis History',
      icon: 'ri-history-line',
      requiresAuth: true,
    },

    // Intelligent Orchestration
    {
      path: '/intelligent-orchestration/process-mining',
      component: 'app/intelligent-orchestration/process-mining/page',
      title: 'Process Mining',
      icon: 'ri-flow-chart-line',
      requiresAuth: true,
    },
    {
      path: '/intelligent-orchestration/root-cause',
      component: 'app/intelligent-orchestration/root-cause/page',
      title: 'Root Cause Analysis',
      icon: 'ri-search-line',
      requiresAuth: true,
    },
    {
      path: '/intelligent-orchestration/predictive',
      component: 'app/intelligent-orchestration/predictive/page',
      title: 'Predictive Analytics',
      icon: 'ri-bar-chart-box-line',
      requiresAuth: true,
    },
    {
      path: '/intelligent-orchestration/communication',
      component: 'app/intelligent-orchestration/communication/page',
      title: 'Communication Orchestration',
      icon: 'ri-message-3-line',
      requiresAuth: true,
    },
    {
      path: '/intelligent-orchestration/compliance',
      component: 'app/intelligent-orchestration/compliance/page',
      title: 'Autonomous Compliance',
      icon: 'ri-shield-check-line',
      requiresAuth: true,
    },
    {
      path: '/intelligent-orchestration/insights',
      component: 'app/intelligent-orchestration/insights/page',
      title: 'Automated Insights',
      icon: 'ri-lightbulb-line',
      requiresAuth: true,
    },

    // Agent Orchestration
    {
      path: '/agent-orchestration',
      component: 'app/agent-orchestration/page',
      title: 'Agent Orchestration',
      icon: 'ri-robot-line',
      requiresAuth: true,
    },

    // Knowledge Base
    {
      path: '/knowledge-base',
      component: 'app/knowledge-base/page',
      title: 'Knowledge Base',
      icon: 'ri-book-open-line',
      requiresAuth: true,
    },

    // AI Insights & Recommendations
    {
      path: '/ai/insights',
      component: 'app/ai/insights/page',
      title: 'AI Insights',
      icon: 'ri-lightbulb-flash-line',
      requiresAuth: true,
    },
    {
      path: '/ai/recommendations',
      component: 'app/ai/recommendations/page',
      title: 'AI Recommendations',
      icon: 'ri-thumb-up-line',
      requiresAuth: true,
    },

    // ASN Intelligence (Enhanced)
    {
      path: '/asn',
      component: 'app/asn/page',
      title: 'ASN Intelligence',
      icon: 'ri-file-list-3-line',
      requiresAuth: true,
    },
    {
      path: '/asn/dashboard',
      component: 'app/asn/dashboard/page',
      title: 'ASN Dashboard',
      icon: 'ri-dashboard-3-line',
      requiresAuth: true,
    },
    {
      path: '/asn/processing',
      component: 'app/asn/processing/page',
      title: 'ASN Processing',
      icon: 'ri-inbox-line',
      requiresAuth: true,
    },
    {
      path: '/asn/processing/[id]',
      component: 'app/asn/processing/[id]/page',
      title: 'Process ASN',
      icon: 'ri-file-edit-line',
      requiresAuth: true,
    },
    {
      path: '/asn/analytics',
      component: 'app/asn/analytics/page',
      title: 'ASN Analytics',
      icon: 'ri-bar-chart-box-line',
      requiresAuth: true,
    },
  ],

  components: [
    // AI Copilot Components
    'components/HazalyzeCopilot',
    'components/BluedxpCopilot',

    // AI Vision Components
    'components/vision/ChemicalVisionAnalyzer',
    'components/vision/VideoAnalyzer',
    'components/vision/StreamAnalyzer',
    'components/vision/SceneUnderstanding',
    'components/vision/ObjectTracker',
    'components/vision/AnomalyDetector',

    // Intelligent Orchestration Components
    'components/intelligent-orchestration/ProcessMiningDashboard',
    'components/intelligent-orchestration/RootCauseAnalyzer',
    'components/intelligent-orchestration/PredictiveAnalytics',
    'components/intelligent-orchestration/CommunicationOrchestrator',
    'components/intelligent-orchestration/AutonomousCompliance',
    'components/intelligent-orchestration/AutomatedInsights',

    // Agent Components
    'components/agents/AgentOrchestrator',
    'components/agents/AgentDashboard',

    // Knowledge Base Components
    'components/knowledge-base/KnowledgeBaseViewer',
    'components/knowledge-base/KnowledgeGraph',

    // ASN Components
    'components/asn/ExecutiveDashboard',
    'components/asn/OperationalDashboard',
    'components/asn/AnalyticalDashboard',
    'components/asn/AsnProcessingInterface',
    'components/asn/AsnList',
  ],

  services: [
    // AI Client & Core Services
    'utils/aiClient',
    'utils/aiOrchestration',
    'utils/agentEngine',

    // AI Vision Services
    'lib/services/ai/visionService',
    'lib/services/ai/enhancedVisionService',
    'lib/services/ai/chemicalVisionService',
    'lib/services/ai/videoAnalysisService',
    'lib/services/ai/streamingVisionService',
    'lib/services/ai/objectTrackingService',
    'lib/services/ai/anomalyDetectionService',
    'lib/services/ai/sceneUnderstandingService',
    'lib/services/ai/edgeVisionService',
    'lib/services/ai/visionCacheService',
    'lib/services/ai/unifiedVisionService',
    'lib/services/ai/industry/manufacturingVisionService',
    'lib/services/ai/industry/logisticsVisionService',
    'lib/services/ai/industry/healthcareVisionService',
    
    // AI Vision Advanced Services (Intelligent & Automated)
    'lib/services/ai/vision/visionDatabaseService',
    'lib/services/ai/vision/visionEventIntegration',
    'lib/services/ai/vision/visionAgentIntegration',
    'lib/services/ai/vision/humanInTheLoopService',
    'lib/services/ai/vision/intelligentAutomationService',
    'lib/services/ai/vision/v2/selfLearningVisionService',
    'lib/services/ai/vision/v2/visionLearningDatabaseAdapter',

    // Intelligent Orchestration Services
    'lib/services/process-lifecycle/process-mining/processMiningService',
    'lib/services/process-lifecycle/ai/rootCauseAnalysisService',
    'lib/services/process-lifecycle/ai/predictiveAnalyticsService',
    'lib/services/process-lifecycle/ai/communicationOrchestrationService',
    'lib/services/process-lifecycle/ai/complianceMonitoringService',
    'lib/services/process-lifecycle/analytics/insightsService',

    // Agent Services
    'lib/services/agents/agentOrchestrator',
    'lib/services/agents/agentMemory',

    // Knowledge Base Services
    'lib/services/knowledge-base/knowledgeBaseService',
    'lib/services/knowledge-base/tenantKnowledgeBase',

    // AI Insights & Recommendations
    'lib/services/ai/intelligentRecommendationsService',
    'lib/services/ai/predictiveInsightsService',

    // Copilot Services
    'lib/services/copilot/copilotService',
    'lib/services/copilot/contextService',

    // Advanced AI Systems (Migrated)
    'lib/services/ai/brainGateway',
    'lib/services/ai/mirsadAIBrain',
    'lib/services/ai/personalizedLearning',
    'lib/services/ai/videoAnalyzer',
    'lib/services/ai/edgeProcessor',
    'lib/services/ai/hazalyzeAnalysis',

    // Ecosystem Services (Migrated)
    'lib/services/ecosystem/apiGateway',
    'lib/services/ecosystem/realtimePrice',
    'lib/services/ecosystem/routeOptimizer',
    'lib/services/ecosystem/multiModalBooking',
    'lib/services/ecosystem/priceIndex',
    'lib/services/ecosystem/comparison',
    'lib/services/ecosystem/liveData',
    'lib/services/ecosystem/aiOptimization',

    // ASN Services (Enhanced)
    'lib/services/asn/core/asnService',
    'lib/services/asn/intelligence/predictiveAsnService',
    'lib/services/asn/intelligence/exceptionPredictionService',
    'lib/services/asn/analytics/asnAnalyticsService',
  ],

  config: {
    // AI Copilot Configuration
    copilot: {
      enabled: true,
      providers: ['openai', 'anthropic'],
      defaultProvider: 'openai',
      streamingEnabled: true,
      contextAware: true,
      voiceEnabled: false, // UI ready, needs implementation
      visionEnabled: true,
    },

    // AI Vision Configuration
    vision: {
      enabled: true,
      providers: ['openai', 'anthropic'],
      defaultProvider: 'openai',
      streamingEnabled: true,
      cacheEnabled: true,
      edgeComputingEnabled: false, // Future enhancement
      industrySpecializations: {
        chemical: true,
        manufacturing: true,
        logistics: true,
        healthcare: true,
      },
    },

    // Intelligent Orchestration Configuration
    intelligentOrchestration: {
      enabled: true,
      processMining: {
        enabled: true,
        realTimeDiscovery: true,
        variantDetection: true,
        bottleneckIdentification: true,
      },
      rootCauseAnalysis: {
        enabled: true,
        methods: ['5-whys', 'fishbone', 'fmea', 'ml-analysis'],
        autoRCA: true,
      },
      predictiveAnalytics: {
        enabled: true,
        mlModels: ['time-series', 'anomaly-detection', 'classification'],
        forecasting: true,
        riskPrediction: true,
      },
      communicationOrchestration: {
        enabled: true,
        channels: ['email', 'whatsapp', 'sms', 'voice'],
        templateManagement: true,
        autoRouting: true,
      },
      autonomousCompliance: {
        enabled: true,
        selfMonitoring: true,
        autoEnforcement: true,
        violationDetection: true,
      },
      automatedInsights: {
        enabled: true,
        aiGenerated: true,
        recommendations: true,
        performanceAlerts: true,
      },
    },

    // Agent Orchestration Configuration
    agents: {
      enabled: true,
      specializedAgents: [
        'safety-analysis',
        'quality-management',
        'warehouse-operations',
        'msds-intelligence',
        'vision',
        'root-cause-analysis',
        'predictive-analytics',
        'communication',
      ],
      memoryEnabled: true,
      learningEnabled: true,
      orchestrationEnabled: true,
    },

    // Knowledge Base Configuration
    knowledgeBase: {
      enabled: true,
      vectorEmbeddings: true,
      selfLearning: true,
      tenantIsolated: true,
      federatedLearning: false, // Future enhancement
    },

    // Integration Configuration
    integrations: {
      eventBus: true,
      moduleRegistry: true,
      crossModuleIntelligence: true,
      externalAPIs: true,
    },

    // Performance Configuration
    performance: {
      caching: true,
      rateLimiting: true,
      tokenTracking: true,
      costOptimization: true,
    },
  },
}










