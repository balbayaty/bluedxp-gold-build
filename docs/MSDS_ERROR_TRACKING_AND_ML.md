# MSDS Error Tracking & ML Learning

## ✅ **Yes, Errors ARE Being Recorded**

All MSDS processing errors are being tracked in multiple systems:

### **1. Error Tracking Service** ✅
**Location**: `lib/services/observability/errorTracking.ts`

**What's Recorded**:
- Error messages and stack traces
- File metadata (name, type, size)
- Processing context (tenantId, jobId, itemIndex)
- Text extraction results (length, sample)
- OCR method used (local vs cloud)

**Code Location**: `lib/services/chemical/msdsJobService.ts:451-491`

```typescript
errorTrackingService.captureException(errorObj, {
  module: 'msds',
  service: 'batch-processing',
  tenantId: params.tenantId,
  jobId: params.jobId,
  itemIndex: idx,
  fileName: item.filename,
}, {
  jobId: params.jobId,
  itemId: item.id,
  fileName: item.filename,
  fileType: isPDF ? 'pdf' : isExcel ? 'excel' : isCSV ? 'csv' : 'unknown',
})
```

### **2. Logger Service** ✅
**Location**: `lib/services/observability/logger.ts`

**What's Recorded**:
- Structured error logs with metadata
- Processing context
- Error details and stack traces

**Code Location**: `lib/services/chemical/msdsJobService.ts:455-468`

### **3. Enhanced Cloud OCR Error Tracking** ✅ (NEW)
**Added**: Improved logging for cloud OCR failures

**What's Now Recorded**:
- Cloud OCR attempt details
- API key availability status
- Local OCR text length before cloud OCR
- Detailed error messages and stack traces
- File metadata for debugging

**Code Location**: `lib/services/chemical/msdsJobService.ts:243-264`

## 🤖 **ML Learning Integration**

### **Self-Learning Parser** ✅
**Location**: `lib/services/ml/selfLearningParser.ts`

**Capabilities**:
- Learns from parsing errors (`learnFromErrors`)
- Learns from parsing failures (`learnFromFailure`)
- Stores error patterns in knowledge base
- Tracks error resolution

**Integration**: Currently used for parsing errors, can be extended for OCR errors

### **Signal Capture Service** ✅
**Location**: `lib/services/learning/signal-capture.ts`

**Capabilities**:
- Captures prediction vs outcome signals
- Calculates accuracy and error metrics
- Generates knowledge updates
- Stores learning signals for model improvement

### **Agent Memory** ✅
**Location**: `lib/services/agents/agentMemory.ts`

**Capabilities**:
- Remembers errors and failures
- Learns from success and failure patterns
- Processes user feedback

## 🔍 **Current Issue: Cloud OCR Failures**

### **Problem**
All PDFs are failing with: "Insufficient text extracted from document even after trying both local and cloud OCR"

### **Root Cause Analysis**
1. **Local OCR** (pdfjs + tesseract) extracts < 50 characters
2. **Cloud OCR fallback** is attempted but also fails
3. **Error details** are now being logged with enhanced tracking

### **Why Cloud OCR Might Be Failing**
1. **PDF Rendering Issues**: PDFs need to be rendered to images before cloud OCR
2. **API Key Issues**: Keys might not be properly passed or validated
3. **Image Format Issues**: Rendered images might not be in correct format
4. **API Rate Limits**: Cloud OCR APIs might be hitting rate limits
5. **PDF Corruption**: PDFs might be corrupted or password-protected

### **Enhanced Logging Added** ✅
- Logs when cloud OCR is attempted
- Logs API key availability
- Logs local OCR text length
- Logs detailed error messages
- Logs to error tracking service for ML learning

## 📊 **How to Use Error Data for ML**

### **1. Access Error Tracking**
```typescript
import { errorTrackingService } from '@/lib/services/observability/errorTracking'

// Get errors for analysis
const errors = errorTrackingService.getErrors({
  module: 'msds',
  service: 'ocr-cloud-fallback',
})
```

### **2. Feed to Self-Learning Parser**
```typescript
import { selfLearningParserService } from '@/lib/services/ml/selfLearningParser'

// Learn from OCR errors
await selfLearningParserService.learnFromFailure(
  error,
  rawText,
  { submissionId, tenantId }
)
```

### **3. Generate Learning Signals**
```typescript
import { signalCaptureService } from '@/lib/services/learning/signal-capture'

// Capture OCR prediction vs outcome
await signalCaptureService.captureSignal(
  {
    type: 'ocr_extraction',
    value: extractedText,
    confidence: ocrConfidence,
    model: 'cloud-ocr',
    context: [fileName, fileType],
  },
  {
    value: actualText,
    observedAt: new Date(),
    source: 'manual_review',
  },
  tenantId
)
```

## 🎯 **Next Steps for ML Improvement**

1. **Analyze Error Patterns**: Review error tracking data to identify common failure patterns
2. **Improve OCR Strategy**: Use ML insights to optimize OCR method selection
3. **Predict OCR Success**: Train model to predict which OCR method will work best
4. **Auto-Retry Logic**: Use ML to determine optimal retry strategies
5. **Quality Scoring**: Predict document quality before processing

## 📝 **Error Logging Locations**

| Service | Location | Purpose |
|---------|----------|---------|
| Error Tracking | `lib/services/observability/errorTracking.ts` | Centralized error tracking |
| Logger | `lib/services/observability/logger.ts` | Structured logging |
| MSDS Job Service | `lib/services/chemical/msdsJobService.ts:451-491` | Batch processing errors |
| Cloud OCR | `lib/services/chemical/msdsJobService.ts:243-264` | OCR-specific errors |
| Self-Learning | `lib/services/ml/selfLearningParser.ts` | ML learning from errors |

## ✅ **Summary**

**Yes, all errors are being recorded** in:
- ✅ Error Tracking Service (for analysis)
- ✅ Logger Service (for debugging)
- ✅ Enhanced Cloud OCR logging (for OCR-specific issues)

**ML Learning Integration**:
- ✅ Self-Learning Parser can learn from errors
- ✅ Signal Capture Service can track OCR predictions
- ✅ Agent Memory can remember error patterns

**Current Issue**: Cloud OCR is failing for all PDFs, but errors are now being logged with full context for analysis and ML improvement.















