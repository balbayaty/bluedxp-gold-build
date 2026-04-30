/**
 * Security & Intelligence Panel
 *
 * Displays location abnormalities, theft avoidance metrics, and WhatsApp interaction.
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  MapPin,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Lock,
  Eye,
  Smartphone,
  Truck,
  Activity,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Shipment } from "@/types/tms";

interface SecurityIntelligencePanelProps {
  shipment: Shipment;
}

export default function SecurityIntelligencePanel({
  shipment,
}: SecurityIntelligencePanelProps) {
  const [abnormalities, setAbnormalities] = useState<any[]>([]);
  const [isPinging, setIsPinging] = useState(false);
  const [lastPingStatus, setLastPingStatus] = useState<
    "success" | "error" | null
  >(null);

  // Mock abnormalities for demo if none exist
  useEffect(() => {
    if (shipment.status === "IN_TRANSIT") {
      setAbnormalities([
        {
          id: "ABN-001",
          type: "COORDINATE_MISMATCH",
          severity: "HIGH",
          description: "Vehicle GPS is 840m away from Driver Phone location",
          timestamp: new Date().toISOString(),
          details: {
            vehicleLat: 24.7136,
            vehicleLng: 46.6753,
            driverLat: 24.72,
            driverLng: 46.68,
            delta: 840,
          },
        },
      ]);
    }
  }, [shipment]);

  const handleWhatsAppPing = async () => {
    setIsPinging(true);
    // Simulate WhatsApp API call
    setTimeout(() => {
      setIsPinging(false);
      setLastPingStatus("success");
      setTimeout(() => setLastPingStatus(null), 3000);
    }, 1500);
  };

  const driverPhone = (shipment as any).driverPhoneNumber || "+966 5X XXX XXXX";

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* --- LEFT: ABNORMALITY FEED --- */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        <Card className="bg-[#0a0e1a]/80 border-white/5 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <CardTitle className="text-xl">
                Theft Avoidance & Abnormality Engine
              </CardTitle>
            </div>
            <Badge
              variant="outline"
              className="border-red-500/20 text-red-400 animate-pulse"
            >
              REAL-TIME MONITORING ACTIVE
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {abnormalities.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto opacity-20" />
                <p className="text-white/40">
                  No security abnormalities detected for this shipment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {abnormalities.map((abn) => (
                  <motion.div
                    key={abn.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex items-start justify-between group"
                  >
                    <div className="flex gap-4">
                      <div className="p-3 rounded-lg bg-red-500/10 text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {abn.description}
                          </span>
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
                            {abn.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-white/40">
                          Mismatch detected between Daleel (Government GPS) and
                          Driver Device.
                        </p>
                        <div className="pt-2 flex gap-4 text-[10px] font-mono">
                          <span className="text-blue-400">
                            GPS: {abn.details.vehicleLat.toFixed(4)},{" "}
                            {abn.details.vehicleLng.toFixed(4)}
                          </span>
                          <span className="text-purple-400">
                            PHONE: {abn.details.driverLat.toFixed(4)},{" "}
                            {abn.details.driverLng.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold uppercase rounded-lg transition">
                      INVESTIGATE
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SPATIAL COMPARISON VIEW (Placeholder for Map) */}
        <Card className="bg-[#0a0e1a]/80 border-white/5 overflow-hidden h-[400px]">
          <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/46.6753,24.7136,12/800x400?access_token=TOKEN_STUB')] bg-cover opacity-20 grayscale" />
          <div className="relative h-full flex items-center justify-center p-10 text-center">
            <div className="space-y-4">
              <div className="flex justify-center gap-10">
                <div className="relative">
                  <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
                  <Truck className="w-10 h-10 text-blue-400 relative z-10" />
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-blue-400 font-bold whitespace-nowrap">
                    WASL GPS
                  </span>
                </div>
                <div className="w-32 h-[2px] bg-gradient-to-r from-blue-400 to-purple-400 self-center opacity-30 border-dashed border" />
                <div className="relative">
                  <div className="absolute -inset-4 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
                  <Smartphone className="w-10 h-10 text-purple-400 relative z-10" />
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-purple-400 font-bold whitespace-nowrap">
                    DRIVER DEVICE
                  </span>
                </div>
              </div>
              <p className="pt-8 text-sm text-white/60 max-w-sm mx-auto">
                Comparing live telemetry from{" "}
                <span className="text-blue-400 font-bold">
                  Wasl (Government Hub)
                </span>{" "}
                and encrypted{" "}
                <span className="text-purple-400 font-bold">
                  WhatsApp Signal
                </span>{" "}
                to ensure cargo integrity.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* --- RIGHT: INTERACTION HUB --- */}
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <Card className="bg-[#0a0e1a]/80 border-white/5 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              WhatsApp Command Center
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-xl bg-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                  Driver Info
                </span>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                  ONLINE
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-xs font-bold">
                  MA
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Mohammed Al-Qahtani
                  </h4>
                  <p className="text-xs text-white/40">{driverPhone}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleWhatsAppPing}
                disabled={isPinging}
                className="w-full py-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {isPinging ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      ease: "linear",
                    }}
                  >
                    <Activity className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <MessageSquare className="w-5 h-5" />
                )}
                {isPinging ? "PINGING..." : "PING DRIVER VIA WHATSAPP"}
              </button>

              <AnimatePresence>
                {lastPingStatus === "success" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs text-center font-medium"
                  >
                    WhatsApp ping sent successfully!
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-2">
                <button className="py-2.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase rounded-lg transition border border-white/5">
                  Request Location
                </button>
                <button className="py-2.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase rounded-lg transition border border-white/5">
                  Verify Cargo
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-3">
              <h5 className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                Intelligent Automation
              </h5>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition cursor-pointer">
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3 text-blue-400" />
                  <span className="text-xs text-white/80">
                    Auto-Ping on Deviation
                  </span>
                </div>
                <div className="w-8 h-4 bg-blue-600 rounded-full relative">
                  <div className="absolute right-1 top-1 w-2 h-2 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ANALYTICS PREDICTION */}
        <Card className="bg-[#0a0e1a]/80 border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-white/60 uppercase">
              Theft Risk Probability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-emerald-400">2.4%</span>
              <span className="text-xs text-white/40 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> -0.8% from avg
              </span>
            </div>
            <Progress
              value={2.4}
              className="h-1 bg-white/5"
              indicatorClassName="bg-emerald-400"
            />
            <p className="text-[10px] text-white/30 leading-relaxed">
              Based on historical corridor data, driver reputation, and live
              abnormality analysis.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
