"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Tooltip from "./Tooltip";

export interface ModuleLink {
  label: string;
  href: string;
  icon: string;
  description?: string;
  badge?: string | number;
}

interface ModuleLinksProps {
  links: ModuleLink[];
  title?: string;
  className?: string;
}

export default function ModuleLinks({
  links,
  title = "Related Modules",
  className = "",
}: ModuleLinksProps) {
  if (links.length === 0) return null;

  return (
    <div
      className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 ${className}`}
    >
      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <i className="ri-links-line"></i>
        {title}
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {links.map((link, index) => (
          <motion.div
            key={link.href}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Tooltip content={link.description || link.label} position="top">
              <Link
                href={link.href}
                className="flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-lg transition-all group"
              >
                <i
                  className={`${link.icon} text-2xl text-[#9ca3af] group-hover:text-cyan-400 transition-colors`}
                ></i>
                <div className="text-center">
                  <div className="text-xs text-white font-medium group-hover:text-cyan-400 transition-colors">
                    {link.label}
                  </div>
                  {link.badge && (
                    <div className="text-xs text-[#9ca3af] mt-1">
                      {link.badge}
                    </div>
                  )}
                </div>
              </Link>
            </Tooltip>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
