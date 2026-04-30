/**
 * License Application Mock Data Generators
 * Generates comprehensive mock data for license application system
 */

import type {
  LicenseApplication,
  ApplicationDocument,
  GovernmentApplication,
  Consultant,
  LicenseJourney,
  TimelineEvent,
  LicenseType,
} from '@/types/license-application'

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

export const mockConsultants: Consultant[] = [
  {
    id: 'consultant-1',
    name: 'Ahmed Al-Salamah',
    company: 'Salamah Safety Consultants',
    type: 'SAFETY',
    specialties: ['Civil Defense', 'Chemical Safety', 'Storage Planning'],
    serviceAreas: ['Riyadh', 'Jeddah', 'Dammam'],
    rating: 4.8,
    totalJobs: 245,
    successRate: 96,
    averageResponseTime: 4,
    availability: 'AVAILABLE',
    pricing: {
      consultation: 500,
      documentPreparation: 1500,
      applicationSubmission: 800,
    },
    certifications: ['NEBOSH', 'OSHA', 'Civil Defense Certified'],
    languages: ['Arabic', 'English'],
  },
  {
    id: 'consultant-2',
    name: 'Mohammed Abaldy',
    company: 'Abaldy Regulatory Services',
    type: 'REGULATORY',
    specialties: ['SFDA', 'SABER', 'Customs'],
    serviceAreas: ['Riyadh', 'Jeddah'],
    rating: 4.9,
    totalJobs: 189,
    successRate: 98,
    averageResponseTime: 2,
    availability: 'AVAILABLE',
    pricing: {
      consultation: 600,
      documentPreparation: 2000,
      applicationSubmission: 1000,
    },
    certifications: ['SFDA Certified', 'SABER Expert', 'Customs Broker'],
    languages: ['Arabic', 'English'],
  },
  {
    id: 'consultant-3',
    name: 'Fatima Al-Zahra',
    company: 'Technical Compliance Solutions',
    type: 'TECHNICAL',
    specialties: ['Chemical Classification', 'MSDS Preparation', 'Testing'],
    serviceAreas: ['Riyadh', 'Dammam'],
    rating: 4.7,
    totalJobs: 156,
    successRate: 94,
    averageResponseTime: 6,
    availability: 'BUSY',
    pricing: {
      consultation: 400,
      documentPreparation: 1200,
      applicationSubmission: 600,
    },
    certifications: ['Chemical Engineer', 'GHS Expert'],
    languages: ['Arabic', 'English', 'French'],
  },
  {
    id: 'consultant-4',
    name: 'Khalid Al-Mansouri',
    company: 'Legal Compliance Advisors',
    type: 'LEGAL',
    specialties: ['Regulatory Compliance', 'Legal Documentation', 'Appeals'],
    serviceAreas: ['Riyadh', 'Jeddah', 'Dammam', 'Khobar'],
    rating: 4.6,
    totalJobs: 98,
    successRate: 92,
    averageResponseTime: 8,
    availability: 'AVAILABLE',
    pricing: {
      consultation: 700,
      documentPreparation: 1800,
      applicationSubmission: 1200,
    },
    certifications: ['Law Degree', 'Regulatory Law Specialist'],
    languages: ['Arabic', 'English'],
  },
]

export const mockProducts = [
  {
    id: 'product-1',
    name: 'Sodium Hydroxide (NaOH)',
    category: 'CHEMICALS',
    chemicalName: 'Sodium Hydroxide',
    casNumber: '1310-73-2',
    unNumber: '1823',
    hazardClass: 'CORROSIVE',
    concentration: 50,
  },
  {
    id: 'product-2',
    name: 'Ethanol 96%',
    category: 'CHEMICALS',
    chemicalName: 'Ethanol',
    casNumber: '64-17-5',
    unNumber: '1170',
    hazardClass: 'FLAMMABLE',
    concentration: 96,
  },
  {
    id: 'product-3',
    name: 'Food Additive E300',
    category: 'FOOD',
    chemicalName: 'Ascorbic Acid',
    casNumber: '50-81-7',
    hazardClass: 'NON_HAZARDOUS',
  },
  {
    id: 'product-4',
    name: 'Hydrochloric Acid (HCl)',
    category: 'CHEMICALS',
    chemicalName: 'Hydrochloric Acid',
    casNumber: '7647-01-0',
    unNumber: '1789',
    hazardClass: 'CORROSIVE',
    concentration: 37,
  },
  {
    id: 'product-5',
    name: 'Acetone',
    category: 'CHEMICALS',
    chemicalName: 'Acetone',
    casNumber: '67-64-1',
    unNumber: '1090',
    hazardClass: 'FLAMMABLE',
    concentration: 99,
  },
]

