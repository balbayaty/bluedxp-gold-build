/**
 * QHSE Cross-Module Links Component
 * Displays interconnected links to other modules
 */

"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiLink, FiExternalLink } from "react-icons/fi";

export interface CrossModuleLink {
  label: string;
  href: string;
  icon?: string;
  description?: string;
  count?: number;
  badge?: string;
}

interface CrossModuleLinksProps {
  title?: string;
  links: CrossModuleLink[];
  className?: string;
}

export default function CrossModuleLinks({
  title = "Related Modules",
  links,
  className = "",
}: CrossModuleLinksProps) {
  if (links.length === 0) return null;

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <FiLink className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {links.map((link, index) => (
          <motion.div
            key={link.href}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              href={link.href}
              className="block p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {link.icon && (
                      <i className={`${link.icon} text-blue-600`}></i>
                    )}
                    <span className="font-medium text-gray-900 group-hover:text-blue-600">
                      {link.label}
                    </span>
                    {link.badge && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {link.badge}
                      </span>
                    )}
                  </div>
                  {link.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {link.description}
                    </p>
                  )}
                  {link.count !== undefined && (
                    <p className="text-xs text-gray-400 mt-1">
                      {link.count} items
                    </p>
                  )}
                </div>
                <FiExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
