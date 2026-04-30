/**
 * HR AI Assistant Service
 * Natural language queries, task automation, and intelligent recommendations
 * Powered by generative AI for conversational HR support
 */

import { eventBus } from "@/lib/services/event-bus";
import { employeeService } from "../employee/employeeService";
import { helpDeskService } from "../helpdesk/helpdeskService";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";

// ============================================================================
// TYPES
// ============================================================================

export interface AIQuery {
  id: string;
  userId: string;
  query: string;
  context?: {
    module?: string;
    employeeId?: string;
    department?: string;
  };
  response?: AIResponse;
  createdAt: Date | string;
}

export interface AIResponse {
  answer: string;
  confidence: number; // 0-100
  sources?: Array<{
    type: "KNOWLEDGE_BASE" | "EMPLOYEE_DATA" | "POLICY" | "DOCUMENT";
    id: string;
    title: string;
    relevance: number;
  }>;
  suggestedActions?: Array<{
    action: string;
    url?: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
  }>;
  followUpQuestions?: string[];
}

export interface TaskAutomation {
  id: string;
  userId: string;
  task: string;
  description: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  result?: any;
  error?: string;
  createdAt: Date | string;
  completedAt?: Date | string;
}

// ============================================================================
// SERVICE
// ============================================================================

class AIAssistantService {
  private queries: Map<string, AIQuery> = new Map();
  private automations: Map<string, TaskAutomation> = new Map();

