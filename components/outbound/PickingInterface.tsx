"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getPickTasksAction,
  completePickTaskAction,
} from "@/app/actions/wms/outboundActions";
import { useAuth } from "@/contexts/AuthContext";
import type { PickTask } from "@prisma/client";

// Simple helper types if PickTask doesn't export nicely or has relations
type PickTaskWithRelations = PickTask & { shipment?: any };

export default function PickingInterface() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<PickTaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<PickTaskWithRelations | null>(
    null,
  );

  const [scanBin, setScanBin] = useState("");
  const [confirmQty, setConfirmQty] = useState(0);
  const [step, setStep] = useState<"LIST" | "SCAN_BIN" | "CONFIRM_QTY">("LIST");

  // Load Tasks
  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    setLoading(true);
    const res = await getPickTasksAction(user?.tenantId || "tenant-1");
    if (res.success && res.data) {
      setTasks(res.data);
    }
    setLoading(false);
  }

  const startTask = (task: PickTaskWithRelations) => {
    setActiveTask(task);
    setScanBin("");
    setConfirmQty(task.quantity);
    setStep("SCAN_BIN");
  };

  const handleBinScan = (e: React.FormEvent) => {
    e.preventDefault();
    // Verify Bin
    if (
      activeTask &&
      scanBin.trim().toUpperCase() === activeTask.fromBinId.toUpperCase()
    ) {
      setStep("CONFIRM_QTY");
    } else {
      alert(`Invalid Bin! Go to ${activeTask?.fromBinId}`);
    }
  };

  const handleConfirmPick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;

    if (confirmQty > activeTask.quantity) {
      alert("Cannot pick more than requested!");
      return;
    }

    setLoading(true);
    const res = await completePickTaskAction(
      activeTask.id,
      confirmQty,
      user?.id || "picker-1",
    );
    if (res.success) {
      // Success
      setActiveTask(null);
      setStep("LIST");
      loadTasks(); // Refresh
    } else {
      alert("Error: " + res.error);
      setLoading(false);
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">Loading Pick Tasks...</div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 max-w-md mx-auto relative">
      {/* Header */}
      <header className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-xl font-bold">Picking</h1>
          <p className="text-xs text-gray-400">
            Time: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs font-mono">
          {tasks.length} Tasks
        </div>
      </header>

      {/* VIEW: TASK LIST */}
      {step === "LIST" && (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <i className="ri-check-double-line text-4xl mb-2 block"></i>
              All caught up! No tasks.
            </div>
          ) : (
            tasks.map((task) => (
              <motion.div
                key={task.id}
                layoutId={task.id}
                onClick={() => startTask(task)}
                className="bg-[#1f2937] border border-gray-700 p-4 rounded-xl active:bg-gray-700 cursor-pointer shadow-sm relative overflow-hidden"
              >
                {task.priority === "HIGH" && (
                  <div className="absolute top-0 right-0 p-1 bg-red-500 md:rounded-bl-lg"></div>
                )}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-mono text-cyan-400 font-bold text-lg">
                      {task.fromBinId}
                    </h3>
                    <p className="text-xs text-gray-400">Source Bin</p>
                  </div>
                  <div className="text-right">
                    <h3 className="font-mono text-white font-bold text-lg">
                      {task.quantity} EA
                    </h3>
                    <p className="text-xs text-gray-400">Qty</p>
                  </div>
                </div>
                <div className="bg-black/30 p-2 rounded flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center text-xs">
                    IMG
                  </div>
                  <div>
                    <p className="text-sm font-medium">{task.sku}</p>
                    <p className="text-xs text-gray-400 truncate w-40">
                      Item Description...
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* VIEW: SCAN BIN */}
      {step === "SCAN_BIN" && activeTask && (
        <div className="flex flex-col h-[80vh]">
          <button
            onClick={() => setStep("LIST")}
            className="mb-4 text-gray-400 flex items-center gap-2"
          >
            <i className="ri-arrow-left-line"></i> Back to List
          </button>

          <div className="bg-[#1f2937] p-6 rounded-2xl border border-gray-700 flex-1 flex flex-col items-center justify-center text-center">
            <h2 className="text-gray-400 text-sm mb-2">Go to Bin</h2>
            <h1 className="text-5xl font-mono font-bold text-cyan-400 mb-8">
              {activeTask.fromBinId}
            </h1>

            <p className="text-white mb-6 bg-blue-600/20 px-4 py-2 rounded-lg">
              Item: <span className="font-bold">{activeTask.sku}</span>
            </p>

            <form onSubmit={handleBinScan} className="w-full">
              <input
                autoFocus
                type="text"
                value={scanBin}
                onChange={(e) => setScanBin(e.target.value)}
                placeholder="Scan Bin Barcode"
                className="w-full bg-black border-2 border-cyan-500/50 rounded-xl px-4 py-4 text-center text-2xl font-mono text-white focus:outline-none focus:border-cyan-400"
              />
              <p className="text-xs text-gray-500 mt-4">
                Simulate: Type "{activeTask.fromBinId}"
              </p>
            </form>
          </div>
        </div>
      )}

      {/* VIEW: CONFIRM QTY */}
      {step === "CONFIRM_QTY" && activeTask && (
        <div className="flex flex-col h-[80vh]">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-green-400 flex items-center gap-2">
              <i className="ri-checkbox-circle-line"></i> Bin Verified
            </h1>
            <p className="text-gray-400">Pick {activeTask.sku}</p>
          </div>

          <div className="bg-[#1f2937] p-6 rounded-2xl border border-gray-700 flex-1">
            <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
              <span className="text-gray-400">Required</span>
              <span className="text-3xl font-bold">{activeTask.quantity}</span>
            </div>

            <form onSubmit={handleConfirmPick} className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Confirm Quantity
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setConfirmQty((q) => Math.max(0, q - 1))}
                    className="w-12 h-12 bg-gray-700 rounded-lg text-xl font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={confirmQty}
                    onChange={(e) => setConfirmQty(Number(e.target.value))}
                    className="flex-1 bg-black border border-gray-600 rounded-lg px-4 py-3 text-center text-2xl font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setConfirmQty((q) => q + 1)}
                    className="w-12 h-12 bg-gray-700 rounded-lg text-xl font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl text-lg font-bold shadow-lg shadow-green-900/20"
              >
                {loading ? "Confirming..." : "Confirm & Complete"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
