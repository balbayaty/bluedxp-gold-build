'use client';

/**
 * GCC Compliance Intelligence Page
 *
 * Main page for Saudi Arabia & GCC Transport Compliance.
 * Integrates Daleeli, Bayan, truck bans, and equipment compatibility.
 *
 * @route /transportation/gcc-compliance
 */

import React from 'react';
import { GCCComplianceDashboard } from '@/components/gcc-compliance';

export default function GCCCompliancePage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <GCCComplianceDashboard />
    </div>
  );
}
