/**
 * Enhanced Gap Detection Service
 * ML-based gap detection and prediction
 */

import { TruthEvent, TimelineGap } from "@/types/truth-engine";

export interface GapDetectionConfig {
  enableMLPrediction: boolean;
  expectedEventPatterns: ExpectedEventPattern[];
  anomalyThreshold: number;
  timeWindowHours: number;
}

export interface ExpectedEventPattern {
  entityType: string;
  sequence: string[]; // Expected event type sequence
  minTimeBetween?: number; // Minimum time between events (hours)
  maxTimeBetween?: number; // Maximum time between events (hours)
}

/**
 * Detect gaps in timeline with enhanced ML-based detection
 */
export function detectTimelineGapsEnhanced(
  events: TruthEvent[],
  entityType: string,
  config?: Partial<GapDetectionConfig>,
): TimelineGap[] {
  const gaps: TimelineGap[] = [];

  // Sort events by happenedAt
  const sortedEvents = [...events].sort(
    (a, b) =>
      new Date(a.happenedAt).getTime() - new Date(b.happenedAt).getTime(),
  );

  // 1. Time gap detection
  const timeGaps = detectTimeGaps(sortedEvents, config?.timeWindowHours || 24);
  gaps.push(...timeGaps);

  // 2. Missing event detection
  if (config?.expectedEventPatterns) {
    const missingEvents = detectMissingEvents(
      sortedEvents,
      entityType,
      config.expectedEventPatterns,
    );
    gaps.push(...missingEvents);
  }

  // 3. Missing evidence detection
  const missingEvidence = detectMissingEvidence(sortedEvents);
  gaps.push(...missingEvidence);

  // 4. Anomaly detection (ML-based if enabled)
  if (config?.enableMLPrediction) {
    const anomalies = detectAnomalies(
      sortedEvents,
      config.anomalyThreshold || 0.7,
    );
    gaps.push(...anomalies);
  }

  // 5. Low confidence detection
  const lowConfidence = detectLowConfidenceEvents(sortedEvents);
  gaps.push(...lowConfidence);

  return gaps;
}

/**
 * Detect time gaps between events
 */
function detectTimeGaps(
  events: TruthEvent[],
  maxGapHours: number,
): TimelineGap[] {
  const gaps: TimelineGap[] = [];

  for (let i = 0; i < events.length - 1; i++) {
    const current = events[i];
    const next = events[i + 1];
    const gapHours =
      (new Date(next.happenedAt).getTime() -
        new Date(current.happenedAt).getTime()) /
      (1000 * 60 * 60);

    if (gapHours > maxGapHours) {
      gaps.push({
        id: `gap-time-${i}`,
        type: "time_gap",
        description: `Gap of ${Math.round(gapHours)} hours between ${current.eventType} and ${next.eventType}`,
        startTime: current.happenedAt,
        endTime: next.happenedAt,
        severity: gapHours > 72 ? "HIGH" : gapHours > 48 ? "MEDIUM" : "LOW",
        suggestedActions: [
          "Review events in this period",
          "Check for missing evidence",
          "Verify event capture systems",
        ],
      });
    }
  }

  return gaps;
}

/**
 * Detect missing events based on expected patterns
 */
function detectMissingEvents(
  events: TruthEvent[],
  entityType: string,
  patterns: ExpectedEventPattern[],
): TimelineGap[] {
  const gaps: TimelineGap[] = [];

  const relevantPattern = patterns.find((p) => p.entityType === entityType);
  if (!relevantPattern) {
    return gaps;
  }

  const eventTypes = events.map((e) => e.eventType);
  const expectedSequence = relevantPattern.sequence;

  // Check if expected sequence is followed
  for (let i = 0; i < expectedSequence.length - 1; i++) {
    const expectedCurrent = expectedSequence[i];
    const expectedNext = expectedSequence[i + 1];

    const currentIndex = eventTypes.indexOf(expectedCurrent as any);
    const nextIndex = eventTypes.indexOf(expectedNext as any);

    if (currentIndex !== -1 && nextIndex === -1) {
      // Current event exists but next expected event is missing
      gaps.push({
        id: `gap-missing-${i}`,
        type: "missing_event",
        description: `Expected event "${expectedNext}" is missing after "${expectedCurrent}"`,
        severity: "MEDIUM",
        suggestedActions: [
          `Check if ${expectedNext} event should have occurred`,
          "Review business process for this entity",
          "Verify event capture for this event type",
        ],
      });
    } else if (currentIndex !== -1 && nextIndex !== -1) {
      // Both exist, check timing
      if (relevantPattern.minTimeBetween || relevantPattern.maxTimeBetween) {
        const timeDiff =
          (new Date(events[nextIndex].happenedAt).getTime() -
            new Date(events[currentIndex].happenedAt).getTime()) /
          (1000 * 60 * 60);

        if (
          relevantPattern.minTimeBetween &&
          timeDiff < relevantPattern.minTimeBetween
        ) {
          gaps.push({
            id: `gap-timing-${i}`,
            type: "time_gap",
            description: `Event "${expectedNext}" occurred too soon after "${expectedCurrent}" (${Math.round(timeDiff)}h < ${relevantPattern.minTimeBetween}h)`,
            severity: "LOW",
            suggestedActions: ["Verify event timing is correct"],
          });
        }

        if (
          relevantPattern.maxTimeBetween &&
          timeDiff > relevantPattern.maxTimeBetween
        ) {
          gaps.push({
            id: `gap-timing-long-${i}`,
            type: "time_gap",
            description: `Event "${expectedNext}" occurred too late after "${expectedCurrent}" (${Math.round(timeDiff)}h > ${relevantPattern.maxTimeBetween}h)`,
            severity: "MEDIUM",
            suggestedActions: [
              "Investigate delay",
              "Check for process bottlenecks",
            ],
          });
        }
      }
    }
  }

  return gaps;
}

