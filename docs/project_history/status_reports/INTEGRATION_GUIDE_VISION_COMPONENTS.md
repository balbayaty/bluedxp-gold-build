# 🔗 Vision Components Integration Guide

**How to add AI Vision to any page in your app**

---

## 📦 **AVAILABLE COMPONENTS**

### **1. VisionAnalysisButton** ✅
**Location:** `components/vision/VisionAnalysisButton.tsx`

**Purpose:** Reusable button to add vision analysis anywhere

**Usage:**
```tsx
import VisionAnalysisButton from '@/components/vision/VisionAnalysisButton'

<VisionAnalysisButton
  onAnalysisComplete={(result) => {
    // Handle analysis result
    console.log(result)
  }}
  module="wms"  // or 'qhse', 'iso-ims', 'tms', 'general'
  context="Custom context for analysis"
  buttonText="Analyze with AI"
  buttonIcon="ri-eye-line"
/>
```

### **2. VisionAutoFill** ✅
**Location:** `components/vision/VisionAutoFill.tsx`

**Purpose:** Auto-fills form fields from vision analysis

**Usage:**
```tsx
import VisionAutoFill from '@/components/vision/VisionAutoFill'

<VisionAutoFill
  analysisResult={analysisResult}
  formFields={[
    { id: 'damageType', name: 'damageType', type: 'select', label: 'Damage Type' },
    { id: 'severity', name: 'severity', type: 'select', label: 'Severity' },
    { id: 'description', name: 'description', type: 'textarea', label: 'Description' },
  ]}
  onFieldFill={(fieldId, value, confidence) => {
    // Update form state
    setFormData(prev => ({ ...prev, [fieldId]: value }))
  }}
  autoFillThreshold={75}  // Auto-fill if confidence >= 75%
  showSuggestions={true}  // Show suggestions for lower confidence
/>
```

### **3. Specialized Integration Components** ✅

#### **DamageReportVisionIntegration**
**Location:** `components/vision/DamageReportVisionIntegration.tsx`

**Usage:**
```tsx
import DamageReportVisionIntegration from '@/components/vision/DamageReportVisionIntegration'

<DamageReportVisionIntegration
  onDamageDetected={(damage) => {
    // Auto-fill damage fields
    setFormData({
      damageType: damage.type,
      severity: damage.severity,
      description: damage.description,
    })
  }}
  formFields={formFields}
  onFieldFill={handleFieldFill}
/>
```

#### **IncidentReportVisionIntegration**
**Location:** `components/vision/IncidentReportVisionIntegration.tsx`

**Usage:**
```tsx
import IncidentReportVisionIntegration from '@/components/vision/IncidentReportVisionIntegration'

<IncidentReportVisionIntegration
  onIncidentDetected={(incident) => {
    setFormData({
      type: incident.type,
      severity: incident.severity,
      description: incident.description,
    })
  }}
  formFields={formFields}
  onFieldFill={handleFieldFill}
/>
```

#### **GoodsReceiptVisionIntegration**
**Location:** `components/vision/GoodsReceiptVisionIntegration.tsx`

**Usage:**
```tsx
import GoodsReceiptVisionIntegration from '@/components/vision/GoodsReceiptVisionIntegration'

<GoodsReceiptVisionIntegration
  onVerificationComplete={(verification) => {
    if (verification.verified) {
      // Auto-approve receipt
    } else {
      // Show issues
    }
  }}
  formFields={formFields}
  onFieldFill={handleFieldFill}
/>
```

#### **PODVisionIntegration**
**Location:** `components/vision/PODVisionIntegration.tsx`

**Usage:**
```tsx
import PODVisionIntegration from '@/components/vision/PODVisionIntegration'

<PODVisionIntegration
  onPODComplete={(pod) => {
    if (pod.verified) {
      // Complete POD
    }
  }}
  formFields={formFields}
  onFieldFill={handleFieldFill}
/>
```

---

## 🎯 **INTEGRATION EXAMPLES**

### **Example 1: Add to Damage Reports Page**

