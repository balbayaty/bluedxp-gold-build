/**
 * Action Executor
 * Parses AI responses and executes screen control actions
 *
 * Supports action commands in AI responses like:
 * - [CLICK: "Submit Button"]
 * - [TYPE: "email", "user@example.com"]
 * - [NAVIGATE: "/shipments"]
 * - [EXTRACT: "table"]
 */

import {
  screenControlService,
  ActionRequest,
  ActionResult,
} from "./screenControl";

export interface ParsedAction {
  type: string;
  target?: string;
  value?: string;
  options?: Record<string, any>;
}

export interface ExecutionPlan {
  actions: ParsedAction[];
  description: string;
  requiresConfirmation: boolean;
}

/**
 * Action Executor Service
 */
export class ActionExecutor {
  /**
   * Parse actions from AI response
   */
  parseActions(aiResponse: string): ParsedAction[] {
    const actions: ParsedAction[] = [];

    // Pattern: [ACTION_TYPE: "target", "value"]
    const actionPattern = /\[(\w+):\s*"([^"]+)"(?:\s*,\s*"([^"]+)")?\]/g;
    let match;

    while ((match = actionPattern.exec(aiResponse)) !== null) {
      const [, type, target, value] = match;
      actions.push({
        type: type.toLowerCase(),
        target: target.trim(),
        value: value?.trim(),
      });
    }

    // Pattern: [ACTION_TYPE: target, value] (without quotes)
    const simplePattern = /\[(\w+):\s*([^,\]]+)(?:\s*,\s*([^\]]+))?\]/g;
    while ((match = simplePattern.exec(aiResponse)) !== null) {
      const [, type, target, value] = match;
      // Skip if already captured by quoted pattern
      if (!actions.some((a) => a.target === target.trim())) {
        actions.push({
          type: type.toLowerCase(),
          target: target.trim(),
          value: value?.trim(),
        });
      }
    }

    return actions;
  }

  /**
   * Create execution plan from actions
   */
  createExecutionPlan(
    actions: ParsedAction[],
    description?: string,
  ): ExecutionPlan {
    const requiresConfirmation = actions.some(
      (a) =>
        ["delete", "remove", "clear", "reset"].includes(a.type) ||
        a.type === "navigate" ||
        a.type === "submit",
    );

    return {
      actions,
      description: description || `Execute ${actions.length} action(s)`,
      requiresConfirmation,
    };
  }

  /**
   * Execute action plan
   */
  async executePlan(plan: ExecutionPlan): Promise<ActionResult[]> {
    const results: ActionResult[] = [];

    for (const action of plan.actions) {
      try {
        const request: ActionRequest = {
          type: action.type as any,
          target: action.target,
          value: action.value,
          options: action.options,
        };

        const result = await screenControlService.executeAction(request);
        results.push(result);

        // Stop on critical failure
        if (!result.success && action.options?.critical !== false) {
          break;
        }

        // Small delay between actions
        await this.delay(300);
      } catch (error) {
        results.push({
          success: false,
          message: `Failed to execute action: ${error instanceof Error ? error.message : "Unknown error"}`,
          error: "EXECUTION_ERROR",
        });
      }
    }

    return results;
  }

  /**
   * Execute single action
   */
  async executeAction(action: ParsedAction): Promise<ActionResult> {
    const request: ActionRequest = {
      type: action.type as any,
      target: action.target,
      value: action.value,
      options: action.options,
    };

    return await screenControlService.executeAction(request);
  }

  /**
   * Smart action parsing from natural language
   */
  parseNaturalLanguage(command: string): ParsedAction[] {
    const actions: ParsedAction[] = [];
    const lowerCommand = command.toLowerCase();

    // Click patterns
    if (
      lowerCommand.includes("click") ||
      lowerCommand.includes("press") ||
      lowerCommand.includes("tap")
    ) {
      const clickMatch = lowerCommand.match(
        /(?:click|press|tap)\s+(?:the\s+)?(.+?)(?:\s+button|\s+link|\s+element)?(?:\s|$)/i,
      );
      if (clickMatch) {
        actions.push({
          type: "click",
          target: clickMatch[1].trim(),
        });
      }
    }

    // Type patterns
    if (
      lowerCommand.includes("type") ||
      lowerCommand.includes("enter") ||
      lowerCommand.includes("fill")
    ) {
      const typeMatch = lowerCommand.match(
        /(?:type|enter|fill)\s+(?:in\s+)?(.+?)\s+(?:with|as|to)\s+(.+?)(?:\s|$)/i,
      );
      if (typeMatch) {
        actions.push({
          type: "type",
          target: typeMatch[1].trim(),
          value: typeMatch[2].trim().replace(/["']/g, ""),
        });
      }
    }

    // Navigate patterns
    if (
      lowerCommand.includes("go to") ||
      lowerCommand.includes("navigate") ||
      lowerCommand.includes("open")
    ) {
      const navMatch = lowerCommand.match(
        /(?:go\s+to|navigate\s+to|open)\s+(.+?)(?:\s|$)/i,
      );
      if (navMatch) {
        actions.push({
          type: "navigate",
          target: navMatch[1].trim(),
        });
      }
    }

    // Extract patterns
    if (
      lowerCommand.includes("extract") ||
      lowerCommand.includes("get") ||
      lowerCommand.includes("read")
    ) {
      const extractMatch = lowerCommand.match(
        /(?:extract|get|read)\s+(?:the\s+)?(.+?)(?:\s|$)/i,
      );
      if (extractMatch) {
        actions.push({
          type: "extract",
          target: extractMatch[1].trim(),
        });
      }
    }

    // Select patterns
    if (lowerCommand.includes("select") || lowerCommand.includes("choose")) {
      const selectMatch = lowerCommand.match(
        /(?:select|choose)\s+(?:the\s+)?(.+?)(?:\s|$)/i,
      );
      if (selectMatch) {
        actions.push({
          type: "select",
          target: selectMatch[1].trim(),
        });
      }
    }

    return actions;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const actionExecutor = new ActionExecutor();

export default actionExecutor;