/**
 * Detect events without evidence
 */
function detectMissingEvidence(events: TruthEvent[]): TimelineGap[] {
  const gaps: TimelineGap[] = [];

  events.forEach((event, index) => {
    if (event.evidenceLinks.length === 0) {
      gaps.push({
        id: `gap-evidence-${index}`,
        type: "missing_evidence",
        description: `Event "${event.eventType}" has no evidence`,
        severity: "MEDIUM",
        suggestedActions: [
          "Add evidence to this event",
          "Review event validity",
          "Check evidence capture systems",
        ],
      });
    }
  });

  return gaps;
}

/**
 * Detect anomalies using statistical analysis
 */
function detectAnomalies(
  events: TruthEvent[],
  threshold: number,
): TimelineGap[] {
  const gaps: TimelineGap[] = [];

  if (events.length < 3) {
    return gaps; // Need at least 3 events for anomaly detection
  }

  // Calculate time intervals between consecutive events
  const intervals: number[] = [];
  for (let i = 0; i < events.length - 1; i++) {
    const interval =
      (new Date(events[i + 1].happenedAt).getTime() -
        new Date(events[i].happenedAt).getTime()) /
      (1000 * 60 * 60);
    intervals.push(interval);
  }

  // Calculate mean and standard deviation
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance =
    intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) /
    intervals.length;
  const stdDev = Math.sqrt(variance);

  // Detect outliers (using z-score)
  intervals.forEach((interval, index) => {
    const zScore = Math.abs((interval - mean) / stdDev);
    if (zScore > threshold * 2) {
      gaps.push({
        id: `gap-anomaly-${index}`,
        type: "time_gap",
        description: `Anomalous time gap detected (${Math.round(interval)}h, z-score: ${zScore.toFixed(2)})`,
        startTime: events[index].happenedAt,
        endTime: events[index + 1].happenedAt,
        severity: zScore > 3 ? "HIGH" : "MEDIUM",
        suggestedActions: [
          "Investigate this time gap",
          "Verify event timing",
          "Check for process issues",
        ],
      });
    }
  });

  return gaps;
}

/**
 * Detect low confidence events
 */
function detectLowConfidenceEvents(events: TruthEvent[]): TimelineGap[] {
  const gaps: TimelineGap[] = [];

  events.forEach((event, index) => {
    if (event.confidenceScore < 0.7) {
      gaps.push({
        id: `gap-confidence-${index}`,
        type: "missing_evidence",
        description: `Event "${event.eventType}" has low confidence (${(event.confidenceScore * 100).toFixed(0)}%)`,
        severity: event.confidenceScore < 0.5 ? "HIGH" : "MEDIUM",
        suggestedActions: [
          "Review event validity",
          "Add more evidence",
          "Verify event source",
        ],
      });
    }
  });

  return gaps;
}

/**
 * Predict future gaps based on patterns
 */
export function predictFutureGaps(
  events: TruthEvent[],
  entityType: string,
  patterns: ExpectedEventPattern[],
): TimelineGap[] {
  const gaps: TimelineGap[] = [];

  if (events.length === 0) {
    return gaps;
  }

  const relevantPattern = patterns.find((p) => p.entityType === entityType);
  if (!relevantPattern) {
    return gaps;
  }

  const eventTypes = events.map((e) => e.eventType);
  const lastEvent = events[events.length - 1];
  const lastEventIndex = relevantPattern.sequence.indexOf(lastEvent.eventType);

  // Check if there should be more events
  if (
    lastEventIndex !== -1 &&
    lastEventIndex < relevantPattern.sequence.length - 1
  ) {
    const nextExpected = relevantPattern.sequence[lastEventIndex + 1];
    const timeSinceLastEvent =
      (Date.now() - new Date(lastEvent.happenedAt).getTime()) /
      (1000 * 60 * 60);

    // Check if next event is overdue
    if (
      relevantPattern.maxTimeBetween &&
      timeSinceLastEvent > relevantPattern.maxTimeBetween
    ) {
      gaps.push({
        id: `gap-predicted-${Date.now()}`,
        type: "missing_event",
        description: `Expected event "${nextExpected}" is overdue (${Math.round(timeSinceLastEvent)}h since last event)`,
        severity: "MEDIUM",
        suggestedActions: [
          `Check if ${nextExpected} should have occurred`,
          "Review process status",
          "Investigate delays",
        ],
      });
    }
  }

  return gaps;
}
