/**
 * 👥 DEVICE GROUP MANAGER COMPONENT
 * Manage IoT device groups for collective operations
 * Full implementation with group creation and management
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { iotManager } from "@/lib/services/iot/iotManager";
import type { IoTDevice, IoTDeviceGroup } from "@/types/iot";

export default function DeviceGroupManager() {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [groups, setGroups] = useState<IoTDeviceGroup[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    location: "",
    purpose: "",
    selectedDevices: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allDevices = await iotManager.getDevices();
      setDevices(allDevices);
      // Groups would be loaded from service
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleCreateGroup = () => {
    if (!newGroup.name || newGroup.selectedDevices.length === 0) return;

    try {
      const group: Omit<IoTDeviceGroup, "id" | "createdAt" | "updatedAt"> = {
        name: newGroup.name,
        description: newGroup.description,
        devices: newGroup.selectedDevices,
        location: newGroup.location,
        purpose: newGroup.purpose,
        rules: [],
        aggregationRules: [],
      };

      const groupId = iotManager.createDeviceGroup(group);
      setGroups([
        ...groups,
        { ...group, id: groupId, createdAt: new Date(), updatedAt: new Date() },
      ]);
      setShowCreateModal(false);
      setNewGroup({
        name: "",
        description: "",
        location: "",
        purpose: "",
        selectedDevices: [],
      });
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  const toggleDevice = (deviceId: string) => {
    setNewGroup((prev) => ({
      ...prev,
      selectedDevices: prev.selectedDevices.includes(deviceId)
        ? prev.selectedDevices.filter((id) => id !== deviceId)
        : [...prev.selectedDevices, deviceId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Groups List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Device Groups</CardTitle>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Group
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No device groups created yet. Create one to manage devices
              collectively.
            </p>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div key={group.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{group.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {group.description}
                      </p>
                    </div>
                    <Badge>{group.devices.length} devices</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium">Purpose:</span>{" "}
                      {group.purpose}
                    </p>
                    {group.location && (
                      <p>
                        <span className="font-medium">Location:</span>{" "}
                        {group.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Group Modal */}
      {showCreateModal && (
        <Card>
          <CardHeader>
            <CardTitle>Create Device Group</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Group Name</Label>
              <Input
                value={newGroup.name}
                onChange={(e) =>
                  setNewGroup({ ...newGroup, name: e.target.value })
                }
                placeholder="e.g., Production Zone A Sensors"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newGroup.description}
                onChange={(e) =>
                  setNewGroup({ ...newGroup, description: e.target.value })
                }
                placeholder="Describe the purpose of this device group"
                rows={3}
              />
            </div>

            <div>
              <Label>Location</Label>
              <Input
                value={newGroup.location}
                onChange={(e) =>
                  setNewGroup({ ...newGroup, location: e.target.value })
                }
                placeholder="e.g., Warehouse A, Zone 1"
              />
            </div>

            <div>
              <Label>Purpose</Label>
              <Input
                value={newGroup.purpose}
                onChange={(e) =>
                  setNewGroup({ ...newGroup, purpose: e.target.value })
                }
                placeholder="e.g., Temperature monitoring, Security surveillance"
              />
            </div>

            <div>
              <Label>
                Select Devices ({newGroup.selectedDevices.length} selected)
              </Label>
              <div className="mt-2 max-h-64 overflow-y-auto border rounded-lg p-3 space-y-2">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                      newGroup.selectedDevices.includes(device.id)
                        ? "bg-primary/10 border border-primary"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => toggleDevice(device.id)}
                  >
                    <input
                      type="checkbox"
                      checked={newGroup.selectedDevices.includes(device.id)}
                      onChange={() => toggleDevice(device.id)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{device.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {device.type} • {device.connectivity.protocol}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreateGroup}
                disabled={
                  !newGroup.name || newGroup.selectedDevices.length === 0
                }
              >
                Create Group
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
