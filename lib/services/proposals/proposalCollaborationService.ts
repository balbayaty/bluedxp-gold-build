/**
 * Proposal Collaboration Service
 * Real-time collaboration, comments, mentions, version control
 * Integrated with existing collaboration infrastructure
 */

import { eventBus } from "@/lib/services/event-store";
import { realtimeUpdatesService } from "@/lib/services/transportation/realtimeUpdatesService";
import type { DomainEvent } from "@/types/cqrs";

// ============================================================================
// TYPES
// ============================================================================

export interface ProposalComment {
  id: string;
  proposalId: string;
  sectionId?: string;
  userId: string;
  userName: string;
  content: string;
  mentions?: string[]; // User IDs
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  parentId?: string; // For threaded comments
  reactions?: Array<{
    userId: string;
    emoji: string;
  }>;
  resolved: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ProposalVersion {
  id: string;
  proposalId: string;
  version: number;
  changes: Array<{
    type: "ADDED" | "MODIFIED" | "DELETED";
    section: string;
    field?: string;
    oldValue?: any;
    newValue?: any;
  }>;
  createdBy: string;
  createdAt: Date | string;
  snapshot: any; // Full proposal snapshot
}

export interface UserPresence {
  userId: string;
  userName: string;
  proposalId: string;
  sectionId?: string;
  status: "viewing" | "editing" | "commenting";
  lastSeen: Date | string;
}

export interface ProposalCollaboration {
  proposalId: string;
  collaborators: Array<{
    userId: string;
    role: "owner" | "editor" | "viewer" | "commenter";
    permissions: {
      view: boolean;
      edit: boolean;
      comment: boolean;
      approve: boolean;
      send: boolean;
    };
    addedAt: Date | string;
    addedBy: string;
  }>;
  comments: ProposalComment[];
  versions: ProposalVersion[];
  activeUsers: UserPresence[];
}

// ============================================================================
// COLLABORATION SERVICE
// ============================================================================

class ProposalCollaborationService {
  private collaborations: Map<string, ProposalCollaboration> = new Map();
  private comments: Map<string, ProposalComment[]> = new Map();
  private versions: Map<string, ProposalVersion[]> = new Map();
  private presence: Map<string, Map<string, UserPresence>> = new Map(); // proposalId -> userId -> presence

  constructor() {
    this.initializeEventHandlers();
  }

  /**
   * Initialize event handlers
   */
  private initializeEventHandlers(): void {
    eventBus.subscribe(
      "proposals.proposal.created",
      async (event: DomainEvent) => {
        await this.handleProposalCreated(event);
      },
    );

    eventBus.subscribe(
      "proposals.proposal.updated",
      async (event: DomainEvent) => {
        await this.handleProposalUpdated(event);
      },
    );
  }