export function generateMockLicenseApplication(productId?: string): LicenseApplication {
  const product = productId 
    ? mockProducts.find(p => p.id === productId) || mockProducts[0]
    : mockProducts[Math.floor(Math.random() * mockProducts.length)]

  const licenseTypes: ('CIVIL_DEFENSE_CHEMICAL' | 'SFDA_FOOD' | 'SABER_CERTIFICATE')[] = []
  
  if (product.category === 'CHEMICALS') {
    licenseTypes.push('CIVIL_DEFENSE_CHEMICAL')
    licenseTypes.push('SABER_CERTIFICATE')
  } else if (product.category === 'FOOD') {
    licenseTypes.push('SFDA_FOOD')
    licenseTypes.push('SABER_CERTIFICATE')
  }

  const documents: ApplicationDocument[] = [
    {
      id: generateId('doc'),
      type: 'MSDS',
      name: `${product.name} - Material Safety Data Sheet`,
      source: 'AUTO_PULLED',
      status: 'AVAILABLE',
      url: '/documents/msds-sample.pdf',
      validatedAt: new Date().toISOString(),
    },
    {
      id: generateId('doc'),
      type: 'Storage Plan',
      name: 'Storage Plan for Hazardous Materials',
      source: 'AUTO_PULLED',
      status: 'AVAILABLE',
      url: '/documents/storage-plan.pdf',
    },
    {
      id: generateId('doc'),
      type: 'Safety Certificate',
      name: 'Facility Safety Certificate',
      source: 'AUTO_PULLED',
      status: 'AVAILABLE',
      url: '/documents/safety-cert.pdf',
    },
    {
      id: generateId('doc'),
      type: 'Fire Safety Plan',
      name: 'Fire Safety and Emergency Response Plan',
      source: 'GENERATED',
      status: 'VALIDATED',
      url: '/documents/fire-safety-plan.pdf',
    },
  ]

  // Add additional documents based on hazard class
  if (product.hazardClass === 'FLAMMABLE') {
    documents.push({
      id: generateId('doc'),
      type: 'Fire Prevention Certificate',
      name: 'Fire Prevention and Ventilation Certificate',
      source: 'AUTO_PULLED',
      status: 'AVAILABLE',
      url: '/documents/fire-prevention.pdf',
    })
  }

  if (product.hazardClass === 'TOXIC' || product.hazardClass === 'CORROSIVE') {
    documents.push({
      id: generateId('doc'),
      type: 'Medical Emergency Plan',
      name: 'Medical Emergency Response Plan',
      source: 'GENERATED',
      status: 'VALIDATED',
      url: '/documents/medical-emergency.pdf',
    })
  }

  const applications: GovernmentApplication[] = licenseTypes.map(type => ({
    id: generateId('app'),
    platform: type === 'CIVIL_DEFENSE_CHEMICAL' ? 'CIVIL_DEFENSE' : 
              type === 'SFDA_FOOD' ? 'SFDA' : 'SABER',
    applicationId: `${type}-${Date.now()}`,
    status: 'SUBMITTED',
    submittedAt: new Date().toISOString(),
    estimatedCompletion: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  }))

  return {
    id: generateId('license-app'),
    productId: product.id,
    productName: product.name,
    productCategory: product.category,
    chemicalName: product.chemicalName,
    casNumber: product.casNumber,
    unNumber: product.unNumber,
    hazardClass: product.hazardClass,
    licenseTypes,
    status: 'IN_PROGRESS',
    documents,
    applications,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function generateMockLicenseJourney(applicationId: string): LicenseJourney {
  const timeline: TimelineEvent[] = [
    {
      id: generateId('event'),
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'DOCUMENT_ADDED',
      title: 'Documents Auto-Pulled',
      description: '4 documents automatically retrieved from system',
      icon: 'ri-file-download-line',
      color: 'text-blue-400',
    },
    {
      id: generateId('event'),
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'DOCUMENT_VALIDATED',
      title: 'Documents Validated',
      description: 'All documents validated and ready',
      icon: 'ri-checkbox-circle-line',
      color: 'text-green-400',
    },
    {
      id: generateId('event'),
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'CONSULTANT_ASSIGNED',
      title: 'Consultant Assigned',
      description: 'Ahmed Al-Salamah assigned to application',
      icon: 'ri-user-star-line',
      color: 'text-purple-400',
    },
    {
      id: generateId('event'),
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'APPLICATION_SUBMITTED',
      title: 'Applications Submitted',
      description: 'Submitted to Civil Defense and SABER platforms',
      icon: 'ri-send-plane-line',
      color: 'text-cyan-400',
    },
    {
      id: generateId('event'),
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'STATUS_UPDATE',
      title: 'Under Review',
      description: 'Applications are being reviewed by authorities',
      icon: 'ri-time-line',
      color: 'text-yellow-400',
    },
  ]

  return {
    applicationId,
    currentStep: 4,
    totalSteps: 6,
    steps: [
      { 
        id: '1', 
        name: 'Product Analysis', 
        status: 'COMPLETED', 
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDuration: 1,
      },
      { 
        id: '2', 
        name: 'Document Collection', 
        status: 'COMPLETED', 
        completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDuration: 2,
      },
      { 
        id: '3', 
        name: 'Consultant Assignment', 
        status: 'COMPLETED', 
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDuration: 1,
      },
      { 
        id: '4', 
        name: 'Application Submission', 
        status: 'COMPLETED', 
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDuration: 1,
      },
      { 
        id: '5', 
        name: 'Government Review', 
        status: 'IN_PROGRESS',
        estimatedDuration: 14,
      },
      { 
        id: '6', 
        name: 'License Issuance', 
        status: 'PENDING',
        estimatedDuration: 3,
      },
    ],
    timeline,
    estimatedCompletion: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    documentsStatus: {
      required: 6,
      available: 4,
      missing: 0,
      validated: 4,
    },
    consultantStatus: {
      assigned: true,
      consultantName: 'Ahmed Al-Salamah',
      progress: 75,
    },
    governmentStatus: {
      civilDefense: {
        status: 'UNDER_REVIEW',
        lastUpdated: new Date().toISOString(),
        nextAction: 'Inspection scheduling',
        estimatedDays: 10,
      },
      saber: {
        status: 'UNDER_REVIEW',
        lastUpdated: new Date().toISOString(),
        nextAction: 'Document verification',
        estimatedDays: 7,
      },
    },
  }
}

