/**
 * Proposal Collaboration Panel
 *
 * Real-time collaboration features for proposals
 * Comments, mentions, version control
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CollaborationComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  sectionId?: string;
  mentions?: string[];
  createdAt: string;
  updatedAt?: string;
}

interface ProposalCollaborationPanelProps {
  proposalId: string;
  currentUserId: string;
  currentUserName: string;
  onComment?: (comment: CollaborationComment) => void;
  onMention?: (userId: string) => void;
}

export default function ProposalCollaborationPanel({
  proposalId,
  currentUserId,
  currentUserName,
  onComment,
  onMention,
}: ProposalCollaborationPanelProps) {
  const [comments, setComments] = useState<CollaborationComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);

  useEffect(() => {
    // Load comments
    loadComments();

    // Set up real-time updates (would use WebSocket in production)
    const interval = setInterval(() => {
      loadComments();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [proposalId]);

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}/comments`);
      const data = await response.json();

      if (data.success && data.comments) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    const comment: CollaborationComment = {
      id: `comment-${Date.now()}`,
      userId: currentUserId,
      userName: currentUserName,
      content: newComment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch(`/api/proposals/${proposalId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comment),
      });

      const data = await response.json();

      if (data.success) {
        setComments([...comments, comment]);
        setNewComment("");
        onComment?.(comment);
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    }
  };

  const handleMention = (userId: string) => {
    setNewComment((prev) => `${prev}@${userId} `);
    onMention?.(userId);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Collaboration
        </h3>
        <div className="flex items-center gap-2">
          {activeUsers.length > 0 && (
            <div className="flex -space-x-2">
              {activeUsers.slice(0, 3).map((userId, idx) => (
                <div
                  key={userId}
                  className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-medium"
                  style={{ zIndex: 10 - idx }}
                >
                  {userId.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {activeUsers.length} active
          </span>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                  {comment.userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {comment.userName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(comment.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {comment.content}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {comments.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <i className="ri-chat-3-line text-3xl mb-2" />
            <p className="text-sm">No comments yet</p>
            <p className="text-xs mt-1">Start the conversation</p>
          </div>
        )}
      </div>

      {/* Comment Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => {
              setNewComment(e.target.value);
              setIsTyping(e.target.value.length > 0);
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmitComment();
              }
            }}
            placeholder="Add a comment... (Press Enter to send)"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSubmitComment}
            disabled={!newComment.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i className="ri-send-plane-line" />
          </button>
        </div>
        {isTyping && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Press Enter to send
          </p>
        )}
      </div>
    </div>
  );
}
