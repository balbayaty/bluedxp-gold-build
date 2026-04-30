/**
 * Collaboration Service
 *
 * Shared views, comments, user presence, change tracking
 * Real-time collaboration features
 * Fully integrated with ecosystem - no duplication
 */

import { eventBus } from "@/lib/services/event-store";
import { realtimeUpdatesService } from "./realtimeUpdatesService";

// ============================================================================
// TYPES
// ============================================================================

export interface SharedView {
  id: string;
  name: string;
  description?: string;
  entityType: "SHIPMENT" | "JOURNEY" | "ROUTE" | "DASHBOARD" | "REPORT";
  entityId: string;
  ownerId: string;
  sharedWith: SharedViewAccess[];
  permissions: {
    view: boolean;
    comment: boolean;
    edit: boolean;
    share: boolean;
  };
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SharedViewAccess {
  userId: string;
  role: "VIEWER" | "COMMENTER" | "EDITOR" | "OWNER";
  grantedAt: Date;
  grantedBy: string;
}

export interface Comment {
  id: string;
  entityType: SharedView["entityType"];
  entityId: string;
  userId: string;
  userName?: string;
  content: string;
  mentions?: string[]; // User IDs
  attachments?: CommentAttachment[];
  parentId?: string; // For threaded comments
  reactions?: CommentReaction[];
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentAttachment {
  id: string;
  type: "FILE" | "IMAGE" | "LINK";
  name: string;
  url: string;
  size?: number;
}

export interface CommentReaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}

export interface UserPresence {
  userId: string;
  userName?: string;
  avatar?: string;
  entityType: SharedView["entityType"];
  entityId: string;
  status: "ONLINE" | "AWAY" | "OFFLINE";
  lastSeen: Date;
  currentView?: string;
  cursor?: { x: number; y: number };
}

export interface ChangeTracking {
  id: string;
  entityType: SharedView["entityType"];
  entityId: string;
  userId: string;
  userName?: string;
  changeType: "CREATE" | "UPDATE" | "DELETE" | "COMMENT" | "SHARE";
  field?: string;
  oldValue?: any;
  newValue?: any;
  description: string;
  timestamp: Date;
}

export interface CollaborationSession {
  id: string;
  entityType: SharedView["entityType"];
  entityId: string;
  participants: UserPresence[];
  startedAt: Date;
  lastActivity: Date;
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export class CollaborationService {
  private sharedViews: Map<string, SharedView> = new Map();
  private comments: Map<string, Comment[]> = new Map(); // entityId -> comments
  private presence: Map<string, UserPresence[]> = new Map(); // entityId -> presence
  private changes: Map<string, ChangeTracking[]> = new Map(); // entityId -> changes
  private sessions: Map<string, CollaborationSession> = new Map();

  /**
   * Share view with users
   */
  async shareView(request: {
    name: string;
    description?: string;
    entityType: SharedView["entityType"];
    entityId: string;
    ownerId: string;
    sharedWith: Array<{ userId: string; role: SharedViewAccess["role"] }>;
    permissions?: SharedView["permissions"];
    isPublic?: boolean;
  }): Promise<SharedView> {
    const sharedView: SharedView = {
      id: `shared-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: request.name,
      description: request.description,
      entityType: request.entityType,
      entityId: request.entityId,
      ownerId: request.ownerId,
      sharedWith: request.sharedWith.map((sw) => ({
        userId: sw.userId,
        role: sw.role,
        grantedAt: new Date(),
        grantedBy: request.ownerId,
      })),
      permissions: request.permissions || {
        view: true,
        comment: true,
        edit: false,
        share: false,
      },
      isPublic: request.isPublic || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sharedViews.set(sharedView.id, sharedView);

    // Track change
    await this.trackChange({
      entityType: request.entityType,
      entityId: request.entityId,
      userId: request.ownerId,
      changeType: "SHARE",
      description: `Shared ${request.name} with ${request.sharedWith.length} user(s)`,
    });

    // Notify shared users
    for (const access of sharedView.sharedWith) {
      await realtimeUpdatesService.createNotification({
        userId: access.userId,
        type: "INFO",
        title: "View Shared",
        message: `${request.name} has been shared with you`,
        actionUrl: `/transportation/${request.entityType.toLowerCase()}/${request.entityId}`,
      });
    }

    await eventBus.publish("transportation.collaboration.shared", {
      sharedViewId: sharedView.id,
      entityType: request.entityType,
      entityId: request.entityId,
      timestamp: new Date().toISOString(),
    });

    return sharedView;
  }

  /**
   * Add comment
   */
  async addComment(request: {
    entityType: SharedView["entityType"];
    entityId: string;
    userId: string;
    userName?: string;
    content: string;
    mentions?: string[];
    attachments?: CommentAttachment[];
    parentId?: string;
  }): Promise<Comment> {
    const comment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      entityType: request.entityType,
      entityId: request.entityId,
      userId: request.userId,
      userName: request.userName,
      content: request.content,
      mentions: request.mentions,
      attachments: request.attachments,
      parentId: request.parentId,
      reactions: [],
      resolved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!this.comments.has(request.entityId)) {
      this.comments.set(request.entityId, []);
    }
    this.comments.get(request.entityId)!.push(comment);

    // Track change
    await this.trackChange({
      entityType: request.entityType,
      entityId: request.entityId,
      userId: request.userId,
      changeType: "COMMENT",
      description: `Added comment: ${request.content.substring(0, 50)}...`,
    });

    // Notify mentioned users
    if (request.mentions && request.mentions.length > 0) {
      for (const userId of request.mentions) {
        await realtimeUpdatesService.createNotification({
          userId,
          type: "INFO",
          title: "Mentioned in Comment",
          message: `${request.userName || "Someone"} mentioned you in a comment`,
          actionUrl: `/transportation/${request.entityType.toLowerCase()}/${request.entityId}`,
        });
      }
    }

    // Publish real-time update
    await realtimeUpdatesService.publishUpdate({
      id: `update-${Date.now()}`,
      type: "NOTIFICATION",
      entityId: request.entityId,
      entityType: request.entityType,
      data: { commentId: comment.id, action: "COMMENT_ADDED" },
      timestamp: new Date(),
      priority: "MEDIUM",
      userId: request.userId,
    });

    await eventBus.publish("transportation.collaboration.comment", {
      commentId: comment.id,
      entityType: request.entityType,
      entityId: request.entityId,
      timestamp: new Date().toISOString(),
    });

    return comment;
  }

  /**
   * Update user presence
   */
  async updatePresence(request: {
    userId: string;
    userName?: string;
    avatar?: string;
    entityType: SharedView["entityType"];
    entityId: string;
    status: UserPresence["status"];
    currentView?: string;
    cursor?: { x: number; y: number };
  }): Promise<UserPresence> {
    const presence: UserPresence = {
      userId: request.userId,
      userName: request.userName,
      avatar: request.avatar,
      entityType: request.entityType,
      entityId: request.entityId,
      status: request.status,
      lastSeen: new Date(),
      currentView: request.currentView,
      cursor: request.cursor,
    };

    if (!this.presence.has(request.entityId)) {
      this.presence.set(request.entityId, []);
    }

    const existing = this.presence
      .get(request.entityId)!
      .findIndex((p) => p.userId === request.userId);
    if (existing >= 0) {
      this.presence.get(request.entityId)![existing] = presence;
    } else {
      this.presence.get(request.entityId)!.push(presence);
    }

    // Remove offline users after 5 minutes
    setTimeout(
      () => {
        const presences = this.presence.get(request.entityId);
        if (presences) {
          const filtered = presences.filter((p) => {
            if (p.userId === request.userId && p.status === "OFFLINE") {
              const timeSinceUpdate = Date.now() - p.lastSeen.getTime();
              return timeSinceUpdate < 5 * 60 * 1000; // Keep for 5 minutes
            }
            return true;
          });
          this.presence.set(request.entityId, filtered);
        }
      },
      5 * 60 * 1000,
    );

    // Publish real-time update
    await realtimeUpdatesService.publishUpdate({
      id: `presence-${Date.now()}`,
      type: "NOTIFICATION",
      entityId: request.entityId,
      entityType: request.entityType,
      data: {
        userId: request.userId,
        status: request.status,
        action: "PRESENCE_UPDATE",
      },
      timestamp: new Date(),
      priority: "LOW",
      userId: request.userId,
    });

    return presence;
  }

  /**
   * Track change
   */
  async trackChange(change: {
    entityType: SharedView["entityType"];
    entityId: string;
    userId: string;
    userName?: string;
    changeType: ChangeTracking["changeType"];
    field?: string;
    oldValue?: any;
    newValue?: any;
    description: string;
  }): Promise<ChangeTracking> {
    const tracking: ChangeTracking = {
      id: `change-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      entityType: change.entityType,
      entityId: change.entityId,
      userId: change.userId,
      userName: change.userName,
      changeType: change.changeType,
      field: change.field,
      oldValue: change.oldValue,
      newValue: change.newValue,
      description: change.description,
      timestamp: new Date(),
    };

    if (!this.changes.has(change.entityId)) {
      this.changes.set(change.entityId, []);
    }
    const changes = this.changes.get(change.entityId)!;
    changes.push(tracking);

    // Keep last 100 changes per entity
    if (changes.length > 100) {
      changes.shift();
    }

    return tracking;
  }

  /**
   * Get shared views for user
   */
  getSharedViewsForUser(userId: string): SharedView[] {
    return Array.from(this.sharedViews.values()).filter(
      (sv) =>
        sv.ownerId === userId ||
        sv.sharedWith.some((sw) => sw.userId === userId) ||
        sv.isPublic,
    );
  }

  /**
   * Get comments for entity
   */
  getComments(entityId: string): Comment[] {
    return this.comments.get(entityId) || [];
  }

  /**
   * Get presence for entity
   */
  getPresence(entityId: string): UserPresence[] {
    return this.presence.get(entityId) || [];
  }

  /**
   * Get change history
   */
  getChangeHistory(entityId: string, limit?: number): ChangeTracking[] {
    const changes = this.changes.get(entityId) || [];
    return limit ? changes.slice(-limit) : changes;
  }

  /**
   * Resolve comment
   */
  async resolveComment(
    entityId: string,
    commentId: string,
    userId: string,
  ): Promise<void> {
    const comments = this.comments.get(entityId);
    if (comments) {
      const comment = comments.find((c) => c.id === commentId);
      if (comment) {
        comment.resolved = true;
        comment.resolvedAt = new Date();
        comment.resolvedBy = userId;
        comment.updatedAt = new Date();
      }
    }
  }

  /**
   * Add reaction to comment
   */
  async addReaction(
    entityId: string,
    commentId: string,
    userId: string,
    emoji: string,
  ): Promise<void> {
    const comments = this.comments.get(entityId);
    if (comments) {
      const comment = comments.find((c) => c.id === commentId);
      if (comment) {
        if (!comment.reactions) {
          comment.reactions = [];
        }
        // Remove existing reaction from user
        comment.reactions = comment.reactions.filter(
          (r) => r.userId !== userId,
        );
        // Add new reaction
        comment.reactions.push({
          userId,
          emoji,
          createdAt: new Date(),
        });
        comment.updatedAt = new Date();
      }
    }
  }
}

export const collaborationService = new CollaborationService();
