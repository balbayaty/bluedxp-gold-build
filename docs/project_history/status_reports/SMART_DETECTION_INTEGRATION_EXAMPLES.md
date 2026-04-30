# 🚀 Smart Detection Form - Integration Examples

## Quick Integration Examples for Common Forms

---

## **Example 1: CAPA Form**

```typescript
import AdvancedSmartDetectionForm from '@/components/forms/AdvancedSmartDetectionForm'
import { createFormFields, createDetectionContext, createFormId } from '@/lib/utils/formHelpers'

// In your component
<AdvancedSmartDetectionForm
  formId={createFormId('capa')}
  fields={createFormFields('CAPA', {
    subject: '',
    capaType: 'Corrective Action',
    priority: 'Medium',
  })}
  context={createDetectionContext('CAPA', 'iso-ims', {
    relatedEntityId: linkedNCR,
    relatedEntityType: 'NCR',
    previousForms: previousCAPAs,
  })}
  onSubmit={async (data) => {
    // Save CAPA
    await createCAPA(data)
  }}
  onCancel={() => setShowModal(false)}
  title="Create CAPA"
  isDark={true}
/>
```

---

## **Example 2: Incident Form**

```typescript
import AdvancedSmartDetectionForm from '@/components/forms/AdvancedSmartDetectionForm'
import { createFormFields, createDetectionContext, createFormId } from '@/lib/utils/formHelpers'

// In your component
<AdvancedSmartDetectionForm
  formId={createFormId('incident')}
  fields={createFormFields('INCIDENT')}
  context={createDetectionContext('INCIDENT', 'qhse', {
    location: currentLocation,
    department: currentDepartment,
    previousForms: previousIncidents,
  })}
  onSubmit={async (data) => {
    // Save incident
    await createIncident(data)
  }}
  onCancel={() => setShowModal(false)}
  title="Report Incident"
  isDark={true}
/>
```

---

## **Example 3: Inspection Form**

```typescript
import AdvancedSmartDetectionForm from '@/components/forms/AdvancedSmartDetectionForm'
import { createFormFields, createDetectionContext, createFormId } from '@/lib/utils/formHelpers'

// In your component
<AdvancedSmartDetectionForm
  formId={createFormId('inspection')}
  fields={createFormFields('INSPECTION')}
  context={createDetectionContext('INSPECTION', 'qhse', {
    location: currentLocation,
    previousForms: previousInspections,
  })}
  onSubmit={async (data) => {
    // Save inspection
    await createInspection(data)
  }}
  onCancel={() => setShowModal(false)}
  title="Schedule Inspection"
  isDark={true}
/>
```

---

## **Example 4: Training Form**

```typescript
import AdvancedSmartDetectionForm from '@/components/forms/AdvancedSmartDetectionForm'
import { createFormFields, createDetectionContext, createFormId } from '@/lib/utils/formHelpers'

// In your component
<AdvancedSmartDetectionForm
  formId={createFormId('training')}
  fields={createFormFields('TRAINING')}
  context={createDetectionContext('TRAINING', 'qhse', {
    department: currentDepartment,
    previousForms: previousTrainings,
  })}
  onSubmit={async (data) => {
    // Save training
    await createTraining(data)
  }}
  onCancel={() => setShowModal(false)}
  title="Create Training Program"
  isDark={true}
/>
```

---

## **Example 5: Custom Form**

```typescript
import AdvancedSmartDetectionForm from '@/components/forms/AdvancedSmartDetectionForm'
import type { AdvancedDetectionContext } from '@/lib/services/forms/advancedSmartDetectionService'

// Custom fields
const customFields = [
  {
    id: 'field1',
    name: 'field1',
    type: 'text',
    label: 'Custom Field 1',
    value: '',
    required: true,
  },
  {
    id: 'field2',
    name: 'field2',
    type: 'select',
    label: 'Custom Field 2',
    value: '',
    required: true,
    options: [
      { label: 'Option 1', value: 'opt1' },
      { label: 'Option 2', value: 'opt2' },
    ],
  },
]

// Custom context
const customContext: AdvancedDetectionContext = {
  formType: 'OTHER',
  moduleId: 'custom-module',
  location: 'Warehouse A',
  department: 'Operations',
  previousForms: previousRecords,
}

// Use it
<AdvancedSmartDetectionForm
  formId={`custom-form-${Date.now()}`}
  fields={customFields}
  context={customContext}
  onSubmit={async (data) => {
    // Handle submission
    console.log(data)
  }}
  onCancel={() => setShowModal(false)}
  title="Custom Form"
  isDark={true}
/>
```

---

## **Benefits of Using Helpers**

The helper functions (`createFormFields`, `createDetectionContext`, `createFormId`) make it super easy to:

1. ✅ **Quick Setup** - Pre-configured fields for common form types
2. ✅ **Consistency** - Same field structure across the platform
3. ✅ **Less Code** - No need to define fields manually
4. ✅ **Easy Customization** - Override with initial values
5. ✅ **Type Safety** - TypeScript support

---

## **Next Steps**

1. Replace existing forms with `AdvancedSmartDetectionForm`
2. Use helper functions for quick integration
3. Customize fields and context as needed
4. Enjoy intelligent form filling everywhere! 🎉











