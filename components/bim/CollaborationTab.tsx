/**
 * BIM Collaboration Tab Component
 *
 * Full collaboration UI with sessions, participants, annotations, issues, and chat
 * Real-time collaboration with WebSocket integration
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import type {
  BIMCollaborationSession,
  BIMAnnotation,
  BIMIssue,
} from "@/types/bim-marketplace";
import { useNotifications } from "@/lib/utils/notifications";
import Modal from "@/components/Modal";
import { WebSocketService } from "@/lib/services/realtime/websocketService";

interface CollaborationTabProps {
  modelId?: string;
  onSessionSelect?: (session: BIMCollaborationSession) => void;
  onCreateSession?: (
    session: Omit<BIMCollaborationSession, "id" | "createdAt" | "updatedAt">,
  ) => void;
}

export default function CollaborationTab({
  modelId,
  onSessionSelect,
  onCreateSession,
}: CollaborationTabProps) {
  const [sessions, setSessions] = useState<BIMCollaborationSession[]>([]);
  const [selectedSession, setSelectedSession] =
    useState<BIMCollaborationSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "sessions" | "annotations" | "issues" | "chat"
  >("sessions");
  const [chatMessage, setChatMessage] = useState("");
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const notifications = useNotifications();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    loadSessions();
  }, [modelId]);

  // WebSocket connection for real-time collaboration
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ws = new WebSocketService();
    wsRef.current = ws;

    ws.connect()
      .then(() => {
        setIsRealtimeConnected(true);

        // Subscribe to collaboration events
        ws.on("notification", (event) => {
          if (event.data.type === "bim-collaboration") {
            const { sessionId, action, data } = event.data;

            if (action === "chat-message") {
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === sessionId
                    ? { ...s, activities: [...s.activities, data] }
                    : s,
                ),
              );
              if (selectedSession?.id === sessionId) {
                setSelectedSession((prev) =>
                  prev
                    ? {
                        ...prev,
                        activities: [...prev.activities, data],
                      }
                    : null,
                );
              }
            } else if (
              action === "participant-joined" ||
              action === "participant-left"
            ) {
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === sessionId
                    ? { ...s, participants: data.participants }
                    : s,
                ),
              );
              if (selectedSession?.id === sessionId) {
                setSelectedSession((prev) =>
                  prev
                    ? {
                        ...prev,
                        participants: data.participants,
                      }
                    : null,
                );
              }
            } else if (action === "annotation-added") {
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === sessionId
                    ? { ...s, annotations: [...s.annotations, data] }
                    : s,
                ),
              );
              if (selectedSession?.id === sessionId) {
                setSelectedSession((prev) =>
                  prev
                    ? {
                        ...prev,
                        annotations: [...prev.annotations, data],
                      }
                    : null,
                );
              }
            } else if (action === "issue-added" || action === "issue-updated") {
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === sessionId ? { ...s, issues: data.issues } : s,
                ),
              );
              if (selectedSession?.id === sessionId) {
                setSelectedSession((prev) =>
                  prev
                    ? {
                        ...prev,
                        issues: data.issues,
                      }
                    : null,
                );
              }
            }
          }
        });
      })
      .catch((error) => {
        console.warn("WebSocket connection failed:", error);
        setIsRealtimeConnected(false);
      });

    return () => {
      ws.disconnect();
      setIsRealtimeConnected(false);
    };
  }, [selectedSession?.id]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedSession?.activities]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (modelId) params.set("modelId", modelId);
      params.set("userId", "user-1"); // In real app, get from auth

      const response = await fetch(
        `/api/bim/collaboration/sessions?${params.toString()}`,
      );
      const result = await response.json();

      if (result.success) {
        setSessions(result.data || []);
      } else {
        notifications.error(
          "Failed to load sessions",
          result.error || "Unknown error",
        );
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
      notifications.error("Error", "Failed to load collaboration sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (sessionData: any) => {
    try {
      const response = await fetch("/api/bim/collaboration/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: modelId || "model-1",
          hostId: "user-1",
          hostName: "Current User",
          session: sessionData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        notifications.success(
          "Session Created",
          "Collaboration session is ready",
        );
        setShowCreateModal(false);
        loadSessions();
        onCreateSession?.(result.data);
      } else {
        notifications.error(
          "Failed",
          result.error || "Could not create session",
        );
      }
    } catch (error) {
      notifications.error("Error", "Failed to create collaboration session");
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    try {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return;

      // Join via WebSocket
      if (wsRef.current?.isConnected()) {
        wsRef.current.send("notification", {
          type: "bim-collaboration",
          action: "join-session",
          sessionId,
          userId: "user-1",
          userName: "Current User",
        });
      }

      notifications.success(
        "Joined Session",
        "You are now in the collaboration session",
      );
      onSessionSelect?.(session);
    } catch (error) {
      notifications.error("Error", "Failed to join session");
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !selectedSession) return;

    try {
      // In real app, send via WebSocket
      const newActivity = {
        id: `activity-${Date.now()}`,
        sessionId: selectedSession.id,
        userId: "user-1",
        userName: "Current User",
        type: "chat",
        content: chatMessage,
        timestamp: new Date(),
        metadata: {},
      };

      setChatMessage("");
      notifications.success("Message Sent", "Your message has been sent");
    } catch (error) {
      notifications.error("Error", "Failed to send message");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "scheduled":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "ended":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        <p className="text-gray-400 text-sm">
          Loading collaboration sessions...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Collaboration Sessions
          </h2>
          <div className="flex items-center gap-2">
            <p className="text-gray-400 text-sm">
              Real-time collaboration on BIM models
            </p>
            {isRealtimeConnected ? (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs flex items-center gap-1">
                <i className="ri-wifi-line"></i>
                Connected
              </span>
            ) : (
              <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs flex items-center gap-1">
                <i className="ri-wifi-off-line"></i>
                Offline
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <i className="ri-add-line"></i>
          New Session
        </button>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-lg">
          <i className="ri-team-line text-4xl text-gray-500 mb-4"></i>
          <p className="text-gray-400 mb-4">No collaboration sessions found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm font-medium transition-colors"
          >
            Create Your First Session
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-cyan-500/30 transition-all cursor-pointer"
              onClick={() => {
                setSelectedSession(session);
                setShowSessionModal(true);
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-white font-semibold text-lg">
                  {session.name}
                </h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(session.status)}`}
                >
                  {session.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <i className="ri-user-line"></i>
                  <span>{session.participants.length} participants</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ri-message-line"></i>
                  <span>
                    {session.activities.filter((a) => a.type === "chat").length}{" "}
                    messages
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ri-edit-line"></i>
                  <span>{session.annotations.length} annotations</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ri-alert-line"></i>
                  <span>{session.issues.length} issues</span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinSession(session.id);
                  }}
                  className="flex-1 px-3 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  <i className="ri-login-box-line mr-2"></i>
                  Join
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSession(session);
                    setShowSessionModal(true);
                  }}
                  className="px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white text-sm transition-colors"
                >
                  <i className="ri-eye-line"></i>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create Collaboration Session"
          size="lg"
        >
          <CreateSessionForm
            modelId={modelId}
            onSubmit={(data) => {
              handleCreateSession(data);
            }}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}

      {/* Session Detail Modal */}
      {showSessionModal && selectedSession && (
        <Modal
          isOpen={showSessionModal}
          onClose={() => setShowSessionModal(false)}
          title={selectedSession.name}
          size="xl"
        >
          <SessionDetailView
            session={selectedSession}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            chatMessage={chatMessage}
            onChatMessageChange={setChatMessage}
            onSendMessage={handleSendMessage}
            chatEndRef={chatEndRef}
          />
        </Modal>
      )}
    </div>
  );
}

