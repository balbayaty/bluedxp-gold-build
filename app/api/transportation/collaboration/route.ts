/**
 * Collaboration API Route
 *
 * Shared views, comments, user presence, change tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { collaborationService } from "@/lib/services/transportation/collaborationService";
import type {
  SharedView,
  Comment,
  UserPresence,
  ChangeTracking,
} from "@/lib/services/transportation/collaborationService";

async function handler(
  req: NextRequest,
  context: { tenantId?: string; userId?: string },
) {
  try {
    const body = await req.json();
    const { action, ...data } = body;
    const tenantId = context?.tenantId;

    if (!tenantId || String(tenantId).trim().length === 0) {
      return NextResponse.json(
        { error: "tenantId is required (multi-tenant day 1)" },
        { status: 400 },
      );
    }

    // Prevent userId spoofing if gateway user context exists
    if (
      context?.userId &&
      data.userId &&
      String(data.userId) !== String(context.userId)
    ) {
      return NextResponse.json({ error: "userId mismatch" }, { status: 403 });
    }
    if (
      context?.userId &&
      data.ownerId &&
      String(data.ownerId) !== String(context.userId)
    ) {
      return NextResponse.json({ error: "ownerId mismatch" }, { status: 403 });
    }

    switch (action) {
      case "share-view":
        return await handleShareView({
          ...(data as any),
          ownerId: context?.userId,
        });

      case "get-shared-views":
        return await handleGetSharedViews({
          ...(data as any),
          userId: context?.userId,
        });

      case "add-comment":
        return await handleAddComment({
          ...(data as any),
          userId: context?.userId,
        });

      case "get-comments":
        return await handleGetComments(data);

      case "update-presence":
        return await handleUpdatePresence({
          ...(data as any),
          userId: context?.userId,
        });

      case "get-presence":
        return await handleGetPresence(data);

      case "get-changes":
        return await handleGetChanges(data);

      case "resolve-comment":
        return await handleResolveComment({
          ...(data as any),
          userId: context?.userId,
        });

      case "add-reaction":
        return await handleAddReaction({
          ...(data as any),
          userId: context?.userId,
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Collaboration API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

async function handleShareView(data: {
  name: string;
  description?: string;
  entityType: SharedView["entityType"];
  entityId: string;
  ownerId: string;
  sharedWith: Array<{ userId: string; role: string }>;
  permissions?: SharedView["permissions"];
  isPublic?: boolean;
}) {
  const sharedView = await collaborationService.shareView(data as any);
  return NextResponse.json({ sharedView });
}

async function handleGetSharedViews(data: { userId: string }) {
  const sharedViews = collaborationService.getSharedViewsForUser(data.userId);
  return NextResponse.json({ sharedViews });
}

async function handleAddComment(data: {
  entityType: SharedView["entityType"];
  entityId: string;
  userId: string;
  userName?: string;
  content: string;
  mentions?: string[];
  attachments?: Comment["attachments"];
  parentId?: string;
}) {
  const comment = await collaborationService.addComment(data);
  return NextResponse.json({ comment });
}

async function handleGetComments(data: { entityId: string }) {
  const comments = collaborationService.getComments(data.entityId);
  return NextResponse.json({ comments });
}

async function handleUpdatePresence(data: {
  userId: string;
  userName?: string;
  avatar?: string;
  entityType: SharedView["entityType"];
  entityId: string;
  status: UserPresence["status"];
  currentView?: string;
  cursor?: { x: number; y: number };
}) {
  const presence = await collaborationService.updatePresence(data);
  return NextResponse.json({ presence });
}

async function handleGetPresence(data: { entityId: string }) {
  const presence = collaborationService.getPresence(data.entityId);
  return NextResponse.json({ presence });
}

async function handleGetChanges(data: { entityId: string; limit?: number }) {
  const changes = collaborationService.getChangeHistory(
    data.entityId,
    data.limit,
  );
  return NextResponse.json({ changes });
}

async function handleResolveComment(data: {
  entityId: string;
  commentId: string;
  userId: string;
}) {
  await collaborationService.resolveComment(
    data.entityId,
    data.commentId,
    data.userId,
  );
  return NextResponse.json({ success: true });
}

async function handleAddReaction(data: {
  entityId: string;
  commentId: string;
  userId: string;
  emoji: string;
}) {
  await collaborationService.addReaction(
    data.entityId,
    data.commentId,
    data.userId,
    data.emoji,
  );
  return NextResponse.json({ success: true });
}

export const POST = withTransportationAPI(handler, { action: "execute" });