  /**
   * Process natural language query
   */
  async processQuery(input: {
    userId: string;
    query: string;
    context?: AIQuery["context"];
  }): Promise<AIResponse> {
    const queryId = `query-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Store query
    const aiQuery: AIQuery = {
      id: queryId,
      userId: input.userId,
      query: input.query,
      context: input.context,
      createdAt: new Date().toISOString(),
    };
    this.queries.set(queryId, aiQuery);

    // Analyze query intent
    const intent = this.analyzeIntent(input.query);

    // Generate response based on intent
    let response: AIResponse;

    switch (intent.type) {
      case "EMPLOYEE_INFO":
        response = await this.handleEmployeeInfoQuery(
          input.query,
          input.context,
        );
        break;
      case "POLICY_QUESTION":
        response = await this.handlePolicyQuery(input.query);
        break;
      case "TASK_AUTOMATION":
        response = await this.handleTaskAutomationQuery(
          input.query,
          input.userId,
        );
        break;
      case "ANALYTICS":
        response = await this.handleAnalyticsQuery(input.query, input.context);
        break;
      default:
        response = await this.handleGeneralQuery(input.query);
    }

    aiQuery.response = response;
    this.queries.set(queryId, aiQuery);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "hr.ai.query.processed",
      aggregateId: queryId,
      aggregateType: "ai_query",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { queryId, intent, response },
    });

    return response;
  }

  /**
   * Analyze query intent
   */
  private analyzeIntent(query: string): {
    type:
      | "EMPLOYEE_INFO"
      | "POLICY_QUESTION"
      | "TASK_AUTOMATION"
      | "ANALYTICS"
      | "GENERAL";
    confidence: number;
    entities?: Record<string, any>;
  } {
    const lowerQuery = query.toLowerCase();

    // Employee info queries
    if (
      lowerQuery.includes("employee") ||
      lowerQuery.includes("staff") ||
      lowerQuery.includes("worker")
    ) {
      return { type: "EMPLOYEE_INFO", confidence: 0.8 };
    }

    // Policy questions
    if (
      lowerQuery.includes("policy") ||
      lowerQuery.includes("rule") ||
      lowerQuery.includes("regulation") ||
      lowerQuery.includes("how to")
    ) {
      return { type: "POLICY_QUESTION", confidence: 0.9 };
    }

    // Task automation
    if (
      lowerQuery.includes("create") ||
      lowerQuery.includes("generate") ||
      lowerQuery.includes("send") ||
      lowerQuery.includes("schedule")
    ) {
      return { type: "TASK_AUTOMATION", confidence: 0.7 };
    }

    // Analytics
    if (
      lowerQuery.includes("how many") ||
      lowerQuery.includes("statistics") ||
      lowerQuery.includes("report") ||
      lowerQuery.includes("analytics")
    ) {
      return { type: "ANALYTICS", confidence: 0.8 };
    }

    return { type: "GENERAL", confidence: 0.5 };
  }

  /**
   * Handle employee info queries
   */
  private async handleEmployeeInfoQuery(
    query: string,
    context?: AIQuery["context"],
  ): Promise<AIResponse> {
    // In real implementation, use NLP to extract employee name/ID and query type
    // For now, return generic response

    return {
      answer:
        'I can help you find employee information. Please specify which employee and what information you need (e.g., "Show me John Doe\'s performance review" or "What is Sarah Smith\'s leave balance?").',
      confidence: 70,
      suggestedActions: [
        {
          action: "View Employee Directory",
          url: "/hr/employees",
          priority: "MEDIUM",
        },
        {
          action: "Search Employees",
          url: "/hr/employees?search=",
          priority: "MEDIUM",
        },
      ],
      followUpQuestions: [
        "Which employee are you looking for?",
        "What specific information do you need?",
      ],
    };
  }

  /**
   * Handle policy queries
   */
  private async handlePolicyQuery(query: string): Promise<AIResponse> {
    // Search knowledge base
    try {
      const results = await knowledgeBaseService.search({
        query,
        limit: 3,
      });

      if (results.length > 0) {
        return {
          answer: `Based on our knowledge base, here's what I found:\n\n${results[0].content.substring(0, 500)}...`,
          confidence: 85,
          sources: results.map((r) => ({
            type: "KNOWLEDGE_BASE" as const,
            id: r.id,
            title: r.title,
            relevance: 0.9,
          })),
          suggestedActions: results.map((r) => ({
            action: `Read: ${r.title}`,
            url: `/knowledge-base/${r.id}`,
            priority: "HIGH" as const,
          })),
        };
      }
    } catch (error) {
      console.error("Error searching knowledge base:", error);
    }

    return {
      answer:
        "I couldn't find a specific answer in our knowledge base. Would you like me to create a help desk case for you, or would you prefer to search our documentation?",
      confidence: 50,
      suggestedActions: [
        {
          action: "Create Help Desk Case",
          url: "/hr/helpdesk/new",
          priority: "MEDIUM",
        },
        {
          action: "Search Documentation",
          url: "/knowledge-base",
          priority: "MEDIUM",
        },
      ],
    };
  }

  /**
   * Handle task automation queries
   */
  private async handleTaskAutomationQuery(
    query: string,
    userId: string,
  ): Promise<AIResponse> {
    const lowerQuery = query.toLowerCase();

    // Detect task type
    if (lowerQuery.includes("create") && lowerQuery.includes("case")) {
      return {
        answer:
          "I can help you create a help desk case. What is the subject and description of the case?",
        confidence: 80,
        suggestedActions: [
          {
            action: "Create Help Desk Case",
            url: "/hr/helpdesk/new",
            priority: "HIGH",
          },
        ],
        followUpQuestions: [
          "What is the subject of the case?",
          "Which category does it belong to?",
        ],
      };
    }

    if (lowerQuery.includes("generate") && lowerQuery.includes("report")) {
      return {
        answer:
          'I can help you generate reports. Which type of report would you like? (e.g., "Generate employee attendance report" or "Create performance review report")',
        confidence: 75,
        suggestedActions: [
          { action: "View Reports", url: "/hr/reports", priority: "MEDIUM" },
        ],
      };
    }

    return {
      answer:
        'I can help automate tasks. Please specify what you\'d like me to do (e.g., "Create a help desk case for payroll issue" or "Generate attendance report for last month").',
      confidence: 60,
      suggestedActions: [
        {
          action: "View Available Tasks",
          url: "/hr/dashboard",
          priority: "LOW",
        },
      ],
    };
  }

  /**
   * Handle analytics queries
   */
  private async handleAnalyticsQuery(
    query: string,
    context?: AIQuery["context"],
  ): Promise<AIResponse> {
    return {
      answer:
        'I can provide analytics and statistics. What would you like to know? (e.g., "How many employees do we have?" or "What is the average performance rating?")',
      confidence: 70,
      suggestedActions: [
        { action: "View HR Analytics", url: "/hr/analytics", priority: "HIGH" },
        { action: "View Reports", url: "/hr/reports", priority: "MEDIUM" },
      ],
      followUpQuestions: [
        "What metric are you interested in?",
        "Which department or time period?",
      ],
    };
  }

  /**
   * Handle general queries
   */
  private async handleGeneralQuery(query: string): Promise<AIResponse> {
    // Search knowledge base
    try {
      const results = await knowledgeBaseService.search({
        query,
        limit: 3,
      });

      if (results.length > 0) {
        return {
          answer: `Here's what I found:\n\n${results[0].content.substring(0, 300)}...`,
          confidence: 70,
          sources: results.map((r) => ({
            type: "KNOWLEDGE_BASE" as const,
            id: r.id,
            title: r.title,
            relevance: 0.8,
          })),
        };
      }
    } catch (error) {
      console.error("Error searching knowledge base:", error);
    }

    return {
      answer:
        "I'm here to help with HR-related questions. You can ask me about employees, policies, reports, or request help with tasks. How can I assist you?",
      confidence: 50,
      suggestedActions: [
        { action: "View HR Dashboard", url: "/hr/dashboard", priority: "LOW" },
        { action: "Get Help", url: "/hr/helpdesk", priority: "MEDIUM" },
      ],
    };
  }

  /**
   * Generate content using AI (job descriptions, performance reviews, etc.)
   */
  async generateContent(input: {
    type: "JOB_DESCRIPTION" | "PERFORMANCE_REVIEW" | "EMAIL" | "POLICY";
    prompt: string;
    context?: Record<string, any>;
  }): Promise<{
    content: string;
    confidence: number;
    suggestions?: string[];
  }> {
    // In real implementation, call generative AI API (OpenAI, Anthropic, etc.)
    // For now, return template-based generation

    let content = "";

    switch (input.type) {
      case "JOB_DESCRIPTION":
        content = this.generateJobDescription(input.prompt, input.context);
        break;
      case "PERFORMANCE_REVIEW":
        content = this.generatePerformanceReview(input.prompt, input.context);
        break;
      case "EMAIL":
        content = this.generateEmail(input.prompt, input.context);
        break;
      case "POLICY":
        content = this.generatePolicy(input.prompt, input.context);
        break;
    }

    return {
      content,
      confidence: 75,
      suggestions: [
        "Review and customize as needed",
        "Ensure compliance with local laws",
      ],
    };
  }

  private generateJobDescription(
    prompt: string,
    context?: Record<string, any>,
  ): string {
    return `# Job Description

## Position: ${context?.title || "Position Title"}

### Overview
${prompt}

### Responsibilities
- [Responsibility 1]
- [Responsibility 2]
- [Responsibility 3]

### Requirements
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

### Qualifications
- [Qualification 1]
- [Qualification 2]

### Benefits
- Competitive salary
- Health insurance
- Professional development opportunities

---
*This is a generated template. Please review and customize as needed.*`;
  }

  private generatePerformanceReview(
    prompt: string,
    context?: Record<string, any>,
  ): string {
    return `# Performance Review

## Employee: ${context?.employeeName || "Employee Name"}
## Period: ${context?.period || "Q1 2024"}

### Overall Rating: ${context?.rating || "Meets Expectations"}

### Strengths
${prompt}

### Areas for Improvement
- [Area 1]
- [Area 2]

### Goals for Next Period
- [Goal 1]
- [Goal 2]

### Comments
[Additional comments and feedback]

---
*This is a generated template. Please review and customize as needed.*`;
  }

  private generateEmail(prompt: string, context?: Record<string, any>): string {
    return `Subject: ${context?.subject || "Email Subject"}

Dear ${context?.recipient || "Recipient"},

${prompt}

Best regards,
${context?.sender || "HR Team"}`;
  }

  private generatePolicy(
    prompt: string,
    context?: Record<string, any>,
  ): string {
    return `# Policy: ${context?.title || "Policy Title"}

## Purpose
${prompt}

## Scope
This policy applies to all employees.

## Policy Details
[Policy content]

## Compliance
- Aligned with local labor laws
- Reviewed by legal team

## Effective Date
${new Date().toISOString().split("T")[0]}

---
*This is a generated template. Please review and customize as needed.*`;
  }

  /**
   * Get query history
   */
  async getQueryHistory(
    userId: string,
    limit: number = 10,
  ): Promise<AIQuery[]> {
    const queries = Array.from(this.queries.values())
      .filter((q) => q.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit);

    return queries;
  }
}

export const aiAssistantService = new AIAssistantService();
