/**
 * Context Service for Copilot
 * Manages context for AI conversations
 */

export interface CopilotContext {
  module?: string;
  page?: string;
  entityId?: string;
  userId?: string;
  tenantId?: string;
  [key: string]: any;
}

class ContextService {
  private context: CopilotContext = {};

  setContext(context: CopilotContext): void {
    this.context = { ...this.context, ...context };
  }

  getContext(): CopilotContext {
    return { ...this.context };
  }

  clearContext(): void {
    this.context = {};
  }

  updateContext(updates: Partial<CopilotContext>): void {
    this.context = { ...this.context, ...updates };
  }
}

export const contextService = new ContextService();
export default contextService;
