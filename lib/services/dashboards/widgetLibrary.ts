/**
 * Comprehensive Widget Library Service
 * 50+ widgets for dashboard customization
 * Much more comprehensive than source apps
 */

export type WidgetType =
  | "METRIC_CARD"
  | "LINE_CHART"
  | "BAR_CHART"
  | "PIE_CHART"
  | "AREA_CHART"
  | "SCATTER_CHART"
  | "HEATMAP"
  | "GAUGE"
  | "PROGRESS_BAR"
  | "KPI_CARD"
  | "TABLE"
  | "TIMELINE"
  | "MAP"
  | "3D_VISUALIZATION"
  | "REAL_TIME_METRIC"
  | "ALERT_PANEL"
  | "TASK_LIST"
  | "CALENDAR"
  | "FORECAST"
  | "TREND_ANALYSIS"
  | "COMPARISON"
  | "DISTRIBUTION"
  | "CORRELATION"
  | "ANOMALY_DETECTION"
  | "PREDICTIVE_INSIGHT"
  | "AI_RECOMMENDATION"
  | "WORKFLOW_STATUS"
  | "RESOURCE_UTILIZATION"
  | "PERFORMANCE_MATRIX"
  | "RISK_ASSESSMENT"
  | "COMPLIANCE_SCORE"
  | "SUSTAINABILITY_METRICS"
  | "COST_ANALYSIS"
  | "REVENUE_TRACKING"
  | "CUSTOMER_SATISFACTION"
  | "EMPLOYEE_ENGAGEMENT"
  | "SUPPLY_CHAIN_STATUS"
  | "QUALITY_METRICS"
  | "SAFETY_METRICS"
  | "ENVIRONMENTAL_METRICS"
  | "TRAINING_COMPLIANCE"
  | "INCIDENT_TRACKING"
  | "AUDIT_STATUS"
  | "FEED"
  | "CUSTOM"
  | "DOCUMENT_MANAGEMENT"
  | "KNOWLEDGE_BASE"
  | "AGENT_STATUS"
  | "IOT_DEVICE_STATUS"
  | "NETWORK_TOPOLOGY"
  | "EDGE_AI_STATUS"
  | "DATA_QUALITY"
  | "API_HEALTH"
  | "SYSTEM_MONITORING"
  | "VISION_METRICS"
  | "VISION_ANALYTICS"
  | "VISION_ALERTS"
  | "VISION_QUALITY_SCORE"
  | "VISION_COMPLIANCE"
  | "VISION_ANOMALY_TRENDS"
  | "VISION_TOP_ISSUES"
  | "VISION_MODULE_BREAKDOWN"
  | "VISION_INDUSTRY_BREAKDOWN"
  | "VISION_PROCESSING_TIME"
  | "VISION_SUCCESS_RATE"
  | "STATUS_GRID";

export type WidgetCategory =
  | "METRICS"
  | "ANALYTICS"
  | "VISUALIZATION"
  | "OPERATIONS"
  | "COMPLIANCE"
  | "SAFETY"
  | "ENVIRONMENTAL"
  | "QUALITY"
  | "FINANCIAL"
  | "HUMAN_RESOURCES"
  | "SUPPLY_CHAIN"
  | "IOT"
  | "AI_ML"
  | "SYSTEM"
  | "CUSTOM";

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  type: WidgetType;
  category: WidgetCategory;
  icon: string;
  defaultSize: {
    width: number; // Grid units (1-12)
    height: number; // Grid units
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
  dataSource: {
    type: "API" | "QUERY" | "CALCULATION" | "REAL_TIME" | "AI_GENERATED";
    endpoint?: string;
    query?: string;
    calculation?: string;
    refreshInterval?: number;
  };
  configurable: boolean;
  configOptions?: {
    title?: boolean;
    colors?: boolean;
    thresholds?: boolean;
    filters?: boolean;
    dateRange?: boolean;
    aggregation?: boolean;
    [key: string]: any;
  };
  requiredPermissions?: string[];
  moduleId?: string;
  tags: string[];
  preview?: string;
}

// ============================================================================
// COMPREHENSIVE WIDGET LIBRARY (50+ Widgets)
// ============================================================================

