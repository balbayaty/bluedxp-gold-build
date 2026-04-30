/**
 * Form Helper Utilities
 * Makes it easy to use Advanced Smart Detection Form anywhere
 */

export type AdvancedDetectionContext = {
  formType: string
  moduleId: string
  [key: string]: any
}

export interface FormFieldConfig {
  id: string
  name: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'email' | 'url'
  label: string
  value?: any
  required?: boolean
  placeholder?: string
  options?: Array<{ label: string; value: any }>
}

/**
 * Create form fields configuration for common form types
 */
export function createFormFields(formType: string, initialValues?: Record<string, any>): FormFieldConfig[] {
  const baseFields: Record<string, FormFieldConfig[]> = {
    NCR: [
      {
        id: 'subject',
        name: 'subject',
        type: 'text',
        label: 'NCR Subject / Description',
        value: initialValues?.subject || '',
        required: true,
        placeholder: 'Brief description of the non-conformance...',
      },
      {
        id: 'ncType',
        name: 'ncType',
        type: 'select',
        label: 'NCR Type',
        value: initialValues?.ncType || 'Process',
        required: true,
        options: [
          { label: 'Product', value: 'Product' },
          { label: 'Process', value: 'Process' },
          { label: 'System', value: 'System' },
          { label: 'Supplier', value: 'Supplier' },
          { label: 'Customer', value: 'Customer' },
        ],
      },
      {
        id: 'priority',
        name: 'priority',
        type: 'select',
        label: 'Priority',
        value: initialValues?.priority || 'Medium',
        required: true,
        options: [
          { label: 'Low', value: 'Low' },
          { label: 'Medium', value: 'Medium' },
          { label: 'High', value: 'High' },
          { label: 'Critical', value: 'Critical' },
        ],
      },
      {
        id: 'severity',
        name: 'severity',
        type: 'select',
        label: 'Severity',
        value: initialValues?.severity || 'Minor',
        required: true,
        options: [
          { label: 'Minor', value: 'Minor' },
          { label: 'Major', value: 'Major' },
          { label: 'Critical', value: 'Critical' },
        ],
      },
      {
        id: 'immediateAction',
        name: 'immediateAction',
        type: 'textarea',
        label: 'Immediate Action Taken',
        value: initialValues?.immediateAction || '',
        required: true,
        placeholder: 'What immediate actions were taken to contain the issue?',
      },
      {
        id: 'rootCause',
        name: 'rootCause',
        type: 'textarea',
        label: 'Root Cause Analysis (Optional)',
        value: initialValues?.rootCause || '',
        placeholder: 'Initial root cause analysis...',
      },
    ],
    CAPA: [
      {
        id: 'subject',
        name: 'subject',
        type: 'text',
        label: 'CAPA Subject',
        value: initialValues?.subject || '',
        required: true,
        placeholder: 'Brief description of the corrective/preventive action...',
      },
      {
        id: 'capaType',
        name: 'capaType',
        type: 'select',
        label: 'CAPA Type',
        value: initialValues?.capaType || 'Corrective Action',
        required: true,
        options: [
          { label: 'Corrective Action', value: 'Corrective Action' },
          { label: 'Preventive Action', value: 'Preventive Action' },
        ],
      },
      {
        id: 'priority',
        name: 'priority',
        type: 'select',
        label: 'Priority',
        value: initialValues?.priority || 'Medium',
        required: true,
        options: [
          { label: 'Low', value: 'Low' },
          { label: 'Medium', value: 'Medium' },
          { label: 'High', value: 'High' },
          { label: 'Critical', value: 'Critical' },
        ],
      },
      {
        id: 'rootCause',
        name: 'rootCause',
        type: 'textarea',
        label: 'Root Cause Analysis',
        value: initialValues?.rootCause || '',
        placeholder: 'Why did this issue occur?',
      },
      {
        id: 'actionPlan',
        name: 'actionPlan',
        type: 'textarea',
        label: 'Action Plan',
        value: initialValues?.actionPlan || '',
        required: true,
        placeholder: 'Step-by-step plan to address the issue...',
      },
      {
        id: 'targetDate',
        name: 'targetDate',
        type: 'date',
        label: 'Target Completion Date',
        value: initialValues?.targetDate || '',
        required: true,
      },
    ],
    INCIDENT: [
      {
        id: 'type',
        name: 'type',
        type: 'select',
        label: 'Incident Type',
        value: initialValues?.type || 'NEAR_MISS',
        required: true,
        options: [
          { label: 'Near Miss', value: 'NEAR_MISS' },
          { label: 'First Aid', value: 'FIRST_AID' },
          { label: 'Medical Treatment', value: 'MEDICAL_TREATMENT' },
          { label: 'Lost Time', value: 'LOST_TIME' },
          { label: 'Fatality', value: 'FATALITY' },
          { label: 'Property Damage', value: 'PROPERTY_DAMAGE' },
          { label: 'Environmental Release', value: 'ENVIRONMENTAL_RELEASE' },
        ],
      },
      {
        id: 'severity',
        name: 'severity',
        type: 'select',
        label: 'Severity',
        value: initialValues?.severity || 'LOW',
        required: true,
        options: [
          { label: 'Low', value: 'LOW' },
          { label: 'Medium', value: 'MEDIUM' },
          { label: 'High', value: 'HIGH' },
          { label: 'Critical', value: 'CRITICAL' },
        ],
      },
      {
        id: 'title',
        name: 'title',
        type: 'text',
        label: 'Title',
        value: initialValues?.title || '',
        required: true,
        placeholder: 'Brief title of the incident...',
      },
      {
        id: 'description',
        name: 'description',
        type: 'textarea',
        label: 'Description',
        value: initialValues?.description || '',
        required: true,
        placeholder: 'Detailed description of what happened...',
      },
      {
        id: 'location',
        name: 'location',
        type: 'text',
        label: 'Location',
        value: initialValues?.location || '',
        required: true,
        placeholder: 'Where did the incident occur?',
      },
      {
        id: 'occurredAt',
        name: 'occurredAt',
        type: 'date',
        label: 'Occurred At',
        value: initialValues?.occurredAt || '',
        required: true,
      },
    ],
    INSPECTION: [
      {
        id: 'title',
        name: 'title',
        type: 'text',
        label: 'Inspection Title',
        value: initialValues?.title || '',
        required: true,
        placeholder: 'Title of the inspection...',
      },
      {
        id: 'type',
        name: 'type',
        type: 'select',
        label: 'Inspection Type',
        value: initialValues?.type || 'Internal Audit',
        required: true,
        options: [
          { label: 'Internal Audit', value: 'Internal Audit' },
          { label: 'External Audit', value: 'External Audit' },
          { label: 'Safety Inspection', value: 'Safety Inspection' },
          { label: 'Compliance Inspection', value: 'Compliance Inspection' },
        ],
      },
      {
        id: 'scheduledDate',
        name: 'scheduledDate',
        type: 'date',
        label: 'Scheduled Date',
        value: initialValues?.scheduledDate || '',
        required: true,
      },
      {
        id: 'inspector',
        name: 'inspector',
        type: 'email',
        label: 'Inspector',
        value: initialValues?.inspector || '',
        required: true,
        placeholder: 'inspector@example.com',
      },
      {
        id: 'location',
        name: 'location',
        type: 'text',
        label: 'Location',
        value: initialValues?.location || '',
        required: true,
        placeholder: 'Location to be inspected...',
      },
    ],
    TRAINING: [
      {
        id: 'programName',
        name: 'programName',
        type: 'text',
        label: 'Training Program Name',
        value: initialValues?.programName || '',
        required: true,
        placeholder: 'Name of the training program...',
      },
      {
        id: 'type',
        name: 'type',
        type: 'select',
        label: 'Training Type',
        value: initialValues?.type || 'Safety',
        required: true,
        options: [
          { label: 'Safety', value: 'Safety' },
          { label: 'Compliance', value: 'Compliance' },
          { label: 'Technical', value: 'Technical' },
          { label: 'Management', value: 'Management' },
        ],
      },
      {
        id: 'scheduledDate',
        name: 'scheduledDate',
        type: 'date',
        label: 'Scheduled Date',
        value: initialValues?.scheduledDate || '',
        required: true,
      },
      {
        id: 'duration',
        name: 'duration',
        type: 'number',
        label: 'Duration (hours)',
        value: initialValues?.duration || '',
        required: true,
        placeholder: '2',
      },
      {
        id: 'instructor',
        name: 'instructor',
        type: 'email',
        label: 'Instructor',
        value: initialValues?.instructor || '',
        required: true,
        placeholder: 'instructor@example.com',
      },
    ],
  }

  return baseFields[formType] || []
}

/**
 * Create detection context for common scenarios
 */
export function createDetectionContext(
  formType: AdvancedDetectionContext['formType'],
  moduleId: string,
  options?: {
    relatedEntityId?: string
    relatedEntityType?: string
    location?: string
    department?: string
    userRole?: string
    tenantId?: string
    previousForms?: Array<Record<string, any>>
    language?: string
    region?: string
  }
): AdvancedDetectionContext {
  return {
    formType,
    moduleId,
    relatedEntityId: options?.relatedEntityId,
    relatedEntityType: options?.relatedEntityType,
    location: options?.location,
    department: options?.department,
    userRole: options?.userRole || 'USER',
    tenantId: options?.tenantId || 'default-tenant',
    previousForms: options?.previousForms,
    language: options?.language || 'en',
    region: options?.region || 'SA',
  }
}

/**
 * Quick helper to create form ID
 */
export function createFormId(prefix: string): string {
  return `${prefix}-form-${Date.now()}`
}











