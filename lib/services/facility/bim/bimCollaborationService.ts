/**
 * BIM Collaboration Service
 *
 * Real-time collaboration for BIM models including:
 * - Multi-user viewing sessions
 * - Real-time annotations
 * - Issue tracking
 * - Chat and communication
 * - Screen sharing
 * - Recording sessions
 * - Permission management
 *
 * Integrates with:
 * - Event Bus for real-time updates
 * - WebSocket for live collaboration
 * - Digital Twin Service
 */

import type {
  BIMCollaborationSession,
  BIMCollaborationParticipant,
  BIMCollaborationActivity,
  BIMAnnotation,
  BIMIssue,
} from "@/types/bim-marketplace";
import { eventBus } from "@/lib/services/event-store";

export interface BIMCollaborationServiceConfig {
  enableRecording?: boolean;
  enableChat?: boolean;
  enableAnnotations?: boolean;
  maxParticipants?: number;
  sessionTimeout?: number;
}

export class BIMCollaborationService {
  private config: BIMCollaborationServiceConfig;
  private sessions: Map<string, BIMCollaborationSession> = new Map();
  private activities: Map<string, BIMCollaborationActivity[]> = new Map();

  constructor(config: BIMCollaborationServiceConfig = {}) {
    this.config = {
      enableRecording: true,
      enableChat: true,
      enableAnnotations: true,
      maxParticipants: 50,
      sessionTimeout: 3600000, // 1 hour
      ...config,
    };
  }

