/**
 * Floor Plan Editor Component
 * Create and edit facility floor plans with zones
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Floor, Zone } from "@/lib/services/facility/facilityMappingService";

interface FloorPlanEditorProps {
  floor: Floor;
  onSave: (floor: Floor) => void;
  onCancel: () => void;
}

export default function FloorPlanEditor({
  floor,
  onSave,
  onCancel,
}: FloorPlanEditorProps) {
  const [editedFloor, setEditedFloor] = useState<Floor>({ ...floor });
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
    null,
  );

  const handleAddZone = () => {
    const newZone: Zone = {
      id: `zone-${Date.now()}`,
      name: `Zone ${editedFloor.zones.length + 1}`,
      type: "storage",
      coordinates: { x: 10, y: 10, width: 50, height: 50 },
      capacity: 10,
      currentOccupancy: 0,
      restrictions: [],
      color: "#3b82f6",
      metadata: {},
    };

    setEditedFloor({
      ...editedFloor,
      zones: [...editedFloor.zones, newZone],
    });
    setSelectedZone(newZone);
  };

  const handleDeleteZone = (zoneId: string) => {
    setEditedFloor({
      ...editedFloor,
      zones: editedFloor.zones.filter((z) => z.id !== zoneId),
    });
    if (selectedZone?.id === zoneId) {
      setSelectedZone(null);
    }
  };

  const handleZoneChange = (zoneId: string, updates: Partial<Zone>) => {
    setEditedFloor({
      ...editedFloor,
      zones: editedFloor.zones.map((z) =>
        z.id === zoneId ? { ...z, ...updates } : z,
      ),
    });
    if (selectedZone?.id === zoneId) {
      setSelectedZone({ ...selectedZone, ...updates });
    }
  };

  const zoneTypes = [
    { value: "storage", label: "Storage", color: "#3b82f6" },
    { value: "hazardous", label: "Hazardous", color: "#ef4444" },
    { value: "incompatible", label: "Incompatible", color: "#f59e0b" },
    {
      value: "temperature_controlled",
      label: "Temperature Controlled",
      color: "#8b5cf6",
    },
    { value: "ventilated", label: "Ventilated", color: "#10b981" },
  ];

  return (
    <div className="space-y-6">
      {/* Floor Info */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-white">
          Floor Information
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Floor Name
            </label>
            <input
              type="text"
              value={editedFloor.name}
              onChange={(e) =>
                setEditedFloor({ ...editedFloor, name: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-cyan-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Dimensions (meters)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={editedFloor.width}
                onChange={(e) =>
                  setEditedFloor({
                    ...editedFloor,
                    width: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="Width"
                className="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-cyan-500 outline-none"
              />
              <input
                type="number"
                value={editedFloor.height}
                onChange={(e) =>
                  setEditedFloor({
                    ...editedFloor,
                    height: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="Height"
                className="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-cyan-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Zones */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Zones</h3>
          <button
            onClick={handleAddZone}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition flex items-center gap-2"
          >
            <i className="ri-add-line"></i>
            Add Zone
          </button>
        </div>

        <div className="space-y-4">
          {editedFloor.zones.map((zone) => (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border ${
                selectedZone?.id === zone.id
                  ? "bg-cyan-900/20 border-cyan-500/30"
                  : "bg-gray-700 border-gray-600"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={zone.name}
                    onChange={(e) =>
                      handleZoneChange(zone.id, { name: e.target.value })
                    }
                    className="text-lg font-semibold text-white bg-transparent border-b border-gray-600 focus:border-cyan-500 outline-none mb-2"
                  />
                  <div className="flex items-center gap-2">
                    {zoneTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() =>
                          handleZoneChange(zone.id, {
                            type: type.value as any,
                            color: type.color,
                          })
                        }
                        className={`px-3 py-1 rounded text-xs transition ${
                          zone.type === type.value
                            ? "bg-cyan-500 text-white"
                            : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteZone(zone.id)}
                  className="text-red-400 hover:text-red-300 transition"
                >
                  <i className="ri-delete-bin-line text-xl"></i>
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Position (x, y)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={zone.coordinates.x}
                      onChange={(e) =>
                        handleZoneChange(zone.id, {
                          coordinates: {
                            ...zone.coordinates,
                            x: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-600 border border-gray-500 text-white text-sm focus:border-cyan-500 outline-none"
                    />
                    <input
                      type="number"
                      value={zone.coordinates.y}
                      onChange={(e) =>
                        handleZoneChange(zone.id, {
                          coordinates: {
                            ...zone.coordinates,
                            y: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-600 border border-gray-500 text-white text-sm focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Size (width, height)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={zone.coordinates.width}
                      onChange={(e) =>
                        handleZoneChange(zone.id, {
                          coordinates: {
                            ...zone.coordinates,
                            width: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-600 border border-gray-500 text-white text-sm focus:border-cyan-500 outline-none"
                    />
                    <input
                      type="number"
                      value={zone.coordinates.height}
                      onChange={(e) =>
                        handleZoneChange(zone.id, {
                          coordinates: {
                            ...zone.coordinates,
                            height: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-600 border border-gray-500 text-white text-sm focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={zone.capacity}
                    onChange={(e) =>
                      handleZoneChange(zone.id, {
                        capacity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-gray-600 border border-gray-500 text-white text-sm focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={zone.color}
                    onChange={(e) =>
                      handleZoneChange(zone.id, { color: e.target.value })
                    }
                    className="w-full h-10 rounded-lg bg-gray-600 border border-gray-500 cursor-pointer"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold transition"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(editedFloor)}
          className="px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition"
        >
          Save Floor Plan
        </button>
      </div>
    </div>
  );
}
