/**
 * 🔒 ADVANCED PERMISSION RESTRICTIONS
 * 
 * The world's most comprehensive permission restriction system:
 * - Time-based restrictions (working hours, days, date ranges)
 * - Location-based restrictions (IP addresses, countries, geo-fencing)
 * - Device-based restrictions (mobile, desktop, API, browser)
 * - Conditional restrictions (if/then logic)
 * 
 * BlueDXP Platform - Vision 2040 Aligned
 */

"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// TYPES
// ============================================================================

export interface TimeRestriction {
  id: string;
  type: "working_hours" | "specific_days" | "date_range" | "recurring";
  enabled: boolean;
  // Working hours
  startTime?: string; // "09:00"
  endTime?: string;   // "18:00"
  timezone?: string;
  // Specific days
  allowedDays?: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
  // Date range
  startDate?: string;
  endDate?: string;
  // Recurring
  recurringPattern?: "daily" | "weekly" | "monthly";
  recurringDays?: number[];
}

export interface LocationRestriction {
  id: string;
  type: "ip_whitelist" | "ip_blacklist" | "country" | "geo_fence" | "network";
  enabled: boolean;
  // IP-based
  ipAddresses?: string[];
  ipRanges?: { start: string; end: string }[];
  // Country-based
  allowedCountries?: string[];
  blockedCountries?: string[];
  // Geo-fence
  geoFence?: {
    latitude: number;
    longitude: number;
    radiusKm: number;
    name: string;
  }[];
  // Network
  allowedNetworks?: ("office" | "vpn" | "trusted" | "any")[];
}

export interface DeviceRestriction {
  id: string;
  type: "device_type" | "browser" | "os" | "client";
  enabled: boolean;
  // Device types
  allowedDevices?: ("desktop" | "mobile" | "tablet" | "api" | "iot")[];
  // Browsers
  allowedBrowsers?: ("chrome" | "firefox" | "safari" | "edge" | "any")[];
  // Operating systems
  allowedOS?: ("windows" | "macos" | "linux" | "ios" | "android" | "any")[];
  // Client types
  allowedClients?: ("web" | "mobile_app" | "api" | "cli" | "sdk")[];
  // Security requirements
  requireMFA?: boolean;
  requireSecureBrowser?: boolean;
  requireCorporateDevice?: boolean;
}

export interface ConditionalRestriction {
  id: string;
  name: string;
  enabled: boolean;
  condition: {
    field: string;
    operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
    value: any;
  };
  action: "allow" | "deny" | "require_approval" | "log";
}

export interface AdvancedRestrictionsValue {
  timeRestrictions: TimeRestriction[];
  locationRestrictions: LocationRestriction[];
  deviceRestrictions: DeviceRestriction[];
  conditionalRestrictions: ConditionalRestriction[];
}

