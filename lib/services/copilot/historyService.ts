/**
 * Copilot History Service
 * Manages retrieval of previous conversations and support tickets
 * 4IR & 5IR Aligned - Advanced Intelligence & Connectivity
 */

import { copilotService } from "./copilotService";
import type {
  CopilotHistoryItem,
  SupportTicket,
  TicketStatus,
  TicketPriority,
} from "@/types/copilotHistory";

class CopilotHistoryService {
  /**
   * Get previous conversations for the user
   */
  async getConversationHistory(
    tenantId: string,
    userId: string,
  ): Promise<CopilotHistoryItem[]> {
    try {
      // In a real app, this would fetch from a database
      // Using the existing copilotService to list conversations
      const conversations = copilotService.listConversations(tenantId, userId);

      return conversations
        .map((c) => ({
          id: c.id,
          title:
            c.title ||
            (c.messages.length > 0
              ? c.messages[0].content.substring(0, 40) + "..."
              : "New Conversation"),
          lastMessage:
            c.messages.length > 0
              ? c.messages[c.messages.length - 1].content
              : "",
          timestamp: c.updatedAt,
          messageCount: c.messages.length,
          moduleId: c.metadata?.moduleId,
        }))
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
    } catch (error) {
      console.error("[CopilotHistoryService] Failed to fetch history:", error);
      return [];
    }
  }

  /**
   * Get active support tickets for the user
   * Integrates with QHSE/Incidents and platform support module
   */
  async getActiveTickets(
    tenantId: string,
    userId: string,
  ): Promise<SupportTicket[]> {
    // Mock data for McKinsey-style advanced UI demonstration
    // In production, this would call incidentService or supportService
    return [
      {
        id: "TICK-1001",
        ticketNumber: "T-2025-001",
        title: "ASN Processing Delay in Riyadh Warehouse",
        status: "IN_PROGRESS",
        priority: "HIGH",
        category: "Inbound Operations",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
        description:
          "Automatic ASN validation is taking longer than expected for large shipments.",
        lastUpdateMessage:
          "AI analyzer detected a bottleneck in the validation microservice.",
        predictiveResolutionTime: "45 mins",
        confidenceScore: 0.94,
        sentimentScore: 0.65,
      },
      {
        id: "TICK-1002",
        ticketNumber: "T-2025-002",
        title: "IoT Sensor Calibration Required - Zone B",
        status: "OPEN",
        priority: "CRITICAL",
        category: "Maintenance",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        description:
          "Temperature sensors in Zone B are showing inconsistent readings.",
        predictiveResolutionTime: "2 hours",
        confidenceScore: 0.88,
        sentimentScore: 0.42,
      },
      {
        id: "TICK-1003",
        ticketNumber: "T-2025-003",
        title: "Carrier API Connectivity Issue",
        status: "RESOLVED",
        priority: "MEDIUM",
        category: "Integration",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        description:
          "Intermittent timeouts when fetching shipping labels from DHL API.",
        lastUpdateMessage:
          "Circuit breaker pattern applied and secondary endpoint verified.",
        predictiveResolutionTime: "Resolved",
        confidenceScore: 0.99,
        sentimentScore: 0.95,
      },
    ];
  }

  /**
   * Search through conversation history
   */
  async searchHistory(
    tenantId: string,
    userId: string,
    query: string,
  ): Promise<CopilotHistoryItem[]> {
    const history = await this.getConversationHistory(tenantId, userId);
    const lowerQuery = query.toLowerCase();
    return history.filter(
      (h) =>
        h.title.toLowerCase().includes(lowerQuery) ||
        h.lastMessage.toLowerCase().includes(lowerQuery),
    );
  }
}

export const copilotHistoryService = new CopilotHistoryService();
export default copilotHistoryService;
