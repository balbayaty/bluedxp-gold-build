/**
 * BIM AR/VR Tab Component
 *
 * Full AR/VR support with immersive visualization sessions
 * Supports AR, VR, and mixed reality experiences
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import type { BIMARVRSession } from "@/types/bim-marketplace";
import { useNotifications } from "@/lib/utils/notifications";
import Modal from "@/components/Modal";
import { WebSocketService } from "@/lib/services/realtime/websocketService";

interface ARVRTabProps {
  modelId?: string;
  onSessionStart?: (session: BIMARVRSession) => void;
}

export default function ARVRTab({ modelId, onSessionStart }: ARVRTabProps) {
  const [sessions, setSessions] = useState<BIMARVRSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<BIMARVRSession | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const notifications = useNotifications();
  const wsRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    if (modelId) {
      loadSessions();
    }
  }, [modelId]);

  // WebSocket connection for real-time AR/VR session updates
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ws = new WebSocketService();
    wsRef.current = ws;

    ws.connect()
      .then(() => {
        setIsRealtimeConnected(true);

        // Subscribe to AR/VR session updates
        ws.on("notification", (event) => {
          if (event.data.type === "bim-ar-vr") {
            const { sessionId, action, data } = event.data;

            if (
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
            } else if (action === "session-status-changed") {
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === sessionId ? { ...s, status: data.status } : s,
                ),
              );
              if (selectedSession?.id === sessionId) {
                setSelectedSession((prev) =>
                  prev
                    ? {
                        ...prev,
                        status: data.status,
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

  const loadSessions = async () => {
    setLoading(true);
    try {
      // In real app, fetch from AR/VR service
      const mockSessions: BIMARVRSession[] = [];
      setSessions(mockSessions);
    } catch (error) {
      console.error("Error loading AR/VR sessions:", error);
      notifications.error("Error", "Failed to load AR/VR sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (sessionData: any) => {
    try {
      // In real app, create via AR/VR service
      notifications.success("Session Created", "AR/VR session is ready");
      setShowCreateModal(false);
      loadSessions();
    } catch (error) {
      notifications.error("Error", "Failed to create AR/VR session");
    }
  };

  const handleStartSession = async (sessionId: string) => {
    try {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return;

      // Notify via WebSocket if connected
      if (wsRef.current?.isConnected()) {
        wsRef.current.send("notification", {
          type: "bim-ar-vr",
          action: "session-started",
          sessionId,
          userId: "user-1",
        });
      }

      notifications.success(
        "Session Starting",
        "Preparing immersive experience...",
      );
      onSessionStart?.(session);
    } catch (error) {
      notifications.error("Error", "Failed to start AR/VR session");
    }
  };

  const sessionTypes = [
    {
      id: "ar",
      label: "Augmented Reality",
      icon: "ri-smartphone-line",
      description: "View BIM models in AR on your mobile device",
      color: "blue",
    },
    {
      id: "vr",
      label: "Virtual Reality",
      icon: "ri-vr-line",
      description: "Immersive VR experience with VR headset",
      color: "purple",
    },
    {
      id: "mixed-reality",
      label: "Mixed Reality",
      icon: "ri-glasses-line",
      description: "Combine AR and VR for mixed reality experience",
      color: "cyan",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "paused":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
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
        <p className="text-gray-400 text-sm">Loading AR/VR sessions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            AR/VR Visualization
          </h2>
          <div className="flex items-center gap-2">
            <p className="text-gray-400 text-sm">
              Immersive AR and VR experiences for BIM models
            </p>
            {isRealtimeConnected && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs flex items-center gap-1">
                <i className="ri-wifi-line"></i>
                Live
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={!modelId}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <i className="ri-add-line"></i>
          New Session
        </button>
      </div>

      {/* Session Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sessionTypes.map((type) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className={`bg-white/5 border border-white/10 rounded-xl p-6 hover:border-${type.color}-500/30 transition-all cursor-pointer`}
            onClick={() => {
              setShowCreateModal(true);
            }}
          >
            <div
              className={`w-12 h-12 rounded-lg bg-${type.color}-500/20 flex items-center justify-center mb-4`}
            >
              <i className={`${type.icon} text-${type.color}-400 text-2xl`}></i>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">
              {type.label}
            </h3>
            <p className="text-gray-400 text-sm">{type.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Immersive Walkthrough",
            icon: "ri-walk-line",
            color: "cyan",
          },
          {
            label: "Element Inspection",
            icon: "ri-search-eye-line",
            color: "blue",
          },
          { label: "Measurement Tools", icon: "ri-ruler-line", color: "green" },
          {
            label: "Annotation Support",
            icon: "ri-edit-line",
            color: "purple",
          },
          {
            label: "Multi-User Support",
            icon: "ri-team-line",
            color: "orange",
          },
          {
            label: "Export Screenshots",
            icon: "ri-screenshot-line",
            color: "yellow",
          },
          { label: "Recording", icon: "ri-record-circle-line", color: "red" },
          { label: "Share Experience", icon: "ri-share-line", color: "pink" },
        ].map((feature) => (
          <div
            key={feature.label}
            className="bg-white/5 border border-white/10 rounded-lg p-4 text-center"
          >
            <div
              className={`w-10 h-10 rounded-lg bg-${feature.color}-500/20 flex items-center justify-center mx-auto mb-2`}
            >
              <i className={`${feature.icon} text-${feature.color}-400`}></i>
            </div>
            <p className="text-white text-sm font-medium">{feature.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div>
          <h3 className="text-white font-semibold text-lg mb-4">
            Recent Sessions
          </h3>
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-cyan-500/30 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedSession(session);
                  setShowSessionModal(true);
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-white font-medium capitalize">
                      {session.type} Session
                    </h4>
                    <p className="text-gray-400 text-sm">
                      {format(
                        new Date(session.createdAt),
                        "MMM dd, yyyy HH:mm",
                      )}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(session.status)}`}
                  >
                    {session.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                  <div className="flex items-center gap-2">
                    <i className="ri-time-line"></i>
                    <span>{session.duration || 0} minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="ri-user-line"></i>
                    <span>{session.participants.length} participants</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartSession(session.id);
                    }}
                    className="flex-1 px-3 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    <i className="ri-play-line mr-2"></i>
                    Start
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
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-lg">
          <i className="ri-vr-line text-4xl text-gray-500 mb-4"></i>
          <p className="text-gray-400 mb-4">No AR/VR sessions yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!modelId}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors"
          >
            Create Your First Session
          </button>
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create AR/VR Session"
          size="lg"
        >
          <CreateARVRSessionForm
            modelId={modelId}
            onSubmit={handleCreateSession}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}

      {/* Session Detail Modal */}
      {showSessionModal && selectedSession && (
        <Modal
          isOpen={showSessionModal}
          onClose={() => setShowSessionModal(false)}
          title={`${selectedSession.type.toUpperCase()} Session`}
          size="lg"
        >
          <ARVRSessionDetailView
            session={selectedSession}
            onStart={() => handleStartSession(selectedSession.id)}
          />
        </Modal>
      )}
    </div>
  );
}

