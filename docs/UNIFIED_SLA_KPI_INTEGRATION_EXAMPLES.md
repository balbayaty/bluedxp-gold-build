# Unified SLA/KPI Service - Integration Examples

## 🔗 How Modules Integrate with Unified Service

This document shows real-world examples of how different modules integrate with the unified SLA/KPI service.

## 📦 Transportation Module Integration

### Example: Track Shipment SLA

```typescript
// lib/services/transportation/shipmentService.ts

import { transportationSlaKpiAdapter } from '@/lib/services/sla-kpi'
import { eventBus } from '@/lib/services/event-store'

export class ShipmentService {
  async createShipment(shipmentData: any, tenantId: string) {
    // Create shipment
    const shipment = await this.saveShipment(shipmentData)
    
    // Publish event - unified service will automatically track
    await eventBus.publish(createEvent(
      'transportation.shipment.created',
      shipment.id,
      'Shipment',
      { shipment },
      1,
      { tenantId }
    ))
    
    // Get SLA requirements for this shipment
    const slas = await transportationSlaKpiAdapter.getSLARequirements(
      shipment.id,
      shipment.carrierId,
      tenantId
    )
    
    // Calculate initial risk
    if (slas.length > 0) {
      const risk = await transportationSlaKpiAdapter.calculateSLARisk(
        shipment.id,
        shipment.carrierId,
        shipment.estimatedTransitTime,
        tenantId
      )
      
      if (risk.riskLevel === 'CRITICAL') {
        // Alert operations team
        await this.alertOperations(shipment.id, risk)
      }
    }
    
    return shipment
  }
  
  async deliverShipment(shipmentId: string, deliveryData: any, tenantId: string) {
    const shipment = await this.getShipment(shipmentId)
    
    // Update shipment with delivery info
    await this.updateShipment(shipmentId, {
      status: 'DELIVERED',
      deliveryTime: deliveryData.deliveryTime,
      actualTransitTime: this.calculateTransitTime(shipment.pickupTime, deliveryData.deliveryTime),
    })
    
    // Publish event - unified service will calculate compliance
    await eventBus.publish(createEvent(
      'transportation.shipment.delivered',
      shipmentId,
      'Shipment',
      {
        shipmentId,
        pickupTime: shipment.pickupTime,
        deliveryTime: deliveryData.deliveryTime,
        carrierId: shipment.carrierId,
      },
      1,
      { tenantId }
    ))
    
    // Get compliance result
    const compliance = await transportationSlaKpiAdapter.checkSLACompliance(
      shipmentId,
      shipment.carrierId,
      {
        actual: this.calculateTransitTime(shipment.pickupTime, deliveryData.deliveryTime),
        target: shipment.estimatedTransitTime,
      },
      tenantId
    )
    
    // Handle breach if needed
    if (!compliance.compliant) {
      await this.handleSLABreach(shipmentId, compliance)
    }
    
    return shipment
  }
}
```

## 🏭 WMS Module Integration

### Example: Track ASN Processing SLA

```typescript
// lib/services/wms/asnService.ts

import { wmsSlaKpiAdapter } from '@/lib/services/sla-kpi'
import { eventBus } from '@/lib/services/event-store'

export class ASNService {
  async receiveASN(asnData: any, tenantId: string) {
    const asn = await this.createASN(asnData)
    
    // Publish event - unified service will track dock-to-stock SLA
    await eventBus.publish(createEvent(
      'wms.asn.received',
      asn.id,
      'ASN',
      {
        asnId: asn.id,
        warehouseId: asn.warehouseId,
        receivedTime: new Date(),
        vendorId: asn.vendorId,
      },
      1,
      { tenantId }
    ))
    
    // Get SLA metrics for this warehouse
    const metrics = await wmsSlaKpiAdapter.getSlaMetrics(
      asn.warehouseId,
      'ASN',
      tenantId
    )
    
    // Check if we have dock-to-stock SLA
    const dockToStockSLA = metrics.find(m => m.stageName === 'Dock-to-Stock')
    
    if (dockToStockSLA) {
      // Set target completion time
      const targetCompletion = new Date(
        asn.receivedTime.getTime() + dockToStockSLA.targetDuration * 1000
      )
      
      // Schedule putaway to meet SLA
      await this.schedulePutaway(asn.id, targetCompletion)
    }
    
    return asn
  }
  
  async completeASN(asnId: string, tenantId: string) {
    const asn = await this.getASN(asnId)
    
    await this.updateASN(asnId, {
      status: 'COMPLETED',
      completedTime: new Date(),
    })
    
    // Publish event - unified service will calculate compliance
    await eventBus.publish(createEvent(
      'wms.asn.completed',
      asnId,
      'ASN',
      {
        asnId,
        warehouseId: asn.warehouseId,
        receivedTime: asn.receivedTime,
        completedTime: new Date(),
      },
      1,
      { tenantId }
    ))
    
    // Get performance dashboard
    const dashboard = await wmsSlaKpiAdapter.getPerformanceDashboard(
      asn.warehouseId,
      '7d',
      tenantId
    )
    
    // Check if performance is below target
    if (dashboard.overallEfficiency < 90) {
      await this.alertWarehouseManager(asn.warehouseId, dashboard)
    }
    
    return asn
  }
}
```

