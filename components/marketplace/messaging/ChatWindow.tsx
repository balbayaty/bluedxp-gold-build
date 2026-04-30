/**
 * Chat Window Component
 * Real-time messaging interface for marketplace conversations
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Paperclip,
  Image,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  FileText,
  Download,
} from "lucide-react";
import type { Conversation, Message } from "@/types/marketplace-messaging";
import { eventBus } from "@/lib/services/event-store";
import MessageComposer from "./MessageComposer";

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  onClose?: () => void;
}

export default function ChatWindow({
  conversationId,
  currentUserId,
  onClose,
}: ChatWindowProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadConversation();
    // Set up Event Bus subscription for real-time updates
    const unsubscribe = eventBus.subscribe(
      "marketplace.message.received",
      (data: any) => {
        if (data.conversationId === conversationId) {
          setMessages((prev) => [...prev, data.message]);
          setConversation(data.conversation);
        }
      },
    );

    return () => {
      unsubscribe();
    };
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async () => {
    try {
      const response = await fetch(
        `/api/marketplace/messages/${conversationId}`,
      );
      const result = await response.json();
      if (result.success) {
        setConversation(result.data.conversation);
        setMessages(result.data.messages);

        // Mark messages as read
        await markAsRead();
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await fetch(`/api/marketplace/messages/${conversationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark-read",
          userId: currentUserId,
        }),
      });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    setSending(true);
    try {
      const response = await fetch("/api/marketplace/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-message",
          conversationId,
          content,
          type: "TEXT",
          attachments,
          senderId: currentUserId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setMessages((prev) => [...prev, result.data]);
        setConversation((prev) =>
          prev
            ? {
                ...prev,
                lastMessage: result.data,
                lastMessageAt: result.data.createdAt,
              }
            : null,
        );
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600">Conversation not found</p>
        </div>
      </div>
    );
  }

  const otherParty =
    currentUserId === conversation.providerId
      ? { id: conversation.customerId, name: conversation.customerName }
      : { id: conversation.providerId, name: conversation.providerName };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
            {otherParty.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">
              {otherParty.name}
            </h3>
            {conversation.subject && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {conversation.subject}
              </p>
            )}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => {
            const isOwn = message.senderId === currentUserId;
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[70%] ${isOwn ? "order-2" : "order-1"}`}>
                  {!isOwn && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {message.senderName}
                      </span>
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwn
                        ? "bg-blue-500 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                    }`}
                  >
                    {message.type === "TEXT" && (
                      <p className="whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    )}
                    {message.type === "FILE" && message.attachments && (
                      <div className="space-y-2">
                        {message.attachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm truncate">{att.name}</span>
                            <Download className="w-4 h-4 ml-auto" />
                          </a>
                        ))}
                      </div>
                    )}
                    {message.type === "IMAGE" && message.attachments && (
                      <div className="space-y-2">
                        {message.attachments.map((att) => (
                          <img
                            key={att.id}
                            src={att.url}
                            alt={att.name}
                            className="max-w-full rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                    {message.type === "SYSTEM" && (
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{message.content}</span>
                      </div>
                    )}
                  </div>
                  <div
                    className={`flex items-center gap-2 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <span className="text-xs text-slate-500">
                      {formatTime(message.createdAt)}
                    </span>
                    {isOwn && (
                      <span className="text-xs">
                        {message.status === "READ" ? (
                          <CheckCircle className="w-3 h-3 text-blue-500" />
                        ) : message.status === "DELIVERED" ? (
                          <CheckCircle className="w-3 h-3 text-slate-400" />
                        ) : (
                          <Clock className="w-3 h-3 text-slate-400" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4">
        <MessageComposer
          onSend={handleSendMessage}
          disabled={sending}
          placeholder={`Message ${otherParty.name}...`}
        />
      </div>
    </div>
  );
}
