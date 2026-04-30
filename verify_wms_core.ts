
// VERIFICATION SCRIPT
// Run with: npx ts-node verify_wms_core.ts

import { MaterialService } from './lib/services/wms/MaterialService'
import { InventoryService } from './lib/services/wms/InventoryService'
import { prisma } from './lib/database/prismaClient'

async function main() {
    console.log('🧪 Starting WMS Core Verification...')
    const tenantId = 'tenant-1' // Default test tenant

    // 1. Create a Material
    console.log('1️⃣ Creating Material Master...')
    const material = await MaterialService.upsertMaterial({
        tenantId,
        materialNumber: 'TEST-SKU-001',
        description: 'Test High Value Widget',
        standardPrice: 100.00, // $100 per unit
        currency: 'USD',
        isHazardous: true,
        baseUnit: 'EA'
    })
    console.log('✅ Material Created:', material.materialNumber)

    // 2. Create a Bin (if not exists)
    console.log('2️⃣ Ensuring Storage Bin...')
    // Quick hack to ensure a bin exists for test
    const zone = await prisma.warehouseZone.findFirst({ where: { tenantId } }) ||
        await prisma.warehouseZone.create({
            data: {
                warehouse: { create: { tenantId, code: 'WH1', name: 'Main', type: 'Distribution' } },
                code: 'Z1', name: 'Zone 1', type: 'STORAGE'
            }
        })

    const bin = await prisma.storageBin.create({
        data: {
            zoneId: zone.id,
            code: `BIN-${Date.now()}`,
            aisle: '01', rack: '01', level: '01', position: '01',
            xCoord: 0, yCoord: 0, zCoord: 0,
            width: 100, height: 100, depth: 100,
            maxWeight: 1000
        }
    })
    console.log('✅ Bin Created:', bin.code)

    // 3. Add Stock
    console.log('3️⃣ Initializing Stock...')
    await InventoryService.initializeStock(tenantId, material.materialNumber, 50, bin.id)
    console.log('✅ Stock Added: 50 Units')

    // 4. Read Verification (The "Valuation" Test)
    console.log('4️⃣ verifying Valuation Logic...')
    const overview = await InventoryService.getInventoryOverview(tenantId)
    const item = overview.find(i => i.quant.sku === material.materialNumber)

    if (item) {
        console.log(`   Found SKU: ${item.quant.sku}`)
        console.log(`   Quantity: ${item.quant.quantity}`)
        console.log(`   Unit Price: ${item.material?.standardPrice}`)
        console.log(`   Total Valuation: ${item.valuation}`)

        if (item.valuation === 5000) {
            console.log('✅ SUCCESS: Valuation is correct (50 * 100 = 5000)')
        } else {
            console.error('❌ FAILURE: Valuation mismatch')
        }
    } else {
        console.error('❌ FAILURE: Item not found in overview')
    }

    // Cleanup
    console.log('🧹 Cleaning up...')
    await prisma.inventoryQuant.deleteMany({ where: { sku: 'TEST-SKU-001' } })
    await prisma.materialMaster.deleteMany({ where: { materialNumber: 'TEST-SKU-001' } })
    await prisma.storageBin.delete({ where: { id: bin.id } })
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
