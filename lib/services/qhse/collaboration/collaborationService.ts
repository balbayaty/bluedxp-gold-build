/**
 * QHSE Collaboration Service
 * Real-time collaboration for incidents, inspections
 * Team chat, comments, file sharing
 */

import { eventBus } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";

// ============================================================================
// COLLABORATION TYPES
// ============================================================================

export interface CollaborationSession {
  id: string;
  entityType: "INCIDENT" | "INSPECTION" | "TRAINING";
  entityId: string;
  participants: CollaborationParticipant[];
  activeUsers: string[]; // User IDs currently viewing
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CollaborationParticipant {
  userId: string;
  userName: string;
  role: string;
  joinedAt: Date | string;
  lastActive: Date | string;
}

export interface CollaborationComment {
  id: string;
  sessionId: string;
  entityId: string;
  userId: string;
  userName: string;
  content: string;
  mentions?: string[]; // User IDs mentioned
  attachments?: string[]; // File URLs
  parentId?: string; // For threaded comments
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CollaborationFile {
  id: string;
  sessionId: string;
  entityId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date | string;
}

// ============================================================================
// COLLABORATION SERVICE
// ============================================================================

class CollaborationService {
  private sessions: Map<string, CollaborationSession> = new Map();
  private comments: Map<string, CollaborationComment[]> = new Map(); // entityId -> comments
  private files: Map<string, CollaborationFile[]> = new Map(); // entityId -> files

  /**
   * Get or create collaboration session
   */
  async getOrCreateSession(
    entityType: "INCIDENT" | "INSPECTION" | "TRAINING",
    entityId: string,
    userId: string,
    userName: string,
    role: string,
  ): Promise<CollaborationSession> {
    const sessionKey = `${entityType}-${entityId}`;
    let session = this.sessions.get(sessionKey);

    if (!session) {
      session = {
        id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        entityType,
        entityId,
        participants: [],
        activeUsers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.sessions.set(sessionKey, session);
    }

    // Add participant if not exists
    const existingParticipant = session.participants.find(
      (p) => p.userId === userId,
    );
    if (!existingParticipant) {
      session.participants.push({
        userId,
        userName,
        role,
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      });
    }

    // Add to active users
    if (!session.activeUsers.includes(userId)) {
      session.activeUsers.push(userId);
    }

    session.updatedAt = new Date().toISOString();
    this.sessions.set(sessionKey, session);

    // Publish event
    await eventBus.publish({
      type: "qhse.collaboration.session.updated",
      payload: {
        sessionId: session.id,
        entityType,
        entityId,
        activeUsers: session.activeUsers,
      },
      timestamp: new Date().toISOString(),
    });

    return session;
  }

  /**
   * Add comment
   */
  async addComment(
    entityId: string,
    userId: string,
    userName: string,
    content: string,
    mentions?: string[],
    attachments?: string[],
    parentId?: string,
  ): Promise<CollaborationComment> {
    const comment: CollaborationComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      sessionId: "", // Will be set if session exists
      entityId,
      userId,
      userName,
      content,
      mentions,
      attachments,
      parentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!this.comments.has(entityId)) {
      this.comments.set(entityId, []);
    }

    this.comments.get(entityId)!.push(comment);

    // Store in knowledge base
    await knowledgeBaseService.store({
      entity: "qhse-comment",
      id: comment.id,
      content: `Comment on ${entityId}: ${content}`,
      metadata: {
        entityId,
        userId,
        mentions,
        hasAttachments: !!attachments?.length,
      },
    });

    // Publish event
    await eventBus.publish({
      type: "qhse.collaboration.comment.added",
      payload: { commentId: comment.id, entityId, userId, mentions },
      timestamp: new Date().toISOString(),
    });

    return comment;
  }

  /**
   * Get comments for entity
   */
  getComments(entityId: string): CollaborationComment[] {
    return this.comments.get(entityId) || [];
  }

  /**
   * Add file
   */
  async addFile(
    entityId: string,
    fileName: string,
    fileUrl: string,
    fileType: string,
    fileSize: number,
    uploadedBy: string,
  ): Promise<CollaborationFile> {
    const file: CollaborationFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      sessionId: "",
      entityId,
      fileName,
      fileUrl,
      fileType,
      fileSize,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
    };

    if (!this.files.has(entityId)) {
      this.files.set(entityId, []);
    }

    this.files.get(entityId)!.push(file);

    // Publish event
    await eventBus.publish({
      type: "qhse.collaboration.file.added",
      payload: { fileId: file.id, entityId, fileName },
      timestamp: new Date().toISOString(),
    });

    return file;
  }

  /**
   * Get files for entity
   */
  getFiles(entityId: string): CollaborationFile[] {
    return this.files.get(entityId) || [];
  }

  /**
   * Update active user
   */
  async updateActiveUser(
    entityType: "INCIDENT" | "INSPECTION" | "TRAINING",
    entityId: string,
    userId: string,
  ): Promise<void> {
    const sessionKey = `${entityType}-${entityId}`;
    const session = this.sessions.get(sessionKey);

    if (session) {
      if (!session.activeUsers.includes(userId)) {
        session.activeUsers.push(userId);
      }

      const participant = session.participants.find((p) => p.userId === userId);
      if (participant) {
        participant.lastActive = new Date().toISOString();
      }

      session.updatedAt = new Date().toISOString();
      this.sessions.set(sessionKey, session);
    }
  }

  /**
   * Remove active user
   */
  async removeActiveUser(
    entityType: "INCIDENT" | "INSPECTION" | "TRAINING",
    entityId: string,
    userId: string,
  ): Promise<void> {
    const sessionKey = `${entityType}-${entityId}`;
    const session = this.sessions.get(sessionKey);

    if (session) {
      session.activeUsers = session.activeUsers.filter((id) => id !== userId);
      session.updatedAt = new Date().toISOString();
      this.sessions.set(sessionKey, session);
    }
  }
}

export const collaborationService = new CollaborationService();
