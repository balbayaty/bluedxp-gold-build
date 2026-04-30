/**
 * Copilot History & Ticket Types
 * McKinsey-style advanced UI types for BlueDXP Copilot
 * 4IR & 5IR Aligned
 */

import { CopilotMessage } from '@/lib/services/copilot/copilotService'

export interface CopilotHistoryItem {
  id: string
  title: string
  lastMessage: string
  timestamp: Date | string
  messageCount: number
  moduleId?: string
  tags?: string[]
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'PENDING_USER'
export type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface SupportTicket {
  id: string
  ticketNumber: string
  title: string
  status: TicketStatus
  priority: TicketPriority
  category: string
  createdAt: Date | string
  updatedAt: Date | string
  description: string
  assignedTo?: string
  lastUpdateMessage?: string
  // 4IR/5IR predictive features
  predictiveResolutionTime?: string // AI estimated resolution
  confidenceScore?: number // AI confidence in resolution
  sentimentScore?: number // User sentiment analysis
}

export interface CopilotHistoryState {
  conversations: CopilotHistoryItem[]
  tickets: SupportTicket[]
  isLoading: boolean
  error?: string
}



