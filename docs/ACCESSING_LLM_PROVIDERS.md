# 🔐 Accessing LLM Providers - Authentication Guide

## ⚠️ **Important: API Authentication Required**

The LLM provider API endpoints require authentication. You cannot access them directly in the browser without being logged in.

---

## ✅ **Correct Ways to Access**

### **Option 1: Use the UI Page (Recommended)**

**URL**: `/llm-providers`  
**Direct Link**: `http://localhost:3002/llm-providers`

This page:
- ✅ Handles authentication automatically
- ✅ Shows all providers in a nice UI
- ✅ Displays status, capabilities, and metrics
- ✅ No need to worry about API authentication

**Just navigate to**: `/llm-providers` in your browser (while logged in)

---

### **Option 2: Use AI Settings Page**

**URL**: `/settings/ai`  
**Direct Link**: `http://localhost:3002/settings/ai`

This page:
- ✅ Configure API keys
- ✅ Test connections
- ✅ View provider status
- ✅ Manage agent settings

---

### **Option 3: Use API with Authentication**

If you need to use the API directly, you must:

1. **Be logged in** (session cookie required)
2. **Include credentials** in the request

**Example using fetch:**
```javascript
// This works when you're logged in
const response = await fetch('/api/llm/providers', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // ← This is important!
})
```

**Example using curl (with session cookie):**
```bash
# First, get your session cookie from browser
# Then use it in curl:
curl -X GET http://localhost:3002/api/llm/providers \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie-here"
```

---

## 🔗 **All Available Links**

### **UI Pages (No Authentication Issues):**

1. **LLM Providers Page** (NEW!)
   - URL: `/llm-providers`
   - Link: `http://localhost:3002/llm-providers`
   - ✅ Best way to view providers

2. **AI Settings**
   - URL: `/settings/ai`
   - Link: `http://localhost:3002/settings/ai`
   - ✅ Configure and manage providers

3. **ML Registry**
   - URL: `/ml-registry`
   - Link: `http://localhost:3002/ml-registry`
   - ✅ View ML models and training

4. **Main Settings**
   - URL: `/settings`
   - Link: `http://localhost:3002/settings`
   - ✅ Access all settings

---

### **API Endpoints (Require Authentication):**

These require you to be logged in:

1. **List Providers**
   - URL: `/api/llm/providers`
   - Use UI page instead: `/llm-providers`

2. **Generate Text**
   - URL: `/api/llm/generate`
   - Use from your application code (with auth)

3. **Get Metrics**
   - URL: `/api/llm/metrics`
   - Use from your application code (with auth)

---

## 🎯 **Quick Solution**

**Instead of accessing `/api/llm/providers` directly:**

1. **Go to**: `http://localhost:3002/llm-providers`
2. **Or go to**: `http://localhost:3002/settings/ai`

Both pages will show you all the provider information without authentication issues!

---

## 📝 **Why Authentication is Required**

The API endpoints are protected to:
- ✅ Prevent unauthorized access
- ✅ Track usage per user/tenant
- ✅ Enforce rate limiting
- ✅ Maintain security

**Solution**: Use the UI pages which handle authentication automatically!

---

## ✅ **Summary**

### **For Viewing Providers:**
- ✅ Use `/llm-providers` (NEW UI page)
- ✅ Or use `/settings/ai`

### **For API Access:**
- ✅ Must be logged in
- ✅ Include `credentials: 'include'` in fetch
- ✅ Or use the UI pages instead

**The new `/llm-providers` page solves this issue!**


