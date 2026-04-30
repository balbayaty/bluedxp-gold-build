/**
 * Truth Engine KPI Formula Engine
 * Advanced formula evaluation for KPI calculations
 */

import { TruthEvent, TruthKPI } from "@/types/truth-engine";

export interface FormulaContext {
  events: TruthEvent[];
  filters?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Evaluate KPI formula
 */
export function evaluateFormula(
  formula: string,
  context: FormulaContext,
): number {
  // Parse formula
  const parsed = parseFormula(formula);

  // Evaluate based on formula type
  switch (parsed.type) {
    case "count":
      return evaluateCount(parsed, context);
    case "sum":
      return evaluateSum(parsed, context);
    case "average":
      return evaluateAverage(parsed, context);
    case "percentage":
      return evaluatePercentage(parsed, context);
    case "custom":
      return evaluateCustom(parsed, context);
    default:
      return 0;
  }
}

interface ParsedFormula {
  type: "count" | "sum" | "average" | "percentage" | "custom";
  operation?: string;
  eventType?: string;
  condition?: string;
  field?: string;
  numerator?: ParsedFormula;
  denominator?: ParsedFormula;
  expression?: string;
}

/**
 * Parse formula string
 */
function parseFormula(formula: string): ParsedFormula {
  const normalized = formula.toLowerCase().trim();

  // Count formulas: "count(event_type)" or "count(event_type where condition)"
  if (normalized.startsWith("count(")) {
    const match = normalized.match(/count\(([^)]+)\)/);
    if (match) {
      const content = match[1];
      if (content.includes("where")) {
        const [eventType, condition] = content
          .split("where")
          .map((s) => s.trim());
        return {
          type: "count",
          eventType,
          condition,
        };
      } else {
        return {
          type: "count",
          eventType: content,
        };
      }
    }
  }

  // Sum formulas: "sum(event_type.field)"
  if (normalized.startsWith("sum(")) {
    const match = normalized.match(/sum\(([^)]+)\)/);
    if (match) {
      const content = match[1];
      const [eventType, field] = content.split(".").map((s) => s.trim());
      return {
        type: "sum",
        eventType,
        field,
      };
    }
  }

  // Average formulas: "average(event_type.field)" or "average(event_type.happenedAt - other_event.happenedAt)"
  if (normalized.startsWith("average(")) {
    const match = normalized.match(/average\(([^)]+)\)/);
    if (match) {
      const content = match[1];
      if (content.includes(" - ")) {
        // Time difference
        return {
          type: "average",
          expression: content,
        };
      } else {
        const [eventType, field] = content.split(".").map((s) => s.trim());
        return {
          type: "average",
          eventType,
          field,
        };
      }
    }
  }

  // Percentage formulas: "count(a) / count(b) * 100"
  if (normalized.includes("/") && normalized.includes("* 100")) {
    const parts = normalized.split("/");
    if (parts.length === 2) {
      const numerator = parseFormula(parts[0].trim());
      const denominatorStr = parts[1].split("*")[0].trim();
      const denominator = parseFormula(denominatorStr);
      return {
        type: "percentage",
        numerator,
        denominator,
      };
    }
  }

  // Custom expression
  return {
    type: "custom",
    expression: formula,
  };
}

/**
 * Evaluate count formula
 */
function evaluateCount(parsed: ParsedFormula, context: FormulaContext): number {
  let events = context.events;

  // Filter by event type
  if (parsed.eventType) {
    events = events.filter((e) => e.eventType === parsed.eventType);
  }

  // Apply condition if present
  if (parsed.condition) {
    events = applyCondition(events, parsed.condition);
  }

  return events.length;
}

/**
 * Evaluate sum formula
 */
function evaluateSum(parsed: ParsedFormula, context: FormulaContext): number {
  let events = context.events;

  if (parsed.eventType) {
    events = events.filter((e) => e.eventType === parsed.eventType);
  }

  if (!parsed.field) {
    return 0;
  }

  // Extract numeric values from events
  let sum = 0;
  for (const event of events) {
    const value = extractFieldValue(event, parsed.field);
    if (typeof value === "number") {
      sum += value;
    }
  }

  return sum;
}

/**
 * Evaluate average formula
 */
