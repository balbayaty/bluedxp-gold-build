# 🚀 Advanced Smart Detection Form - Usage Guide

## ✨ **UNIVERSAL FORM SYSTEM - USE ANYWHERE!**

The Advanced Smart Detection Form is a **generic, reusable system** that can be used for **ANY form type** across the entire platform. It's not just for NCRs!

---

## 📋 **WHERE IT CAN BE USED**

### **1. ISO IMS Module** ✅

#### **NCR Management** ✅ (Already Integrated)
- **Location**: `app/ncr-management/page.tsx`
- **Status**: ✅ Integrated
- **Fields**: Subject, Type, Priority, Severity, Immediate Action, Root Cause, Assigned To

#### **CAPA Management** 🔄 (Can Be Integrated)
- **Location**: `app/capa-management/page.tsx`
- **Current**: Uses `AdvancedCAPAForm.tsx` (multi-step form)
- **Can Enhance**: Replace or enhance with smart detection
- **Fields**: Subject, Type, Priority, Root Cause, Action Plan, Resources, Budget, Impact

#### **My CAPA Workspace** 🔄 (Can Be Integrated)
- **Location**: `app/my-capa-workspace/page.tsx`
- **Current**: Uses `EditCAPAModal.tsx`
- **Can Enhance**: Add smart detection to edit form
- **Fields**: Status, Priority, Action Plan, Root Cause, Effectiveness Review

#### **Inspection Checklist** 🔄 (Can Be Integrated)
- **Location**: `app/inspection-checklist/page.tsx`
- **Current**: Basic form
- **Can Enhance**: Add smart detection
- **Fields**: Title, Type, Scheduled Date, Inspector, Location, Findings

#### **Incident Report** 🔄 (Can Be Integrated)
- **Location**: `app/incident-report/page.tsx`
- **Current**: Uses `IncidentReportForm.tsx`
- **Can Enhance**: Add smart detection
- **Fields**: Type, Severity, Title, Description, Location, Date, OSHA/RIDDOR flags

#### **User Management** 🔄 (Can Be Integrated)
- **Location**: `app/user-management/page.tsx`
- **Can Enhance**: Add smart detection for user creation/editing
- **Fields**: Name, Email, Role, Department, Permissions

---

### **2. QHSE Module** 🔄

#### **QHSE Incidents** 🔄 (Can Be Integrated)
- **Location**: `app/qhse/incidents/page.tsx`
- **Current**: Basic form
- **Can Enhance**: Add smart detection
- **Fields**: Type, Severity, Location, Description, Reported By, Investigation Details

#### **QHSE Inspections** 🔄 (Can Be Integrated)
- **Location**: `app/qhse/inspections/page.tsx`
- **Current**: Basic form
- **Can Enhance**: Add smart detection
- **Fields**: Type, Scheduled Date, Inspector, Location, Checklist Items, Findings

#### **QHSE Training** 🔄 (Can Be Integrated)
- **Location**: `app/qhse/training/page.tsx`
- **Current**: Basic form
- **Can Enhance**: Add smart detection
- **Fields**: Program Name, Type, Participants, Date, Duration, Certification

#### **QHSE Environmental** 🔄 (Can Be Integrated)
- **Location**: `app/qhse/environmental/page.tsx`
- **Can Enhance**: Add smart detection for environmental metrics
- **Fields**: Metric Type, Value, Date, Location, Unit

#### **QHSE Regulatory** 🔄 (Can Be Integrated)
- **Location**: `app/qhse/regulatory/page.tsx`
- **Can Enhance**: Add smart detection for compliance records
- **Fields**: Regulation, Requirement, Status, Due Date, Evidence

---

### **3. Chemical Management Module** 🔄

#### **Chemical Container Creation** 🔄 (Can Be Integrated)
- **Location**: `app/chemical-inventory/containers/page.tsx`
- **Current**: `CreateContainerForm` component
- **Can Enhance**: Add smart detection
- **Fields**: Container Number, Chemical ID, Type, Capacity, Location, Quantity

#### **MSDS Upload** 🔄 (Can Be Integrated)
- **Location**: `components/MSDSUpload.tsx`
- **Can Enhance**: Add smart detection for MSDS metadata
- **Fields**: Chemical Name, CAS Number, Manufacturer, Revision Date

#### **Chemical Registration** 🔄 (Can Be Integrated)
- **Can Enhance**: Add smart detection for new chemical registration
- **Fields**: Name, CAS Number, Formula, Hazards, Storage Requirements

---

### **4. Trade Compliance Module** 🔄