## 🗺️ Geofence Module Integration

### Example: Track Zone Dwell Time SLA

```typescript
// lib/services/geofence/zone-service.ts

import { geofenceSlaKpiAdapter } from '@/lib/services/sla-kpi'
import { eventBus } from '@/lib/services/event-store'

export class GeofenceZoneService {
  async detectZoneEntry(
    shipmentId: string,
    zoneId: string,
    timestamp: Date,
    tenantId: string
  ) {
    const zone = await this.getZone(zoneId, tenantId)
    
    // Publish event - unified service will track dwell time
    await eventBus.publish(createEvent(
      'geofence.zone.entry',
      `${shipmentId}-${zoneId}`,
      'GeofenceEvent',
      {
        shipmentId,
        zoneId,
        zoneType: zone.type,
        timestamp,
      },
      1,
      { tenantId }
    ))
    
    // Check SLA compliance for this zone
    const complianceResults = await geofenceSlaKpiAdapter.checkSLACompliance(
      {
        id: `${shipmentId}-${zoneId}`,
        shipmentId,
        zoneId,
        type: 'ZONE_ENTRY',
        timestamp,
      },
      zone,
      tenantId
    )
    
    // Alert if at risk
    for (const compliance of complianceResults) {
      if (compliance.riskLevel === 'HIGH' || compliance.riskLevel === 'CRITICAL') {
        await this.alertCarrier(shipmentId, zone, compliance)
      }
    }
  }
  
  async detectZoneExit(
    shipmentId: string,
    zoneId: string,
    entryTime: Date,
    exitTime: Date,
    tenantId: string
  ) {
    const zone = await this.getZone(zoneId, tenantId)
    const dwellTime = (exitTime.getTime() - entryTime.getTime()) / 1000 / 60 // minutes
    
    // Publish event - unified service will calculate compliance
    await eventBus.publish(createEvent(
      'geofence.zone.exit',
      `${shipmentId}-${zoneId}`,
      'GeofenceEvent',
      {
        shipmentId,
        zoneId,
        zoneType: zone.type,
        entryTime,
        exitTime,
        dwellTime,
      },
      1,
      { tenantId }
    ))
    
    // Check final compliance
    const complianceResults = await geofenceSlaKpiAdapter.checkSLACompliance(
      {
        id: `${shipmentId}-${zoneId}`,
        shipmentId,
        zoneId,
        type: 'ZONE_EXIT',
        timestamp: exitTime,
        dwellTime,
      },
      zone,
      tenantId
    )
    
    // Handle breach if needed
    for (const compliance of complianceResults) {
      if (!compliance.compliant) {
        await this.handleDwellTimeBreach(shipmentId, zone, compliance)
      }
    }
  }
}
```

## 📊 Dashboard Integration

### Example: Custom Dashboard Component

```typescript
// app/dashboard/sla-kpi-section.tsx

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function SlaKpiSection({ tenantId }: { tenantId: string }) {
  const [metrics, setMetrics] = useState<any>(null)
  
  useEffect(() => {
    async function loadMetrics() {
      const response = await fetch(`/api/sla-kpi/unified?tenantId=${tenantId}&type=both`)
      const { data } = await response.json()
      setMetrics(data)
    }
    
    loadMetrics()
    const interval = setInterval(loadMetrics, 5 * 60 * 1000) // Every 5 minutes
    return () => clearInterval(interval)
  }, [tenantId])
  
  if (!metrics) return <div>Loading...</div>
  
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>SLA Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {metrics.sla.overallCompliance.toFixed(1)}%
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between">
              <span>Active SLAs</span>
              <Badge>{metrics.sla.activeSLAs}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Compliant</span>
              <Badge variant="default">{metrics.sla.compliantSLAs}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Breached</span>
              <Badge variant="destructive">{metrics.sla.breachedSLAs}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>KPI Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {metrics.kpi.overallPerformance.toFixed(1)}%
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between">
              <span>Active KPIs</span>
              <Badge>{metrics.kpi.activeKPIs}</Badge>
            </div>
            <div className="flex justify-between">
              <span>On Target</span>
              <Badge variant="default">{metrics.kpi.onTargetKPIs}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Below Target</span>
              <Badge variant="destructive">{metrics.kpi.belowTargetKPIs}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

## 🔔 Notification Integration

### Example: Alert on SLA Breach

```typescript
// lib/services/notifications/slaAlertService.ts