  /**
   * Add collaborator to proposal
   */
  async addCollaborator(
    proposalId: string,
    userId: string,
    role: "owner" | "editor" | "viewer" | "commenter",
    addedBy: string,
  ): Promise<void> {
    let collaboration = this.collaborations.get(proposalId);
    if (!collaboration) {
      collaboration = {
        proposalId,
        collaborators: [],
        comments: [],
        versions: [],
        activeUsers: [],
      };
      this.collaborations.set(proposalId, collaboration);
    }

    // Check if already exists
    const existing = collaboration.collaborators.find(
      (c) => c.userId === userId,
    );
    if (existing) {
      existing.role = role;
      existing.permissions = this.getPermissionsForRole(role);
    } else {
      collaboration.collaborators.push({
        userId,
        role,
        permissions: this.getPermissionsForRole(role),
        addedAt: new Date().toISOString(),
        addedBy,
      });
    }

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.proposal.collaborator.added",
      aggregateId: proposalId,
      aggregateType: "PROPOSAL",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { proposalId, userId, role, addedBy },
    });
  }

  /**
   * Add comment to proposal
   */
  async addComment(
    proposalId: string,
    sectionId: string | undefined,
    userId: string,
    userName: string,
    content: string,
    mentions?: string[],
    parentId?: string,
  ): Promise<ProposalComment> {
    const comment: ProposalComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      proposalId,
      sectionId,
      userId,
      userName,
      content,
      mentions,
      parentId,
      reactions: [],
      resolved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!this.comments.has(proposalId)) {
      this.comments.set(proposalId, []);
    }
    this.comments.get(proposalId)!.push(comment);

    // Notify mentioned users
    if (mentions && mentions.length > 0) {
      for (const mentionedUserId of mentions) {
        await realtimeUpdatesService.createNotification({
          userId: mentionedUserId,
          type: "INFO",
          title: "Mentioned in Proposal Comment",
          message: `${userName} mentioned you in a comment on proposal ${proposalId}`,
          actionUrl: `/proposals/${proposalId}`,
        });
      }
    }

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.proposal.comment.added",
      aggregateId: proposalId,
      aggregateType: "PROPOSAL",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { proposalId, commentId: comment.id, userId, sectionId },
    });

    return comment;
  }

  /**
   * Update user presence
   */
  async updatePresence(
    proposalId: string,
    userId: string,
    userName: string,
    status: "viewing" | "editing" | "commenting",
    sectionId?: string,
  ): Promise<void> {
    if (!this.presence.has(proposalId)) {
      this.presence.set(proposalId, new Map());
    }

    const presenceMap = this.presence.get(proposalId)!;
    presenceMap.set(userId, {
      userId,
      userName,
      proposalId,
      sectionId,
      status,
      lastSeen: new Date().toISOString(),
    });

    // Publish real-time update
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.proposal.presence.updated",
      aggregateId: proposalId,
      aggregateType: "PROPOSAL",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { proposalId, userId, status, sectionId },
    });
  }

  /**
   * Create version snapshot
   */
  async createVersion(
    proposalId: string,
    proposal: any,
    createdBy: string,
    changes?: ProposalVersion["changes"],
  ): Promise<ProposalVersion> {
    const existingVersions = this.versions.get(proposalId) || [];
    const nextVersion =
      existingVersions.length > 0
        ? existingVersions[existingVersions.length - 1].version + 1
        : 1;

    const version: ProposalVersion = {
      id: `version-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      proposalId,
      version: nextVersion,
      changes: changes || [],
      createdBy,
      createdAt: new Date().toISOString(),
      snapshot: JSON.parse(JSON.stringify(proposal)), // Deep copy
    };

    if (!this.versions.has(proposalId)) {
      this.versions.set(proposalId, []);
    }
    this.versions.get(proposalId)!.push(version);

    // Publish event
    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "proposals.proposal.version.created",
      aggregateId: proposalId,
      aggregateType: "PROPOSAL",
      version: nextVersion,
      timestamp: new Date().toISOString(),
      payload: { proposalId, version: nextVersion, createdBy },
    });

    return version;
  }

  /**
   * Compare versions
   */
  compareVersions(
    proposalId: string,
    version1: number,
    version2: number,
  ): {
    added: ProposalVersion["changes"];
    modified: ProposalVersion["changes"];
    deleted: ProposalVersion["changes"];
  } {
    const versions = this.versions.get(proposalId) || [];
    const v1 = versions.find((v) => v.version === version1);
    const v2 = versions.find((v) => v.version === version2);

    if (!v1 || !v2) {
      throw new Error("Versions not found");
    }

    const added: ProposalVersion["changes"] = [];
    const modified: ProposalVersion["changes"] = [];
    const deleted: ProposalVersion["changes"] = [];

    // Compare snapshots (simplified - would use deep diff in production)
    const sections1 = v1.snapshot.sections || [];
    const sections2 = v2.snapshot.sections || [];

    const sectionMap1 = new Map(sections1.map((s: any) => [s.id, s]));
    const sectionMap2 = new Map(sections2.map((s: any) => [s.id, s]));

    // Find added sections
    for (const [id, section] of sectionMap2) {
      if (!sectionMap1.has(id)) {
        added.push({
          type: "ADDED",
          section: section.title || id,
          newValue: section,
        });
      }
    }

    // Find deleted sections
    for (const [id, section] of sectionMap1) {
      if (!sectionMap2.has(id)) {
        deleted.push({
          type: "DELETED",
          section: section.title || id,
          oldValue: section,
        });
      }
    }

    // Find modified sections
    for (const [id, section2] of sectionMap2) {
      const section1 = sectionMap1.get(id);
      if (section1 && JSON.stringify(section1) !== JSON.stringify(section2)) {
        modified.push({
          type: "MODIFIED",
          section: section2.title || id,
          oldValue: section1,
          newValue: section2,
        });
      }
    }

    return { added, modified, deleted };
  }

  /**
   * Get comments for proposal
   */
  getComments(proposalId: string, sectionId?: string): ProposalComment[] {
    const comments = this.comments.get(proposalId) || [];
    if (sectionId) {
      return comments.filter((c) => c.sectionId === sectionId);
    }
    return comments;
  }

  /**
   * Get versions for proposal
   */
  getVersions(proposalId: string): ProposalVersion[] {
    return this.versions.get(proposalId) || [];
  }

  /**
   * Get active users
   */
  getActiveUsers(proposalId: string): UserPresence[] {
    const presenceMap = this.presence.get(proposalId);
    if (!presenceMap) return [];

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return Array.from(presenceMap.values()).filter(
      (p) => new Date(p.lastSeen) > fiveMinutesAgo,
    );
  }

  /**
   * Get permissions for role
   */
  private getPermissionsForRole(
    role: string,
  ): ProposalCollaboration["collaborators"][0]["permissions"] {
    switch (role) {
      case "owner":
        return {
          view: true,
          edit: true,
          comment: true,
          approve: true,
          send: true,
        };
      case "editor":
        return {
          view: true,
          edit: true,
          comment: true,
          approve: false,
          send: false,
        };
      case "commenter":
        return {
          view: true,
          edit: false,
          comment: true,
          approve: false,
          send: false,
        };
      case "viewer":
        return {
          view: true,
          edit: false,
          comment: false,
          approve: false,
          send: false,
        };
      default:
        return {
          view: false,
          edit: false,
          comment: false,
          approve: false,
          send: false,
        };
    }
  }

  /**
   * Event handlers
   */
  private async handleProposalCreated(event: DomainEvent): Promise<void> {
    const { proposalId, createdBy } = event.payload || {};
    if (proposalId && createdBy) {
      // Add creator as owner
      await this.addCollaborator(proposalId, createdBy, "owner", createdBy);
    }
  }

  private async handleProposalUpdated(event: DomainEvent): Promise<void> {
    const { proposalId, updates, updatedBy } = event.payload || {};
    // Would create version snapshot here
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const proposalCollaborationService = new ProposalCollaborationService();
