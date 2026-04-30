/**
 * Accident Investigation Suite
 *
 * Mindblowing, AI-powered accident investigation and root cause analysis tool.
 * Integrates Vision, Telemetry, and Communication data.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Video,
  Map,
  FileText,
  MessageCircle,
  Activity,
  History,
  Scale,
  Camera,
  Layers,
  Zap,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import IncidentReportVisionIntegration from "@/components/vision/IncidentReportVisionIntegration";

export default function AccidentInvestigationSuite() {
  const [activeStage, setActiveStage] = useState<
    "evidence" | "reconstruction" | "analysis" | "legal"
  >("evidence");

  const stages = [
    { id: "evidence", label: "EVIDENCE COLLECTION", icon: Camera },
    { id: "reconstruction", label: "AI RECONSTRUCTION", icon: Layers },
    { id: "analysis", label: "ROOT CAUSE (RCA)", icon: Zap },
    { id: "legal", label: "CHAIN OF CUSTODY", icon: Scale },
  ];

  return (
    <div className="space-y-8">
      {/* --- HERO: INVESTIGATION HUD --- */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0a0e1a] border border-white/10 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-red-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600 rounded-lg">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white uppercase">
                Investigation <span className="text-red-500">ACC-2025-084</span>
              </h2>
            </div>
            <p className="text-white/40 font-mono text-sm uppercase tracking-widest">
              Status: High-Fidelity Deep Dive • Priority: CRITICAL
            </p>
          </div>

          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">
                Confidence Score
              </p>
              <p className="text-2xl font-black text-emerald-400">94.2%</p>
            </div>
            <div className="h-12 w-[1px] bg-white/10" />
            <div className="text-right">
              <p className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">
                Legal Readiness
              </p>
              <p className="text-2xl font-black text-blue-400">IMPECCABLE</p>
            </div>
          </div>
        </div>

        {/* --- STAGE SELECTOR --- */}
        <div className="mt-10 flex flex-wrap gap-2">
          {stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStage(stage.id as any)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl border transition-all duration-300 font-bold text-xs tracking-widest uppercase ${
                  activeStage === stage.id
                    ? "bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                    : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {stage.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="grid grid-cols-12 gap-6">
        {/* --- LEFT: MAIN MODULE --- */}
        <div className="col-span-12 lg:col-span-8">
          <AnimatePresence mode="wait">
            {activeStage === "evidence" && (
              <motion.div
                key="evidence"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Card className="bg-[#0a0e1a]/80 border-white/5 backdrop-blur-xl overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-emerald-400" />
                      Visual & Multi-Channel Evidence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <IncidentReportVisionIntegration
                      onIncidentDetected={(incident) => {
                        console.log("Incident detected:", incident);
                      }}
                      formFields={[
                        {
                          id: "type",
                          name: "type",
                          type: "text",
                          label: "Incident Type",
                        },
                        {
                          id: "severity",
                          name: "severity",
                          type: "select",
                          label: "Severity",
                        },
                        {
                          id: "description",
                          name: "description",
                          type: "textarea",
                          label: "Description",
                        },
                      ]}
                      onFieldFill={(fieldId, value, confidence) => {
                        console.log(
                          `Field ${fieldId} filled with ${value} (confidence: ${confidence}%)`,
                        );
                      }}
                    />
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-6">
                  <Card className="bg-[#0a0e1a]/80 border-white/5">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-blue-400" />
                        WhatsApp Intelligence
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                          <p className="text-[10px] text-white/40 mb-1">
                            Driver Statement (WhatsApp)
                          </p>
                          <p className="text-xs text-white italic">
                            "There was oil on the road near KM 42. I tried to
                            brake but the truck slid into the barrier."
                          </p>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">
                            AI Sentiment Analysis
                          </p>
                          <p className="text-xs text-white/80">
                            Statement shows high stress levels. Factual
                            consistency: 88%.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#0a0e1a]/80 border-white/5">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="w-4 h-4 text-purple-400" />
                        Telemetry Snapshots
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase font-bold">
                          <span className="text-white/40">Speed at Impact</span>
                          <span className="text-white">62 km/h</span>
                        </div>
                        <Progress value={62} className="h-1 bg-white/5" />
                        <div className="flex justify-between text-[10px] uppercase font-bold">
                          <span className="text-white/40">Brake Pressure</span>
                          <span className="text-red-400">95% (Hard)</span>
                        </div>
                        <Progress
                          value={95}
                          className="h-1 bg-white/5"
                          indicatorClassName="bg-red-400"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeStage === "reconstruction" && (
              <motion.div
                key="reconstruction"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="h-[600px] bg-[#0a0e1a]/80 border border-white/5 rounded-3xl relative overflow-hidden flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2000&auto=format&fit=crop')] bg-cover opacity-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] to-transparent" />

                <div className="relative text-center space-y-6 px-12">
                  <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center mx-auto border border-red-500/40 animate-pulse">
                    <Layers className="w-12 h-12 text-red-500" />
                  </div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter">
                    AI 3D Scene Reconstruction
                  </h3>
                  <p className="text-white/40 max-w-lg mx-auto leading-relaxed">
                    Connecting to Digital Twin simulation engine. Syncing LiDAR
                    point clouds, Dashcam footage, and Telemetry to recreate the
                    final 10 seconds of the event.
                  </p>
                  <div className="flex justify-center gap-4 pt-4">
                    <button className="px-8 py-3 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                      LAUNCH SIMULATOR
                    </button>
                    <button className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
                      EXPORT MP4
                    </button>
                  </div>
                </div>

                {/* Reconstruction Stats Overlay */}
                <div className="absolute bottom-10 left-10 flex gap-10 font-mono text-left">
                  <div>
                    <p className="text-[10px] text-white/30 uppercase">
                      Yaw Rate
                    </p>
                    <p className="text-xl font-bold text-red-400">14.2°/s</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase">
                      G-Force
                    </p>
                    <p className="text-xl font-bold text-orange-400">1.8G</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase">
                      Tire Grip
                    </p>
                    <p className="text-xl font-bold text-blue-400">12%</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Other stages would be implemented here */}
          </AnimatePresence>
        </div>

        {/* --- RIGHT: INTELLIGENCE SIDEBAR --- */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card className="bg-[#0a0e1a]/80 border-white/5 border-l-emerald-500/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                Root Cause Verdict
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white font-bold">
                    Environmental Factor
                  </span>
                  <span className="text-xs text-emerald-400 font-bold">
                    PRIMARY (72%)
                  </span>
                </div>
                <Progress
                  value={72}
                  className="h-1.5 bg-white/5"
                  indicatorClassName="bg-emerald-400"
                />
                <p className="text-[10px] text-white/40 leading-relaxed">
                  Oil spill detected via satellite imagery and confirmed by
                  driver WhatsApp report. Local humidity caused loss of
                  traction.
                </p>
              </div>

              <div className="space-y-2 opacity-50">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white font-bold">
                    Mechanical Failure
                  </span>
                  <span className="text-xs text-white/40 font-bold">12%</span>
                </div>
                <Progress value={12} className="h-1.5 bg-white/5" />
              </div>

              <div className="pt-4 border-t border-white/5">
                <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                  <CheckCircle2 className="w-4 h-4" />
                  Approve RCA & Close Case
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0a0e1a]/80 border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-400" />
                Blockchain Chain of Custody
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <CustodyItem
                  label="Initial Incident Log"
                  time="Today, 08:42:10"
                  hash="0x8b22...ff84"
                  status="VERIFIED"
                />
                <CustodyItem
                  label="Visual Evidence Signed"
                  time="Today, 08:45:22"
                  hash="0x1c33...ee21"
                  status="VERIFIED"
                />
                <CustodyItem
                  label="WhatsApp Report Anchored"
                  time="Today, 09:02:15"
                  hash="0x9a44...aa11"
                  status="VERIFIED"
                />
              </div>
              <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/60 text-[10px] font-bold uppercase rounded-lg transition">
                VIEW FULL BLOCKCHAIN LEDGER
              </button>
            </CardContent>
          </Card>

          <Card className="bg-blue-600/10 border-blue-500/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <ExternalLink className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-sm font-bold text-white uppercase">
                  Vision 2040 Compliance
                </h4>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                This investigation follows the{" "}
                <span className="text-blue-400 font-bold">
                  Saudi TGA Incident Investigation Standard v3.2
                </span>
                . All data is automatically synced to the national safety
                portal.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CustodyItem({ label, time, hash, status }: any) {
  return (
    <div className="flex items-start justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
      <div className="space-y-1">
        <p className="text-xs font-bold text-white">{label}</p>
        <p className="text-[10px] text-white/30">{time}</p>
        <p className="text-[9px] font-mono text-blue-400/60">{hash}</p>
      </div>
      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px] h-4">
        {status}
      </Badge>
    </div>
  );
}
