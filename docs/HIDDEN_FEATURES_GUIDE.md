# 🔍 Hidden Features & Modules Guide

**For Users Without Coding Experience**

This guide will help you discover all the modules, features, and tools that exist in your BlueDXP platform but might not be immediately visible in the navigation bar.

---

## 📊 Quick Summary

- **Total Registered Modules:** 31+ modules
- **Total Pages:** 512 pages
- **Pages Visible in Navigation:** 449 pages
- **Pages NOT in Navigation:** 63 pages (but still accessible!)
- **Auto-Generated Navigation:** Yes - all modules should appear automatically

---

## 🎯 How to See ALL Modules

### Method 1: Check the Debug Page (Easiest!)

1. **Open your browser** and go to:
   ```
   http://localhost:3002/debug/modules
   ```
   (Replace `3002` with your actual port number if different)

2. **This page shows:**
   - All 31+ registered modules
   - Each module's routes (pages)
   - Components and services available
   - Module descriptions

### Method 2: Check the Sidebar Navigation

1. **Look for "All Modules (Auto)"** section in your sidebar
2. This section is automatically generated from the module registry
3. It should show all registered modules with their routes

### Method 3: Check the API Directly

1. **Open your browser** and go to:
   ```
   http://localhost:3002/api/modules/list
   ```
2. This will show you a JSON list of all modules

---

## 📋 All 31+ Registered Modules

Here's the complete list of modules in your system:

1. ✅ **WMS** - Warehouse Management System
2. ✅ **ISO-IMS** - ISO Compliance Management
3. ✅ **TMS** - Transportation Management System
4. ✅ **Proposals & RFQ** - Proposal and Request for Quote Management
5. ✅ **MaaS** - Manufacturing as a Service
6. ✅ **Compliance** - General Compliance Management
7. ✅ **Trade Compliance** - Trade and Customs Compliance
8. ✅ **Process Lifecycle** - Process Management
9. ✅ **QHSE** - Quality, Health, Safety, Environment
10. ✅ **Facility Management** - Facility and Building Management
11. ✅ **Marketplace** - Service Marketplace
12. ✅ **Warehouse Network** - Multi-Warehouse Network Management
13. ✅ **Brand Messaging** - Brand Communication
14. ✅ **Truth Engine** - Data Integrity and Verification
15. ✅ **HR** - Human Resources
16. ✅ **Finance** - Financial Management
17. ✅ **CRM** - Customer Relationship Management
18. ✅ **Procurement** - Procurement Management
19. ✅ **Project Management** - Project Planning and Tracking
20. ✅ **Business Intelligence** - Analytics and Reporting
21. ✅ **Hazalyze** - AI & Intelligence Module (Core AI Brain)
22. ✅ **IoT** - Internet of Things Integration
23. ✅ **Digital Signature** - Digital Signature Management
24. ✅ **Pulse** - Real-time Event Monitoring
25. ✅ **Export House** - Export Management
26. ✅ **DMARC Monitoring** - Email Security Monitoring
27. ✅ **OPC UA Monitoring** - Industrial Protocol Monitoring
28. ✅ **ICT Hardware Ecosystem** - Hardware Management
29. ✅ **External Integrations** - Third-party Integrations
30. ✅ **MSDS** - Material Safety Data Sheets
31. ✅ **Customs** - Customs & Regulatory Integration
32. ✅ **ETW** - Export Trade Warehouse
33. ✅ **Email** - Email Service Management
34. ✅ **Intelligence Analytics** - Advanced Analytics
35. ✅ **Workspace** - Workspace Management
36. ✅ **System Health** - System Health Monitoring

---

## 🔒 Admin-Only Features (Hidden Unless You're Admin)

### Module Management Dashboard
**Path:** `/settings/module-management`
**Access:** SYSTEM_ADMIN or IT_ADMIN only

**Features:**
- Module Overview (all enabled modules)
- Module Manager (lifecycle, health monitoring)
- Module Communication (inter-module messaging)
- Module Isolation (sandboxing, resource limits)

