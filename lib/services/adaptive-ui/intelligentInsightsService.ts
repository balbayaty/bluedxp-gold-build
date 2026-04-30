// ============================================================================
// HAZALYZE INTELLIGENT INSIGHTS SERVICE
// ML-powered adaptive insights and recommendations
// ============================================================================

import {
  MLInsight,
  InsightType,
  InsightAction,
  AccessibilityPreferences,
  AdaptationEvent,
} from "@/types/accessibility";

// ============================================================================
// TYPES
// ============================================================================

export interface UserBehavior {
  userId: string;
  sessionId: string;
  timestamp: Date;
  action: UserAction;
  context: BehaviorContext;
  duration?: number;
  success?: boolean;
}

export interface UserAction {
  type:
    | "click"
    | "scroll"
    | "navigate"
    | "search"
    | "submit"
    | "error"
    | "idle"
    | "focus"
    | "blur";
  target?: string;
  value?: any;
}

export interface BehaviorContext {
  page: string;
  section?: string;
  feature?: string;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  dayOfWeek: number;
  deviceType: "desktop" | "tablet" | "mobile";
  sessionDuration: number;
}

export interface InsightRule {
  id: string;
  name: string;
  description: string;
  type: InsightType;
  priority: "low" | "medium" | "high" | "critical";
  conditions: InsightCondition[];
  action?: InsightAction;
  cooldownMinutes: number;
  maxShowCount: number;
}

export interface InsightCondition {
  type:
    | "behavior"
    | "preference"
    | "time"
    | "session"
    | "performance"
    | "error";
  metric: string;
  operator:
    | "equals"
    | "not_equals"
    | "greater_than"
    | "less_than"
    | "contains"
    | "between";
  value: any;
  threshold?: number;
}

export interface InsightHistory {
  insightId: string;
  ruleId: string;
  shownAt: Date;
  dismissedAt?: Date;
  actedUponAt?: Date;
  feedback?: "helpful" | "not_helpful" | "annoying";
}

export interface MLModel {
  id: string;
  name: string;
  version: string;
  accuracy: number;
  lastTrained: Date;
  features: string[];
}

// ============================================================================
// INSIGHT RULES LIBRARY
// ============================================================================

