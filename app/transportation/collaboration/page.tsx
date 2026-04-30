/**
 * Collaboration Page
 *
 * Shared views, comments, user presence
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  SharedView,
  Comment,
} from "@/lib/services/transportation/collaborationService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { apiFetch } from "@/utils/apiFetch";

export default function CollaborationPage() {
  const [sharedViews, setSharedViews] = useState<SharedView[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  useEffect(() => {
    loadSharedViews();
  }, []);

  const loadSharedViews = async () => {
    try {
      const response = await apiFetch("/api/transportation/collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get-shared-views",
          // userId is resolved from the API gateway context (RBAC + multi-tenant)
        }),
      });

      const result = await response.json();
      if (result.sharedViews) {
        setSharedViews(result.sharedViews);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to load shared views", err, {
        module: "transportation",
        service: "collaboration",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "collaboration",
      });
    }
  };

  const loadComments = async (entityId: string) => {
    try {
      const response = await apiFetch("/api/transportation/collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get-comments",
          entityId,
        }),
      });

      const result = await response.json();
      if (result.comments) {
        setComments(result.comments);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to load comments", err, {
        module: "transportation",
        service: "collaboration",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "collaboration",
      });
    }
  };

  const handleAddComment = async () => {
    if (!selectedEntityId || !newComment.trim()) return;

    try {
      const response = await apiFetch("/api/transportation/collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-comment",
          entityType: "SHIPMENT",
          entityId: selectedEntityId,
          userName: "Current User",
          content: newComment,
        }),
      });

      const result = await response.json();
      if (result.comment) {
        setComments([...comments, result.comment]);
        setNewComment("");
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to add comment", err, {
        module: "transportation",
        service: "collaboration",
      });
      errorTrackingService.captureException(err, {
        module: "transportation",
        service: "collaboration",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Collaboration</h1>
          <p className="text-muted-foreground mt-2">
            Share views, collaborate with comments, and track changes
          </p>
        </div>
        <Button>Share New View</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Shared Views</CardTitle>
            <CardDescription>Views shared with you or by you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sharedViews.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No shared views yet
                </p>
              ) : (
                sharedViews.map((view) => (
                  <div
                    key={view.id}
                    className="p-3 border rounded cursor-pointer hover:bg-muted"
                    onClick={() => {
                      setSelectedEntityId(view.entityId);
                      loadComments(view.entityId);
                    }}
                  >
                    <div className="font-medium">{view.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {view.entityType} • {view.sharedWith.length} shared
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
            <CardDescription>
              {selectedEntityId
                ? "Comments for selected view"
                : "Select a view to see comments"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedEntityId && (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No comments yet
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="p-3 border rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">
                            {comment.userName || "Anonymous"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <Button onClick={handleAddComment} size="sm">
                    Add Comment
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