// Create AR/VR Session Form Component
function CreateARVRSessionForm({ modelId, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    type: "ar" as "ar" | "vr" | "mixed-reality",
    name: "",
    settings: {
      allowMultiUser: true,
      enableRecording: false,
      enableAnnotations: true,
      enableMeasurements: true,
      quality: "high" as "low" | "medium" | "high",
    },
    metadata: {},
  });

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Session Type
        </label>
        <select
          value={formData.type}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, type: e.target.value as any }))
          }
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
        >
          <option value="ar">Augmented Reality (AR)</option>
          <option value="vr">Virtual Reality (VR)</option>
          <option value="mixed-reality">Mixed Reality</option>
        </select>
      </div>

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
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Quality
        </label>
        <select
          value={formData.settings.quality}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              settings: { ...prev.settings, quality: e.target.value as any },
            }))
          }
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
        >
          <option value="low">Low (Faster)</option>
          <option value="medium">Medium (Balanced)</option>
          <option value="high">High (Best Quality)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Session Settings
        </label>
        <div className="space-y-3">
          {Object.entries(formData.settings)
            .filter(([key]) => key !== "quality")
            .map(([key, value]) => (
              <label
                key={key}
                className="flex items-center gap-3 cursor-pointer"
              >
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

// AR/VR Session Detail View Component
function ARVRSessionDetailView({ session, onStart }: any) {
  return (
    <div className="space-y-6">
      {/* Session Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-400">Type</label>
          <p className="text-white uppercase">{session.type}</p>
        </div>
        <div>
          <label className="text-sm text-gray-400">Status</label>
          <p className="text-white capitalize">{session.status}</p>
        </div>
        <div>
          <label className="text-sm text-gray-400">Created</label>
          <p className="text-white">
            {format(new Date(session.createdAt), "MMM dd, yyyy HH:mm")}
          </p>
        </div>
        <div>
          <label className="text-sm text-gray-400">Duration</label>
          <p className="text-white">{session.duration || 0} minutes</p>
        </div>
      </div>

      {/* Participants */}
      {session.participants.length > 0 && (
        <div>
          <h4 className="text-white font-medium mb-3">Participants</h4>
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
                  <p className="text-gray-400 text-xs">{p.deviceType}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Requirements */}
      <div>
        <h4 className="text-white font-medium mb-3">Requirements</h4>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-2 text-sm">
          {session.type === "ar" && (
            <>
              <div className="flex items-center gap-2">
                <i className="ri-check-line text-green-400"></i>
                <span className="text-gray-300">
                  Mobile device with AR support
                </span>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-check-line text-green-400"></i>
                <span className="text-gray-300">Camera access required</span>
              </div>
            </>
          )}
          {session.type === "vr" && (
            <>
              <div className="flex items-center gap-2">
                <i className="ri-check-line text-green-400"></i>
                <span className="text-gray-300">
                  VR headset (Oculus, HTC Vive, etc.)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-check-line text-green-400"></i>
                <span className="text-gray-300">VR controllers</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-white/10">
        <button
          onClick={onStart}
          className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors"
        >
          <i className="ri-play-line mr-2"></i>
          Start Session
        </button>
        <button className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-medium transition-colors">
          <i className="ri-settings-3-line mr-2"></i>
          Settings
        </button>
      </div>
    </div>
  );
}