export const widgetLibrary: WidgetDefinition[] = [
  // ============================================================================
  // METRIC CARDS (10 widgets)
  // ============================================================================
  {
    id: "metric-card-basic",
    name: "Basic Metric Card",
    description: "Display a single metric with label and value",
    type: "METRIC_CARD",
    category: "METRICS",
    icon: "ri-number-1",
    defaultSize: { width: 3, height: 2 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: { title: true, colors: true, thresholds: true },
    tags: ["metric", "kpi", "basic"],
  },
  {
    id: "metric-card-trend",
    name: "Metric Card with Trend",
    description: "Metric card showing value with trend indicator",
    type: "METRIC_CARD",
    category: "METRICS",
    icon: "ri-line-chart-line",
    defaultSize: { width: 3, height: 2 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: { title: true, colors: true, thresholds: true, trend: true },
    tags: ["metric", "kpi", "trend"],
  },
  {
    id: "metric-card-comparison",
    name: "Metric Card with Comparison",
    description: "Metric card with period-over-period comparison",
    type: "METRIC_CARD",
    category: "METRICS",
    icon: "ri-bar-chart-2-line",
    defaultSize: { width: 3, height: 2 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: {
      title: true,
      colors: true,
      comparison: true,
      dateRange: true,
    },
    tags: ["metric", "kpi", "comparison"],
  },
  {
    id: "kpi-card",
    name: "KPI Card",
    description: "Key Performance Indicator card with target and actual",
    type: "KPI_CARD",
    category: "METRICS",
    icon: "ri-target-line",
    defaultSize: { width: 4, height: 3 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: {
      title: true,
      target: true,
      actual: true,
      variance: true,
      colors: true,
    },
    tags: ["kpi", "target", "performance"],
  },
  {
    id: "gauge-metric",
    name: "Gauge Metric",
    description: "Circular gauge showing metric value against range",
    type: "GAUGE",
    category: "METRICS",
    icon: "ri-speed-line",
    defaultSize: { width: 4, height: 4 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: {
      title: true,
      min: true,
      max: true,
      thresholds: true,
      colors: true,
    },
    tags: ["gauge", "metric", "circular"],
  },
  {
    id: "progress-metric",
    name: "Progress Metric",
    description: "Progress bar showing completion percentage",
    type: "PROGRESS_BAR",
    category: "METRICS",
    icon: "ri-progress-1-line",
    defaultSize: { width: 6, height: 2 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: { title: true, percentage: true, colors: true },
    tags: ["progress", "completion", "percentage"],
  },
  {
    id: "real-time-metric",
    name: "Real-Time Metric",
    description: "Live updating metric with auto-refresh",
    type: "REAL_TIME_METRIC",
    category: "METRICS",
    icon: "ri-pulse-line",
    defaultSize: { width: 3, height: 2 },
    dataSource: { type: "REAL_TIME", refreshInterval: 5000 },
    configurable: true,
    configOptions: { title: true, refreshInterval: true, colors: true },
    tags: ["realtime", "live", "metric"],
  },
  {
    id: "multi-metric-card",
    name: "Multi-Metric Card",
    description: "Card displaying multiple related metrics",
    type: "METRIC_CARD",
    category: "METRICS",
    icon: "ri-dashboard-3-line",
    defaultSize: { width: 6, height: 3 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: { title: true, metrics: true, layout: true, colors: true },
    tags: ["metric", "multi", "grouped"],
  },
  {
    id: "sparkline-metric",
    name: "Sparkline Metric",
    description: "Metric with mini trend line",
    type: "METRIC_CARD",
    category: "METRICS",
    icon: "ri-line-chart-line",
    defaultSize: { width: 3, height: 2 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: { title: true, sparkline: true, colors: true },
    tags: ["metric", "sparkline", "trend"],
  },
  {
    id: "status-metric",
    name: "Status Metric",
    description: "Metric with status indicator (good/warning/critical)",
    type: "METRIC_CARD",
    category: "METRICS",
    icon: "ri-information-line",
    defaultSize: { width: 3, height: 2 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: {
      title: true,
      status: true,
      thresholds: true,
      colors: true,
    },
    tags: ["metric", "status", "indicator"],
  },

  // ============================================================================
  // CHARTS (15 widgets)
  // ============================================================================
  {
    id: "line-chart",
    name: "Line Chart",
    description: "Time-series line chart for trends",
    type: "LINE_CHART",
    category: "ANALYTICS",
    icon: "ri-line-chart-line",
    defaultSize: { width: 8, height: 4 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: {
      title: true,
      xAxis: true,
      yAxis: true,
      series: true,
      colors: true,
      dateRange: true,
    },
    tags: ["chart", "line", "trend", "timeseries"],
  },
  {
    id: "bar-chart",
    name: "Bar Chart",
    description: "Vertical bar chart for comparisons",
    type: "BAR_CHART",
    category: "ANALYTICS",
    icon: "ri-bar-chart-line",
    defaultSize: { width: 8, height: 4 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: {
      title: true,
      xAxis: true,
      yAxis: true,
      series: true,
      colors: true,
      aggregation: true,
    },
    tags: ["chart", "bar", "comparison"],
  },
  {
    id: "pie-chart",
    name: "Pie Chart",
    description: "Pie chart for distribution",
    type: "PIE_CHART",
    category: "ANALYTICS",
    icon: "ri-pie-chart-line",
    defaultSize: { width: 6, height: 4 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: { title: true, legend: true, colors: true },
    tags: ["chart", "pie", "distribution"],
  },
  {
    id: "area-chart",
    name: "Area Chart",
    description: "Stacked area chart for cumulative data",
    type: "AREA_CHART",
    category: "ANALYTICS",
    icon: "ri-stack-line",
    defaultSize: { width: 8, height: 4 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: {
      title: true,
      stacked: true,
      series: true,
      colors: true,
      dateRange: true,
    },
    tags: ["chart", "area", "stacked", "cumulative"],
  },
  {
    id: "scatter-chart",
    name: "Scatter Chart",
    description: "Scatter plot for correlation analysis",
    type: "SCATTER_CHART",
    category: "ANALYTICS",
    icon: "ri-scatter-chart-line",
    defaultSize: { width: 8, height: 4 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: { title: true, xAxis: true, yAxis: true, colors: true },
    tags: ["chart", "scatter", "correlation"],
  },
  {
    id: "heatmap",
    name: "Heatmap",
    description: "Heatmap for pattern visualization",
    type: "HEATMAP",
    category: "ANALYTICS",
    icon: "ri-grid-line",
    defaultSize: { width: 8, height: 6 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: { title: true, colors: true, scale: true },
    tags: ["chart", "heatmap", "pattern"],
  },
  {
    id: "forecast-chart",
    name: "Forecast Chart",
    description: "Line chart with predictive forecast",
    type: "FORECAST",
    category: "AI_ML",
    icon: "ri-lightbulb-line",
    defaultSize: { width: 8, height: 4 },
    dataSource: { type: "AI_GENERATED" },
    configurable: true,
    configOptions: {
      title: true,
      forecastPeriod: true,
      confidence: true,
      colors: true,
    },
    tags: ["chart", "forecast", "prediction", "ai"],
  },
  {
    id: "trend-analysis",
    name: "Trend Analysis",
    description: "Advanced trend analysis with multiple indicators",
    type: "TREND_ANALYSIS",
    category: "ANALYTICS",
    icon: "ri-line-chart-line",
    defaultSize: { width: 8, height: 5 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: {
      title: true,
      indicators: true,
      period: true,
      colors: true,
    },
    tags: ["chart", "trend", "analysis"],
  },
  {
    id: "comparison-chart",
    name: "Comparison Chart",
    description: "Side-by-side comparison chart",
    type: "COMPARISON",
    category: "ANALYTICS",
    icon: "ri-bar-chart-2-line",
    defaultSize: { width: 8, height: 4 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: {
      title: true,
      comparisonType: true,
      dateRange: true,
      colors: true,
    },
    tags: ["chart", "comparison", "analysis"],
  },
  {
    id: "distribution-chart",
    name: "Distribution Chart",
    description: "Statistical distribution visualization",
    type: "DISTRIBUTION",
    category: "ANALYTICS",
    icon: "ri-bar-chart-box-line",
    defaultSize: { width: 8, height: 4 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: {
      title: true,
      distributionType: true,
      bins: true,
      colors: true,
    },
    tags: ["chart", "distribution", "statistics"],
  },
  {
    id: "correlation-chart",
    name: "Correlation Chart",
    description: "Correlation matrix visualization",
    type: "CORRELATION",
    category: "ANALYTICS",
    icon: "ri-links-line",
    defaultSize: { width: 8, height: 6 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: { title: true, variables: true, method: true, colors: true },
    tags: ["chart", "correlation", "matrix"],
  },
  {
    id: "anomaly-chart",
    name: "Anomaly Detection Chart",
    description: "Chart highlighting anomalies in data",
    type: "ANOMALY_DETECTION",
    category: "AI_ML",
    icon: "ri-alert-line",
    defaultSize: { width: 8, height: 4 },
    dataSource: { type: "AI_GENERATED" },
    configurable: true,
    configOptions: {
      title: true,
      sensitivity: true,
      method: true,
      colors: true,
    },
    tags: ["chart", "anomaly", "detection", "ai"],
  },
  {
    id: "multi-series-chart",
    name: "Multi-Series Chart",
    description: "Chart with multiple data series",
    type: "LINE_CHART",
    category: "ANALYTICS",
    icon: "ri-stack-line",
    defaultSize: { width: 8, height: 4 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: { title: true, series: true, type: true, colors: true },
    tags: ["chart", "multi-series", "comparison"],
  },
  {
    id: "candlestick-chart",
    name: "Candlestick Chart",
    description: "Candlestick chart for OHLC data",
    type: "LINE_CHART",
    category: "ANALYTICS",
    icon: "ri-stock-line",
    defaultSize: { width: 8, height: 4 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: { title: true, ohlc: true, colors: true },
    tags: ["chart", "candlestick", "ohlc"],
  },
  {
    id: "waterfall-chart",
    name: "Waterfall Chart",
    description: "Waterfall chart for cumulative changes",
    type: "BAR_CHART",
    category: "ANALYTICS",
    icon: "ri-water-percent-line",
    defaultSize: { width: 8, height: 4 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: { title: true, cumulative: true, colors: true },
    tags: ["chart", "waterfall", "cumulative"],
  },

  // ============================================================================
  // OPERATIONAL WIDGETS (10 widgets)
  // ============================================================================
  {
    id: "task-list",
    name: "Task List",
    description: "List of tasks with status and priority",
    type: "TASK_LIST",
    category: "OPERATIONS",
    icon: "ri-task-line",
    defaultSize: { width: 6, height: 6 },
    dataSource: { type: "API", endpoint: "/api/tasks" },
    configurable: true,
    configOptions: { title: true, filters: true, sort: true, status: true },
    tags: ["task", "list", "operations"],
  },
  {
    id: "workflow-status",
    name: "Workflow Status",
    description: "Visual workflow status and progress",
    type: "WORKFLOW_STATUS",
    category: "OPERATIONS",
    icon: "ri-flow-chart-line",
    defaultSize: { width: 8, height: 4 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: { title: true, workflow: true, status: true, colors: true },
    tags: ["workflow", "status", "process"],
  },
  {
    id: "resource-utilization",
    name: "Resource Utilization",
    description: "Resource usage and capacity metrics",
    type: "RESOURCE_UTILIZATION",
    category: "OPERATIONS",
    icon: "ri-cpu-line",
    defaultSize: { width: 6, height: 4 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: {
      title: true,
      resources: true,
      capacity: true,
      colors: true,
    },
    tags: ["resource", "utilization", "capacity"],
  },
  {
    id: "performance-matrix",
    name: "Performance Matrix",
    description: "Performance metrics in matrix format",
    type: "PERFORMANCE_MATRIX",
    category: "OPERATIONS",
    icon: "ri-grid-line",
    defaultSize: { width: 8, height: 6 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: {
      title: true,
      metrics: true,
      dimensions: true,
      colors: true,
    },
    tags: ["performance", "matrix", "metrics"],
  },
  {
    id: "alert-panel",
    name: "Alert Panel",
    description: "Panel displaying active alerts and notifications",
    type: "ALERT_PANEL",
    category: "OPERATIONS",
    icon: "ri-alarm-line",
    defaultSize: { width: 6, height: 6 },
    dataSource: { type: "REAL_TIME", refreshInterval: 5000 },
    configurable: true,
    configOptions: {
      title: true,
      severity: true,
      filters: true,
      autoRefresh: true,
    },
    tags: ["alert", "notification", "realtime"],
  },
  {
    id: "timeline",
    name: "Timeline",
    description: "Timeline visualization of events",
    type: "TIMELINE",
    category: "OPERATIONS",
    icon: "ri-time-line",
    defaultSize: { width: 8, height: 5 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: { title: true, dateRange: true, events: true, colors: true },
    tags: ["timeline", "events", "history"],
  },
  {
    id: "calendar",
    name: "Calendar",
    description: "Calendar widget with events and milestones",
    type: "CALENDAR",
    category: "OPERATIONS",
    icon: "ri-calendar-line",
    defaultSize: { width: 6, height: 6 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: { title: true, view: true, events: true, filters: true },
    tags: ["calendar", "events", "schedule"],
  },
  {
    id: "table-widget",
    name: "Data Table",
    description: "Sortable and filterable data table",
    type: "TABLE",
    category: "OPERATIONS",
    icon: "ri-table-line",
    defaultSize: { width: 12, height: 6 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: {
      title: true,
      columns: true,
      sort: true,
      filters: true,
      pagination: true,
    },
    tags: ["table", "data", "list"],
  },
  {
    id: "supply-chain-status",
    name: "Supply Chain Status",
    description: "End-to-end supply chain visibility",
    type: "SUPPLY_CHAIN_STATUS",
    category: "SUPPLY_CHAIN",
    icon: "ri-truck-line",
    defaultSize: { width: 8, height: 5 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: { title: true, stages: true, status: true, colors: true },
    tags: ["supply-chain", "logistics", "status"],
  },
  {
    id: "api-health",
    name: "API Health Monitor",
    description: "API endpoint health and status",
    type: "API_HEALTH",
    category: "SYSTEM",
    icon: "ri-heart-pulse-line",
    defaultSize: { width: 6, height: 4 },
    dataSource: { type: "REAL_TIME", refreshInterval: 10000 },
    configurable: true,
    configOptions: {
      title: true,
      endpoints: true,
      status: true,
      latency: true,
    },
    tags: ["api", "health", "monitoring", "system"],
  },

  // ============================================================================
  // COMPLIANCE & SAFETY WIDGETS (8 widgets)
  // ============================================================================
  {
    id: "compliance-score",
    name: "Compliance Score",
    description: "Overall compliance score with breakdown",
    type: "COMPLIANCE_SCORE",
    category: "COMPLIANCE",
    icon: "ri-shield-check-line",
    defaultSize: { width: 6, height: 4 },
    dataSource: { type: "API", endpoint: "/api/compliance/score" },
    configurable: true,
    configOptions: {
      title: true,
      breakdown: true,
      thresholds: true,
      colors: true,
    },
    tags: ["compliance", "score", "regulatory"],
  },
  {
    id: "risk-assessment",
    name: "Risk Assessment",
    description: "Risk matrix and assessment visualization",
    type: "RISK_ASSESSMENT",
    category: "COMPLIANCE",
    icon: "ri-shield-cross-line",
    defaultSize: { width: 8, height: 5 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: { title: true, matrix: true, risks: true, colors: true },
    tags: ["risk", "assessment", "matrix"],
  },
  {
    id: "safety-metrics",
    name: "Safety Metrics",
    description: "TRIR, LTIFR, and safety performance",
    type: "SAFETY_METRICS",
    category: "SAFETY",
    icon: "ri-shield-star-line",
    defaultSize: { width: 6, height: 4 },
    dataSource: { type: "API", endpoint: "/api/qhse/safety-metrics" },
    configurable: true,
    configOptions: { title: true, metrics: true, period: true, colors: true },
    tags: ["safety", "trir", "ltifr", "qhse"],
  },
  {
    id: "incident-tracking",
    name: "Incident Tracking",
    description: "Track and monitor safety incidents",
    type: "INCIDENT_TRACKING",
    category: "SAFETY",
    icon: "ri-error-warning-line",
    defaultSize: { width: 8, height: 5 },
    dataSource: { type: "API", endpoint: "/api/qhse/incidents" },
    configurable: true,
    configOptions: { title: true, filters: true, status: true, severity: true },
    tags: ["incident", "safety", "tracking", "qhse"],
  },
  {
    id: "audit-status",
    name: "Audit Status",
    description: "Regulatory audit status and schedule",
    type: "AUDIT_STATUS",
    category: "COMPLIANCE",
    icon: "ri-file-search-line",
    defaultSize: { width: 6, height: 4 },
    dataSource: { type: "API", endpoint: "/api/qhse/regulatory" },
    configurable: true,
    configOptions: { title: true, status: true, schedule: true, filters: true },
    tags: ["audit", "regulatory", "compliance"],
  },
  {
    id: "environmental-metrics",
    name: "Environmental Metrics",
    description: "Carbon footprint, waste, energy metrics",
    type: "ENVIRONMENTAL_METRICS",
    category: "ENVIRONMENTAL",
    icon: "ri-leaf-line",
    defaultSize: { width: 6, height: 4 },
    dataSource: { type: "API", endpoint: "/api/qhse/environmental" },
    configurable: true,
    configOptions: { title: true, metrics: true, period: true, colors: true },
    tags: ["environmental", "carbon", "sustainability", "qhse"],
  },
  {
    id: "quality-metrics",
    name: "Quality Metrics",
    description: "Quality performance and defect tracking",
    type: "QUALITY_METRICS",
    category: "QUALITY",
    icon: "ri-award-line",
    defaultSize: { width: 6, height: 4 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: { title: true, metrics: true, defects: true, colors: true },
    tags: ["quality", "defect", "performance"],
  },
  {
    id: "training-compliance",
    name: "Training Compliance",
    description: "Training completion and certification status",
    type: "TRAINING_COMPLIANCE",
    category: "COMPLIANCE",
    icon: "ri-graduation-cap-line",
    defaultSize: { width: 6, height: 4 },
    dataSource: { type: "API", endpoint: "/api/qhse/training" },
    configurable: true,
    configOptions: {
      title: true,
      compliance: true,
      expiry: true,
      filters: true,
    },
    tags: ["training", "compliance", "certification", "qhse"],
  },

  // ============================================================================
  // AI VISION WIDGETS (10 widgets)
  // ============================================================================
  {
    id: "vision-metrics",
    name: "Vision Metrics",
    description: "Real-time AI vision analysis metrics",
    type: "VISION_METRICS",
    category: "AI_ML",
    icon: "ri-eye-line",
    defaultSize: { width: 6, height: 4 },
    dataSource: {
      type: "REAL_TIME",
      endpoint: "/api/ai/vision/metrics",
      refreshInterval: 30000,
    },
    configurable: true,
    configOptions: { title: true, timeframe: true, module: true, colors: true },
    tags: ["vision", "ai", "metrics", "realtime"],
  },
  {
    id: "vision-analytics",
    name: "Vision Analytics",
    description: "Comprehensive vision analysis statistics",
    type: "VISION_ANALYTICS",
    category: "AI_ML",
    icon: "ri-bar-chart-box-line",
    defaultSize: { width: 8, height: 5 },
    dataSource: { type: "API", endpoint: "/api/ai/vision/metrics" },
    configurable: true,
    configOptions: {
      title: true,
      timeframe: true,
      module: true,
      chartType: true,
      colors: true,
    },
    tags: ["vision", "ai", "analytics", "charts"],
  },
  {
    id: "vision-alerts",
    name: "Vision Alerts",
    description: "Real-time vision analysis alerts",
    type: "VISION_ALERTS",
    category: "AI_ML",
    icon: "ri-alert-line",
    defaultSize: { width: 6, height: 5 },
    dataSource: {
      type: "REAL_TIME",
      endpoint: "/api/ai/vision/metrics",
      refreshInterval: 10000,
    },
    configurable: true,
    configOptions: { title: true, severity: true, limit: true, colors: true },
    tags: ["vision", "ai", "alerts", "realtime"],
  },
  {
    id: "vision-quality-score",
    name: "Vision Quality Score",
    description: "Average quality score from vision analyses",
    type: "VISION_QUALITY_SCORE",
    category: "AI_ML",
    icon: "ri-star-line",
    defaultSize: { width: 4, height: 3 },
    dataSource: { type: "API", endpoint: "/api/ai/vision/metrics" },
    configurable: true,
    configOptions: {
      title: true,
      timeframe: true,
      threshold: true,
      colors: true,
    },
    tags: ["vision", "ai", "quality", "score"],
  },
  {
    id: "vision-compliance",
    name: "Vision Compliance Rate",
    description: "Compliance rate from vision analyses",
    type: "VISION_COMPLIANCE",
    category: "AI_ML",
    icon: "ri-shield-check-line",
    defaultSize: { width: 4, height: 3 },
    dataSource: { type: "API", endpoint: "/api/ai/vision/metrics" },
    configurable: true,
    configOptions: {
      title: true,
      timeframe: true,
      threshold: true,
      colors: true,
    },
    tags: ["vision", "ai", "compliance", "rate"],
  },
  {
    id: "vision-anomaly-trends",
    name: "Vision Anomaly Trends",
    description: "Trend chart of anomalies detected over time",
    type: "VISION_ANOMALY_TRENDS",
    category: "AI_ML",
    icon: "ri-line-chart-line",
    defaultSize: { width: 8, height: 4 },
    dataSource: { type: "API", endpoint: "/api/ai/vision/metrics" },
    configurable: true,
    configOptions: {
      title: true,
      timeframe: true,
      chartType: true,
      colors: true,
    },
    tags: ["vision", "ai", "anomaly", "trends", "chart"],
  },
  {
    id: "vision-top-issues",
    name: "Vision Top Issues",
    description: "Most common issues detected by vision analysis",
    type: "VISION_TOP_ISSUES",
    category: "AI_ML",
    icon: "ri-list-check",
    defaultSize: { width: 6, height: 5 },
    dataSource: { type: "API", endpoint: "/api/ai/vision/metrics" },
    configurable: true,
    configOptions: { title: true, limit: true, severity: true, colors: true },
    tags: ["vision", "ai", "issues", "top"],
  },
  {
    id: "vision-module-breakdown",
    name: "Vision Module Breakdown",
    description: "Analyses breakdown by module (WMS, QHSE, etc.)",
    type: "VISION_MODULE_BREAKDOWN",
    category: "AI_ML",
    icon: "ri-pie-chart-line",
    defaultSize: { width: 6, height: 4 },
    dataSource: { type: "API", endpoint: "/api/ai/vision/metrics" },
    configurable: true,
    configOptions: { title: true, chartType: true, colors: true },
    tags: ["vision", "ai", "module", "breakdown", "chart"],
  },
  {
    id: "vision-industry-breakdown",
    name: "Vision Industry Breakdown",
    description: "Analyses breakdown by industry",
    type: "VISION_INDUSTRY_BREAKDOWN",
    category: "AI_ML",
    icon: "ri-building-line",
    defaultSize: { width: 6, height: 4 },
    dataSource: { type: "API", endpoint: "/api/ai/vision/metrics" },
    configurable: true,
    configOptions: { title: true, chartType: true, colors: true },
    tags: ["vision", "ai", "industry", "breakdown", "chart"],
  },
  {
    id: "vision-processing-time",
    name: "Vision Processing Time",
    description: "Average processing time for vision analyses",
    type: "VISION_PROCESSING_TIME",
    category: "AI_ML",
    icon: "ri-time-line",
    defaultSize: { width: 4, height: 3 },
    dataSource: { type: "API", endpoint: "/api/ai/vision/metrics" },
    configurable: true,
    configOptions: {
      title: true,
      timeframe: true,
      threshold: true,
      colors: true,
    },
    tags: ["vision", "ai", "performance", "time"],
  },
  {
    id: "vision-success-rate",
    name: "Vision Success Rate",
    description: "Success rate of vision analyses",
    type: "VISION_SUCCESS_RATE",
    category: "AI_ML",
    icon: "ri-checkbox-circle-line",
    defaultSize: { width: 4, height: 3 },
    dataSource: { type: "API", endpoint: "/api/ai/vision/metrics" },
    configurable: true,
    configOptions: {
      title: true,
      timeframe: true,
      threshold: true,
      colors: true,
    },
    tags: ["vision", "ai", "success", "rate"],
  },

  // ============================================================================
  // AI & INTELLIGENCE WIDGETS (7 widgets)
  // ============================================================================
  {
    id: "predictive-insight",
    name: "Predictive Insight",
    description: "AI-powered predictive insights and forecasts",
    type: "PREDICTIVE_INSIGHT",
    category: "AI_ML",
    icon: "ri-lightbulb-flash-line",
    defaultSize: { width: 8, height: 5 },
    dataSource: { type: "AI_GENERATED" },
    configurable: true,
    configOptions: { title: true, model: true, confidence: true, period: true },
    tags: ["ai", "prediction", "insight", "forecast"],
  },
  {
    id: "ai-recommendation",
    name: "AI Recommendations",
    description: "AI-generated recommendations and suggestions",
    type: "AI_RECOMMENDATION",
    category: "AI_ML",
    icon: "ri-magic-line",
    defaultSize: { width: 6, height: 6 },
    dataSource: { type: "AI_GENERATED" },
    configurable: true,
    configOptions: {
      title: true,
      category: true,
      priority: true,
      actions: true,
    },
    tags: ["ai", "recommendation", "suggestion"],
  },
  {
    id: "anomaly-detection",
    name: "Anomaly Detection",
    description: "AI-powered anomaly detection and alerts",
    type: "ANOMALY_DETECTION",
    category: "AI_ML",
    icon: "ri-alert-line",
    defaultSize: { width: 8, height: 5 },
    dataSource: { type: "AI_GENERATED" },
    configurable: true,
    configOptions: {
      title: true,
      sensitivity: true,
      method: true,
      alerts: true,
    },
    tags: ["ai", "anomaly", "detection", "alert"],
  },
  {
    id: "knowledge-base",
    name: "Knowledge Base",
    description: "Searchable knowledge base widget",
    type: "KNOWLEDGE_BASE",
    category: "AI_ML",
    icon: "ri-book-open-line",
    defaultSize: { width: 6, height: 6 },
    dataSource: { type: "API", endpoint: "/api/knowledge-base" },
    configurable: true,
    configOptions: {
      title: true,
      search: true,
      filters: true,
      categories: true,
    },
    tags: ["knowledge", "search", "ai"],
  },
  {
    id: "agent-status",
    name: "Agent Status",
    description: "AI agent status and activity",
    type: "AGENT_STATUS",
    category: "AI_ML",
    icon: "ri-robot-line",
    defaultSize: { width: 6, height: 4 },
    dataSource: { type: "API", endpoint: "/api/agents" },
    configurable: true,
    configOptions: { title: true, agents: true, status: true, activity: true },
    tags: ["agent", "ai", "status"],
  },
  {
    id: "data-quality",
    name: "Data Quality Monitor",
    description: "Data quality metrics and issues",
    type: "DATA_QUALITY",
    category: "AI_ML",
    icon: "ri-database-2-line",
    defaultSize: { width: 6, height: 4 },
    dataSource: { type: "API" },
    configurable: true,
    configOptions: {
      title: true,
      metrics: true,
      issues: true,
      thresholds: true,
    },
    tags: ["data", "quality", "monitoring"],
  },
  {
    id: "ml-model-status",
    name: "ML Model Status",
    description: "Machine learning model performance and status",
    type: "PREDICTIVE_INSIGHT",
    category: "AI_ML",
    icon: "ri-brain-line",
    defaultSize: { width: 6, height: 4 },
    dataSource: { type: "API", endpoint: "/api/ml-registry" },
    configurable: true,
    configOptions: {
      title: true,
      models: true,
      performance: true,
      status: true,
    },
    tags: ["ml", "model", "ai", "performance"],
  },
  // ============================================================================
  // FACILITY MANAGEMENT WIDGETS (10 widgets)
  // ============================================================================
  {
    id: "facility-asset-status",
    name: "Asset Status Overview",
    description: "Real-time asset status distribution",
    type: "PIE_CHART",
    category: "OPERATIONS",
    icon: "ri-tools-line",
    defaultSize: { width: 6, height: 4 },
    dataSource: { type: "API", endpoint: "/api/facility/assets" },
    configurable: true,
    configOptions: { title: true, colors: true, legend: true },
    tags: ["facility", "assets", "status", "distribution"],
  },
  {
    id: "facility-maintenance-alerts",
    name: "Maintenance Alerts",
    description: "Critical maintenance alerts and overdue tasks",
    type: "ALERT_PANEL",
    category: "OPERATIONS",
    icon: "ri-alert-line",
    defaultSize: { width: 8, height: 4 },
    dataSource: { type: "API", endpoint: "/api/facility/maintenance/alerts" },
    configurable: true,
    configOptions: { title: true, priority: true, filters: true },
    tags: ["facility", "maintenance", "alerts", "critical"],
  },
  {
    id: "facility-energy-consumption",
    name: "Energy Consumption",
    description: "Real-time energy consumption and cost tracking",
    type: "LINE_CHART",
    category: "ENVIRONMENTAL",
    icon: "ri-flashlight-line",
    defaultSize: { width: 8, height: 4 },
    dataSource: { type: "API", endpoint: "/api/facility/energy/consumption" },
    configurable: true,
    configOptions: { title: true, dateRange: true, series: true, colors: true },
    tags: ["facility", "energy", "consumption", "cost", "sustainability"],
  },
  {
    id: "facility-work-orders",
    name: "Work Orders Status",
    description: "Active work orders by status and priority",
    type: "BAR_CHART",
    category: "OPERATIONS",
    icon: "ri-file-list-line",
    defaultSize: { width: 8, height: 4 },
    dataSource: { type: "API", endpoint: "/api/facility/work-orders" },
    configurable: true,
    configOptions: { title: true, stacked: true, series: true, colors: true },
    tags: ["facility", "work-orders", "maintenance", "operations"],
  },
  {
    id: "facility-compliance-score",
    name: "Compliance Score",
    description: "Regulatory compliance score and status",
    type: "GAUGE",
    category: "COMPLIANCE",
    icon: "ri-shield-check-line",
    defaultSize: { width: 6, height: 4 },
    dataSource: { type: "API", endpoint: "/api/facility/compliance/score" },
    configurable: true,
    configOptions: { title: true, thresholds: true, colors: true },
    tags: ["facility", "compliance", "regulatory", "score"],
  },
  {
    id: "facility-space-utilization",
    name: "Space Utilization",
    description: "Facility space utilization and optimization",
    type: "PROGRESS_BAR",
    category: "OPERATIONS",
    icon: "ri-layout-grid-line",
    defaultSize: { width: 8, height: 4 },
    dataSource: { type: "API", endpoint: "/api/facility/spaces/utilization" },
    configurable: true,
    configOptions: { title: true, thresholds: true, colors: true },
    tags: ["facility", "space", "utilization", "optimization"],
  },
  {
    id: "facility-iot-devices",
    name: "IoT Devices Status",
    description: "Smart building IoT device status and health",
    type: "STATUS_GRID",
    category: "IOT",
    icon: "ri-sensor-line",
    defaultSize: { width: 8, height: 4 },
    dataSource: { type: "API", endpoint: "/api/facility/iot/devices" },
    configurable: true,
    configOptions: { title: true, filters: true, colors: true },
    tags: ["facility", "iot", "smart-building", "devices"],
  },
  {
    id: "facility-license-expiry",
    name: "License Expiry Alerts",
    description: "Upcoming license and permit expiration dates",
    type: "ALERT_PANEL",
    category: "COMPLIANCE",
    icon: "ri-file-paper-2-line",
    defaultSize: { width: 8, height: 4 },
    dataSource: { type: "API", endpoint: "/api/facility/licenses/expiring" },
    configurable: true,
    configOptions: { title: true, dateRange: true, filters: true },
    tags: ["facility", "licenses", "permits", "compliance", "expiry"],
  },
  {
    id: "facility-carbon-footprint",
    name: "Carbon Footprint",
    description: "Carbon emissions tracking and ESG metrics",
    type: "AREA_CHART",
    category: "ENVIRONMENTAL",
    icon: "ri-leaf-line",
    defaultSize: { width: 8, height: 4 },
    dataSource: { type: "API", endpoint: "/api/facility/energy/carbon" },
    configurable: true,
    configOptions: { title: true, dateRange: true, series: true, colors: true },
    tags: ["facility", "carbon", "emissions", "esg", "sustainability"],
  },
  {
    id: "facility-predictive-maintenance",
    name: "Predictive Maintenance",
    description: "AI-powered failure predictions and recommendations",
    type: "PREDICTIVE_INSIGHT",
    category: "AI_ML",
    icon: "ri-brain-line",
    defaultSize: { width: 8, height: 4 },
    dataSource: {
      type: "API",
      endpoint: "/api/facility/maintenance/predictions",
    },
    configurable: true,
    configOptions: { title: true, confidence: true, filters: true },
    tags: ["facility", "predictive", "maintenance", "ai", "ml"],
  },
  // ============================================================================
  // EXTERNAL INTEGRATIONS (5 widgets)
  // ============================================================================
  {
    id: "integration-linkedin-feed",
    name: "LinkedIn Feed",
    description: "Display LinkedIn posts and updates",
    type: "FEED",
    category: "CUSTOM",
    icon: "ri-linkedin-fill",
    defaultSize: { width: 6, height: 8 },
    dataSource: {
      type: "API",
      endpoint: "/api/integrations/{integrationId}/data",
      refreshInterval: 300000, // 5 minutes
    },
    configurable: true,
    configOptions: {
      title: true,
      integrationId: true,
      maxPosts: true,
      showEngagement: true,
    },
    moduleId: "integration",
    tags: ["linkedin", "social", "feed", "integration"],
  },
  {
    id: "integration-telegram-messages",
    name: "Telegram Messages",
    description: "Display Telegram messages and conversations",
    type: "FEED",
    category: "CUSTOM",
    icon: "ri-telegram-fill",
    defaultSize: { width: 6, height: 8 },
    dataSource: {
      type: "REAL_TIME",
      endpoint: "/api/integrations/{integrationId}/data",
      refreshInterval: 30000, // 30 seconds
    },
    configurable: true,
    configOptions: {
      title: true,
      integrationId: true,
      maxMessages: true,
      showTimestamps: true,
    },
    moduleId: "integration",
    tags: ["telegram", "messaging", "real-time", "integration"],
  },
  {
    id: "integration-news-feed",
    name: "News Feed",
    description: "Display articles from RSS feeds and news sites",
    type: "FEED",
    category: "CUSTOM",
    icon: "ri-rss-fill",
    defaultSize: { width: 6, height: 8 },
    dataSource: {
      type: "API",
      endpoint: "/api/integrations/{integrationId}/data",
      refreshInterval: 3600000, // 1 hour
    },
    configurable: true,
    configOptions: {
      title: true,
      integrationId: true,
      maxArticles: true,
      filters: true,
      showCategories: true,
    },
    moduleId: "integration",
    tags: ["news", "rss", "articles", "integration"],
  },
  {
    id: "integration-whatsapp-messages",
    name: "WhatsApp Messages",
    description: "Display WhatsApp messages and conversations",
    type: "FEED",
    category: "CUSTOM",
    icon: "ri-whatsapp-fill",
    defaultSize: { width: 6, height: 8 },
    dataSource: {
      type: "REAL_TIME",
      endpoint: "/api/integrations/{integrationId}/data",
      refreshInterval: 30000, // 30 seconds
    },
    configurable: true,
    configOptions: {
      title: true,
      integrationId: true,
      maxMessages: true,
      showTimestamps: true,
    },
    moduleId: "integration",
    tags: ["whatsapp", "messaging", "real-time", "integration"],
  },
  {
    id: "integration-embedded-site",
    name: "Embedded Website",
    description: "Embed any website as an iframe widget",
    type: "CUSTOM",
    category: "CUSTOM",
    icon: "ri-global-line",
    defaultSize: { width: 12, height: 10 },
    dataSource: {
      type: "API",
      endpoint: "/api/integrations/{integrationId}",
    },
    configurable: true,
    configOptions: {
      title: true,
      integrationId: true,
      allowFullscreen: true,
      sandbox: true,
    },
    moduleId: "integration",
    tags: ["iframe", "embed", "website", "integration"],
  },
];

// ============================================================================
// WIDGET LIBRARY SERVICE
// ============================================================================

export class WidgetLibraryService {
  /**
   * Get all widgets
   */
  getAllWidgets(): WidgetDefinition[] {
    return widgetLibrary;
  }

  /**
   * Get widgets by category
   */
  getWidgetsByCategory(category: WidgetCategory): WidgetDefinition[] {
    return widgetLibrary.filter((w) => w.category === category);
  }

  /**
   * Get widgets by type
   */
  getWidgetsByType(type: WidgetType): WidgetDefinition[] {
    return widgetLibrary.filter((w) => w.type === type);
  }

  /**
   * Get widget by ID
   */
  getWidgetById(id: string): WidgetDefinition | undefined {
    return widgetLibrary.find((w) => w.id === id);
  }

  /**
   * Search widgets
   */
  searchWidgets(query: string): WidgetDefinition[] {
    const lowerQuery = query.toLowerCase();
    return widgetLibrary.filter(
      (w) =>
        w.name.toLowerCase().includes(lowerQuery) ||
        w.description.toLowerCase().includes(lowerQuery) ||
        w.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
    );
  }

  /**
   * Get widgets by module
   */
  getWidgetsByModule(moduleId: string): WidgetDefinition[] {
    return widgetLibrary.filter((w) => w.moduleId === moduleId);
  }

  /**
   * Get recommended widgets for module
   */
  getRecommendedWidgets(moduleId: string): WidgetDefinition[] {
    // Return widgets that are commonly used with this module
    const moduleWidgets = this.getWidgetsByModule(moduleId);
    const categoryWidgets = widgetLibrary.filter(
      (w) =>
        !w.moduleId &&
        ((moduleId === "qhse" &&
          ["SAFETY", "ENVIRONMENTAL", "COMPLIANCE"].includes(w.category)) ||
          (moduleId === "wms" &&
            ["OPERATIONS", "SUPPLY_CHAIN"].includes(w.category)) ||
          (moduleId === "iso-ims" &&
            ["COMPLIANCE", "QUALITY"].includes(w.category))),
    );
    return [...moduleWidgets, ...categoryWidgets].slice(0, 10);
  }
}

export const widgetLibraryService = new WidgetLibraryService();
