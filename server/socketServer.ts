/**
 * WebSocket Server for Real-Time Load Design Updates
 * 
 * Uses Socket.io for real-time communication
 * Supports load plan updates, alerts, and live monitoring
 */

import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { realtimeService } from '@/lib/services/load-design/realtime/realtimeService'
import type { RealtimeLoadUpdate, RealtimeAlert } from '@/lib/services/load-design/realtime/realtimeService'

export interface SocketUser {
  id: string
  tenantId?: string
  loadPlanIds: Set<string>
}

export function initializeSocketServer(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
  })

  // Store active connections
  const activeConnections = new Map<string, SocketUser>()

  io.on('connection', (socket: Socket) => {
    console.log('✅ Client connected:', socket.id)

    // Initialize user data
    const user: SocketUser = {
      id: socket.id,
      tenantId: socket.handshake.auth?.tenantId,
      loadPlanIds: new Set(),
    }
    activeConnections.set(socket.id, user)

    // Subscribe to load plan updates
    socket.on('subscribe-load-plan', (loadPlanId: string) => {
      if (!loadPlanId) {
        socket.emit('error', { message: 'Load plan ID is required' })
        return
      }

      console.log(`📡 Subscribing ${socket.id} to load plan: ${loadPlanId}`)
      user.loadPlanIds.add(loadPlanId)

      // Subscribe via realtime service
      const unsubscribe = realtimeService.subscribe(loadPlanId, (update: RealtimeLoadUpdate | RealtimeAlert) => {
        socket.emit('load-plan-update', update)
      })

      // Store unsubscribe function
      socket.data.unsubscribes = socket.data.unsubscribes || new Map()
      socket.data.unsubscribes.set(loadPlanId, unsubscribe)

      socket.emit('subscribed', { loadPlanId })
    })

    // Unsubscribe from load plan updates
    socket.on('unsubscribe-load-plan', (loadPlanId: string) => {
      console.log(`📡 Unsubscribing ${socket.id} from load plan: ${loadPlanId}`)
      user.loadPlanIds.delete(loadPlanId)

      const unsubscribe = socket.data.unsubscribes?.get(loadPlanId)
      if (unsubscribe) {
        unsubscribe()
        socket.data.unsubscribes.delete(loadPlanId)
      }

      socket.emit('unsubscribed', { loadPlanId })
    })

    // Subscribe to all alerts
    socket.on('subscribe-alerts', () => {
      console.log(`📡 Subscribing ${socket.id} to alerts`)
      
      const unsubscribe = realtimeService.subscribeToAlerts((alert: RealtimeAlert) => {
        // Filter by tenant if applicable
        if (!user.tenantId || alert.loadPlanId?.includes(user.tenantId)) {
          socket.emit('alert', alert)
        }
      })

      socket.data.alertUnsubscribe = unsubscribe
      socket.emit('subscribed-alerts', {})
    })

    // Unsubscribe from alerts
    socket.on('unsubscribe-alerts', () => {
      console.log(`📡 Unsubscribing ${socket.id} from alerts`)
      
      if (socket.data.alertUnsubscribe) {
        socket.data.alertUnsubscribe()
        delete socket.data.alertUnsubscribe
      }

      socket.emit('unsubscribed-alerts', {})
    })

    // Request load plan status
    socket.on('get-load-plan-status', async (loadPlanId: string) => {
      try {
        // TODO: Fetch from database
        // For now, return mock status
        socket.emit('load-plan-status', {
          loadPlanId,
          status: 'IN_TRANSIT',
          utilization: 85,
          location: null,
        })
      } catch (error) {
        socket.emit('error', { message: 'Failed to get load plan status' })
      }
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id)

      // Clean up all subscriptions
      if (socket.data.unsubscribes) {
        socket.data.unsubscribes.forEach((unsubscribe: () => void) => {
          unsubscribe()
        })
      }

      if (socket.data.alertUnsubscribe) {
        socket.data.alertUnsubscribe()
      }

      activeConnections.delete(socket.id)
    })

    // Handle errors
    socket.on('error', (error: Error) => {
      console.error('Socket error:', error)
      socket.emit('error', { message: error.message })
    })

    // Send connection confirmation
    socket.emit('connected', {
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    })
  })

  // Publish updates from backend
  io.publishUpdate = (update: RealtimeLoadUpdate) => {
    realtimeService.publishUpdate(update)
    io.emit('load-plan-update', update)
  }

  io.publishAlert = (alert: RealtimeAlert) => {
    realtimeService.publishAlert(alert)
    io.emit('alert', alert)
  }

  console.log('✅ WebSocket server initialized')
  return io
}

// Extend SocketIOServer type
declare module 'socket.io' {
  interface Server {
    publishUpdate(update: RealtimeLoadUpdate): void
    publishAlert(alert: RealtimeAlert): void
  }
}