```tsx
// app/damage/page.tsx
import DamageReportVisionIntegration from '@/components/vision/DamageReportVisionIntegration'

function DamageReportForm() {
  const [formData, setFormData] = useState({})
  const formFields = [
    { id: 'damageType', name: 'damageType', type: 'select', label: 'Damage Type' },
    { id: 'severity', name: 'severity', type: 'select', label: 'Severity' },
    { id: 'description', name: 'description', type: 'textarea', label: 'Description' },
  ]

  return (
    <form>
      {/* Photo Upload Section */}
      <div>
        <h3>Upload Damage Photos</h3>
        <DamageReportVisionIntegration
          onDamageDetected={(damage) => {
            setFormData(prev => ({
              ...prev,
              damageType: damage.type,
              severity: damage.severity,
              description: damage.description,
            }))
          }}
          formFields={formFields}
          onFieldFill={(fieldId, value) => {
            setFormData(prev => ({ ...prev, [fieldId]: value }))
          }}
        />
      </div>

      {/* Form Fields */}
      {/* ... rest of form ... */}
    </form>
  )
}
```

### **Example 2: Add to Incident Reports Page**

```tsx
// app/qhse/incidents/page.tsx
import IncidentReportVisionIntegration from '@/components/vision/IncidentReportVisionIntegration'

function IncidentReportForm() {
  const [formData, setFormData] = useState({})
  
  return (
    <form>
      <IncidentReportVisionIntegration
        onIncidentDetected={(incident) => {
          setFormData(prev => ({
            ...prev,
            type: incident.type,
            severity: incident.severity,
            description: incident.description,
          }))
        }}
        formFields={formFields}
        onFieldFill={handleFieldFill}
      />
      {/* ... rest of form ... */}
    </form>
  )
}
```

### **Example 3: Add to Goods Receipt Page**

```tsx
// app/goods-receipt/page.tsx
import GoodsReceiptVisionIntegration from '@/components/vision/GoodsReceiptVisionIntegration'

function GoodsReceiptForm() {
  return (
    <form>
      <GoodsReceiptVisionIntegration
        onVerificationComplete={(verification) => {
          if (verification.verified) {
            // Auto-approve
          } else {
            // Show issues
            alert(`Issues detected: ${verification.issues?.join(', ')}`)
          }
        }}
        formFields={formFields}
        onFieldFill={handleFieldFill}
      />
      {/* ... rest of form ... */}
    </form>
  )
}
```

### **Example 4: Add to POD Page**

```tsx
// app/pod/page.tsx
import PODVisionIntegration from '@/components/vision/PODVisionIntegration'

function PODForm() {
  return (
    <form>
      <PODVisionIntegration
        onPODComplete={(pod) => {
          if (pod.verified) {
            // Complete POD
            submitPOD()
          }
        }}
        formFields={formFields}
        onFieldFill={handleFieldFill}
      />
      {/* ... rest of form ... */}
    </form>
  )
}
```

---

## 🚀 **QUICK INTEGRATION STEPS**

### **Step 1: Import Component**
```tsx
import VisionAnalysisButton from '@/components/vision/VisionAnalysisButton'
// OR
import DamageReportVisionIntegration from '@/components/vision/DamageReportVisionIntegration'
```

### **Step 2: Add to Your Page**
```tsx
<VisionAnalysisButton
  onAnalysisComplete={handleAnalysis}
  module="wms"
/>
```

### **Step 3: Handle Results**
```tsx
const handleAnalysis = (result) => {
  // Use result to auto-fill forms, trigger workflows, etc.
  console.log(result)
}
```

---

## ✅ **BENEFITS**

- ✅ **One Component** - Works everywhere
- ✅ **Auto-Fill** - Saves time
- ✅ **Intelligent** - Context-aware
- ✅ **Module-Aware** - Uses correct analysis mode
- ✅ **Beautiful UI** - Professional design
- ✅ **Error Handling** - Graceful failures

---

## 🎯 **READY TO USE**

All components are ready to use! Just import and add to your pages! 🚀