// Create Session Form Component
function CreateSessionForm({ modelId, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    name: "",
    settings: {
      allowGuestAccess: true,
      requireApproval: false,
      recordingEnabled: true,
      chatEnabled: true,
      annotationsEnabled: true,
      measurementsEnabled: true,
      exportEnabled: true,
    },
    metadata: {},
  });

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Session Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
          placeholder="Enter session name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Session Settings
        </label>
        <div className="space-y-3">
          {Object.entries(formData.settings).map(([key, value]) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={value as boolean}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    settings: { ...prev.settings, [key]: e.target.checked },
                  }))
                }
                className="rounded text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-sm text-gray-300 capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-white/10">
        <button
          onClick={() =>
            onSubmit({ ...formData, modelId, status: "scheduled" })
          }
          disabled={!formData.name.trim()}
          className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
        >
          Create Session
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Session Detail View Component
function SessionDetailView({
  session,
  activeTab,
  onTabChange,
  chatMessage,
  onChatMessageChange,
  onSendMessage,
  chatEndRef,
}: any) {
  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        {[
          { id: "sessions", label: "Overview", icon: "ri-information-line" },
          { id: "annotations", label: "Annotations", icon: "ri-edit-line" },
          { id: "issues", label: "Issues", icon: "ri-alert-line" },
          { id: "chat", label: "Chat", icon: "ri-message-line" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <i className={`${tab.icon} mr-2`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "sessions" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Status</label>
                <p className="text-white capitalize">{session.status}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Participants</label>
                <p className="text-white">{session.participants.length}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Host</label>
                <p className="text-white">{session.hostName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Created</label>
                <p className="text-white">
                  {format(new Date(session.createdAt), "MMM dd, yyyy HH:mm")}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Participants
              </label>
              <div className="space-y-2">
                {session.participants.map((p: any) => (
                  <div
                    key={p.userId}
                    className="flex items-center gap-3 p-2 bg-white/5 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <i className="ri-user-line text-cyan-400"></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">{p.userName}</p>
                      <p className="text-gray-400 text-xs">{p.role}</p>
                    </div>
                    {p.isActive && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                        Active
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "annotations" && (
          <motion.div
            key="annotations"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {session.annotations.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <i className="ri-edit-line text-4xl mb-2"></i>
                <p>No annotations yet</p>
              </div>
            ) : (
              session.annotations.map((annotation: BIMAnnotation) => (
                <div
                  key={annotation.id}
                  className="p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <i className="ri-edit-line text-cyan-400 text-xs"></i>
                      </div>
                      <span className="text-white text-sm font-medium">
                        {annotation.userName}
                      </span>
                    </div>
                    <span className="text-gray-400 text-xs">
                      {format(new Date(annotation.createdAt), "HH:mm")}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm">{annotation.content}</p>
                  {annotation.position && (
                    <p className="text-gray-500 text-xs mt-2">
                      Position: ({annotation.position.x.toFixed(2)},{" "}
                      {annotation.position.y.toFixed(2)},{" "}
                      {annotation.position.z.toFixed(2)})
                    </p>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === "issues" && (
          <motion.div
            key="issues"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {session.issues.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <i className="ri-alert-line text-4xl mb-2"></i>
                <p>No issues reported</p>
              </div>
            ) : (
              session.issues.map((issue: BIMIssue) => (
                <div
                  key={issue.id}
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          issue.severity === "critical"
                            ? "bg-red-500/20 text-red-400"
                            : issue.severity === "high"
                              ? "bg-orange-500/20 text-orange-400"
                              : issue.severity === "medium"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {issue.severity}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          issue.status === "resolved"
                            ? "bg-green-500/20 text-green-400"
                            : issue.status === "in-progress"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {issue.status}
                      </span>
                    </div>
                    <span className="text-gray-400 text-xs">
                      {format(new Date(issue.createdAt), "MMM dd, HH:mm")}
                    </span>
                  </div>
                  <h4 className="text-white font-medium mb-1">{issue.title}</h4>
                  <p className="text-gray-300 text-sm">{issue.description}</p>
                  {issue.assignedTo && (
                    <p className="text-gray-500 text-xs mt-2">
                      Assigned to: {issue.assignedTo}
                    </p>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === "chat" && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-[500px]"
          >
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
              {session.activities
                .filter((a: any) => a.type === "chat")
                .map((activity: any) => (
                  <div
                    key={activity.id}
                    className={`flex gap-3 ${activity.userId === "user-1" ? "flex-row-reverse" : ""}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <i className="ri-user-line text-cyan-400"></i>
                    </div>
                    <div
                      className={`flex-1 ${activity.userId === "user-1" ? "text-right" : ""}`}
                    >
                      <div
                        className={`inline-block p-3 rounded-lg ${
                          activity.userId === "user-1"
                            ? "bg-cyan-500/20 text-white"
                            : "bg-white/5 text-gray-300"
                        }`}
                      >
                        <p className="text-sm">{activity.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(activity.timestamp), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="flex gap-2 pt-4 border-t border-white/10">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => onChatMessageChange(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && onSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              />
              <button
                onClick={onSendMessage}
                disabled={!chatMessage.trim()}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
              >
                <i className="ri-send-plane-line"></i>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
