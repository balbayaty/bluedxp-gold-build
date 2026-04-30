/**
 * UserProfileMenu - Modern Interactive User Profile Dropdown
 * 
 * Inspired by ChatGPT/Anthropic's beautiful user menus with:
 * - Full name with Kunya (Arabic cultural honorific like "Abu Khalid")
 * - Interactive hover effects and smooth animations
 * - Quick access to settings, help, and logout
 * - Role badge with beautiful styling
 * - Email display
 * - Modern glass-morphism design
 * 
 * 4IR & 5IR Aligned • Human-Centric • Culturally Localized
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { User, UserRole } from "@/types/user";

interface UserProfileMenuProps {
  isDarkMode: boolean;
  user: User | null;
  tenant?: any;
}

// Role display configuration with colors and labels
const roleConfig: Record<UserRole, { label: string; color: string; bgColor: string; icon: string }> = {
  SYSTEM_ADMIN: { 
    label: "System Administrator", 
    color: "text-red-400", 
    bgColor: "bg-red-500/20 border-red-500/30",
    icon: "ri-shield-star-line"
  },
  BUSINESS_DEVELOPMENT_MANAGER: { 
    label: "Business Development", 
    color: "text-purple-400", 
    bgColor: "bg-purple-500/20 border-purple-500/30",
    icon: "ri-line-chart-line"
  },
  TRANSPORT_GENERAL_MANAGER: { 
    label: "Transport Manager", 
    color: "text-blue-400", 
    bgColor: "bg-blue-500/20 border-blue-500/30",
    icon: "ri-truck-line"
  },
  WAREHOUSE_HEAD: { 
    label: "Warehouse Head", 
    color: "text-cyan-400", 
    bgColor: "bg-cyan-500/20 border-cyan-500/30",
    icon: "ri-building-4-line"
  },
  OPERATIONS_MANAGER: { 
    label: "Operations Manager", 
    color: "text-emerald-400", 
    bgColor: "bg-emerald-500/20 border-emerald-500/30",
    icon: "ri-settings-3-line"
  },
  CUSTOMER_ACCOUNT_MANAGER: { 
    label: "Account Manager", 
    color: "text-amber-400", 
    bgColor: "bg-amber-500/20 border-amber-500/30",
    icon: "ri-user-star-line"
  },
  WAREHOUSE_SUPERVISOR: { 
    label: "Warehouse Supervisor", 
    color: "text-teal-400", 
    bgColor: "bg-teal-500/20 border-teal-500/30",
    icon: "ri-user-settings-line"
  },
  WAREHOUSE_OPERATOR: { 
    label: "Warehouse Operator", 
    color: "text-sky-400", 
    bgColor: "bg-sky-500/20 border-sky-500/30",
    icon: "ri-user-line"
  },
  QUALITY_MANAGER: { 
    label: "Quality Manager", 
    color: "text-green-400", 
    bgColor: "bg-green-500/20 border-green-500/30",
    icon: "ri-shield-check-line"
  },
  INVENTORY_SPECIALIST: { 
    label: "Inventory Specialist", 
    color: "text-indigo-400", 
    bgColor: "bg-indigo-500/20 border-indigo-500/30",
    icon: "ri-stack-line"
  },
  CUSTOMER_USER: { 
    label: "Customer User", 
    color: "text-gray-400", 
    bgColor: "bg-gray-500/20 border-gray-500/30",
    icon: "ri-user-3-line"
  },
  CUSTOMER_ADMIN: { 
    label: "Customer Admin", 
    color: "text-orange-400", 
    bgColor: "bg-orange-500/20 border-orange-500/30",
    icon: "ri-admin-line"
  },
};

// Menu items configuration
const menuItems = [
  { 
    id: "profile", 
    label: "My Profile", 
    description: "View and edit your profile",
    icon: "ri-user-line", 
    href: "/settings/profile",
    color: "cyan"
  },
  { 
    id: "settings", 
    label: "Settings", 
    description: "Preferences & configuration",
    icon: "ri-settings-3-line", 
    href: "/settings",
    color: "purple"
  },
  { 
    id: "notifications", 
    label: "Notifications", 
    description: "Manage your alerts",
    icon: "ri-notification-3-line", 
    href: "/settings/notifications",
    color: "amber"
  },
  { 
    id: "help", 
    label: "Help & Support", 
    description: "Documentation & FAQs",
    icon: "ri-question-line", 
    href: "/help",
    color: "emerald"
  },
  { 
    id: "keyboard", 
    label: "Keyboard Shortcuts", 
    description: "View all shortcuts",
    icon: "ri-keyboard-line", 
    action: "keyboard",
    color: "blue"
  },
];

export default function UserProfileMenu({ isDarkMode, user, tenant }: UserProfileMenuProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  if (!user) return null;

  // Get user display info
  const displayName = user.displayName || user.fullName || user.name || "User";
  const kunya = user.kunya; // e.g., "Abu Khalid"
  const email = user.email;
  const role = user.role;
  const roleInfo = roleConfig[role] || roleConfig.CUSTOMER_USER;
  
  // Get initials for avatar
  const getInitials = () => {
    const name = user.fullName || user.name || "";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || "U";
  };

  // Handle menu item click
  const handleItemClick = (item: typeof menuItems[0]) => {
    if (item.action === "keyboard") {
      // Dispatch keyboard shortcuts event
      window.dispatchEvent(new CustomEvent("toggle-keyboard-shortcuts"));
      setIsOpen(false);
    } else if (item.href) {
      router.push(item.href);
      setIsOpen(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.push("/login");
  };

  return (
    <div ref={menuRef} className="relative">
      {/* Profile Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border transition-all duration-300 ${
          isOpen
            ? isDarkMode
              ? "bg-gray-800/80 border-cyan-500/50 shadow-lg shadow-cyan-500/10"
              : "bg-white border-cyan-500 shadow-lg shadow-cyan-500/20"
            : isDarkMode
              ? "bg-gray-800/40 border-gray-700/50 hover:bg-gray-800/60 hover:border-gray-600"
              : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
        }`}
      >
        {/* Avatar */}
        <div className="relative">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={displayName}
              className="w-8 h-8 rounded-lg object-cover border-2 border-white/20"
            />
          ) : (
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
              {getInitials()}
            </div>
          )}
          {/* Online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full" />
        </div>

        {/* Name and Kunya - Hidden on very small screens */}
        <div className="hidden sm:flex flex-col items-start min-w-0">
          <div className={`text-sm font-semibold truncate max-w-[120px] ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {kunya || displayName.split(" ")[0]}
          </div>
          {kunya && (
            <div className={`text-xs truncate max-w-[120px] ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {displayName.split(" ")[0]}
            </div>
          )}
        </div>

        {/* Dropdown arrow */}
        <motion.i
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className={`ri-arrow-down-s-line text-lg ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`absolute right-0 mt-2 w-80 rounded-2xl border shadow-2xl overflow-hidden z-[100] ${
              isDarkMode
                ? "bg-gray-900/95 border-gray-700/50 backdrop-blur-xl"
                : "bg-white/95 border-gray-200 backdrop-blur-xl"
            }`}
            style={{
              boxShadow: isDarkMode
                ? "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(6, 182, 212, 0.1)"
                : "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 40px rgba(6, 182, 212, 0.05)",
            }}
          >
            {/* User Info Header */}
            <div className={`p-4 border-b ${isDarkMode ? "border-gray-700/50" : "border-gray-200"}`}>
              <div className="flex items-start gap-3">
                {/* Large Avatar */}
                <div className="relative flex-shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={displayName}
                      className="w-14 h-14 rounded-xl object-cover border-2 border-white/20 shadow-lg"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                      {getInitials()}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full flex items-center justify-center">
                    <i className="ri-check-line text-white text-[8px]" />
                  </div>
                </div>

                {/* User Details */}
                <div className="flex-1 min-w-0">
                  {/* Full Name */}
                  <div className={`text-base font-bold truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {displayName}
                  </div>
                  
                  {/* Kunya - Cultural honorific */}
                  {kunya && (
                    <div className={`text-sm font-medium flex items-center gap-1.5 mt-0.5 ${isDarkMode ? "text-cyan-400" : "text-cyan-600"}`}>
                      <i className="ri-user-heart-line text-xs" />
                      {kunya}
                    </div>
                  )}
                  
                  {/* Email */}
                  <div className={`text-xs truncate mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {email}
                  </div>
                  
                  {/* Role Badge */}
                  <div className={`inline-flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg text-xs font-medium border ${roleInfo.bgColor} ${roleInfo.color}`}>
                    <i className={`${roleInfo.icon} text-sm`} />
                    {roleInfo.label}
                  </div>
                </div>
              </div>

              {/* Tenant/Organization Info */}
              {tenant?.name && (
                <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? "bg-gray-800/50" : "bg-gray-100"}`}>
                  <i className={`ri-building-line text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                  <span className={`text-xs font-medium truncate ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {tenant.name}
                  </span>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="p-2">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  onHoverStart={() => setHoveredItem(item.id)}
                  onHoverEnd={() => setHoveredItem(null)}
                  whileHover={{ x: 4 }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${
                    hoveredItem === item.id
                      ? isDarkMode
                        ? "bg-gray-800/80"
                        : "bg-gray-100"
                      : "hover:bg-gray-800/40"
                  }`}
                >
                  {/* Icon with color */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    hoveredItem === item.id
                      ? `bg-${item.color}-500/20 text-${item.color}-400`
                      : isDarkMode
                        ? "bg-gray-800 text-gray-400"
                        : "bg-gray-100 text-gray-500"
                  }`}>
                    <i className={`${item.icon} text-lg`} />
                  </div>

                  {/* Label and Description */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {item.label}
                    </div>
                    <div className={`text-xs truncate ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                      {item.description}
                    </div>
                  </div>

                  {/* Arrow */}
                  <i className={`ri-arrow-right-s-line text-lg transition-transform group-hover:translate-x-1 ${
                    isDarkMode ? "text-gray-600" : "text-gray-400"
                  }`} />
                </motion.button>
              ))}
            </div>

            {/* Divider */}
            <div className={`mx-4 border-t ${isDarkMode ? "border-gray-700/50" : "border-gray-200"}`} />

            {/* Bottom Section - Upgrade & Logout */}
            <div className="p-2">
              {/* Upgrade Banner (if applicable) */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className={`mb-2 p-3 rounded-xl cursor-pointer transition-all ${
                  isDarkMode
                    ? "bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 border border-purple-500/30 hover:border-purple-400/50"
                    : "bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 border border-purple-200 hover:border-purple-300"
                }`}
                onClick={() => {
                  router.push("/upgrade");
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <i className="ri-vip-crown-line text-white text-lg" />
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      Upgrade Plan
                    </div>
                    <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Unlock premium features
                    </div>
                  </div>
                  <i className={`ri-external-link-line ${isDarkMode ? "text-purple-400" : "text-purple-500"}`} />
                </div>
              </motion.div>

              {/* Learn More */}
              <motion.button
                whileHover={{ x: 4 }}
                onClick={() => {
                  router.push("/about");
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  isDarkMode ? "hover:bg-gray-800/60" : "hover:bg-gray-100"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isDarkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"
                }`}>
                  <i className="ri-information-line text-lg" />
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Learn More
                  </div>
                  <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                    About BlueDXP Platform
                  </div>
                </div>
                <i className={`ri-arrow-right-s-line text-lg ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
              </motion.button>

              {/* Logout Button */}
              <motion.button
                whileHover={{ x: 4 }}
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all mt-1 group ${
                  isDarkMode
                    ? "hover:bg-red-500/10"
                    : "hover:bg-red-50"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  isDarkMode
                    ? "bg-gray-800 text-gray-400 group-hover:bg-red-500/20 group-hover:text-red-400"
                    : "bg-gray-100 text-gray-500 group-hover:bg-red-100 group-hover:text-red-500"
                }`}>
                  <i className="ri-logout-box-r-line text-lg" />
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium transition-colors ${
                    isDarkMode
                      ? "text-white group-hover:text-red-400"
                      : "text-gray-900 group-hover:text-red-600"
                  }`}>
                    Log Out
                  </div>
                  <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                    Sign out of your account
                  </div>
                </div>
              </motion.button>
            </div>

            {/* Footer */}
            <div className={`px-4 py-3 border-t text-center ${isDarkMode ? "border-gray-700/50 bg-gray-800/30" : "border-gray-200 bg-gray-50"}`}>
              <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                BlueDXP Platform v2.0 • <span className="text-cyan-500">Enterprise Ready</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
