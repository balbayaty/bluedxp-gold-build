/**
 * 👁️ USER DATA VISIBILITY SETTINGS
 * 
 * Configure what data a user can see for assigned customers
 * Granular control over inventory, orders, shipments, reports, etc.
 * 
 * BlueDXP Platform - Vision 2040 Aligned
 */

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserDataVisibility } from "@/types/user";

export interface UserDataVisibilitySettingsProps {
  visibility: UserDataVisibility;
  onChange: (visibility: UserDataVisibility) => void;
  readOnly?: boolean;
  className?: string;
}

interface VisibilityOption {
  key: keyof UserDataVisibility;
  label: string;
  description: string;
  icon: string;
}

const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    key: "canViewInventory",
    label: "Inventory",
    description: "View stock levels, locations, and movements",
    icon: "ri-stack-line",
  },
  {
    key: "canViewOrders",
    label: "Orders",
    description: "View sales orders, purchase orders, and order details",
    icon: "ri-file-list-line",
  },
  {
    key: "canViewShipments",
    label: "Shipments",
    description: "View shipment tracking and delivery information",
    icon: "ri-truck-line",
  },
  {
    key: "canViewReports",
    label: "Reports",
    description: "Access to analytics and reports",
    icon: "ri-bar-chart-line",
  },
  {
    key: "canViewFinancials",
    label: "Financials",
    description: "View pricing, costs, and financial data",
    icon: "ri-money-dollar-circle-line",
  },
  {
    key: "canViewAllWarehouses",
    label: "All Warehouses",
    description: "View data across all warehouses",
    icon: "ri-building-4-line",
  },
  {
    key: "canViewDocuments",
    label: "Documents",
    description: "Access to documents and attachments",
    icon: "ri-file-text-line",
  },
  {
    key: "canExportData",
    label: "Export Data",
    description: "Export data to Excel, PDF, etc.",
    icon: "ri-download-line",
  },
];

const UserDataVisibilitySettings: React.FC<UserDataVisibilitySettingsProps> = ({
  visibility,
  onChange,
  readOnly = false,
  className = "",
}) => {
  const [localVisibility, setLocalVisibility] =
    useState<UserDataVisibility>(visibility);

  const toggleVisibility = (key: keyof UserDataVisibility) => {
    if (readOnly) return;

    const newVisibility = {
      ...localVisibility,
      [key]: !localVisibility[key],
    };

    setLocalVisibility(newVisibility);
    onChange(newVisibility);
  };

  const enableAll = () => {
    if (readOnly) return;

    const allEnabled = VISIBILITY_OPTIONS.reduce(
      (acc, option) => ({
        ...acc,
        [option.key]: true,
      }),
      {} as UserDataVisibility
    );

    setLocalVisibility(allEnabled);
    onChange(allEnabled);
  };

  const disableAll = () => {
    if (readOnly) return;

    const allDisabled = VISIBILITY_OPTIONS.reduce(
      (acc, option) => ({
        ...acc,
        [option.key]: false,
      }),
      {} as UserDataVisibility
    );

    setLocalVisibility(allDisabled);
    onChange(allDisabled);
  };

  const enabledCount = VISIBILITY_OPTIONS.filter(
    (opt) => localVisibility[opt.key]
  ).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <i className="ri-eye-line text-cyan-400"></i>
            Data Visibility
          </h3>
          <p className="text-sm text-[#9ca3af] mt-1">
            {enabledCount} of {VISIBILITY_OPTIONS.length} permissions enabled
          </p>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={enableAll}
              className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-medium hover:bg-green-500/30 transition-colors"
            >
              Enable All
            </button>
            <button
              onClick={disableAll}
              className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors"
            >
              Disable All
            </button>
          </div>
        )}
      </div>

      {/* Visibility Options */}
      <div className="grid md:grid-cols-2 gap-3">
        {VISIBILITY_OPTIONS.map((option, index) => {
          const isEnabled = localVisibility[option.key];

          return (
            <motion.div
              key={option.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                p-4 rounded-lg border transition-all cursor-pointer
                ${
                  isEnabled
                    ? "bg-cyan-500/10 border-cyan-500/30"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }
                ${readOnly ? "cursor-default opacity-75" : ""}
              `}
              onClick={() => toggleVisibility(option.key)}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${
                    isEnabled
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "bg-white/5 text-[#9ca3af]"
                  }
                `}
                >
                  <i className={`${option.icon} text-xl`}></i>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-white">
                      {option.label}
                    </span>
                    <div
                      className={`
                      w-10 h-5 rounded-full transition-colors relative
                      ${isEnabled ? "bg-cyan-500" : "bg-white/10"}
                    `}
                    >
                      <div
                        className={`
                        absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform
                        ${isEnabled ? "left-5" : "left-0.5"}
                      `}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-[#9ca3af] leading-relaxed">
                    {option.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      {!readOnly && enabledCount > 0 && (
        <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <i className="ri-information-line text-cyan-400 text-xl mt-0.5"></i>
            <div className="flex-1">
              <div className="text-sm font-medium text-white mb-1">
                Visibility Summary
              </div>
              <div className="text-xs text-[#9ca3af]">
                This user will be able to see {enabledCount} type{enabledCount !== 1 ? "s" : ""} of
                data for their assigned customers.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDataVisibilitySettings;
