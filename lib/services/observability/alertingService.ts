/**
 * Real-Time Alerting & Anomaly Detection Service
 *
 * Provides:
 * - ML-powered anomaly detection
 * - Real-time alerting
 * - Alert routing and correlation
 * - Predictive alerting
 */

import { prisma } from "@/lib/services/database/prismaClient";

export interface Alert {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  source: string;
  metric?: string;
  value?: number;
  threshold?: number;
  timestamp: Date;
  resolved?: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface AnomalyResult {
  detected: boolean;
  severity: "low" | "medium" | "high" | "critical";
  anomalyType: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  confidence: number;
  recommendations: string[];
}

export interface RoutingResult {
  routed: boolean;
  channels: string[];
  recipients: string[];
}

export interface CorrelationResult {
  correlated: boolean;
  alertGroup: string;
  rootCause?: string;
  relatedAlerts: string[];
}

export interface PredictionResult {
  willAlert: boolean;
  estimatedTime: Date;
  confidence: number;
  metric: string;
  predictedValue: number;
  threshold: number;
}

class AlertingService {
  private alerts: Map<string, Alert> = new Map();
  private metricHistory: Map<
    string,
    Array<{ timestamp: number; value: number }>
  > = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private notificationChannels: Map<string, NotificationChannel> = new Map();

