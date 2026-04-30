/**
 * Declarations List Component
 * Full-featured list with filtering, sorting, and actions
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiFileText,
  FiSearch,
  FiFilter,
  FiDownload,
  FiEdit,
  FiEye,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function DeclarationsList() {
  const router = useRouter();
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected" | "cleared"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "status" | "country">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDeclarations();
  }, [filter, sortBy, sortOrder]);

  const loadDeclarations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter.toUpperCase());
      if (searchQuery) params.append("search", searchQuery);
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      const response = await fetch(`/api/customs/declarations?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDeclarations(data.declarations || []);
      }
    } catch (error) {
      console.error("Failed to load declarations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      const timeout = setTimeout(() => {
        loadDeclarations();
      }, 500);
      return () => clearTimeout(timeout);
    } else {
      loadDeclarations();
    }
  };

  const toggleSort = (field: "date" | "status" | "country") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const statusColors = {
    DRAFT: "bg-gray-500",
    SUBMITTED: "bg-yellow-500",
    UNDER_REVIEW: "bg-blue-500",
    APPROVED: "bg-green-500",
    REJECTED: "bg-red-500",
    CLEARED: "bg-cyan-500",
    HELD: "bg-purple-500",
  };

  return (
    <div className="space-y-6">
      {/* Filters & Search */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search declarations..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cleared">Cleared</option>
          </select>
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center space-x-2">
            <FiFilter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg transition-all flex items-center justify-center space-x-2">
            <FiDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <button
                    onClick={() => toggleSort("date")}
                    className="flex items-center space-x-1 hover:text-cyan-400"
                  >
                    <span>Date</span>
                    {sortBy === "date" &&
                      (sortOrder === "asc" ? (
                        <FiChevronUp />
                      ) : (
                        <FiChevronDown />
                      ))}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Declaration Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <button
                    onClick={() => toggleSort("country")}
                    className="flex items-center space-x-1 hover:text-cyan-400"
                  >
                    <span>Country</span>
                    {sortBy === "country" &&
                      (sortOrder === "asc" ? (
                        <FiChevronUp />
                      ) : (
                        <FiChevronDown />
                      ))}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <button
                    onClick={() => toggleSort("status")}
                    className="flex items-center space-x-1 hover:text-cyan-400"
                  >
                    <span>Status</span>
                    {sortBy === "status" &&
                      (sortOrder === "asc" ? (
                        <FiChevronUp />
                      ) : (
                        <FiChevronDown />
                      ))}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    Loading declarations...
                  </td>
                </tr>
              ) : declarations.length > 0 ? (
                declarations.map((declaration) => (
                  <tr
                    key={declaration.id}
                    className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() =>
                      router.push(`/customs/declarations/${declaration.id}`)
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(declaration.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          const newSet = new Set(selectedIds);
                          if (e.target.checked) {
                            newSet.add(declaration.id);
                          } else {
                            newSet.delete(declaration.id);
                          }
                          setSelectedIds(newSet);
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {declaration.submittedAt
                        ? new Date(declaration.submittedAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {declaration.declarationNumber || declaration.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {declaration.country}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {declaration.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          declaration.status === "APPROVED" ||
                          declaration.status === "CLEARED"
                            ? "bg-green-500/20 text-green-400"
                            : declaration.status === "REJECTED"
                              ? "bg-red-500/20 text-red-400"
                              : declaration.status === "HELD"
                                ? "bg-purple-500/20 text-purple-400"
                                : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {declaration.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/customs/declarations/${declaration.id}`,
                            );
                          }}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/customs/declarations/${declaration.id}/edit`,
                            );
                          }}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <FiFileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No declarations found</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Create a new declaration to get started
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {declarations.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {declarations.length} of {declarations.length} declarations
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
              Previous
            </button>
            <button className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
