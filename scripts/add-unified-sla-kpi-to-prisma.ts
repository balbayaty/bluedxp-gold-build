/**
 * Script to add Unified SLA/KPI schema to Prisma schema.prisma
 * 
 * Run: npx tsx scripts/add-unified-sla-kpi-to-prisma.ts
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma')

// Read current schema
const schema = readFileSync(schemaPath, 'utf-8')

// Check if schema already exists
if (schema.includes('model SupplyChainSLA')) {
  console.log('✅ Unified SLA/KPI schema already exists in schema.prisma')
  process.exit(0)
}

// Add the new models
const newModels = `
// ============================================================================
// UNIFIED SLA/KPI SERVICE - Multi-Party Supply Chain SLA/KPI Framework
// ============================================================================
// Based on types/supplyChainSLA.ts
// Global standards compliant (SCOR, ISO, APICS/ASCM)

model SupplyChainSLA {
  id                    String   @id @default(uuid())
  tenantId              String
  name                  String
  description           String?
  partyType             String   // CARRIER, WAREHOUSE, CUSTOMS_BROKER, etc.
  partyId               String
  partyName             String
  partyRole             String   // PROVIDER, CONSUMER, etc.
  serviceCategory       String   // TRANSPORTATION, INBOUND_LOGISTICS, etc.
  serviceType           String   // On-Time Delivery, Dock-to-Stock, etc.
  targetDuration        Int      // seconds
  warningThreshold      Int      // percentage
  criticalThreshold     Int      // percentage
  metric                String   // duration, percentage, count
  customFormula         String?
  conditions            Json?
  dependencies          String[]  @default([])
  prerequisites         String[]  @default([])
  responsibleParty      String
  responsiblePartyId    String
  accountableParty      String?
  accountablePartyId    String?
  performanceTier       String?
  tierTarget            Int?
  escalationRules       Json?
  isActive              Boolean  @default(true)
  isTemplate            Boolean  @default(false)
  templateId            String?
  version               String?
  effectiveDate         DateTime?
  expiryDate            DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  createdBy             String?
  updatedBy              String?

  // Relations
  complianceResults     SupplyChainSLACompliance[]

  @@index([tenantId])
  @@index([partyType, partyId])
  @@index([serviceCategory])
  @@index([isActive])
  @@map("SupplyChainSLA")
}

model SupplyChainKPI {
  id                    String   @id @default(uuid())
  tenantId              String
  name                  String
  description           String?
  partyType             String
  partyId               String
  partyName             String
  partyRole             String
  formula               String
  target                Decimal  @db.Decimal(18, 2)
  unit                  String
  category              String   // performance, efficiency, compliance, etc.
  calculationMethod     String   // REAL_TIME, BATCH, EVENT_DRIVEN
  calculationFrequency  String?
  aggregationMethod     String?
  conditions            Json?
  filters               Json?
  responsibleParty      String
  responsiblePartyId    String
  accountableParty      String?
  accountablePartyId    String?
  industryBenchmark     Decimal? @db.Decimal(18, 2)
  bestInClass           Decimal? @db.Decimal(18, 2)
  baseline              Decimal? @db.Decimal(18, 2)
  isActive              Boolean  @default(true)
  isTemplate            Boolean  @default(false)
  templateId            String?
  version               String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  createdBy             String?
  updatedBy              String?

  // Relations
  results               SupplyChainKPIResult[]

  @@index([tenantId])
  @@index([partyType, partyId])
  @@index([category])
  @@index([isActive])
  @@map("SupplyChainKPI")
}

model SupplyChainSLACompliance {
  id                    String   @id @default(uuid())
  slaId                 String
  tenantId              String
  slaName               String
  partyType             String
  partyId               String
  partyName             String
  transactionId         String
  transactionType       String
  targetDuration        Int      // seconds
  actualDuration        Int      // seconds
  compliancePercentage  Decimal  @db.Decimal(5, 2)
  status                String   // MET, WARNING, CRITICAL, BREACH
  startTime             DateTime
  endTime               DateTime?
  targetEndTime         DateTime
  actualEndTime         DateTime?
  breachReason          String?
  breachDetails         Json?
  remediationActions    String[]  @default([])
  dependentSLAs         String[]  @default([])
  prerequisiteSLAs      String[]  @default([])
  calculatedAt          DateTime  @default(now())

  // Relations
  sla                   SupplyChainSLA @relation(fields: [slaId], references: [id], onDelete: Cascade)

  @@index([slaId])
  @@index([transactionId])
  @@index([partyType, partyId])
  @@index([status])
  @@index([calculatedAt])
  @@index([tenantId])
  @@map("SupplyChainSLACompliance")
}

model SupplyChainKPIResult {
  id                    String   @id @default(uuid())
  kpiId                 String
  tenantId              String
  kpiName               String
  partyType             String
  partyId               String
  partyName             String
  value                 Decimal  @db.Decimal(18, 2)
  target                Decimal  @db.Decimal(18, 2)
  unit                  String
  status                String   // MET, WARNING, CRITICAL, BELOW_TARGET
  vsBaseline            Decimal? @db.Decimal(18, 2)
  vsIndustryBenchmark   Decimal? @db.Decimal(18, 2)
  vsBestInClass         Decimal? @db.Decimal(18, 2)
  periodStart           DateTime
  periodEnd             DateTime
  calculatedAt          DateTime  @default(now())

  // Relations
  kpi                   SupplyChainKPI @relation(fields: [kpiId], references: [id], onDelete: Cascade)

  @@index([kpiId])
  @@index([partyType, partyId])
  @@index([status])
  @@index([periodStart, periodEnd])
  @@index([tenantId])
  @@map("SupplyChainKPIResult")
}
`

// Append to schema
const updatedSchema = schema + newModels

// Write back
writeFileSync(schemaPath, updatedSchema, 'utf-8')

console.log('✅ Successfully added Unified SLA/KPI schema to schema.prisma')
console.log('📝 Next steps:')
console.log('   1. Run: npx prisma format')
console.log('   2. Run: npx prisma generate')
console.log('   3. Run: npx prisma migrate dev --name add_unified_sla_kpi')


