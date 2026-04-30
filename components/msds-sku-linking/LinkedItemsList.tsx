"use client";

/**
 * Linked Items List Component
 * Displays linked MSDS or SKUs with status and actions
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MSDSSKULink } from "@/types/msdsSkuLinking";
import LinkStatusBadge from "./LinkStatusBadge";
import Tooltip from "@/components/Tooltip";

interface LinkedItemsListProps {
  links: MSDSSKULink[];
  type: "msds" | "sku"; // What type of items to show (opposite of what was passed)
  onApprove?: (linkId: string) => void;
  onReject?: (linkId: string) => void;
  onDelete?: (linkId: string) => void;
  showActions?: boolean;
}

export default function LinkedItemsList({
  links,
  type,
  onApprove,
  onReject,
  onDelete,
  showActions = true,
}: LinkedItemsListProps) {
  if (links.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <i className="ri-link-unlink text-4xl mb-2"></i>
        <p>No linked items</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {links.map((link, index) => {
        const itemId = type === "msds" ? link.msdsId : link.skuId;
        const itemName = type === "msds" ? "MSDS" : "SKU";
        const itemHref =
          type === "msds"
            ? `/chemical/msds/${link.msdsId}`
            : `/wms/skus/${link.skuId}`;

        return (
          <motion.div
            key={link.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-cyan-500/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Link
                    href={itemHref}
                    className="text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    {itemName} {itemId}
                  </Link>
                  <LinkStatusBadge status={link.status} size="sm" />
                  {link.confidenceScore !== undefined && (
                    <span className="text-xs text-gray-400">
                      {link.confidenceScore}% confidence
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-400 space-y-1">
                  <div>
                    <span className="text-gray-500">Strategy:</span>{" "}
                    <span className="text-white">{link.matchingStrategy}</span>
                  </div>
                  {link.approvedAt && (
                    <div>
                      <span className="text-gray-500">Approved:</span>{" "}
                      <span className="text-white">
                        {new Date(link.approvedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {link.notes && (
                    <div className="text-xs text-gray-500 italic mt-2">
                      {link.notes}
                    </div>
                  )}
                </div>
              </div>
              {showActions && (
                <div className="flex items-center gap-2 ml-4">
                  {link.status === "PENDING" && (
                    <>
                      <Tooltip content="Approve">
                        <button
                          onClick={() => onApprove?.(link.id)}
                          className="p-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors"
                        >
                          <i className="ri-check-line"></i>
                        </button>
                      </Tooltip>
                      <Tooltip content="Reject">
                        <button
                          onClick={() => onReject?.(link.id)}
                          className="p-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors"
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip content="Delete">
                    <button
                      onClick={() => onDelete?.(link.id)}
                      className="p-2 bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded hover:bg-gray-500/30 transition-colors"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
