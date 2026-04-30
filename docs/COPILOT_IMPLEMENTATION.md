# HazalyzeCopilot - Comprehensive Implementation Guide

## 🎯 Overview

HazalyzeCopilot is a fully integrated AI assistant for the BlueDXP Platform with:
- **RAG (Retrieval Augmented Generation)** - Knowledge base integration
- **Agent Memory** - Context-aware conversations
- **Real AI Processing** - No more mock/down states
- **Intelligent Widget** - Draggable, resizable, collision-aware
- **Full Platform Integration** - Event Bus, RBAC, multi-tenant

## 📁 File Structure

```
lib/services/copilot/
├── copilotService.ts      # Core copilot service with RAG & memory
└── index.ts               # Exports

components/copilot/
├── HazalyzeCopilotWidget.tsx  # Intelligent dashboard widget
└── index.ts                   # Exports

app/api/copilot/
├── chat/route.ts          # Chat API endpoint
└── conversations/route.ts  # Conversation management

lib/services/agents/
└── agentOrchestrator.ts    # Updated with real AI (not mock)
```

## 🔧 Key Features

### 1. RAG Integration
- Semantic search through knowledge base
- Vector embeddings for context
- Knowledge entry retrieval and ranking
- Automatic knowledge creation from interactions

### 2. Agent Memory
- Short-term and long-term memory
- Context-aware responses
- Learning from interactions
- Memory decay and relevance scoring

### 3. Real AI Processing
- Integrated with agent orchestrator
- Uses `aiClient` utility for AI calls
- Fallback mechanisms (never shows "down" state)
- Token usage tracking

### 4. Intelligent Widget
- **Draggable**: Click and drag header to move
- **Resizable**: Drag bottom-right corner to resize
- **Collapsible**: Minimize to title bar or floating button
- **Smart Positioning**: Collision detection prevents overlaps
- **Z-Index Management**: Always accessible but doesn't block critical UI
- **State Persistence**: Remembers position and size in localStorage

### 5. Error Handling
- Graceful degradation
- Always returns a response (never fails silently)
- Fallback messages when AI unavailable
- Error logging and monitoring

### 6. Event Bus Integration
- `copilot.message.processed` - Message completion events
- `copilot.knowledge.used` - Knowledge retrieval events
- `copilot.knowledge.created` - New knowledge creation events
- Cross-module awareness and real-time updates

## 🚀 Usage

### Basic Widget Integration

```tsx
import { HazalyzeCopilotWidget } from '@/components/copilot'

export default function Dashboard() {
  return (
    <div>
      {/* Your dashboard content */}
      <HazalyzeCopilotWidget
        tenantId={tenantId}
        userId={userId}
        defaultPosition={{ x: 100, y: 100 }}
        defaultSize={{ width: 420, height: 600 }}
      />
    </div>
  )
}
```

### Using the Service Directly

```typescript
import { copilotService } from '@/lib/services/copilot'

const response = await copilotService.processMessage(
  tenantId,
  userId,
  {
    message: 'What shipments are pending?',
    options: {
      useRAG: true,
      useMemory: true,
      useTools: true,
    },
  }
)
```

### API Usage

```typescript
// POST /api/copilot/chat
const response = await fetch('/api/copilot/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Your question here',
    options: {
      useRAG: true,
      useMemory: true,
    },
  }),
})
```

## 🎨 Widget Features

### States
1. **Full**: Full widget with messages and input
2. **Collapsed**: Title bar only (60px height)
3. **Minimized**: Floating button in bottom-right

### Interactions
- **Drag**: Click and hold header to move
- **Resize**: Drag bottom-right corner
- **Collapse**: Click minimize button
- **Minimize**: Click minimize again or press Escape
- **Restore**: Click floating button or widget header

### Keyboard Shortcuts
- `Ctrl/Cmd + K`: Focus input field
- `Escape`: Minimize widget

### Smart Features
- **Collision Detection**: Automatically adjusts position to avoid overlaps
- **Boundary Checking**: Stays within viewport
- **Z-Index Management**: Brings to front when dragged, resets after
- **State Persistence**: Saves position/size to localStorage

## 🔐 Security & Compliance

- **RBAC**: Enforced via API Gateway middleware
- **Multi-Tenant**: Tenant isolation at service level
- **Input Validation**: All inputs validated and sanitized
- **Rate Limiting**: Built into API routes
- **Audit Logging**: Events published to Event Bus

## 📊 Architecture

```
User Input
    ↓
Copilot Widget (UI)
    ↓
API Route (/api/copilot/chat)
    ↓
Copilot Service
    ├──→ Knowledge Base (RAG)
    ├──→ Agent Memory (Context)
    └──→ Agent Orchestrator (AI)
         └──→ aiClient (Real AI)
    ↓
Response with Context
    ↓
Event Bus (Cross-module awareness)
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Widget can be dragged
- [ ] Widget can be resized
- [ ] Widget collapses correctly
- [ ] Widget minimizes correctly
- [ ] State persists on page reload
- [ ] No overlaps with other UI elements
- [ ] RAG retrieval works
- [ ] Memory context is used
- [ ] AI responses are generated
- [ ] Error handling works (no "down" states)
- [ ] Events are published to Event Bus

## 🔄 Future Enhancements

1. **Tool Integration**: Execute platform actions (create shipment, etc.)
2. **Streaming Responses**: Real-time token streaming
3. **Voice Input**: Speech-to-text integration
4. **Multi-Modal**: Image and document understanding
5. **Workflow Support**: Multi-step conversations
6. **Analytics Dashboard**: Usage metrics and insights

## 🐛 Troubleshooting

### Widget Not Appearing
- Check browser console for errors
- Verify tenantId and userId are provided
- Check localStorage for saved state

### AI Not Responding
- Verify API keys are configured (OPENAI_API_KEY or ANTHROPIC_API_KEY)
- Check network tab for API errors
- Review server logs for AI service errors

### RAG Not Working
- Verify knowledge base service is initialized
- Check knowledge entries exist in database
- Review semantic search logs

### Memory Not Persisting
- Check agent memory service is configured
- Verify tenant context is correct
- Review memory storage logs

## 📝 Notes

- Widget z-index is managed to ensure it's always accessible but doesn't block critical UI
- Collision detection prevents overlaps with headers, sidebars, and other widgets
- All state is persisted to localStorage for user experience
- Error handling ensures the copilot never shows a "down" state - always returns a response
- Event Bus integration enables cross-module awareness and real-time updates

## 🎯 Compliance

- ✅ 4IR Aligned: IoT, AI/ML, automation ready
- ✅ 5IR Aligned: Human-centric AI collaboration
- ✅ Security: RBAC, multi-tenant, input validation
- ✅ Integration-First: API-first design, Event Bus
- ✅ Deep Architecture: Service layer, types, adapters
- ✅ Future-Proof: Extensible, maintainable, scalable






