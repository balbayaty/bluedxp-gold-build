/**
 * Marketplace Messaging Types
 * Real-time communication between customers and providers
 */

export interface Conversation {
  id: string
  bookingId?: string
  serviceId?: string
  providerId: string
  customerId: string
  providerName: string
  customerName: string
  
  // Conversation Details
  subject?: string
  lastMessage?: Message
  lastMessageAt?: string
  unreadCount: {
    provider: number
    customer: number
  }
  
  // Status
  status: 'ACTIVE' | 'ARCHIVED' | 'CLOSED'
  
  // Metadata
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderRole: 'PROVIDER' | 'CUSTOMER' | 'SYSTEM'
  
  // Content
  content: string
  type: 'TEXT' | 'FILE' | 'IMAGE' | 'SYSTEM'
  
  // Attachments
  attachments?: MessageAttachment[]
  
  // Status
  status: 'SENT' | 'DELIVERED' | 'READ'
  readAt?: string
  
  // Metadata
  createdAt: string
  updatedAt?: string
}

export interface MessageAttachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  thumbnailUrl?: string
}

export interface ConversationCreationRequest {
  bookingId?: string
  serviceId?: string
  providerId: string
  customerId: string
  subject?: string
  initialMessage?: string
}

export interface SendMessageRequest {
  conversationId: string
  content: string
  type?: Message['type']
  attachments?: Omit<MessageAttachment, 'id' | 'url' | 'thumbnailUrl'>[]
}

export interface ConversationFilters {
  userId?: string
  bookingId?: string
  serviceId?: string
  status?: Conversation['status']
  unreadOnly?: boolean
}





