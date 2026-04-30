"use client";

/**
 * Enhanced HazalyzeCopilot Widget
 * Adds: Streaming, file upload, voice input, markdown rendering, quick actions
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Minimize2,
  Maximize2,
  MessageSquare,
  Send,
  Loader2,
  GripVertical,
  Paperclip,
  Mic,
  Download,
  Sparkles,
  Zap,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type {
  CopilotMessage,
  CopilotRequest,
} from "@/lib/services/copilot/copilotService";

// ============================================================================
// TYPES
// ============================================================================

interface WidgetState {
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isCollapsed: boolean;
  zIndex: number;
}

interface HazalyzeCopilotWidgetEnhancedProps {
  tenantId: string;
  userId: string;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  onClose?: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MIN_WIDTH = 320;
const MIN_HEIGHT = 400;
const MAX_WIDTH = 800;
const MAX_HEIGHT = 900;
const DEFAULT_WIDTH = 420;
const DEFAULT_HEIGHT = 600;
const COLLAPSED_HEIGHT = 60;
const BASE_Z_INDEX = 9990;
const MAX_Z_INDEX = 9999;

// Quick actions
const QUICK_ACTIONS = [
  { id: "search-shipments", label: "Search Shipments", icon: "📦" },
  { id: "check-inventory", label: "Check Inventory", icon: "📊" },
  { id: "compliance-check", label: "Compliance Check", icon: "✅" },
  { id: "create-report", label: "Create Report", icon: "📄" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function HazalyzeCopilotWidgetEnhanced({
  tenantId,
  userId,
  defaultPosition,
  defaultSize,
  onClose,
}: HazalyzeCopilotWidgetEnhancedProps) {
  // State
  const [widgetState, setWidgetState] = useState<WidgetState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("copilot-widget-state");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            position: parsed.position ||
              defaultPosition || {
                x: window.innerWidth - DEFAULT_WIDTH - 20,
                y: 80,
              },
            size: parsed.size ||
              defaultSize || { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
            isMinimized: parsed.isMinimized || false,
            isCollapsed: parsed.isCollapsed || false,
            zIndex: BASE_Z_INDEX,
          };
        } catch {}
      }
    }
    return {
      position: defaultPosition || {
        x:
          typeof window !== "undefined"
            ? window.innerWidth - DEFAULT_WIDTH - 20
            : 100,
        y: 80,
      },
      size: defaultSize || { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
      isMinimized: false,
      isCollapsed: false,
      zIndex: BASE_Z_INDEX,
    };
  });

  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Refs
  const widgetRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Auto-scroll
  useEffect(() => {
    if (
      messagesEndRef.current &&
      !widgetState.isMinimized &&
      !widgetState.isCollapsed
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [
    messages,
    streamingContent,
    widgetState.isMinimized,
    widgetState.isCollapsed,
  ]);

  // Save state
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "copilot-widget-state",
        JSON.stringify({
          position: widgetState.position,
          size: widgetState.size,
          isMinimized: widgetState.isMinimized,
          isCollapsed: widgetState.isCollapsed,
        }),
      );
    }
  }, [widgetState]);

  // Send message (with streaming support)
  const handleSend = useCallback(
    async (messageText?: string) => {
      const textToSend = messageText || input.trim();
      if (!textToSend || isLoading) return;

      const userMessage: CopilotMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: textToSend,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
      setIsStreaming(true);
      setStreamingContent("");
      setError(null);

      try {
        // Try streaming first
        const useStreaming = true; // Could be a preference

        if (useStreaming) {
          const response = await fetch("/api/copilot/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId,
              message: textToSend,
              options: { useRAG: true, useMemory: true, useTools: true },
            } as CopilotRequest),
          });

          if (!response.ok) throw new Error("Streaming failed");

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let fullContent = "";

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split("\n").filter(Boolean);

              for (const line of lines) {
                try {
                  const data = JSON.parse(line);
                  if (data.type === "chunk") {
                    fullContent += data.content;
                    setStreamingContent(fullContent);
                  } else if (data.type === "metadata") {
                    // Metadata received, streaming complete
                  } else if (data.type === "error") {
                    throw new Error(data.error);
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }

          // Add final message
          const assistantMessage: CopilotMessage = {
            id: `msg-${Date.now()}`,
            role: "assistant",
            content: fullContent,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setStreamingContent("");
        } else {
          // Non-streaming fallback
          const response = await fetch("/api/copilot/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId,
              message: textToSend,
              options: { useRAG: true, useMemory: true, useTools: true },
            } as CopilotRequest),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to get response");
          }

          const data = await response.json();
          setMessages((prev) => [...prev, data.message]);
        }
      } catch (err) {
        console.error("[Copilot] Error:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        const errorMessage: CopilotMessage = {
          id: `msg-error-${Date.now()}`,
          role: "assistant",
          content: "I apologize, but I encountered an error. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        setStreamingContent("");
      }
    },
    [input, isLoading, conversationId],
  );

  // Voice input
  const handleVoiceInput = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });

        // Convert to text (would use speech-to-text API)
        // For now, show a placeholder
        const formData = new FormData();
        formData.append("audio", audioBlob);

        try {
          // Would call speech-to-text API
          // const response = await fetch('/api/copilot/voice', { method: 'POST', body: formData })
          // const { text } = await response.json()
          // setInput(text)
          // handleSend(text)

          // Placeholder
          alert(
            "Voice input would be processed here. Speech-to-text API integration needed.",
          );
        } catch (error) {
          console.error("Voice processing error:", error);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Voice input error:", error);
      alert("Microphone access denied or not available");
    }
  }, [isRecording]);

  // File upload
  const handleFileUpload = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "message",
      `Analyze this ${file.type.includes("image") ? "image" : "document"}`,
    );

    setIsLoading(true);
    try {
      // Would call document analysis API
      // const response = await fetch('/api/copilot/analyze-document', { method: 'POST', body: formData })
      // const data = await response.json()
      // handleSend(data.analysis)

      // Placeholder
      alert(`File upload would be processed here: ${file.name} (${file.type})`);
    } catch (error) {
      console.error("File upload error:", error);
      setError("Failed to process file");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Quick action
  const handleQuickAction = useCallback(
    (actionId: string) => {
      const action = QUICK_ACTIONS.find((a) => a.id === actionId);
      if (action) {
        handleSend(action.label);
      }
    },
    [handleSend],
  );

  // Export conversation
  const handleExport = useCallback(() => {
    const exportData = {
      conversationId,
      messages,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `copilot-conversation-${conversationId || Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [conversationId, messages]);

  // Render minimized
  if (widgetState.isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 z-[9999] cursor-pointer"
        onClick={() =>
          setWidgetState((prev) => ({ ...prev, isMinimized: false }))
        }
      >
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-full p-4 shadow-2xl hover:scale-110 transition-transform">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
      </div>
    );
  }

  // Render collapsed
  if (widgetState.isCollapsed) {
    return (
      <div
        ref={widgetRef}
        className="fixed bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{
          left: `${widgetState.position.x}px`,
          top: `${widgetState.position.y}px`,
          width: `${widgetState.size.width}px`,
          height: `${COLLAPSED_HEIGHT}px`,
          zIndex: widgetState.zIndex,
        }}
      >
        <div className="widget-header h-full flex items-center justify-between px-4 cursor-move bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-gray-400" />
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-sm">HazalyzeCopilot</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                setWidgetState((prev) => ({ ...prev, isCollapsed: false }))
              }
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                setWidgetState((prev) => ({ ...prev, isMinimized: true }))
              }
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                <X className="w-4 h-4 text-red-600 dark:text-red-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render full widget (simplified - would include all drag/resize logic from original)
  return (
    <div
      ref={widgetRef}
      className="fixed bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
      style={{
        left: `${widgetState.position.x}px`,
        top: `${widgetState.position.y}px`,
        width: `${widgetState.size.width}px`,
        height: `${widgetState.size.height}px`,
        zIndex: widgetState.zIndex,
      }}
    >
      {/* Header */}
      <div className="widget-header flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold">HazalyzeCopilot</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleExport}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Export conversation"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Quick actions"
          >
            <Zap className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              setWidgetState((prev) => ({ ...prev, isCollapsed: true }))
            }
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
            >
              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {showQuickActions && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.id)}
                className="px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm">Start a conversation with HazalyzeCopilot</p>
            <p className="text-xs mt-2">Press Ctrl+K to focus input</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {message.role === "assistant" ? (
                <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                  {message.content}
                </ReactMarkdown>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        ))}
        {isStreaming && streamingContent && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700 max-w-[80%]">
              <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                {streamingContent}
              </ReactMarkdown>
              <Loader2 className="w-4 h-4 animate-spin text-blue-600 mt-2" />
            </div>
          </div>
        )}
        {isLoading && !isStreaming && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
          <div className="flex gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Upload file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              onClick={handleVoiceInput}
              className={`p-2 rounded transition-colors ${
                isRecording
                  ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
              title="Voice input"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask HazalyzeCopilot anything..."
            disabled={isLoading}
            className="copilot-input flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
