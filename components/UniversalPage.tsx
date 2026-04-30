"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import { mockDataGenerators } from "@/utils/mockDataGenerators";
import { format } from "date-fns";

interface UniversalPageProps {
  title: string;
  description: string;
  icon: string;
  systemInfo?: {
    sap?: string;
    oracle?: string;
    manhattan?: string;
    custom?: string;
  };
  examples?: string[];
  dataGenerator?: keyof typeof mockDataGenerators;
  columns?: Array<{
    key: string;
    label: string;
    tooltip?: string;
    render?: (item: any) => React.ReactNode;
  }>;
  actions?: React.ReactNode;
}

export default function UniversalPage({
  title,
  description,
  icon,
  systemInfo,
  examples,
  dataGenerator,
  columns,
  actions,
}: UniversalPageProps) {
  const [data, setData] = useState(() => {
    if (dataGenerator && mockDataGenerators[dataGenerator]) {
      return mockDataGenerators[dataGenerator](50);
    }
    return [];
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");

  const filteredData = useMemo(() => {
    return data.filter((item: any) => {
      const matchesSearch = Object.values(item).some((val: any) =>
        String(val).toLowerCase().includes(searchQuery.toLowerCase()),
      );
      return matchesSearch;
    });
  }, [data, searchQuery]);

  const stats = [
    {
      label: "Total Items",
      value: data.length,
      icon,
      tooltip: `Total number of ${title.toLowerCase()}`,
      trend: "up" as const,
    },
  ];

  return (
    <PageTemplate
      title={title}
      description={description}
      icon={icon}
      systemInfo={systemInfo}
      examples={examples}
      stats={stats}
      actions={actions}
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
      </div>

      {/* Data Display */}
      {columns && columns.length > 0 ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider"
                    >
                      {col.tooltip ? (
                        <Tooltip content={col.tooltip} position="bottom">
                          <span className="cursor-help">{col.label}</span>
                        </Tooltip>
                      ) : (
                        col.label
                      )}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredData.slice(0, 50).map((item: any, index: number) => (
                  <motion.tr
                    key={item.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className="px-6 py-4 whitespace-nowrap">
                        {col.render ? (
                          col.render(item)
                        ) : (
                          <span className="text-sm text-white">
                            {item[col.key]}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Details" position="top">
                          <button className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors">
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        <Tooltip content="Edit" position="top">
                          <button className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors">
                            <i className="ri-edit-line"></i>
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <p className="text-white text-center">
            {title} functionality coming soon...
          </p>
        </div>
      )}
    </PageTemplate>
  );
}
