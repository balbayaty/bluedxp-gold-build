/**
 * Live Streaming Analysis Page
 * Real-time video stream analysis with RTSP/HLS/WebRTC support
 */

"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";

export default function LiveStreamingPage() {
  const [streams, setStreams] = useState<any[]>([]);
  const [activeStreams, setActiveStreams] = useState<Set<string>>(new Set());
  const [newStream, setNewStream] = useState({
    name: "",
    url: "",
    type: "rtsp" as "rtsp" | "hls" | "webcam" | "stream",
    location: "",
  });
  const [loading, setLoading] = useState(false);

  const handleAddStream = async () => {
    if (!newStream.url || !newStream.name) return;

    setLoading(true);
    try {
      const response = await fetch("/api/ai/vision/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: {
            name: newStream.name,
            url: newStream.url,
            type: newStream.type,
            location: newStream.location,
          },
          analysisMode: "safety",
          enableObjectTracking: true,
          enableAnomalyDetection: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setStreams([
          ...streams,
          { ...newStream, id: data.streamId, status: "analyzing" },
        ]);
        setActiveStreams(new Set([...activeStreams, data.streamId]));
        setNewStream({ name: "", url: "", type: "rtsp", location: "" });
      }
    } catch (error) {
      console.error("Failed to start stream:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStopStream = async (streamId: string) => {
    try {
      await fetch(`/api/ai/vision/stream?streamId=${streamId}&action=stop`);
      setActiveStreams(
        new Set(Array.from(activeStreams).filter((id) => id !== streamId)),
      );
    } catch (error) {
      console.error("Failed to stop stream:", error);
    }
  };

  useEffect(() => {
    // Poll for stream status
    const interval = setInterval(async () => {
      for (const streamId of Array.from(activeStreams)) {
        try {
          const response = await fetch(
            `/api/ai/vision/stream?streamId=${streamId}&action=analysis`,
          );
          const data = await response.json();
          if (data.success && data.analysis) {
            setStreams((prev) =>
              prev.map((s) =>
                s.id === streamId ? { ...s, analysis: data.analysis } : s,
              ),
            );
          }
        } catch (error) {
          console.error("Failed to fetch stream status:", error);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeStreams]);

  return (
    <PageTemplate
      icon="📹"
      title="Live Stream Analysis"
      description="Real-time video stream analysis with RTSP, HLS, and WebRTC support"
    >
      <div className="space-y-6">
        {/* Add Stream Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Add New Stream</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Stream Name
              </label>
              <input
                type="text"
                value={newStream.name}
                onChange={(e) =>
                  setNewStream({ ...newStream, name: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                placeholder="Camera 1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Stream URL
              </label>
              <input
                type="text"
                value={newStream.url}
                onChange={(e) =>
                  setNewStream({ ...newStream, url: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                placeholder="rtsp://camera.example.com/stream"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Stream Type
              </label>
              <select
                value={newStream.type}
                onChange={(e) =>
                  setNewStream({ ...newStream, type: e.target.value as any })
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="rtsp">RTSP</option>
                <option value="hls">HLS</option>
                <option value="webcam">Webcam</option>
                <option value="stream">Generic Stream</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                value={newStream.location}
                onChange={(e) =>
                  setNewStream({ ...newStream, location: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                placeholder="Warehouse A"
              />
            </div>
          </div>
          <button
            onClick={handleAddStream}
            disabled={loading || !newStream.name || !newStream.url}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Starting..." : "Start Stream Analysis"}
          </button>
        </div>

        {/* Active Streams */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Streams</h3>
          {streams.length === 0 ? (
            <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
              No active streams. Add a stream to begin analysis.
            </div>
          ) : (
            streams.map((stream) => (
              <div key={stream.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold">{stream.name}</h4>
                    <p className="text-sm text-gray-600">{stream.url}</p>
                    <p className="text-sm text-gray-500">{stream.location}</p>
                  </div>
                  <button
                    onClick={() => handleStopStream(stream.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Stop
                  </button>
                </div>
                {stream.analysis && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm">
                      <span className="font-medium">Frames Analyzed:</span>{" "}
                      {stream.analysis.summary?.totalFrames || 0}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Issues Detected:</span>{" "}
                      {stream.analysis.summary?.issuesDetected || 0}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Alerts:</span>{" "}
                      {stream.analysis.summary?.alertsGenerated || 0}
                    </p>
                    {stream.analysis.recentAlerts &&
                      stream.analysis.recentAlerts.length > 0 && (
                        <div className="mt-2">
                          <h5 className="font-medium text-sm mb-1">
                            Recent Alerts:
                          </h5>
                          <ul className="text-sm space-y-1">
                            {stream.analysis.recentAlerts
                              .slice(0, 3)
                              .map((alert: any, idx: number) => (
                                <li key={idx} className="text-red-600">
                                  • {alert.message}
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </PageTemplate>
  );
}