function evaluateAverage(
  parsed: ParsedFormula,
  context: FormulaContext,
): number {
  if (parsed.expression) {
    // Time difference average
    return evaluateTimeDifferenceAverage(parsed.expression, context);
  }

  let events = context.events;

  if (parsed.eventType) {
    events = events.filter((e) => e.eventType === parsed.eventType);
  }

  if (!parsed.field || events.length === 0) {
    return 0;
  }

  let sum = 0;
  for (const event of events) {
    const value = extractFieldValue(event, parsed.field);
    if (typeof value === "number") {
      sum += value;
    }
  }

  return events.length > 0 ? sum / events.length : 0;
}

/**
 * Evaluate percentage formula
 */
function evaluatePercentage(
  parsed: ParsedFormula,
  context: FormulaContext,
): number {
  if (!parsed.numerator || !parsed.denominator) {
    return 0;
  }

  const numerator = evaluateFormula(parsed.numerator as any, context);
  const denominator = evaluateFormula(parsed.denominator as any, context);

  if (denominator === 0) {
    return 0;
  }

  return (numerator / denominator) * 100;
}

/**
 * Evaluate custom expression
 */
function evaluateCustom(
  parsed: ParsedFormula,
  context: FormulaContext,
): number {
  if (!parsed.expression) {
    return 0;
  }

  // Simple expression evaluation (would need a proper expression parser for complex formulas)
  // For now, return 0 and log warning
  console.warn(
    "Custom formula evaluation not fully implemented:",
    parsed.expression,
  );
  return 0;
}

/**
 * Evaluate time difference average
 */
function evaluateTimeDifferenceAverage(
  expression: string,
  context: FormulaContext,
): number {
  // Parse expression like "event1.happenedAt - event2.happenedAt"
  const parts = expression.split(" - ");
  if (parts.length !== 2) {
    return 0;
  }

  const [event1Type, field1] = parts[0].split(".").map((s) => s.trim());
  const [event2Type, field2] = parts[1].split(".").map((s) => s.trim());

  // Group events by entity to match event1 and event2
  const entityGroups = new Map<
    string,
    { event1?: TruthEvent; event2?: TruthEvent }
  >();

  for (const event of context.events) {
    const entityId =
      Object.values(event.entityRefs).find((v) => v) || "unknown";
    if (!entityGroups.has(entityId)) {
      entityGroups.set(entityId, {});
    }

    const group = entityGroups.get(entityId)!;
    if (event.eventType === event1Type) {
      group.event1 = event;
    } else if (event.eventType === event2Type) {
      group.event2 = event;
    }
  }

  // Calculate differences
  const differences: number[] = [];
  for (const group of entityGroups.values()) {
    if (group.event1 && group.event2) {
      const time1 = new Date(group.event1.happenedAt).getTime();
      const time2 = new Date(group.event2.happenedAt).getTime();
      differences.push(Math.abs(time1 - time2));
    }
  }

  if (differences.length === 0) {
    return 0;
  }

  const sum = differences.reduce((a, b) => a + b, 0);
  return sum / differences.length / (1000 * 60 * 60); // Convert to hours
}

/**
 * Apply condition to events
 */
function applyCondition(events: TruthEvent[], condition: string): TruthEvent[] {
  // Simple condition parsing (would need proper parser for complex conditions)
  // For now, handle simple cases like "on_time", "confidence > 0.7", etc.

  if (condition.includes("on_time")) {
    // Would check if event was on time based on business rules
    return events; // Placeholder
  }

  if (condition.includes("confidence")) {
    const match = condition.match(/confidence\s*([><=]+)\s*([\d.]+)/);
    if (match) {
      const operator = match[1];
      const value = parseFloat(match[2]);
      return events.filter((e) => {
        switch (operator) {
          case ">":
            return e.confidenceScore > value;
          case ">=":
            return e.confidenceScore >= value;
          case "<":
            return e.confidenceScore < value;
          case "<=":
            return e.confidenceScore <= value;
          case "=":
          case "==":
            return e.confidenceScore === value;
          default:
            return true;
        }
      });
    }
  }

  return events;
}

/**
 * Extract field value from event
 */
function extractFieldValue(event: TruthEvent, field: string): any {
  const fieldMap: Record<string, any> = {
    happenedAt: event.happenedAt,
    recordedAt: event.recordedAt,
    confidenceScore: event.confidenceScore,
    // Add more field mappings as needed
  };

  return fieldMap[field] || (event.metadata as any)?.[field] || 0;
}
