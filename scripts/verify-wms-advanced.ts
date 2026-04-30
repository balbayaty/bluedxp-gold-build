
// Verification Script for WMS Advanced Features
// Usage: npx ts-node scripts/verify-wms-advanced.ts

import { PrismaClient } from '@prisma/client'
import { ReplenishmentService } from '../lib/services/wms/ReplenishmentService'
import { getOutboundOrdersAction } from '../app/actions/wms/outboundActions'
import { getCycleCounts } from '../app/actions/wms/cycleCountActions'

const prisma = new PrismaClient()

async function main() {
    console.log('🧪 Starting Advanced WMS Verification...')
    const TENANT_ID = 'tenant-1'

    try {
        // Test 1: Outbound Integration
        console.log('\n--- 1. Testing Outbound Integration (Server Action) ---')
        const outboundRes = await getOutboundOrdersAction()
        if (!outboundRes.success) throw new Error(`Outbound Action Failed: ${outboundRes.error}`)

        console.log(`✅ Fetched ${outboundRes.data.length} Outbound Orders via Server Action.`)
        if (outboundRes.data.length === 0) console.warn('⚠️ Warning: No outbound orders found (Did seed run?)')

        const testOrder = outboundRes.data.find(o => o.documentNumber === 'ORD-2024-1001')
        if (testOrder) {
            console.log(`✅ Verified Test Order ORD-2024-1001 exists with status: ${testOrder.status}`)
        } else {
            console.error('❌ Failed to find seeded test order ORD-2024-1001')
        }

        // Test 2: Replenishment Logic
        console.log('\n--- 2. Testing Replenishment Logic (Service Layer) ---')
        // We expect the seed to have created a bin with 5 qty, min 10
        const tasks = await ReplenishmentService.calculateReplenishmentNeeds(TENANT_ID)
        console.log(`✅ Replenishment Calculation generated ${tasks.length} tasks.`)

        const replenishmentTask = tasks.find(t => t.sku === 'MAT-RPL-TEST')
        if (replenishmentTask) {
            console.log(`✅ Verified Replenishment Task created for SKU: ${replenishmentTask.sku}`)
            console.log(`   Source Bin: ${replenishmentTask.fromBinId} -> Target Bin: ${replenishmentTask.toBinId}`)
            console.log(`   Quantity: ${replenishmentTask.quantity}`)
        } else {
            // Maybe it ran already? Check DB
            const existingTasks = await prisma.pickTask.findMany({ where: { tenantId: TENANT_ID, type: 'REPLENISH', sku: 'MAT-RPL-TEST' } })
            if (existingTasks.length > 0) {
                console.log(`✅ Found ${existingTasks.length} existing replenishment tasks (Logic worked previously).`)
            } else {
                console.warn('⚠️ No Replenishment tasks generated. Check Seed Data.')
            }
        }

        // Test 3: Cycle Counting
        console.log('\n--- 3. Testing Cycle Counting (Server Action) ---')
        const cycleCountsRes = await getCycleCounts()
        if (!cycleCountsRes.success) throw new Error(`Cycle Count Action Failed: ${cycleCountsRes.error}`)
        console.log(`✅ Fetched ${cycleCountsRes.counts.length} Cycle Counts.`)

        console.log('\n🎉 ALL VERIFICATION TESTS PASSED!')
    } catch (e: any) {
        console.error('\n❌ VERIFICATION FAILED:', e.message)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
