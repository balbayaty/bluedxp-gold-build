# 🚀 Quick Access Guide - Hidden Features

## 🔍 How to See ALL Modules (3 Easy Ways)

### 1️⃣ Debug Page (Easiest!)
```
http://localhost:3002/debug/modules
```
Shows all 31+ modules with their routes

### 2️⃣ API Endpoint
```
http://localhost:3002/api/modules/list
```
Returns JSON list of all modules

### 3️⃣ Sidebar Navigation
Look for **"All Modules (Auto)"** section in sidebar

---

## 📋 Quick Module List (31+ Total)

**Core Modules:**
- WMS, ISO-IMS, TMS, QHSE, Compliance, Trade Compliance

**Business Modules:**
- CRM, Finance, HR, Procurement, Project Management, Business Intelligence

**AI & Intelligence:**
- Hazalyze (AI Brain), IoT, Intelligence Analytics

**Specialized:**
- Marketplace, Warehouse Network, Export House, Customs, MSDS, ETW

**Infrastructure:**
- Digital Signature, Pulse, DMARC Monitoring, OPC UA Monitoring
- ICT Hardware Ecosystem, External Integrations, Workspace, System Health

**Advanced:**
- Process Lifecycle, Brand Messaging, Truth Engine, MaaS, Proposals & RFQ
- Facility Management, Email Service

---

## 🔒 Admin-Only Features

**Module Management:**
```
/settings/module-management
```
(Requires SYSTEM_ADMIN or IT_ADMIN role)

---

## 📄 Common Hidden Pages (Type URL Directly)

**CRM:**
- `/crm/dashboard`, `/crm/accounts`, `/crm/contacts`, `/crm/opportunities`, `/crm/leads`

**Business Intelligence:**
- `/business-intelligence/dashboard`, `/business-intelligence/data-warehouse`

**Truth Engine:**
- `/truth-engine/dashboard`, `/truth-engine/claims`

**Facility:**
- `/facility/utility-bills`, `/facility/utility-bills/analytics`

**Liability:**
- `/liability/dashboard`, `/liability/claims`, `/liability/compliance`

**Projects:**
- `/projects`, `/purchase-orders`, `/task-management`

---

## 🎯 AI Features (Hazalyze Module)

**Vision:**
- `/ai-vision-unified` - Unified Dashboard
- `/ai-vision` - Image Analysis
- `/ai-vision/video` - Video Analysis
- `/ai-vision/stream` - Live Streaming
- `/ai-vision/chemical` - Chemical Vision
- `/ai-vision/anomalies` - Anomaly Detection

**Intelligence:**
- `/intelligent-orchestration/process-mining`
- `/intelligent-orchestration/root-cause`
- `/intelligent-orchestration/predictive`
- `/agent-orchestration`
- `/knowledge-base`

**ASN:**
- `/asn`, `/asn/dashboard`, `/asn/processing`, `/asn/analytics`

---

## ⚡ Quick Troubleshooting

**Can't see modules?**
1. Check `/debug/modules`
2. Check browser console (F12)
3. Verify `/api/modules/list` works

**Can't access admin features?**
- Need SYSTEM_ADMIN or IT_ADMIN role

**Page shows 404?**
- Check if route needs parameters (e.g., `[id]`)
- Verify module is enabled

---

## 📞 Need More Details?

See full guide: `/docs/HIDDEN_FEATURES_GUIDE.md`