  /**
   * Create collaboration session
   */
  async createSession(
    modelId: string,
    hostId: string,
    hostName: string,
    session: Omit<
      BIMCollaborationSession,
      | "id"
      | "hostId"
      | "hostName"
      | "participants"
      | "activities"
      | "annotations"
      | "issues"
      | "createdAt"
      | "updatedAt"
    >,
  ): Promise<BIMCollaborationSession> {
    const newSession: BIMCollaborationSession = {
      ...session,
      id: `bim-session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      modelId,
      hostId,
      hostName,
      participants: [
        {
          userId: hostId,
          userName: hostName,
          role: "host",
          joinedAt: new Date(),
          permissions: {
            view: true,
            comment: true,
            annotate: true,
            measure: true,
            export: true,
            edit: true,
          },
        },
      ],
      activities: [],
      annotations: [],
      issues: [],
      status: session.status || "scheduled",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(newSession.id, newSession);
    this.activities.set(newSession.id, []);

    // Publish event
    await eventBus.publish("bim.collaboration.session.created", {
      sessionId: newSession.id,
      modelId,
      hostId,
    });

    return newSession;
  }

  /**
   * Join session
   */
  async joinSession(
    sessionId: string,
    userId: string,
    userName: string,
    userAvatar?: string,
    role: "viewer" | "commenter" | "editor" = "viewer",
  ): Promise<BIMCollaborationParticipant> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Check if already joined
    const existing = session.participants.find((p) => p.userId === userId);
    if (existing) {
      return existing;
    }

    // Check max participants
    if (
      session.maxParticipants &&
      session.participants.length >= session.maxParticipants
    ) {
      throw new Error("Session is full");
    }

    // Check if session requires approval
    if (session.settings.requireApproval && role !== "viewer") {
      // In real implementation, create approval request
    }

    const participant: BIMCollaborationParticipant = {
      userId,
      userName,
      userAvatar,
      role:
        role === "viewer"
          ? "viewer"
          : role === "editor"
            ? "editor"
            : "commenter",
      joinedAt: new Date(),
      permissions: this.getPermissionsForRole(role),
    };

    session.participants.push(participant);
    session.status = session.status === "scheduled" ? "active" : session.status;
    if (!session.startedAt && session.status === "active") {
      session.startedAt = new Date();
    }

    // Add activity
    const activity: BIMCollaborationActivity = {
      id: `activity-${Date.now()}`,
      type: "join",
      userId,
      userName,
      timestamp: new Date(),
      data: { role },
    };
    session.activities.push(activity);
    this.activities.set(sessionId, session.activities);

    this.sessions.set(sessionId, session);

    // Publish event
    await eventBus.publish("bim.collaboration.participant.joined", {
      sessionId,
      userId,
      userName,
      role,
    });

    return participant;
  }

  /**
   * Leave session
   */
  async leaveSession(sessionId: string, userId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const participant = session.participants.find((p) => p.userId === userId);
    if (participant) {
      participant.leftAt = new Date();
      session.participants = session.participants.filter(
        (p) => p.userId !== userId,
      );

      // Add activity
      const activity: BIMCollaborationActivity = {
        id: `activity-${Date.now()}`,
        type: "leave",
        userId,
        userName: participant.userName,
        timestamp: new Date(),
        data: {},
      };
      session.activities.push(activity);
      this.activities.set(sessionId, session.activities);

      this.sessions.set(sessionId, session);

      // Publish event
      await eventBus.publish("bim.collaboration.participant.left", {
        sessionId,
        userId,
      });
    }
  }

  /**
   * Add annotation
   */
  async addAnnotation(
    sessionId: string,
    userId: string,
    userName: string,
    annotation: Omit<
      BIMAnnotation,
      | "id"
      | "sessionId"
      | "userId"
      | "userName"
      | "createdAt"
      | "updatedAt"
      | "replies"
    >,
  ): Promise<BIMAnnotation> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (!session.settings.annotationsEnabled) {
      throw new Error("Annotations are disabled for this session");
    }

    const participant = session.participants.find((p) => p.userId === userId);
    if (!participant || !participant.permissions.annotate) {
      throw new Error("User does not have permission to annotate");
    }

    const newAnnotation: BIMAnnotation = {
      ...annotation,
      id: `annotation-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      sessionId,
      userId,
      userName,
      replies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    session.annotations.push(newAnnotation);

    // Add activity
    const activity: BIMCollaborationActivity = {
      id: `activity-${Date.now()}`,
      type: "annotation",
      userId,
      userName,
      timestamp: new Date(),
      data: { annotationId: newAnnotation.id, type: annotation.type },
    };
    session.activities.push(activity);
    this.activities.set(sessionId, session.activities);

    this.sessions.set(sessionId, session);

    // Publish event
    await eventBus.publish("bim.collaboration.annotation.added", {
      sessionId,
      annotationId: newAnnotation.id,
      userId,
    });

    return newAnnotation;
  }

  /**
   * Create issue
   */
  async createIssue(
    sessionId: string,
    modelId: string,
    userId: string,
    issue: Omit<
      BIMIssue,
      | "id"
      | "sessionId"
      | "modelId"
      | "createdBy"
      | "createdAt"
      | "updatedAt"
      | "comments"
    >,
  ): Promise<BIMIssue> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const participant = session.participants.find((p) => p.userId === userId);
    if (!participant || !participant.permissions.comment) {
      throw new Error("User does not have permission to create issues");
    }

    const newIssue: BIMIssue = {
      ...issue,
      id: `issue-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      sessionId,
      modelId,
      createdBy: userId,
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    session.issues.push(newIssue);
    this.sessions.set(sessionId, session);

    // Publish event
    await eventBus.publish("bim.collaboration.issue.created", {
      sessionId,
      issueId: newIssue.id,
      userId,
      type: issue.type,
      severity: issue.severity,
    });

    return newIssue;
  }

  /**
   * Update participant view
   */
  async updateParticipantView(
    sessionId: string,
    userId: string,
    view: BIMCollaborationParticipant["currentView"],
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    const participant = session.participants.find((p) => p.userId === userId);
    if (participant) {
      participant.currentView = view;

      // Add activity
      const activity: BIMCollaborationActivity = {
        id: `activity-${Date.now()}`,
        type: "view-change",
        userId,
        userName: participant.userName,
        timestamp: new Date(),
        data: { view },
      };
      session.activities.push(activity);
      this.activities.set(sessionId, session.activities);

      this.sessions.set(sessionId, session);

      // Publish event (throttled in real implementation)
      await eventBus.publish("bim.collaboration.view.updated", {
        sessionId,
        userId,
      });
    }
  }

  /**
   * Get session
   */
  async getSession(sessionId: string): Promise<BIMCollaborationSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get sessions for model
   */
  async getModelSessions(modelId: string): Promise<BIMCollaborationSession[]> {
    return Array.from(this.sessions.values()).filter(
      (s) => s.modelId === modelId,
    );
  }

  /**
   * End session
   */
  async endSession(sessionId: string, hostId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.hostId !== hostId) {
      throw new Error("Only the host can end the session");
    }

    session.status = "ended";
    session.endedAt = new Date();
    this.sessions.set(sessionId, session);

    // Publish event
    await eventBus.publish("bim.collaboration.session.ended", {
      sessionId,
      hostId,
    });
  }

  // Helper methods
  private getPermissionsForRole(
    role: "viewer" | "commenter" | "editor",
  ): BIMCollaborationParticipant["permissions"] {
    switch (role) {
      case "editor":
        return {
          view: true,
          comment: true,
          annotate: true,
          measure: true,
          export: true,
          edit: true,
        };
      case "commenter":
        return {
          view: true,
          comment: true,
          annotate: true,
          measure: true,
          export: false,
          edit: false,
        };
      default: // viewer
        return {
          view: true,
          comment: false,
          annotate: false,
          measure: false,
          export: false,
          edit: false,
        };
    }
  }
}

// Singleton instance
let bimCollaborationServiceInstance: BIMCollaborationService | null = null;

export function getBIMCollaborationService(
  config?: BIMCollaborationServiceConfig,
): BIMCollaborationService {
  if (!bimCollaborationServiceInstance) {
    bimCollaborationServiceInstance = new BIMCollaborationService(config);
  }
  return bimCollaborationServiceInstance;
}
