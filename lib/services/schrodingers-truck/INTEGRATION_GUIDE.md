# Schrödinger's Truck - Integration Guide

## 🔗 How to Use Quantum State Across the App

This guide shows you how to use Schrödinger's Truck in any module, page, or component.

---

## 📍 **Where It's Already Integrated**

### **✅ Transportation Module**
- Auto-initializes on shipment creation
- Updates on touchpoint events
- Available in all shipment pages

### **✅ Journey Analysis**
- Touchpoint events trigger collapse
- Real-time state updates

---

## 🎯 **How to Use in Your Module**

### **1. In a React Component**

```tsx
import { QuantumStateIndicator } from '@/components/quantum-state/QuantumStateIndicator'
import { useQuantumState } from '@/hooks/useQuantumState'

function MyShipmentPage({ shipmentId }: { shipmentId: string }) {
  const { quantumState, collapse } = useQuantumState(shipmentId)

  return (
    <div>
      <QuantumStateIndicator shipmentId={shipmentId} showDetails />
      
      {quantumState && (
        <div>
          <p>State: {quantumState.currentState}</p>
          <p>On-Time: {(quantumState.probabilities.onTime * 100).toFixed(1)}%</p>
        </div>
      )}
    </div>
  )
}
```

### **2. In an API Route**

```typescript
import { schrodingersTruckService } from '@/lib/services/schrodingers-truck'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const quantumState = await schrodingersTruckService.getQuantumState(params.id)
  
  return Response.json({
    shipment: shipmentData,
    quantumState: {
      state: quantumState?.currentState,
      probabilities: quantumState?.probabilities,
    },
  })
}
```

### **3. In a Service**

```typescript
import { schrodingersTruckService } from '@/lib/services/schrodingers-truck'

export class MyService {
  async processShipment(shipmentId: string) {
    // Get quantum state
    const quantumState = await schrodingersTruckService.getQuantumState(shipmentId)
    
    // Use state for decision making
    if (quantumState?.currentState === 'PHANTOM') {
      // High risk - take action
      await this.activateBackupPlan(shipmentId)
    }
    
    // Trigger collapse when event happens
    await schrodingersTruckService.updateQuantumState(
      shipmentId,
      'MANUAL_UPDATE',
      { reason: 'Customer confirmed readiness' }
    )
  }
}
```

### **4. In a Dashboard Widget**

```tsx
import { useQuantumState } from '@/hooks/useQuantumState'

function QuantumStateWidget({ shipmentId }: { shipmentId: string }) {
  const { quantumState } = useQuantumState(shipmentId)

  if (!quantumState) return null

  return (
    <div className="widget">
      <h3>Quantum State</h3>
      <div className={`state-${quantumState.currentState.toLowerCase()}`}>
        {quantumState.currentState}
      </div>
      <div className="probabilities">
        <div>On-Time: {(quantumState.probabilities.onTime * 100).toFixed(1)}%</div>
        <div>Delayed: {(quantumState.probabilities.delayed * 100).toFixed(1)}%</div>
        <div>No-Show: {(quantumState.probabilities.noShow * 100).toFixed(1)}%</div>
      </div>
    </div>
  )
}
```

### **5. In Event Handlers**

```typescript
import { schrodingersTruckService } from '@/lib/services/schrodingers-truck'

// When WhatsApp message received
export async function handleWhatsAppMessage(message: WhatsAppMessage) {
  await schrodingersTruckService.handleWhatsAppMessage(message)
}

// When geofence event occurs
export async function handleGeofenceEvent(event: GeofenceEvent) {
  await schrodingersTruckService.handleGeofenceEvent(event)
}

// When GPS update received
export async function handleGPSUpdate(update: GPSUpdate) {
  await schrodingersTruckService.handleGPSUpdate(update)
}
```

---

## 🔄 **Auto-Integration Points**

The service automatically integrates with:

1. **Shipment Creation** → Auto-initializes quantum state
2. **Touchpoint Events** → Auto-updates quantum state
3. **Event Store** → All changes logged
4. **Knowledge Base** → Learning signals stored
5. **MCP Server** → Tools available to AI agents

---

## 📊 **Use Cases**

### **Use Case 1: Shipment Tracking Page**
Show quantum state alongside traditional status.

### **Use Case 2: Exception Management**
Use PHANTOM state to prioritize alerts.

### **Use Case 3: Customer Portal**
Show delivery probability to customers.

### **Use Case 4: Analytics Dashboard**
Aggregate quantum states for insights.

### **Use Case 5: AI Copilot**
Query quantum state via natural language.

---

## 🎨 **Visual Integration**

The `QuantumStateIndicator` component can be dropped into:
- Shipment cards
- Tracking pages
- Dashboards
- Reports
- Anywhere you need state visualization

---

## 🔧 **Customization**

### **Custom Triggers**
Add your own trigger types in `types.ts` and handle them in `integrations.ts`.

### **Custom Factors**
Add new factors to the probability calculation in `probability-engine.ts`.

### **Custom UI**
Use the hook to build your own UI components.

---

**The service is designed to be used everywhere. Just import and use!** 🚀