#### **Trade Compliance Record Creation** 🔄 (Can Be Integrated)
- **Location**: `app/trade-compliance/create/page.tsx`
- **Current**: Basic form
- **Can Enhance**: Add smart detection
- **Fields**: Record Type, Country, Regulation, Status, Documents, Due Date

#### **License Application** 🔄 (Can Be Integrated)
- **Location**: `components/trade-compliance/LicenseApplicationWizard.tsx`
- **Can Enhance**: Add smart detection to wizard steps
- **Fields**: License Type, Country, Products, Validity, Requirements

---

### **5. WMS Module** 🔄

#### **Storage Location Creation** 🔄 (Can Be Integrated)
- **Location**: `components/StorageLocationForm.tsx`
- **Can Enhance**: Add smart detection
- **Fields**: Location Code, Name, Type, Zone, Capacity, Restrictions

#### **Warehouse Area Management** 🔄 (Can Be Integrated)
- **Location**: `components/WarehouseAreasManager.tsx`
- **Can Enhance**: Add smart detection
- **Fields**: Area Name, Type, Capacity, Temperature Range, Access Level

---

### **6. Transportation Module** 🔄

#### **Broker Registration** 🔄 (Can Be Integrated)
- **Can Enhance**: Add smart detection
- **Fields**: Company Name, License Number, Contact, Services, Certifications

#### **Vehicle Registration** 🔄 (Can Be Integrated)
- **Can Enhance**: Add smart detection
- **Fields**: Vehicle Number, Type, Capacity, Registration Date, Insurance

---

### **7. Proposals/RFQ Module** 🔄

#### **Proposal Creation** 🔄 (Can Be Integrated)
- **Location**: `app/proposals/new/page.tsx`
- **Can Enhance**: Add smart detection
- **Fields**: Title, Customer, Services, Pricing, Terms, Validity

#### **RFQ Creation** 🔄 (Can Be Integrated)
- **Can Enhance**: Add smart detection
- **Fields**: Title, Requirements, Deadline, Budget, Evaluation Criteria

---

### **8. Audit Module** 🔄

#### **Audit Creation** 🔄 (Can Be Integrated)
- **Can Enhance**: Add smart detection
- **Fields**: Type, Scope, Date, Auditor, Location, Standards

---

### **9. Training Module** 🔄

#### **Training Program Creation** 🔄 (Can Be Integrated)
- **Can Enhance**: Add smart detection
- **Fields**: Program Name, Type, Duration, Participants, Objectives, Materials

---

### **10. Document Management** 🔄

#### **Document Upload/Registration** 🔄 (Can Be Integrated)
- **Can Enhance**: Add smart detection for document metadata
- **Fields**: Title, Type, Category, Revision, Effective Date, Owner

---

## 🎯 **HOW TO USE IT ANYWHERE**

### **Step 1: Import the Component**

```typescript
import AdvancedSmartDetectionForm from '@/components/forms/AdvancedSmartDetectionForm'
import type { AdvancedDetectionContext } from '@/lib/services/forms/advancedSmartDetectionService'
```

### **Step 2: Define Your Form Fields**

```typescript
const fields = [
  {
    id: 'field1',
    name: 'field1',
    type: 'text',
    label: 'Field Label',
    value: '',
    required: true,
    placeholder: 'Enter value...',
  },
  {
    id: 'field2',
    name: 'field2',
    type: 'select',
    label: 'Select Field',
    value: '',
    required: true,
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
    ],
  },
  // ... more fields
]
```

### **Step 3: Define Detection Context**

```typescript
const context: AdvancedDetectionContext = {
  formType: 'CAPA', // or 'INCIDENT', 'INSPECTION', 'TRAINING', etc.
  moduleId: 'iso-ims', // or 'qhse', 'wms', etc.
  relatedEntityId: linkedNCR, // optional
  relatedEntityType: 'NCR', // optional
  location: currentLocation, // optional
  department: currentDepartment, // optional
  userRole: userRole, // optional
  tenantId: tenantId, // optional
  previousForms: previousRecords, // optional - for pattern learning
  language: 'en', // optional
  region: 'SA', // optional
}
```

### **Step 4: Use the Component**

```typescript
<AdvancedSmartDetectionForm
  formId={`form-${Date.now()}`}
  fields={fields}
  context={context}
  onSubmit={async (data) => {
    // Handle form submission
    console.log('Form data:', data)
    // Save to API, update state, etc.
  }}
  onCancel={() => {
    // Handle cancel
    setShowModal(false)
  }}
  title="Create New Record"
  isDark={true} // or false
/>
```