interface AdvancedRestrictionsProps {
  value: AdvancedRestrictionsValue;
  onChange: (value: AdvancedRestrictionsValue) => void;
  readOnly?: boolean;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DAYS_OF_WEEK = [
  { id: "monday", name: "Mon", full: "Monday" },
  { id: "tuesday", name: "Tue", full: "Tuesday" },
  { id: "wednesday", name: "Wed", full: "Wednesday" },
  { id: "thursday", name: "Thu", full: "Thursday" },
  { id: "friday", name: "Fri", full: "Friday" },
  { id: "saturday", name: "Sat", full: "Saturday" },
  { id: "sunday", name: "Sun", full: "Sunday" },
];

const COUNTRIES = [
  { code: "SA", name: "Saudi Arabia" },
  { code: "AE", name: "UAE" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Kuwait" },
  { code: "BH", name: "Bahrain" },
  { code: "OM", name: "Oman" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IN", name: "India" },
  { code: "CN", name: "China" },
  { code: "JP", name: "Japan" },
];

const TIMEZONES = [
  { id: "Asia/Riyadh", name: "Riyadh (UTC+3)" },
  { id: "Asia/Dubai", name: "Dubai (UTC+4)" },
  { id: "UTC", name: "UTC" },
  { id: "America/New_York", name: "New York (EST)" },
  { id: "Europe/London", name: "London (GMT)" },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AdvancedRestrictions: React.FC<AdvancedRestrictionsProps> = ({
  value,
  onChange,
  readOnly = false,
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState<"time" | "location" | "device" | "conditional">("time");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // ============================================================================
  // TIME RESTRICTIONS
  // ============================================================================

  const addTimeRestriction = useCallback(() => {
    if (readOnly) return;
    const newRestriction: TimeRestriction = {
      id: `time_${Date.now()}`,
      type: "working_hours",
      enabled: true,
      startTime: "09:00",
      endTime: "18:00",
      timezone: "Asia/Riyadh",
      allowedDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    };
    onChange({
      ...value,
      timeRestrictions: [...value.timeRestrictions, newRestriction],
    });
  }, [value, onChange, readOnly]);

  const updateTimeRestriction = useCallback((id: string, updates: Partial<TimeRestriction>) => {
    if (readOnly) return;
    onChange({
      ...value,
      timeRestrictions: value.timeRestrictions.map(r => 
        r.id === id ? { ...r, ...updates } : r
      ),
    });
  }, [value, onChange, readOnly]);

  const removeTimeRestriction = useCallback((id: string) => {
    if (readOnly) return;
    onChange({
      ...value,
      timeRestrictions: value.timeRestrictions.filter(r => r.id !== id),
    });
  }, [value, onChange, readOnly]);

  // ============================================================================
  // LOCATION RESTRICTIONS
  // ============================================================================

  const addLocationRestriction = useCallback(() => {
    if (readOnly) return;
    const newRestriction: LocationRestriction = {
      id: `location_${Date.now()}`,
      type: "country",
      enabled: true,
      allowedCountries: ["SA", "AE"],
    };
    onChange({
      ...value,
      locationRestrictions: [...value.locationRestrictions, newRestriction],
    });
  }, [value, onChange, readOnly]);

  const updateLocationRestriction = useCallback((id: string, updates: Partial<LocationRestriction>) => {
    if (readOnly) return;
    onChange({
      ...value,
      locationRestrictions: value.locationRestrictions.map(r => 
        r.id === id ? { ...r, ...updates } : r
      ),
    });
  }, [value, onChange, readOnly]);

  const removeLocationRestriction = useCallback((id: string) => {
    if (readOnly) return;
    onChange({
      ...value,
      locationRestrictions: value.locationRestrictions.filter(r => r.id !== id),
    });
  }, [value, onChange, readOnly]);

  // ============================================================================
  // DEVICE RESTRICTIONS
  // ============================================================================

  const addDeviceRestriction = useCallback(() => {
    if (readOnly) return;
    const newRestriction: DeviceRestriction = {
      id: `device_${Date.now()}`,
      type: "device_type",
      enabled: true,
      allowedDevices: ["desktop", "mobile"],
      requireMFA: false,
    };
    onChange({
      ...value,
      deviceRestrictions: [...value.deviceRestrictions, newRestriction],
    });
  }, [value, onChange, readOnly]);

  const updateDeviceRestriction = useCallback((id: string, updates: Partial<DeviceRestriction>) => {
    if (readOnly) return;
    onChange({
      ...value,
      deviceRestrictions: value.deviceRestrictions.map(r => 
        r.id === id ? { ...r, ...updates } : r
      ),
    });
  }, [value, onChange, readOnly]);

  const removeDeviceRestriction = useCallback((id: string) => {
    if (readOnly) return;
    onChange({
      ...value,
      deviceRestrictions: value.deviceRestrictions.filter(r => r.id !== id),
    });
  }, [value, onChange, readOnly]);

  // Toggle expansion
  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Count active restrictions
  const activeTimeCount = value.timeRestrictions.filter(r => r.enabled).length;
  const activeLocationCount = value.locationRestrictions.filter(r => r.enabled).length;
  const activeDeviceCount = value.deviceRestrictions.filter(r => r.enabled).length;
  const activeConditionalCount = value.conditionalRestrictions.filter(r => r.enabled).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <i className="ri-lock-line text-red-400"></i>
            Advanced Restrictions
          </h3>
          <p className="text-sm text-[#9ca3af] mt-1">
            Configure time, location, and device-based access controls
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
        {[
          { id: "time", label: "Time", icon: "ri-time-line", count: activeTimeCount },
          { id: "location", label: "Location", icon: "ri-map-pin-line", count: activeLocationCount },
          { id: "device", label: "Device", icon: "ri-smartphone-line", count: activeDeviceCount },
          { id: "conditional", label: "Conditional", icon: "ri-git-branch-line", count: activeConditionalCount },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-white border border-purple-500/30"
                : "text-[#9ca3af] hover:text-white hover:bg-white/5"
            }`}
          >
            <i className={tab.icon}></i>
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* Time Restrictions Tab */}
        {activeTab === "time" && (
          <motion.div
            key="time"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Add Button */}
            {!readOnly && (
              <button
                onClick={addTimeRestriction}
                className="w-full p-4 border-2 border-dashed border-white/20 rounded-lg text-[#9ca3af] hover:text-white hover:border-purple-500/50 transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-add-line"></i>
                Add Time Restriction
              </button>
            )}

            {/* Time Restriction List */}
            {value.timeRestrictions.map((restriction) => (
              <div
                key={restriction.id}
                className={`p-4 rounded-lg border transition-colors ${
                  restriction.enabled
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateTimeRestriction(restriction.id, { enabled: !restriction.enabled })}
                      disabled={readOnly}
                      className={`w-10 h-5 rounded-full transition-colors ${
                        restriction.enabled ? "bg-green-500" : "bg-white/20"
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        restriction.enabled ? "translate-x-5" : "translate-x-0.5"
                      }`} />
                    </button>
                    <span className="text-sm font-medium text-white">
                      {restriction.type === "working_hours" && "Working Hours"}
                      {restriction.type === "specific_days" && "Specific Days"}
                      {restriction.type === "date_range" && "Date Range"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpand(restriction.id)}
                      className="p-1.5 text-[#9ca3af] hover:text-white"
                    >
                      <i className={`ri-arrow-${expandedItems.has(restriction.id) ? "up" : "down"}-s-line`}></i>
                    </button>
                    {!readOnly && (
                      <button
                        onClick={() => removeTimeRestriction(restriction.id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedItems.has(restriction.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4 pt-4 border-t border-white/10"
                    >
                      {/* Type Selector */}
                      <div>
                        <label className="text-xs text-[#9ca3af] mb-2 block">Restriction Type</label>
                        <select
                          value={restriction.type}
                          onChange={(e) => updateTimeRestriction(restriction.id, { type: e.target.value as any })}
                          disabled={readOnly}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        >
                          <option value="working_hours">Working Hours</option>
                          <option value="specific_days">Specific Days Only</option>
                          <option value="date_range">Date Range</option>
                        </select>
                      </div>

                      {/* Working Hours */}
                      {restriction.type === "working_hours" && (
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs text-[#9ca3af] mb-2 block">Start Time</label>
                            <input
                              type="time"
                              value={restriction.startTime || "09:00"}
                              onChange={(e) => updateTimeRestriction(restriction.id, { startTime: e.target.value })}
                              disabled={readOnly}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-[#9ca3af] mb-2 block">End Time</label>
                            <input
                              type="time"
                              value={restriction.endTime || "18:00"}
                              onChange={(e) => updateTimeRestriction(restriction.id, { endTime: e.target.value })}
                              disabled={readOnly}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-[#9ca3af] mb-2 block">Timezone</label>
                            <select
                              value={restriction.timezone || "Asia/Riyadh"}
                              onChange={(e) => updateTimeRestriction(restriction.id, { timezone: e.target.value })}
                              disabled={readOnly}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                            >
                              {TIMEZONES.map(tz => (
                                <option key={tz.id} value={tz.id}>{tz.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Days Selector */}
                      <div>
                        <label className="text-xs text-[#9ca3af] mb-2 block">Allowed Days</label>
                        <div className="flex gap-2">
                          {DAYS_OF_WEEK.map(day => (
                            <button
                              key={day.id}
                              onClick={() => {
                                if (readOnly) return;
                                const currentDays = restriction.allowedDays || [];
                                const newDays = currentDays.includes(day.id as any)
                                  ? currentDays.filter(d => d !== day.id)
                                  : [...currentDays, day.id];
                                updateTimeRestriction(restriction.id, { allowedDays: newDays as any });
                              }}
                              disabled={readOnly}
                              className={`w-10 h-10 rounded-lg text-xs font-medium transition-colors ${
                                (restriction.allowedDays || []).includes(day.id as any)
                                  ? "bg-purple-500/30 text-purple-300 border border-purple-500/50"
                                  : "bg-white/5 text-[#9ca3af] hover:bg-white/10"
                              }`}
                            >
                              {day.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* Empty State */}
            {value.timeRestrictions.length === 0 && (
              <div className="text-center py-8 text-[#9ca3af]">
                <i className="ri-time-line text-4xl mb-2"></i>
                <p className="text-sm">No time restrictions configured</p>
                <p className="text-xs">Add restrictions to limit access to specific times</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Location Restrictions Tab */}
        {activeTab === "location" && (
          <motion.div
            key="location"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Add Button */}
            {!readOnly && (
              <button
                onClick={addLocationRestriction}
                className="w-full p-4 border-2 border-dashed border-white/20 rounded-lg text-[#9ca3af] hover:text-white hover:border-purple-500/50 transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-add-line"></i>
                Add Location Restriction
              </button>
            )}

            {/* Location Restriction List */}
            {value.locationRestrictions.map((restriction) => (
              <div
                key={restriction.id}
                className={`p-4 rounded-lg border transition-colors ${
                  restriction.enabled
                    ? "bg-blue-500/10 border-blue-500/30"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateLocationRestriction(restriction.id, { enabled: !restriction.enabled })}
                      disabled={readOnly}
                      className={`w-10 h-5 rounded-full transition-colors ${
                        restriction.enabled ? "bg-blue-500" : "bg-white/20"
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        restriction.enabled ? "translate-x-5" : "translate-x-0.5"
                      }`} />
                    </button>
                    <span className="text-sm font-medium text-white">
                      {restriction.type === "country" && "Country Restriction"}
                      {restriction.type === "ip_whitelist" && "IP Whitelist"}
                      {restriction.type === "geo_fence" && "Geo-Fence"}
                      {restriction.type === "network" && "Network Restriction"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpand(restriction.id)}
                      className="p-1.5 text-[#9ca3af] hover:text-white"
                    >
                      <i className={`ri-arrow-${expandedItems.has(restriction.id) ? "up" : "down"}-s-line`}></i>
                    </button>
                    {!readOnly && (
                      <button
                        onClick={() => removeLocationRestriction(restriction.id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedItems.has(restriction.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4 pt-4 border-t border-white/10"
                    >
                      {/* Type Selector */}
                      <div>
                        <label className="text-xs text-[#9ca3af] mb-2 block">Restriction Type</label>
                        <select
                          value={restriction.type}
                          onChange={(e) => updateLocationRestriction(restriction.id, { type: e.target.value as any })}
                          disabled={readOnly}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        >
                          <option value="country">Allowed Countries</option>
                          <option value="ip_whitelist">IP Whitelist</option>
                          <option value="ip_blacklist">IP Blacklist</option>
                          <option value="network">Network Type</option>
                        </select>
                      </div>

                      {/* Country Selector */}
                      {restriction.type === "country" && (
                        <div>
                          <label className="text-xs text-[#9ca3af] mb-2 block">Allowed Countries</label>
                          <div className="flex flex-wrap gap-2">
                            {COUNTRIES.map(country => (
                              <button
                                key={country.code}
                                onClick={() => {
                                  if (readOnly) return;
                                  const current = restriction.allowedCountries || [];
                                  const newList = current.includes(country.code)
                                    ? current.filter(c => c !== country.code)
                                    : [...current, country.code];
                                  updateLocationRestriction(restriction.id, { allowedCountries: newList });
                                }}
                                disabled={readOnly}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  (restriction.allowedCountries || []).includes(country.code)
                                    ? "bg-blue-500/30 text-blue-300 border border-blue-500/50"
                                    : "bg-white/5 text-[#9ca3af] hover:bg-white/10"
                                }`}
                              >
                                {country.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* IP Whitelist */}
                      {restriction.type === "ip_whitelist" && (
                        <div>
                          <label className="text-xs text-[#9ca3af] mb-2 block">IP Addresses (one per line)</label>
                          <textarea
                            value={(restriction.ipAddresses || []).join("\n")}
                            onChange={(e) => updateLocationRestriction(restriction.id, { 
                              ipAddresses: e.target.value.split("\n").filter(ip => ip.trim()) 
                            })}
                            disabled={readOnly}
                            placeholder="192.168.1.1&#10;10.0.0.0/24"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white h-24 font-mono"
                          />
                        </div>
                      )}

                      {/* Network Types */}
                      {restriction.type === "network" && (
                        <div>
                          <label className="text-xs text-[#9ca3af] mb-2 block">Allowed Networks</label>
                          <div className="flex flex-wrap gap-2">
                            {["office", "vpn", "trusted", "any"].map(network => (
                              <button
                                key={network}
                                onClick={() => {
                                  if (readOnly) return;
                                  const current = restriction.allowedNetworks || [];
                                  const newList = current.includes(network as any)
                                    ? current.filter(n => n !== network)
                                    : [...current, network];
                                  updateLocationRestriction(restriction.id, { allowedNetworks: newList as any });
                                }}
                                disabled={readOnly}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  (restriction.allowedNetworks || []).includes(network as any)
                                    ? "bg-blue-500/30 text-blue-300 border border-blue-500/50"
                                    : "bg-white/5 text-[#9ca3af] hover:bg-white/10"
                                }`}
                              >
                                {network.charAt(0).toUpperCase() + network.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* Empty State */}
            {value.locationRestrictions.length === 0 && (
              <div className="text-center py-8 text-[#9ca3af]">
                <i className="ri-map-pin-line text-4xl mb-2"></i>
                <p className="text-sm">No location restrictions configured</p>
                <p className="text-xs">Add restrictions to limit access by location</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Device Restrictions Tab */}
        {activeTab === "device" && (
          <motion.div
            key="device"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Add Button */}
            {!readOnly && (
              <button
                onClick={addDeviceRestriction}
                className="w-full p-4 border-2 border-dashed border-white/20 rounded-lg text-[#9ca3af] hover:text-white hover:border-purple-500/50 transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-add-line"></i>
                Add Device Restriction
              </button>
            )}

            {/* Device Restriction List */}
            {value.deviceRestrictions.map((restriction) => (
              <div
                key={restriction.id}
                className={`p-4 rounded-lg border transition-colors ${
                  restriction.enabled
                    ? "bg-cyan-500/10 border-cyan-500/30"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateDeviceRestriction(restriction.id, { enabled: !restriction.enabled })}
                      disabled={readOnly}
                      className={`w-10 h-5 rounded-full transition-colors ${
                        restriction.enabled ? "bg-cyan-500" : "bg-white/20"
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        restriction.enabled ? "translate-x-5" : "translate-x-0.5"
                      }`} />
                    </button>
                    <span className="text-sm font-medium text-white">Device Type Restriction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpand(restriction.id)}
                      className="p-1.5 text-[#9ca3af] hover:text-white"
                    >
                      <i className={`ri-arrow-${expandedItems.has(restriction.id) ? "up" : "down"}-s-line`}></i>
                    </button>
                    {!readOnly && (
                      <button
                        onClick={() => removeDeviceRestriction(restriction.id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedItems.has(restriction.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4 pt-4 border-t border-white/10"
                    >
                      {/* Device Types */}
                      <div>
                        <label className="text-xs text-[#9ca3af] mb-2 block">Allowed Device Types</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { id: "desktop", icon: "ri-computer-line", name: "Desktop" },
                            { id: "mobile", icon: "ri-smartphone-line", name: "Mobile" },
                            { id: "tablet", icon: "ri-tablet-line", name: "Tablet" },
                            { id: "api", icon: "ri-code-line", name: "API" },
                          ].map(device => (
                            <button
                              key={device.id}
                              onClick={() => {
                                if (readOnly) return;
                                const current = restriction.allowedDevices || [];
                                const newList = current.includes(device.id as any)
                                  ? current.filter(d => d !== device.id)
                                  : [...current, device.id];
                                updateDeviceRestriction(restriction.id, { allowedDevices: newList as any });
                              }}
                              disabled={readOnly}
                              className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
                                (restriction.allowedDevices || []).includes(device.id as any)
                                  ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                                  : "bg-white/5 text-[#9ca3af] hover:bg-white/10"
                              }`}
                            >
                              <i className={device.icon}></i>
                              {device.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Security Requirements */}
                      <div>
                        <label className="text-xs text-[#9ca3af] mb-2 block">Security Requirements</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer">
                            <input
                              type="checkbox"
                              checked={restriction.requireMFA || false}
                              onChange={(e) => updateDeviceRestriction(restriction.id, { requireMFA: e.target.checked })}
                              disabled={readOnly}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-sm text-white">Require MFA</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer">
                            <input
                              type="checkbox"
                              checked={restriction.requireSecureBrowser || false}
                              onChange={(e) => updateDeviceRestriction(restriction.id, { requireSecureBrowser: e.target.checked })}
                              disabled={readOnly}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-sm text-white">Require Secure Browser</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer">
                            <input
                              type="checkbox"
                              checked={restriction.requireCorporateDevice || false}
                              onChange={(e) => updateDeviceRestriction(restriction.id, { requireCorporateDevice: e.target.checked })}
                              disabled={readOnly}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-sm text-white">Corporate Device Only</span>
                          </label>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* Empty State */}
            {value.deviceRestrictions.length === 0 && (
              <div className="text-center py-8 text-[#9ca3af]">
                <i className="ri-smartphone-line text-4xl mb-2"></i>
                <p className="text-sm">No device restrictions configured</p>
                <p className="text-xs">Add restrictions to limit access by device type</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Conditional Restrictions Tab */}
        {activeTab === "conditional" && (
          <motion.div
            key="conditional"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="p-6 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <i className="ri-magic-line text-purple-400 text-2xl"></i>
                <div>
                  <h4 className="text-white font-medium">Conditional Access Rules</h4>
                  <p className="text-sm text-[#9ca3af] mt-1">
                    Create if/then rules for dynamic permission control. For example:
                  </p>
                  <ul className="text-sm text-[#9ca3af] mt-2 space-y-1">
                    <li>• If order value {">"} $10,000, require manager approval</li>
                    <li>• If accessing outside working hours, enable read-only mode</li>
                    <li>• If using mobile device, restrict export functionality</li>
                  </ul>
                  <button className="mt-4 px-4 py-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors">
                    <i className="ri-add-line mr-1"></i>
                    Create Custom Rule
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[#9ca3af]">Active Restrictions:</span>
          <span className="flex items-center gap-1 text-green-400">
            <i className="ri-time-line"></i> {activeTimeCount} Time
          </span>
          <span className="flex items-center gap-1 text-blue-400">
            <i className="ri-map-pin-line"></i> {activeLocationCount} Location
          </span>
          <span className="flex items-center gap-1 text-cyan-400">
            <i className="ri-smartphone-line"></i> {activeDeviceCount} Device
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdvancedRestrictions;
