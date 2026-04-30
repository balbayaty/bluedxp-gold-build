# 👤 USER MANAGEMENT - QUICK REFERENCE GUIDE

## 🎯 Which Page Should I Use?

### For Simple Tasks: `/user-management`
**Use when you need to:**
- ✅ Quickly add a new user
- ✅ Edit basic user info (name, email, role)
- ✅ Enable/disable users
- ✅ Search users by role

**Link:** `http://localhost:3000/user-management`

---

### For Analytics & Insights: `/users`
**Use when you need to:**
- ✅ View user activity analytics
- ✅ See role distribution charts
- ✅ Track online users in real-time
- ✅ Analyze login trends
- ✅ View users in table, grid, or chart format

**Link:** `http://localhost:3000/users`

---

### For Enterprise Management: `/settings/users`
**Use when you need to:**
- ✅ Manage detailed permissions (module/feature/action level)
- ✅ Assign customers and warehouses
- ✅ Configure data visibility
- ✅ Manage API keys
- ✅ Assign AI agents
- ✅ Track billing and compliance
- ✅ Set user preferences (language, timezone, theme)
- ✅ View activity logs

**Link:** `http://localhost:3000/settings/users`

---

## 📝 How to Add a User (Step-by-Step)

### Method 1: Simple Way (Recommended for Beginners)

1. **Go to:** `http://localhost:3000/user-management`
2. **Click:** "Add User" button (blue button, top-right)
3. **Fill in:**
   - Email (required)
   - Full Name (required)
   - Role (select from dropdown)
   - Department (optional)
   - Designation (optional)
4. **Click:** "Create User"
5. **Done!** ✅

---

### Method 2: Advanced Way (With Permissions)

1. **Go to:** `http://localhost:3000/settings/users`
2. **Click:** "Create User" button (blue gradient button, top-right)
3. **Fill in Basic Information:**
   - Username (required)
   - Email (required)
   - Full Name (required)
   - Role (required)
   - Department
   - Status (Active/Inactive/Pending/Suspended)
4. **Assign Customers & Warehouses:**
   - Select customers from the list
   - Select warehouses from the list
   - Set manager (if applicable)
5. **Set Permissions:**
   - Choose modules (WMS, TMS, Finance, etc.)
   - Set access level (Full/Partial/Read Only)
   - Select specific actions (read, write, delete, etc.)
6. **Set User Preferences:**
   - Theme (Light/Dark/Auto)
   - Language
   - Timezone
   - Date Format
7. **Click:** "Create User"
8. **Done!** ✅

---

## 🔍 How to Search for a User

### All Pages Support Search:
1. Look for the search box at the top
2. Type user's name, email, or username
3. Results update instantly

### Additional Filters:
- **Filter by Role:** Select from role dropdown
- **Filter by Status:** Select from status dropdown

---

## ✏️ How to Edit a User

### Simple Edit:
1. Find the user in the list
2. Click the **Edit** button (pencil icon)
3. Update the information
4. Click "Save Changes"

### Advanced Edit (with permissions):
1. Go to `/settings/users`
2. Click the **"Manage"** button (purple button) for the user
3. This opens a comprehensive 7-tab interface:
   - **Permissions** - Set granular permissions
   - **Customers** - Assign customers and data visibility
   - **API Keys** - Manage API keys
   - **Agents** - Assign AI agents
   - **Billing** - View billing info
   - **Compliance** - Track compliance records
   - **Activity** - View activity log

---

## 🗑️ How to Delete a User

1. Find the user in the list
2. Click the **Delete** button (trash icon)
3. Confirm the deletion
4. Done!

**Note:** This is a soft delete - the user is marked as inactive, not permanently removed.

---

## 🔑 How to Manage API Keys

1. **Go to:** `/settings/users`
2. **Click:** "Manage" button for the user
3. **Click:** "API Keys" tab
4. **Click:** "Generate New Key" button
5. **Set:**
   - Key name
   - Permissions/scopes
   - Expiration date (optional)
   - Rate limits (optional)
