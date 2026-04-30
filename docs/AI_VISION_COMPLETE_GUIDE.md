# 🎯 AI Vision Module - Complete User Guide

**Version:** 1.0  
**Status:** Production Ready  
**Last Updated:** January 2025

---

## 📖 Table of Contents

1. [Quick Start](#quick-start)
2. [API Endpoints](#api-endpoints)
3. [Services](#services)
4. [Features](#features)
5. [Integration Guide](#integration-guide)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### 1. Basic Image Analysis

```typescript
// Using the main API
const formData = new FormData()
formData.append('image', imageFile)
formData.append('context', 'Safety inspection')

const response = await fetch('/api/ai/vision', {
  method: 'POST',
  body: formData,
})

const result = await response.json()
```

### 2. Agent-Based Analysis

```typescript
const response = await fetch('/api/ai/vision/agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'analysis',
    priority: 'high',
    imageFile: imageBase64,
    context: 'Quality check',
    module: 'iso-ims',
  }),
})
```

### 3. Submit Human Feedback

```typescript
const response = await fetch('/api/ai/vision/human-feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    analysisId: 'analysis-123',
    approved: true,
    corrections: [{
      field: 'severity',
      originalValue: 'low',
      correctedValue: 'high',
      reason: 'Missed critical issue',
    }],
    comments: 'Please review severity assessment',
  }),
})
```

---

## 📡 API Endpoints

### POST `/api/ai/vision`
**Basic vision analysis**

**Request:**
- `image` (File): Image file
- `context` (string, optional): Analysis context
- `mode` (string, optional): Analysis mode
- `provider` (string, optional): AI provider

**Response:**
```json
{
  "success": true,
  "result": {
    "analysisId": "vision-123",
    "analysis": { ... },
    "complianceScore": 85,
    "isCompliant": true
  }
}
```

### POST `/api/ai/vision/agent`
**Intelligent agent-based analysis**

**Request:**
```json
{
  "type": "analysis",
  "priority": "high",
  "imageFile": "base64...",
  "context": "Safety inspection",
  "module": "qhse"
}
```

**Response:**
```json
{
  "success": true,
  "taskId": "task-123",
  "result": {
    "status": "success",
    "confidence": 0.85,
    "agentUsed": "vision-agent, safety-agent",
    "suggestedActions": [...]
  }
}
```

### POST `/api/ai/vision/human-feedback`
**Submit human feedback**

**Request:**
```json
{
  "analysisId": "analysis-123",
  "approved": true,
  "corrections": [...],
  "comments": "..."
}
```

### POST `/api/ai/vision/automation`
**Automated decision-making**

**Request:**
```json
{
  "analysisId": "analysis-123",
  "action": "process"
}
```

### GET `/api/ai/vision/health`
**Health check**

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "visionService": { "available": true },
    "database": { "connected": true }
  }
}
```

### GET `/api/ai/vision/test`
**Test all services**

**Response:**
```json
{
  "summary": {
    "total": 8,
    "passed": 7,
    "failed": 0,
    "warnings": 1,
    "overallStatus": "healthy"
  }
}
```

---

## 🔧 Services

### Core Services

#### `visionService`
Basic vision analysis using GPT-4/Claude

```typescript
import { visionService } from '@/lib/services/ai/vision'

const result = await visionService.analyzeImage(imageFile, context)
```

#### `enhancedVisionService`
RAG-enhanced analysis with knowledge base

```typescript
import { enhancedVisionService } from '@/lib/services/ai/vision'

const result = await enhancedVisionService.analyzeWithRAG(imageFile, context, {
  enableRAG: true,
  enableLearning: true,
})
```

#### `visionAgentIntegration`
AI agent-based analysis

```typescript
import { visionAgentIntegration } from '@/lib/services/ai/vision'

const result = await visionAgentIntegration.processWithAgents({
  id: 'task-1',
  type: 'analysis',
  input: { imageFile, context, module: 'wms' },
})
```

---

## ✨ Features

### 1. Intelligent Analysis
- Multi-agent collaboration
- Context-aware decisions
- Confidence-based routing

### 2. Self-Learning
- Pattern recognition
- Continuous improvement
- Knowledge base integration

### 3. Human-in-the-Loop
- Smart escalation
- Feedback processing
- Learning from corrections

### 4. Automation
- Automated decision-making
- Workflow triggers
- Auto-create NCR/CAPA

### 5. RAG-Enhanced
- Knowledge base search
- Similar case retrieval
- Contextual insights

---

## 🔗 Integration Guide

### React Component Example

```typescript
'use client'

import { useState } from 'react'

export function VisionAnalysisButton() {
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)

  const handleAnalyze = async (file: File) => {
    setAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('context', 'Quality inspection')

      const response = await fetch('/api/ai/vision', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      setResult(data.result)
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleAnalyze(file)
        }}
        disabled={analyzing}
      />
      {analyzing && <p>Analyzing...</p>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  )
}
```

---

## 🐛 Troubleshooting

### Issue: "No AI providers available"
**Solution:** Set environment variables:
```env
NEXT_PUBLIC_OPENAI_API_KEY=your_key
# OR
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_key
```

### Issue: "Database connection failed"
**Solution:** 
1. Check `DATABASE_URL` environment variable
2. Run migration: `npx prisma migrate deploy`
3. Verify database is running

### Issue: "Vision tables not found"
**Solution:** Apply migration:
```bash
npx prisma migrate deploy
```

### Issue: "Agent not found"
**Solution:** Ensure agent orchestrator is initialized. Check `/api/ai/vision/test` endpoint.

### Issue: "Analysis timeout"
**Solution:** 
- Check image size (max 20MB)
- Verify API keys are valid
- Check network connectivity

---

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3000/api/ai/vision/health
```

### Test All Services
```bash
curl http://localhost:3000/api/ai/vision/test
```

### Validation Script
```bash
npx tsx scripts/validate-vision-module.ts
```

---

## ✅ Production Checklist

- [ ] Database migration applied
- [ ] Environment variables set
- [ ] Health check passing
- [ ] All services initialized
- [ ] API keys configured
- [ ] Error handling verified
- [ ] Monitoring set up

---

## 📚 Additional Resources

- [Production Checklist](./AI_VISION_PRODUCTION_CHECKLIST.md)
- [Final Status](./AI_VISION_FINAL_STATUS.md)
- [Mind-Blowing Capabilities](./AI_VISION_MIND_BLOWING_CAPABILITIES.md)
- [Module README](../lib/services/ai/vision/README.md)

---

**Status:** ✅ Production Ready  
**Support:** Check health endpoint and validation script for diagnostics














