"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useInView } from "framer-motion";
import VideoRecordingGuide from "./VideoRecordingGuide";

interface ProcessStep {
  id: string;
  name: string;
  type: "start" | "process" | "decision" | "end" | "delay" | "error";
  position: { x: number; y: number };
  connections: string[];
  duration?: number;
  status?: "pending" | "active" | "completed" | "error";
}

interface WorkflowPath {
  id: string;
  from: string;
  to: string;
  label?: string;
  color: string;
  animated: boolean;
}

export default function AnimatedWorkflowVideo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedView, setSelectedView] = useState<
    "process-mining" | "route-optimization" | "root-cause"
  >("process-mining");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });

  // Process Mining Workflow
  const processSteps: ProcessStep[] = [
    {
      id: "start",
      name: "Order Received",
      type: "start",
      position: { x: 10, y: 10 },
      connections: ["validate"],
      status: "completed",
    },
    {
      id: "validate",
      name: "Validate Order",
      type: "process",
      position: { x: 30, y: 10 },
      connections: ["check-stock"],
      duration: 2,
      status: "completed",
    },
    {
      id: "check-stock",
      name: "Check Inventory",
      type: "decision",
      position: { x: 50, y: 10 },
      connections: ["allocate", "reorder"],
      status: "active",
    },
    {
      id: "allocate",
      name: "Allocate Stock",
      type: "process",
      position: { x: 70, y: 5 },
      connections: ["pick"],
      duration: 3,
      status: "pending",
    },
    {
      id: "reorder",
      name: "Create PO",
      type: "process",
      position: { x: 70, y: 15 },
      connections: ["wait"],
      duration: 5,
      status: "pending",
    },
    {
      id: "wait",
      name: "Wait for Stock",
      type: "delay",
      position: { x: 85, y: 15 },
      connections: ["allocate"],
      duration: 10,
      status: "pending",
    },
    {
      id: "pick",
      name: "Picking",
      type: "process",
      position: { x: 50, y: 5 },
      connections: ["pack"],
      duration: 8,
      status: "pending",
    },
    {
      id: "pack",
      name: "Packing",
      type: "process",
      position: { x: 30, y: 5 },
      connections: ["ship"],
      duration: 4,
      status: "pending",
    },
    {
      id: "ship",
      name: "Shipping",
      type: "process",
      position: { x: 10, y: 5 },
      connections: ["end"],
      duration: 6,
      status: "pending",
    },
    {
      id: "end",
      name: "Delivered",
      type: "end",
      position: { x: 10, y: 0 },
      connections: [],
      status: "pending",
    },
  ];

  // Route Optimization Visualization
  const routeNodes = [
    {
      id: "warehouse",
      name: "Warehouse",
      position: { x: 50, y: 50 },
      type: "warehouse",
    },
    {
      id: "customer1",
      name: "Customer A",
      position: { x: 20, y: 20 },
      type: "customer",
    },
    {
      id: "customer2",
      name: "Customer B",
      position: { x: 80, y: 30 },
      type: "customer",
    },
    {
      id: "customer3",
      name: "Customer C",
      position: { x: 30, y: 80 },
      type: "customer",
    },
    {
      id: "customer4",
      name: "Customer D",
      position: { x: 70, y: 70 },
      type: "customer",
    },
  ];

  const routes = [
    {
      from: "warehouse",
      to: "customer1",
      optimized: true,
      distance: 25,
      time: 35,
    },
    {
      from: "customer1",
      to: "customer2",
      optimized: true,
      distance: 45,
      time: 55,
    },
    {
      from: "customer2",
      to: "customer3",
      optimized: true,
      distance: 40,
      time: 50,
    },
    {
      from: "customer3",
      to: "customer4",
      optimized: false,
      distance: 50,
      time: 65,
    },
    {
      from: "customer4",
      to: "warehouse",
      optimized: true,
      distance: 30,
      time: 40,
    },
  ];

  // Root Cause Analysis Tree
  const rootCauseTree = {
    problem: "Order Delayed",
    causes: [
      {
        id: "c1",
        name: "Inventory Shortage",
        level: 1,
        children: [
          { id: "c1-1", name: "Low Reorder Point", level: 2 },
          { id: "c1-2", name: "Supplier Delay", level: 2 },
        ],
      },
      {
        id: "c2",
        name: "Picking Inefficiency",
        level: 1,
        children: [
          { id: "c2-1", name: "Poor Layout", level: 2 },
          { id: "c2-2", name: "Staff Training", level: 2 },
        ],
      },
      {
        id: "c3",
        name: "System Issues",
        level: 1,
        children: [
          { id: "c3-1", name: "API Timeout", level: 2 },
          { id: "c3-2", name: "Database Slow", level: 2 },
        ],
      },
    ],
  };

  // Animation controls
  useEffect(() => {
    if (isPlaying && isInView) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (selectedView === "process-mining") {
            return prev < processSteps.length - 1 ? prev + 1 : 0;
          }
          return prev;
        });
      }, 2000 / playbackSpeed);

      return () => clearInterval(interval);
    }
  }, [isPlaying, playbackSpeed, selectedView, isInView]);

  // Video Recording Functions
  const startRecording = async () => {
    try {
      if (!containerRef.current) return;

      // Get the stream from the canvas/container
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: "screen",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      });

      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setShowVideoPlayer(true);
        setIsRecording(false);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setIsPlaying(true); // Auto-play when recording starts
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Recording failed. Please allow screen sharing permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPlaying(false);
    }
  };

  const downloadVideo = () => {
    if (recordedVideoUrl) {
      const a = document.createElement("a");
      a.href = recordedVideoUrl;
      a.download = `workflow-animation-${selectedView}-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const getStepColor = (type: string, status?: string) => {
    if (status === "error") return "#ef4444";
    if (status === "active") return "#06b6d4";
    if (status === "completed") return "#10b981";

    switch (type) {
      case "start":
        return "#10b981";
      case "end":
        return "#8b5cf6";
      case "decision":
        return "#f59e0b";
      case "delay":
        return "#ef4444";
      case "error":
        return "#ef4444";
      default:
        return "#06b6d4";
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case "start":
        return "ri-play-circle-line";
      case "end":
        return "ri-checkbox-circle-line";
      case "decision":
        return "ri-question-line";
      case "delay":
        return "ri-time-line";
      case "error":
        return "ri-error-warning-line";
      default:
        return "ri-settings-3-line";
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen py-20 px-6 bg-black"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Animated Workflow Visualization
            </span>
          </h2>
          <p className="text-xl text-[#9ca3af]">
            Process Mining • Route Optimization • Root Cause Analysis
          </p>
        </motion.div>

        {/* Recording Guide */}
        <VideoRecordingGuide />

        {/* View Selector */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[
            {
              id: "process-mining",
              label: "Process Mining",
              icon: "ri-flow-chart",
            },
            {
              id: "route-optimization",
              label: "Route Optimization",
              icon: "ri-route-line",
            },
            {
              id: "root-cause",
              label: "Root Cause Analysis",
              icon: "ri-search-line",
            },
          ].map((view) => (
            <motion.button
              key={view.id}
              onClick={() => {
                setSelectedView(view.id as any);
                setCurrentStep(0);
                setIsPlaying(false);
              }}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                selectedView === view.id
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/50"
                  : "bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white border border-white/10"
              }`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <i className={`${view.icon} text-lg`}></i>
              <span>{view.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
          <motion.button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-cyan-500/50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <i
              className={`${isPlaying ? "ri-pause-line" : "ri-play-line"} text-2xl`}
            ></i>
          </motion.button>
          <button
            onClick={() => setCurrentStep(0)}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white"
          >
            <i className="ri-restart-line"></i>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#9ca3af]">Speed:</span>
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </div>

          {/* Recording Controls */}
          {!isRecording ? (
            <motion.button
              onClick={startRecording}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-white flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <i className="ri-record-circle-line text-red-400"></i>
              <span>Record Video</span>
            </motion.button>
          ) : (
            <motion.button
              onClick={stopRecording}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white flex items-center gap-2 animate-pulse"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <i className="ri-stop-circle-line"></i>
              <span>Stop Recording</span>
            </motion.button>
          )}

          {recordedVideoUrl && (
            <>
              <button
                onClick={downloadVideo}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-white flex items-center gap-2"
              >
                <i className="ri-download-line text-green-400"></i>
                <span>Download</span>
              </button>
              <button
                onClick={() => setShowVideoPlayer(!showVideoPlayer)}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-white flex items-center gap-2"
              >
                <i className="ri-play-circle-line text-blue-400"></i>
                <span>Play Video</span>
              </button>
            </>
          )}
        </div>

        {/* Recorded Video Player */}
        {showVideoPlayer && recordedVideoUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                Recorded Video
              </h3>
              <button
                onClick={() => setShowVideoPlayer(false)}
                className="text-[#9ca3af] hover:text-white"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <video
              ref={videoRef}
              src={recordedVideoUrl}
              controls
              className="w-full rounded-lg"
              style={{ maxHeight: "500px" }}
            />
            <div className="mt-4 text-sm text-[#9ca3af]">
              <p>
                ✅ Video recorded successfully! You can download it or add it to
                the video showcase.
              </p>
              <p className="mt-2">
                💡 To use this video in the showcase, save it to{" "}
                <code className="bg-white/10 px-2 py-1 rounded text-cyan-400">
                  public/videos/
                </code>{" "}
                and update the video config.
              </p>
            </div>
          </motion.div>
        )}

        {/* Process Mining Visualization */}
        {selectedView === "process-mining" && (
          <div className="relative h-[600px] bg-gradient-to-br from-[#0a0a0a] to-black border border-white/10 rounded-2xl overflow-hidden">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 20"
            >
              {/* Background Grid */}
              <defs>
                <pattern
                  id="grid"
                  width="5"
                  height="5"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 5 0 L 0 0 0 5"
                    fill="none"
                    stroke="rgba(6, 182, 212, 0.1)"
                    strokeWidth="0.5"
                  />
                </pattern>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#06b6d4" />
                </marker>
              </defs>
              <rect width="100" height="20" fill="url(#grid)" />

              {/* Connections */}
              {processSteps.map((step) =>
                step.connections.map((connId, idx) => {
                  const toStep = processSteps.find((s) => s.id === connId);
                  if (!toStep) return null;

                  const fromX = step.position.x;
                  const fromY = step.position.y;
                  const toX = toStep.position.x;
                  const toY = toStep.position.y;

                  return (
                    <motion.line
                      key={`${step.id}-${connId}-${idx}`}
                      x1={fromX}
                      y1={fromY}
                      x2={toX}
                      y2={toY}
                      stroke="#06b6d4"
                      strokeWidth="0.3"
                      strokeDasharray="1,1"
                      markerEnd="url(#arrowhead)"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{
                        pathLength:
                          processSteps.indexOf(step) <= currentStep ? 1 : 0,
                        opacity:
                          processSteps.indexOf(step) <= currentStep ? 0.6 : 0,
                      }}
                      transition={{ duration: 1 }}
                    />
                  );
                }),
              )}

              {/* Animated Flow Particles */}
              {processSteps.map((step) =>
                step.connections.map((connId, idx) => {
                  const toStep = processSteps.find((s) => s.id === connId);
                  if (!toStep) return null;

                  const fromX = step.position.x;
                  const fromY = step.position.y;
                  const toX = toStep.position.x;
                  const toY = toStep.position.y;
                  const stepIndex = processSteps.indexOf(step);

                  return (
                    <motion.circle
                      key={`particle-${step.id}-${connId}-${idx}`}
                      r="0.5"
                      fill="#06b6d4"
                      initial={{ cx: fromX, cy: fromY, opacity: 0 }}
                      animate={{
                        cx: [fromX, toX],
                        cy: [fromY, toY],
                        opacity:
                          stepIndex <= currentStep && isPlaying
                            ? [0, 1, 1, 0]
                            : 0,
                      }}
                      transition={{
                        duration: 2 / playbackSpeed,
                        repeat:
                          isPlaying && stepIndex <= currentStep ? Infinity : 0,
                        ease: "linear",
                        delay: stepIndex * 0.5,
                      }}
                    />
                  );
                }),
              )}

              {/* Process Steps */}
              {processSteps.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const color = getStepColor(step.type, step.status);

                return (
                  <g key={step.id}>
                    <motion.circle
                      cx={step.position.x}
                      cy={step.position.y}
                      r={isActive ? 2.5 : 2}
                      fill={color}
                      stroke={isActive ? "#fff" : "transparent"}
                      strokeWidth="0.3"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: isActive ? [1, 1.2, 1] : 1,
                        opacity: 1,
                      }}
                      transition={{
                        scale: {
                          duration: 0.5,
                          repeat: isActive ? Infinity : 0,
                        },
                      }}
                    />
                    <motion.text
                      x={step.position.x}
                      y={step.position.y - 3}
                      textAnchor="middle"
                      fill="white"
                      fontSize="1.2"
                      fontWeight="bold"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {step.name}
                    </motion.text>
                    {step.duration && (
                      <motion.text
                        x={step.position.x}
                        y={step.position.y + 3.5}
                        textAnchor="middle"
                        fill="#9ca3af"
                        fontSize="0.8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                      >
                        {step.duration}s
                      </motion.text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* Route Optimization Visualization */}
        {selectedView === "route-optimization" && (
          <div className="relative h-[600px] bg-gradient-to-br from-[#0a0a0a] to-black border border-white/10 rounded-2xl overflow-hidden p-8">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
            >
              {/* Routes */}
              {routes.map((route, idx) => {
                const fromNode = routeNodes.find((n) => n.id === route.from);
                const toNode = routeNodes.find((n) => n.id === route.to);
                if (!fromNode || !toNode) return null;

                return (
                  <g key={`route-${idx}`}>
                    <motion.line
                      x1={fromNode.position.x}
                      y1={fromNode.position.y}
                      x2={toNode.position.x}
                      y2={toNode.position.y}
                      stroke={route.optimized ? "#10b981" : "#ef4444"}
                      strokeWidth="0.5"
                      strokeDasharray={route.optimized ? "0" : "2,2"}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.6 }}
                      transition={{ duration: 1, delay: idx * 0.2 }}
                    />
                    {/* Animated vehicle */}
                    <motion.circle
                      r="1"
                      fill={route.optimized ? "#10b981" : "#ef4444"}
                      initial={{
                        cx: fromNode.position.x,
                        cy: fromNode.position.y,
                        opacity: 0,
                      }}
                      animate={{
                        cx: [fromNode.position.x, toNode.position.x],
                        cy: [fromNode.position.y, toNode.position.y],
                        opacity: isPlaying ? [0, 1, 1, 0] : 0,
                      }}
                      transition={{
                        duration: route.time / 10 / playbackSpeed,
                        repeat: isPlaying ? Infinity : 0,
                        ease: "linear",
                        delay: idx * 1,
                      }}
                    />
                  </g>
                );
              })}

              {/* Nodes */}
              {routeNodes.map((node) => (
                <g key={node.id}>
                  <motion.circle
                    cx={node.position.x}
                    cy={node.position.y}
                    r={node.type === "warehouse" ? 3 : 2}
                    fill={node.type === "warehouse" ? "#06b6d4" : "#8b5cf6"}
                    stroke="#fff"
                    strokeWidth="0.3"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 }}
                  />
                  <motion.text
                    x={node.position.x}
                    y={node.position.y - 4}
                    textAnchor="middle"
                    fill="white"
                    fontSize="1.5"
                    fontWeight="bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    {node.name}
                  </motion.text>
                </g>
              ))}
            </svg>

            {/* Route Stats */}
            <div className="absolute bottom-4 left-4 right-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {routes.map((route, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-2 h-2 rounded-full ${route.optimized ? "bg-green-400" : "bg-red-400"}`}
                    ></div>
                    <span className="text-xs text-white font-medium">
                      Route {idx + 1}
                    </span>
                  </div>
                  <div className="text-xs text-[#9ca3af]">
                    {route.distance} km
                  </div>
                  <div className="text-xs text-[#9ca3af]">{route.time} min</div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Root Cause Analysis Tree */}
        {selectedView === "root-cause" && (
          <div className="relative h-[600px] bg-gradient-to-br from-[#0a0a0a] to-black border border-white/10 rounded-2xl overflow-hidden p-8">
            <div className="relative w-full h-full">
              {/* Problem Node */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute top-10 left-1/2 -translate-x-1/2"
              >
                <div className="bg-red-500/20 border-2 border-red-500 rounded-xl px-6 py-4 text-center">
                  <div className="text-xl font-bold text-white mb-1">
                    {rootCauseTree.problem}
                  </div>
                  <div className="text-sm text-red-400">Root Problem</div>
                </div>
              </motion.div>

              {/* Cause Branches */}
              {rootCauseTree.causes.map((cause, idx) => {
                const angle = (idx - 1) * 60 - 90;
                const radius = 30;
                const x = 50 + Math.cos((angle * Math.PI) / 180) * radius;
                const y = 30 + Math.sin((angle * Math.PI) / 180) * radius;

                return (
                  <div
                    key={cause.id}
                    className="absolute"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    {/* Connection Line */}
                    <motion.div
                      className="absolute w-0.5 bg-cyan-400 origin-top"
                      style={{
                        height: "60px",
                        transform: `rotate(${angle}deg)`,
                        transformOrigin: "top center",
                      }}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.5, delay: idx * 0.2 }}
                    />

                    {/* Main Cause */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: idx * 0.3 }}
                      className="bg-yellow-500/20 border-2 border-yellow-500 rounded-lg px-4 py-3 text-center min-w-[150px]"
                    >
                      <div className="text-sm font-bold text-white mb-1">
                        {cause.name}
                      </div>
                      <div className="text-xs text-yellow-400">
                        Level 1 Cause
                      </div>
                    </motion.div>

                    {/* Sub-causes */}
                    {cause.children.map((child, childIdx) => {
                      const childAngle = childIdx === 0 ? -30 : 30;
                      const childRadius = 20;
                      const childX =
                        Math.cos((childAngle * Math.PI) / 180) * childRadius;
                      const childY =
                        50 +
                        Math.sin((childAngle * Math.PI) / 180) * childRadius;

                      return (
                        <motion.div
                          key={child.id}
                          className="absolute"
                          style={{
                            left: `${childX}%`,
                            top: `${childY}%`,
                          }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            delay: idx * 0.3 + childIdx * 0.1 + 0.5,
                          }}
                        >
                          {/* Connection */}
                          <motion.div
                            className="absolute w-0.5 bg-yellow-400 origin-top"
                            style={{
                              height: "40px",
                              transform: `rotate(${childAngle}deg)`,
                              transformOrigin: "top center",
                            }}
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{
                              duration: 0.3,
                              delay: idx * 0.3 + childIdx * 0.1 + 0.3,
                            }}
                          />
                          <div className="bg-orange-500/20 border border-orange-500 rounded-lg px-3 py-2 text-center min-w-[120px] mt-10">
                            <div className="text-xs font-medium text-white">
                              {child.name}
                            </div>
                            <div className="text-xs text-orange-400">
                              Level 2
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats Panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="mt-8 grid md:grid-cols-4 gap-6"
        >
          {[
            {
              label: "Process Steps",
              value: processSteps.length,
              icon: "ri-flow-chart",
              color: "cyan",
            },
            {
              label: "Routes Optimized",
              value: routes.filter((r) => r.optimized).length,
              icon: "ri-route-line",
              color: "green",
            },
            {
              label: "Root Causes",
              value: rootCauseTree.causes.length,
              icon: "ri-search-line",
              color: "yellow",
            },
            {
              label: "Efficiency Gain",
              value: "35%",
              icon: "ri-trending-up-line",
              color: "blue",
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center"
            >
              <i
                className={`${stat.icon} text-3xl text-${stat.color}-400 mb-3`}
              ></i>
              <div className="text-3xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-[#9ca3af]">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