**How to Access:**
1. Make sure you're logged in as SYSTEM_ADMIN or IT_ADMIN
2. Go to Settings → Module Management
3. If you don't see it, you don't have admin access

---

## 📄 Pages That Exist But Aren't in Main Navigation

These pages exist and work, but they might not be in the main navigation menu. You can still access them by typing the URL directly:

### CRM Pages (Not in Main Nav)
- `/crm/dashboard` - CRM Dashboard
- `/crm/accounts` - Account Management
- `/crm/contacts` - Contact Management
- `/crm/opportunities` - Sales Opportunities
- `/crm/leads` - Lead Management
- `/crm/forecast` - Sales Forecast
- `/crm/activities` - Activity Tracking

### Business Intelligence Pages
- `/business-intelligence/dashboard` - BI Dashboard
- `/business-intelligence/data-warehouse` - Data Warehouse
- `/business-intelligence/reports` - Reports

### Truth Engine Pages
- `/truth-engine/dashboard` - Truth Engine Dashboard
- `/truth-engine/claims` - Claims Management
- `/truth-engine/knowledge-graph` - Knowledge Graph

### Facility Management Pages
- `/facility/utility-bills` - Utility Bills Management
- `/facility/utility-bills/[id]` - Individual Bill View
- `/facility/utility-bills/comparison` - Bill Comparison
- `/facility/utility-bills/analytics` - Utility Analytics

### ICT Hardware Ecosystem Pages
- `/ict-hardware-ecosystem` - Main Dashboard
- `/ict-hardware-ecosystem/products` - Products
- `/ict-hardware-ecosystem/partnerships` - Partnerships
- `/ict-hardware-ecosystem/manufacturing` - Manufacturing

### Liability Management Pages
- `/liability/dashboard` - Liability Dashboard
- `/liability/compliance` - Compliance
- `/liability/claims` - Claims
- `/liability/claims/[id]` - Individual Claim
- `/liability/claims/new` - New Claim
- `/liability/rules` - Rules Management
- `/liability/rules/new` - New Rule
- `/liability/calculator` - Liability Calculator
- `/liability/assessments` - Assessments
- `/liability/assessments/[id]` - Individual Assessment

### Other Pages
- `/projects` - Projects List
- `/projects/[id]` - Individual Project
- `/purchase-orders` - Purchase Orders
- `/task-management` - Task Management
- `/integration` - Integration Management
- `/feature-registry` - Feature Registry
- `/feature-demo` - Feature Demo
- `/websocket/streams` - WebSocket Streams
- `/users` - User Management (direct access)
- `/dashboard` - Main Dashboard (alternative path)
- `/dashboard/warehouse-head` - Warehouse Head Dashboard
- `/dashboard/supervisor` - Supervisor Dashboard
- `/dashboard/operations` - Operations Dashboard
- `/dashboard/customer` - Customer Dashboard
- `/dashboard/business-development` - Business Development Dashboard
- `/dashboard/account-manager` - Account Manager Dashboard

---

## 🎨 Special Features & Tools

### 1. AI Vision Features (Hazalyze Module)
All accessible via navigation, but here's the complete list:
- `/ai-vision-unified` - Unified Vision Dashboard
- `/ai-vision` - Image Analysis
- `/ai-vision/video` - Video Analysis
- `/ai-vision/stream` - Live Streaming
- `/ai-vision/chemical` - Chemical Vision
- `/ai-vision/manufacturing` - Manufacturing Vision
- `/ai-vision/logistics` - Logistics Vision
- `/ai-vision/healthcare` - Healthcare Vision
- `/ai-vision/scene` - Scene Understanding
- `/ai-vision/tracking` - Object Tracking
- `/ai-vision/anomalies` - Anomaly Detection
- `/ai-vision/history` - Analysis History

### 2. Intelligent Orchestration (Hazalyze Module)
- `/intelligent-orchestration/process-mining` - Process Mining
- `/intelligent-orchestration/root-cause` - Root Cause Analysis
- `/intelligent-orchestration/predictive` - Predictive Analytics
- `/intelligent-orchestration/communication` - Communication Orchestration
- `/intelligent-orchestration/compliance` - Autonomous Compliance
- `/intelligent-orchestration/insights` - Automated Insights