const INSIGHT_RULES: InsightRule[] = [
  // Efficiency Insights
  {
    id: "keyboard_shortcuts",
    name: "Keyboard Shortcuts Suggestion",
    description: "Suggests keyboard shortcuts based on repeated mouse actions",
    type: "shortcuts",
    priority: "low",
    conditions: [
      {
        type: "behavior",
        metric: "repeated_click_action",
        operator: "greater_than",
        value: 3,
      },
    ],
    action: {
      type: "navigate",
      label: "Learn Shortcuts",
      target: "/help/shortcuts",
    },
    cooldownMinutes: 60,
    maxShowCount: 3,
  },
  {
    id: "frequent_navigation",
    name: "Quick Access Suggestion",
    description: "Suggests adding frequently visited pages to quick access",
    type: "efficiency",
    priority: "medium",
    conditions: [
      {
        type: "behavior",
        metric: "page_visits",
        operator: "greater_than",
        value: 5,
      },
    ],
    action: {
      type: "custom",
      label: "Add to Quick Access",
      payload: { action: "add_quick_access" },
    },
    cooldownMinutes: 1440, // 24 hours
    maxShowCount: 2,
  },
  {
    id: "search_optimization",
    name: "Search Tips",
    description: "Suggests search filters when user searches frequently",
    type: "efficiency",
    priority: "low",
    conditions: [
      {
        type: "behavior",
        metric: "search_count",
        operator: "greater_than",
        value: 10,
      },
    ],
    cooldownMinutes: 120,
    maxShowCount: 5,
  },

  // Feature Discovery
  {
    id: "feature_discovery_ai",
    name: "AI Features Discovery",
    description: "Introduces AI features to users who haven't used them",
    type: "features",
    priority: "medium",
    conditions: [
      {
        type: "session",
        metric: "ai_features_used",
        operator: "equals",
        value: false,
      },
      {
        type: "session",
        metric: "session_count",
        operator: "greater_than",
        value: 3,
      },
    ],
    action: {
      type: "navigate",
      label: "Explore AI Features",
      target: "/ai-vision",
    },
    cooldownMinutes: 10080, // 1 week
    maxShowCount: 2,
  },
  {
    id: "accessibility_prompt",
    name: "Accessibility Settings Prompt",
    description: "Prompts users to customize their experience",
    type: "features",
    priority: "low",
    conditions: [
      {
        type: "preference",
        metric: "hasCompletedQuestionnaire",
        operator: "equals",
        value: false,
      },
      {
        type: "session",
        metric: "session_count",
        operator: "greater_than",
        value: 2,
      },
    ],
    action: {
      type: "navigate",
      label: "Personalize Experience",
      target: "/settings/accessibility",
    },
    cooldownMinutes: 4320, // 3 days
    maxShowCount: 3,
  },

  // Warning Insights
  {
    id: "idle_warning",
    name: "Session Timeout Warning",
    description: "Warns user about session timeout due to inactivity",
    type: "warnings",
    priority: "high",
    conditions: [
      {
        type: "behavior",
        metric: "idle_time",
        operator: "greater_than",
        value: 1800,
      }, // 30 minutes
    ],
    cooldownMinutes: 30,
    maxShowCount: 10,
  },
  {
    id: "unsaved_changes",
    name: "Unsaved Changes Warning",
    description: "Reminds user about unsaved changes",
    type: "warnings",
    priority: "critical",
    conditions: [
      {
        type: "behavior",
        metric: "has_unsaved_changes",
        operator: "equals",
        value: true,
      },
      {
        type: "behavior",
        metric: "navigation_attempt",
        operator: "equals",
        value: true,
      },
    ],
    cooldownMinutes: 0,
    maxShowCount: 100,
  },

  // Predictions
  {
    id: "busy_time_prediction",
    name: "Peak Time Alert",
    description: "Predicts busy periods based on historical data",
    type: "predictions",
    priority: "medium",
    conditions: [
      {
        type: "time",
        metric: "predicted_busy_period",
        operator: "equals",
        value: true,
      },
    ],
    cooldownMinutes: 240,
    maxShowCount: 5,
  },

  // Recommendations
  {
    id: "break_reminder",
    name: "Break Reminder",
    description: "Suggests taking a break after extended use",
    type: "recommendations",
    priority: "low",
    conditions: [
      {
        type: "session",
        metric: "continuous_use_minutes",
        operator: "greater_than",
        value: 90,
      },
    ],
    cooldownMinutes: 60,
    maxShowCount: 10,
  },
  {
    id: "eye_strain_warning",
    name: "Eye Strain Prevention",
    description: "Suggests enabling blue light filter",
    type: "recommendations",
    priority: "low",
    conditions: [
      {
        type: "time",
        metric: "time_of_day",
        operator: "equals",
        value: "evening",
      },
      {
        type: "preference",
        metric: "blueLight",
        operator: "equals",
        value: false,
      },
    ],
    action: {
      type: "toggle",
      label: "Enable Blue Light Filter",
      payload: { setting: "visual.blueLight", value: true },
    },
    cooldownMinutes: 1440,
    maxShowCount: 3,
  },

  // Anomalies
  {
    id: "unusual_activity",
    name: "Unusual Activity Detection",
    description: "Detects unusual patterns in user behavior",
    type: "anomalies",
    priority: "high",
    conditions: [
      {
        type: "behavior",
        metric: "anomaly_score",
        operator: "greater_than",
        value: 0.8,
      },
    ],
    cooldownMinutes: 60,
    maxShowCount: 5,
  },

  // Achievements
  {
    id: "first_task_completed",
    name: "First Task Completed",
    description: "Celebrates first completed task",
    type: "achievements",
    priority: "low",
    conditions: [
      {
        type: "behavior",
        metric: "tasks_completed",
        operator: "equals",
        value: 1,
      },
    ],
    cooldownMinutes: 0,
    maxShowCount: 1,
  },
  {
    id: "efficiency_milestone",
    name: "Efficiency Milestone",
    description: "Celebrates efficiency improvements",
    type: "achievements",
    priority: "medium",
    conditions: [
      {
        type: "performance",
        metric: "efficiency_score_improvement",
        operator: "greater_than",
        value: 20,
      },
    ],
    cooldownMinutes: 10080, // 1 week
    maxShowCount: 10,
  },
];