  /**
   * Detect anomalies using ML
   */
  async detectAnomalies(metric: string, value: number): Promise<AnomalyResult> {
    // Get historical data
    const history = this.metricHistory.get(metric) || [];

    // Need at least 20 data points for anomaly detection
    if (history.length < 20) {
      history.push({ timestamp: Date.now(), value });
      this.metricHistory.set(metric, history);
      return {
        detected: false,
        severity: "low",
        anomalyType: "insufficient_data",
        expectedValue: value,
        actualValue: value,
        deviation: 0,
        confidence: 0,
        recommendations: [],
      };
    }

    // Calculate statistics
    const values = history.map((h) => h.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Z-score for anomaly detection
    const zScore = Math.abs((value - mean) / stdDev);

    // Update history
    history.push({ timestamp: Date.now(), value });
    if (history.length > 1000) {
      history.shift();
    }
    this.metricHistory.set(metric, history);

    // Detect anomaly (Z-score > 3 is significant)
    if (zScore > 3) {
      const severity =
        zScore > 5
          ? "critical"
          : zScore > 4
            ? "high"
            : zScore > 3.5
              ? "medium"
              : "low";

      const deviation = ((value - mean) / mean) * 100;

      return {
        detected: true,
        severity,
        anomalyType: value > mean ? "spike" : "drop",
        expectedValue: mean,
        actualValue: value,
        deviation,
        confidence: Math.min(zScore / 5, 1), // Normalize to 0-1
        recommendations: this.getAnomalyRecommendations(
          metric,
          value,
          mean,
          deviation,
        ),
      };
    }

    return {
      detected: false,
      severity: "low",
      anomalyType: "normal",
      expectedValue: mean,
      actualValue: value,
      deviation: ((value - mean) / mean) * 100,
      confidence: 1 - zScore / 3,
      recommendations: [],
    };
  }

  /**
   * Send real-time alert
   */
  async sendAlert(alert: Alert): Promise<void> {
    // Store alert
    this.alerts.set(alert.id, alert);

    // Route alert
    const routing = await this.routeAlert(alert);
    if (routing.routed) {
      // Send to notification channels
      for (const channel of routing.channels) {
        await this.sendToChannel(alert, channel);
      }
    }

    // Store in database
    await this.storeAlert(alert);
  }

  /**
   * Route alert to appropriate channels
   */
  async routeAlert(alert: Alert): Promise<RoutingResult> {
    const channels: string[] = [];
    const recipients: string[] = [];

    // Route based on severity
    if (alert.severity === "critical") {
      channels.push("email", "sms", "slack", "pagerduty");
      recipients.push("on-call-engineer", "team-lead");
    } else if (alert.severity === "high") {
      channels.push("email", "slack");
      recipients.push("team-lead");
    } else if (alert.severity === "medium") {
      channels.push("slack");
      recipients.push("team");
    } else {
      channels.push("slack");
      recipients.push("team");
    }

    return {
      routed: channels.length > 0,
      channels,
      recipients,
    };
  }

  /**
   * Correlate related alerts
   */
  async correlateAlerts(alerts: Alert[]): Promise<CorrelationResult> {
    if (alerts.length < 2) {
      return {
        correlated: false,
        alertGroup: "",
        relatedAlerts: [],
      };
    }

    // Group alerts by source and time window
    const groups = new Map<string, Alert[]>();

    for (const alert of alerts) {
      const window = Math.floor(alert.timestamp.getTime() / (5 * 60 * 1000)); // 5-minute windows
      const key = `${alert.source}:${window}`;

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(alert);
    }

    // Find groups with multiple alerts
    for (const [groupKey, groupAlerts] of groups.entries()) {
      if (groupAlerts.length >= 2) {
        // Potential root cause
        const rootCause = this.findRootCause(groupAlerts);

        return {
          correlated: true,
          alertGroup: groupKey,
          rootCause,
          relatedAlerts: groupAlerts.map((a) => a.id),
        };
      }
    }

    return {
      correlated: false,
      alertGroup: "",
      relatedAlerts: [],
    };
  }

  /**
   * Predict future alerts
   */
  async predictAlert(metric: string): Promise<PredictionResult> {
    const history = this.metricHistory.get(metric) || [];

    if (history.length < 50) {
      return {
        willAlert: false,
        estimatedTime: new Date(),
        confidence: 0,
        metric,
        predictedValue: 0,
        threshold: 0,
      };
    }

    // Simple linear regression for prediction
    const recent = history.slice(-50);
    const timestamps = recent.map((h) => h.timestamp);
    const values = recent.map((h) => h.value);

    // Calculate trend
    const n = recent.length;
    const sumX = timestamps.reduce((sum, t) => sum + t, 0);
    const sumY = values.reduce((sum, v) => sum + v, 0);
    const sumXY = timestamps.reduce((sum, t, i) => sum + t * values[i], 0);
    const sumX2 = timestamps.reduce((sum, t) => sum + t * t, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict value in 1 hour
    const futureTime = Date.now() + 60 * 60 * 1000;
    const predictedValue = slope * futureTime + intercept;

    // Get threshold from alert rules
    const rule = this.alertRules.get(metric);
    const threshold = rule?.threshold || Infinity;

    // Check if prediction exceeds threshold
    const willAlert = predictedValue > threshold;
    const confidence = Math.min(history.length / 100, 1); // More data = higher confidence

    return {
      willAlert,
      estimatedTime: new Date(futureTime),
      confidence,
      metric,
      predictedValue,
      threshold,
    };
  }

  /**
   * Add alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.metric, rule);
  }

  /**
   * Register notification channel
   */
  registerNotificationChannel(channel: NotificationChannel): void {
    this.notificationChannels.set(channel.id, channel);
  }

  // Private helper methods

  private getAnomalyRecommendations(
    metric: string,
    value: number,
    expected: number,
    deviation: number,
  ): string[] {
    const recommendations: string[] = [];

    if (metric.includes("response_time") || metric.includes("latency")) {
      recommendations.push("Check database query performance");
      recommendations.push("Review caching strategies");
      recommendations.push("Check for slow external API calls");
    } else if (metric.includes("error_rate")) {
      recommendations.push("Review error logs");
      recommendations.push("Check for recent deployments");
      recommendations.push("Verify external service health");
    } else if (metric.includes("memory")) {
      recommendations.push("Check for memory leaks");
      recommendations.push("Review object retention");
      recommendations.push("Consider increasing memory limits");
    } else if (metric.includes("cpu")) {
      recommendations.push("Check for CPU-intensive operations");
      recommendations.push("Review background job processing");
      recommendations.push("Consider horizontal scaling");
    }

    return recommendations;
  }

  private async sendToChannel(alert: Alert, channelId: string): Promise<void> {
    const channel = this.notificationChannels.get(channelId);
    if (!channel) {
      console.warn(`Notification channel ${channelId} not found`);
      return;
    }

    try {
      await channel.send(alert);
    } catch (error) {
      console.error(`Failed to send alert to ${channelId}:`, error);
    }
  }

  private async storeAlert(alert: Alert): Promise<void> {
    try {
      await prisma.alert.create({
        data: {
          id: alert.id,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          source: alert.source,
          metric: alert.metric,
          value: alert.value,
          threshold: alert.threshold,
          timestamp: alert.timestamp,
          resolved: alert.resolved || false,
          resolvedAt: alert.resolvedAt,
          metadata: alert.metadata || {},
        },
      });
    } catch (error) {
      // Table might not exist
      console.warn("Could not store alert:", error);
    }
  }

  private findRootCause(alerts: Alert[]): string {
    // Find the earliest alert as potential root cause
    const sorted = alerts.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
    return sorted[0].source;
  }
}

// Types

interface AlertRule {
  id: string;
  metric: string;
  threshold: number;
  operator: "gt" | "lt" | "eq";
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
}

interface NotificationChannel {
  id: string;
  type: "email" | "sms" | "slack" | "webhook" | "pagerduty";
  config: Record<string, any>;
  send: (alert: Alert) => Promise<void>;
}

export const alertingService = new AlertingService();

// Register default notification channels
alertingService.registerNotificationChannel({
  id: "slack",
  type: "slack",
  config: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
  },
  async send(alert) {
    // Send to Slack
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🚨 ${alert.severity.toUpperCase()}: ${alert.title}`,
          attachments: [
            {
              color:
                alert.severity === "critical"
                  ? "danger"
                  : alert.severity === "high"
                    ? "warning"
                    : "good",
              fields: [
                { title: "Message", value: alert.message },
                { title: "Source", value: alert.source },
                { title: "Time", value: alert.timestamp.toISOString() },
              ],
            },
          ],
        }),
      });
    }
  },
});
