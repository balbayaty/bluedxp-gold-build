# 🔍 COMPREHENSIVE CODE ANALYSIS REPORT
## Deep Analysis of Entire Codebase

**Generated:** 2025-12-22T08:07:48.034Z
**Platform:** BlueDXP Platform (Hazalyze Module)

---

## 📊 SUMMARY

- **Unused Exports:** 2797
- **Commented Code Blocks:** 5604
- **Files Analyzed:** 2513

---

## 🔴 UNUSED EXPORTS

These exports are defined but never imported or used:

- **CrossModuleQRIntelligenceDashboard** in `app\admin\qr-analytics\cross-module\page.tsx`
- **DetailedQRAnalyticsDashboard** in `app\admin\qr-analytics\detailed\page.tsx`
- **ExecutiveQRAnalyticsDashboard** in `app\admin\qr-analytics\executive\page.tsx`
- **OperationalQRAnalyticsDashboard** in `app\admin\qr-analytics\operational\page.tsx`
- **QRAnalyticsDashboard** in `app\admin\qr-analytics\page.tsx`
- **RealTimeQRMonitoringDashboard** in `app\admin\qr-analytics\realtime\page.tsx`
- **RevolutionaryQRShowcase** in `app\admin\qr-analytics\revolutionary\page.tsx`
- **AgentOrchestrationPage** in `app\agent-orchestration\page.tsx`
- **ArabicNLPPage** in `app\ai\arabic-nlp\page.tsx`
- **AIPredictiveInsightsPage** in `app\ai\insights\page.tsx`
- **IntelligentRecommendationsPage** in `app\ai\recommendations\page.tsx`
- **AnomalyDetectionPage** in `app\ai-vision\anomalies\page.tsx`
- **BatchVisionAnalysisPage** in `app\ai-vision\batch\page.tsx`
- **ChemicalVisionPage** in `app\ai-vision\chemical\page.tsx`
- **HealthcareVisionPage** in `app\ai-vision\healthcare\page.tsx`
- **VisionAnalysisHistoryPage** in `app\ai-vision\history\page.tsx`
- **IntegrationActionsPage** in `app\ai-vision\integration\actions\page.tsx`
- **IntegrationMapPage** in `app\ai-vision\integration\map\page.tsx`
- **IntegrationSettingsPage** in `app\ai-vision\integration\settings\page.tsx`
- **IntegrationWorkflowsPage** in `app\ai-vision\integration\workflows\page.tsx`
- **LearningAccuracyPage** in `app\ai-vision\learning\accuracy\page.tsx`
- **LearningFeedbackPage** in `app\ai-vision\learning\feedback\page.tsx`
- **HowLearningWorksPage** in `app\ai-vision\learning\how-it-works\page.tsx`
- **LearningSystemPage** in `app\ai-vision\learning\page.tsx`
- **LearningPatternsPage** in `app\ai-vision\learning\patterns\page.tsx`
- **LearningRulesPage** in `app\ai-vision\learning\rules\page.tsx`
- **LogisticsVisionPage** in `app\ai-vision\logistics\page.tsx`
- **ManufacturingVisionPage** in `app\ai-vision\manufacturing\page.tsx`
- **AIVisionPage** in `app\ai-vision\page.tsx`
- **SceneUnderstandingPage** in `app\ai-vision\scene\page.tsx`
- **LiveStreamingPage** in `app\ai-vision\stream\page.tsx`
- **ObjectTrackingPage** in `app\ai-vision\tracking\page.tsx`
- **VideoAnalysisPage** in `app\ai-vision\video\page.tsx`
- **AIVisionDemo** in `app\ai-vision-demo\page.tsx`
- **UnifiedVisionDashboard** in `app\ai-vision-unified\page.tsx`
- **EnhancedUnifiedVisionDashboard** in `app\ai-vision-unified-enhanced\page.tsx`
- **UnifiedAnalyticsPage** in `app\analytics\unified\page.tsx`
- **initializeQRWebSocket** in `app\api\qr\realtime\route.ts`
- **broadcastNetworkUpdate** in `app\api\qr\realtime\route.ts`
- **broadcastAgentInsight** in `app\api\qr\realtime\route.ts`
- **broadcastAchievementUnlock** in `app\api\qr\realtime\route.ts`
- **broadcastLeaderboardUpdate** in `app\api\qr\realtime\route.ts`
- **initializeWebSocketServer** in `app\api\realtime\server.ts`
- **getWebSocketServer** in `app\api\realtime\server.ts`
- **broadcastToTenant** in `app\api\realtime\server.ts`
- **ApprovalsPage** in `app\approvals\page.tsx`
- **AuditManagementPage** in `app\audit-management\page.tsx`
- **AuditTrailPage** in `app\audit-trail\page.tsx`
- **BatchManagement** in `app\batches\page.tsx`
- **BinMaster** in `app\bins\page.tsx`


