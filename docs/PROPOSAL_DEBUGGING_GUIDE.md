# Proposal Generation Debugging Guide

## 🔍 How to Debug Proposal Generation Issues

### Step 1: Check Browser Console
1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Look for messages starting with `[Proposal Builder]` or `[Universal Proposal]`
4. Check for any red error messages

### Step 2: Check Network Tab
1. In Developer Tools, go to the **Network** tab
2. Try generating a proposal
3. Look for the request to `/api/proposals/universal/generate`
4. Click on it to see:
   - **Request**: What data was sent
   - **Response**: What the server returned
   - **Status**: Should be 200 (green) or 500 (red)

### Step 3: Check Server Logs
If you're running the dev server, check the terminal/console where `npm run dev` is running for:
- `[Universal Proposal]` messages
- `[API]` error messages
- Any stack traces

### Step 4: Common Issues & Fixes

#### Issue: "Button does nothing"
**Possible Causes:**
- JavaScript error in console
- Form validation failing (missing title or customer)
- Network request not being sent

**Fix:**
1. Check browser console for errors
2. Make sure title and customer fields are filled
3. Check if button is disabled (grayed out)

#### Issue: "Failed to generate proposal"
**Possible Causes:**
- AI API key missing or invalid
- Database connection issue
- Service error

**Fix:**
1. Check server logs for detailed error
2. Verify AI API key is set (if using AI features)
3. Check database connection

#### Issue: "Proposal Not Found" after generation
**Possible Causes:**
- Proposal not saved to database
- ID mismatch
- Service not finding proposal

**Fix:**
1. Check server logs for database errors
2. Verify proposal ID in URL matches database
3. Check if proposal exists in database

### Step 5: Enable Detailed Logging

The code now includes detailed logging. You should see:
- `[Proposal Builder] Starting proposal generation...`
- `[Proposal Builder] Sending request: {...}`
- `[Proposal Builder] Response status: 200`
- `[Universal Proposal] Starting proposal generation...`
- `[Universal Proposal] Step 1: Gathering cross-module data...`
- `[Universal Proposal] ✅ Cross-module data gathered`
- And so on...

If you don't see these logs, the request might not be reaching the server.

### Step 6: Test with Minimal Data

Try generating a proposal with:
- Title: "Test Proposal"
- Customer: "Test Customer"
- Leave other fields as default

This will help isolate if the issue is with specific data or the general flow.

### Step 7: Check API Route

The API route is at: `/app/api/proposals/universal/generate/route.ts`

It should:
1. Validate required fields (moduleId, proposalType)
2. Call `universalIntelligentProposalService.generateUniversalProposal()`
3. Return the proposal, insights, and win strategy

### Step 8: Check Service

The service is at: `/lib/services/proposals/universalIntelligentProposalService.ts`

It should:
1. Gather cross-module data
2. Generate AI insights (with fallback if AI fails)
3. Generate proposal content
4. Calculate win strategy
5. Store in database

## 🐛 What to Report

If you're still having issues, please provide:

1. **Browser Console Errors**: Copy all red error messages
2. **Network Request**: 
   - Request URL
   - Request payload
   - Response status
   - Response body
3. **Server Logs**: Copy error messages from terminal
4. **Steps to Reproduce**: What you did before the error
5. **Expected Behavior**: What should happen
6. **Actual Behavior**: What actually happened

## ✅ Recent Fixes Applied

1. ✅ Added detailed logging throughout the flow
2. ✅ Added error handling with fallbacks for AI calls
3. ✅ Added database storage with proper ID handling
4. ✅ Added multi-source proposal lookup
5. ✅ Enhanced error messages for users

---

*Last Updated: ${new Date().toISOString()}*
