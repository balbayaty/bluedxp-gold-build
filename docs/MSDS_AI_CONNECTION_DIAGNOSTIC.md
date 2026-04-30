# 🔍 MSDS Module AI Connection Diagnostic Report

## ✅ **AI Connection Status**

### **Connection Flow**
```
1. User uploads MSDS file
   ↓
2. MSDS Job Service (msdsJobService.ts)
   - Extracts text via OCR (PDF) or direct read (Excel/CSV)
   ↓
3. Extraction Adapter (chemcheckEnhancedMsdsExtractionAdapter.ts)
   - Calls: parser.parseSDS(text)
   ↓
4. SDS Parser Service (sds-parser.ts)
   - Calls: aiService.analyzeDocument(analysisPrompt, {...})
   ↓
5. AI Service (chemcheckService.ts)
   - Checks localStorage for API keys (PRIMARY)
   - Falls back to environment variables
   - If found → Uses OpenAI/Anthropic (REAL AI)
   - If not found → Uses Mock Provider (GENERIC DATA)
   ↓
6. Data Extraction & Storage
   - Maps AI response to ExtractedMSDSData
   - Stores via msdsDomainService.storeExtractedMSDS()
```

## ⚠️ **Potential Issues**

### **Issue 1: API Keys Not Being Passed**
**Location**: `lib/services/chemical/msdsJobService.ts` line 297

The extraction adapter is called WITHOUT passing API keys:
```typescript
const extraction = await adapter.extractFromText(text, { 
  tenantId: params.tenantId, 
  language: 'en' 
})
```

**Problem**: The adapter doesn't receive API keys, so it relies on:
- localStorage (client-side only - NOT available in server-side job processing)
- Environment variables (may not be set)

**Solution Needed**: Pass API keys from `params.keys` to the extraction adapter.

### **Issue 2: Data Not Being Passed Through**
**Location**: `lib/services/chemical/msdsJobService.ts` lines 360-405

The extraction result has:
- `extraction.extractedData` - Basic fields
- `extraction.parsed` - Full parsed data with all 16 sections

**Current Mapping**:
```typescript
const fullExtractedData = {
  ...extraction.extractedData,
  sections: extraction.parsed?.sections || {},
  nfpa: extraction.parsed?.nfpa || {...},
  fullParsedData: extraction.parsed,
}
```

**Potential Issue**: If `extraction.parsed` is not being populated correctly, sections won't be stored.

### **Issue 3: Server-Side API Key Access**
**Location**: `lib/services/ai/chemcheckService.ts` lines 37-75

The AI service checks localStorage, but job processing happens **server-side** where localStorage is NOT available.

**Current Logic**:
- Server-side: Only checks environment variables
- Client-side: Checks localStorage first, then env vars

**Problem**: If API keys are only in localStorage (from Settings > AI & Agents), server-side processing won't find them.

## 🔧 **Recommended Fixes**

### **Fix 1: Pass API Keys to Extraction Adapter**
```typescript
// In msdsJobService.ts, line 297
const extraction = await adapter.extractFromText(text, { 
  tenantId: params.tenantId, 
  language: 'en',
  // ADD THIS:
  openaiKey: params.keys?.openaiKey,
  anthropicKey: params.keys?.anthropicKey,
})
```

### **Fix 2: Update Extraction Adapter Interface**
```typescript
// In msdsExtractionAdapter.ts
export interface MSDSExtractionOptions {
  tenantId: string
  language?: string
  openaiKey?: string | null  // ADD
  anthropicKey?: string | null  // ADD
}
```

### **Fix 3: Pass Keys Through to AI Service**
```typescript
// In chemcheckEnhancedMsdsExtractionAdapter.ts
async extractFromText(text: string, options: MSDSExtractionOptions): Promise<MSDSExtractionResult> {
  // Temporarily set API keys if provided
  if (options.openaiKey && typeof window === 'undefined') {
    process.env.OPENAI_API_KEY = options.openaiKey
  }
  if (options.anthropicKey && typeof window === 'undefined') {
    process.env.ANTHROPIC_API_KEY = options.anthropicKey
  }
  
  const parsed = await this.parser.parseSDS(text)
  // ... rest of extraction
}
```

### **Fix 4: Verify Data Flow**
Add logging to verify data is being passed:
```typescript
// In msdsJobService.ts after extraction
console.log('[msds-job] Extraction result:', {
  hasExtractedData: !!extraction.extractedData,
  hasParsed: !!extraction.parsed,
  hasSections: !!extraction.parsed?.sections,
  sectionCount: extraction.parsed?.sections ? Object.keys(extraction.parsed.sections).length : 0,
  productName: extraction.extractedData.productName,
  casNumber: extraction.extractedData.casNumber,
})
```

## 📊 **Current Architecture**

### **Data Flow Diagram**
```
MSDS Upload
  ↓
OCR/Text Extraction (ocrService)
  ↓
Extraction Adapter (extractFromText)
  ↓
SDS Parser (parseSDS)
  ↓
AI Service (analyzeDocument)
  ├─→ Check localStorage (client-side only)
  ├─→ Check env vars (server-side)
  └─→ Use Mock if no keys
  ↓
Extract & Map Data
  ↓
Store via Domain Service
  ↓
Database/Storage
```

## ✅ **What's Working**
1. ✅ AI service is properly connected
2. ✅ Extraction adapter pattern is in place
3. ✅ Data storage is working
4. ✅ OCR service is working

## ❌ **What's Not Working**
1. ❌ API keys from `params.keys` are not being passed to extraction
2. ❌ Server-side processing can't access localStorage API keys
3. ❌ May not be extracting all 16 sections if AI response is incomplete
4. ❌ Data mapping might be losing some fields

## 🎯 **Next Steps**
1. Pass API keys through the extraction chain
2. Add logging to verify data flow
3. Test with real API keys to confirm AI connection
4. Verify all 16 sections are being extracted and stored















