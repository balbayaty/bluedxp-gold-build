# MSDS Processing Queue - Testing Checklist

## 🔍 RUNTIME TESTING REQUIRED

### Critical Integration Points to Test

#### 1. Event Bus Subscription ✅
- [ ] Verify `eventBus.subscribe()` returns unsubscribe function
- [ ] Test subscription cleanup on component unmount
- [ ] Verify events are received correctly
- [ ] Test with multiple concurrent subscriptions

#### 2. WebSocket Service ✅
- [ ] Verify `msdsRealtimeService.initialize()` works
- [ ] Test subscription/unsubscription
- [ ] Verify cleanup on unmount
- [ ] Test fallback to event bus when WebSocket fails

#### 3. Component Rendering ✅
- [ ] Test with valid jobId
- [ ] Test with invalid/missing jobId
- [ ] Test with empty items array
- [ ] Test with null/undefined job data
- [ ] Test expand/collapse functionality

#### 4. API Integration ✅
- [ ] Test job status API endpoint
- [ ] Verify tenantId header is sent correctly
- [ ] Test error handling for API failures
- [ ] Test polling interval behavior

#### 5. Error Handling ✅
- [ ] Test with failed items
- [ ] Test with network errors
- [ ] Test with malformed API responses
- [ ] Verify error messages display correctly

#### 6. Real-Time Updates ✅
- [ ] Test WebSocket connection
- [ ] Test event bus updates
- [ ] Test polling fallback
- [ ] Verify progress updates in real-time

## 🐛 POTENTIAL ISSUES IDENTIFIED

### Issue 1: Event Bus Subscription Return Type
**Location**: `lib/services/realtime/msdsRealtimeService.ts`
**Problem**: Need to verify `eventBus.subscribe()` return type
**Fix**: Add proper type checking and error handling

### Issue 2: WebSocket Service Initialization
**Location**: `components/msds/ProcessingQueue.tsx`
**Problem**: WebSocket service might not be initialized
**Fix**: Add initialization check

### Issue 3: useEffect Dependencies
**Location**: `components/msds/ProcessingQueue.tsx`
**Problem**: Missing dependencies in useEffect
**Fix**: Add all dependencies to dependency array

### Issue 4: Null Checks
**Location**: Multiple files
**Problem**: Missing null/undefined checks
**Fix**: Add comprehensive null checks

## 🔧 FIXES NEEDED

Let me fix these issues now...