import { unifiedSlaKpiService } from '@/lib/services/sla-kpi'
import { eventBus } from '@/lib/services/event-store'

// Subscribe to SLA compliance events
eventBus.subscribe('sla.compliance.calculated', async (event: any) => {
  const { result, sla } = event.data
  
  if (result.status === 'BREACH' || result.status === 'CRITICAL') {
    // Send notification
    await sendNotification({
      type: 'SLA_BREACH',
      severity: result.status === 'BREACH' ? 'CRITICAL' : 'HIGH',
      title: `SLA Breach: ${sla.name}`,
      message: `${sla.partyName} has ${result.status === 'BREACH' ? 'breached' : 'critically violated'} SLA ${sla.name}`,
      recipients: getSLAStakeholders(sla),
      data: {
        slaId: sla.id,
        complianceId: result.id,
        transactionId: result.transactionId,
      },
    })
    
    // Escalate if needed
    if (result.status === 'BREACH') {
      await escalateToManagement(sla, result)
    }
  }
})
```

## 📈 Analytics Integration

### Example: Generate Performance Report

```typescript
// lib/services/analytics/slaKpiReportService.ts

import { unifiedSlaKpiService } from '@/lib/services/sla-kpi'

export class SlaKpiReportService {
  async generatePerformanceReport(
    tenantId: string,
    period: { start: Date; end: Date }
  ) {
    // Get SLA dashboard
    const slaDashboard = await unifiedSlaKpiService.getSLADashboard(tenantId, {
      timeRange: period,
    })
    
    // Get KPI dashboard
    const kpiDashboard = await unifiedSlaKpiService.getKPIDashboard(tenantId, {
      period,
    })
    
    // Generate report
    return {
      period,
      summary: {
        slaCompliance: slaDashboard.overallCompliance,
        kpiPerformance: kpiDashboard.overallPerformance,
        totalSLAs: slaDashboard.activeSLAs,
        totalKPIs: kpiDashboard.activeKPIs,
        breaches: slaDashboard.breachedSLAs,
        belowTarget: kpiDashboard.belowTargetKPIs,
      },
      slaBreakdown: slaDashboard.slaByModule,
      kpiBreakdown: kpiDashboard.kpiByModule,
      recentBreaches: slaDashboard.recentBreaches,
      topKPIs: kpiDashboard.topKPIs,
      recommendations: this.generateRecommendations(slaDashboard, kpiDashboard),
    }
  }
  
  private generateRecommendations(slaDashboard: any, kpiDashboard: any): string[] {
    const recommendations: string[] = []
    
    if (slaDashboard.breachedSLAs > 0) {
      recommendations.push(`Address ${slaDashboard.breachedSLAs} breached SLAs immediately`)
    }
    
    if (slaDashboard.atRiskSLAs > 5) {
      recommendations.push(`Monitor ${slaDashboard.atRiskSLAs} at-risk SLAs closely`)
    }
    
    if (kpiDashboard.belowTargetKPIs > kpiDashboard.activeKPIs * 0.2) {
      recommendations.push(`Improve performance on ${kpiDashboard.belowTargetKPIs} below-target KPIs`)
    }
    
    return recommendations
  }
}
```

## 🎯 Best Practices

1. **Publish Events** - Always publish events so unified service can track automatically
2. **Use Adapters** - Use module adapters for module-specific operations
3. **Handle Breaches** - Implement breach handling logic in your services
4. **Monitor Dashboards** - Regularly check unified dashboards for insights
5. **Set Up Alerts** - Configure notifications for breaches and critical status

---

**See Also**:
- `docs/UNIFIED_SLA_KPI_EXAMPLES.md` - More code examples
- `docs/UNIFIED_SLA_KPI_IMPLEMENTATION.md` - Complete implementation guide