6. **Copy the key** (shown only once!)
7. **Done!** ✅

---

## 🤖 How to Assign AI Agents

1. **Go to:** `/settings/users`
2. **Click:** "Manage" button for the user
3. **Click:** "Agents" tab
4. **Click:** "Assign Agent" button
5. **Select:**
   - Agent type (Intelligent Orchestrator, Process Mining, etc.)
   - Permissions
   - Configuration
6. **Click:** "Assign"
7. **Done!** ✅

---

## 📊 How to View User Analytics

1. **Go to:** `http://localhost:3000/users`
2. **Click:** "Analytics" view mode button (top-right)
3. **See:**
   - Role distribution pie chart
   - Status distribution bar chart
   - Login trend line chart
   - Real-time online user count

---

## 🔐 User Roles Available

| Role | Description | Access Level |
|------|-------------|--------------|
| **SYSTEM_ADMIN** | Full system access | 🔴 Full |
| **BUSINESS_DEVELOPMENT_MANAGER** | Business development | 🟡 High |
| **TRANSPORT_GENERAL_MANAGER** | Transportation oversight | 🟡 High |
| **WAREHOUSE_HEAD** | Warehouse oversight | 🟡 High |
| **OPERATIONS_MANAGER** | Day-to-day operations | 🟡 High |
| **CUSTOMER_ACCOUNT_MANAGER** | Customer relationships | 🟠 Medium |
| **WAREHOUSE_SUPERVISOR** | Warehouse supervision | 🟠 Medium |
| **WAREHOUSE_OPERATOR** | Warehouse operations | 🟢 Low |
| **QUALITY_MANAGER** | Quality assurance | 🟠 Medium |
| **INVENTORY_SPECIALIST** | Inventory management | 🟢 Low |
| **CUSTOMER_USER** | Customer portal user | 🟢 Low |
| **CUSTOMER_ADMIN** | Customer portal admin | 🟠 Medium |

---

## ⚠️ Common Issues & Solutions

### Issue: Can't find the "Add User" button
**Solution:** Make sure you're logged in as an admin. Only admins can create users.

### Issue: User creation fails
**Solution:** 
1. Check that email is unique (not already used)
2. Ensure all required fields are filled
3. Check password meets requirements (if setting password)

### Issue: Permissions not saving
**Solution:**
1. Make sure you clicked "Save Changes" or "Create User"
2. Check that you have permission to manage users
3. Try refreshing the page and trying again

### Issue: Can't see certain users
**Solution:**
1. Check your filters (role, status)
2. Clear the search box
3. Check that you have permission to view all users

---

## 🎨 View Modes Explained

### Table View 📋
- **Best for:** Detailed user information
- **Shows:** All user fields in a table
- **Actions:** Quick access to edit/delete

### Grid View 📱
- **Best for:** Visual browsing
- **Shows:** User cards with key info
- **Actions:** Card-based interactions

### Analytics View 📊
- **Best for:** Insights and trends
- **Shows:** Charts and graphs
- **Actions:** Visual analysis

---

## 🚀 Quick Tips

1. **Use keyboard shortcuts:**
   - `ESC` to close modals
   - `Ctrl/Cmd + F` to focus search box

2. **Bookmark your favorite page:**
   - Simple users: `/user-management`
   - Power users: `/settings/users`

3. **Enable real-time updates:**
   - Click the "Real-time" toggle button
   - See live user activity as it happens

4. **Use filters effectively:**
   - Combine role + status filters for precise results
   - Clear filters to see all users

5. **Export user data:**
   - Use the export button (if available)
   - Choose format (CSV, Excel, PDF)

---

## 📞 Need Help?

If you encounter any issues:
1. Check this quick guide first
2. Read the complete documentation: `USER_MANAGEMENT_FIXES_COMPLETE.md`
3. Check linter errors: No errors should be present
4. All pages are fully functional and tested

---

**Last Updated:** January 7, 2026
**Status:** ✅ All systems operational
