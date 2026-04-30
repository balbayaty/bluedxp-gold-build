"use client";

/**
 * HazalyzeCopilot Widget
 * Intelligent, draggable, resizable dashboard widget
 * Future-proof UI/UX with smart positioning and collision detection
 * 4IR & 5IR aligned - Human-centric AI collaboration
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
  Settings2,
  Zap,
  Code,
  FileText,
  Brain,
  Mic,
  Image as ImageIcon,
  History,
  Ticket,
  Search,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Target,
  Lightbulb,
  Rocket,
  Wrench,
  FileCheck,
  BarChart3,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import type {
  CopilotMessage,
  CopilotRequest,
  CopilotResponse,
} from "@/lib/services/copilot/copilotService";
import type { EnhancedCopilotResponse } from "@/lib/services/copilot/enhancedCopilotService";
import type { CopilotHistoryItem, SupportTicket } from "@/types/copilotHistory";
import { copilotHistoryService } from "@/lib/services/copilot/historyService";
import { usePathname, useRouter } from "next/navigation";
import { MarkdownRenderer } from "./MarkdownRenderer";

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

interface HazalyzeCopilotWidgetProps {
  tenantId: string;
  userId: string;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  onClose?: () => void;
  widgetId?: string;
  title?: string;
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

// Z-index management - ensure widget is always on top but doesn't block critical UI
const BASE_Z_INDEX = 9990;
const MAX_Z_INDEX = 9999;

// ============================================================================
// COMPONENT
// ============================================================================

export function HazalyzeCopilotWidget({
  tenantId,
  userId,
  defaultPosition,
  defaultSize,
  onClose,
  widgetId = "copilot",
  title = "HazalyzeCopilot",
}: HazalyzeCopilotWidgetProps) {
  const router = useRouter();
  const pathname = usePathname();

  // State
  const [widgetState, setWidgetState] = useState<WidgetState>(() => {
    // FORCE use defaultPosition - ignore localStorage to prevent overlaps
    // This ensures widgets always start in correct positions
    const forcedPosition = defaultPosition || {
      x:
        typeof window !== "undefined"
          ? window.innerWidth - DEFAULT_WIDTH - 20
          : 100,
      y: 80,
    };

    // Try to load saved state from localStorage
    let savedState: Partial<WidgetState> = {};
    if (typeof window !== "undefined") {
      try {
        const storageKey = `copilot-widget-state-${widgetId}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          savedState = JSON.parse(saved);
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }

    return {
      position: savedState.position || forcedPosition,
      size: savedState.size ||
        defaultSize || { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
      // Default to minimized (collapsed) - user can open it when needed
      isMinimized:
        savedState.isMinimized !== undefined ? savedState.isMinimized : true,
      isCollapsed:
        savedState.isCollapsed !== undefined ? savedState.isCollapsed : true,
      zIndex: BASE_Z_INDEX,
    };
  });

  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<
    "online" | "offline" | "checking"
  >("online");
  const [mode, setMode] = useState<
    "chat" | "command" | "create" | "history" | "tickets" | "autopilot"
  >("chat");
  
  // Autopilot state
  const [activeWorkflow, setActiveWorkflow] = useState<any>(null);
  const [autopilotMode, setAutopilotMode] = useState<"supervised" | "autonomous">("supervised");
  const [workflowHistory, setWorkflowHistory] = useState<any[]>([]);
  const [history, setHistory] = useState<CopilotHistoryItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<
    Array<{
      text: string;
      icon: React.ReactNode;
      gradient: string;
      category:
        | "optimize"
        | "analyze"
        | "fix"
        | "improve"
        | "generate"
        | "predict";
      description?: string;
    }>
  >([]);
  /* REMOVED: activeFeatures state replaced by functional state */
  const [activeAttachment, setActiveAttachment] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [useStreaming, setUseStreaming] = useState(false); // Disable streaming for stability
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Input Handler
  const toggleVoiceInput = useCallback(() => {
    if (isListening) {
      setIsListening(false);
      // Stop logic handles automatically by browser or we can force stop if we had the instance
      return;
    }

    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    setIsListening(true);
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + (prev ? " " : "") + transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [isListening]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setActiveAttachment(e.target.files[0]);
    }
  };

  // Refs
  const widgetRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Keep widget on screen - allow user to position freely
  const keepOnScreen = useCallback(() => {
    if (!widgetRef.current || typeof window === "undefined") return;

    const widget = widgetRef.current.getBoundingClientRect();
    let newX = widgetState.position.x;
    let newY = widgetState.position.y;
    let positionChanged = false;

    // Check boundaries
    if (newX < 0) {
      newX = 10;
      positionChanged = true;
    }
    if (newY < 0) {
      newY = 10;
      positionChanged = true;
    }
    if (newX + widgetState.size.width > window.innerWidth) {
      newX = window.innerWidth - widgetState.size.width - 10;
      positionChanged = true;
    }
    if (newY + widgetState.size.height > window.innerHeight) {
      newY = window.innerHeight - widgetState.size.height - 10;
      positionChanged = true;
    }

    // Removed overlap detection - user can position widgets freely

    // Final boundary check
    if (newX < 10) {
      newX = 10;
      positionChanged = true;
    }
    if (newY < 10) {
      newY = 10;
      positionChanged = true;
    }
    if (newX + widgetState.size.width > window.innerWidth) {
      newX = window.innerWidth - widgetState.size.width - 10;
      positionChanged = true;
    }
    if (newY + widgetState.size.height > window.innerHeight) {
      newY = window.innerHeight - widgetState.size.height - 10;
      positionChanged = true;
    }

    if (positionChanged) {
      setWidgetState((prev) => ({ ...prev, position: { x: newX, y: newY } }));
    }
  }, [widgetState.position, widgetState.size, widgetId]);

  // Get context-aware suggestions based on current page - DeepThink Style
  useEffect(() => {
    const getContextualSuggestions = (): Array<{
      text: string;
      icon: React.ReactNode;
      gradient: string;
      category:
        | "optimize"
        | "analyze"
        | "fix"
        | "improve"
        | "generate"
        | "predict";
      description?: string;
    }> => {
      if (!pathname) return [];

      if (pathname.includes("/shipments")) {
        return [
          {
            text: "Optimize route for current shipment",
            icon: <Rocket className="w-5 h-5" />,
            gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
            category: "optimize",
            description: "AI-powered route optimization",
          },
          {
            text: "Generate shipment report for this week",
            icon: <BarChart3 className="w-5 h-5" />,
            gradient: "from-blue-500 via-cyan-500 to-teal-500",
            category: "generate",
            description: "Comprehensive analytics",
          },
          {
            text: "Predict delivery delays",
            icon: <Brain className="w-5 h-5" />,
            gradient: "from-amber-500 via-orange-500 to-red-500",
            category: "predict",
            description: "ML-based predictions",
          },
          {
            text: "Calculate cost savings opportunities",
            icon: <TrendingDown className="w-5 h-5" />,
            gradient: "from-emerald-500 via-green-500 to-teal-500",
            category: "analyze",
            description: "Financial insights",
          },
        ];
      } else if (
        pathname.includes("/warehouse") ||
        pathname.includes("/inventory")
      ) {
        return [
          {
            text: "Analyze warehouse capacity",
            icon: <Brain className="w-5 h-5" />,
            gradient: "from-indigo-500 via-purple-500 to-pink-500",
            category: "analyze",
            description: "Deep capacity analysis",
          },
          {
            text: "Suggest inventory optimization",
            icon: <Target className="w-5 h-5" />,
            gradient: "from-blue-500 via-cyan-500 to-emerald-500",
            category: "optimize",
            description: "AI recommendations",
          },
          {
            text: "Generate picking list",
            icon: <FileCheck className="w-5 h-5" />,
            gradient: "from-violet-500 to-purple-500",
            category: "generate",
            description: "Smart list generation",
          },
          {
            text: "Create safety inspection checklist",
            icon: <CheckCircle2 className="w-5 h-5" />,
            gradient: "from-green-500 to-emerald-500",
            category: "generate",
            description: "Compliance ready",
          },
        ];
      } else if (
        pathname.includes("/finance") ||
        pathname.includes("/valuation")
      ) {
        return [
          {
            text: "Generate P&L report",
            icon: <BarChart3 className="w-5 h-5" />,
            gradient: "from-blue-500 via-indigo-500 to-purple-500",
            category: "generate",
            description: "Financial analysis",
          },
          {
            text: "Analyze revenue trends",
            icon: <TrendingUp className="w-5 h-5" />,
            gradient: "from-emerald-500 to-green-500",
            category: "analyze",
            description: "Trend insights",
          },
          {
            text: "Identify cost reduction areas",
            icon: <Target className="w-5 h-5" />,
            gradient: "from-orange-500 to-red-500",
            category: "analyze",
            description: "Cost optimization",
          },
          {
            text: "Forecast next quarter revenue",
            icon: <Brain className="w-5 h-5" />,
            gradient: "from-violet-500 to-fuchsia-500",
            category: "predict",
            description: "Predictive analytics",
          },
        ];
      } else if (pathname.includes("/inbound") || pathname.includes("/asn")) {
        return [
          {
            text: "Analyze ASN processing time",
            icon: <Brain className="w-5 h-5" />,
            gradient: "from-indigo-500 via-purple-500 to-pink-500",
            category: "analyze",
            description: "Performance deep dive",
          },
          {
            text: "Check for missing documents",
            icon: <FileCheck className="w-5 h-5" />,
            gradient: "from-amber-500 to-orange-500",
            category: "fix",
            description: "Compliance check",
          },
          {
            text: "Optimize receiving workflow",
            icon: <Rocket className="w-5 h-5" />,
            gradient: "from-blue-500 to-cyan-500",
            category: "optimize",
            description: "Workflow enhancement",
          },
          {
            text: "Generate inbound performance report",
            icon: <BarChart3 className="w-5 h-5" />,
            gradient: "from-teal-500 to-emerald-500",
            category: "generate",
            description: "Comprehensive metrics",
          },
        ];
      } else if (pathname.includes("/outbound")) {
        return [
          {
            text: "Optimize outbound operations",
            icon: <Rocket className="w-5 h-5" />,
            gradient: "from-violet-500 to-purple-500",
            category: "optimize",
            description: "Efficiency boost",
          },
          {
            text: "Generate shipping labels",
            icon: <FileCheck className="w-5 h-5" />,
            gradient: "from-blue-500 to-indigo-500",
            category: "generate",
            description: "Batch generation",
          },
          {
            text: "Analyze delivery performance",
            icon: <BarChart3 className="w-5 h-5" />,
            gradient: "from-cyan-500 to-teal-500",
            category: "analyze",
            description: "Performance metrics",
          },
          {
            text: "Calculate shipping costs",
            icon: <TrendingDown className="w-5 h-5" />,
            gradient: "from-green-500 to-emerald-500",
            category: "analyze",
            description: "Cost analysis",
          },
        ];
      }

      // Default DeepThink suggestions with enhanced design
      return [
        {
          text: "DeepThink: Optimize current workflow",
          icon: <Brain className="w-5 h-5" />,
          gradient: "from-violet-600 via-purple-600 to-fuchsia-600",
          category: "optimize",
          description: "AI-powered workflow analysis",
        },
        {
          text: "DeepThink: Generate comprehensive documentation",
          icon: <FileText className="w-5 h-5" />,
          gradient: "from-blue-600 via-cyan-600 to-teal-600",
          category: "generate",
          description: "Intelligent documentation",
        },
        {
          text: "DeepThink: Diagnose and fix current issues",
          icon: <Wrench className="w-5 h-5" />,
          gradient: "from-amber-600 via-orange-600 to-red-600",
          category: "fix",
          description: "Root cause analysis",
        },
        {
          text: "DeepThink: Suggest strategic improvements",
          icon: <Lightbulb className="w-5 h-5" />,
          gradient: "from-emerald-600 via-green-600 to-teal-600",
          category: "improve",
          description: "Innovation insights",
        },
      ];
    };

    setSuggestions(getContextualSuggestions());
  }, [pathname]);

  // Fetch history and tickets
  useEffect(() => {
    if (mode === "history" || mode === "tickets") {
      setIsHistoryLoading(true);
      const fetchData = async () => {
        try {
          if (mode === "history") {
            const data = await copilotHistoryService.getConversationHistory(tenantId, userId);
            setHistory(data);
          } else if (mode === "tickets") {
            const data = await copilotHistoryService.getActiveTickets(tenantId, userId);
            setTickets(data);
          }
        } catch (err) {
          console.error("Failed to fetch copilot data:", err);
          // Still set empty arrays on error to prevent infinite loading
          if (mode === "history") setHistory([]);
          if (mode === "tickets") setTickets([]);
        } finally {
          setIsHistoryLoading(false);
        }
      };
      fetchData();
    }
  }, [mode, tenantId, userId]);
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setWidgetState((prev) => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        let newX = prev.position.x;
        let newY = prev.position.y;

        // Keep widget on screen
        if (newX + prev.size.width > width) {
          newX = width - prev.size.width - 20;
        }
        if (newY + prev.size.height > height) {
          newY = height - prev.size.height - 20;
        }
        if (newX < 0) newX = 20;
        if (newY < 0) newY = 20;

        if (newX !== prev.position.x || newY !== prev.position.y) {
          return { ...prev, position: { x: newX, y: newY } };
        }
        return prev;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-scroll to bottom when new messages arrive - Fixed
  useEffect(() => {
    if (
      messagesEndRef.current &&
      !widgetState.isMinimized &&
      !widgetState.isCollapsed
    ) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 100);
    }
  }, [messages, widgetState.isMinimized, widgetState.isCollapsed, isLoading]);

  // Auto-focus input when widget opens (but not on initial mount to avoid stealing focus)
  useEffect(() => {
    if (
      !widgetState.isMinimized &&
      !widgetState.isCollapsed &&
      messages.length === 0
    ) {
      // Only auto-focus if user just opened the widget (not on initial render)
      const timer = setTimeout(() => {
        const inputEl = document.querySelector(
          ".copilot-input",
        ) as HTMLInputElement;
        if (inputEl && document.activeElement !== inputEl) {
          // Only focus if nothing else is focused
          const activeEl = document.activeElement;
          if (!activeEl || activeEl.tagName === "BODY") {
            inputEl.focus();
          }
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [widgetState.isMinimized, widgetState.isCollapsed]);

  // Save state to localStorage with widgetId-specific key
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storageKey = `copilot-widget-state-${widgetId}`;
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          position: widgetState.position,
          size: widgetState.size,
          isMinimized: widgetState.isMinimized,
          isCollapsed: widgetState.isCollapsed,
        }),
      );
    }
  }, [widgetState, widgetId]);

  // Listen for 'open-copilot' event from header actions
  useEffect(() => {
    const handleOpenCopilot = () => {
      setWidgetState((prev) => ({
        ...prev,
        isMinimized: false,
        isCollapsed: false,
        zIndex: MAX_Z_INDEX,
      }));
    };

    window.addEventListener("open-copilot", handleOpenCopilot);
    return () => window.removeEventListener("open-copilot", handleOpenCopilot);
  }, []);

  // Drag handlers - Improved to not interfere with buttons
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Don't drag if clicking on a button, input, link, or any interactive element
      if (e.target instanceof HTMLElement) {
        const target = e.target;
        const isButton =
          target.closest("button") !== null || target.tagName === "BUTTON";
        const isInput =
          target.closest("input") !== null || target.tagName === "INPUT";
        const isTextarea =
          target.closest("textarea") !== null || target.tagName === "TEXTAREA";
        const isLink = target.closest("a") !== null || target.tagName === "A";
        const isSelect =
          target.closest("select") !== null || target.tagName === "SELECT";
        const isInteractive =
          target.closest('[role="button"]') !== null ||
          target.closest("[onclick]") !== null ||
          target.closest(".no-drag") !== null;

        // If clicking on any interactive element, don't drag
        if (
          isButton ||
          isInput ||
          isTextarea ||
          isLink ||
          isSelect ||
          isInteractive
        ) {
          e.stopPropagation();
          return;
        }
      }

      // Handle resize
      if (
        e.target instanceof HTMLElement &&
        e.target.closest(".widget-resize-handle")
      ) {
        e.preventDefault();
        e.stopPropagation();
        isResizing.current = true;
        resizeStart.current = {
          x: e.clientX,
          y: e.clientY,
          width: widgetState.size.width,
          height: widgetState.size.height,
        };
        return;
      }

      // Handle drag - only on header area, not on buttons
      if (e.target instanceof HTMLElement) {
        const header = e.target.closest(".widget-header");
        if (header) {
          // Check if we're clicking directly on a button or its children
          const clickedButton = e.target.closest("button");
          if (clickedButton) {
            // Don't drag if clicking a button
            return;
          }

          // Only drag if clicking on the header background or grip icon
          const isGrip =
            e.target.closest(".grip-icon") !== null ||
            e.target.classList.contains("grip-icon") ||
            e.target.closest("[data-grip]") !== null;

          if (isGrip || e.target === header || header.contains(e.target)) {
            // Double check we're not on a button
            const buttons = header.querySelectorAll("button");
            let isOnButton = false;
            buttons.forEach((btn) => {
              if (btn.contains(e.target as Node)) {
                isOnButton = true;
              }
            });

            if (!isOnButton) {
              e.preventDefault();
              isDragging.current = true;
              dragStart.current = {
                x: e.clientX - widgetState.position.x,
                y: e.clientY - widgetState.position.y,
              };
              // Bring to front
              setWidgetState((prev) => ({ ...prev, zIndex: MAX_Z_INDEX }));
            }
          }
        }
      }
    },
    [widgetState.position, widgetState.size],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        e.preventDefault();
        const newX = e.clientX - dragStart.current.x;
        const newY = e.clientY - dragStart.current.y;
        setWidgetState((prev) => ({
          ...prev,
          position: { x: Math.max(0, newX), y: Math.max(0, newY) },
        }));
      } else if (isResizing.current) {
        e.preventDefault();
        const deltaX = e.clientX - resizeStart.current.x;
        const deltaY = e.clientY - resizeStart.current.y;
        const newWidth = Math.max(
          MIN_WIDTH,
          Math.min(MAX_WIDTH, resizeStart.current.width + deltaX),
        );
        const newHeight = Math.max(
          MIN_HEIGHT,
          Math.min(MAX_HEIGHT, resizeStart.current.height + deltaY),
        );
        setWidgetState((prev) => ({
          ...prev,
          size: { width: newWidth, height: newHeight },
        }));
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging.current || isResizing.current) {
        e.preventDefault();
        isDragging.current = false;
        isResizing.current = false;
        keepOnScreen();
        // Reset z-index after a delay
        setTimeout(() => {
          setWidgetState((prev) => ({ ...prev, zIndex: BASE_Z_INDEX }));
        }, 100);
      }
    };

    if (isDragging.current || isResizing.current) {
      document.addEventListener("mousemove", handleMouseMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleMouseUp, { passive: false });
      // Prevent text selection during drag
      document.body.style.userSelect = "none";
      document.body.style.cursor = isDragging.current
        ? "grabbing"
        : "nwse-resize";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging.current, isResizing.current, keepOnScreen]);

  // Quick actions
  const quickActions = [
    {
      icon: Zap,
      label: "Optimize",
      action: "Optimize current workflow for maximum efficiency",
    },
    {
      icon: Code,
      label: "Generate Code",
      action: "Generate code for the current feature",
    },
    {
      icon: FileText,
      label: "Create Docs",
      action: "Create documentation for this module",
    },
    {
      icon: Brain,
      label: "Analyze",
      action: "Analyze performance and suggest improvements",
    },
  ];

  // Execute actions from AI responses
  const executeAction = useCallback((response: string) => {
    // Parse action commands from AI response
    const actionPatterns = [
      {
        pattern: /\[ACTION:([^\]]+)\]/g,
        handler: (match: string) => {
          console.log("[Copilot] Action detected:", match);
          // Implement action execution here
        },
      },
      {
        pattern: /\[CLICK:"([^"]+)"\]/g,
        handler: (match: string, buttonText: string) => {
          const button = Array.from(
            document.querySelectorAll("button, a"),
          ).find((el) => el.textContent?.includes(buttonText)) as HTMLElement;
          if (button) button.click();
        },
      },
      {
        pattern: /\[NAVIGATE:"([^"]+)"\]/g,
        handler: (match: string, path: string) => {
          window.location.href = path;
        },
      },
    ];

    actionPatterns.forEach(({ pattern, handler }) => {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        handler(match[0], match[1]);
      }
    });
  }, []);

  // Send message with attachment support
  const handleSend = useCallback(
    async (messageText?: string) => {
      const textToSend = messageText || input.trim();
      // Allow sending even if no text if there's an attachment
      if ((!textToSend && !activeAttachment) || isLoading) return;

      // Create user message with attachment info
      const userMessage: CopilotMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: activeAttachment
          ? `${textToSend || "Analyze this file"}\n[Attachment: ${activeAttachment.name} (${(activeAttachment.size / 1024).toFixed(1)}KB)]`
          : textToSend,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      const attachmentToSend = activeAttachment;
      setInput("");
      setActiveAttachment(null); // Clear attachment after sending
      setIsLoading(true);
      setError(null);

      try {
        let response: Response;

        // If there's an attachment, use FormData
        if (attachmentToSend) {
          const formData = new FormData();
          formData.append("file", attachmentToSend);
          formData.append(
            "message",
            textToSend || "Please analyze this file and provide insights.",
          );
          formData.append("conversationId", conversationId || "");
          formData.append(
            "context",
            JSON.stringify({
              moduleId: pathname?.split("/")[1],
              mode: mode,
            }),
          );
          formData.append(
            "options",
            JSON.stringify({
              useRAG: true,
              useMemory: true,
              useTools: true,
            }),
          );

          response = await fetch("/api/copilot/chat/with-attachment", {
            method: "POST",
            body: formData,
          });
        } else {
          // Use streaming if enabled, otherwise use regular endpoint
          let streamingSucceeded = false;

          if (useStreaming) {
            try {
              // Streaming request
              response = await fetch("/api/copilot/chat/stream", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  conversationId,
                  message: textToSend,
                  context: {
                    moduleId: pathname?.split("/")[1],
                    mode: mode,
                  },
                  options: {
                    useRAG: true,
                    useMemory: true,
                    useTools: true,
                  },
                } as CopilotRequest),
              });

              if (!response.ok) {
                throw new Error(
                  `HTTP ${response.status}: ${response.statusText}`,
                );
              }

              // Handle streaming response
              const reader = response.body?.getReader();
              const decoder = new TextDecoder();
              let fullContent = "";
              let metadata: any = null;

              if (reader) {
                // Create assistant message placeholder
                const assistantMessageId = `msg-${Date.now()}`;
                const assistantMessage: CopilotMessage = {
                  id: assistantMessageId,
                  role: "assistant",
                  content: "",
                  timestamp: new Date(),
                };
                setMessages((prev) => [...prev, assistantMessage]);
                setStreamingContent("");

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  const chunk = decoder.decode(value, { stream: true });
                  const lines = chunk.split("\n").filter(Boolean);

                  for (const line of lines) {
                    try {
                      const data = JSON.parse(line);

                      if (data.type === "chunk" && data.content) {
                        fullContent += data.content;
                        setStreamingContent(fullContent);

                        // Update message in real-time
                        setMessages((prev) =>
                          prev.map((msg) =>
                            msg.id === assistantMessageId
                              ? { ...msg, content: fullContent }
                              : msg,
                          ),
                        );
                      } else if (data.type === "metadata") {
                        metadata = data.metadata;
                        // FIXED: Extract conversationId from streaming metadata for memory continuity
                        if (data.conversationId) {
                          console.log(
                            "[Copilot] 📝 Setting conversationId from stream:",
                            data.conversationId,
                          );
                          setConversationId(data.conversationId);
                        }
                      } else if (data.type === "error") {
                        throw new Error(data.error || "Streaming error");
                      }
                    } catch (e) {
                      // Skip invalid JSON
                    }
                  }
                }

                // Finalize message
                setStreamingContent("");
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content: fullContent,
                          metadata: metadata
                            ? {
                                confidence: metadata.confidence,
                                tokensUsed: metadata.tokensUsed,
                                processingTime: metadata.processingTime,
                              }
                            : undefined,
                        }
                      : msg,
                  ),
                );

                setIsLoading(false);
                setError(null);
                streamingSucceeded = true;
              }
            } catch (streamError) {
              console.warn(
                "[Copilot] Streaming failed, falling back to non-streaming:",
                streamError,
              );
              // Fall through to non-streaming
            }
          }

          // Non-streaming fallback (only if streaming not used or failed)
          if (!streamingSucceeded) {
            response = await fetch("/api/copilot/chat", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                conversationId,
                message: textToSend,
                context: {
                  moduleId: pathname?.split("/")[1],
                  mode: mode,
                },
                options: {
                  useRAG: true,
                  useMemory: true,
                  useTools: true,
                },
              } as CopilotRequest),
            });
          }
        }

        if (!response.ok) {
          let errorData: any = {};
          try {
            errorData = await response.json();
          } catch (e) {
            // If JSON parsing fails, try to get text
            const text = await response.text().catch(() => "");
            errorData = {
              error: text || `HTTP ${response.status}: ${response.statusText}`,
            };
          }

          const errorMessage =
            errorData.error ||
            errorData.details ||
            errorData.message ||
            `Failed to get response (${response.status})`;
          console.error("[Copilot] API error:", {
            status: response.status,
            statusText: response.statusText,
            error: errorMessage,
            details: errorData,
            fullResponse: errorData,
          });

          // Create an error message that includes the actual error details
          const detailedError = new Error(errorMessage);
          (detailedError as any).response = response;
          (detailedError as any).errorData = errorData;
          throw detailedError;
        }

        let data: CopilotResponse;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error("[Copilot] Failed to parse JSON response:", jsonError);
          const text = await response.text().catch(() => "");
          throw new Error(
            `Invalid response from server: ${text.substring(0, 200)}`,
          );
        }

        // Validate response structure
        if (!data || !data.message) {
          console.error("[Copilot] Invalid response structure:", data);
          throw new Error("Invalid response from server: missing message");
        }

        // Add attachment analysis info if present
        if (data.message.metadata?.attachmentAnalysis) {
          const analysis = data.message.metadata.attachmentAnalysis;
          data.message.content = `📎 **File Analysis: ${analysis.filename}**\n\n${data.message.content}\n\n---\n**Analysis Summary:**\n- Type: ${analysis.type}\n- Size: ${(analysis.size / 1024).toFixed(1)}KB\n- Confidence: ${Math.round(analysis.confidence * 100)}%\n${analysis.extractedText ? `- Extracted ${analysis.extractedText.length} characters` : ""}`;
        }

        // Store enhanced response data in message metadata for rendering
        try {
          if (
            "proactiveInsights" in data &&
            data.proactiveInsights &&
            Array.isArray(data.proactiveInsights)
          ) {
            (data.message.metadata as any).proactiveInsights =
              data.proactiveInsights;
          }
          if (
            "suggestedOptimizations" in data &&
            data.suggestedOptimizations &&
            Array.isArray(data.suggestedOptimizations)
          ) {
            (data.message.metadata as any).suggestedOptimizations =
              data.suggestedOptimizations;
          }
          if ("reasoning" in data && data.reasoning) {
            // Safely access reasoning - handle different structures
            if (typeof data.reasoning === "object" && data.reasoning !== null) {
              if (
                "steps" in data.reasoning &&
                Array.isArray(data.reasoning.steps)
              ) {
                (data.message.metadata as any).reasoning = data.reasoning.steps;
              } else if (Array.isArray(data.reasoning)) {
                // If reasoning itself is an array, use it directly
                (data.message.metadata as any).reasoning = data.reasoning;
              }
              if (
                "confidenceBreakdown" in data.reasoning &&
                data.reasoning.confidenceBreakdown
              ) {
                (data.message.metadata as any).confidenceBreakdown =
                  data.reasoning.confidenceBreakdown;
              }
            }
          }
        } catch (metadataError) {
          console.warn(
            "[Copilot] Failed to store enhanced metadata:",
            metadataError,
          );
          // Continue without enhanced features - don't break the flow
        }

        setMessages((prev) => [...prev, data.message]);

        // Handle navigation and UI actions from tool outputs - ENHANCED
        if (data.message.metadata?.toolResults) {
          console.log("[Copilot] 🔧 Processing tool results:", {
            count: data.message.metadata.toolResults.length,
            results: data.message.metadata.toolResults.map((r) => ({
              success: r.success,
              toolId: r.toolCallId,
              hasOutput: !!r.output,
              outputKeys: r.output ? Object.keys(r.output) : [],
            })),
          });

          for (const toolResult of data.message.metadata.toolResults) {
            if (toolResult.success && toolResult.output) {
              const output = toolResult.output as any;

              // Handle navigation actions - ENHANCED WITH ERROR HANDLING
              if (output.action === "navigate" && output.path) {
                console.log("[Copilot] ✅ Navigation requested:", {
                  path: output.path,
                  entityType: output.entityType,
                  entityId: output.entityId,
                });

                // Use router.push with error handling
                try {
                  setTimeout(() => {
                    router.push(output.path);
                    console.log(
                      "[Copilot] ✅ Successfully navigated to:",
                      output.path,
                    );

                    // Show success message in chat
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: `nav-${Date.now()}`,
                        role: "assistant",
                        content: `✅ Navigated to ${output.path}`,
                        timestamp: new Date(),
                      },
                    ]);
                  }, 500); // Small delay for better UX
                } catch (navError: any) {
                  console.error("[Copilot] ❌ Navigation error:", navError);
                  // Fallback to window.location
                  try {
                    window.location.href = output.path;
                  } catch (fallbackError) {
                    console.error(
                      "[Copilot] ❌ Fallback navigation also failed:",
                      fallbackError,
                    );
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: `nav-error-${Date.now()}`,
                        role: "assistant",
                        content: `⚠️ Could not navigate to ${output.path}. Please navigate manually.`,
                        timestamp: new Date(),
                      },
                    ]);
                  }
                }
              }

              // Handle created items - auto-navigate if entityType and entityId are present
              if (output.entityType && output.entityId && !output.action) {
                console.log("[Copilot] 📦 Created entity detected:", {
                  entityType: output.entityType,
                  entityId: output.entityId,
                  id: output.id,
                });

                // Determine navigation path based on entity type
                let viewPath: string | null = null;
                if (output.entityType === "ASN") {
                  viewPath = `/warehouse/inbound?asnId=${output.entityId}`;
                } else if (output.entityType === "CAPA") {
                  viewPath = `/iso-ims/capa/${output.entityId}`;
                } else if (output.entityType === "Proposal") {
                  viewPath = `/proposals/rfq/${output.entityId}`;
                }

                if (viewPath) {
                  console.log(
                    "[Copilot] 🚀 Auto-navigating to created entity:",
                    viewPath,
                  );
                  setTimeout(() => {
                    try {
                      router.push(viewPath!);
                      setMessages((prev) => [
                        ...prev,
                        {
                          id: `auto-nav-${Date.now()}`,
                          role: "assistant",
                          content: `✅ Opening ${output.entityType} ${output.id || output.entityId}`,
                          timestamp: new Date(),
                        },
                      ]);
                    } catch (error) {
                      console.error("[Copilot] Auto-navigation error:", error);
                    }
                  }, 1000); // Slightly longer delay for created items
                }
              }

              // Handle click actions
              if (output.action === "click" && output.selector) {
                console.log(
                  "[Copilot] 🖱️ Click action requested:",
                  output.selector,
                );
                setTimeout(() => {
                  // Try to find and click the element
                  const element = document.querySelector(
                    output.selector,
                  ) as HTMLElement;
                  if (element) {
                    element.click();
                    console.log(
                      "[Copilot] ✅ Successfully clicked element:",
                      output.selector,
                    );
                  } else {
                    // Fallback: try to find by text content
                    const buttons = Array.from(
                      document.querySelectorAll('button, a, [role="button"]'),
                    );
                    const match = buttons.find(
                      (el) =>
                        el.textContent
                          ?.toLowerCase()
                          .includes(output.selector.toLowerCase()) ||
                        el
                          .getAttribute("aria-label")
                          ?.toLowerCase()
                          .includes(output.selector.toLowerCase()),
                    ) as HTMLElement;
                    if (match) {
                      match.click();
                      console.log(
                        "[Copilot] ✅ Successfully clicked element by text:",
                        output.selector,
                      );
                    } else {
                      console.warn(
                        "[Copilot] ⚠️ Could not find element to click:",
                        output.selector,
                      );
                    }
                  }
                }, 500);
              }
            } else if (!toolResult.success) {
              console.error("[Copilot] ❌ Tool execution failed:", {
                toolId: toolResult.toolCallId,
                error: toolResult.error,
              });
            }
          }
        }

        // Execute actions if present in content (legacy format)
        if (
          data.message.content.includes("[ACTION]") ||
          data.message.content.includes("[CLICK") ||
          data.message.content.includes("[NAVIGATE")
        ) {
          executeAction(data.message.content);
        }

        if (data.message.metadata?.knowledgeUsed) {
          console.log(
            "[Copilot] Used knowledge:",
            data.message.metadata.knowledgeUsed.length,
            "entries",
          );
        }

        // FIXED: Properly extract conversationId from API response
        // The API now returns conversationId directly in the response
        if (data.conversationId) {
          console.log(
            "[Copilot] 📝 Setting conversationId for memory continuity:",
            data.conversationId,
          );
          setConversationId(data.conversationId);
        } else if (!conversationId && data.message.id) {
          // Fallback: Try to extract from message ID if conversationId not in response
          // This is a legacy fallback - the API should now always return conversationId
          console.warn(
            "[Copilot] ⚠️ No conversationId in response, using fallback extraction",
          );
          const fallbackId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          setConversationId(fallbackId);
        }
      } catch (err: any) {
        console.error("[Copilot] Error:", err);
        console.error("[Copilot] Error type:", err?.constructor?.name);
        console.error("[Copilot] Error stack:", err?.stack);
        console.error(
          "[Copilot] Full error object:",
          JSON.stringify(err, Object.getOwnPropertyNames(err)),
        );

        // Extract error message from response if available
        let errorMsg = "An error occurred";
        if (err?.response) {
          try {
            const errorData = await err.response.json().catch(() => ({}));
            errorMsg =
              errorData.details ||
              errorData.message ||
              errorData.error ||
              errorMsg;
          } catch {
            // If JSON parsing fails, use the error message
          }
        }

        if (err instanceof Error) {
          errorMsg = err.message;
        } else if (err?.error) {
          errorMsg = err.error;
        } else if (err?.details) {
          errorMsg = err.details;
        } else if (err?.message) {
          errorMsg = err.message;
        }

        // Check if it's a transient error that we should retry
        const isTransientError =
          errorMsg.includes("network") ||
          errorMsg.includes("fetch") ||
          errorMsg.includes("ECONNREFUSED") ||
          errorMsg.includes("timeout") ||
          errorMsg.includes("429");

        // Auto-retry transient errors (max 2 retries)
        if (isTransientError && retryCount < 2) {
          const newRetryCount = retryCount + 1;
          setRetryCount(newRetryCount);
          setConnectionStatus("checking");
          setError(null); // Clear error during retry

          // Wait before retry (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, retryCount) * 1000),
          );

          // Retry the request with the original message
          const retryMessage = messageText || textToSend;
          if (retryMessage) {
            return handleSend(retryMessage);
          }
        }

        // Reset retry count on new message
        setRetryCount(0);
        setError(errorMsg);
        setConnectionStatus("offline");

        // Provide more helpful error messages based on error type
        let userFriendlyMessage =
          "I'm having trouble connecting right now. Please check your connection and try again in a moment.";
        let showRetryButton = true;

        if (
          errorMsg.includes("verification failed") ||
          errorMsg.includes("Request verification failed")
        ) {
          userFriendlyMessage =
            "Security verification failed. Please refresh the page and try again. If the issue persists, contact your administrator.";
          showRetryButton = false;
        } else if (
          errorMsg.includes("API key") ||
          errorMsg.includes("Missing") ||
          errorMsg.includes("invalid") ||
          errorMsg.includes("No valid")
        ) {
          userFriendlyMessage =
            "I need an API key to work properly. Please check your .env.local file has OPENAI_API_KEY or ANTHROPIC_API_KEY set with a valid key (not a placeholder).";
          showRetryButton = false;
        } else if (
          errorMsg.includes("Rate limit") ||
          errorMsg.includes("429") ||
          errorMsg.includes("Rate limit exceeded")
        ) {
          userFriendlyMessage =
            "I'm receiving too many requests right now. Please wait a moment and try again.";
          showRetryButton = true;
        } else if (
          errorMsg.includes("network") ||
          errorMsg.includes("fetch") ||
          errorMsg.includes("ECONNREFUSED") ||
          errorMsg.includes("Failed to fetch")
        ) {
          userFriendlyMessage =
            "I'm having trouble connecting to the AI service. Please check your internet connection and try again.";
          showRetryButton = true;
        } else if (
          errorMsg.includes("401") ||
          errorMsg.includes("Unauthorized") ||
          errorMsg.includes("authentication")
        ) {
          userFriendlyMessage =
            "Authentication failed. Please refresh the page and try again.";
          showRetryButton = false;
        } else if (errorMsg.includes("403") || errorMsg.includes("Forbidden")) {
          userFriendlyMessage =
            "You don't have permission to perform this action. Please contact your administrator.";
          showRetryButton = false;
        } else if (
          errorMsg.includes("500") ||
          errorMsg.includes("Internal Server Error")
        ) {
          userFriendlyMessage =
            "The server encountered an error. Please try again in a moment.";
          showRetryButton = true;
        }

        // Don't add duplicate error messages (check last 2 messages to avoid duplicates)
        const recentMessages = messages.slice(-2);
        const isDuplicate = recentMessages.some(
          (msg) =>
            msg.role === "assistant" &&
            msg.content.includes(userFriendlyMessage.substring(0, 50)),
        );

        if (isDuplicate) {
          // Already showing this error, just update the error state
          console.log("[Copilot] Skipping duplicate error message");
          return;
        }

        const errorMessage: CopilotMessage = {
          id: `msg-error-${Date.now()}`,
          role: "assistant",
          content:
            userFriendlyMessage +
            (showRetryButton ? ' Click "Retry" below to try again.' : ""),
          timestamp: new Date(),
          metadata: {
            confidence: 0.5,
            canRetry: showRetryButton,
          },
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        setConnectionStatus("online");
      }
    },
    [
      input,
      isLoading,
      conversationId,
      tenantId,
      userId,
      mode,
      pathname,
      executeAction,
      activeAttachment,
      retryCount,
    ],
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts if copilot is visible and not minimized
      if (widgetState.isMinimized || widgetState.isCollapsed) {
        // If minimized, Ctrl/Cmd + K should open it
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
          e.preventDefault();
          setWidgetState((prev) => ({
            ...prev,
            isMinimized: false,
            isCollapsed: false,
          }));
          // Focus input after opening
          setTimeout(() => {
            const inputEl = document.querySelector(
              ".copilot-input",
            ) as HTMLInputElement;
            if (inputEl) {
              inputEl.focus();
            }
          }, 100);
        }
        return;
      }

      // Ctrl/Cmd + K to focus input (only when widget is open)
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const inputEl = document.querySelector(
          ".copilot-input",
        ) as HTMLInputElement;
        if (inputEl) {
          inputEl.focus();
          inputEl.select();
        }
      }
      // Escape to minimize (only if input is not focused)
      if (e.key === "Escape") {
        const activeElement = document.activeElement;
        const inputEl = document.querySelector(
          ".copilot-input",
        ) as HTMLInputElement;
        if (activeElement === inputEl) {
          // If input is focused, just blur it
          inputEl.blur();
        } else {
          // Otherwise minimize
          setWidgetState((prev) => ({ ...prev, isMinimized: true }));
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [widgetState.isMinimized, widgetState.isCollapsed]);

  // Use state position - dragging will update it
  // Don't force positions, let user drag them

  // Calculate if widget is open (before early returns)
  const isOpen = !widgetState.isMinimized && !widgetState.isCollapsed;

  // Render minimized state - Beautiful floating button with perfect alignment
  if (widgetState.isMinimized) {
    return (
      <div
        className="fixed bottom-6 right-6 z-[9999] cursor-pointer group animate-in fade-in slide-in-from-bottom-4"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setWidgetState((prev) => ({ ...prev, isMinimized: false }));
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        style={{ display: "block" }}
        role="button"
        aria-label="Open HazalyzeCopilot"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setWidgetState((prev) => ({ ...prev, isMinimized: false }));
          }
        }}
      >
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-600 rounded-full p-4 shadow-2xl hover:scale-110 hover:shadow-blue-500/50 transition-all duration-300 relative flex items-center justify-center group-hover:ring-4 ring-blue-400/30">
          <MessageSquare className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse shadow-lg"></div>
          {/* Pulse animation ring */}
          <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping opacity-75"></div>
        </div>
      </div>
    );
  }

  // Render collapsed state - Perfectly aligned
  if (widgetState.isCollapsed) {
    return (
      <div
        ref={widgetRef}
        data-copilot-widget={widgetId}
        className="fixed bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
        style={{
          left: `${widgetState.position.x}px`,
          top: `${widgetState.position.y}px`,
          width: `${widgetState.size.width}px`,
          height: `${COLLAPSED_HEIGHT}px`,
          zIndex: widgetState.zIndex,
        }}
      >
        <div
          className="widget-header h-full flex items-center justify-between px-4 cursor-move bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <GripVertical className="w-4 h-4 text-white/70 shrink-0" />
            <MessageSquare className="w-5 h-5 text-white shrink-0" />
            <span className="font-semibold text-sm text-white truncate">
              {title}
            </span>
          </div>
          <div
            className="flex items-center gap-1 shrink-0 no-drag"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setWidgetState((prev) => ({ ...prev, isCollapsed: false }));
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              type="button"
              className="p-1.5 hover:bg-white/20 rounded-md transition-all duration-200 text-white/80 hover:text-white active:scale-95 no-drag"
              title="Expand"
              aria-label="Expand"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setWidgetState((prev) => ({ ...prev, isMinimized: true }));
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              type="button"
              className="p-1.5 hover:bg-white/20 rounded-md transition-all duration-200 text-white/80 hover:text-white active:scale-95 no-drag"
              title="Minimize"
              aria-label="Minimize"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                type="button"
                className="p-1.5 hover:bg-red-500/30 rounded-md transition-all duration-200 text-white/80 hover:text-white active:scale-95 no-drag"
                title="Close"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render full widget - ALWAYS VISIBLE and DRAGGABLE
  return (
    <>
      {/* Sexy Modern Backdrop Blur - Only when widget is open */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[9989] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-500 ease-out"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.55)",
              animation: "backdropFadeIn 0.5s ease-out",
            }}
            onClick={(e) => {
              // Optional: Close on backdrop click
              // setWidgetState(prev => ({ ...prev, isMinimized: true }))
            }}
          >
            {/* Animated gradient overlay - sexy modern effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/15 via-purple-500/12 to-pink-500/10 animate-pulse" />

            {/* Radial gradient from copilot position - follows widget */}
            <div
              className="absolute transition-all duration-700 ease-out"
              style={{
                left: `${widgetState.position.x + widgetState.size.width / 2}px`,
                top: `${widgetState.position.y + widgetState.size.height / 2}px`,
                width: "900px",
                height: "900px",
                transform: "translate(-50%, -50%)",
                background:
                  "radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 25%, rgba(236, 72, 153, 0.08) 50%, transparent 75%)",
                borderRadius: "50%",
                filter: "blur(50px)",
                animation: "backdropPulse 4s ease-in-out infinite",
              }}
            />

            {/* Additional animated rings for depth */}
            <div
              className="absolute transition-all duration-1000 ease-out"
              style={{
                left: `${widgetState.position.x + widgetState.size.width / 2}px`,
                top: `${widgetState.position.y + widgetState.size.height / 2}px`,
                width: "700px",
                height: "700px",
                transform: "translate(-50%, -50%)",
                background:
                  "radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(236, 72, 153, 0.06) 40%, transparent 70%)",
                borderRadius: "50%",
                filter: "blur(35px)",
                animation: "backdropPulse 5s ease-in-out infinite",
                animationDelay: "1.5s",
              }}
            />

            {/* Third ring for extra depth */}
            <div
              className="absolute transition-all duration-1200 ease-out"
              style={{
                left: `${widgetState.position.x + widgetState.size.width / 2}px`,
                top: `${widgetState.position.y + widgetState.size.height / 2}px`,
                width: "500px",
                height: "500px",
                transform: "translate(-50%, -50%)",
                background:
                  "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 60%)",
                borderRadius: "50%",
                filter: "blur(25px)",
                animation: "backdropPulse 3.5s ease-in-out infinite",
                animationDelay: "0.5s",
              }}
            />

            {/* Subtle vignette effect - darker at edges */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0, 0, 0, 0.3) 100%)",
              }}
            />

            {/* Animated shimmer effect */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  "linear-gradient(135deg, transparent 0%, rgba(99, 102, 241, 0.1) 25%, transparent 50%, rgba(236, 72, 153, 0.1) 75%, transparent 100%)",
                backgroundSize: "200% 200%",
                animation: "shimmer 8s ease-in-out infinite",
              }}
            />
          </div>
        </>
      )}

      <div
        ref={widgetRef}
        data-copilot-widget={widgetId}
        className={`fixed bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 ${
          isOpen
            ? "border-indigo-500/40 dark:border-purple-500/40 shadow-[0_0_40px_rgba(99,102,241,0.3),0_0_80px_rgba(139,92,246,0.2)] dark:shadow-[0_0_40px_rgba(139,92,246,0.4),0_0_80px_rgba(236,72,153,0.2)]"
            : "border-gray-200/50 dark:border-gray-700/50"
        }`}
        style={{
          left: `${widgetState.position.x}px`,
          top: `${widgetState.position.y}px`,
          width: `${widgetState.size.width}px`,
          height: `${widgetState.size.height}px`,
          zIndex: widgetState.zIndex,
          display: "flex",
          visibility: "visible",
          cursor: "default",
          flexDirection: "column",
          maxHeight: `${widgetState.size.height}px`,
          transition:
            isDragging.current || isResizing.current
              ? "none"
              : "box-shadow 0.3s ease, transform 0.2s ease, border-color 0.3s ease",
        }}
        onMouseEnter={() => {
          if (!isDragging.current && !isResizing.current) {
            widgetRef.current?.style.setProperty(
              "box-shadow",
              "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.1)",
            );
          }
        }}
        onMouseLeave={() => {
          if (!isDragging.current && !isResizing.current) {
            widgetRef.current?.style.setProperty("box-shadow", "");
          }
        }}
      >
        {/* Header - Beautiful gradient with perfect alignment */}
        <div className="widget-header flex flex-col border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 shrink-0 relative overflow-hidden">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 animate-pulse opacity-50"></div>
          <div
            className="flex items-center justify-between px-4 py-3 gap-3 cursor-move relative z-10"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <GripVertical
                className="w-4 h-4 text-white/70 shrink-0 grip-icon cursor-move hover:text-white transition-colors"
                data-grip="true"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  isDragging.current = true;
                  dragStart.current = {
                    x: e.clientX - widgetState.position.x,
                    y: e.clientY - widgetState.position.y,
                  };
                  setWidgetState((prev) => ({ ...prev, zIndex: MAX_Z_INDEX }));
                }}
                title="Drag to move"
              />
              <MessageSquare className="w-5 h-5 text-white shrink-0" />
              <span className="font-semibold text-white truncate">{title}</span>
              {/* Connection Status Indicator */}
              <div className="flex items-center gap-1.5 ml-2">
                {connectionStatus === "online" && (
                  <div
                    className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
                    title="Connected"
                  />
                )}
                {connectionStatus === "offline" && (
                  <div
                    className="w-2 h-2 bg-red-400 rounded-full"
                    title="Connection issue"
                  />
                )}
                {connectionStatus === "checking" && (
                  <div
                    className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
                    title="Checking connection..."
                  />
                )}
              </div>
            </div>
            <div
              className="flex items-center gap-1 shrink-0 no-drag"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setWidgetState((prev) => ({ ...prev, isCollapsed: true }));
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="p-1.5 hover:bg-white/20 rounded-md transition-all duration-200 text-white/80 hover:text-white active:scale-95 no-drag"
                title="Collapse"
                aria-label="Collapse"
                type="button"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setWidgetState((prev) => ({ ...prev, isMinimized: true }));
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="p-1.5 hover:bg-white/20 rounded-md transition-all duration-200 text-white/80 hover:text-white active:scale-95 no-drag"
                title="Minimize"
                aria-label="Minimize"
                type="button"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              {onClose && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="p-1.5 hover:bg-red-500/30 rounded-md transition-all duration-200 text-white/80 hover:text-white active:scale-95 no-drag"
                  title="Close"
                  aria-label="Close"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Mode Selector - McKinsey Style Tab System */}
          <div
            className="flex px-4 pb-3 no-drag gap-1 overflow-x-auto no-scrollbar relative z-10"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {[
              { id: "chat", icon: MessageSquare, label: "Chat" },
              { id: "autopilot", icon: Rocket, label: "Autopilot" },
              { id: "history", icon: History, label: "History" },
              { id: "tickets", icon: Ticket, label: "Tickets" },
              { id: "command", icon: Zap, label: "Tools" },
              { id: "create", icon: Code, label: "Create" },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMode(tab.id as any);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  type="button"
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-300 no-drag whitespace-nowrap ${
                    isActive
                      ? "bg-white text-blue-700 shadow-[0_4px_12px_rgba(255,255,255,0.3)] scale-105"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${isActive ? "animate-pulse" : ""}`}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Actions - Command Mode - Perfectly aligned */}
        {mode === "command" && messages.length === 0 && (
          <div className="p-3 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-b from-gray-50/80 to-transparent dark:from-gray-800/50 shrink-0 no-drag">
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSend(action.action);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onMouseUp={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    type="button"
                    className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:shadow-md active:scale-95 hover:border-blue-300 dark:hover:border-blue-600 no-drag"
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Context-aware Suggestions - Chat Mode - DeepThink Mind-Blowing Design */}
        {mode === "chat" && suggestions.length > 0 && messages.length === 0 && (
          <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-gray-50/90 via-blue-50/30 to-purple-50/30 dark:from-gray-900/95 dark:via-blue-950/20 dark:to-purple-950/20 shrink-0 no-drag relative overflow-hidden">
            {/* Animated background effect */}
            <div className="absolute inset-0 opacity-30 dark:opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
              <div
                className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"
                style={{ animationDelay: "1s" }}
              />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="relative">
                  <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
                  <Sparkles className="w-3 h-3 text-blue-500 absolute -top-1 -right-1 animate-ping" />
                </div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  DeepThink Suggestions
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSend(suggestion.text);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onMouseUp={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    type="button"
                    className="group relative w-full text-left overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] no-drag"
                    style={{
                      animationDelay: `${idx * 100}ms`,
                    }}
                  >
                    {/* Gradient background */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${suggestion.gradient} opacity-90 group-hover:opacity-100 transition-opacity duration-300`}
                    />

                    {/* Shimmer effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                    {/* Content */}
                    <div className="relative p-3.5 flex items-center gap-3">
                      {/* Icon container with glow */}
                      <div
                        className={`relative flex-shrink-0 w-10 h-10 rounded-lg bg-white/20 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                      >
                        <div className="text-white">{suggestion.icon}</div>
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${suggestion.gradient} opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300`}
                        />
                      </div>

                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-bold text-white group-hover:text-white/90 transition-colors">
                            {suggestion.text}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                        </div>
                        {suggestion.description && (
                          <p className="text-xs text-white/80 group-hover:text-white/90 transition-colors line-clamp-1">
                            {suggestion.description}
                          </p>
                        )}
                      </div>

                      {/* Category badge */}
                      <div className="flex-shrink-0">
                        <div className="px-2 py-1 rounded-md bg-white/20 dark:bg-black/20 backdrop-blur-sm border border-white/30">
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                            {suggestion.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Border glow effect */}
                    <div
                      className={`absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-white/30 transition-all duration-300`}
                    />
                  </button>
                ))}
              </div>

              {/* Footer hint */}
              <div className="mt-3 pt-2 border-t border-gray-200/50 dark:border-gray-700/30">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center italic">
                  Powered by AI • Click any suggestion to start
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Create Mode - Content creation options */}
        {mode === "create" && messages.length === 0 && (
          <div className="p-3 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-b from-gray-50/80 to-transparent dark:from-gray-800/50 shrink-0 no-drag">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 px-1">
              Create:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSend("Create a new shipment document");
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                type="button"
                className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:shadow-md active:scale-95 hover:border-purple-300 dark:hover:border-purple-600 no-drag"
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="truncate">Document</span>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSend("Create a new report");
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                type="button"
                className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:shadow-md active:scale-95 hover:border-purple-300 dark:hover:border-purple-600 no-drag"
              >
                <Code className="w-4 h-4 shrink-0" />
                <span className="truncate">Report</span>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSend("Create a workflow automation");
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                type="button"
                className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:shadow-md active:scale-95 hover:border-purple-300 dark:hover:border-purple-600 no-drag"
              >
                <Zap className="w-4 h-4 shrink-0" />
                <span className="truncate">Workflow</span>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSend("Create a custom dashboard");
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                type="button"
                className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:shadow-md active:scale-95 hover:border-purple-300 dark:hover:border-purple-600 no-drag"
              >
                <Brain className="w-4 h-4 shrink-0" />
                <span className="truncate">Dashboard</span>
              </button>
            </div>
          </div>
        )}

        {/* Autopilot Mode UI */}
        {mode === "autopilot" && (
          <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-purple-50/50 to-transparent dark:from-purple-900/10 dark:to-transparent">
            {/* Autopilot Header */}
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Rocket className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Autopilot Mode</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">AI-powered autonomous workflows</p>
                  </div>
                </div>
                {/* Mode Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setAutopilotMode("supervised")}
                    className={`px-2 py-1 text-xs rounded-md transition-all ${
                      autopilotMode === "supervised"
                        ? "bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400 font-medium"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    Supervised
                  </button>
                  <button
                    onClick={() => setAutopilotMode("autonomous")}
                    className={`px-2 py-1 text-xs rounded-md transition-all ${
                      autopilotMode === "autonomous"
                        ? "bg-white dark:bg-gray-700 shadow text-pink-600 dark:text-pink-400 font-medium"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    Autonomous
                  </button>
                </div>
              </div>
              
              {/* Mode Description */}
              <div className={`text-xs p-2 rounded-lg ${
                autopilotMode === "supervised"
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                  : "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300"
              }`}>
                {autopilotMode === "supervised" 
                  ? "🛡️ AI will ask for your approval at key decision points"
                  : "🚀 AI will execute autonomously and report results when done"
                }
              </div>
            </div>

            {/* Active Workflow Status */}
            {activeWorkflow && (
              <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-blue-50/50 dark:bg-blue-900/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    Active Workflow
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        await fetch(`/api/copilot/agent/execute?workflowId=${activeWorkflow.id}`, { method: "DELETE" });
                        setActiveWorkflow(null);
                      } catch (e) { console.error(e); }
                    }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{activeWorkflow.goal}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full ${
                    activeWorkflow.status === "executing" ? "bg-blue-100 text-blue-700" :
                    activeWorkflow.status === "awaiting_approval" ? "bg-yellow-100 text-yellow-700" :
                    activeWorkflow.status === "completed" ? "bg-green-100 text-green-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {activeWorkflow.status}
                  </span>
                  <span className="text-gray-500">
                    Step {activeWorkflow.currentStepIndex + 1} of {activeWorkflow.steps?.length || 0}
                  </span>
                </div>
                {activeWorkflow.status === "awaiting_approval" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={async () => {
                        const currentStep = activeWorkflow.steps?.[activeWorkflow.currentStepIndex];
                        if (currentStep) {
                          await fetch("/api/copilot/agent/execute", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              workflowId: activeWorkflow.id,
                              stepId: currentStep.id,
                              approved: true,
                            }),
                          });
                          // Refresh workflow status
                          const res = await fetch(`/api/copilot/agent?workflowId=${activeWorkflow.id}`);
                          const data = await res.json();
                          if (data.workflow) setActiveWorkflow(data.workflow);
                        }
                      }}
                      className="flex-1 py-2 px-3 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      ✓ Approve & Continue
                    </button>
                    <button
                      onClick={async () => {
                        const currentStep = activeWorkflow.steps?.[activeWorkflow.currentStepIndex];
                        if (currentStep) {
                          await fetch("/api/copilot/agent/execute", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              workflowId: activeWorkflow.id,
                              stepId: currentStep.id,
                              approved: false,
                            }),
                          });
                          setActiveWorkflow(null);
                        }
                      }}
                      className="py-2 px-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors"
                    >
                      Skip
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick Workflows */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Quick Workflows</p>
              
              {/* WMS Workflows */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                  <i className="ri-store-3-line" /> Warehouse (WMS)
                </p>
                {[
                  { goal: "Create an ASN for incoming shipment", icon: "📦", color: "blue" },
                  { goal: "Generate inventory report with ABC analysis", icon: "📊", color: "green" },
                  { goal: "Optimize picking routes for today's orders", icon: "🚚", color: "purple" },
                ].map((wf, idx) => (
                  <button
                    key={idx}
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/copilot/agent", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            goal: wf.goal,
                            mode: autopilotMode,
                            autoStart: true,
                          }),
                        });
                        const data = await res.json();
                        if (data.workflow) {
                          setActiveWorkflow(data.workflow);
                        }
                      } catch (e) { console.error(e); }
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${
                      wf.color === "blue" ? "border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 bg-blue-50/50 dark:bg-blue-900/10" :
                      wf.color === "green" ? "border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 bg-green-50/50 dark:bg-green-900/10" :
                      "border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 bg-purple-50/50 dark:bg-purple-900/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{wf.icon}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{wf.goal}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* ISO-IMS Workflows */}
              <div className="space-y-2 mt-4">
                <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                  <i className="ri-shield-check-line" /> Quality (ISO-IMS)
                </p>
                {[
                  { goal: "Create a CAPA for quality issue", icon: "⚠️", color: "yellow" },
                  { goal: "Schedule internal audit for ISO 9001", icon: "📋", color: "blue" },
                  { goal: "Log non-conformance and determine disposition", icon: "❌", color: "red" },
                  { goal: "Prepare management review package", icon: "📑", color: "purple" },
                ].map((wf, idx) => (
                  <button
                    key={idx}
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/copilot/agent", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            goal: wf.goal,
                            mode: autopilotMode,
                            autoStart: true,
                          }),
                        });
                        const data = await res.json();
                        if (data.workflow) setActiveWorkflow(data.workflow);
                      } catch (e) { console.error(e); }
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${
                      wf.color === "yellow" ? "border-yellow-200 dark:border-yellow-800 hover:border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10" :
                      wf.color === "red" ? "border-red-200 dark:border-red-800 hover:border-red-400 bg-red-50/50 dark:bg-red-900/10" :
                      wf.color === "blue" ? "border-blue-200 dark:border-blue-800 hover:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10" :
                      "border-purple-200 dark:border-purple-800 hover:border-purple-400 bg-purple-50/50 dark:bg-purple-900/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{wf.icon}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{wf.goal}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* QHSE Workflows */}
              <div className="space-y-2 mt-4">
                <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                  <i className="ri-heart-pulse-line" /> Safety (QHSE)
                </p>
                {[
                  { goal: "Report new safety incident", icon: "🚨", color: "red" },
                  { goal: "Create risk assessment for new process", icon: "⚡", color: "orange" },
                  { goal: "Schedule safety inspection", icon: "🔍", color: "blue" },
                  { goal: "Generate environmental compliance report", icon: "🌱", color: "green" },
                ].map((wf, idx) => (
                  <button
                    key={idx}
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/copilot/agent", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            goal: wf.goal,
                            mode: autopilotMode,
                            autoStart: true,
                          }),
                        });
                        const data = await res.json();
                        if (data.workflow) setActiveWorkflow(data.workflow);
                      } catch (e) { console.error(e); }
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${
                      wf.color === "red" ? "border-red-200 dark:border-red-800 hover:border-red-400 bg-red-50/50 dark:bg-red-900/10" :
                      wf.color === "orange" ? "border-orange-200 dark:border-orange-800 hover:border-orange-400 bg-orange-50/50 dark:bg-orange-900/10" :
                      wf.color === "green" ? "border-green-200 dark:border-green-800 hover:border-green-400 bg-green-50/50 dark:bg-green-900/10" :
                      "border-blue-200 dark:border-blue-800 hover:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{wf.icon}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{wf.goal}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Compliance & Proposals */}
              <div className="space-y-2 mt-4">
                <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                  <i className="ri-file-list-3-line" /> Compliance & Sales
                </p>
                {[
                  { goal: "Run compliance check against regulations", icon: "✅", color: "green" },
                  { goal: "Create proposal for customer", icon: "💼", color: "blue" },
                  { goal: "Create purchase order for supplier", icon: "🛒", color: "purple" },
                ].map((wf, idx) => (
                  <button
                    key={idx}
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/copilot/agent", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            goal: wf.goal,
                            mode: autopilotMode,
                            autoStart: true,
                          }),
                        });
                        const data = await res.json();
                        if (data.workflow) setActiveWorkflow(data.workflow);
                      } catch (e) { console.error(e); }
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${
                      wf.color === "green" ? "border-green-200 dark:border-green-800 hover:border-green-400 bg-green-50/50 dark:bg-green-900/10" :
                      wf.color === "purple" ? "border-purple-200 dark:border-purple-800 hover:border-purple-400 bg-purple-50/50 dark:bg-purple-900/10" :
                      "border-blue-200 dark:border-blue-800 hover:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{wf.icon}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{wf.goal}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Workflow Input */}
              <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Custom Workflow</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Describe what you want to automate..."
                    className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        const goal = e.currentTarget.value.trim();
                        e.currentTarget.value = "";
                        try {
                          const res = await fetch("/api/copilot/agent", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              goal,
                              mode: autopilotMode,
                              autoStart: true,
                            }),
                          });
                          const data = await res.json();
                          if (data.workflow) setActiveWorkflow(data.workflow);
                        } catch (err) { console.error(err); }
                      }
                    }}
                  />
                  <button
                    onClick={async () => {
                      const input = document.querySelector('input[placeholder*="automate"]') as HTMLInputElement;
                      if (input?.value.trim()) {
                        const goal = input.value.trim();
                        input.value = "";
                        try {
                          const res = await fetch("/api/copilot/agent", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              goal,
                              mode: autopilotMode,
                              autoStart: true,
                            }),
                          });
                          const data = await res.json();
                          if (data.workflow) setActiveWorkflow(data.workflow);
                        } catch (err) { console.error(err); }
                      }
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg"
                  >
                    <Rocket className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Mode UI */}
        {mode === "history" && (
          <div className="flex-1 flex flex-col min-h-0 bg-gray-50/30 dark:bg-gray-900/30">
            <div className="p-4 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/30 transition-all outline-none"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {isHistoryLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-sm text-gray-500 animate-pulse">
                    Retrieving history...
                  </p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    No previous conversations found.
                  </p>
                </div>
              ) : (
                history
                  .filter((h) =>
                    h.title.toLowerCase().includes(searchQuery.toLowerCase()),
                  )
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setConversationId(item.id);
                        setMode("chat");
                      }}
                      className="w-full text-left p-4 bg-white dark:bg-gray-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 border border-gray-100 dark:border-gray-700 rounded-2xl transition-all duration-300 group shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 whitespace-nowrap ml-2">
                          <Clock className="w-3 h-3" />
                          {new Date(item.timestamp).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-3">
                        {item.lastMessage}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {item.moduleId && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded text-[10px] font-medium uppercase tracking-wider">
                              {item.moduleId}
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-[10px] font-medium">
                            {item.messageCount} messages
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  ))
              )}
            </div>
          </div>
        )}

        {/* Tickets Mode UI - Advanced McKinsey Style */}
        {mode === "tickets" && (
          <div className="flex-1 flex flex-col min-h-0 bg-gray-50/30 dark:bg-gray-900/30">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  Support Dashboard
                </h3>
                <p className="text-[10px] text-gray-500">
                  Real-time resolution status & predictions
                </p>
              </div>
              <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                New Ticket
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {isHistoryLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-sm text-gray-500 animate-pulse">
                    Syncing ticket data...
                  </p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    No active tickets found.
                  </p>
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 group relative"
                  >
                    {/* Priority Indicator Bar */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${
                        ticket.priority === "CRITICAL"
                          ? "bg-red-500"
                          : ticket.priority === "HIGH"
                            ? "bg-orange-500"
                            : ticket.priority === "MEDIUM"
                              ? "bg-blue-500"
                              : "bg-gray-400"
                      }`}
                    />

                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-gray-400 tracking-tighter">
                            {ticket.ticketNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              ticket.status === "OPEN"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                : ticket.status === "IN_PROGRESS"
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                                  : ticket.status === "RESOLVED"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {ticket.status}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-black ${
                            ticket.priority === "CRITICAL"
                              ? "text-red-500"
                              : ticket.priority === "HIGH"
                                ? "text-orange-500"
                                : "text-gray-400"
                          }`}
                        >
                          {ticket.priority}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1 leading-tight group-hover:text-blue-600 transition-colors">
                        {ticket.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                        {ticket.description}
                      </p>

                      {/* McKinsey Style AI Prediction Section */}
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 mb-3 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <Brain className="w-3 h-3 text-purple-500" />
                            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">
                              AI RESOLUTION PREDICTION
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                style={{
                                  width: `${(ticket.confidenceScore || 0.8) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-[9px] font-bold text-purple-600">
                              {Math.round(
                                (ticket.confidenceScore || 0.8) * 100,
                              )}
                              %
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className="text-[8px] text-gray-400 uppercase font-black">
                                Est. Time
                              </span>
                              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                {ticket.predictiveResolutionTime}
                              </span>
                            </div>
                            <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700" />
                            <div className="flex flex-col">
                              <span className="text-[8px] text-gray-400 uppercase font-black">
                                Sentiment
                              </span>
                              <div className="flex items-center gap-1">
                                <TrendingUp
                                  className={`w-3 h-3 ${ticket.sentimentScore! > 0.6 ? "text-green-500" : "text-orange-500"}`}
                                />
                                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                  {Math.round(
                                    (ticket.sentimentScore || 0.5) * 100,
                                  )}
                                  %
                                </span>
                              </div>
                            </div>
                          </div>
                          {ticket.status === "IN_PROGRESS" && (
                            <div className="flex items-center gap-1 animate-pulse">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                              <span className="text-[9px] font-bold text-blue-600">
                                Active
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-[10px] font-bold border border-white dark:border-gray-800">
                            {ticket.assignedTo
                              ? ticket.assignedTo.substring(0, 1)
                              : "S"}
                          </div>
                          <span className="text-[10px] text-gray-500">
                            {ticket.category}
                          </span>
                        </div>
                        <button className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
                          Details <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Messages - Beautiful styling with perfect alignment - Fixed scrolling */}
        {mode === "chat" && (
          <div
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900 dark:to-gray-950 min-h-0 max-h-full scroll-smooth custom-scrollbar"
            style={{
              height: "100%",
              maxHeight: "100%",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
            }}
            onWheel={(e) => {
              // Ensure wheel events work properly
              e.stopPropagation();
            }}
          >
            {messages.length === 0 &&
              mode === "chat" &&
              suggestions.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 py-12 px-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Start a conversation with HazalyzeCopilot
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Press Ctrl+K to focus input
                  </p>
                </div>
              )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm break-words transition-all duration-200 hover:shadow-md ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white order-2 animate-in fade-in slide-in-from-right-4"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200/50 dark:border-gray-700/50 shadow-md order-1 animate-in fade-in slide-in-from-left-4"
                  }`}
                >
                  {/* Show attachment analysis badge if present */}
                  {message.metadata?.attachmentAnalysis && (
                    <div
                      className={`mb-2 pb-2 border-b ${message.role === "user" ? "border-white/20" : "border-gray-200 dark:border-gray-700"}`}
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <FileText
                          className={`w-3.5 h-3.5 ${message.role === "user" ? "text-white/80" : "text-blue-600 dark:text-blue-400"}`}
                        />
                        <span
                          className={
                            message.role === "user"
                              ? "text-white/90"
                              : "text-gray-600 dark:text-gray-400"
                          }
                        >
                          Analyzed:{" "}
                          {message.metadata.attachmentAnalysis.filename}
                        </span>
                        {message.metadata.attachmentAnalysis.confidence && (
                          <span
                            className={`ml-auto ${message.role === "user" ? "text-white/70" : "text-gray-500 dark:text-gray-500"}`}
                          >
                            {Math.round(
                              message.metadata.attachmentAnalysis.confidence *
                                100,
                            )}
                            % confidence
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {message.role === "user" ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  ) : (
                    <MarkdownRenderer 
                      content={message.content} 
                      className="text-sm"
                    />
                  )}

                  {/* Enhanced Features: Reasoning, Insights, Optimizations */}
                  {message.metadata?.reasoning &&
                    Array.isArray(message.metadata.reasoning) &&
                    message.metadata.reasoning.length > 0 && (
                      <details className="mt-3 text-xs">
                        <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                          🧠 Show Reasoning ({message.metadata.reasoning.length}{" "}
                          steps)
                        </summary>
                        <div className="mt-2 space-y-2 pl-2 border-l-2 border-blue-200 dark:border-blue-800">
                          {message.metadata.reasoning.map(
                            (step: any, idx: number) => (
                              <div key={idx} className="py-1">
                                <div className="font-medium text-gray-700 dark:text-gray-300">
                                  Step {step.step}: {step.action}
                                </div>
                                <div className="text-gray-600 dark:text-gray-400 mt-0.5">
                                  {step.reasoning}
                                </div>
                                {step.result && (
                                  <div className="text-gray-500 dark:text-gray-500 mt-0.5 italic">
                                    → {step.result}
                                  </div>
                                )}
                                <div className="text-gray-400 dark:text-gray-600 text-xs mt-0.5">
                                  Confidence:{" "}
                                  {Math.round((step.confidence || 0) * 100)}%
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </details>
                    )}

                  {/* Confidence Breakdown */}
                  {message.metadata?.confidence &&
                    message.metadata.confidence > 50 &&
                    !message.metadata.attachmentAnalysis && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs opacity-60">
                          Confidence: {Math.round(message.metadata.confidence)}%
                        </p>
                        {message.metadata.confidenceBreakdown && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                              View confidence breakdown
                            </summary>
                            <div className="mt-1 space-y-0.5 pl-2">
                              <div>
                                Knowledge Base:{" "}
                                {Math.round(
                                  (message.metadata.confidenceBreakdown
                                    .knowledgeBase || 0) * 100,
                                )}
                                %
                              </div>
                              <div>
                                Memory:{" "}
                                {Math.round(
                                  (message.metadata.confidenceBreakdown
                                    .memory || 0) * 100,
                                )}
                                %
                              </div>
                              <div>
                                Tool Execution:{" "}
                                {Math.round(
                                  (message.metadata.confidenceBreakdown
                                    .toolExecution || 0) * 100,
                                )}
                                %
                              </div>
                              <div>
                                Context Relevance:{" "}
                                {Math.round(
                                  (message.metadata.confidenceBreakdown
                                    .contextRelevance || 0) * 100,
                                )}
                                %
                              </div>
                            </div>
                          </details>
                        )}
                      </div>
                    )}

                  {/* Proactive Insights */}
                  {message.metadata?.proactiveInsights &&
                    Array.isArray(message.metadata.proactiveInsights) &&
                    message.metadata.proactiveInsights.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          💡 Proactive Insights
                        </div>
                        <div className="space-y-2">
                          {(message.metadata.proactiveInsights as any[]).map(
                            (insight: any, idx: number) => (
                              <div
                                key={idx}
                                className={`p-2 rounded-lg text-xs ${
                                  insight.type === "risk"
                                    ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                                    : insight.type === "opportunity"
                                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                                      : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                                }`}
                              >
                                <div className="font-medium text-gray-800 dark:text-gray-200">
                                  {insight.title}
                                </div>
                                <div className="text-gray-600 dark:text-gray-400 mt-0.5">
                                  {insight.description}
                                </div>
                                {insight.actionable && insight.action && (
                                  <button className="mt-1 text-blue-600 dark:text-blue-400 hover:underline text-xs">
                                    {insight.action} →
                                  </button>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {/* Suggested Optimizations */}
                  {message.metadata?.suggestedOptimizations &&
                    Array.isArray(message.metadata.suggestedOptimizations) &&
                    message.metadata.suggestedOptimizations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          ⚡ Suggested Optimizations
                        </div>
                        <div className="space-y-2">
                          {(
                            message.metadata.suggestedOptimizations as any[]
                          ).map((opt: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-xs"
                            >
                              <div className="font-medium text-gray-800 dark:text-gray-200">
                                {opt.area}
                              </div>
                              <div className="text-gray-600 dark:text-gray-400 mt-0.5">
                                <span className="line-through">
                                  {opt.current}
                                </span>{" "}
                                →{" "}
                                <span className="font-medium">
                                  {opt.suggested}
                                </span>
                              </div>
                              <div className="text-gray-500 dark:text-gray-500 mt-0.5">
                                Impact: {opt.impact} | Effort: {opt.effort}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Tool Calls & Results */}
                  {message.metadata?.toolCalls &&
                    message.metadata.toolCalls.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          🔧 Tools Used ({message.metadata.toolCalls.length})
                        </div>
                        <div className="space-y-1">
                          {message.metadata.toolCalls.map((toolCall: any) => {
                            const result = message.metadata?.toolResults?.find(
                              (r: any) => r.toolCallId === toolCall.id,
                            );
                            return (
                              <div key={toolCall.id} className="text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {toolCall.name}
                                  </span>
                                  {result && (
                                    <span
                                      className={`text-xs px-1.5 py-0.5 rounded ${
                                        result.success
                                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                      }`}
                                    >
                                      {result.success ? "✓" : "✗"}
                                    </span>
                                  )}
                                </div>
                                {result && result.output && (
                                  <div className="text-gray-500 dark:text-gray-400 mt-0.5 pl-2 text-xs">
                                    {JSON.stringify(result.output).substring(
                                      0,
                                      100,
                                    )}
                                    ...
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* ML Feedback Buttons */}
                  {message.role === "assistant" && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Was this helpful?
                      </span>
                      <button
                        onClick={async () => {
                          // Update local state
                          setMessages((prev) =>
                            prev.map((m) =>
                              m.id === message.id ? { ...m, feedback: "positive" as const } : m
                            )
                          );
                          // Find preceding user message
                          const msgIndex = messages.findIndex(m => m.id === message.id);
                          const userQuery = messages.slice(0, msgIndex).reverse().find(m => m.role === "user")?.content || "";
                          // Submit to API
                          try {
                            await fetch("/api/copilot/feedback", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                conversationId: conversationId || "unknown",
                                messageId: message.id,
                                type: "positive",
                                userQuery,
                                assistantResponse: message.content,
                                toolsUsed: message.metadata?.toolResults?.map((t: any) => t.toolId),
                                confidence: message.metadata?.confidence || 0.5,
                                responseTime: message.metadata?.processingTime || 0,
                                moduleId: pathname?.split("/")[1],
                                pathname,
                              }),
                            });
                          } catch (e) {
                            console.error("[Copilot] Failed to submit feedback:", e);
                          }
                        }}
                        disabled={!!message.feedback}
                        className={`p-1.5 rounded-lg transition-all ${
                          message.feedback === "positive"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                            : message.feedback
                              ? "opacity-30 cursor-not-allowed text-gray-400"
                              : "hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-500 hover:text-green-600 dark:hover:text-green-400"
                        }`}
                        title="Helpful"
                      >
                        <i className={`ri-thumb-up-${message.feedback === "positive" ? "fill" : "line"} text-sm`} />
                      </button>
                      <button
                        onClick={async () => {
                          // Update local state
                          setMessages((prev) =>
                            prev.map((m) =>
                              m.id === message.id ? { ...m, feedback: "negative" as const } : m
                            )
                          );
                          // Find preceding user message
                          const msgIndex = messages.findIndex(m => m.id === message.id);
                          const userQuery = messages.slice(0, msgIndex).reverse().find(m => m.role === "user")?.content || "";
                          // Submit to API
                          try {
                            await fetch("/api/copilot/feedback", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                conversationId: conversationId || "unknown",
                                messageId: message.id,
                                type: "negative",
                                userQuery,
                                assistantResponse: message.content,
                                toolsUsed: message.metadata?.toolResults?.map((t: any) => t.toolId),
                                confidence: message.metadata?.confidence || 0.5,
                                responseTime: message.metadata?.processingTime || 0,
                                moduleId: pathname?.split("/")[1],
                                pathname,
                              }),
                            });
                          } catch (e) {
                            console.error("[Copilot] Failed to submit feedback:", e);
                          }
                        }}
                        disabled={!!message.feedback}
                        className={`p-1.5 rounded-lg transition-all ${
                          message.feedback === "negative"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                            : message.feedback
                              ? "opacity-30 cursor-not-allowed text-gray-400"
                              : "hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                        }`}
                        title="Not helpful"
                      >
                        <i className={`ri-thumb-down-${message.feedback === "negative" ? "fill" : "line"} text-sm`} />
                      </button>
                      {message.feedback && (
                        <span className={`text-xs ml-1 ${
                          message.feedback === "positive" ? "text-green-500" : "text-red-500"
                        }`}>
                          Thanks for the feedback! 🎯
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {(isLoading || streamingContent) && (
              <div className="flex justify-start items-start animate-in fade-in slide-in-from-left-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 shadow-md">
                  {streamingContent ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                        {streamingContent}
                        <span className="inline-block w-2 h-4 bg-blue-600 animate-pulse ml-1"></span>
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
                        Thinking...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-center items-center">
                <div className="bg-red-50/90 dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/50 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-300 backdrop-blur-sm max-w-[85%] flex items-center gap-2">
                  <span>{error}</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setError(null);
                      // Retry last message if available
                      const lastUserMessage = messages
                        .filter((m) => m.role === "user")
                        .pop();
                      if (lastUserMessage) {
                        handleSend(lastUserMessage.content);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    type="button"
                    className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors no-drag"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        )}

        {/* Input - Only shown in chat/command/create modes */}
        {["chat", "command", "create"].includes(mode) && (
          <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shrink-0">
            <div className="flex items-end gap-2 relative">
              {/* File input (hidden) */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.csv"
              />

              <div className="flex-1 relative min-w-0 no-drag">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => {
                    e.stopPropagation();
                    setInput(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setInput("");
                    }
                  }}
                  onKeyUp={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  onBlur={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder={
                    mode === "chat"
                      ? isListening
                        ? "Listening..."
                        : "Ask HazalyzeCopilot anything..."
                      : mode === "command"
                        ? "Enter a command..."
                        : "Describe what to create..."
                  }
                  disabled={isLoading || isListening}
                  autoFocus={false}
                  className={`copilot-input w-full px-4 py-3 pr-20 border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:bg-gray-800/50 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-200 no-drag ${isListening ? "animate-pulse ring-2 ring-red-500/50 border-red-500" : ""}`}
                />

                {/* Attachment Badge - Perfectly positioned with preview */}
                {activeAttachment && (
                  <div className="absolute left-2 -top-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2 flex items-center gap-2 z-10 animate-in fade-in slide-in-from-bottom-2 max-w-[280px]">
                    {activeAttachment.type.startsWith("image/") ? (
                      <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-700">
                        <img
                          src={URL.createObjectURL(activeAttachment)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onLoad={(e) =>
                            URL.revokeObjectURL(
                              (e.target as HTMLImageElement).src,
                            )
                          }
                        />
                      </div>
                    ) : (
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded shrink-0">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium block truncate">
                        {activeAttachment.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {(activeAttachment.size / 1024).toFixed(1)}KB
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveAttachment(null);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      type="button"
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1 shrink-0 transition-colors no-drag"
                      aria-label="Remove attachment"
                    >
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                )}

                {/* Feature toggles - Perfectly aligned */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 no-drag">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleVoiceInput();
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onMouseUp={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    type="button"
                    className={`p-1.5 rounded-md transition-all duration-200 no-drag ${
                      isListening
                        ? "text-red-500 bg-red-50 dark:bg-red-900/30 animate-pulse"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    title={isListening ? "Stop listening" : "Voice input"}
                    aria-label={
                      isListening ? "Stop listening" : "Start voice input"
                    }
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onMouseUp={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    type="button"
                    className={`p-1.5 rounded-md transition-all duration-200 no-drag ${
                      activeAttachment
                        ? "text-blue-500 bg-blue-50 dark:bg-blue-900/30"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    title="Attach file"
                    aria-label="Attach file"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSend();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                disabled={
                  (!input.trim() && !activeAttachment) ||
                  isLoading ||
                  isListening
                }
                type="button"
                className="px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:shadow-none disabled:hover:scale-100 flex items-center justify-center min-w-[48px] h-[42px] shrink-0 no-drag"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Resize handle - Better UX */}
        <div
          className="widget-resize-handle absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize bg-gradient-to-br from-blue-500 to-purple-500 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-tl-lg"
          onMouseDown={handleMouseDown}
          title="Resize"
          aria-label="Resize widget"
        />

        {/* Enhanced scrollbar styles for copilot widget */}
        <style jsx>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(59, 130, 246, 0.3);
            border-radius: 3px;
            transition: background 0.2s ease;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(59, 130, 246, 0.6);
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(147, 197, 253, 0.3);
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(147, 197, 253, 0.6);
          }

          /* Prevent text selection during drag */
          .widget-header {
            user-select: none;
            -webkit-user-select: none;
          }

          /* Smooth transitions for all interactive elements */
          button,
          input {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }

          /* Focus visible styles */
          .copilot-input:focus-visible {
            outline: 2px solid rgba(59, 130, 246, 0.5);
            outline-offset: 2px;
          }

          /* Animation keyframes */
          @keyframes fade-in {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slide-in-from-bottom-4 {
            from {
              transform: translateY(1rem);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes slide-in-from-left-4 {
            from {
              transform: translateX(-1rem);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes slide-in-from-right-4 {
            from {
              transform: translateX(1rem);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes zoom-in-95 {
            from {
              transform: scale(0.95);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }

          .animate-in {
            animation: fade-in 0.2s ease-out;
          }

          .fade-in {
            animation: fade-in 0.2s ease-out;
          }

          .slide-in-from-bottom-4 {
            animation: slide-in-from-bottom-4 0.3s ease-out;
          }

          .slide-in-from-left-4 {
            animation: slide-in-from-left-4 0.3s ease-out;
          }

          .slide-in-from-right-4 {
            animation: slide-in-from-right-4 0.3s ease-out;
          }

          .zoom-in-95 {
            animation: zoom-in-95 0.2s ease-out;
          }

          @keyframes backdropFadeIn {
            from {
              opacity: 0;
              backdrop-filter: blur(0px) saturate(100%);
              -webkit-backdrop-filter: blur(0px) saturate(100%);
            }
            to {
              opacity: 1;
              backdrop-filter: blur(12px) saturate(180%);
              -webkit-backdrop-filter: blur(12px) saturate(180%);
            }
          }

          @keyframes backdropPulse {
            0%,
            100% {
              opacity: 0.8;
              transform: translate(-50%, -50%) scale(1);
            }
            50% {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1.1);
            }
          }

          @keyframes shimmer {
            0% {
              background-position: -200% -200%;
            }
            50% {
              background-position: 200% 200%;
            }
            100% {
              background-position: -200% -200%;
            }
          }
        `}</style>
      </div>
    </>
  );
}
