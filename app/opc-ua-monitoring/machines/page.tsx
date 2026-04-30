/**
 * OPC UA Machines Management
 * Register and configure machines for monitoring
 */

"use client";

import { useState, useEffect } from "react";
import { RiServerLine, RiAddLine, RiSettingsLine } from "react-icons/ri";

interface Machine {
  id: string;
  name: string;
  machineType: string;
  manufacturer: string;
  model: string;
  status: "online" | "offline" | "error";
  opcuaEndpoint: string;
}

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadMachines();
  }, []);

  async function loadMachines() {
    try {
      const response = await fetch("/api/opc-ua-monitoring/machines", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setMachines(data);
      }
    } catch (error) {
      console.error("Error loading machines:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Machines</h1>
            <p className="text-gray-400">Register and manage OPC UA machines</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-500/20 text-cyan-400 border border-cyan-400/50 rounded-xl hover:bg-cyan-500/30 transition-colors"
          >
            <RiAddLine /> Register Machine
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Register New Machine</h2>
            <p className="text-gray-400 mb-4">
              Machine registration form coming soon...
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {machines.map((machine) => (
            <div
              key={machine.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <RiServerLine className="text-cyan-400 text-2xl" />
                  <div>
                    <h3 className="text-lg font-semibold">{machine.name}</h3>
                    <p className="text-sm text-gray-400">
                      {machine.manufacturer} {machine.model}
                    </p>
                  </div>
                </div>
                <button className="p-2 hover:bg-white/5 rounded-lg">
                  <RiSettingsLine className="text-gray-400" />
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Type</span>
                  <span className="text-white">{machine.machineType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Status</span>
                  <span
                    className={`px-2 py-1 rounded ${
                      machine.status === "online"
                        ? "bg-green-500/20 text-green-400"
                        : machine.status === "offline"
                          ? "bg-gray-500/20 text-gray-400"
                          : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {machine.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Endpoint</span>
                  <span className="text-white font-mono text-xs">
                    {machine.opcuaEndpoint}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {machines.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              No machines registered. Click "Register Machine" to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
