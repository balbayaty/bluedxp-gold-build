# Hazalyze ASN Module - Architecture Guide

## 🏗️ Architecture Overview

This document outlines the bulletproof architecture for the Hazalyze ASN Module, ensuring scalability, maintainability, and type safety.

## 📐 Core Principles

### 1. **Separation of Concerns**
- **Client Components** (`'use client'`) - UI, interactivity, client-side state
- **Server Components** (default) - Data fetching, server-side rendering
- **Server Actions** - Mutations, form submissions, server-side operations
- **API Routes** - RESTful endpoints, external integrations
- **Services** - Business logic, data access (server-only)
- **Types** - Shared type definitions

### 2. **Data Flow Architecture**

```
Client Component
    ↓
Server Action / API Route
    ↓
Service Layer
    ↓
Prisma Client (Database)
```

### 3. **Never Mix Client and Server Code**

❌ **WRONG:**
```typescript
// ❌ Client component importing service that uses Prisma
'use client'
import { chemicalService } from '@/lib/services/chemical/chemicalService'
```

✅ **RIGHT:**
```typescript
// ✅ Client component using server action
'use client'
import { getChemicals } from '@/app/actions/chemical/actions'

// ✅ Server action calling service
'use server'
import { chemicalService } from '@/lib/services/chemical/chemicalService'
```

## 🗂️ Directory Structure

```
app/
├── (routes)/              # Route groups
│   ├── page.tsx          # Server Component (default)
│   └── layout.tsx         # Layout Component
├── actions/               # Server Actions (Next.js 14)
│   ├── chemical/
│   │   └── actions.ts    # Server actions for chemicals
│   └── warehouse/
│       └── actions.ts    # Server actions for warehouses
└── api/                   # API Routes (REST endpoints)
    ├── chemical/
    │   └── route.ts      # GET /api/chemical
    └── warehouse/
        └── route.ts      # GET /api/warehouse

components/
├── client/                # Client Components (explicit)
│   ├── ChemicalList.tsx
│   └── WarehouseForm.tsx
└── server/                # Server Components (optional grouping)
    └── ChemicalCard.tsx

lib/
├── services/              # Business Logic (SERVER-ONLY)
│   ├── chemical/
│   │   └── chemicalService.ts
│   └── warehouse/
│       └── warehouseService.ts
├── actions/               # Server Actions (re-exported from app/actions)
│   └── index.ts
├── utils/                 # Utility functions (client-safe)
│   ├── formatters.ts
│   └── validators.ts
└── types/                 # Type definitions
    ├── chemical.ts
    └── warehouse.ts

contexts/                  # React Context (client-only)
├── AuthContext.tsx
└── CustomerContext.tsx

hooks/                      # Custom React Hooks (client-only)
├── useChemical.ts
└── useWarehouse.ts
```

## 🔒 Server-Only Code Protection

### Services Must Be Server-Only

All services that use Prisma MUST:
1. Be in `lib/services/`
2. Never be imported by client components
3. Only be used by:
   - Server Actions
   - API Routes
   - Server Components (for data fetching)

### Service Pattern

```typescript
// lib/services/chemical/chemicalService.ts
import { prisma } from '@/lib/services/database/prismaClient'
import type { Prisma } from '@prisma/client'

export class ChemicalService {
  // All methods are async and return typed data
  async getChemicals(filters?: ChemicalFilters): Promise<Chemical[]> {
    // Use Prisma here - this is safe because it's server-only
    return await prisma.chemical.findMany({
      where: this.buildWhereClause(filters),
    })
  }
  
  private buildWhereClause(filters?: ChemicalFilters): Prisma.ChemicalWhereInput {
    // Type-safe query building
  }
}

// Singleton export
export const chemicalService = new ChemicalService()
```

## 🎯 Server Actions Pattern

### Creating Server Actions

```typescript
// app/actions/chemical/actions.ts
'use server'

import { chemicalService } from '@/lib/services/chemical/chemicalService'
import { revalidatePath } from 'next/cache'

export type ActionResponse<T> = {
  success: boolean
  data?: T
  error?: string
}

export async function getChemicals(
  filters?: ChemicalFilters
): Promise<ActionResponse<Chemical[]>> {
  try {
    const chemicals = await chemicalService.getChemicals(filters)
    return { success: true, data: chemicals }
  } catch (error) {
    console.error('Error fetching chemicals:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function createChemical(
  data: CreateChemicalInput
): Promise<ActionResponse<Chemical>> {
  try {
    const chemical = await chemicalService.createChemical(data)
    revalidatePath('/chemicals')
    return { success: true, data: chemical }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create chemical'
    }
  }
}
```

