/**
 * Visual Facility Mapping Page
 * Interactive floor plans with container placement and 3D visualization
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import FacilityMap from "@/components/facility/FacilityMap";
import FloorPlanEditor from "@/components/facility/FloorPlanEditor";
import Modal from "@/components/Modal";
import {
  Facility,
  Floor,
  Zone,
  ContainerPlacement,
} from "@/lib/services/facility/facilityMappingService";
import { facilityMappingService } from "@/lib/services/facility/facilityMappingService";
import { containerService } from "@/lib/services/chemical/containerService";

type ViewMode = "2d" | "3d" | "satellite";
type TabType = "map" | "floors" | "zones" | "containers" | "emergency";

export default function FacilityMappingPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(
    null,
  );
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("2d");
  const [activeTab, setActiveTab] = useState<TabType>("map");
  const [showCreateFacility, setShowCreateFacility] = useState(false);
  const [showEditFloor, setShowEditFloor] = useState(false);
  const [selectedContainer, setSelectedContainer] =
    useState<ContainerPlacement | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [emergencyMap, setEmergencyMap] = useState<any>(null);

  useEffect(() => {
    loadFacilities();
  }, []);

  useEffect(() => {
    if (selectedFacility && selectedFacility.floors.length > 0) {
      setSelectedFloor(selectedFacility.floors[0]);
    }
  }, [selectedFacility]);

  useEffect(() => {
    if (selectedFacility && selectedFloor) {
      loadEmergencyMap();
    }
  }, [selectedFacility, selectedFloor]);

  const loadFacilities = async () => {
    try {
      const result = await facilityMappingService.getAllFacilities();
      setFacilities(result);
      if (result.length > 0 && !selectedFacility) {
        setSelectedFacility(result[0]);
      }
    } catch (error) {
      console.error("Error loading facilities:", error);
    }
  };

  const loadEmergencyMap = async () => {
    if (!selectedFacility || !selectedFloor) return;

    try {
      const map = await facilityMappingService.generateEmergencyMap(
        selectedFacility.id,
        selectedFloor.id,
      );
      setEmergencyMap(map);
    } catch (error) {
      console.error("Error loading emergency map:", error);
    }
  };

  const handleContainerPlace = async (
    containerId: string,
    coordinates: { x: number; y: number },
  ) => {
    if (!selectedFacility || !selectedFloor) return;

    try {
      const container = selectedFloor.containers.find(
        (c) => c.containerId === containerId,
      );
      if (!container) return;

      await facilityMappingService.placeContainer(
        selectedFacility.id,
        selectedFloor.id,
        {
          ...container,
          coordinates,
          status: "placed",
          placedAt: new Date(),
          placedBy: "current-user", // TODO: Get from auth
        },
      );

      // Reload facility
      const updated = await facilityMappingService.getFacility(
        selectedFacility.id,
      );
      if (updated) {
        setSelectedFacility(updated);
        setSelectedFloor(
          updated.floors.find((f) => f.id === selectedFloor.id) ||
            updated.floors[0],
        );
      }
    } catch (error) {
      console.error("Error placing container:", error);
    }
  };

  const tabs = [
    { id: "map" as TabType, label: "Map View", icon: "ri-map-line" },
    { id: "floors" as TabType, label: "Floors", icon: "ri-building-line" },
    { id: "zones" as TabType, label: "Zones", icon: "ri-layout-grid-line" },
    { id: "containers" as TabType, label: "Containers", icon: "ri-box-line" },
    { id: "emergency" as TabType, label: "Emergency", icon: "ri-alert-line" },
  ];

  return (
    <PageTemplate
      title="Facility Mapping"
      description="Interactive floor plans with container placement and emergency response"
      icon="ri-map-2-line"
    >
      <div className="space-y-6">
        {/* Facility Selector */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Facilities</h3>
            <button
              onClick={() => setShowCreateFacility(true)}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition flex items-center gap-2"
            >
              <i className="ri-add-line"></i>
              New Facility
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {facilities.map((facility) => (
              <button
                key={facility.id}
                onClick={() => setSelectedFacility(facility)}
                className={`px-4 py-2 rounded-lg transition ${
                  selectedFacility?.id === facility.id
                    ? "bg-cyan-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {facility.name}
              </button>
            ))}
          </div>
        </div>

        {selectedFacility && (
          <>
            {/* Floor Selector */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Floor:</span>
                {selectedFacility.floors.map((floor) => (
                  <button
                    key={floor.id}
                    onClick={() => setSelectedFloor(floor)}
                    className={`px-4 py-2 rounded-lg transition ${
                      selectedFloor?.id === floor.id
                        ? "bg-cyan-500 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {floor.name}
                  </button>
                ))}
                <button
                  onClick={() => setShowEditFloor(true)}
                  className="ml-auto px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition"
                >
                  <i className="ri-edit-line"></i>
                </button>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setViewMode("2d")}
                className={`px-4 py-2 rounded-lg transition ${
                  viewMode === "2d"
                    ? "bg-cyan-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                2D
              </button>
              <button
                onClick={() => setViewMode("3d")}
                className={`px-4 py-2 rounded-lg transition ${
                  viewMode === "3d"
                    ? "bg-cyan-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                3D
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-700">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 flex items-center gap-2 font-medium transition ${
                    activeTab === tab.id
                      ? "text-cyan-400 border-b-2 border-cyan-400"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  <i className={tab.icon}></i>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === "map" && selectedFloor && (
                <motion.div
                  key="map"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700"
                >
                  <div className="h-[600px]">
                    <FacilityMap
                      facility={selectedFacility}
                      floor={selectedFloor}
                      onContainerClick={setSelectedContainer}
                      onZoneClick={setSelectedZone}
                      onContainerPlace={handleContainerPlace}
                      viewMode={viewMode}
                      interactive={true}
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === "zones" && selectedFloor && (
                <motion.div
                  key="zones"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {selectedFloor.zones.map((zone) => (
                    <div
                      key={zone.id}
                      className="bg-gray-800 rounded-xl p-6 border border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-white">
                            {zone.name}
                          </h4>
                          <p className="text-sm text-gray-400">{zone.type}</p>
                        </div>
                        <div
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: zone.color }}
                        />
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">Capacity</p>
                          <p className="text-lg font-semibold text-white">
                            {zone.currentOccupancy} / {zone.capacity}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Location</p>
                          <p className="text-lg font-semibold text-white">
                            ({zone.coordinates.x}, {zone.coordinates.y})
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Size</p>
                          <p className="text-lg font-semibold text-white">
                            {zone.coordinates.width}m ×{" "}
                            {zone.coordinates.height}m
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === "emergency" && emergencyMap && (
                <motion.div
                  key="emergency"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                      <i className="ri-alert-line"></i>
                      Emergency Response Map
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-white mb-2">
                          Emergency Exits
                        </h4>
                        <ul className="space-y-1">
                          {emergencyMap.emergencyExits.map(
                            (exit: any, idx: number) => (
                              <li key={idx} className="text-sm text-gray-300">
                                {exit.label}: ({exit.x}, {exit.y})
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-2">
                          Assembly Points
                        </h4>
                        <ul className="space-y-1">
                          {emergencyMap.assemblyPoints.map(
                            (point: any, idx: number) => (
                              <li key={idx} className="text-sm text-gray-300">
                                {point.label}: ({point.x}, {point.y})
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-2">
                          Fire Extinguishers
                        </h4>
                        <ul className="space-y-1">
                          {emergencyMap.fireExtinguishers.map(
                            (ext: any, idx: number) => (
                              <li key={idx} className="text-sm text-gray-300">
                                {ext.type} at ({ext.x}, {ext.y})
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-2">
                          Hazardous Areas
                        </h4>
                        <ul className="space-y-1">
                          {emergencyMap.hazardousAreas.map(
                            (zone: Zone, idx: number) => (
                              <li key={idx} className="text-sm text-gray-300">
                                {zone.name}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Edit Floor Modal */}
        {showEditFloor && selectedFloor && (
          <Modal
            isOpen={showEditFloor}
            onClose={() => setShowEditFloor(false)}
            title="Edit Floor Plan"
            size="xl"
          >
            <FloorPlanEditor
              floor={selectedFloor}
              onSave={async (updatedFloor) => {
                if (selectedFacility) {
                  const updatedFloors = selectedFacility.floors.map((f) =>
                    f.id === updatedFloor.id ? updatedFloor : f,
                  );
                  await facilityMappingService.saveFacility({
                    ...selectedFacility,
                    floors: updatedFloors,
                  });
                  await loadFacilities();
                  setShowEditFloor(false);
                }
              }}
              onCancel={() => setShowEditFloor(false)}
            />
          </Modal>
        )}
      </div>
    </PageTemplate>
  );
}
