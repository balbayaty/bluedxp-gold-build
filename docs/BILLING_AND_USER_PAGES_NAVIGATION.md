# 🗺️ BILLING & USER MANAGEMENT - NAVIGATION MAP

**Direct Links for All Billing, Settings, and User Pages**

---

## 💳 **BILLING PAGES**

### Main Billing Page
```
http://localhost:3002/billing
```
**Features:**
- Subscription plans (Free, Starter, Professional, Enterprise)
- Credit balance management
- Usage metrics and limits
- Invoice history
- Payment methods
- Monthly/Annual billing toggle

---

## ⚙️ **SETTINGS PAGES**

### Main Settings Hub
```
http://localhost:3002/settings
```
**Features:** Central settings dashboard with all categories

### System Configuration
```
http://localhost:3002/settings/parameters
http://localhost:3002/settings/warehouse
http://localhost:3002/settings/workflow
http://localhost:3002/settings/currency
http://localhost:3002/settings/templates
```

### User Management
```
http://localhost:3002/settings/users
http://localhost:3002/settings/users/production
http://localhost:3002/settings/user-status
```

### Security & Access
```
http://localhost:3002/settings/security
```

### Notifications
```
http://localhost:3002/settings/notifications
```

### AI & Intelligence
```
http://localhost:3002/settings/ai
http://localhost:3002/ai-vision/integration/settings
```

### Integrations
```
http://localhost:3002/settings/integrations/market-data
```

### Accessibility
```
http://localhost:3002/settings/accessibility
```

### Module Management
```
http://localhost:3002/settings/module-management
```

### Maps
```
http://localhost:3002/settings/maps
```

### Workspace Settings
```
http://localhost:3002/workspace/settings
```

---

## 👥 **USER PAGES**

### User Management
```
http://localhost:3002/users
```
**Features:**
- User list and management
- Role assignment
- Permissions management
- User creation/editing

### Settings Users Page
```
http://localhost:3002/settings/users
```
**Features:**
- Comprehensive user manager
- Permission manager
- Customer hierarchy selector
- User data visibility settings
- User analytics and charts

### Production Users
```
http://localhost:3002/settings/users/production
```

---

## 🏢 **ADMIN PAGES**

### Employee Approval
```
http://localhost:3002/admin/approve-employee
```

### QR Analytics (Admin)
```
http://localhost:3002/admin/qr-analytics
http://localhost:3002/admin/qr-analytics/cross-module
http://localhost:3002/admin/qr-analytics/detailed
http://localhost:3002/admin/qr-analytics/executive
http://localhost:3002/admin/qr-analytics/operational
http://localhost:3002/admin/qr-analytics/realtime
http://localhost:3002/admin/qr-analytics/revolutionary
```

### Pulse Admin
```
http://localhost:3002/pulse/admin
http://localhost:3002/pulse/admin/rulesets
http://localhost:3002/pulse/admin/redemptions
```

---

## 📊 **DASHBOARD PAGES**

### Account Manager Dashboard
```
http://localhost:3002/dashboard/account-manager
```
**Features:**
- Customer overview
- Order tracking
- SLA monitoring
- Revenue analytics

### Customer Dashboard
```
http://localhost:3002/dashboard/customer
```

### Finance Dashboard
```
http://localhost:3002/finance/dashboard
```

### CRM Dashboard
```
http://localhost:3002/crm/dashboard
```

### Business Intelligence
```
http://localhost:3002/business-intelligence/dashboard
```

---

## 🔗 **CONNECTIONS BETWEEN PAGES**

### Billing → Settings
**Currently:** ❌ Not directly connected
**Should Add:** Link in settings to manage billing/subscription

### Billing → Users
**Currently:** ❌ Not directly connected
**Potential:** Billing page could show user seats/licenses

### Settings → Users
**Currently:** ✅ Connected via Settings Hub
- Main settings page has "Users" section
- Direct links to `/settings/users` and `/users`

### Users → Billing
**Currently:** ❌ Not directly connected
**Potential:** User page could show subscription limits

---

## 🚀 **RECOMMENDED NAVIGATION FLOW**

### For End Users:
1. **Dashboard** → Check overview
2. **Settings** → Manage preferences
3. **Billing** → Check subscription and usage
4. **Users** (if admin) → Manage team

### For Admins:
1. **Settings/Users** → Manage users and permissions
2. **Billing** → Monitor subscription and costs
3. **Admin Pages** → Approve employees, view analytics
4. **Dashboard** → Monitor business metrics

---

## 🔧 **SUGGESTED IMPROVEMENTS**

### 1. Add Billing Link to Settings
In `app/settings/page.tsx`, add:
```typescript
{
  id: "billing",
  name: "Billing & Subscription",
  description: "Manage subscription and payments",
  icon: "ri-money-dollar-circle-line",
  color: "green",
  items: [
    {
      name: "Subscription",
      href: "/billing",
      icon: "ri-vip-crown-line",
      description: "Plans and pricing",
    },
  ],
}
```

### 2. Add User Count to Billing Page
Show current user count vs subscription limit:
- Free: 5 users max
- Starter: 25 users max
- Professional: 100 users max
- Enterprise: Unlimited

### 3. Add Quick Links in Navigation
Main navigation should include:
- Settings (with billing submenu)
- Users (with permissions submenu)
- Billing (direct access)

---

## 📱 **API CONNECTIONS**

### Billing APIs
```
GET  /api/billing/subscriptions
GET  /api/billing/invoices
GET  /api/billing/credits
POST /api/billing/credits/add
POST /api/billing/create-checkout
GET  /api/billing/payments
POST /api/billing/webhook
```

### User APIs
```
GET  /api/users
POST /api/users
GET  /api/users/[id]
PUT  /api/users/[id]
DELETE /api/users/[id]
GET  /api/users/[id]/usage
```

### Settings APIs
```
GET  /api/settings
PUT  /api/settings
GET  /api/settings/[category]
```

### Dashboard APIs
```
GET  /api/dashboards/account-manager
GET  /api/dashboards/customer
GET  /api/dashboards/operations
GET  /api/dashboards/supervisor
GET  /api/dashboards/business-development
```

---

## 🎯 **QUICK ACCESS CHECKLIST**

**Main Pages You Need:**
- [ ] Billing: `http://localhost:3002/billing`
- [ ] Settings Hub: `http://localhost:3002/settings`
- [ ] User Management: `http://localhost:3002/settings/users`
- [ ] Account Dashboard: `http://localhost:3002/dashboard/account-manager`

**For Testing:**
1. Open billing page → Check subscription
2. Open settings → Navigate to users
3. Open user management → Check permissions
4. Verify all pages load without errors

---

## 📝 **NOTES**

### Current State:
- ✅ Billing page works independently
- ✅ Settings page has user management links
- ✅ Users page works independently
- ❌ No direct navigation between billing and users
- ❌ No subscription limit indicators in user pages

### Future Enhancements:
1. **Unified Account Page**
   - Combine profile, billing, and settings
   - Single place for user account management

2. **Better Navigation**
   - Add billing to main menu
   - Add user count badges
   - Show subscription status in header

3. **Smart Limits**
   - Prevent adding users beyond subscription limit
   - Show upgrade prompt when approaching limits
   - Auto-upgrade options

---

*Last Updated: January 8, 2026*  
*All links tested on: http://localhost:3002*