### Using Server Actions in Client Components

```typescript
// components/client/ChemicalList.tsx
'use client'

import { useState, useEffect } from 'react'
import { getChemicals } from '@/app/actions/chemical/actions'

export function ChemicalList() {
  const [chemicals, setChemicals] = useState<Chemical[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const result = await getChemicals()
      if (result.success && result.data) {
        setChemicals(result.data)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div>Loading...</div>
  return <div>{/* Render chemicals */}</div>
}
```

## 🌐 API Routes Pattern

### RESTful API Routes

```typescript
// app/api/chemical/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { chemicalService } from '@/lib/services/chemical/chemicalService'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filters = {
      search: searchParams.get('search') || undefined,
      // ... other filters
    }
    
    const chemicals = await chemicalService.getChemicals(filters)
    return NextResponse.json({ success: true, data: chemicals })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chemicals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const chemical = await chemicalService.createChemical(body)
    return NextResponse.json({ success: true, data: chemical }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create chemical' },
      { status: 500 }
    )
  }
}
```

## 🔄 Type Safety

### Shared Types

```typescript
// lib/types/chemical.ts
export interface Chemical {
  id: string
  name: string
  casNumber?: string
  // ... other fields
}

export interface ChemicalFilters {
  search?: string
  casNumber?: string
  manufacturer?: string
}

export interface CreateChemicalInput {
  name: string
  casNumber?: string
  // ... other fields
}
```

### Type-Safe Service Responses

```typescript
// Always use typed responses
type ServiceResponse<T> = {
  data: T
  error?: never
} | {
  data?: never
  error: string
}

export async function getChemical(id: string): Promise<ServiceResponse<Chemical>> {
  try {
    const chemical = await prisma.chemical.findUnique({ where: { id } })
    if (!chemical) {
      return { error: 'Chemical not found' }
    }
    return { data: chemical }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
```

## 🛡️ Error Handling

### Global Error Handler

```typescript
// lib/utils/errorHandler.ts
export function handleServiceError(error: unknown): string {
  if (error instanceof Error) {
    // Log to monitoring service
    console.error('Service error:', error)
    return error.message
  }
  return 'An unexpected error occurred'
}
```

### Error Boundaries

```typescript
// components/ErrorBoundary.tsx
'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>
    }
    return this.props.children
  }
}
```

## 🔐 Security Best Practices

1. **Never expose Prisma client to client**
   - All database access through server actions/API routes
   - Services are server-only

2. **Input Validation**
   - Use Zod for runtime validation
   - Validate in server actions before calling services

3. **Authentication & Authorization**
   - Check auth in server actions
   - Use middleware for route protection

4. **Rate Limiting**
   - Implement rate limiting on API routes
   - Use Next.js middleware

## 📊 State Management

### Client State
- **React State** - Component-level state
- **React Context** - Shared state across components
- **Zustand/Redux** - Global state (if needed)

### Server State
- **Server Components** - Direct data fetching
- **Server Actions** - Mutations
- **React Query/SWR** - Client-side caching (optional)

## 🧪 Testing Strategy

1. **Unit Tests** - Services, utilities
2. **Integration Tests** - Server actions, API routes
3. **E2E Tests** - Critical user flows
4. **Type Tests** - TypeScript ensures type safety

## 🚀 Performance Optimization

1. **Server Components** - Reduce client bundle size
2. **Streaming** - Use Suspense boundaries
3. **Caching** - Next.js caching strategies
4. **Code Splitting** - Dynamic imports for heavy components
5. **Image Optimization** - Next.js Image component

## 📝 Migration Checklist

When refactoring existing code:

- [ ] Identify client components importing services
- [ ] Create server actions for data fetching
- [ ] Move service calls to server actions
- [ ] Update client components to use server actions
- [ ] Add error handling
- [ ] Add loading states
- [ ] Add type safety
- [ ] Test thoroughly

## 🔗 Interconnectivity

### Module Communication

```typescript
// lib/utils/moduleInterconnectivity.ts
export function getChemicalLinks(chemicalId: string) {
  return {
    warehouse: `/warehouse?chemical=${chemicalId}`,
    msds: `/msds?chemical=${chemicalId}`,
    compliance: `/compliance?chemical=${chemicalId}`,
  }
}
```

### Event Bus for Cross-Module Communication

```typescript
// lib/services/event-bus/index.ts
export const eventBus = {
  emit(event: string, data: any) {
    // Emit event
  },
  on(event: string, handler: (data: any) => void) {
    // Subscribe to event
  }
}
```

## 📚 Additional Resources

- [Next.js 14 App Router Docs](https://nextjs.org/docs/app)
- [Server Actions Guide](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)