... and 2747 more


---

## 💬 COMMENTED CODE BLOCKS

Large commented code blocks that might need attention:

- **app\abc-analysis\page.tsx** (25 lines)
  ```
  /* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 to...
  ```

- **app\admin\qr-analytics\cross-module\page.tsx** (23 lines)
  ```
  /* Damage Integration */}
          {intelligence?.damage && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4 fl...
  ```

- **app\admin\qr-analytics\detailed\page.tsx** (53 lines)
  ```
  /**
 * Detailed QR Analytics Dashboard
 * Deep-dive analytics with drill-down capabilities
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export defau...
  ```

- **app\admin\qr-analytics\executive\page.tsx** (13 lines)
  ```
  /**
 * Executive QR Analytics Dashboard
 * World-Class Executive Dashboard - Exceeding McKinsey/Deloitte/EY Standards
 * Future-Ready (2024-2040)
 * 
 * Features:
 * - High-level KPIs and metric...
  ```

- **app\admin\qr-analytics\executive\page.tsx** (37 lines)
  ```
  /* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-ce...
  ```

- **app\admin\qr-analytics\executive\page.tsx** (33 lines)
  ```
  /* Module Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            ...
  ```

- **app\admin\qr-analytics\operational\page.tsx** (59 lines)
  ```
  /**
 * Operational QR Analytics Dashboard
 * Real-time operational intelligence and monitoring
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
...
  ```

- **app\admin\qr-analytics\operational\page.tsx** (23 lines)
  ```
  /* Module Performance */}
        {metrics?.scansByModule && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">...
  ```

- **app\admin\qr-analytics\page.tsx** (12 lines)
  ```
  /* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <i className="ri-qr-code-line text-purple-400"></i>
            ...
  ```

- **app\admin\qr-analytics\page.tsx** (60 lines)
  ```
  /* Filters and Date Range */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
 ...
  ```

- **app\admin\qr-analytics\page.tsx** (96 lines)
  ```
  /* Scans Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">...
  ```

- **app\admin\qr-analytics\realtime\page.tsx** (25 lines)
  ```
  /* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <motion.di...
  ```

- **app\admin\qr-analytics\revolutionary\page.tsx** (25 lines)
  ```
  /* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0....
  ```

- **app\admin\qr-analytics\revolutionary\page.tsx** (38 lines)
  ```
  /* Stats Overview */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-...
  ```

- **app\admin\qr-analytics\revolutionary\page.tsx** (121 lines)
  ```
  /* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <OverviewTab key="overview" />
          )}
          {activeTab === 'network' && (
    ...
  ```

- **app\agent-orchestration\page.tsx** (53 lines)
  ```
  /* Agents Grid */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 class...
  ```

- **app\ai\arabic-nlp\page.tsx** (17 lines)
  ```
  /**
 * Arabic NLP Engine Page
 * 
 * Comprehensive Arabic-Native NLP interface with sentiment & intent analysis
 * 
 * Features:
 * - Real-time Arabic text analysis
 * - Sentiment analysis with commit...
  ```

- **app\ai\arabic-nlp\page.tsx** (76 lines)
  ```
  /* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
         ...
  ```

- **app\ai\arabic-nlp\page.tsx** (21 lines)
  ```
  /* Real-time Toggle */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
  ...
  ```

- **app\ai\arabic-nlp\page.tsx** (12 lines)
  ```
  /* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex ...
  ```


... and 5584 more


---

## 📝 RECOMMENDATIONS

1. **Review Unused Exports:** Consider removing or documenting why they exist
2. **Review Commented Code:** Decide if it should be removed or uncommented
3. **Check for Dead Code:** Files that are never imported
4. **Verify Route Registration:** Ensure all pages are in navigation

---

**Note:** This is an automated analysis. Manual review recommended.