---

## 🎨 **ADVANTAGES OF USING IT**

### **1. Automatic Field Detection**
- ✅ Detects values from uploaded documents
- ✅ Detects values from uploaded images
- ✅ Detects values from voice input
- ✅ Detects values from context
- ✅ Learns from previous forms

### **2. Smart Defaults**
- ✅ Auto-fills dates (today, future dates)
- ✅ Auto-fills location from context
- ✅ Auto-fills department from context
- ✅ Auto-fills user information

### **3. Pattern Learning**
- ✅ Learns from similar forms
- ✅ Suggests common values
- ✅ Improves over time

### **4. Multi-Input Support**
- ✅ Document upload (PDF, DOC, TXT)
- ✅ Image upload (photos of forms)
- ✅ Voice input (speech-to-text)

### **5. Compliance Checking**
- ✅ Validates required fields
- ✅ Checks compliance rules
- ✅ Provides recommendations

### **6. Real-time Validation**
- ✅ Validates field types
- ✅ Checks formats (email, date, number)
- ✅ Shows errors immediately

---

## 📊 **SUPPORTED FORM TYPES**

The system supports these form types (defined in `AdvancedDetectionContext`):

- ✅ **NCR** - Non-Conformance Reports
- ✅ **CAPA** - Corrective/Preventive Actions
- ✅ **INCIDENT** - Incidents
- ✅ **AUDIT** - Audits
- ✅ **INSPECTION** - Inspections
- ✅ **TRAINING** - Training Records
- ✅ **DOCUMENT** - Document Registration
- ✅ **OTHER** - Any other form type

---

## 🚀 **QUICK INTEGRATION EXAMPLES**

### **Example 1: CAPA Form**

```typescript
<AdvancedSmartDetectionForm
  formId={`capa-form-${Date.now()}`}
  fields={[
    { id: 'subject', name: 'subject', type: 'text', label: 'CAPA Subject', value: '', required: true },
    { id: 'type', name: 'type', type: 'select', label: 'Type', value: '', required: true, options: [...] },
    { id: 'priority', name: 'priority', type: 'select', label: 'Priority', value: '', required: true, options: [...] },
    { id: 'rootCause', name: 'rootCause', type: 'textarea', label: 'Root Cause', value: '' },
    { id: 'actionPlan', name: 'actionPlan', type: 'textarea', label: 'Action Plan', value: '', required: true },
  ]}
  context={{
    formType: 'CAPA',
    moduleId: 'iso-ims',
    relatedEntityId: linkedNCR,
    relatedEntityType: 'NCR',
    previousForms: previousCAPAs,
  }}
  onSubmit={handleSubmit}
  onCancel={() => setShowModal(false)}
  title="Create CAPA"
  isDark={true}
/>
```

### **Example 2: Incident Form**

```typescript
<AdvancedSmartDetectionForm
  formId={`incident-form-${Date.now()}`}
  fields={[
    { id: 'type', name: 'type', type: 'select', label: 'Incident Type', value: '', required: true, options: [...] },
    { id: 'severity', name: 'severity', type: 'select', label: 'Severity', value: '', required: true, options: [...] },
    { id: 'title', name: 'title', type: 'text', label: 'Title', value: '', required: true },
    { id: 'description', name: 'description', type: 'textarea', label: 'Description', value: '', required: true },
    { id: 'location', name: 'location', type: 'text', label: 'Location', value: '', required: true },
    { id: 'occurredAt', name: 'occurredAt', type: 'date', label: 'Occurred At', value: '', required: true },
  ]}
  context={{
    formType: 'INCIDENT',
    moduleId: 'qhse',
    location: currentLocation,
    previousForms: previousIncidents,
  }}
  onSubmit={handleSubmit}
  onCancel={() => setShowModal(false)}
  title="Report Incident"
  isDark={true}
/>
```

---

## 🎉 **SUMMARY**

The Advanced Smart Detection Form is a **universal, reusable system** that can be used for **ANY form** across the entire platform:

- ✅ **10+ Detection Sources** - Documents, Images, Voice, Context, Patterns, AI, ML, Knowledge Base
- ✅ **Multi-Input Support** - Upload documents, images, or use voice
- ✅ **Pattern Learning** - Learns from previous forms
- ✅ **Compliance Checking** - Automatic validation
- ✅ **Real-time Analytics** - Track detection performance
- ✅ **Easy Integration** - Just define fields and context

**Use it everywhere for intelligent, time-saving form filling! 🚀**