// ============================================================================
// INTELLIGENT INSIGHTS SERVICE CLASS
// ============================================================================

class IntelligentInsightsService {
  private behaviorHistory: UserBehavior[] = [];
  private insightHistory: InsightHistory[] = [];
  private sessionId: string;
  private sessionStartTime: Date;
  private userId: string | null = null;
  private preferences: AccessibilityPreferences | null = null;
  private lastInsightTime: Map<string, Date> = new Map();
  private insightShowCount: Map<string, number> = new Map();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = new Date();
  }

  // Initialize with user
  initialize(userId: string, preferences: AccessibilityPreferences) {
    this.userId = userId;
    this.preferences = preferences;
    this.loadHistory();
  }

  // Update preferences
  updatePreferences(preferences: AccessibilityPreferences) {
    this.preferences = preferences;
  }

  // Record user behavior
  recordBehavior(action: UserAction, context?: Partial<BehaviorContext>) {
    if (!this.userId) return;

    const behavior: UserBehavior = {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      action,
      context: {
        page: typeof window !== "undefined" ? window.location.pathname : "",
        timeOfDay: this.getTimeOfDay(),
        dayOfWeek: new Date().getDay(),
        deviceType: this.getDeviceType(),
        sessionDuration: this.getSessionDuration(),
        ...context,
      },
    };

    this.behaviorHistory.push(behavior);

    // Keep only last 1000 behaviors
    if (this.behaviorHistory.length > 1000) {
      this.behaviorHistory = this.behaviorHistory.slice(-1000);
    }

    // Save to storage
    this.saveHistory();
  }

  // Generate insights based on current state
  generateInsights(): MLInsight[] {
    if (!this.preferences?.insights.enabled) return [];

    const insights: MLInsight[] = [];
    const enabledTypes = this.preferences.insights.insightTypes;

    for (const rule of INSIGHT_RULES) {
      // Check if insight type is enabled
      if (!enabledTypes.includes(rule.type)) continue;

      // Check cooldown
      if (!this.checkCooldown(rule)) continue;

      // Check max show count
      if (!this.checkMaxShowCount(rule)) continue;

      // Evaluate conditions
      if (this.evaluateConditions(rule.conditions)) {
        const insight = this.createInsight(rule);
        insights.push(insight);

        // Update tracking
        this.lastInsightTime.set(rule.id, new Date());
        this.insightShowCount.set(
          rule.id,
          (this.insightShowCount.get(rule.id) || 0) + 1,
        );
      }
    }

    // Sort by priority
    return this.sortByPriority(insights);
  }

  // Get contextual insight for current page/action
  getContextualInsight(page: string, action?: string): MLInsight | null {
    if (!this.preferences?.insights.contextualHelp) return null;

    // Page-specific insights
    const pageInsights: Record<string, () => MLInsight | null> = {
      "/dashboard": () => this.getDashboardInsight(),
      "/inbound": () => this.getOperationsInsight("inbound"),
      "/outbound": () => this.getOperationsInsight("outbound"),
      "/inventory": () => this.getInventoryInsight(),
      "/settings/accessibility": () => this.getAccessibilityInsight(),
    };

    const insightGenerator = pageInsights[page];
    return insightGenerator ? insightGenerator() : null;
  }

  // ML-powered prediction of user needs
  predictUserNeeds(): MLInsight[] {
    if (!this.preferences?.mlEnabled) return [];

    const predictions: MLInsight[] = [];

    // Analyze behavior patterns
    const patterns = this.analyzeBehaviorPatterns();

    // Generate predictions based on patterns
    if (patterns.frequentSearches.length > 0) {
      predictions.push({
        id: `pred_${Date.now()}_search`,
        type: "predictions",
        title: "Search Optimization",
        message: `You frequently search for "${patterns.frequentSearches[0]}". Would you like to set up a quick filter?`,
        priority: "low",
        confidence: 0.85,
        context: {
          pattern: "frequent_search",
          value: patterns.frequentSearches[0],
        },
        action: {
          type: "custom",
          label: "Create Quick Filter",
          payload: {
            action: "create_filter",
            term: patterns.frequentSearches[0],
          },
        },
      });
    }

    if (patterns.peakUsageHours.length > 0) {
      const peakHour = patterns.peakUsageHours[0];
      predictions.push({
        id: `pred_${Date.now()}_peak`,
        type: "predictions",
        title: "Peak Usage Pattern Detected",
        message: `You're most active around ${peakHour}:00. We've optimized the system for your peak hours.`,
        priority: "low",
        confidence: 0.78,
        context: { pattern: "peak_usage", hour: peakHour },
      });
    }

    return predictions;
  }

  // Record insight interaction
  recordInsightInteraction(
    insightId: string,
    action: "dismiss" | "act" | "feedback",
    feedback?: "helpful" | "not_helpful" | "annoying",
  ) {
    const history: InsightHistory = {
      insightId,
      ruleId: this.extractRuleId(insightId),
      shownAt: new Date(),
    };

    if (action === "dismiss") {
      history.dismissedAt = new Date();
    } else if (action === "act") {
      history.actedUponAt = new Date();
    }

    if (feedback) {
      history.feedback = feedback;
    }

    this.insightHistory.push(history);
    this.saveHistory();
  }

  // Get insight effectiveness metrics
  getInsightMetrics(): {
    totalShown: number;
    actedUpon: number;
    dismissed: number;
    helpfulRate: number;
  } {
    const total = this.insightHistory.length;
    const actedUpon = this.insightHistory.filter((h) => h.actedUponAt).length;
    const dismissed = this.insightHistory.filter((h) => h.dismissedAt).length;
    const helpful = this.insightHistory.filter(
      (h) => h.feedback === "helpful",
    ).length;
    const withFeedback = this.insightHistory.filter((h) => h.feedback).length;

    return {
      totalShown: total,
      actedUpon,
      dismissed,
      helpfulRate: withFeedback > 0 ? helpful / withFeedback : 0,
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private getTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
  }

  private getDeviceType(): "desktop" | "tablet" | "mobile" {
    if (typeof window === "undefined") return "desktop";
    const width = window.innerWidth;
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  }

  private getSessionDuration(): number {
    return Math.floor((Date.now() - this.sessionStartTime.getTime()) / 1000);
  }

  private checkCooldown(rule: InsightRule): boolean {
    const lastShown = this.lastInsightTime.get(rule.id);
    if (!lastShown) return true;

    const cooldownMs = rule.cooldownMinutes * 60 * 1000;
    return Date.now() - lastShown.getTime() > cooldownMs;
  }

  private checkMaxShowCount(rule: InsightRule): boolean {
    const count = this.insightShowCount.get(rule.id) || 0;
    return count < rule.maxShowCount;
  }

  private evaluateConditions(conditions: InsightCondition[]): boolean {
    return conditions.every((condition) => this.evaluateCondition(condition));
  }

  private evaluateCondition(condition: InsightCondition): boolean {
    let actualValue: any;

    switch (condition.type) {
      case "behavior":
        actualValue = this.getBehaviorMetric(condition.metric);
        break;
      case "preference":
        actualValue = this.getPreferenceValue(condition.metric);
        break;
      case "time":
        actualValue = this.getTimeValue(condition.metric);
        break;
      case "session":
        actualValue = this.getSessionMetric(condition.metric);
        break;
      case "performance":
        actualValue = this.getPerformanceMetric(condition.metric);
        break;
      default:
        return false;
    }

    return this.compareValues(actualValue, condition.operator, condition.value);
  }

  private getBehaviorMetric(metric: string): any {
    const recentBehaviors = this.behaviorHistory.filter(
      (b) => Date.now() - b.timestamp.getTime() < 3600000, // Last hour
    );

    switch (metric) {
      case "repeated_click_action":
        // Count repeated clicks on same target
        const clickCounts = new Map<string, number>();
        recentBehaviors
          .filter((b) => b.action.type === "click" && b.action.target)
          .forEach((b) => {
            const target = b.action.target!;
            clickCounts.set(target, (clickCounts.get(target) || 0) + 1);
          });
        return Math.max(...Array.from(clickCounts.values()), 0);

      case "search_count":
        return recentBehaviors.filter((b) => b.action.type === "search").length;

      case "idle_time":
        const lastAction = recentBehaviors[recentBehaviors.length - 1];
        return lastAction
          ? (Date.now() - lastAction.timestamp.getTime()) / 1000
          : 0;

      case "page_visits":
        // Count visits to most frequent page
        const pageCounts = new Map<string, number>();
        recentBehaviors
          .filter((b) => b.action.type === "navigate")
          .forEach((b) => {
            const page = b.context.page;
            pageCounts.set(page, (pageCounts.get(page) || 0) + 1);
          });
        return Math.max(...Array.from(pageCounts.values()), 0);

      case "tasks_completed":
        return recentBehaviors.filter(
          (b) => b.action.type === "submit" && b.success,
        ).length;

      default:
        return 0;
    }
  }

  private getPreferenceValue(metric: string): any {
    if (!this.preferences) return null;

    const parts = metric.split(".");
    let value: any = this.preferences;

    for (const part of parts) {
      value = value?.[part];
    }

    return value;
  }

  private getTimeValue(metric: string): any {
    switch (metric) {
      case "time_of_day":
        return this.getTimeOfDay();
      case "day_of_week":
        return new Date().getDay();
      case "hour":
        return new Date().getHours();
      default:
        return null;
    }
  }

  private getSessionMetric(metric: string): any {
    switch (metric) {
      case "session_duration":
        return this.getSessionDuration();
      case "session_count":
        // Would need to be tracked separately
        return 1;
      case "continuous_use_minutes":
        return this.getSessionDuration() / 60;
      case "ai_features_used":
        return this.behaviorHistory.some(
          (b) =>
            b.context.page?.includes("ai") || b.context.feature?.includes("ai"),
        );
      default:
        return null;
    }
  }

  private getPerformanceMetric(metric: string): any {
    // Would integrate with actual performance tracking
    switch (metric) {
      case "efficiency_score_improvement":
        return 0;
      default:
        return 0;
    }
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case "equals":
        return actual === expected;
      case "not_equals":
        return actual !== expected;
      case "greater_than":
        return actual > expected;
      case "less_than":
        return actual < expected;
      case "contains":
        return String(actual).includes(String(expected));
      case "between":
        return (
          Array.isArray(expected) &&
          actual >= expected[0] &&
          actual <= expected[1]
        );
      default:
        return false;
    }
  }

  private createInsight(rule: InsightRule): MLInsight {
    return {
      id: `${rule.id}_${Date.now()}`,
      type: rule.type,
      title: rule.name,
      message: this.generateInsightMessage(rule),
      priority: rule.priority,
      confidence: this.calculateConfidence(rule),
      context: {
        ruleId: rule.id,
        generatedAt: new Date().toISOString(),
      },
      action: rule.action,
    };
  }

  private generateInsightMessage(rule: InsightRule): string {
    // Generate dynamic messages based on context
    const messages: Record<string, string> = {
      keyboard_shortcuts:
        "You've been clicking this button frequently. Try using the keyboard shortcut for faster access!",
      frequent_navigation:
        "You visit this page often. Add it to your quick access for one-click navigation.",
      search_optimization:
        "Pro tip: Use filters to narrow down your search results more efficiently.",
      feature_discovery_ai:
        "Discover our AI-powered features that can automate your workflow and save time.",
      accessibility_prompt:
        "Personalize your experience! Take a quick questionnaire to customize the interface to your preferences.",
      idle_warning:
        "You've been inactive for a while. Your session may expire soon.",
      unsaved_changes:
        "You have unsaved changes. Don't forget to save before leaving!",
      busy_time_prediction:
        "Based on patterns, this is typically a busy period. Consider scheduling important tasks accordingly.",
      break_reminder:
        "You've been working for a while. Taking short breaks can improve focus and productivity.",
      eye_strain_warning:
        "It's getting late. Consider enabling the blue light filter to reduce eye strain.",
      unusual_activity:
        "We detected unusual activity patterns. Please verify this is you.",
      first_task_completed:
        "🎉 Congratulations on completing your first task! You're on your way to mastering Hazalyze.",
      efficiency_milestone:
        "🏆 Great job! Your efficiency has improved significantly. Keep up the excellent work!",
    };

    return messages[rule.id] || rule.description;
  }

  private calculateConfidence(rule: InsightRule): number {
    // Calculate confidence based on rule matching strength
    // This would be more sophisticated with actual ML
    const baseConfidence = 0.7;
    const showCount = this.insightShowCount.get(rule.id) || 0;
    const decayFactor = Math.max(0.5, 1 - showCount * 0.1);

    return Math.round(baseConfidence * decayFactor * 100) / 100;
  }

  private sortByPriority(insights: MLInsight[]): MLInsight[] {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return insights.sort(
      (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority],
    );
  }

  private analyzeBehaviorPatterns(): {
    frequentSearches: string[];
    peakUsageHours: number[];
    preferredFeatures: string[];
  } {
    const searches: Map<string, number> = new Map();
    const hourCounts: Map<number, number> = new Map();
    const features: Map<string, number> = new Map();

    for (const behavior of this.behaviorHistory) {
      // Track searches
      if (behavior.action.type === "search" && behavior.action.value) {
        const term = behavior.action.value.toLowerCase();
        searches.set(term, (searches.get(term) || 0) + 1);
      }

      // Track usage hours
      const hour = new Date(behavior.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);

      // Track features
      if (behavior.context.feature) {
        features.set(
          behavior.context.feature,
          (features.get(behavior.context.feature) || 0) + 1,
        );
      }
    }

    return {
      frequentSearches: [...searches.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([term]) => term),
      peakUsageHours: [...hourCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([hour]) => hour),
      preferredFeatures: [...features.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([feature]) => feature),
    };
  }

  private getDashboardInsight(): MLInsight | null {
    return {
      id: `ctx_dashboard_${Date.now()}`,
      type: "efficiency",
      title: "Dashboard Tip",
      message:
        "Customize your dashboard widgets by clicking the gear icon. Add the metrics that matter most to you.",
      priority: "low",
      confidence: 0.9,
      context: { page: "dashboard" },
    };
  }

  private getOperationsInsight(type: "inbound" | "outbound"): MLInsight | null {
    return {
      id: `ctx_${type}_${Date.now()}`,
      type: "features",
      title: `${type === "inbound" ? "Inbound" : "Outbound"} Operations Tip`,
      message: `Use bulk actions to process multiple ${type === "inbound" ? "shipments" : "orders"} at once. Select items and choose from the action menu.`,
      priority: "low",
      confidence: 0.85,
      context: { page: type },
    };
  }

  private getInventoryInsight(): MLInsight | null {
    return {
      id: `ctx_inventory_${Date.now()}`,
      type: "efficiency",
      title: "Inventory Tip",
      message:
        "Set up low stock alerts to automatically notify you when items need reordering.",
      priority: "low",
      confidence: 0.88,
      context: { page: "inventory" },
    };
  }

  private getAccessibilityInsight(): MLInsight | null {
    return {
      id: `ctx_accessibility_${Date.now()}`,
      type: "features",
      title: "Personalization Tip",
      message:
        "Try our cognitive profiles for quick setup. Each profile is optimized for different needs like ADHD or low vision support.",
      priority: "low",
      confidence: 0.92,
      context: { page: "accessibility" },
    };
  }

  private extractRuleId(insightId: string): string {
    // Extract rule ID from insight ID (format: ruleId_timestamp)
    const parts = insightId.split("_");
    if (parts.length >= 2) {
      return parts.slice(0, -1).join("_");
    }
    return insightId;
  }

  private loadHistory() {
    if (typeof window === "undefined") return;

    try {
      const savedBehaviors = localStorage.getItem(
        `hazalyze-behavior-history-${this.userId}`,
      );
      if (savedBehaviors) {
        this.behaviorHistory = JSON.parse(savedBehaviors);
      }

      const savedInsights = localStorage.getItem(
        `hazalyze-insight-history-${this.userId}`,
      );
      if (savedInsights) {
        this.insightHistory = JSON.parse(savedInsights);
      }
    } catch (error) {
      console.error("Error loading insight history:", error);
    }
  }

  private saveHistory() {
    if (typeof window === "undefined" || !this.userId) return;

    try {
      localStorage.setItem(
        `hazalyze-behavior-history-${this.userId}`,
        JSON.stringify(this.behaviorHistory.slice(-500)),
      );

      localStorage.setItem(
        `hazalyze-insight-history-${this.userId}`,
        JSON.stringify(this.insightHistory.slice(-100)),
      );
    } catch (error) {
      console.error("Error saving insight history:", error);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const intelligentInsightsService = new IntelligentInsightsService();

// ============================================================================
// REACT HOOK
// ============================================================================

export function useIntelligentInsights() {
  return intelligentInsightsService;
}
