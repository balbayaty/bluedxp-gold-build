export interface TourStep {
  id: string
  title: string
  description: string
  icon: string
  target?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action?: () => void
  videoUrl?: string
  demoUrl?: string
  interactive?: boolean
  highlight?: string[]
}

export interface OnboardingPath {
  id: string
  name: string
  description: string
  role: string[]
  steps: TourStep[]
  estimatedTime: number
  icon: string
  color: string
  achievements: string[]
}

export interface ModuleShowcase {
  id: string
  name: string
  description: string
  category: string
  icon: string
  color: string
  capabilities: string[]
  features: string[]
  integrations: string[]
  metrics: {
    users: number
    efficiency: number
    satisfaction: number
  }
  demoUrl?: string
  videoUrl?: string
  tags: string[]
  status: 'active' | 'beta' | 'coming-soon'
}

export interface ValueMetric {
  label: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  change: number
  description: string
  icon?: string
}

export interface ComparisonFeature {
  feature: string
  category: string
  description?: string
  blueDXP: boolean | string
  sap: boolean | string
  oracle: boolean | string
  microsoft: boolean | string
  ibm: boolean | string
}

export interface OnboardingProgress {
  userId: string
  pathId: string
  currentStep: number
  completedSteps: string[]
  achievements: string[]
  startedAt: Date
  completedAt?: Date
  timeSpent: number
  score?: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: Date
  points: number
}