### 3. Agent Orchestration
- `/agent-orchestration` - Agent Orchestration Dashboard

### 4. Knowledge Base
- `/knowledge-base` - Knowledge Base Viewer

### 5. ASN Intelligence (Hazalyze Module)
- `/asn` - ASN Intelligence
- `/asn/dashboard` - ASN Dashboard
- `/asn/processing` - ASN Processing
- `/asn/analytics` - ASN Analytics

---

## 🔧 Settings & Configuration Pages

### System Settings
- `/settings` - Main Settings Page
- `/settings/parameters` - System Parameters
- `/settings/warehouse` - Warehouse Configuration
- `/settings/workflow` - Workflow Automation
- `/settings/users` - User Management
- `/settings/notifications` - Notification Settings
- `/settings/templates` - Templates Management
- `/settings/ai` - AI Settings (Hazalyze)
- `/settings/module-management` - Module Management (Admin Only)

---

## 🚀 How to Access Hidden Features

### Step-by-Step Instructions:

1. **Check Your Role:**
   - Some features are only visible to certain user roles
   - Admin features require SYSTEM_ADMIN or IT_ADMIN role

2. **Use the Debug Page:**
   - Go to `/debug/modules` to see all modules
   - This shows everything that's registered

3. **Check Auto-Generated Navigation:**
   - Look for "All Modules (Auto)" in the sidebar
   - This should show all registered modules

4. **Direct URL Access:**
   - If you know a page exists, you can type the URL directly
   - Example: `http://localhost:3002/crm/dashboard`

5. **Use the Search/Command Palette:**
   - Press `Ctrl+K` (or `Cmd+K` on Mac) to open the command palette
   - Type the name of the feature you're looking for
   - This should help you find hidden pages

---

## ⚠️ Common Issues & Solutions

### Issue 1: "I don't see all modules in navigation"
**Solution:**
- Check if you're looking at the "All Modules (Auto)" section
- Go to `/debug/modules` to verify modules are registered
- Check browser console for errors (F12)

### Issue 2: "I can't access admin features"
**Solution:**
- Make sure you're logged in with SYSTEM_ADMIN or IT_ADMIN role
- Admin features are intentionally hidden from regular users

### Issue 3: "Some pages show 404"
**Solution:**
- Some routes might be dynamic (require parameters)
- Check the module definition to see if routes need parameters
- Example: `/asn/processing/[id]` needs an ID parameter

### Issue 4: "Auto-generated navigation not showing"
**Solution:**
- Check browser console for errors
- Verify `/api/modules/list` returns modules
- Check if `autoModules` is being loaded in Layout.tsx

---

## 📝 Notes

1. **Navigation is Permission-Based:**
   - Some items are hidden based on your user role
   - This is intentional for security

2. **Auto-Generated vs Manual Navigation:**
   - Default navigation is manually defined
   - Auto-generated navigation shows all modules
   - Both should be visible

3. **Dynamic Routes:**
   - Some routes have `[id]` or `[slug]` - these need parameters
   - They won't appear in navigation but are accessible programmatically

4. **Module Status:**
   - All modules should be enabled by default
   - Disabled modules won't appear in navigation

---

## ✅ Verification Checklist

To verify everything is working:

- [ ] Visit `/debug/modules` - should show 31+ modules
- [ ] Check sidebar for "All Modules (Auto)" section
- [ ] Visit `/api/modules/list` - should return JSON with modules
- [ ] Check browser console (F12) for any errors
- [ ] Verify your user role has appropriate permissions
- [ ] Try accessing a hidden page directly via URL

---

## 🆘 Need Help?

If you still can't see modules or features:

1. **Check the browser console** (F12) for errors
2. **Check the network tab** to see if API calls are failing
3. **Verify your user role** has the right permissions
4. **Check the documentation** in `/docs/HIDDEN_FEATURES_ANALYSIS.md`

---

**Last Updated:** Based on current codebase analysis
**Total Modules:** 31+ registered modules
**Status:** All modules should be visible via auto-generated navigation
