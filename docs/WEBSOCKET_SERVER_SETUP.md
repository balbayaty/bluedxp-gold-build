# WebSocket Server Setup Guide

## 🔌 **Real-Time Updates Implementation**

This guide explains how to set up WebSocket server for real-time load design monitoring.

---

## 📚 **Recommended Libraries**

### **Option 1: Socket.io** (Recommended)
- **Documentation**: https://socket.io/docs/v4/
- **Server API**: https://socket.io/docs/v4/server-api/
- **Client API**: https://socket.io/docs/v4/client-api/
- **Best for**: Full-featured real-time communication, automatic reconnection, room management

### **Option 2: ws (WebSocket)**
- **Documentation**: https://github.com/websockets/ws
- **Best for**: Lightweight, native WebSocket implementation

### **Option 3: Next.js with Custom Server**
- **Documentation**: https://nextjs.org/docs/pages/building-your-application/configuring/custom-server
- **Best for**: Integrated with Next.js application

---

## 🚀 **Implementation Steps**

### **Step 1: Install Dependencies**

```bash
# Option 1: Socket.io
npm install socket.io socket.io-client

# Option 2: ws
npm install ws @types/ws

# Option 3: Next.js custom server
npm install express socket.io
```

### **Step 2: Create WebSocket Server**

#### **Using Socket.io (Recommended)**

Create `server/socketServer.ts`:

```typescript
import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { realtimeService } from '@/lib/services/load-design/realtime/realtimeService'

export function initializeSocketServer(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Subscribe to load plan updates
    socket.on('subscribe-load-plan', (loadPlanId: string) => {
      const unsubscribe = realtimeService.subscribe(loadPlanId, (update) => {
        socket.emit('load-plan-update', update)
      })

      socket.on('disconnect', () => {
        unsubscribe()
      })
    })

    // Subscribe to alerts
    socket.on('subscribe-alerts', () => {
      const unsubscribe = realtimeService.subscribeToAlerts((alert) => {
        socket.emit('alert', alert)
      })

      socket.on('disconnect', () => {
        unsubscribe()
      })
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  return io
}
```

### **Step 3: Update Next.js Server**

Create `server.ts` (for custom server):

```typescript
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { initializeSocketServer } from './server/socketServer'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.io server
  const io = initializeSocketServer(httpServer)

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
```

### **Step 4: Update Client-Side Code**

Update `lib/services/load-design/realtime/realtimeService.ts`:

```typescript
import { io, Socket } from 'socket.io-client'

export class RealtimeService {
  private socket: Socket | null = null
  // ... existing code ...

  connect(loadPlanIds?: string[]): void {
    if (this.isConnected && this.socket) {
      return
    }

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3000'
      this.socket = io(wsUrl)

      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server')
        this.isConnected = true
        this.reconnectAttempts = 0

        // Subscribe to load plans
        if (loadPlanIds) {
          loadPlanIds.forEach(id => {
            this.socket?.emit('subscribe-load-plan', id)
          })
        }

        // Subscribe to alerts
        this.socket?.emit('subscribe-alerts')
      })

      this.socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server')
        this.isConnected = false
        this.scheduleReconnect(loadPlanIds)
      })

      this.socket.on('load-plan-update', (update: RealtimeLoadUpdate) => {
        this.notifyListeners(update.loadPlanId, update)
      })

      this.socket.on('alert', (alert: RealtimeAlert) => {
        this.notifyListeners('__alerts__', alert)
      })

      this.socket.on('error', (error: Error) => {
        console.error('WebSocket error:', error)
      })
    } catch (error) {
      console.error('Failed to connect to WebSocket server:', error)
      this.scheduleReconnect(loadPlanIds)
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.isConnected = false
    this.stopPolling()
  }
}
```

---

## 🔧 **Alternative: Server-Sent Events (SSE)**

If WebSocket is not available, use SSE:

Create `app/api/load-design/realtime/sse/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import { realtimeService } from '@/lib/services/load-design/realtime/realtimeService'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const loadPlanId = searchParams.get('loadPlanId')

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      const unsubscribe = realtimeService.subscribe(loadPlanId || '', (update) => {
        const data = `data: ${JSON.stringify(update)}\n\n`
        controller.enqueue(encoder.encode(data))
      })

      // Keep connection alive
      const interval = setInterval(() => {
        controller.enqueue(encoder.encode(': keepalive\n\n'))
      }, 30000)

      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        unsubscribe()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

---

## 📊 **Environment Variables**

Add to `.env`:

```env
# WebSocket Configuration
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3000
WEBSOCKET_PORT=3001
```

---

## ✅ **Testing**

### **Test WebSocket Connection**

```typescript
// Client-side test
import { realtimeService } from '@/lib/services/load-design/realtime/realtimeService'

realtimeService.connect(['load-plan-123'])

realtimeService.subscribe('load-plan-123', (update) => {
  console.log('Received update:', update)
})
```

---

## 📚 **Additional Resources**

- **Socket.io Documentation**: https://socket.io/docs/v4/
- **WebSocket API**: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- **Server-Sent Events**: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
- **Next.js Custom Server**: https://nextjs.org/docs/pages/building-your-application/configuring/custom-server

---

**Status**: Framework ready, implementation pending  
**Recommended**: Socket.io for production use









