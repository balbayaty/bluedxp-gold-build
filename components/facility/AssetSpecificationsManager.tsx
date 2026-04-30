"use client";

/**
 * Asset Specifications Manager
 *
 * Comprehensive specifications management:
 * - Technical specifications
 * - Dimensions and weight
 * - Power consumption
 * - Operating parameters
 * - Custom specifications
 * - Specifications templates
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RiSettingsLine,
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiRulerLine,
  RiFlashlightLine,
  RiTempHotLine,
  RiSpeedLine,
  RiSaveLine,
} from "react-icons/ri";

interface AssetSpecificationsManagerProps {
  assetId: string;
  assetName: string;
  specifications: any;
  onUpdate: (specifications: any) => void;
}

export default function AssetSpecificationsManager({
  assetId,
  assetName,
  specifications,
  onUpdate,
}: AssetSpecificationsManagerProps) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    dimensions: {
      length: specifications?.dimensions?.length || "",
      width: specifications?.dimensions?.width || "",
      height: specifications?.dimensions?.height || "",
      unit: specifications?.dimensions?.unit || "meters",
    },
    weight: specifications?.weight || "",
    powerConsumption: specifications?.powerConsumption || "",
    capacity: specifications?.capacity || "",
    capacityUnit: specifications?.capacityUnit || "",
    operatingTemperature: {
      min: specifications?.operatingTemperature?.min || "",
      max: specifications?.operatingTemperature?.max || "",
      unit: specifications?.operatingTemperature?.unit || "celsius",
    },
    operatingPressure: {
      min: specifications?.operatingPressure?.min || "",
      max: specifications?.operatingPressure?.max || "",
      unit: specifications?.operatingPressure?.unit || "psi",
    },
    technicalSpecs: specifications?.technicalSpecs || {},
  });

  const handleSave = () => {
    onUpdate(formData);
    setEditing(false);
  };

  const addCustomSpec = () => {
    const key = prompt("Enter specification name:");
    const value = prompt("Enter specification value:");
    if (key && value) {
      setFormData({
        ...formData,
        technicalSpecs: {
          ...formData.technicalSpecs,
          [key]: value,
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <RiSettingsLine className="h-6 w-6 text-primary" />
            Technical Specifications
          </h2>
          <p className="text-muted-foreground mt-1">{assetName}</p>
        </div>
        {!editing ? (
          <Button variant="primary" onClick={() => setEditing(true)}>
            <RiEditLine className="h-4 w-4 mr-2" />
            Edit Specifications
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              <RiSaveLine className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dimensions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiRulerLine className="h-5 w-5" />
              Dimensions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Length
                    </label>
                    <Input
                      type="number"
                      value={formData.dimensions.length}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dimensions: {
                            ...formData.dimensions,
                            length: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Width
                    </label>
                    <Input
                      type="number"
                      value={formData.dimensions.width}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dimensions: {
                            ...formData.dimensions,
                            width: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Height
                    </label>
                    <Input
                      type="number"
                      value={formData.dimensions.height}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dimensions: {
                            ...formData.dimensions,
                            height: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Unit</label>
                  <select
                    value={formData.dimensions.unit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dimensions: {
                          ...formData.dimensions,
                          unit: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white"
                  >
                    <option value="meters">Meters</option>
                    <option value="feet">Feet</option>
                    <option value="inches">Inches</option>
                  </select>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                {formData.dimensions.length && (
                  <p>
                    Length: {formData.dimensions.length}{" "}
                    {formData.dimensions.unit}
                  </p>
                )}
                {formData.dimensions.width && (
                  <p>
                    Width: {formData.dimensions.width}{" "}
                    {formData.dimensions.unit}
                  </p>
                )}
                {formData.dimensions.height && (
                  <p>
                    Height: {formData.dimensions.height}{" "}
                    {formData.dimensions.unit}
                  </p>
                )}
                {!formData.dimensions.length &&
                  !formData.dimensions.width &&
                  !formData.dimensions.height && (
                    <p className="text-muted-foreground">
                      No dimensions specified
                    </p>
                  )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weight */}
        <Card>
          <CardHeader>
            <CardTitle>Weight</CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <Input
                type="number"
                value={formData.weight}
                onChange={(e) =>
                  setFormData({ ...formData, weight: e.target.value })
                }
                placeholder="Weight in kg"
              />
            ) : (
              <p>
                {formData.weight ? `${formData.weight} kg` : "Not specified"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Power Consumption */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiFlashlightLine className="h-5 w-5" />
              Power Consumption
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <Input
                type="number"
                value={formData.powerConsumption}
                onChange={(e) =>
                  setFormData({ ...formData, powerConsumption: e.target.value })
                }
                placeholder="Power in kW"
              />
            ) : (
              <p>
                {formData.powerConsumption
                  ? `${formData.powerConsumption} kW`
                  : "Not specified"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Capacity */}
        <Card>
          <CardHeader>
            <CardTitle>Capacity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {editing ? (
              <>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                  placeholder="Capacity value"
                />
                <Input
                  value={formData.capacityUnit}
                  onChange={(e) =>
                    setFormData({ ...formData, capacityUnit: e.target.value })
                  }
                  placeholder="Unit (e.g., tons, liters, m³)"
                />
              </>
            ) : (
              <p>
                {formData.capacity
                  ? `${formData.capacity} ${formData.capacityUnit}`
                  : "Not specified"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Operating Temperature */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiTempHotLine className="h-5 w-5" />
              Operating Temperature
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Min
                    </label>
                    <Input
                      type="number"
                      value={formData.operatingTemperature.min}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          operatingTemperature: {
                            ...formData.operatingTemperature,
                            min: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Max
                    </label>
                    <Input
                      type="number"
                      value={formData.operatingTemperature.max}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          operatingTemperature: {
                            ...formData.operatingTemperature,
                            max: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Unit</label>
                  <select
                    value={formData.operatingTemperature.unit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        operatingTemperature: {
                          ...formData.operatingTemperature,
                          unit: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white"
                  >
                    <option value="celsius">Celsius</option>
                    <option value="fahrenheit">Fahrenheit</option>
                  </select>
                </div>
              </>
            ) : (
              <p>
                {formData.operatingTemperature.min &&
                formData.operatingTemperature.max
                  ? `${formData.operatingTemperature.min}°${formData.operatingTemperature.unit === "celsius" ? "C" : "F"} - ${formData.operatingTemperature.max}°${formData.operatingTemperature.unit === "celsius" ? "C" : "F"}`
                  : "Not specified"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Operating Pressure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiSpeedLine className="h-5 w-5" />
              Operating Pressure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Min
                    </label>
                    <Input
                      type="number"
                      value={formData.operatingPressure.min}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          operatingPressure: {
                            ...formData.operatingPressure,
                            min: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Max
                    </label>
                    <Input
                      type="number"
                      value={formData.operatingPressure.max}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          operatingPressure: {
                            ...formData.operatingPressure,
                            max: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Unit</label>
                  <select
                    value={formData.operatingPressure.unit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        operatingPressure: {
                          ...formData.operatingPressure,
                          unit: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white"
                  >
                    <option value="psi">PSI</option>
                    <option value="bar">Bar</option>
                    <option value="pa">Pascal</option>
                  </select>
                </div>
              </>
            ) : (
              <p>
                {formData.operatingPressure.min &&
                formData.operatingPressure.max
                  ? `${formData.operatingPressure.min} - ${formData.operatingPressure.max} ${formData.operatingPressure.unit}`
                  : "Not specified"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Custom Technical Specifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Custom Technical Specifications</CardTitle>
            {editing && (
              <Button variant="outline" size="sm" onClick={addCustomSpec}>
                <RiAddLine className="h-4 w-4 mr-2" />
                Add Specification
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {Object.keys(formData.technicalSpecs).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(formData.technicalSpecs).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-2 bg-white/5 rounded"
                >
                  <div>
                    <span className="font-medium">{key}:</span>
                    <span className="ml-2">{value as string}</span>
                  </div>
                  {editing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newSpecs = { ...formData.technicalSpecs };
                        delete newSpecs[key];
                        setFormData({ ...formData, technicalSpecs: newSpecs });
                      }}
                    >
                      <RiDeleteBinLine className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No custom specifications</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
