/**
 * Tests for Real-Time Service
 */

import { realtimeService } from '@/lib/services/load-design/realtime/realtimeService'
import type { RealtimeLoadUpdate, RealtimeAlert } from '@/lib/services/load-design/realtime/realtimeService'

describe('RealtimeService', () => {
  beforeEach(() => {
    realtimeService.disconnect()
  })

  afterEach(() => {
    realtimeService.disconnect()
  })

  it('should connect to real-time service', () => {
    realtimeService.connect(['load-plan-1'])
    
    const status = realtimeService.getConnectionStatus()
    expect(status).toBeDefined()
  })

  it('should subscribe to load plan updates', () => {
    let receivedUpdate: RealtimeLoadUpdate | null = null

    const unsubscribe = realtimeService.subscribe('load-plan-1', (update) => {
      receivedUpdate = update as RealtimeLoadUpdate
    })

    // Simulate update
    const mockUpdate: RealtimeLoadUpdate = {
      loadPlanId: 'load-plan-1',
      status: 'IN_TRANSIT',
      utilization: {
        overall: 85,
        weight: 80,
        volume: 90,
        cube: 85,
      },
      timestamp: new Date(),
    }

    realtimeService.publishUpdate(mockUpdate)

    expect(receivedUpdate).toBeDefined()
    expect(receivedUpdate?.loadPlanId).toBe('load-plan-1')

    unsubscribe()
  })

  it('should subscribe to alerts', () => {
    let receivedAlert: RealtimeAlert | null = null

    const unsubscribe = realtimeService.subscribeToAlerts((alert) => {
      receivedAlert = alert
    })

    // Simulate alert
    const mockAlert: RealtimeAlert = {
      id: 'alert-1',
      type: 'COMPLIANCE',
      severity: 'WARNING',
      title: 'Test Alert',
      message: 'Test message',
      loadPlanId: 'load-plan-1',
      timestamp: new Date(),
      acknowledged: false,
    }

    realtimeService.publishAlert(mockAlert)

    expect(receivedAlert).toBeDefined()
    expect(receivedAlert?.id).toBe('alert-1')

    unsubscribe()
  })

  it('should disconnect properly', () => {
    realtimeService.connect(['load-plan-1'])
    realtimeService.disconnect()

    const status = realtimeService.getConnectionStatus()
    expect(status.connected).toBe(false)
  })
})









