/**
 * Conversation List Component
 * Displays list of conversations with unread indicators
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, CheckCircle, Clock, Archive } from "lucide-react";
import type { Conversation } from "@/types/marketplace-messaging";

interface ConversationListProps {
  userId: string;
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId?: string;
  filters?: {
    bookingId?: string;
    serviceId?: string;
    status?: Conversation["status"];
    unreadOnly?: boolean;
  };
}

export default function ConversationList({
  userId,
  onSelectConversation,
  selectedConversationId,
  filters,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
    // Refresh every 30 seconds
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, [userId, filters]);

  const loadConversations = async () => {
    try {
      const params = new URLSearchParams({
        userId,
        ...(filters?.bookingId && { bookingId: filters.bookingId }),
        ...(filters?.serviceId && { serviceId: filters.serviceId }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.unreadOnly && { unreadOnly: "true" }),
      });

      const response = await fetch(`/api/marketplace/messages?${params}`);
      const result = await response.json();
      if (result.success) {
        setConversations(result.data);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return date.toLocaleDateString();
  };

  const getUnreadCount = (conversation: Conversation) => {
    return userId === conversation.providerId
      ? conversation.unreadCount.provider
      : conversation.unreadCount.customer;
  };

  const getOtherParty = (conversation: Conversation) => {
    return userId === conversation.providerId
      ? { id: conversation.customerId, name: conversation.customerName }
      : { id: conversation.providerId, name: conversation.providerName };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center p-12">
        <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">
          No conversations found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const otherParty = getOtherParty(conversation);
        const unreadCount = getUnreadCount(conversation);
        const isSelected = selectedConversationId === conversation.id;

        return (
          <motion.div
            key={conversation.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => onSelectConversation(conversation.id)}
            className={`p-4 rounded-lg cursor-pointer transition ${
              isSelected
                ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500"
                : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {otherParty.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {otherParty.name}
                  </h4>
                  {conversation.lastMessageAt && (
                    <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                      {formatTime(conversation.lastMessageAt)}
                    </span>
                  )}
                </div>
                {conversation.subject && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 truncate">
                    {conversation.subject}
                  </p>
                )}
                {conversation.lastMessage && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    {conversation.lastMessage.content.substring(0, 60)}
                    {conversation.lastMessage.content.length > 60 ? "..." : ""}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {conversation.status === "ARCHIVED" && (
                    <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded flex items-center gap-1">
                      <Archive className="w-3 h-3" />
                      Archived
                    </span>
                  )}
                  {unreadCount > 0 && (
                    <span className="text-xs px-2 py-1 bg-blue-500 text-white rounded-full font-semibold">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
