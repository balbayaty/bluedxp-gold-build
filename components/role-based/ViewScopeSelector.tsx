"use client";

import { useViewContext } from "@/contexts/ViewContextProvider";
import { ViewLevel } from "@/types/viewContext";
import Tooltip from "@/components/Tooltip";

interface ViewScopeSelectorProps {
  className?: string;
}

export default function ViewScopeSelector({
  className = "",
}: ViewScopeSelectorProps) {
  const { context, updateContext } = useViewContext();

  const viewLevels: {
    level: ViewLevel;
    label: string;
    icon: string;
    description: string;
  }[] = [
    {
      level: "SYSTEM",
      label: "System",
      icon: "ri-global-line",
      description: "View all tenants (System Admin only)",
    },
    {
      level: "TENANT",
      label: "Tenant",
      icon: "ri-building-line",
      description: "View all customers and warehouses in tenant",
    },
    {
      level: "CUSTOMER",
      label: "Customer",
      icon: "ri-user-3-line",
      description: "View customer-specific data",
    },
    {
      level: "WAREHOUSE",
      label: "Warehouse",
      icon: "ri-warehouse-line",
      description: "View warehouse-specific data",
    },
    {
      level: "COMBINED",
      label: "Combined",
      icon: "ri-layout-grid-line",
      description: "View combined customer and warehouse data",
    },
  ];

  const handleLevelChange = (level: ViewLevel) => {
    updateContext({ level });
  };

  return (
    <div
      className={`flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1 overflow-x-auto scrollbar-hide ${className}`}
    >
      {viewLevels.map((view) => {
        const isActive = context.level === view.level;
        return (
          <Tooltip
            key={view.level}
            content={view.description}
            position="bottom"
          >
            <button
              onClick={() => handleLevelChange(view.level)}
              className={`px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2 min-h-[36px] whitespace-nowrap flex-shrink-0 ${
                isActive
                  ? "bg-cyan-500 text-white"
                  : "text-[#9ca3af] hover:text-white hover:bg-white/5"
              }`}
              aria-label={view.description}
            >
              <i className={`${view.icon} text-sm sm:text-base`}></i>
              <span className="hidden sm:inline">{view.label}</span>
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
