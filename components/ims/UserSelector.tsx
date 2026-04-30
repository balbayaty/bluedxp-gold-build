/**
 * User Selector Component
 * Adapted from chemcheck-ai for Hazalyze Platform
 *
 * Changes:
 * - Updated icons: react-icons/fi → remixicon
 * - Updated import paths
 * - Adapted to Hazalyze design system
 */

"use client";

import { useState, useEffect } from "react";

interface User {
  name: string;
  email: string;
  full_name: string;
  enabled: number;
}

interface UserSelectorProps {
  value: string;
  onChange: (email: string) => void;
  label: string;
  required?: boolean;
  isDark?: boolean;
  filterByRole?: string;
  placeholder?: string;
}

export default function UserSelector({
  value,
  onChange,
  label,
  required = false,
  isDark = true,
  filterByRole,
  placeholder = "Select user...",
}: UserSelectorProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/erpnext/users");
      if (response.ok) {
        const data = await response.json();
        const activeUsers = (data.users || []).filter(
          (u: User) => u.enabled === 1,
        );
        setUsers(activeUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedUser = users.find((u) => u.email === value);

  return (
    <div className="w-full">
      <label
        className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-200" : "text-gray-700"}`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className={`w-full px-4 py-3 rounded-lg text-left flex items-center justify-between ${
            isDark
              ? "bg-gray-800 text-white border-gray-700"
              : "bg-white text-gray-900 border-gray-300"
          } border-2 focus:border-blue-500 focus:outline-none`}
        >
          <div className="flex items-center gap-2">
            <i className="ri-user-line text-gray-400"></i>
            <span>
              {selectedUser
                ? `${selectedUser.full_name} (${selectedUser.email})`
                : placeholder}
            </span>
          </div>
          <i className="ri-arrow-down-s-line text-gray-400"></i>
        </button>

        {showDropdown && (
          <div
            className={`absolute z-50 mt-2 w-full rounded-lg shadow-2xl ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } border max-h-96 overflow-hidden`}
          >
            {/* Search */}
            <div className="p-3 border-b border-gray-700">
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className={`w-full pl-10 pr-4 py-2 rounded-lg ${
                    isDark
                      ? "bg-gray-700 text-white"
                      : "bg-gray-50 text-gray-900"
                  } focus:outline-none`}
                  autoFocus
                />
              </div>
            </div>

            {/* User List */}
            <div className="overflow-y-auto max-h-72">
              {loading && (
                <div className="p-4 text-center text-gray-500">
                  Loading users...
                </div>
              )}

              {!loading && filteredUsers.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No users found
                </div>
              )}

              {filteredUsers.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => {
                    onChange(user.email);
                    setShowDropdown(false);
                    setSearchQuery("");
                  }}
                  className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors ${
                    value === user.email
                      ? isDark
                        ? "bg-blue-900/50 text-blue-300"
                        : "bg-blue-50 text-blue-700"
                      : isDark
                        ? "hover:bg-gray-700 text-white"
                        : "hover:bg-gray-50 text-gray-900"
                  }`}
                >
                  <div>
                    <div className="font-semibold">{user.full_name}</div>
                    <div
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {user.email}
                    </div>
                  </div>
                  {value === user.email && (
                    <i className="ri-check-line text-blue-500"></i>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {required && !value && (
        <p className="text-xs mt-1 text-red-500">
          This field is required (ISO 10.2.1 - Clear responsibility)
        </p>
      )}
    </div>
  );
}
