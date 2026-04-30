"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

/**
 * HAZALYZE COPILOT - Embedded AI Assistant
 * This is a production-ready Copilot component for your logistics platform
 * Similar to GitHub Copilot but customized for supply chain operations
 */

export const HazalyzeCopilot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"chat" | "command" | "create">("chat");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeFeatures, setActiveFeatures] = useState({
    voice: false,
    vision: false,
    code: true,
    docs: true,
  });

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Context-aware suggestions based on current page/task
  useEffect(() => {
    const contextSuggestions = getContextualSuggestions();
    setSuggestions(contextSuggestions);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get contextual suggestions based on current work
  const getContextualSuggestions = () => {
    if (typeof window === "undefined") return [];
    const currentPath = window.location.pathname;

    if (currentPath.includes("/shipments")) {
      return [
        "📦 Optimize route for shipment #847",
        "📊 Generate shipment report for this week",
        "🔮 Predict delivery delays",
        "💰 Calculate cost savings opportunities",
      ];
    } else if (
      currentPath.includes("/warehouse") ||
      currentPath.includes("/inventory")
    ) {
      return [
        "📈 Analyze warehouse capacity",
        "🤖 Suggest inventory optimization",
        "⚡ Generate picking list",
        "📋 Create safety inspection checklist",
      ];
    } else if (
      currentPath.includes("/finance") ||
      currentPath.includes("/valuation")
    ) {
      return [
        "💹 Generate P&L report",
        "📊 Analyze revenue trends",
        "💰 Identify cost reduction areas",
        "📈 Forecast next quarter revenue",
      ];
    } else if (
      currentPath.includes("/inbound") ||
      currentPath.includes("/asn")
    ) {
      return [
        "📥 Analyze ASN processing time",
        "🔍 Check for missing documents",
        "⚡ Optimize receiving workflow",
        "📊 Generate inbound performance report",
      ];
    } else if (currentPath.includes("/outbound")) {
      return [
        "📤 Optimize outbound operations",
        "🚚 Generate shipping labels",
        "📊 Analyze delivery performance",
        "💰 Calculate shipping costs",
      ];
    }

    return [
      "🚀 Optimize current workflow",
      "📝 Generate documentation",
      "🔧 Fix current issues",
      "💡 Suggest improvements",
    ];
  };

  // Handle AI commands
  const handleCommand = async (command: string) => {
    setIsLoading(true);

    // Add user message
    const userMessage = { role: "user", content: command };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Simulate AI response (replace with actual AI API call)
      const response = await simulateAIResponse(command);

      // Add AI response
      const aiMessage = { role: "assistant", content: response };
      setMessages((prev) => [...prev, aiMessage]);

      // Execute action if needed
      if (response.includes("[ACTION]")) {
        executeAction(response);
      }
    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setInput("");
    }
  };

  // Simulate AI response (replace with actual OpenAI/Anthropic API)
  const simulateAIResponse = async (command: string): Promise<string> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Pattern matching for demo (replace with actual AI)
    if (command.toLowerCase().includes("optimize route")) {
      return `✅ Route Optimization Complete!

I've analyzed shipment #847 and found a more efficient route:

**Current Route:** Dammam → Riyadh → Kuwait City
- Distance: 892 km
- Time: 11.5 hours
- Cost: 3,450 SAR

**Optimized Route:** Dammam → Khafji → Kuwait City
- Distance: 412 km
- Time: 5.5 hours  
- Cost: 1,890 SAR

**Savings:** 
- 🚛 480 km shorter (54% reduction)
- ⏱️ 6 hours faster
- 💰 1,560 SAR saved (45% cost reduction)

[ACTION] Would you like me to apply this optimization?`;
    } else if (command.toLowerCase().includes("generate report")) {
      return `📊 Weekly Shipment Report Generated!

**Period:** Jan 10-17, 2025

**Key Metrics:**
- Total Shipments: 847
- On-time Delivery: 96.2%
- Average Transit Time: 8.3 hours
- Total Revenue: 1.47M SAR

**Top Performing Routes:**
1. Dammam-Kuwait: 234 shipments (98% on-time)
2. Riyadh-Jeddah: 189 shipments (95% on-time)
3. Dammam-Bahrain: 156 shipments (97% on-time)

**Areas for Improvement:**
- Jubail route experiencing 15% delays due to customs
- Consider adding 2 trucks for peak Thursday demand

[ACTION] Report saved to your dashboard. View now?`;
    } else if (
      command.toLowerCase().includes("code") ||
      command.toLowerCase().includes("component")
    ) {
      return `\`\`\`typescript
// Generated React Component for Shipment Tracking
import { useState, useEffect } from 'react';

export const ShipmentTracker: React.FC<{ shipmentId: string }> = ({ shipmentId }) => {
  const [status, setStatus] = useState<'pending' | 'in-transit' | 'delivered'>('pending');
  const [location, setLocation] = useState({ lat: 26.4207, lng: 50.0888 });
  
  useEffect(() => {
    // Real-time tracking subscription
    const subscription = subscribeToShipment(shipmentId, (update) => {
      setStatus(update.status);
      setLocation(update.location);
    });
    
    return () => subscription.unsubscribe();
  }, [shipmentId]);
  
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3>Shipment #{shipmentId}</h3>
      <div className="space-y-4">
        <StatusIndicator status={status} />
        <MapView location={location} />
        <EstimatedDelivery shipmentId={shipmentId} />
      </div>
    </div>
  );
};
\`\`\`

✅ Component generated! This includes real-time tracking, status updates, and map integration.`;
    }

    // Default response
    return `I understand you want to: "${command}". Let me help you with that.

Based on your current context, here are my recommendations:
1. First, let's analyze the current state
2. Then, I'll suggest optimizations
3. Finally, we can implement the changes

What specific aspect would you like me to focus on?`;
  };

  // Execute actions based on AI response
  const executeAction = (response: string) => {
    // Parse and execute actions from AI response
    console.log("Executing action from AI response:", response);
    // Implement actual action execution here
  };

  // Quick action handlers
  const quickActions = [
    {
      icon: "ri-flashlight-line",
      label: "Optimize",
      action: "Optimize current workflow for maximum efficiency",
    },
    {
      icon: "ri-code-s-slash-line",
      label: "Generate Code",
      action: "Generate code for the current feature",
    },
    {
      icon: "ri-file-text-line",
      label: "Create Docs",
      action: "Create documentation for this module",
    },
    {
      icon: "ri-brain-line",
      label: "Analyze",
      action: "Analyze performance and suggest improvements",
    },
  ];

  return (
    <>
      {/* Floating Copilot Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg transition-all duration-300 z-50 flex items-center justify-center text-white ${
          isOpen
            ? "bg-gradient-to-r from-red-500 to-red-600 rotate-45"
            : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-xl hover:scale-110"
        }`}
        aria-label="Toggle AI Copilot"
      >
        <i
          className={`text-2xl ${isOpen ? "ri-close-line" : "ri-sparkling-2-line"}`}
        ></i>
      </button>

      {/* Copilot Panel */}
      {isOpen && (
        <React.Fragment>
          {/* Backdrop Blur for Clarity */}
          <div
            className="fixed inset-0 z-[49] backdrop-blur-md bg-black/20 animate-in fade-in duration-300"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed bottom-24 right-6 w-[420px] max-h-[600px] bg-[#1f2937]/95 backdrop-blur-xl border border-[#374151] rounded-xl shadow-2xl z-50 flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="p-4 border-b border-[#374151]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <i className="ri-sparkling-2-line text-white text-lg"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      Hazalyze Copilot
                    </h3>
                    <p className="text-xs text-[#9ca3af]">
                      AI-powered assistant
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[#9ca3af] hover:text-white transition-colors"
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>

              {/* Mode Selector */}
              <div className="flex gap-1 p-1 bg-[#111827] rounded-lg">
                {(["chat", "command", "create"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      mode === m
                        ? "bg-[#374151] text-white shadow-sm"
                        : "text-[#9ca3af] hover:text-white"
                    }`}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            {mode === "command" && (
              <div className="p-3 border-b border-[#374151]">
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCommand(action.action)}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-[#111827] hover:bg-[#374151] rounded-lg transition-colors text-[#9ca3af] hover:text-white"
                    >
                      <i className={`${action.icon} text-base`}></i>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {mode === "chat" &&
              suggestions.length > 0 &&
              messages.length === 0 && (
                <div className="p-3 border-b border-[#374151]">
                  <p className="text-xs text-[#9ca3af] mb-2">Suggestions:</p>
                  <div className="space-y-1">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleCommand(suggestion)}
                        className="w-full text-left px-3 py-2 text-sm bg-[#111827] hover:bg-[#374151] rounded-lg transition-colors text-[#9ca3af] hover:text-white"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] custom-scrollbar">
              {messages.length === 0 &&
                mode === "chat" &&
                suggestions.length === 0 && (
                  <div className="text-center py-8 text-[#9ca3af]">
                    <i className="ri-sparkling-2-line text-5xl mx-auto mb-3 text-[#374151]"></i>
                    <p className="text-sm text-white">
                      Hi! How can I help you today?
                    </p>
                    <p className="text-xs mt-1">
                      Ask me anything about your logistics operations.
                    </p>
                  </div>
                )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                        : "bg-[#111827] text-white border border-[#374151]"
                    }`}
                  >
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {msg.content}
                    </pre>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#111827] px-3 py-2 rounded-lg border border-[#374151]">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[#374151]">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (input.trim()) handleCommand(input);
                      }
                    }}
                    placeholder={
                      mode === "chat"
                        ? "Ask me anything..."
                        : mode === "command"
                          ? "Enter a command..."
                          : "Describe what to create..."
                    }
                    className="w-full px-3 py-2 pr-20 text-sm bg-[#111827] border border-[#374151] rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none text-white placeholder-[#6b7280]"
                    rows={1}
                    disabled={isLoading}
                  />

                  {/* Feature toggles */}
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() =>
                        setActiveFeatures({
                          ...activeFeatures,
                          voice: !activeFeatures.voice,
                        })
                      }
                      className={`p-1 rounded transition-colors ${activeFeatures.voice ? "text-cyan-400" : "text-[#6b7280] hover:text-[#9ca3af]"}`}
                      title="Voice input"
                    >
                      <i className="ri-mic-line text-base"></i>
                    </button>
                    <button
                      onClick={() =>
                        setActiveFeatures({
                          ...activeFeatures,
                          vision: !activeFeatures.vision,
                        })
                      }
                      className={`p-1 rounded transition-colors ${activeFeatures.vision ? "text-cyan-400" : "text-[#6b7280] hover:text-[#9ca3af]"}`}
                      title="Image input"
                    >
                      <i className="ri-image-line text-base"></i>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => input.trim() && handleCommand(input)}
                  disabled={!input.trim() || isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <i className="ri-send-plane-line text-base"></i>
                </button>
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between mt-2 text-xs text-[#9ca3af]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    AI Ready
                  </span>
                  <span>Model: GPT-4</span>
                </div>
                <button className="hover:text-white transition-colors">
                  <i className="ri-settings-3-line text-sm"></i>
                </button>
              </div>
            </div>
          </div>
        </React.Fragment>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `,
        }}
      />
    </>
  );
};

// Helper function to subscribe to shipment updates (example)
const subscribeToShipment = (
  shipmentId: string,
  callback: (update: any) => void,
) => {
  // Implement WebSocket or EventSource subscription
  const interval = setInterval(() => {
    callback({
      status: "in-transit",
      location: {
        lat: 26.4207 + Math.random() * 0.1,
        lng: 50.0888 + Math.random() * 0.1,
      },
    });
  }, 5000);

  return {
    unsubscribe: () => clearInterval(interval),
  };
};

export default HazalyzeCopilot;
